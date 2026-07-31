import { DomainAuditResult, calculateDomainAudit } from './audit-engine';
import { MonitoredDomain, Organization, AiVisibilityReportRecord } from '@/types/database';
import { getSupabaseServerClient } from './supabase/server';

// Fallback in-memory store if Supabase credentials are not configured
const mockDb = {
  organizations: [
    {
      id: 'org-veesibi-01',
      name: 'VEESIBI Agency Workspace',
      owner_id: 'user-001',
      plan: 'pro' as const,
      stripe_customer_id: 'cus_VEESIBI101',
      created_at: new Date().toISOString()
    }
  ] as Organization[],
  domains: [
    { id: 'dom-01', org_id: 'org-veesibi-01', domain_name: 'veesibi.com', is_public: true, created_at: new Date().toISOString() },
    { id: 'dom-02', org_id: 'org-veesibi-01', domain_name: 'stripe.com', is_public: true, created_at: new Date().toISOString() },
    { id: 'dom-03', org_id: 'org-veesibi-01', domain_name: 'linear.app', is_public: true, created_at: new Date().toISOString() }
  ] as MonitoredDomain[],
  reports: [] as AiVisibilityReportRecord[]
};

export async function getOrCreateDefaultOrg(userId: string, userEmail: string): Promise<Organization> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      const { data: existingOrg } = await supabase
        .from('organizations')
        .select('*')
        .eq('owner_id', userId)
        .maybeSingle();

      if (existingOrg) {
        return existingOrg as Organization;
      }

      const newOrgData = {
        name: `${userEmail.split('@')[0]}'s Workspace`,
        owner_id: userId,
        plan: 'free'
      };

      const { data: inserted, error } = await supabase
        .from('organizations')
        .insert(newOrgData)
        .select()
        .single();

      if (!error && inserted) {
        return inserted as Organization;
      }
    } catch {
      // Fallback to local store
    }
  }

  let org = mockDb.organizations.find((o) => o.owner_id === userId);
  if (!org) {
    org = {
      id: `org-${Date.now()}`,
      name: `${userEmail.split('@')[0]}'s Workspace`,
      owner_id: userId,
      plan: 'free',
      created_at: new Date().toISOString()
    };
    mockDb.organizations.push(org);
  }
  return org;
}

export async function saveAuditReport(domain: string, audit: DomainAuditResult): Promise<AiVisibilityReportRecord> {
  const cleanDomain = domain.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
  const supabase = getSupabaseServerClient();

  if (supabase) {
    try {
      // 1. Get or create domain record
      let { data: domainRecord } = await supabase
        .from('domains')
        .select('*')
        .eq('domain_name', cleanDomain)
        .maybeSingle();

      if (!domainRecord) {
        const { data: newDom } = await supabase
          .from('domains')
          .insert({ domain_name: cleanDomain, is_public: true })
          .select()
          .single();
        domainRecord = newDom;
      }

      if (domainRecord) {
        const reportPayload = {
          domain_id: domainRecord.id,
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
          raw_payload: audit as unknown as Record<string, unknown>
        };

        const { data: insertedReport, error } = await supabase
          .from('ai_visibility_reports')
          .insert(reportPayload)
          .select()
          .single();

        if (!error && insertedReport) {
          return insertedReport as AiVisibilityReportRecord;
        }
      }
    } catch {
      // Fallback to local store
    }
  }

  let domainRecord = mockDb.domains.find((d) => d.domain_name === cleanDomain);
  if (!domainRecord) {
    domainRecord = {
      id: `dom-${Date.now()}`,
      domain_name: cleanDomain,
      is_public: true,
      created_at: new Date().toISOString()
    };
    mockDb.domains.push(domainRecord);
  }

  const reportRecord: AiVisibilityReportRecord = {
    id: `rep-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    domain_id: domainRecord.id,
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

  mockDb.reports.unshift(reportRecord);
  return reportRecord;
}

export async function getMonitoredDomains(orgId: string): Promise<{ domain: MonitoredDomain; latestAudit: DomainAuditResult }[]> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      const { data: domains } = await supabase
        .from('domains')
        .select('*, ai_visibility_reports(*)')
        .or(`org_id.eq.${orgId},is_public.eq.true`)
        .order('created_at', { ascending: false });

      if (domains && domains.length > 0) {
        return domains.map((d: any) => {
          const reports = d.ai_visibility_reports || [];
          const latestReport = reports.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
          const audit = latestReport?.raw_payload ? (latestReport.raw_payload as unknown as DomainAuditResult) : calculateDomainAudit(d.domain_name);
          return {
            domain: {
              id: d.id,
              org_id: d.org_id,
              domain_name: d.domain_name,
              is_public: d.is_public,
              created_at: d.created_at
            },
            latestAudit: audit
          };
        });
      }
    } catch {
      // Fallback to local store
    }
  }

  const domains = mockDb.domains.filter((d) => d.org_id === orgId || d.is_public);
  return domains.map((d) => ({
    domain: d,
    latestAudit: calculateDomainAudit(d.domain_name)
  }));
}

export async function addMonitoredDomain(orgId: string, domainName: string): Promise<MonitoredDomain> {
  const clean = domainName.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
  const supabase = getSupabaseServerClient();

  if (supabase) {
    try {
      const { data: existing } = await supabase
        .from('domains')
        .select('*')
        .eq('domain_name', clean)
        .maybeSingle();

      if (existing) {
        const { data: updated } = await supabase
          .from('domains')
          .update({ org_id: orgId })
          .eq('id', existing.id)
          .select()
          .single();
        if (updated) return updated as MonitoredDomain;
      } else {
        const { data: inserted } = await supabase
          .from('domains')
          .insert({ org_id: orgId, domain_name: clean, is_public: true })
          .select()
          .single();
        if (inserted) return inserted as MonitoredDomain;
      }
    } catch {
      // Fallback to local store
    }
  }

  let existing = mockDb.domains.find((d) => d.domain_name === clean);
  if (existing) {
    existing.org_id = orgId;
    return existing;
  }

  const newDomain: MonitoredDomain = {
    id: `dom-${Date.now()}`,
    org_id: orgId,
    domain_name: clean,
    is_public: true,
    created_at: new Date().toISOString()
  };
  mockDb.domains.push(newDomain);
  return newDomain;
}
