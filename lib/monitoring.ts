// VEESIBI Technical AI Readiness Monitoring Engine
// Tracks endpoint uptime, content drift, permission changes, TTFB regression

import { createHash } from 'crypto';
import { runParallelEdgeProbes, ParallelProbesReport } from './edge-probes';
import { getSupabaseServerClient } from './supabase/server';

// --- Types ---

export interface EndpointSnapshot {
  url: string;
  status: 'up' | 'down' | 'degraded';
  statusCode: number;
  contentHash: string;
  ttfbMs: number;
  checkedAt: string;
}

export interface DriftEvent {
  type: 'content_changed' | 'bot_permission_changed' | 'ttfb_regression' | 'endpoint_down' | 'schema_drift' | 'new_schema' | 'removed_schema';
  severity: 'critical' | 'high' | 'medium' | 'low';
  endpoint: string;
  message: string;
  previous?: string;
  current?: string;
  detectedAt: string;
}

export interface DomainMonitoringStatus {
  domain: string;
  lastCheckedAt: string | null;
  overallStatus: 'healthy' | 'degraded' | 'alerting' | 'unknown';
  endpoints: {
    llmsTxt: EndpointSnapshot | null;
    llmsFullTxt: EndpointSnapshot | null;
    robotsTxt: EndpointSnapshot | null;
    rootHtml: EndpointSnapshot | null;
  };
  botPermissions: {
    oaiSearchBot: 'Allowed' | 'Disallowed';
    claudeSearchBot: 'Allowed' | 'Disallowed';
    perplexityBot: 'Allowed' | 'Disallowed';
    gptBotTraining: 'Allowed' | 'Restricted';
    claudeBotTraining: 'Allowed' | 'Restricted';
  };
  recentDriftEvents: DriftEvent[];
  ttfbHistory: { timestamp: string; ttfbMs: number }[];
  uptimePercent: number;
  checksTotal: number;
  checksPassed: number;
}

export interface MonitoringCheckResult {
  domain: string;
  status: 'healthy' | 'degraded' | 'alerting';
  driftEvents: DriftEvent[];
  snapshots: EndpointSnapshot[];
  ttfbMs: number;
  botPermissions: DomainMonitoringStatus['botPermissions'];
  checkedAt: string;
}

// --- In-Memory Store (Supabase-ready) ---

interface StoredBaseline {
  contentHashes: Record<string, string>;
  botPermissions: DomainMonitoringStatus['botPermissions'];
  ttfbMs: number;
  lastCheckedAt: string;
}

const baselines = new Map<string, StoredBaseline>();
const checkHistory = new Map<string, EndpointSnapshot[]>();
const driftLog = new Map<string, DriftEvent[]>();

// --- Hashing ---

function contentHash(content: string): string {
  return createHash('sha256').update(content).digest('hex').substring(0, 16);
}

// --- Core Monitoring ---

export async function runMonitoringCheck(domain: string): Promise<MonitoringCheckResult> {
  const cleanDomain = domain.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
  const now = new Date().toISOString();

  // 1. Run live edge probes
  const probes = await runParallelEdgeProbes(cleanDomain);

  // 2. Build endpoint snapshots
  const llmsTxtHash = probes.probeA.rawContent ? contentHash(probes.probeA.rawContent) : '';
  const robotsTxtHash = probes.probeB.rawRobotsTxt ? contentHash(probes.probeB.rawRobotsTxt) : '';

  const snapshots: EndpointSnapshot[] = [];

  const llmsTxt: EndpointSnapshot | null = probes.probeA.llmsTxtFound ? {
    url: `https://${cleanDomain}/llms.txt`,
    status: probes.probeA.llmsTxtFound ? (probes.probeA.statusCode === 200 ? 'up' : 'degraded') : 'down',
    statusCode: probes.probeA.statusCode || 404,
    contentHash: llmsTxtHash,
    ttfbMs: probes.probeC.ttfbMs,
    checkedAt: now
  } : null;

  const robotsTxt: EndpointSnapshot | null = probes.probeB.robotsTxtFound ? {
    url: `https://${cleanDomain}/robots.txt`,
    status: 'up',
    statusCode: 200,
    contentHash: robotsTxtHash,
    ttfbMs: probes.probeC.ttfbMs,
    checkedAt: now
  } : null;

  const rootHtml: EndpointSnapshot | null = probes.probeC.reachable ? {
    url: `https://${cleanDomain}`,
    status: probes.probeC.statusCode === 200 ? 'up' : 'degraded',
    statusCode: probes.probeC.statusCode,
    contentHash: '',
    ttfbMs: probes.probeC.ttfbMs,
    checkedAt: now
  } : null;

  const llmsFullTxt: EndpointSnapshot | null = probes.probeA.llmsFullTxtFound ? {
    url: `https://${cleanDomain}/llms-full.txt`,
    status: 'up',
    statusCode: 200,
    contentHash: '',
    ttfbMs: probes.probeC.ttfbMs,
    checkedAt: now
  } : null;

  if (llmsTxt) snapshots.push(llmsTxt);
  if (robotsTxt) snapshots.push(robotsTxt);
  if (rootHtml) snapshots.push(rootHtml);
  if (llmsFullTxt) snapshots.push(llmsFullTxt);

  // 3. Detect drift against baseline
  const baseline = baselines.get(cleanDomain);
  const driftEvents: DriftEvent[] = [];

  if (baseline) {
    // Content drift detection
    if (llmsTxt && baseline.contentHashes['llms.txt'] && llmsTxt.contentHash !== baseline.contentHashes['llms.txt']) {
      driftEvents.push({
        type: 'content_changed',
        severity: 'medium',
        endpoint: '/llms.txt',
        message: 'llms.txt content has changed since last check',
        previous: baseline.contentHashes['llms.txt'],
        current: llmsTxt.contentHash,
        detectedAt: now
      });
    }

    if (robotsTxt && baseline.contentHashes['robots.txt'] && robotsTxt.contentHash !== baseline.contentHashes['robots.txt']) {
      driftEvents.push({
        type: 'content_changed',
        severity: 'high',
        endpoint: '/robots.txt',
        message: 'robots.txt content has changed — verify AI bot permissions',
        previous: baseline.contentHashes['robots.txt'],
        current: robotsTxt.contentHash,
        detectedAt: now
      });
    }

    // Bot permission drift detection
    const bp = probes.probeB;
    const prev = baseline.botPermissions;
    if (bp.oaiSearchBot !== prev.oaiSearchBot) {
      driftEvents.push({
        type: 'bot_permission_changed',
        severity: 'critical',
        endpoint: '/robots.txt',
        message: `OAI-SearchBot permission changed: ${prev.oaiSearchBot} → ${bp.oaiSearchBot}`,
        previous: prev.oaiSearchBot,
        current: bp.oaiSearchBot,
        detectedAt: now
      });
    }
    if (bp.claudeSearchBot !== prev.claudeSearchBot) {
      driftEvents.push({
        type: 'bot_permission_changed',
        severity: 'critical',
        endpoint: '/robots.txt',
        message: `Claude-SearchBot permission changed: ${prev.claudeSearchBot} → ${bp.claudeSearchBot}`,
        previous: prev.claudeSearchBot,
        current: bp.claudeSearchBot,
        detectedAt: now
      });
    }
    if (bp.perplexityBot !== prev.perplexityBot) {
      driftEvents.push({
        type: 'bot_permission_changed',
        severity: 'critical',
        endpoint: '/robots.txt',
        message: `PerplexityBot permission changed: ${prev.perplexityBot} → ${bp.perplexityBot}`,
        previous: prev.perplexityBot,
        current: bp.perplexityBot,
        detectedAt: now
      });
    }
    if (bp.gptBotTraining !== prev.gptBotTraining) {
      driftEvents.push({
        type: 'bot_permission_changed',
        severity: 'high',
        endpoint: '/robots.txt',
        message: `GPTBot training permission changed: ${prev.gptBotTraining} → ${bp.gptBotTraining}`,
        previous: prev.gptBotTraining,
        current: bp.gptBotTraining,
        detectedAt: now
      });
    }

    // TTFB regression detection (>30% increase)
    if (baseline.ttfbMs > 0 && probes.probeC.ttfbMs > baseline.ttfbMs * 1.3) {
      driftEvents.push({
        type: 'ttfb_regression',
        severity: 'high',
        endpoint: '/',
        message: `TTFB regressed: ${baseline.ttfbMs}ms → ${probes.probeC.ttfbMs}ms (+${Math.round(((probes.probeC.ttfbMs - baseline.ttfbMs) / baseline.ttfbMs) * 100)}%)`,
        previous: String(baseline.ttfbMs),
        current: String(probes.probeC.ttfbMs),
        detectedAt: now
      });
    }

    // Endpoint down detection
    if (!probes.probeA.llmsTxtFound && baseline.contentHashes['llms.txt']) {
      driftEvents.push({
        type: 'endpoint_down',
        severity: 'critical',
        endpoint: '/llms.txt',
        message: 'llms.txt endpoint is no longer reachable (was previously up)',
        detectedAt: now
      });
    }

    // JSON-LD schema drift
    const currentSchemas = probes.probeC.schemasFound.join(',');
    if (!probes.probeC.hasJsonLd && baseline.contentHashes['jsonld']) {
      driftEvents.push({
        type: 'schema_drift',
        severity: 'high',
        endpoint: '/',
        message: 'JSON-LD structured data removed from page',
        detectedAt: now
      });
    }
  }

  // 4. Update baseline
  const newBaseline: StoredBaseline = {
    contentHashes: {
      'llms.txt': llmsTxtHash || (baseline?.contentHashes['llms.txt'] || ''),
      'robots.txt': robotsTxtHash || (baseline?.contentHashes['robots.txt'] || ''),
      'jsonld': probes.probeC.hasJsonLd ? 'present' : ''
    },
    botPermissions: {
      oaiSearchBot: probes.probeB.oaiSearchBot,
      claudeSearchBot: probes.probeB.claudeSearchBot,
      perplexityBot: probes.probeB.perplexityBot,
      gptBotTraining: probes.probeB.gptBotTraining,
      claudeBotTraining: probes.probeB.claudeBotTraining
    },
    ttfbMs: probes.probeC.ttfbMs,
    lastCheckedAt: now
  };
  baselines.set(cleanDomain, newBaseline);

  // 5. Store check history (keep last 100)
  const history = checkHistory.get(cleanDomain) || [];
  history.unshift(...snapshots);
  while (history.length > 100) history.pop();
  checkHistory.set(cleanDomain, history);

  // 6. Store drift events (keep last 50)
  if (driftEvents.length > 0) {
    const events = driftLog.get(cleanDomain) || [];
    events.unshift(...driftEvents);
    while (events.length > 50) events.pop();
    driftLog.set(cleanDomain, events);
  }

  // 7. Calculate uptime
  const domainHistory = checkHistory.get(cleanDomain) || [];
  const llmsChecks = domainHistory.filter((s) => s.url.includes('llms.txt'));
  const checksTotal = llmsChecks.length || 1;
  const checksPassed = llmsChecks.filter((s) => s.status === 'up').length;
  const uptimePercent = Math.round((checksPassed / checksTotal) * 100);

  // 8. Determine overall status
  const hasCritical = driftEvents.some((e) => e.severity === 'critical');
  const hasHigh = driftEvents.some((e) => e.severity === 'high');
  const status = hasCritical ? 'alerting' : hasHigh ? 'degraded' : 'healthy';

  // 9. Build TTFB history
  const ttfbHistory = domainHistory
    .filter((s) => s.url.includes(cleanDomain) && !s.url.includes('llms') && !s.url.includes('robots'))
    .slice(0, 20)
    .map((s) => ({ timestamp: s.checkedAt, ttfbMs: s.ttfbMs }));

  return {
    domain: cleanDomain,
    status,
    driftEvents,
    snapshots,
    ttfbMs: probes.probeC.ttfbMs,
    botPermissions: newBaseline.botPermissions,
    checkedAt: now
  };
}

// --- Status Retrieval ---

export function getMonitoringStatus(domain: string): DomainMonitoringStatus | null {
  const cleanDomain = domain.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
  const baseline = baselines.get(cleanDomain);
  if (!baseline) return null;

  const history = checkHistory.get(cleanDomain) || [];
  const events = driftLog.get(cleanDomain) || [];

  const llmsChecks = history.filter((s) => s.url.includes('llms.txt'));
  const checksTotal = llmsChecks.length || 1;
  const checksPassed = llmsChecks.filter((s) => s.status === 'up').length;
  const uptimePercent = Math.round((checksPassed / checksTotal) * 100);

  const hasCritical = events.length > 0 && events[0].severity === 'critical';
  const hasHigh = events.length > 0 && events[0].severity === 'high';
  const overallStatus = hasCritical ? 'alerting' : hasHigh ? 'degraded' : 'healthy';

  const llmsSnapshot = history.find((s) => s.url.includes('/llms.txt')) || null;
  const robotsSnapshot = history.find((s) => s.url.includes('/robots.txt')) || null;
  const rootSnapshot = history.find((s) => s.url === `https://${cleanDomain}`) || null;
  const llmsFullSnapshot = history.find((s) => s.url.includes('/llms-full.txt')) || null;

  const ttfbHistory = history
    .filter((s) => s.url === `https://${cleanDomain}`)
    .slice(0, 20)
    .map((s) => ({ timestamp: s.checkedAt, ttfbMs: s.ttfbMs }));

  return {
    domain: cleanDomain,
    lastCheckedAt: baseline.lastCheckedAt,
    overallStatus,
    endpoints: {
      llmsTxt: llmsSnapshot,
      llmsFullTxt: llmsFullSnapshot,
      robotsTxt: robotsSnapshot,
      rootHtml: rootSnapshot
    },
    botPermissions: baseline.botPermissions,
    recentDriftEvents: events.slice(0, 10),
    ttfbHistory,
    uptimePercent,
    checksTotal,
    checksPassed
  };
}
