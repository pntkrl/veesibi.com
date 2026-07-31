import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free llms.txt Syntax & Token Validator | VEESIBI Developer Tools",
  description:
    "Validate your site's /llms.txt file against Jeremy Howard's September 2024 specification. Check H1 header, blockquote summary, markdown links, and token savings.",
};

export default function LlmsValidatorPage() {
  return (
    <div className="py-16 bg-[var(--background)] min-h-screen">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-600 dark:text-violet-400 font-mono text-xs font-semibold mb-3">
            <span>Official Specification Standard</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
            llms.txt Specification & Validation Engine
          </h1>
          <p className="mt-4 text-base text-neutral-600 dark:text-neutral-400 leading-relaxed">
            The <code className="font-mono text-xs bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">/llms.txt</code> standard provides structured Markdown summaries to guide AI language models through web content without consuming excessive context window capacity.
          </p>
        </div>

        {/* Specification Reference Diagram */}
        <div className="p-8 rounded-2xl border border-hairline bg-[var(--background-soft)] card-vercel-shadow mb-12">
          <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-neutral-400 mb-4">
            Specification Structure Layout
          </h2>
          <div className="p-6 rounded-xl bg-neutral-950 text-emerald-400 font-mono text-xs overflow-x-auto leading-relaxed border border-neutral-800">
{`├── # Project Name (Required H1 Header)
├── > Short Summary Blockquote (Recommended 1-2 Sentences)
├── System Context & Operating Guidance (Optional Prose)
├── ## Core Section Header (H2 Group)
│   ├── [Title](https://domain.com/page): Markdown link + context note
│   └── [Title](https://domain.com/page.md): Direct Markdown target link
└── ## Optional Section Header (H2 Group - Skippable Content)
    └── [Secondary Link](URL): Context for deep agent retrieval`}
          </div>
        </div>

        {/* Diagnostic Error Matrix Table */}
        <div className="rounded-2xl border border-hairline bg-[var(--background-soft)] overflow-hidden card-vercel-shadow mb-12">
          <div className="p-6 border-b border-hairline">
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
              Diagnostic Error Matrix & Code Fixes
            </h3>
            <p className="mt-1 text-xs text-neutral-500">
              VEESIBI checks every /llms.txt file against these 7 diagnostic rule codes.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-[var(--background-soft-2)] border-b border-hairline text-neutral-500 uppercase">
                <tr>
                  <th className="py-3.5 px-6 font-semibold">Error Code</th>
                  <th className="py-3.5 px-6 font-semibold">Detection Logic</th>
                  <th className="py-3.5 px-6 font-semibold">Severity</th>
                  <th className="py-3.5 px-6 font-semibold">Automated Remediation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                <tr className="hover:bg-[var(--background)]">
                  <td className="py-4 px-6 font-bold text-rose-500">ERR_MISSING_FILE</td>
                  <td className="py-4 px-6 font-sans">HTTP 404/500 at /llms.txt.</td>
                  <td className="py-4 px-6 font-bold text-rose-600">Critical</td>
                  <td className="py-4 px-6 font-sans">Run Auto-Builder to generate initial file.</td>
                </tr>
                <tr className="hover:bg-[var(--background)]">
                  <td className="py-4 px-6 font-bold text-rose-500">ERR_INVALID_H1</td>
                  <td className="py-4 px-6 font-sans">Missing # header or multiple H1 elements present.</td>
                  <td className="py-4 px-6 font-bold text-amber-600">High</td>
                  <td className="py-4 px-6 font-sans">Restructure header to feature exactly one # Brand line.</td>
                </tr>
                <tr className="hover:bg-[var(--background)]">
                  <td className="py-4 px-6 font-bold text-rose-500">ERR_NO_BLOCKQUOTE</td>
                  <td className="py-4 px-6 font-sans">Absence of &gt; blockquote directly beneath H1.</td>
                  <td className="py-4 px-6 font-bold text-amber-600">Medium</td>
                  <td className="py-4 px-6 font-sans">Insert concise 150-character summary in a &gt; blockquote.</td>
                </tr>
                <tr className="hover:bg-[var(--background)]">
                  <td className="py-4 px-6 font-bold text-rose-500">ERR_BROKEN_LINK</td>
                  <td className="py-4 px-6 font-sans">Hyperlink within file returns 4xx/5xx status.</td>
                  <td className="py-4 px-6 font-bold text-rose-600">Critical</td>
                  <td className="py-4 px-6 font-sans">Remove or update broken URL references.</td>
                </tr>
                <tr className="hover:bg-[var(--background)]">
                  <td className="py-4 px-6 font-bold text-rose-500">ERR_TOKEN_WASTE</td>
                  <td className="py-4 px-6 font-sans">Links point to heavy HTML instead of clean .md endpoints.</td>
                  <td className="py-4 px-6 font-bold text-amber-600">Medium</td>
                  <td className="py-4 px-6 font-sans">Append .md extensions or serve pure markdown.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="text-center">
          <Link
            href="/#llms-validator"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-mono text-xs font-semibold hover:opacity-90 transition shadow"
          >
            <span>Launch Live Interactive Validator Workspace</span>
            <span>→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
