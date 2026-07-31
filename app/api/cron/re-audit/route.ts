import { NextResponse } from 'next/server';
import { runParallelEdgeProbes } from '@/lib/edge-probes';
import { calculateDomainAudit } from '@/lib/audit-engine';
import { saveAuditReport, getMonitoredDomains } from '@/lib/db';
import { getLatestTwoAudits, computeAuditDiff, storeAuditHistory } from '@/lib/audit-history';
import { sendScoreDropAlert, sendScoreImprovementAlert } from '@/lib/email-alerts';

interface ReAuditResult {
  domain: string;
  score: number;
  previousScore: number | null;
  delta: number | null;
  alertSent: boolean;
  error?: string;
}

export async function POST(request: Request) {
  // Verify cron secret or internal call
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const specificDomains: string[] | undefined = body.domains;

  // Get domains to audit
  let domainsToAudit: string[] = [];

  if (specificDomains && specificDomains.length > 0) {
    domainsToAudit = specificDomains;
  } else {
    // Audit all public monitored domains
    try {
      const monitored = await getMonitoredDomains('org-veesibi-01');
      domainsToAudit = monitored.map((m) => m.domain.domain_name);
    } catch {
      domainsToAudit = ['veesibi.com', 'stripe.com', 'linear.app', 'vercel.com', 'supabase.com'];
    }
  }

  if (domainsToAudit.length === 0) {
    return NextResponse.json({ message: 'No domains to audit', results: [] });
  }

  const results: ReAuditResult[] = [];

  // Process domains sequentially to avoid rate limits on external APIs
  for (const domain of domainsToAudit) {
    try {
      // 1. Run live edge probes
      const probes = await runParallelEdgeProbes(domain);
      const audit = calculateDomainAudit(domain, probes);

      // 2. Store the new audit report
      await saveAuditReport(domain, audit);
      await storeAuditHistory(domain, audit);

      // 3. Compare with previous audit
      const { previous } = await getLatestTwoAudits(domain);
      const diff = computeAuditDiff(previous, {
        id: '',
        domain,
        overallScore: audit.overallScore,
        subScores: {
          crawlability: audit.subScores.crawlability.score,
          llmsTxt: audit.subScores.llmsTxt.score,
          readiness: audit.subScores.readiness.score,
          entityAuthority: audit.subScores.entityAuthority.score,
          structuredSchema: audit.subScores.structuredSchema.score,
          trustScore: audit.subScores.trustScore.score,
          citationScore: audit.subScores.citationScore.score,
          geoShareOfVoice: audit.subScores.geoShareOfVoice.score
        },
        timestamp: new Date().toISOString()
      });

      // 4. Send alerts on significant changes (>5pt drop)
      let alertSent = false;
      if (diff && diff.direction === 'declined' && Math.abs(diff.delta) > 5) {
        const alert = await sendScoreDropAlert(diff);
        alertSent = alert.sent;
      } else if (diff && diff.direction === 'improved' && diff.delta > 10) {
        await sendScoreImprovementAlert(diff);
        alertSent = true;
      }

      results.push({
        domain,
        score: audit.overallScore,
        previousScore: previous?.overallScore || null,
        delta: diff?.delta || null,
        alertSent
      });
    } catch (error) {
      results.push({
        domain,
        score: 0,
        previousScore: null,
        delta: null,
        alertSent: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  return NextResponse.json({
    success: true,
    auditedAt: new Date().toISOString(),
    domainCount: results.length,
    results
  });
}

// GET endpoint to check cron status
export async function GET() {
  return NextResponse.json({
    service: 'VEESIBI Scheduled Re-Audit Engine',
    status: 'active',
    description: 'POST to trigger re-audit of monitored domains. Sends score drop alerts.',
    usage: 'POST /api/cron/re-audit with optional { domains: ["example.com"] } body'
  });
}
