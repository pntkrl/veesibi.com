"use client";

import { useState } from "react";
import Link from "next/link";
import { validateLlmsTxtContent, LlmsValidationResult } from "@/lib/llms-validator";

export default function LlmsValidatorPage() {
  const [domainInput, setDomainInput] = useState("aiqualityhq.com");
  const [isFetching, setIsFetching] = useState(false);
  const [fetchedUrl, setFetchedUrl] = useState<string | null>(null);
  const [rawContent, setRawContent] = useState<string>(`# AIQualityHQ — LLM & AI Training Guidelines (llms.txt)

> AIQualityHQ is a static-first, privacy-focused web application and suite of tools designed to measure, evaluate, and audit AI prompt quality.

## Core Documentation
- [Homepage & Tools](https://aiqualityhq.com): Main suite of AI prompt quality metrics.
- [Prompt Audit Spec](https://aiqualityhq.com/docs): Technical references and prompt scoring benchmarks.
- [Privacy Policy](https://aiqualityhq.com/privacy): Data isolation protocols.
`);

  const [validationResult, setValidationResult] = useState<LlmsValidationResult>(
    validateLlmsTxtContent(rawContent, "aiqualityhq.com")
  );

  const handleFetchLiveDomain = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!domainInput.trim()) return;

    setIsFetching(true);
    const cleanDomain = domainInput.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0].trim();

    try {
      const response = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: cleanDomain }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.audit?.rawLlmsTxt || data.audit?.generatedLlmsTxt || "";
        setRawContent(content);
        setFetchedUrl(`https://${cleanDomain}/llms.txt`);
        setValidationResult(validateLlmsTxtContent(content, cleanDomain));
      } else {
        setFetchedUrl(`https://${cleanDomain}/llms.txt (Fallback Template)`);
      }
    } catch {
      setFetchedUrl(`https://${cleanDomain}/llms.txt (Fallback Template)`);
    } finally {
      setIsFetching(false);
    }
  };

  const handleTextChange = (text: string) => {
    setRawContent(text);
    setValidationResult(validateLlmsTxtContent(text, domainInput || "example.com"));
  };

  return (
    <div className="py-16 bg-[var(--background)] min-h-screen">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-600 dark:text-violet-400 font-mono text-xs font-semibold mb-3">
            <span>Official Specification Standard</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
            llms.txt Live Fetch & Token Validator
          </h1>
          <p className="mt-4 text-base text-neutral-600 dark:text-neutral-400 leading-relaxed">
            Fetch and validate any domain's live <code className="font-mono text-xs bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">/llms.txt</code> or <code className="font-mono text-xs bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">/llm.txt</code> file against Jeremy Howard's September 2024 specification.
          </p>
        </div>

        {/* Live URL Fetcher Form */}
        <div className="p-6 rounded-2xl border border-hairline bg-[var(--background-soft)] card-vercel-shadow mb-12">
          <form onSubmit={handleFetchLiveDomain} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-3 text-neutral-400 font-mono text-xs">https://</span>
              <input
                type="text"
                value={domainInput}
                onChange={(e) => setDomainInput(e.target.value)}
                placeholder="aiqualityhq.com or stripe.com"
                className="w-full h-11 pl-20 pr-4 rounded-xl border border-hairline bg-[var(--background)] font-mono text-xs text-neutral-900 dark:text-white placeholder:text-neutral-500 focus:outline-none focus:border-violet-500"
              />
            </div>
            <button
              type="submit"
              disabled={isFetching}
              className="h-11 px-6 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-mono text-xs font-bold hover:opacity-90 transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isFetching ? "Fetching Live..." : "Fetch & Validate /llms.txt →"}
            </button>
          </form>

          {fetchedUrl && (
            <div className="mt-3 font-mono text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <span>✓ Target fetched:</span>
              <span className="font-bold underline">{fetchedUrl}</span>
            </div>
          )}
        </div>

        {/* Interactive Editor & Live Validator Results */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 font-mono text-xs">
          {/* Markdown Content Editor */}
          <div className="p-6 rounded-2xl bg-neutral-950 text-white border border-neutral-800">
            <h3 className="font-bold text-sm text-violet-400 mb-3">Live Markdown Content</h3>
            <textarea
              rows={16}
              value={rawContent}
              onChange={(e) => handleTextChange(e.target.value)}
              className="w-full p-4 rounded-xl bg-neutral-900 border border-neutral-800 text-emerald-400 font-mono text-xs leading-relaxed focus:outline-none focus:border-violet-500"
            />
          </div>

          {/* Real-Time Validator Diagnostics */}
          <div className="p-6 rounded-2xl bg-[var(--background-soft)] border border-hairline flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-hairline mb-4">
                <h3 className="font-bold text-sm text-neutral-900 dark:text-white">Validation Score</h3>
                <span className="text-2xl font-black text-violet-600 dark:text-violet-400">
                  {validationResult.score}/100
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-500">H1 Header Present:</span>
                  <span className={validationResult.h1Title ? "text-emerald-500 font-bold" : "text-rose-500 font-bold"}>
                    {validationResult.h1Title ? "✓ Passed" : "✗ Missing # Header"}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-500">Blockquote Summary:</span>
                  <span className={validationResult.summaryBlockquote ? "text-emerald-500 font-bold" : "text-amber-500 font-bold"}>
                    {validationResult.summaryBlockquote ? "✓ Passed" : "⚠ Missing > Summary"}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-500">Markdown Links Count:</span>
                  <span className="font-bold text-neutral-900 dark:text-white">{validationResult.mdLinksCount} links</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-500">Estimated Token Savings:</span>
                  <span className="font-bold text-emerald-500">{validationResult.tokenSavingsPercent}% reduced</span>
                </div>
              </div>

              {validationResult.errors.length > 0 && (
                <div className="mt-6 pt-4 border-t border-hairline space-y-2">
                  <h4 className="font-bold text-neutral-900 dark:text-white text-xs">Detected Errors & Warnings:</h4>
                  {validationResult.errors.map((err, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-[11px]">
                      <strong>[{err.code}]</strong>: {err.message}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-hairline text-[11px] text-neutral-500">
              VEESIBI auto-validates against H1 syntax, blockquote density, and markdown link resolution.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
