import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import JsonLd from "@/components/json-ld";
import AuthProvider from "@/components/auth-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VEESIBI — Instant Domain AI Visibility Scorecard & llms.txt Validator",
  description:
    "Measure & maximize your domain's AI Search visibility. Free unauthenticated AI audit, robots.txt bot permission check, llms.txt syntax validator, and multi-engine citation tracking.",
  keywords: [
    "VEESIBI",
    "AI Visibility Scorecard",
    "llms.txt validator",
    "GEO tools",
    "Answer Engine Optimization",
    "Generative Engine Optimization",
    "AI crawler audit",
    "ChatGPT search ranking",
    "Perplexity SEO"
  ],
  authors: [{ name: "VEESIBI Team", url: "https://veesibi.com" }],
  openGraph: {
    title: "VEESIBI — Instant Domain AI Visibility Scorecard",
    description:
      "Audit your website's AI Search visibility, llms.txt compliance, and AI crawler permissions in under 3 seconds.",
    url: "https://veesibi.com",
    siteName: "VEESIBI",
    type: "website",
  },
};

import HeaderNav from "@/components/header-nav";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "VEESIBI",
    url: "https://veesibi.com",
    logo: "https://veesibi.com/logo.png",
    description:
      "AI Search Visibility Scorecard platform measuring domain visibility across ChatGPT, Perplexity, Google AI Overviews, and Claude.",
    sameAs: [
      "https://github.com/veesibi",
      "https://twitter.com/veesibi",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      email: "enterprise@veesibi.com",
      contactType: "sales",
    },
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "VEESIBI",
    url: "https://veesibi.com",
    description:
      "Instant AI Visibility Scorecard — measure and maximize your domain's AI search presence.",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://veesibi.com/score/{search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <JsonLd data={organizationSchema} />
        <JsonLd data={websiteSchema} />
      </head>
      <body className="min-h-full flex flex-col bg-[var(--background)] text-[var(--foreground)] selection:bg-neutral-900 selection:text-white dark:selection:bg-white dark:selection:text-black">
        <AuthProvider>
          {/* Navigation Bar */}
          <HeaderNav />

          {/* Main Content */}
          <div className="flex-1">{children}</div>

        {/* Global Footer */}
        <footer className="border-t border-hairline bg-[var(--background-soft)] py-12 text-xs text-neutral-500 dark:text-neutral-400">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 font-mono text-sm font-bold text-neutral-900 dark:text-white">
                  <span>VEESIBI</span>
                  <span className="text-xs font-normal text-neutral-500">veesibi.com</span>
                </div>
                <p className="max-w-xs text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  The universal Speedtest + PageSpeed Insights for AI Search and LLM crawlers. Free unauthenticated domain scorecards in under 3 seconds.
                </p>
              </div>

              <div>
                <h4 className="font-mono font-semibold uppercase text-neutral-900 dark:text-white tracking-wider mb-3">
                  Products & Tools
                </h4>
                <ul className="space-y-2">
                  <li><Link href="/" className="hover:text-neutral-900 dark:hover:text-white">Instant AI Scorecard Engine</Link></li>
                  <li><Link href="/llms-txt/validator" className="hover:text-neutral-900 dark:hover:text-white">llms.txt Parser & Validator</Link></li>
                  <li><Link href="/badge/veesibi.com" className="hover:text-neutral-900 dark:hover:text-white">Verified AI-Ready Badge</Link></li>
                  <li><Link href="/#pricing" className="hover:text-neutral-900 dark:hover:text-white">Agency & Pro Pricing</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="font-mono font-semibold uppercase text-neutral-900 dark:text-white tracking-wider mb-3">
                  Programmatic SEO
                </h4>
                <ul className="space-y-2">
                  <li><Link href="/score/stripe.com" className="hover:text-neutral-900 dark:hover:text-white">stripe.com AI Scorecard</Link></li>
                  <li><Link href="/score/linear.app" className="hover:text-neutral-900 dark:hover:text-white">linear.app AI Scorecard</Link></li>
                  <li><Link href="/score/vercel.com" className="hover:text-neutral-900 dark:hover:text-white">vercel.com AI Scorecard</Link></li>
                  <li><Link href="/compare/stripe.com-vs-paypal.com" className="hover:text-neutral-900 dark:hover:text-white">Stripe vs PayPal GEO Audit</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="font-mono font-semibold uppercase text-neutral-900 dark:text-white tracking-wider mb-3">
                  Standards & Spec
                </h4>
                <ul className="space-y-2 font-mono text-[11px]">
                  <li>[✓] llms.txt Specification (Jeremy Howard)</li>
                  <li>[✓] OAI-SearchBot & Claude-SearchBot</li>
                  <li>[✓] JSON-LD Schema Validation</li>
                  <li>[✓] GEO & AEO Share of Voice</li>
                </ul>
              </div>
            </div>

            <div className="mt-8 flex flex-col items-center justify-between border-t border-hairline pt-6 sm:flex-row">
              <p>© {new Date().getFullYear()} VEESIBI (veesibi.com). All rights reserved.</p>
              <p className="mt-2 font-mono text-[11px] sm:mt-0">
                Powered by Edge AST Processing • Zero Cold Starts
              </p>
            </div>
          </div>
        </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
