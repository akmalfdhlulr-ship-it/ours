import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';

/**
 * OURS — Backfill / Import Utility for Phase 08 Persistence
 * Strategy: Migrates local JSON records into PostgreSQL tables
 * Safe, idempotent execution with ON CONFLICT DO NOTHING.
 */
async function backfillPhase08() {
  const prisma = new PrismaClient();
  const dataDir = path.resolve(process.cwd(), '../../apps/api/data');

  if (!fs.existsSync(dataDir)) {
    console.log('[Backfill] No local JSON data directory found at', dataDir);
    await prisma.$disconnect();
    return;
  }

  console.log('[Backfill] Checking local JSON data in', dataDir);

  // 1. Backfill Love Letters
  const lettersPath = path.join(dataDir, 'letters.json');
  if (fs.existsSync(lettersPath)) {
    try {
      const letters = JSON.parse(fs.readFileSync(lettersPath, 'utf-8'));
      console.log(`[Backfill] Found ${letters.length} letters to process.`);
      for (const item of letters) {
        await prisma.$executeRawUnsafe(
          `INSERT INTO love_letters (id, couple_space_id, author_id, recipient_id, title, content, status, sent_at, read_at, created_at, updated_at)
           VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5, $6, $7, $8, $9, $10, $11)
           ON CONFLICT (id) DO NOTHING;`,
          item.id,
          item.coupleSpaceId,
          item.authorUserId,
          item.recipientUserId,
          item.title,
          item.content,
          item.isDraft ? 'DRAFT' : 'SENT',
          item.sentAt ? new Date(item.sentAt) : null,
          item.readAt ? new Date(item.readAt) : null,
          new Date(item.createdAt),
          new Date(item.updatedAt || item.createdAt)
        );
      }
      console.log('[Backfill] Letters backfill complete.');
    } catch (err) {
      console.error('[Backfill] Letters backfill error:', err);
    }
  }

  // 2. Backfill Time Capsules
  const capsulesPath = path.join(dataDir, 'time-capsules.json');
  if (fs.existsSync(capsulesPath)) {
    try {
      const capsules = JSON.parse(fs.readFileSync(capsulesPath, 'utf-8'));
      console.log(`[Backfill] Found ${capsules.length} time capsules to process.`);
      for (const item of capsules) {
        await prisma.$executeRawUnsafe(
          `INSERT INTO time_capsules (id, couple_space_id, created_by_id, title, content, unlock_at, media_asset_ids, created_at)
           VALUES ($1::uuid, $2::uuid, $3::uuid, $4, $5, $6, $7::jsonb, $8)
           ON CONFLICT (id) DO NOTHING;`,
          item.id,
          item.coupleSpaceId,
          item.createdByUserId,
          item.title,
          item.content,
          new Date(item.unlockAt),
          JSON.stringify(item.mediaAssetIds || []),
          new Date(item.createdAt)
        );
      }
      console.log('[Backfill] Time Capsules backfill complete.');
    } catch (err) {
      console.error('[Backfill] Time Capsules backfill error:', err);
    }
  }

  // 3. Backfill Couple Goals
  const goalsPath = path.join(dataDir, 'goals.json');
  if (fs.existsSync(goalsPath)) {
    try {
      const goals = JSON.parse(fs.readFileSync(goalsPath, 'utf-8'));
      console.log(`[Backfill] Found ${goals.length} goals to process.`);
      for (const item of goals) {
        await prisma.$executeRawUnsafe(
          `INSERT INTO couple_goals (id, couple_space_id, created_by_id, title, description, category, target_date, milestones, status, achieved_at, created_at)
           VALUES ($1::uuid, $2::uuid, $3::uuid, $4, $5, $6, $7, $8::jsonb, $9, $10, $11)
           ON CONFLICT (id) DO NOTHING;`,
          item.id,
          item.coupleSpaceId,
          item.createdByUserId,
          item.title,
          item.description || null,
          item.category || 'LIFESTYLE',
          item.targetDate ? new Date(item.targetDate) : null,
          JSON.stringify(item.milestones || []),
          item.status || 'IN_PROGRESS',
          item.achievedAt ? new Date(item.achievedAt) : null,
          new Date(item.createdAt)
        );
      }
      console.log('[Backfill] Couple Goals backfill complete.');
    } catch (err) {
      console.error('[Backfill] Goals backfill error:', err);
    }
  }

  // 4. Backfill Decision Polls
  const decisionsPath = path.join(dataDir, 'decisions.json');
  if (fs.existsSync(decisionsPath)) {
    try {
      const polls = JSON.parse(fs.readFileSync(decisionsPath, 'utf-8'));
      console.log(`[Backfill] Found ${polls.length} decision polls to process.`);
      for (const item of polls) {
        await prisma.$executeRawUnsafe(
          `INSERT INTO decision_polls (id, couple_space_id, created_by_id, question, options, votes, status, winner_option_index, created_at)
           VALUES ($1::uuid, $2::uuid, $3::uuid, $4, $5::jsonb, $6::jsonb, $7, $8, $9)
           ON CONFLICT (id) DO NOTHING;`,
          item.id,
          item.coupleSpaceId,
          item.createdByUserId,
          item.question,
          JSON.stringify(item.options || []),
          JSON.stringify(item.votes || []),
          item.status || 'OPEN',
          item.winnerOptionIndex ?? null,
          new Date(item.createdAt)
        );
      }
      console.log('[Backfill] Decision Polls backfill complete.');
    } catch (err) {
      console.error('[Backfill] Decision polls backfill error:', err);
    }
  }

  // 5. Backfill Scheduled Surprises
  const surprisesPath = path.join(dataDir, 'surprises.json');
  if (fs.existsSync(surprisesPath)) {
    try {
      const surprises = JSON.parse(fs.readFileSync(surprisesPath, 'utf-8'));
      console.log(`[Backfill] Found ${surprises.length} surprises to process.`);
      for (const item of surprises) {
        await prisma.$executeRawUnsafe(
          `INSERT INTO scheduled_surprises (id, couple_space_id, created_by_id, title, message, reveal_at, gift_type, created_at)
           VALUES ($1::uuid, $2::uuid, $3::uuid, $4, $5, $6, $7, $8)
           ON CONFLICT (id) DO NOTHING;`,
          item.id,
          item.coupleSpaceId,
          item.createdByUserId,
          item.title,
          item.message,
          new Date(item.revealAt),
          item.giftType || 'NOTE',
          new Date(item.createdAt)
        );
      }
      console.log('[Backfill] Surprises backfill complete.');
    } catch (err) {
      console.error('[Backfill] Surprises backfill error:', err);
    }
  }

  await prisma.$disconnect();
  console.log('[Backfill] All Phase 08 items processed.');
}

if (require.main === module) {
  backfillPhase08().catch((e) => {
    console.error('[Backfill] Fatal error:', e);
    process.exit(1);
  });
}
