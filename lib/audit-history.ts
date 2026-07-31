import { DomainAuditResult } from './audit-engine';
import { getSupabaseServerClient } from './supabase/server';
import { AiVisibilityReportRecord } from '@/types/database';

// In-memory fallback store for historical reports
const mockHistory: Map<string, AiVisibilityReportRecord[]> = new Map();

export interface AuditHistoryEntry {
  id: string;
  domain: string;
  overallScore: number;
  subScores: Record<string, number>;
  timestamp: string;
}

export interface AuditDiff {
  domain: string;
  previousScore: number;
  currentScore: number;
  delta: number;
  direction: 'improved' | 'declined' | 'unchanged';
  subScoreDiffs: { name: string; previous: number; current: number; delta: number }[];
  timestamp: string;
}

export async function getAuditHistory(domain: string, limit = 30): Promise<AuditHistoryEntry[]> {
  const cleanDomain = domain.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
  const supabase = getSupabaseServerClient();

  if (supabase) {
    try {
      const { data: domainRecord } = await supabase
        .from('domains')
        .select('id')
        .eq('domain_name', cleanDomain)
        .maybeSingle();

      if (!domainRecord) return [];

      const { data: reports } = await supabase
        .from('ai_visibility_reports')
        .select('*')
        .eq('domain_id', domainRecord.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (reports && reports.length > 0) {
        return reports.map((r: any) => ({
          id: r.id,
          domain: cleanDomain,
          overallScore: r.overall_score,
          subScores: {
            crawlability: r.crawlability_score,
            llmsTxt: r.llms_txt_score,
            readiness: r.readiness_score,
            entityAuthority: r.entity_score,
            structuredSchema: r.schema_score,
            trustScore: r.trust_score,
            citationScore: r.citation_score,
            geoShareOfVoice: r.geo_score
          },
          timestamp: r.created_at
        }));
      }
    } catch {
      // Fallback to in-memory
    }
  }

  // In-memory fallback
  const entries = mockHistory.get(cleanDomain) || [];
  return entries.slice(0, limit).map((r) => ({
    id: r.id,
    domain: cleanDomain,
    overallScore: r.overall_score,
    subScores: {
      crawlability: r.crawlability_score,
      llmsTxt: r.llms_txt_score,
      readiness: r.readiness_score,
      entityAuthority: r.entity_score,
      structuredSchema: r.schema_score,
      trustScore: r.trust_score,
      citationScore: r.citation_score,
      geoShareOfVoice: r.geo_score
    },
    timestamp: r.created_at
  }));
}

export async function getLatestTwoAudits(domain: string): Promise<{ previous: AuditHistoryEntry | null; current: AuditHistoryEntry | null }> {
  const history = await getAuditHistory(domain, 2);
  return {
    current: history[0] || null,
    previous: history[1] || null
  };
}

export function computeAuditDiff(previous: AuditHistoryEntry | null, current: AuditHistoryEntry | null): AuditDiff | null {
  if (!current) return null;

  if (!previous) {
    return {
      domain: current.domain,
      previousScore: 0,
      currentScore: current.overallScore,
      delta: current.overallScore,
      direction: 'improved',
      subScoreDiffs: [],
      timestamp: current.timestamp
    };
  }

  const delta = current.overallScore - previous.overallScore;
  const direction = delta > 0 ? 'improved' : delta < 0 ? 'declined' : 'unchanged';

  const subScoreNames = [
    { key: 'crawlability', name: 'Crawlability' },
    { key: 'llmsTxt', name: 'llms.txt Compliance' },
    { key: 'readiness', name: 'AI Technical Readiness' },
    { key: 'entityAuthority', name: 'Entity Authority' },
    { key: 'structuredSchema', name: 'Structured Data' },
    { key: 'trustScore', name: 'Trust & E-E-A-T' },
    { key: 'citationScore', name: 'Multi-Engine Citations' },
    { key: 'geoShareOfVoice', name: 'GEO Share of Voice' }
  ];

  const subScoreDiffs = subScoreNames.map(({ key, name }) => ({
    name,
    previous: previous.subScores[key] || 0,
    current: current.subScores[key] || 0,
    delta: (current.subScores[key] || 0) - (previous.subScores[key] || 0)
  }));

  return {
    domain: current.domain,
    previousScore: previous.overallScore,
    currentScore: current.overallScore,
    delta,
    direction,
    subScoreDiffs,
    timestamp: current.timestamp
  };
}

export async function storeAuditHistory(domain: string, audit: DomainAuditResult): Promise<void> {
  const cleanDomain = domain.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];

  const entry: AiVisibilityReportRecord = {
    id: `rep-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    domain_id: `dom-${cleanDomain}`,
    overall_score: audit.overallScore,
    crawlability_score: audit.subScores.crawlability.score,
    llms_txt_score: audit.subScores.llmsTxt.score,
    readiness_score: audit.subScores.readiness.score,
    entity_score: audit.subScores.entityAuthority.score,
    schema_score: audit.subScores.structuredSchema.score,
    trust_score: audit.subScores.trustScore.score,
    citation_score: audit.subScores.citationScore.score,
    geo_score: audit.subScores.geoShareOfVoice.score,
    status: 'completed',
    raw_payload: audit as unknown as Record<string, unknown>,
    created_at: new Date().toISOString()
  };

  // In-memory store (Supabase persistence handled by saveAuditReport in db.ts)
  const existing = mockHistory.get(cleanDomain) || [];
  existing.unshift(entry);
  if (existing.length > 90) existing.length = 90; // Keep 90 days max
  mockHistory.set(cleanDomain, existing);
}
