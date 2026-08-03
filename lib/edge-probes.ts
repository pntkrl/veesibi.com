// VEESIBI Parallel Edge Processing Probes Engine (Blueprint Section 4 & 5)
// Executes 4 parallel live edge probes (<3s response) with real HTTP fetches

import { validateLlmsTxtContent } from './llms-validator';
import { evaluateBrandCitationsOpenRouter, evaluateBrandCitationsOpenAI } from './api-clients';

export interface ProbeAResult {
  llmsTxtFound: boolean;
  llmsFullTxtFound: boolean;
  mdEndpointsAvailable: boolean;
  syntaxScore: number;
  rawContent?: string;
  statusCode?: number;
}

export interface ProbeBResult {
  robotsTxtFound: boolean;
  searchBotsAllowed: boolean;
  oaiSearchBot: 'Allowed' | 'Disallowed';
  claudeSearchBot: 'Allowed' | 'Disallowed';
  perplexityBot: 'Allowed' | 'Disallowed';
  gptBotTraining: 'Allowed' | 'Restricted';
  claudeBotTraining: 'Allowed' | 'Restricted';
  rawRobotsTxt?: string;
}

export interface ProbeCResult {
  reachable: boolean;
  isHttps: boolean;
  ttfbMs: number;
  statusCode: number;
  hasJsonLd: boolean;
  schemasFound: ('Organization' | 'SoftwareApplication' | 'Product' | 'FAQPage' | 'TechArticle' | 'WebSite')[];
  isValidSyntax: boolean;
  contentDensityPercent: number;
}

export interface ProbeDResult {
  engineCitations: {
    engine: string;
    cited: boolean;
    position: number | null;
    sentiment: 'Positive' | 'Neutral' | 'Negative';
    snippet: string;
  }[];
}

export interface ParallelProbesReport {
  domain: string;
  executionTimeMs: number;
  probeA: ProbeAResult;
  probeB: ProbeBResult;
  probeC: ProbeCResult;
  probeD: ProbeDResult;
}

// Utility: Safe fetch with timeout & browser user-agent
async function fetchWithTimeout(url: string, timeoutMs = 4000): Promise<Response | null> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 VEESIBI-AuditBot/1.0',
        'Accept': 'text/html,application/xhtml+xml,text/plain,application/json,*/*'
      }
    });
    clearTimeout(id);
    return response;
  } catch {
    clearTimeout(id);
    return null;
  }
}

// 1. Probe A: Live fetch of /llms.txt, /llms-full.txt, and .md endpoints
export async function probeA_LlmsTxtCheck(domain: string): Promise<ProbeAResult> {
  const cleanDomain = domain.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
  
  let res = await fetchWithTimeout(`https://${cleanDomain}/llms.txt`);
  if (!res || !res.ok) {
    // Check singular /llm.txt
    res = await fetchWithTimeout(`https://${cleanDomain}/llm.txt`);
  }
  if (!res || !res.ok) {
    // Fallback to HTTP /llms.txt
    res = await fetchWithTimeout(`http://${cleanDomain}/llms.txt`);
  }
  if (!res || !res.ok) {
    // Fallback to HTTP /llm.txt
    res = await fetchWithTimeout(`http://${cleanDomain}/llm.txt`);
  }

  if (res && res.ok) {
    const text = await res.text();
    const validation = validateLlmsTxtContent(text, cleanDomain);

    // Also probe /llms-full.txt
    const fullRes = await fetchWithTimeout(`https://${cleanDomain}/llms-full.txt`, 3000);
    const llmsFullTxtFound = Boolean(fullRes && fullRes.ok);

    const mdEndpointsAvailable = text.includes('.md') || validation.mdLinksCount > 0;

    return {
      llmsTxtFound: true,
      llmsFullTxtFound,
      mdEndpointsAvailable,
      syntaxScore: validation.score,
      rawContent: text,
      statusCode: res.status
    };
  }

  return {
    llmsTxtFound: false,
    llmsFullTxtFound: false,
    mdEndpointsAvailable: false,
    syntaxScore: 0,
    statusCode: res ? res.status : 404
  };
}

// 2. Probe B: Live fetch & parsing of /robots.txt for AI search/training bots
export async function probeB_RobotsTxtCheck(domain: string): Promise<ProbeBResult> {
  const cleanDomain = domain.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
  const targetUrl = `https://${cleanDomain}/robots.txt`;

  let res = await fetchWithTimeout(targetUrl);
  if (!res || !res.ok) {
    res = await fetchWithTimeout(`http://${cleanDomain}/robots.txt`);
  }

  if (res && res.ok) {
    const text = await res.text();
    const lines = text.split('\n');

    let currentAgents: string[] = [];
    const agentRules: Record<string, { allow: string[]; disallow: string[] }> = {};

    for (let line of lines) {
      line = line.trim();
      if (line.startsWith('#') || !line) continue;

      const [key, ...valParts] = line.split(':');
      const keyLower = key.trim().toLowerCase();
      const val = valParts.join(':').trim();

      if (keyLower === 'user-agent') {
        const agentName = val.toLowerCase();
        currentAgents.push(agentName);
        if (!agentRules[agentName]) {
          agentRules[agentName] = { allow: [], disallow: [] };
        }
      } else if (keyLower === 'disallow' || keyLower === 'allow') {
        for (const agent of currentAgents) {
          if (agentRules[agent]) {
            agentRules[agent][keyLower as 'allow' | 'disallow'].push(val);
          }
        }
      }
    }

    const checkBotStatus = (botName: string): 'Allowed' | 'Disallowed' | 'Restricted' => {
      const rules = agentRules[botName.toLowerCase()] || agentRules['*'];
      if (!rules) return 'Allowed'; // Default allowed if unspecified
      const hasFullBlock = rules.disallow.some((p) => p === '/' || p === '/*');
      return hasFullBlock ? (botName.includes('Training') || botName.includes('GPTBot') || botName.includes('ClaudeBot') ? 'Restricted' : 'Disallowed') : 'Allowed';
    };

    const oaiSearchBot = checkBotStatus('oai-searchbot') === 'Disallowed' ? 'Disallowed' : 'Allowed';
    const claudeSearchBot = checkBotStatus('claude-searchbot') === 'Disallowed' ? 'Disallowed' : 'Allowed';
    const perplexityBot = checkBotStatus('perplexitybot') === 'Disallowed' ? 'Disallowed' : 'Allowed';
    const gptBotTraining = checkBotStatus('gptbot');
    const claudeBotTraining = checkBotStatus('claudebot');

    const searchBotsAllowed = oaiSearchBot === 'Allowed' && claudeSearchBot === 'Allowed' && perplexityBot === 'Allowed';

    return {
      robotsTxtFound: true,
      searchBotsAllowed,
      oaiSearchBot,
      claudeSearchBot,
      perplexityBot,
      gptBotTraining: gptBotTraining === 'Disallowed' ? 'Restricted' : 'Allowed',
      claudeBotTraining: claudeBotTraining === 'Disallowed' ? 'Restricted' : 'Allowed',
      rawRobotsTxt: text
    };
  }

  return {
    robotsTxtFound: false,
    searchBotsAllowed: true, // Default assumed allowed if no robots.txt exists
    oaiSearchBot: 'Allowed',
    claudeSearchBot: 'Allowed',
    perplexityBot: 'Allowed',
    gptBotTraining: 'Allowed',
    claudeBotTraining: 'Allowed'
  };
}

// 3. Probe C: Live fetch of root HTML, TTFB measurement, JSON-LD schema parsing
export async function probeC_JsonLdScrape(domain: string): Promise<ProbeCResult> {
  const cleanDomain = domain.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
  const startTime = Date.now();

  let isHttps = true;
  let res = await fetchWithTimeout(`https://${cleanDomain}`);
  if (!res) {
    isHttps = false;
    res = await fetchWithTimeout(`http://${cleanDomain}`);
  }

  const ttfbMs = Date.now() - startTime;

  if (res && res.ok) {
    const html = await res.text();
    
    // Extract JSON-LD scripts
    const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    const schemasFound = new Set<ProbeCResult['schemasFound'][number]>();
    let isValidSyntax = false;

    let match;
    while ((match = jsonLdRegex.exec(html)) !== null) {
      try {
        const parsed = JSON.parse(match[1].trim());
        isValidSyntax = true;
        
        const items = Array.isArray(parsed) ? parsed : [parsed];
        for (const item of items) {
          const type = item['@type'];
          if (typeof type === 'string') {
            if (['Organization', 'SoftwareApplication', 'Product', 'FAQPage', 'TechArticle', 'WebSite'].includes(type)) {
              schemasFound.add(type as ProbeCResult['schemasFound'][number]);
            }
          } else if (Array.isArray(type)) {
            type.forEach((t) => {
              if (['Organization', 'SoftwareApplication', 'Product', 'FAQPage', 'TechArticle', 'WebSite'].includes(t)) {
                schemasFound.add(t as ProbeCResult['schemasFound'][number]);
              }
            });
          }
        }
      } catch {
        // Invalid JSON-LD block syntax
      }
    }

    // Calculate content density (strip HTML tags vs total length)
    const textOnly = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const contentDensityPercent = Math.min(95, Math.max(10, Math.round((textOnly.length / (html.length || 1)) * 100)));

    return {
      reachable: true,
      isHttps,
      ttfbMs,
      statusCode: res.status,
      hasJsonLd: schemasFound.size > 0,
      schemasFound: Array.from(schemasFound),
      isValidSyntax,
      contentDensityPercent
    };
  }

  return {
    reachable: false,
    isHttps: false,
    ttfbMs: ttfbMs,
    statusCode: res ? res.status : 500,
    hasJsonLd: false,
    schemasFound: [],
    isValidSyntax: false,
    contentDensityPercent: 0
  };
}

// 4. Probe D: Multi-Model Citation Query
export async function probeD_MultiModelCitationQuery(domain: string): Promise<ProbeDResult> {
  // Try OpenRouter first (unified gateway for multiple LLMs)
  let citations = await evaluateBrandCitationsOpenRouter(domain, [
    `best tool for ${domain}`,
    `${domain} platform capabilities`
  ]);

  // If OpenRouter didn't return results, try direct OpenAI
  if (citations.length === 0) {
    citations = await evaluateBrandCitationsOpenAI(domain, [
      `best tool for ${domain}`,
      `${domain} platform capabilities`
    ]);
  }

  return {
    engineCitations: citations
  };
}

// Execute Probes A, B, C, D concurrently via Promise.all
export async function runParallelEdgeProbes(domain: string): Promise<ParallelProbesReport> {
  const startTime = Date.now();

  const [probeA, probeB, probeC, probeD] = await Promise.all([
    probeA_LlmsTxtCheck(domain),
    probeB_RobotsTxtCheck(domain),
    probeC_JsonLdScrape(domain),
    probeD_MultiModelCitationQuery(domain)
  ]);

  const executionTimeMs = Date.now() - startTime;

  return {
    domain,
    executionTimeMs,
    probeA,
    probeB,
    probeC,
    probeD
  };
}
