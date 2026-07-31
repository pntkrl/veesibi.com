import { NextResponse } from 'next/server';
import { calculateDomainAudit } from '@/lib/audit-engine';
import { saveAuditReport } from '@/lib/db';
import { runParallelEdgeProbes } from '@/lib/edge-probes';
import { checkRateLimit, createRateLimitResponse } from '@/lib/rate-limit';

export async function POST(request: Request) {
  // Rate limit: 10 audits per minute per IP
  const rateLimit = await checkRateLimit(request, { limit: 10, windowMs: 60000, prefix: 'rl:audit' });
  if (!rateLimit.success) {
    return createRateLimitResponse(rateLimit);
  }

  try {
    const body = await request.json();
    const domain = body.domain;

    if (!domain || typeof domain !== 'string') {
      return NextResponse.json({ error: 'Domain parameter is required' }, { status: 400 });
    }

    const cleanDomain = domain.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0].trim();
    
    // 1. Execute parallel edge probes (Probe A: llms.txt, Probe B: robots.txt, Probe C: JSON-LD, Probe D: SERP Citations)
    const edgeProbes = await runParallelEdgeProbes(cleanDomain);

    // 2. Calculate composite live domain audit score from real probe metrics
    const auditResult = calculateDomainAudit(cleanDomain, edgeProbes);

    // 3. Persist report to database repository
    const dbRecord = await saveAuditReport(cleanDomain, auditResult);

    return NextResponse.json({
      success: true,
      reportId: dbRecord.id,
      domain: cleanDomain,
      executionTimeMs: edgeProbes.executionTimeMs,
      probes: edgeProbes,
      audit: auditResult
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process domain audit', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
