import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Search Versus Benchmarks Directory | VEESIBI pSEO",
  description: "Compare head-to-head AI search visibility scores, /llms.txt specs, and citation Share of Voice between competing SaaS platforms.",
};

export default function CompareDirectoryPage() {
  const comparisons = [
    { slug: 'stripe.com-vs-paypal.com', title: 'Stripe vs PayPal', category: 'FinTech & Payments' },
    { slug: 'linear.app-vs-jira.com', title: 'Linear vs Jira', category: 'Developer & Project Tools' },
    { slug: 'vercel.com-vs-netlify.com', title: 'Vercel vs Netlify', category: 'Cloud Infrastructure' },
    { slug: 'supabase.com-vs-firebase.com', title: 'Supabase vs Firebase', category: 'Database & Backend' },
    { slug: 'notion.so-vs-confluence.com', title: 'Notion vs Confluence', category: 'Knowledge Management' },
    { slug: 'hubspot.com-vs-salesforce.com', title: 'HubSpot vs Salesforce', category: 'CRM & Marketing' }
  ];

  return (
    <div className="py-16 bg-[var(--background)] min-h-screen">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="border-b border-hairline pb-6 mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 font-mono text-xs font-semibold mb-2">
            <span>Versus Benchmarks Matrix</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
            Head-to-Head AI Search Comparisons
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            Compare Share of Voice, /llms.txt compliance, and AI crawler access across competing industry platforms.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {comparisons.map((item) => (
            <Link
              key={item.slug}
              href={`/compare/${item.slug}`}
              className="p-6 rounded-2xl bg-[var(--background-soft)] border border-hairline hover:border-cyan-500/50 transition card-vercel-shadow"
            >
              <span className="font-mono text-[10px] font-bold uppercase text-cyan-600 dark:text-cyan-400 block mb-1">
                {item.category}
              </span>
              <h3 className="text-xl font-bold text-neutral-900 dark:text-white font-mono">
                {item.title}
              </h3>
              <p className="mt-2 text-xs text-neutral-500">
                Detailed AI visibility benchmark comparison report.
              </p>
              <div className="mt-4 pt-3 border-t border-hairline font-mono text-xs text-cyan-600 dark:text-cyan-400 font-bold flex items-center justify-between">
                <span>View Full Comparison</span>
                <span>→</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
