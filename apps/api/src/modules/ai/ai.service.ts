import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@ours/database';
import { AiPort, AI_PORT } from './ai.port';
import {
  AiDatePlanProposalDto,
  AiDateRecommendationDto,
  AiRelationshipInsightDto,
  AiPlanRequestDto,
} from '@ours/contracts';

import { DurableStore } from '../../common/persistence/durable-store';

@Injectable()
export class AiService {
  // Couple-space AI consent store: coupleSpaceId -> { id: spaceId, enabled: boolean }
  private consentStore = new DurableStore<{ id: string; enabled: boolean }>('ai_consent');

  // Rate limiter: coupleSpaceId -> array of timestamps
  private rateLimitMap = new Map<string, number[]>();

  constructor(
    @Inject(AI_PORT) private readonly aiPort: AiPort,
    private readonly prisma: PrismaService,
  ) {}

  private checkRateLimit(coupleSpaceId: string): void {
    const now = Date.now();
    const windowMs = 60 * 60 * 1000; // 1 hour
    const maxRequests = 20;

    let timestamps = this.rateLimitMap.get(coupleSpaceId) || [];
    timestamps = timestamps.filter((t) => now - t < windowMs);

    if (timestamps.length >= maxRequests) {
      throw new BadRequestException('Hourly AI request limit reached for this space. Please try again later.');
    }

    timestamps.push(now);
    this.rateLimitMap.set(coupleSpaceId, timestamps);
  }

  isConsentEnabled(coupleSpaceId: string): boolean {
    const record = this.consentStore.get(coupleSpaceId);
    return record ? record.enabled : true;
  }

  setConsent(coupleSpaceId: string, enabled: boolean): { enabled: boolean } {
    this.consentStore.set(coupleSpaceId, { id: coupleSpaceId, enabled });
    return { enabled };
  }

  async planDate(coupleSpaceId: string, dto: AiPlanRequestDto): Promise<AiDatePlanProposalDto> {
    if (!dto.prompt?.trim()) {
      throw new BadRequestException('A date description or prompt is required');
    }

    this.checkRateLimit(coupleSpaceId);

    return this.aiPort.generatePlanProposal(
      dto.prompt.trim(),
      dto.budgetMinorUnits,
      dto.category,
    );
  }

  async getRecommendations(coupleSpaceId: string): Promise<AiDateRecommendationDto[]> {
    this.checkRateLimit(coupleSpaceId);

    // Retrieve past visits and saved places to ground recommendations
    const visits = await this.prisma.visit.findMany({
      where: { coupleSpaceId },
      include: { place: true },
      take: 5,
    });

    const categories: string[] = Array.from(
      new Set(
        visits
          .map((v: any) => v.place?.category)
          .filter((c: unknown): c is string => typeof c === 'string' && c.length > 0),
      ),
    );

    const visitedPlaceNames: string[] = visits
      .map((v: any) => v.place?.name)
      .filter((n: unknown): n is string => typeof n === 'string' && n.length > 0);

    return this.aiPort.generateRecommendations(
      categories.length > 0 ? categories : ['DINING', 'NATURE', 'CULTURE'],
      6000,
      visitedPlaceNames,
    );
  }

  async getInsights(coupleSpaceId: string): Promise<AiRelationshipInsightDto[]> {
    const space = await this.prisma.coupleSpace.findUnique({
      where: { id: coupleSpaceId },
    });

    const baseDate = space?.anniversaryDate || space?.createdAt || new Date();
    const daysTogether = Math.max(1, Math.floor((Date.now() - new Date(baseDate).getTime()) / (1000 * 60 * 60 * 24)));

    const visitsCount = await this.prisma.visit.count({
      where: { coupleSpaceId },
    });

    const datesCompletedCount = await this.prisma.datePlan.count({
      where: { coupleSpaceId, status: 'COMPLETED' },
    });

    const visits = await this.prisma.visit.findMany({
      where: { coupleSpaceId },
      include: { place: true },
    });

    const catCounts = new Map<string, number>();
    for (const v of visits) {
      if (v.place?.category) {
        catCounts.set(v.place.category, (catCounts.get(v.place.category) || 0) + 1);
      }
    }

    let topCategory: string | undefined = undefined;
    let maxC = 0;
    for (const [c, count] of catCounts.entries()) {
      if (count > maxC) {
        maxC = count;
        topCategory = c;
      }
    }

    return this.aiPort.generateRelationshipInsights({
      daysTogether,
      visitsCount,
      datesCompletedCount,
      topCategory,
    });
  }
}
