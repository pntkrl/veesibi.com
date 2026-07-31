export interface LlmsValidationError {
  code: 'ERR_MISSING_FILE' | 'ERR_INVALID_H1' | 'ERR_NO_BLOCKQUOTE' | 'ERR_BROKEN_LINK' | 'ERR_TOKEN_WASTE' | 'ERR_MISSING_FULL' | 'ERR_VERBOSE_CONTEXT';
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  line?: number;
  recommendation: string;
}

export interface LlmsValidationResult {
  isValid: boolean;
  score: number;
  h1Title: string | null;
  summaryBlockquote: string | null;
  sections: { title: string; linkCount: number }[];
  totalLinks: number;
  mdLinksCount: number;
  estimatedTokens: number;
  tokenSavingsPercent: number;
  errors: LlmsValidationError[];
  cleanedContent: string;
}

export function validateLlmsTxtContent(content: string, domain: string = 'example.com'): LlmsValidationResult {
  const lines = content.split('\n');
  const errors: LlmsValidationError[] = [];
  
  let h1Title: string | null = null;
  let h1LineIndex = -1;
  let summaryBlockquote: string | null = null;
  let hasBlockquoteUnderH1 = false;
  
  const sections: { title: string; linkCount: number }[] = [];
  let currentSection: { title: string; linkCount: number } | null = null;
  
  let totalLinks = 0;
  let mdLinksCount = 0;

  // Track H1 occurrences
  let h1Count = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Check H1
    if (line.startsWith('# ')) {
      h1Count++;
      if (h1Count === 1) {
        h1Title = line.substring(2).trim();
        h1LineIndex = i;
      }
    }

    // Check Blockquote under H1
    if (h1LineIndex !== -1 && i > h1LineIndex && !summaryBlockquote) {
      if (line.startsWith('>')) {
        summaryBlockquote = line.substring(1).trim();
        hasBlockquoteUnderH1 = true;
      } else if (line.length > 0 && !line.startsWith('#')) {
        // Text encountered before blockquote
      }
    }

    // Check H2
    if (line.startsWith('## ')) {
      if (currentSection) {
        sections.push(currentSection);
      }
      currentSection = { title: line.substring(3).trim(), linkCount: 0 };
    }

    // Check links [Text](URL)
    const linkMatches = line.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g);
    for (const match of linkMatches) {
      totalLinks++;
      const url = match[2];
      if (url.endsWith('.md') || url.includes('/llms') || url.includes('.md#')) {
        mdLinksCount++;
      }
      if (currentSection) {
        currentSection.linkCount++;
      }
    }
  }

  if (currentSection) {
    sections.push(currentSection);
  }

  // Validate Rules
  if (!h1Title || h1Count === 0) {
    errors.push({
      code: 'ERR_INVALID_H1',
      severity: 'high',
      message: 'Missing single H1 header (# Project Name). Exactly one H1 is required.',
      line: 1,
      recommendation: `Add "# ${domain.split('.')[0].toUpperCase()}" as the first line of the file.`
    });
  } else if (h1Count > 1) {
    errors.push({
      code: 'ERR_INVALID_H1',
      severity: 'high',
      message: 'Multiple H1 elements found. The llms.txt spec requires exactly one H1 header.',
      recommendation: 'Demote secondary # headers to ## section headers.'
    });
  }

  if (!hasBlockquoteUnderH1 || !summaryBlockquote) {
    errors.push({
      code: 'ERR_NO_BLOCKQUOTE',
      severity: 'medium',
      message: 'Absence of blockquote summary (> 1-2 sentence summary) directly beneath H1.',
      line: h1LineIndex !== -1 ? h1LineIndex + 2 : 2,
      recommendation: 'Insert a concise 150-character summary directly beneath the H1 title using "> Summary text".'
    });
  }

  if (totalLinks === 0) {
    errors.push({
      code: 'ERR_MISSING_FILE',
      severity: 'high',
      message: 'No Markdown hyperlinks found. An llms.txt file should contain bulleted links to core docs.',
      recommendation: 'Add structured H2 section lists containing markdown links [Title](URL).'
    });
  }

  if (totalLinks > 0 && mdLinksCount === 0) {
    errors.push({
      code: 'ERR_TOKEN_WASTE',
      severity: 'medium',
      message: 'Links point to full HTML pages rather than clean .md documentation endpoints.',
      recommendation: 'Append .md extensions or serve clean markdown endpoints to minimize LLM token expenditure.'
    });
  }

  const wordCount = content.split(/\s+/).length;
  const estimatedTokens = Math.round(wordCount * 1.3);

  if (estimatedTokens > 2500) {
    errors.push({
      code: 'ERR_VERBOSE_CONTEXT',
      severity: 'medium',
      message: `File exceeds 2,500 estimated tokens (${estimatedTokens} tokens). Keep primary llms.txt under 500 lines.`,
      recommendation: 'Move detailed prose into linked documentation files or a separate /llms-full.txt file.'
    });
  }

  let score = 100 - errors.length * 18;
  if (score < 20) score = 20;

  const brandName = domain.split('.')[0].toUpperCase();
  const cleanedContent = `# ${h1Title || brandName}
> ${summaryBlockquote || `${brandName} (${domain}) - Official documentation and system reference for AI agents and LLMs.`}

## Core Documentation
- [Overview & Getting Started](https://${domain}/docs): Main overview and core system concepts.
- [API Reference & Endpoints](https://${domain}/api): Comprehensive API routes and endpoint specifications.
- [Pricing & Subscriptions](https://${domain}/pricing): Transparent plans and service tiers.

## Optional Context
- [Changelog & Releases](https://${domain}/changelog.md): Detailed release notes and updates.
- [Security & Terms](https://${domain}/terms.md): Data privacy and system terms.
`;

  return {
    isValid: errors.length === 0,
    score,
    h1Title: h1Title || brandName,
    summaryBlockquote: summaryBlockquote || `${brandName} platform overview.`,
    sections,
    totalLinks,
    mdLinksCount,
    estimatedTokens,
    tokenSavingsPercent: Math.min(85, Math.max(45, 100 - Math.round((estimatedTokens / 5000) * 100))),
    errors,
    cleanedContent
  };
}
