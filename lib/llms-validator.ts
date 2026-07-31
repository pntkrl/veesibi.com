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

export interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  text: string;
}

export interface DiffResult {
  diffLines: DiffLine[];
  addedCount: number;
  removedCount: number;
  unchangedCount: number;
}

export function computeLlmsDiff(originalText: string, fixedText: string): DiffResult {
  const origLines = originalText.split('\n');
  const fixedLines = fixedText.split('\n');

  const diffLines: DiffLine[] = [];
  let addedCount = 0;
  let removedCount = 0;
  let unchangedCount = 0;

  const origSet = new Set(origLines.map(l => l.trim()));
  const fixedSet = new Set(fixedLines.map(l => l.trim()));

  // Lines removed from original
  for (const line of origLines) {
    if (line.trim() && !fixedSet.has(line.trim())) {
      diffLines.push({ type: 'removed', text: line });
      removedCount++;
    }
  }

  // Lines added in fixed
  for (const line of fixedLines) {
    if (line.trim() && !origSet.has(line.trim())) {
      diffLines.push({ type: 'added', text: line });
      addedCount++;
    } else if (line.trim()) {
      diffLines.push({ type: 'unchanged', text: line });
      unchangedCount++;
    }
  }

  return { diffLines, addedCount, removedCount, unchangedCount };
}

export function validateLlmsTxtContent(content: string, domain: string = 'example.com'): LlmsValidationResult {
  const lines = content.split('\n');
  const errors: LlmsValidationError[] = [];
  
  let h1Title: string | null = null;
  let h1LineIndex = -1;
  let summaryBlockquote: string | null = null;
  let hasBlockquoteUnderH1 = false;
  let totalLinks = 0;
  let mdLinksCount = 0;
  const sections: { title: string; linkCount: number }[] = [];
  let currentSection: { title: string; linkCount: number } | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith('# ')) {
      if (!h1Title) {
        h1Title = line.replace(/^#\s+/, '').trim();
        h1LineIndex = i;
      } else {
        errors.push({
          code: 'ERR_INVALID_H1',
          severity: 'high',
          message: `Multiple H1 headers found at line ${i + 1}.`,
          line: i + 1,
          recommendation: 'Use a single # H1 header for your site title.'
        });
      }
    }

    if (line.startsWith('> ') && (i === h1LineIndex + 1 || i === h1LineIndex + 2)) {
      summaryBlockquote = line.replace(/^>\s+/, '').trim();
      hasBlockquoteUnderH1 = true;
    }

    if (line.startsWith('## ')) {
      if (currentSection) sections.push(currentSection);
      currentSection = { title: line.replace(/^##\s+/, '').trim(), linkCount: 0 };
    }

    const mdLinkMatches = line.match(/\[([^\]]+)\]\(([^)]+)\)/g);
    if (mdLinkMatches) {
      totalLinks += mdLinkMatches.length;
      if (currentSection) currentSection.linkCount += mdLinkMatches.length;
      mdLinkMatches.forEach((linkMatch) => {
        if (linkMatch.includes('.md)') || linkMatch.includes('.md#')) {
          mdLinksCount++;
        }
      });
    }
  }

  if (currentSection) sections.push(currentSection);

  if (!h1Title) {
    errors.push({
      code: 'ERR_INVALID_H1',
      severity: 'critical',
      message: 'Missing required H1 header (# Title) at the top of the file.',
      line: 1,
      recommendation: 'Add "# Your Brand Name" as the first line of your llms.txt file.'
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

  // Smart Content Preservation Auto-Fix
  const brandName = domain.split('.')[0].toUpperCase();
  const outputLines: string[] = [];
  let h1Added = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Demote secondary H1 headers to H2 headers (single H1 rule)
    if (line.trim().startsWith('# ') && h1Added) {
      line = '## ' + line.trim().substring(2);
    }

    if (line.trim().startsWith('# ') && !h1Added) {
      h1Added = true;
      outputLines.push(line);
      // Check if next line is a blockquote
      const nextLine = lines[i + 1] ? lines[i + 1].trim() : '';
      if (!nextLine.startsWith('>')) {
        outputLines.push(`> ${summaryBlockquote || `${brandName} (${domain}) - Official documentation and system reference for AI agents and LLMs.`}`);
      }
      continue;
    }

    outputLines.push(line);
  }

  // If file was missing H1 title altogether, prepend H1 and blockquote at top
  if (!h1Added) {
    outputLines.unshift(
      `# ${brandName}`,
      `> ${brandName} (${domain}) - Official documentation and system reference for AI agents and LLMs.`,
      ''
    );
  }

  // If file has zero markdown links, append structured H2 documentation section with links
  if (totalLinks === 0) {
    outputLines.push(
      '',
      '## Core Documentation',
      `- [Homepage & Overview](https://${domain}): Main platform overview and system capabilities.`,
      `- [Documentation & Guides](https://${domain}/docs): Technical guides and API specifications.`,
      `- [Privacy Policy](https://${domain}/privacy): Data protection and terms.`
    );
  }

  // Convert existing HTML links to .md endpoints for token efficiency
  if (totalLinks > 0 && mdLinksCount === 0) {
    for (let i = 0; i < outputLines.length; i++) {
      const line = outputLines[i];
      if (line.includes('](') && line.includes(')')) {
        outputLines[i] = line.replace(/\]\(([^)]+)\)/g, (match, url) => {
          const trimmedUrl = url.trim();
          if (trimmedUrl.includes('/') && !trimmedUrl.endsWith('.md') && !trimmedUrl.endsWith('.md/')) {
            const hashIdx = trimmedUrl.indexOf('#');
            if (hashIdx !== -1) {
              return `](${trimmedUrl.substring(0, hashIdx)}.md${trimmedUrl.substring(hashIdx)})`;
            }
            return `](${trimmedUrl}.md)`;
          }
          return match;
        });
      }
    }
  }

  const cleanedContent = outputLines.join('\n');

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
