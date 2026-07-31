export type UserRole = 'user' | 'admin' | 'agency_member';
export type SubPlan = 'free' | 'pro' | 'agency' | 'enterprise';
export type AuditStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface UserProfile {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: string;
  name: string;
  owner_id: string;
  plan: SubPlan;
  created_at: string;
}

export interface MonitoredDomain {
  id: string;
  org_id?: string | null;
  domain_name: string;
  is_public: boolean;
  created_at: string;
}

export interface AiVisibilityReportRecord {
  id: string;
  domain_id: string;
  overall_score: number;
  crawlability_score: number;
  llms_txt_score: number;
  readiness_score: number;
  entity_score: number;
  schema_score: number;
  trust_score: number;
  citation_score: number;
  geo_score: number;
  status: AuditStatus;
  raw_payload: Record<string, unknown>;
  created_at: string;
}

export interface MonitoredPrompt {
  id: string;
  domain_id: string;
  prompt_text: string;
  category?: string | null;
  created_at: string;
}

export interface CitationMention {
  id: string;
  prompt_id: string;
  model_name: string;
  is_cited: boolean;
  ordinal_position?: number | null;
  sentiment_score?: number | null;
  snippet_text?: string | null;
  checked_at: string;
}
