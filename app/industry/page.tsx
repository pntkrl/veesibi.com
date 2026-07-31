import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Search Visibility Industry Benchmarks | VEESIBI pSEO",
  description: "Browse AI search visibility benchmarks and category Share of Voice reports across SaaS, FinTech, E-Commerce, and Developer Tools.",
};

export default function IndustryDirectoryPage() {
  const categories = [
    { slug: 'saas', name: 'Software as a Service (SaaS)', description: 'Productivity, workflow, and B2B SaaS platforms.' },
    { slug: 'fintech', name: 'FinTech & Payments', description: 'Payment gateways, banking infrastructure, and crypto.' },
    { slug: 'developer-tools', name: 'Developer Tools & Cloud', description: 'DevOps, CI/CD, hosting, and developer infrastructure.' },
    { slug: 'ai-infrastructure', name: 'AI & ML Infrastructure', description: 'LLM platforms, vector databases, and AI tooling.' },
    { slug: 'e-commerce', name: 'E-Commerce & Retail', description: 'Online storefronts, inventory, and retail platforms.' },
    { slug: 'cybersecurity', name: 'Cybersecurity & IAM', description: 'Identity, security compliance, and zero-trust software.' }
  ];

  return (
    <div className="py-16 bg-[var(--background)] min-h-screen">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="border-b border-hairline pb-6 mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 font-mono text-xs font-semibold mb-2">
            <span>Industry Sector Benchmarks</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
            Category Share of Voice Benchmarks
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            Sector-wide AI search visibility scorecards and prompt placement analysis.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.map((item) => (
            <Link
              key={item.slug}
              href={`/industry/${item.slug}`}
              className="p-6 rounded-2xl bg-[var(--background-soft)] border border-hairline hover:border-cyan-500/50 transition card-vercel-shadow"
            >
              <h3 className="text-xl font-bold text-neutral-900 dark:text-white font-mono">
                {item.name}
              </h3>
              <p className="mt-2 text-xs text-neutral-500">
                {item.description}
              </p>
              <div className="mt-4 pt-3 border-t border-hairline font-mono text-xs text-cyan-600 dark:text-cyan-400 font-bold flex items-center justify-between">
                <span>Explore Sector Benchmarks</span>
                <span>→</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
