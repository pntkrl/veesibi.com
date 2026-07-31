-- VEESIBI Production-Ready Database Schema (Supabase PostgreSQL)
-- Section 12 Blueprint Architecture (Idempotent & Re-runnable)

-- 1. Core Domain ENUM Types (Safe Creation)
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('user', 'admin', 'agency_member');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE sub_plan AS ENUM ('free', 'pro', 'agency', 'enterprise');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE audit_status AS ENUM ('pending', 'processing', 'completed', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Users & Profiles
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Organizations (Supports Agency Multi-Tenancy)
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  plan sub_plan DEFAULT 'free' NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. Monitored Domains
CREATE TABLE IF NOT EXISTS domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  domain_name TEXT UNIQUE NOT NULL,
  is_public BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 5. AI Visibility Score Reports
CREATE TABLE IF NOT EXISTS ai_visibility_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id UUID REFERENCES domains(id) ON DELETE CASCADE NOT NULL,
  overall_score INT NOT NULL,
  crawlability_score INT NOT NULL,
  llms_txt_score INT NOT NULL,
  readiness_score INT NOT NULL,
  entity_score INT NOT NULL,
  schema_score INT NOT NULL,
  trust_score INT NOT NULL,
  citation_score INT NOT NULL,
  geo_score INT NOT NULL,
  status audit_status DEFAULT 'completed' NOT NULL,
  raw_payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 6. Monitored Prompts
CREATE TABLE IF NOT EXISTS monitored_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id UUID REFERENCES domains(id) ON DELETE CASCADE NOT NULL,
  prompt_text TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 7. Citation Tracking History
CREATE TABLE IF NOT EXISTS citation_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID REFERENCES monitored_prompts(id) ON DELETE CASCADE NOT NULL,
  model_name TEXT NOT NULL,
  is_cited BOOLEAN DEFAULT false NOT NULL,
  ordinal_position INT,
  sentiment_score NUMERIC(3,2),
  snippet_text TEXT,
  checked_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 8. Speed Optimization Indexes
CREATE INDEX IF NOT EXISTS idx_domains_name ON domains(domain_name);
CREATE INDEX IF NOT EXISTS idx_reports_domain_created ON ai_visibility_reports(domain_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_citations_prompt_checked ON citation_mentions(prompt_id, checked_at DESC);

-- 9. Row Level Security (RLS) Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_visibility_reports ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DROP POLICY IF EXISTS "Allow public read access to public domain scorecards" ON ai_visibility_reports;
DROP POLICY IF EXISTS "Allow public read access to domains" ON domains;
DROP POLICY IF EXISTS "Allow public insert on domains" ON domains;
DROP POLICY IF EXISTS "Allow public insert on ai_visibility_reports" ON ai_visibility_reports;
DROP POLICY IF EXISTS "Allow organization owner access" ON organizations;
DROP POLICY IF EXISTS "Allow users full access to own user profile" ON users;

-- Public can read public domain reports (for pSEO flywheel)
CREATE POLICY "Allow public read access to public domain scorecards"
  ON ai_visibility_reports FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access to domains"
  ON domains FOR SELECT
  USING (is_public = true);

-- Public can insert new domain audit records
CREATE POLICY "Allow public insert on domains"
  ON domains FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public insert on ai_visibility_reports"
  ON ai_visibility_reports FOR INSERT
  WITH CHECK (true);

-- Organization owners can manage their own org data
CREATE POLICY "Allow organization owner access"
  ON organizations FOR ALL
  USING (auth.uid() = owner_id);

CREATE POLICY "Allow users full access to own user profile"
  ON users FOR ALL
  USING (auth.uid() = id);

-- 10. Table & Sequence Role Grants (Applies permissions cleanly for anon & authenticated roles)
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
