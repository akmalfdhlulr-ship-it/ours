import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@ours/database';
import { LoveLetterDto, CreateLoveLetterDto, UpdateLoveLetterDto } from '@ours/contracts';
import { randomUUID } from 'crypto';

interface StoredLetter {
  id: string;
  coupleSpaceId: string;
  authorId: string;
  recipientId: string;
  title: string;
  content: string;
  status: 'DRAFT' | 'SENT';
  sentAt?: Date;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

import { DurableStore } from '../../common/persistence/durable-store';

@Injectable()
export class LettersService {
  // Durable tenant-isolated store surviving restarts & offline fallback
  private letters = new DurableStore<StoredLetter>('love_letters');

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    try {
      await this.prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS love_letters (
          id UUID PRIMARY KEY,
          couple_space_id UUID NOT NULL,
          author_id UUID NOT NULL,
          recipient_id UUID,
          title VARCHAR(255) NOT NULL,
          content TEXT NOT NULL,
          status VARCHAR(20) NOT NULL DEFAULT 'SENT',
          sent_at TIMESTAMPTZ,
          read_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_love_letters_space ON love_letters(couple_space_id);
      `);
    } catch {}
  }

  private async hasPgTable(): Promise<boolean> {
    try {
      const res: any = await this.prisma.$queryRawUnsafe(
        `SELECT to_regclass('public.love_letters') as reg;`
      );
      return !!(res && res[0] && res[0].reg);
    } catch {
      return false;
    }
  }

  private async getPartnerId(coupleSpaceId: string, authorId: string): Promise<string> {
    const memberships = await this.prisma.coupleMembership.findMany({
      where: { coupleSpaceId },
    });
    const partner = memberships.find((m: any) => m.userId !== authorId);
    return partner ? partner.userId : authorId;
  }

  async list(coupleSpaceId: string, userId: string): Promise<LoveLetterDto[]> {
    if (await this.hasPgTable()) {
      try {
        const rows: any = await this.prisma.$queryRawUnsafe(
          `SELECT id, couple_space_id as "coupleSpaceId", author_id as "authorId",
                  recipient_id as "recipientId", title, content, status,
                  sent_at as "sentAt", read_at as "readAt",
                  created_at as "createdAt", updated_at as "updatedAt"
           FROM love_letters
           WHERE couple_space_id = $1::uuid
             AND (
               (author_id = $2::uuid)
               OR (status = 'SENT' AND (author_id != $2::uuid OR recipient_id = $2::uuid))
             )
           ORDER BY created_at DESC;`,
          coupleSpaceId,
          userId
        );
        return rows.map((r: any) => this.mapDto(r));
      } catch {
        // Fallback to durable local store if error
      }
    }

    const result: LoveLetterDto[] = [];
    for (const letter of this.letters.values()) {
      if (letter.coupleSpaceId !== coupleSpaceId) continue;

      // Author sees their own drafts & sent letters
      if (letter.authorId === userId) {
        result.push(this.mapDto(letter));
      }
      // Partner sees all SENT letters in this couple space
      else if (letter.status === 'SENT') {
        if (letter.recipientId !== userId) {
          letter.recipientId = userId;
        }
        result.push(this.mapDto(letter));
      }
    }

    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async create(coupleSpaceId: string, authorId: string, dto: CreateLoveLetterDto): Promise<LoveLetterDto> {
    if (!dto.title?.trim() || !dto.content?.trim()) {
      throw new BadRequestException('Letter title and content are required');
    }

    const recipientId = await this.getPartnerId(coupleSpaceId, authorId);
    const now = new Date();
    // Default to SENT unless explicitly requested as DRAFT
    const isDraft = dto.status === 'DRAFT';

    const letter: StoredLetter = {
      id: randomUUID(),
      coupleSpaceId,
      authorId,
      recipientId,
      title: dto.title.trim(),
      content: dto.content.trim(),
      status: isDraft ? 'DRAFT' : 'SENT',
      sentAt: !isDraft ? now : undefined,
      createdAt: now,
      updatedAt: now,
    };

    // Store in local durable store
    this.letters.set(letter.id, letter);

    // If PostgreSQL table exists, mirror to database
    if (await this.hasPgTable()) {
      try {
        await this.prisma.$executeRawUnsafe(
          `INSERT INTO love_letters (id, couple_space_id, author_id, recipient_id, title, content, status, sent_at, created_at, updated_at)
           VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5, $6, $7, $8, $9, $10)
           ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, content = EXCLUDED.content, status = EXCLUDED.status;`,
          letter.id,
          letter.coupleSpaceId,
          letter.authorId,
          letter.recipientId,
          letter.title,
          letter.content,
          letter.status,
          letter.sentAt || null,
          letter.createdAt,
          letter.updatedAt
        );
      } catch {
        // Fallback safely preserved
      }
    }

    return this.mapDto(letter);
  }

  async update(coupleSpaceId: string, authorId: string, id: string, dto: UpdateLoveLetterDto): Promise<LoveLetterDto> {
    const letter = this.letters.get(id);
    if (!letter || letter.coupleSpaceId !== coupleSpaceId) {
      throw new NotFoundException('Love letter not found');
    }

    if (letter.authorId !== authorId) {
      throw new ForbiddenException('Only the author can edit this letter');
    }

    if (letter.status === 'SENT') {
      throw new BadRequestException('Cannot edit a letter that has already been sent');
    }

    if (dto.title) letter.title = dto.title.trim();
    if (dto.content) letter.content = dto.content.trim();
    letter.updatedAt = new Date();
    this.letters.set(letter.id, letter);

    if (await this.hasPgTable()) {
      try {
        await this.prisma.$executeRawUnsafe(
          `UPDATE love_letters SET title = $1, content = $2, updated_at = NOW() WHERE id = $3::uuid;`,
          letter.title,
          letter.content,
          letter.id
        );
      } catch {}
    }

    return this.mapDto(letter);
  }

  async send(coupleSpaceId: string, authorId: string, id: string): Promise<LoveLetterDto> {
    const letter = this.letters.get(id);
    if (!letter || letter.coupleSpaceId !== coupleSpaceId) {
      throw new NotFoundException('Love letter not found');
    }

    if (letter.authorId !== authorId) {
      throw new ForbiddenException('Only the author can send this letter');
    }

    if (letter.status === 'SENT') {
      return this.mapDto(letter);
    }

    letter.status = 'SENT';
    letter.sentAt = new Date();
    letter.updatedAt = new Date();
    this.letters.set(letter.id, letter);

    if (await this.hasPgTable()) {
      try {
        await this.prisma.$executeRawUnsafe(
          `UPDATE love_letters SET status = 'SENT', sent_at = NOW(), updated_at = NOW() WHERE id = $1::uuid;`,
          letter.id
        );
      } catch {}
    }

    return this.mapDto(letter);
  }

  async get(coupleSpaceId: string, userId: string, id: string): Promise<LoveLetterDto> {
    let letter = this.letters.get(id);
    if (!letter && (await this.hasPgTable())) {
      try {
        const rows: any = await this.prisma.$queryRawUnsafe(
          `SELECT id, couple_space_id as "coupleSpaceId", author_id as "authorId",
                  recipient_id as "recipientId", title, content, status,
                  sent_at as "sentAt", read_at as "readAt",
                  created_at as "createdAt", updated_at as "updatedAt"
           FROM love_letters
           WHERE id = $1::uuid AND couple_space_id = $2::uuid;`,
          id,
          coupleSpaceId
        );
        if (rows && rows[0]) {
          letter = rows[0];
        }
      } catch {}
    }

    if (!letter || letter.coupleSpaceId !== coupleSpaceId) {
      throw new NotFoundException('Love letter not found');
    }

    const isAuthor = letter.authorId === userId;
    if (!isAuthor && letter.status !== 'SENT') {
      throw new ForbiddenException('Letter has not been sent yet');
    }

    // Mark readAt if partner opens for first time
    if (!isAuthor && !letter.readAt) {
      letter.readAt = new Date();
      letter.recipientId = userId;
      this.letters.set(letter.id, letter);

      if (await this.hasPgTable()) {
        try {
          await this.prisma.$executeRawUnsafe(
            `UPDATE love_letters SET read_at = NOW(), recipient_id = $1::uuid WHERE id = $2::uuid;`,
            userId,
            letter.id
          );
        } catch {}
      }
    }

    return this.mapDto(letter);
  }

  private mapDto(letter: StoredLetter): LoveLetterDto {
    return {
      id: letter.id,
      coupleSpaceId: letter.coupleSpaceId,
      authorId: letter.authorId,
      recipientId: letter.recipientId,
      title: letter.title,
      content: letter.content,
      status: letter.status,
      sentAt: letter.sentAt ? new Date(letter.sentAt).toISOString() : undefined,
      readAt: letter.readAt ? new Date(letter.readAt).toISOString() : undefined,
      createdAt: new Date(letter.createdAt).toISOString(),
      updatedAt: new Date(letter.updatedAt).toISOString(),
    };
  }
}
