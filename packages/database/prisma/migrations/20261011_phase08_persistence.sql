-- ============================================================
-- OURS — Phase 08 & 09 Database Persistence Migration Script
-- Target: PostgreSQL 16 (Supabase)
-- Note: Awaiting owner approval before execution against live DB
-- ============================================================

CREATE TABLE IF NOT EXISTS "love_letters" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "couple_space_id" UUID NOT NULL REFERENCES "couple_spaces"("id") ON DELETE CASCADE,
    "author_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "recipient_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "sent_at" TIMESTAMPTZ,
    "read_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "idx_love_letters_space" ON "love_letters"("couple_space_id");

CREATE TABLE IF NOT EXISTS "time_capsules" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "couple_space_id" UUID NOT NULL REFERENCES "couple_spaces"("id") ON DELETE CASCADE,
    "created_by_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "unlock_at" TIMESTAMPTZ NOT NULL,
    "media_asset_ids" JSONB DEFAULT '[]'::jsonb,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "idx_time_capsules_space" ON "time_capsules"("couple_space_id");

CREATE TABLE IF NOT EXISTS "couple_goals" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "couple_space_id" UUID NOT NULL REFERENCES "couple_spaces"("id") ON DELETE CASCADE,
    "created_by_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'LIFESTYLE',
    "target_date" TIMESTAMPTZ,
    "milestones" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "achieved_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "idx_couple_goals_space" ON "couple_goals"("couple_space_id");

CREATE TABLE IF NOT EXISTS "decision_polls" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "couple_space_id" UUID NOT NULL REFERENCES "couple_spaces"("id") ON DELETE CASCADE,
    "created_by_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "question" TEXT NOT NULL,
    "options" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "votes" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "winner_option_index" INT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "idx_decision_polls_space" ON "decision_polls"("couple_space_id");

CREATE TABLE IF NOT EXISTS "scheduled_surprises" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "couple_space_id" UUID NOT NULL REFERENCES "couple_spaces"("id") ON DELETE CASCADE,
    "created_by_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "reveal_at" TIMESTAMPTZ NOT NULL,
    "gift_type" TEXT DEFAULT 'NOTE',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "idx_scheduled_surprises_space" ON "scheduled_surprises"("couple_space_id");

CREATE TABLE IF NOT EXISTS "ai_consents" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "couple_space_id" UUID UNIQUE NOT NULL REFERENCES "couple_spaces"("id") ON DELETE CASCADE,
    "enabled" BOOLEAN NOT NULL DEFAULT TRUE,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
