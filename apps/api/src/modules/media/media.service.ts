import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@ours/database';
import {
  CompleteUploadRequest,
  MediaAssetItem,
  StorageUsageResponse,
  UploadSignatureRequest,
  UploadSignatureResponse,
} from '@ours/contracts';
import { STORAGE_PORT, StoragePort } from './storage.port';

export const MAX_QUOTA_BYTES = 15_000_000_000; // 15 GB decimal quota per approved product decision

@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(STORAGE_PORT) private readonly storagePort: StoragePort,
  ) {}

  async getUploadSignature(
    userId: string,
    spaceId: string,
    dto: UploadSignatureRequest,
  ): Promise<UploadSignatureResponse> {
    const space = await this.prisma.coupleSpace.findUnique({
      where: { id: spaceId },
    });

    if (!space) {
      throw new NotFoundException('Couple space not found');
    }

    if (Number(space.quotaUsedBytes) + dto.fileSizeBytes > MAX_QUOTA_BYTES) {
      throw new ForbiddenException('Kapasitas penyimpanan media pasangan telah mencapai batas maksimal (15 GB)');
    }

    const cleanFilename = dto.filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storageKey = `spaces/${spaceId}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}_${cleanFilename}`;

    // Record UPLOADING state
    await this.prisma.mediaAsset.create({
      data: {
        coupleSpaceId: spaceId,
        uploadedById: userId,
        storageKey,
        originalFilename: dto.filename,
        mimeType: dto.mimeType,
        fileSizeBytes: dto.fileSizeBytes,
        status: 'UPLOADING',
        quotaCounted: false,
        r2ObjectPresent: false,
      },
    });

    const signature = await this.storagePort.generateUploadSignature(
      storageKey,
      dto.mimeType,
    );

    return {
      uploadUrl: signature.uploadUrl,
      storageKey,
      uploadParams: signature.uploadParams,
    };
  }

  async completeUpload(
    userId: string,
    spaceId: string,
    dto: CompleteUploadRequest,
  ): Promise<MediaAssetItem> {
    const asset = await this.prisma.mediaAsset.findFirst({
      where: {
        storageKey: dto.storageKey,
        coupleSpaceId: spaceId,
      },
    });

    if (!asset) {
      throw new NotFoundException('Media asset not found');
    }

    const fileSizeBytes = dto.fileSizeBytes || asset.fileSizeBytes;

    // Transactionally activate asset and update space storage quota
    const updated = await this.prisma.$transaction(async (tx) => {
      const updatedAsset = await tx.mediaAsset.update({
        where: { id: asset.id },
        data: {
          status: 'ACTIVE',
          r2ObjectPresent: true,
          quotaCounted: true,
          fileSizeBytes,
          width: dto.width || null,
          height: dto.height || null,
        },
      });

      await tx.coupleSpace.update({
        where: { id: spaceId },
        data: {
          quotaUsedBytes: { increment: BigInt(fileSizeBytes) },
          physicalStorageBytes: { increment: BigInt(fileSizeBytes) },
        },
      });

      return updatedAsset;
    });

    return this.mapToItem(updated);
  }

  async listMedia(spaceId: string): Promise<MediaAssetItem[]> {
    const assets = await this.prisma.mediaAsset.findMany({
      where: {
        coupleSpaceId: spaceId,
        status: 'ACTIVE',
      },
      orderBy: { createdAt: 'desc' },
    });

    return Promise.all(assets.map((a) => this.mapToItem(a)));
  }

  async softDelete(spaceId: string, mediaId: string): Promise<{ success: boolean }> {
    const asset = await this.prisma.mediaAsset.findFirst({
      where: { id: mediaId, coupleSpaceId: spaceId },
    });

    if (!asset) {
      throw new NotFoundException('Media asset not found');
    }

    await this.prisma.mediaAsset.update({
      where: { id: mediaId },
      data: {
        status: 'DELETED',
        deletedAt: new Date(),
      },
    });

    return { success: true };
  }

  async restoreMedia(spaceId: string, mediaId: string): Promise<MediaAssetItem> {
    const asset = await this.prisma.mediaAsset.findFirst({
      where: { id: mediaId, coupleSpaceId: spaceId, status: 'DELETED' },
    });

    if (!asset) {
      throw new NotFoundException('Deleted media asset not found or expired');
    }

    const updated = await this.prisma.mediaAsset.update({
      where: { id: mediaId },
      data: {
        status: 'ACTIVE',
        deletedAt: null,
      },
    });

    return this.mapToItem(updated);
  }

  async getStorageUsage(spaceId: string): Promise<StorageUsageResponse> {
    const space = await this.prisma.coupleSpace.findUnique({
      where: { id: spaceId },
    });

    if (!space) {
      throw new NotFoundException('Couple space not found');
    }

    const activeCount = await this.prisma.mediaAsset.count({
      where: {
        coupleSpaceId: spaceId,
        status: 'ACTIVE',
      },
    });

    return {
      quotaUsedBytes: Number(space.quotaUsedBytes),
      physicalStorageBytes: Number(space.physicalStorageBytes),
      activeMediaCount: activeCount,
    };
  }

  private async mapToItem(asset: any): Promise<MediaAssetItem> {
    const secureUrl = await this.storagePort.generatePrivateDeliveryUrl(asset.storageKey);

    return {
      id: asset.id,
      coupleSpaceId: asset.coupleSpaceId,
      uploadedById: asset.uploadedById,
      storageKey: asset.storageKey,
      originalFilename: asset.originalFilename,
      mimeType: asset.mimeType,
      fileSizeBytes: asset.fileSizeBytes,
      width: asset.width,
      height: asset.height,
      status: asset.status,
      secureUrl,
      capturedAt: asset.capturedAt ? asset.capturedAt.toISOString() : null,
      createdAt: asset.createdAt.toISOString(),
    };
  }
}
