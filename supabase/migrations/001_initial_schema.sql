-- ============================================================================
-- NZ Election Tracker — Initial Database Schema
-- Run in Supabase SQL Editor (or via supabase db push)
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- for full-text search

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE subscription_tier AS ENUM ('free', 'pro', 'institutional');
CREATE TYPE content_source_type AS ENUM ('official', 'media', 'social', 'blog', 'polling');
CREATE TYPE sentiment_label AS ENUM ('positive', 'negative', 'neutral', 'mixed');
CREATE TYPE electorate_type AS ENUM ('general', 'maori');

-- ============================================================================
-- PARTIES
-- ============================================================================

CREATE TABLE parties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  short_name TEXT NOT NULL UNIQUE,        -- e.g. 'NAT', 'LAB', 'GRN'
  colour TEXT NOT NULL,                    -- hex colour for charts
  logo_url TEXT,
  website_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- ELECTORATES
-- ============================================================================

CREATE TABLE electorates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  electorate_type electorate_type NOT NULL DEFAULT 'general',
  region TEXT,
  population INTEGER,
  registered_voters INTEGER,
  geojson JSONB,                           -- boundary geometry from LINZ
  demographics JSONB,                      -- census data overlay
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- CANDIDATES
-- ============================================================================

CREATE TABLE candidates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  party_id UUID REFERENCES parties(id) ON DELETE SET NULL,
  electorate_id UUID REFERENCES electorates(id) ON DELETE SET NULL,
  is_list_mp BOOLEAN NOT NULL DEFAULT false,
  list_position INTEGER,
  photo_url TEXT,
  bio TEXT,
  social_links JSONB,                      -- { twitter, bluesky, facebook, etc. }
  is_incumbent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- POLLS
-- ============================================================================

CREATE TABLE polls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pollster TEXT NOT NULL,                   -- e.g. 'Curia', 'Reid Research', 'Verian'
  survey_start DATE,
  survey_end DATE NOT NULL,
  published_date DATE NOT NULL,
  sample_size INTEGER,
  margin_of_error NUMERIC(4,2),
  source_url TEXT,
  poll_type TEXT NOT NULL DEFAULT 'party_vote',  -- 'party_vote', 'preferred_pm', 'direction'
  raw_data JSONB,                           -- original scraped data for audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE poll_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  party_id UUID REFERENCES parties(id) ON DELETE SET NULL,
  candidate_name TEXT,                      -- for preferred PM polls
  value NUMERIC(5,2) NOT NULL,             -- percentage
  change_from_previous NUMERIC(5,2),       -- change vs same pollster's last poll
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(poll_id, party_id, candidate_name)
);

-- ============================================================================
-- CONTENT ITEMS (aggregated feed)
-- ============================================================================

CREATE TABLE content_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  excerpt TEXT,
  content_text TEXT,                        -- sanitised plain text for sentiment
  source_url TEXT NOT NULL UNIQUE,          -- dedupe key
  source_name TEXT NOT NULL,                -- e.g. 'RNZ', 'Beehive', 'r/newzealand'
  source_type content_source_type NOT NULL,
  author TEXT,
  published_at TIMESTAMPTZ NOT NULL,
  ingested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  parties_mentioned UUID[],                 -- array of party IDs
  topics TEXT[],                            -- e.g. ['housing', 'cost_of_living']
  entities JSONB,                           -- extracted entities
  engagement_metrics JSONB,                 -- likes, comments, shares etc.
  is_archived BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_content_items_published ON content_items(published_at DESC);
CREATE INDEX idx_content_items_source ON content_items(source_type, source_name);
CREATE INDEX idx_content_items_topics ON content_items USING GIN(topics);

-- ============================================================================
-- SENTIMENT SCORES
-- ============================================================================

CREATE TABLE sentiment_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_item_id UUID REFERENCES content_items(id) ON DELETE CASCADE,
  party_id UUID REFERENCES parties(id) ON DELETE SET NULL,
  topic TEXT,
  score NUMERIC(4,3) NOT NULL,              -- -1.000 to +1.000
  label sentiment_label NOT NULL,
  intensity NUMERIC(3,2),                   -- 0.00 to 1.00
  model_version TEXT NOT NULL DEFAULT 'claude-haiku-1',
  scored_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sentiment_party ON sentiment_scores(party_id, scored_at DESC);
CREATE INDEX idx_sentiment_topic ON sentiment_scores(topic, scored_at DESC);

-- ============================================================================
-- FORECAST SNAPSHOTS
-- ============================================================================

CREATE TABLE forecast_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  snapshot_date DATE NOT NULL UNIQUE,
  polling_average JSONB NOT NULL,           -- { party_id: avg_pct, ... }
  seat_projection JSONB NOT NULL,           -- { party_id: { median, p5, p95 }, ... }
  coalition_probabilities JSONB NOT NULL,   -- { centre_right: 0.52, centre_left: 0.41, hung: 0.07 }
  sentiment_index JSONB,                    -- sentiment contribution per party
  economic_indicators JSONB,                -- fundamentals snapshot
  model_version TEXT NOT NULL DEFAULT 'v0.1',
  simulation_count INTEGER NOT NULL DEFAULT 10000,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- HISTORICAL ELECTION RESULTS (for backtesting)
-- ============================================================================

CREATE TABLE election_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  election_year INTEGER NOT NULL,
  party_id UUID REFERENCES parties(id) ON DELETE SET NULL,
  electorate_id UUID REFERENCES electorates(id) ON DELETE SET NULL,
  vote_type TEXT NOT NULL,                  -- 'party_vote', 'electorate_vote'
  votes INTEGER NOT NULL,
  percentage NUMERIC(5,2),
  seats_won INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- USER SUBSCRIPTIONS (Stripe-driven)
-- ============================================================================

CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier subscription_tier NOT NULL DEFAULT 'free',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- ============================================================================
-- USER PREFERENCES
-- ============================================================================

CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dashboard_layout JSONB,
  watched_parties UUID[],
  watched_electorates UUID[],
  watched_topics TEXT[],
  theme TEXT NOT NULL DEFAULT 'system',     -- 'light', 'dark', 'system'
  email_digest TEXT NOT NULL DEFAULT 'none', -- 'none', 'weekly', 'daily'
  push_notifications BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- ============================================================================
-- ALERTS
-- ============================================================================

CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,                 -- 'new_poll', 'sentiment_shift', 'forecast_change'
  config JSONB NOT NULL,                    -- { party_id, threshold, direction, etc. }
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- ECONOMIC INDICATORS
-- ============================================================================

CREATE TABLE economic_indicators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  indicator_name TEXT NOT NULL,             -- 'unemployment', 'ocr', 'consumer_confidence', etc.
  value NUMERIC(10,4) NOT NULL,
  measurement_date DATE NOT NULL,
  source TEXT NOT NULL,
  raw_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(indicator_name, measurement_date)
);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on every table
ALTER TABLE parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE electorates ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sentiment_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE forecast_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE election_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE economic_indicators ENABLE ROW LEVEL SECURITY;

-- PUBLIC READ: reference data + public content
CREATE POLICY "Public read: parties" ON parties FOR SELECT USING (true);
CREATE POLICY "Public read: electorates" ON electorates FOR SELECT USING (true);
CREATE POLICY "Public read: candidates" ON candidates FOR SELECT USING (true);
CREATE POLICY "Public read: polls" ON polls FOR SELECT USING (true);
CREATE POLICY "Public read: poll_results" ON poll_results FOR SELECT USING (true);
CREATE POLICY "Public read: forecast_snapshots" ON forecast_snapshots FOR SELECT USING (true);
CREATE POLICY "Public read: election_results" ON election_results FOR SELECT USING (true);
CREATE POLICY "Public read: economic_indicators" ON economic_indicators FOR SELECT USING (true);

-- CONTENT: public read (limited by app logic for free tier)
CREATE POLICY "Public read: content_items" ON content_items FOR SELECT USING (NOT is_archived);
CREATE POLICY "Public read: sentiment_scores" ON sentiment_scores FOR SELECT USING (true);

-- USER-OWNED DATA: only the owning user can read/write
CREATE POLICY "User owns subscriptions" ON user_subscriptions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "User owns preferences" ON user_preferences
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "User owns alerts" ON alerts
  FOR ALL USING (auth.uid() = user_id);

-- SERVICE ROLE: insert/update/delete on data tables (server-side only)
-- The service_role key bypasses RLS, so no explicit policy needed for ingestion.

-- ============================================================================
-- UPDATED_AT TRIGGER (auto-update timestamps)
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_parties_updated_at BEFORE UPDATE ON parties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_electorates_updated_at BEFORE UPDATE ON electorates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_candidates_updated_at BEFORE UPDATE ON candidates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_user_subscriptions_updated_at BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_user_preferences_updated_at BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
