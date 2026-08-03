import { ParallelProbesReport } from './edge-probes';

export interface SubScore {
  name: string;
  key: string;
  score: number; // 0-100
  weight: number; // e.g. 0.12
  status: 'passed' | 'warning' | 'error';
  details: string;
  recommendation: string;
}

export interface CitationEngineResult {
  engine: string;
  cited: boolean;
  position: number | null;
  sentiment: 'Positive' | 'Neutral' | 'Negative';
  snippet: string;
}

export interface DomainAuditResult {
  domain: string;
  overallScore: number;
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  timestamp: string;
  isSimulated: boolean;
  subScores: {
    crawlability: SubScore;
    llmsTxt: SubScore;
    readiness: SubScore;
    entityAuthority: SubScore;
    structuredSchema: SubScore;
    trustScore: SubScore;
    citationScore: SubScore;
    geoShareOfVoice: SubScore;
    contentDensity: SubScore;
    rankingPosition: SubScore;
  };
  vulnerabilities: {
    code: string;
    title: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    description: string;
    fixAction: string;
  }[];
  citations: CitationEngineResult[];
  rawLlmsTxt?: string;
  generatedLlmsTxt: string;
  generatedRobotsTxt: string;
  generatedJsonLd: string;
}

// Preset domain database — used ONLY for homepage demo when no probes available
// Real audits always go through the API route with live edge probes
const PRESET_DOMAINS: Record<string, Partial<DomainAuditResult>> = {};

export function calculateDomainAudit(rawDomain: string, probes?: ParallelProbesReport): DomainAuditResult {
  const cleanDomain = rawDomain.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0].trim() || 'example.com';
  
  if (!probes && PRESET_DOMAINS[cleanDomain]) {
    const preset = PRESET_DOMAINS[cleanDomain];
    return generateCompleteAudit(cleanDomain, preset.overallScore!, preset.subScores!, undefined);
  }

  if (probes) {
    return calculateLiveAuditFromProbes(cleanDomain, probes);
  }

  // Fallback: estimated score based on domain name heuristics (NOT real analysis)
  // This is a rough placeholder until live probes are configured
  let hash = 0;
  for (let i = 0; i < cleanDomain.length; i++) {
    hash = (hash << 5) - hash + cleanDomain.charCodeAt(i);
    hash |= 0;
  }
  const posHash = Math.abs(hash);
  // Wider spread (40-75) to avoid false confidence; most unknown domains should score low-medium
  const calculatedOverall = 40 + (posHash % 36);

  const subScores: DomainAuditResult['subScores'] = {
    crawlability: { name: 'AI Crawlability', key: 'crawlability', score: Math.min(95, calculatedOverall + 5), weight: 0.12, status: calculatedOverall >= 70 ? 'passed' : 'warning', details: 'Estimated — configure OPENROUTER_API_KEY for live robots.txt analysis.', recommendation: 'Run a live audit for accurate crawlability scoring.' },
    llmsTxt: { name: 'llms.txt Compliance', key: 'llmsTxt', score: Math.max(20, calculatedOverall - 18), weight: 0.10, status: 'warning', details: 'Estimated — no live /llms.txt probe performed.', recommendation: 'Run a live audit to validate llms.txt compliance.' },
    readiness: { name: 'AI Technical Readiness', key: 'readiness', score: Math.min(90, calculatedOverall + 2), weight: 0.08, status: calculatedOverall >= 65 ? 'passed' : 'warning', details: 'Estimated — no live TTFB measurement taken.', recommendation: 'Run a live audit for real edge latency data.' },
    entityAuthority: { name: 'Entity Authority', key: 'entityAuthority', score: Math.max(30, calculatedOverall - 5), weight: 0.10, status: 'warning', details: 'Estimated — no live JSON-LD or Knowledge Graph probe.', recommendation: 'Run a live audit for entity authority analysis.' },
    structuredSchema: { name: 'Structured Data (JSON-LD)', key: 'structuredSchema', score: Math.min(90, calculatedOverall), weight: 0.10, status: 'warning', details: 'Estimated — no live schema detection performed.', recommendation: 'Run a live audit to detect JSON-LD schemas.' },
    trustScore: { name: 'Trust & E-E-A-T', key: 'trustScore', score: Math.min(95, calculatedOverall + 8), weight: 0.10, status: calculatedOverall >= 65 ? 'passed' : 'warning', details: 'Estimated — no live HTTPS or reachability check.', recommendation: 'Run a live audit for accurate trust scoring.' },
    citationScore: { name: 'Multi-Engine Citations', key: 'citationScore', score: Math.max(25, calculatedOverall - 15), weight: 0.15, status: 'warning', details: 'Estimated — no live AI engine queries performed.', recommendation: 'Run a live audit with OpenRouter for real citation data.' },
    geoShareOfVoice: { name: 'GEO Share of Voice', key: 'geoShareOfVoice', score: Math.max(20, calculatedOverall - 20), weight: 0.15, status: 'warning', details: 'Estimated — no live competitive analysis performed.', recommendation: 'Run a live audit for real share of voice metrics.' },
    contentDensity: { name: 'Token Content Density', key: 'contentDensity', score: Math.min(88, calculatedOverall + 4), weight: 0.05, status: 'warning', details: 'Estimated — no live HTML content analysis.', recommendation: 'Run a live audit for content density measurement.' },
    rankingPosition: { name: 'Ranking Position', key: 'rankingPosition', score: Math.max(30, calculatedOverall - 10), weight: 0.05, status: 'warning', details: 'Estimated — no live AI engine citation positions.', recommendation: 'Run a live audit for real ranking position data.' }
  };

  return generateCompleteAudit(cleanDomain, calculatedOverall, subScores, undefined);
}

function calculateLiveAuditFromProbes(cleanDomain: string, probes: ParallelProbesReport): DomainAuditResult {
  const { probeA, probeB, probeC, probeD } = probes;

  // 1. Crawlability Score (12%)
  let crawlabilityScore = 100;
  if (!probeB.searchBotsAllowed) crawlabilityScore = 40;
  if (probeB.oaiSearchBot === 'Disallowed') crawlabilityScore -= 25;
  if (probeB.claudeSearchBot === 'Disallowed') crawlabilityScore -= 20;
  if (probeB.perplexityBot === 'Disallowed') crawlabilityScore -= 15;
  crawlabilityScore = Math.max(20, Math.min(100, crawlabilityScore));

  // 2. llms.txt Score (10%)
  let llmsTxtScore = 20;
  if (probeA.llmsTxtFound) {
    llmsTxtScore = Math.max(50, probeA.syntaxScore);
    if (probeA.llmsFullTxtFound) llmsTxtScore = Math.min(100, llmsTxtScore + 10);
  }

  // 3. AI Technical Readiness Score (8%)
  let readinessScore = 100;
  if (!probeC.reachable) {
    readinessScore = 15;
  } else {
    if (probeC.ttfbMs > 1000) readinessScore -= 30;
    else if (probeC.ttfbMs > 500) readinessScore -= 15;
    if (!probeC.isHttps) readinessScore -= 20;
    if (!probeA.mdEndpointsAvailable) readinessScore -= 10;
  }
  readinessScore = Math.max(15, Math.min(100, readinessScore));

  // 4. Entity Authority Score (10%)
  const entityScore = probeC.hasJsonLd && probeC.schemasFound.includes('Organization') ? 92 : probeC.hasJsonLd ? 80 : 55;

  // 5. Structured Schema Score (10%)
  let schemaScore = 30;
  if (probeC.hasJsonLd) {
    schemaScore = Math.min(100, 50 + probeC.schemasFound.length * 15 + (probeC.isValidSyntax ? 10 : 0));
  }

  // 6. Trust Score (10%)
  let trustScore = 40;
  if (probeC.reachable) trustScore += 30;
  if (probeC.isHttps) trustScore += 20;
  if (probeC.hasJsonLd) trustScore += 10;

  // 7. Citation Score (15%)
  const citedCount = probeD.engineCitations.filter((c) => c.cited).length;
  const citationScore = Math.min(100, Math.round((citedCount / (probeD.engineCitations.length || 1)) * 100));

  // 8. GEO Share of Voice (15%)
  const geoScore = Math.round(citationScore * 0.6 + entityScore * 0.4);

  // 9. Content Density (5%)
  const densityScore = probeC.contentDensityPercent > 0 ? probeC.contentDensityPercent : 75;

  // 10. Ranking Position Score (5%)
  const validPositions = probeD.engineCitations.filter((c) => c.position !== null).map((c) => c.position!);
  const avgPos = validPositions.length > 0 ? validPositions.reduce((a, b) => a + b, 0) / validPositions.length : 3;
  const rankingScore = Math.max(30, Math.round(100 - (avgPos - 1) * 18));

  const subScores: DomainAuditResult['subScores'] = {
    crawlability: {
      name: 'AI Crawlability',
      key: 'crawlability',
      score: crawlabilityScore,
      weight: 0.12,
      status: crawlabilityScore >= 85 ? 'passed' : crawlabilityScore >= 60 ? 'warning' : 'error',
      details: probeB.robotsTxtFound
        ? `Live robots.txt evaluated: OAI-SearchBot (${probeB.oaiSearchBot}), Claude-SearchBot (${probeB.claudeSearchBot}), PerplexityBot (${probeB.perplexityBot}).`
        : 'No explicit robots.txt file found. Crawling assumed permitted.',
      recommendation: 'Ensure search crawlers remain explicitly allowed while restricting training scrapers.'
    },
    llmsTxt: {
      name: 'llms.txt Compliance',
      key: 'llmsTxt',
      score: llmsTxtScore,
      weight: 0.10,
      status: llmsTxtScore >= 85 ? 'passed' : llmsTxtScore >= 60 ? 'warning' : 'error',
      details: probeA.llmsTxtFound
        ? `Live /llms.txt found (${probeA.syntaxScore}/100 syntax score). /llms-full.txt: ${probeA.llmsFullTxtFound ? 'Present' : 'Missing'}.`
        : 'Live probe returned 404/missing for /llms.txt. AI agents fall back to scanning heavy HTML.',
      recommendation: probeA.llmsTxtFound
        ? 'Fix markdown syntax issues or add /llms-full.txt file.'
        : 'Generate and publish an optimized /llms.txt file to guide AI agents.'
    },
    readiness: {
      name: 'AI Technical Readiness',
      key: 'readiness',
      score: readinessScore,
      weight: 0.08,
      status: readinessScore >= 80 ? 'passed' : 'warning',
      details: `Live edge latency: ${probeC.ttfbMs}ms TTFB. HTTPS: ${probeC.isHttps ? 'Valid' : 'Insecure'}. Status: ${probeC.statusCode}.`,
      recommendation: 'Maintain fast TTFB edge latency and serve clean markdown endpoints.'
    },
    entityAuthority: {
      name: 'Entity Authority',
      key: 'entityAuthority',
      score: entityScore,
      weight: 0.10,
      status: entityScore >= 80 ? 'passed' : 'warning',
      details: `Detected schemas: ${probeC.schemasFound.join(', ') || 'None'}. Knowledge Graph link verification active.`,
      recommendation: 'Add Organization JSON-LD with verified SameAs profiles.'
    },
    structuredSchema: {
      name: 'Structured Data (JSON-LD)',
      key: 'structuredSchema',
      score: schemaScore,
      weight: 0.10,
      status: schemaScore >= 75 ? 'passed' : 'warning',
      details: probeC.hasJsonLd
        ? `Extracted ${probeC.schemasFound.length} valid JSON-LD schemas (${probeC.schemasFound.join(', ')}).`
        : 'No JSON-LD structured data scripts detected in live page HTML.',
      recommendation: 'Embed SoftwareApplication and Organization JSON-LD schemas in <head>.'
    },
    trustScore: {
      name: 'Trust & E-E-A-T',
      key: 'trustScore',
      score: trustScore,
      weight: 0.10,
      status: trustScore >= 80 ? 'passed' : 'warning',
      details: `HTTPS Security: ${probeC.isHttps ? 'Active' : 'Missing'}. Live domain reachability: HTTP ${probeC.statusCode}.`,
      recommendation: 'Ensure active SSL certificate and published privacy/terms documentation.'
    },
    citationScore: {
      name: 'Multi-Engine Citations',
      key: 'citationScore',
      score: citationScore,
      weight: 0.15,
      status: citationScore >= 75 ? 'passed' : 'warning',
      details: `Cited across ${citedCount} of ${probeD.engineCitations.length} evaluated AI search engines.`,
      recommendation: 'Publish direct Q&A formatted content to improve RAG extraction rates.'
    },
    geoShareOfVoice: {
      name: 'GEO Share of Voice',
      key: 'geoShareOfVoice',
      score: geoScore,
      weight: 0.15,
      status: geoScore >= 75 ? 'passed' : 'warning',
      details: `Calculated category Share of Voice based on live citation frequency and entity clarity.`,
      recommendation: 'Monitor brand citations against direct category competitors.'
    },
    contentDensity: {
      name: 'Token Content Density',
      key: 'contentDensity',
      score: densityScore,
      weight: 0.05,
      status: 'passed',
      details: `Live HTML text-to-code content density: ${densityScore}%.`,
      recommendation: 'Minimize client-side script wrappers to optimize token context windows.'
    },
    rankingPosition: {
      name: 'Ranking Position',
      key: 'rankingPosition',
      score: rankingScore,
      weight: 0.05,
      status: rankingScore >= 75 ? 'passed' : 'warning',
      details: `Average ordinal placement in AI recommendation answers: #${avgPos.toFixed(1)}.`,
      recommendation: 'Use structured markdown section headers to improve list ranking.'
    }
  };

  // Overall Weighted Score calculation: S_AIV = sum(w_i * S_i)
  const weightedSum =
    subScores.crawlability.score * subScores.crawlability.weight +
    subScores.llmsTxt.score * subScores.llmsTxt.weight +
    subScores.readiness.score * subScores.readiness.weight +
    subScores.entityAuthority.score * subScores.entityAuthority.weight +
    subScores.structuredSchema.score * subScores.structuredSchema.weight +
    subScores.trustScore.score * subScores.trustScore.weight +
    subScores.citationScore.score * subScores.citationScore.weight +
    subScores.geoShareOfVoice.score * subScores.geoShareOfVoice.weight +
    subScores.contentDensity.score * subScores.contentDensity.weight +
    subScores.rankingPosition.score * subScores.rankingPosition.weight;

  const overallScore = Math.round(weightedSum);

  return generateCompleteAudit(cleanDomain, overallScore, subScores, probes);
}

function generateCompleteAudit(
  cleanDomain: string,
  overallScore: number,
  subScores: DomainAuditResult['subScores'],
  probes?: ParallelProbesReport
): DomainAuditResult {
  const isSimulated = !probes;
  let grade: DomainAuditResult['grade'] = 'C';
  if (overallScore >= 93) grade = 'A+';
  else if (overallScore >= 88) grade = 'A';
  else if (overallScore >= 78) grade = 'B';
  else if (overallScore >= 68) grade = 'C';
  else if (overallScore >= 55) grade = 'D';
  else grade = 'F';

  const brandName = cleanDomain.split('.')[0].toUpperCase();

  const vulnerabilities: DomainAuditResult['vulnerabilities'] = [];

  if (subScores.llmsTxt.score < 80) {
    vulnerabilities.push({
      code: 'ERR_MISSING_FILE',
      title: 'Root /llms.txt file is missing or contains syntax errors',
      severity: 'critical',
      description: `LLM crawlers fetching ${cleanDomain}/llms.txt return a 404 or non-compliant syntax. AI agents fall back to scanning heavy HTML boilerplate.`,
      fixAction: 'Click "Copy Snippet" under /llms.txt fix tab to generate a compliant markdown file.'
    });
  }

  if (subScores.crawlability.score < 80) {
    vulnerabilities.push({
      code: 'ERR_BOT_BLOCK',
      title: 'robots.txt may restrict OAI-SearchBot or Claude-SearchBot',
      severity: 'high',
      description: 'Your robots.txt lacks explicit user-agent permissions for AI search crawlers while blocking training bots.',
      fixAction: 'Copy VEESIBI-generated robots.txt snippet allowing search indexing bots.'
    });
  }

  if (subScores.structuredSchema.score < 80) {
    vulnerabilities.push({
      code: 'ERR_MISSING_SCHEMA',
      title: 'Incomplete Organization or SoftwareApplication JSON-LD',
      severity: 'medium',
      description: 'Generative engines rely on structured JSON-LD schemas to disambiguate brand entity facts.',
      fixAction: 'Embed the recommended JSON-LD snippet into your site header.'
    });
  }

  const citations: CitationEngineResult[] = probes
    ? probes.probeD.engineCitations
    : [
        { engine: 'ChatGPT (GPT-4o / Search)', cited: false, position: null, sentiment: 'Neutral', snippet: 'No live data — configure OPENROUTER_API_KEY for real citation tracking.' },
        { engine: 'Perplexity AI', cited: false, position: null, sentiment: 'Neutral', snippet: 'No live data — configure OPENROUTER_API_KEY for real citation tracking.' },
        { engine: 'Claude 3.5 Sonnet (Search)', cited: false, position: null, sentiment: 'Neutral', snippet: 'No live data — configure OPENROUTER_API_KEY for real citation tracking.' },
        { engine: 'Google AI Overviews', cited: false, position: null, sentiment: 'Neutral', snippet: 'No live data — configure OPENROUTER_API_KEY for real citation tracking.' }
      ];

  const generatedLlmsTxt = `# ${brandName}
> ${brandName} (${cleanDomain}) - Official platform overview and system reference for AI search engines and LLM agents.

## Core Documentation
- [Homepage & Features](https://${cleanDomain}): Overview of core platform capabilities.
- [Documentation & API](https://${cleanDomain}/docs): Technical guides and developer reference.
- [Pricing & Plans](https://${cleanDomain}/pricing): Transparent billing options.

## Optional Context
- [Changelog & Updates](https://${cleanDomain}/changelog.md): Latest product updates and feature releases.
- [Security & Compliance](https://${cleanDomain}/security.md): Security protocols and terms of service.
`;

  const generatedRobotsTxt = `# VEESIBI AI Search Crawler Guidelines for ${cleanDomain}
User-agent: OAI-SearchBot
Allow: /

User-agent: Claude-SearchBot
Allow: /

User-agent: PerplexityBot
Allow: /

# Directives for AI Model Training Crawlers
User-agent: GPTBot
Disallow: /private/

User-agent: ClaudeBot
Disallow: /private/

Sitemap: https://${cleanDomain}/sitemap.xml
`;

  const generatedJsonLd = JSON.stringify(
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: brandName,
      url: `https://${cleanDomain}`,
      operatingSystem: 'Web',
      applicationCategory: 'BusinessApplication',
      offers: {
        '@type': 'Offer',
        price: '0.00',
        priceCurrency: 'USD'
      }
    },
    null,
    2
  );

  return {
    domain: cleanDomain,
    overallScore,
    grade,
    timestamp: new Date().toISOString(),
    isSimulated,
    subScores,
    vulnerabilities,
    citations,
    rawLlmsTxt: probes?.probeA.rawContent,
    generatedLlmsTxt,
    generatedRobotsTxt,
    generatedJsonLd
  };
}
