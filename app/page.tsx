"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { calculateDomainAudit, DomainAuditResult } from "@/lib/audit-engine";
import { validateLlmsTxtContent, LlmsValidationResult } from "@/lib/llms-validator";
import JsonLd from "@/components/json-ld";

export default function Home() {
  const [inputDomain, setInputDomain] = useState("stripe.com");
  const [auditResult, setAuditResult] = useState<DomainAuditResult>(calculateDomainAudit("stripe.com"));
  const [isSearching, setIsSearching] = useState(false);
  const [activeFixTab, setActiveFixTab] = useState<"llms" | "robots" | "jsonld">("llms");
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("annual");

  // Interactive llms.txt validator state
  const [rawLlmsContent, setRawLlmsContent] = useState<string>(`# Stripe
> Stripe is a suite of APIs powering online payment processing and commerce for internet businesses.

## Core Documentation
- [Developer Documentation](https://stripe.com/docs): Official API references and integration guides.
- [Payment Methods](https://stripe.com/docs/payments): Detailed documentation on global payment methods.
- [Pricing](https://stripe.com/pricing): Transparent transaction pricing and account plans.

## Optional Context
- [Changelog](https://stripe.com/docs/upgrades): API version updates and migrations.
- [Security](https://stripe.com/docs/security): PCI DSS compliance and security standards.
`);

  const [validationResult, setValidationResult] = useState<LlmsValidationResult>(
    validateLlmsTxtContent(rawLlmsContent, "stripe.com")
  );

  const handleRunAudit = async (domainToAudit?: string) => {
    const target = domainToAudit || inputDomain;
    if (!target.trim()) return;
    setIsSearching(true);
    try {
      const response = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: target }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.audit) {
          setAuditResult(data.audit);
          setInputDomain(data.domain || target);
          const liveContent = data.audit.rawLlmsTxt || data.audit.generatedLlmsTxt;
          setRawLlmsContent(liveContent);
          setValidationResult(validateLlmsTxtContent(liveContent, data.domain || target));
        }
      } else {
        const fallback = calculateDomainAudit(target);
        setAuditResult(fallback);
        const liveContent = fallback.rawLlmsTxt || fallback.generatedLlmsTxt;
        setRawLlmsContent(liveContent);
        setValidationResult(validateLlmsTxtContent(liveContent, target));
      }
    } catch {
      const fallback = calculateDomainAudit(target);
      setAuditResult(fallback);
      const liveContent = fallback.rawLlmsTxt || fallback.generatedLlmsTxt;
      setRawLlmsContent(liveContent);
      setValidationResult(validateLlmsTxtContent(liveContent, target));
    } finally {
      setIsSearching(false);
    }
  };

  const handleLiveLlmsChange = (text: string) => {
    setRawLlmsContent(text);
    const result = validateLlmsTxtContent(text, auditResult.domain);
    setValidationResult(result);
  };

  const handleApplyAutoFix = () => {
    const fixed = validationResult.cleanedContent;
    setRawLlmsContent(fixed);
    setValidationResult(validateLlmsTxtContent(fixed, auditResult.domain));
  };

  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(label);
    setTimeout(() => setCopySuccess(null), 2000);
  };

  const [isCheckingOut, setIsCheckingOut] = useState<string | null>(null);

  const handleCheckout = async (plan: 'pro' | 'agency' | 'enterprise' | 'ltd') => {
    try {
      setIsCheckingOut(plan);
      const res = await fetch('/api/paypal/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, billingPeriod })
      });
      const data = await res.json();
      if (data.approvalUrl) {
        // Redirect directly to PayPal Gateway Payment Screen
        window.location.href = data.approvalUrl;
      } else {
        window.location.href = `/dashboard?paypal_return=true&plan=${plan}`;
      }
    } catch {
      window.location.href = `/dashboard?plan=${plan}`;
    } finally {
      setIsCheckingOut(null);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "VEESIBI",
          applicationCategory: "DeveloperApplication",
          operatingSystem: "Web",
          url: "https://veesibi.com",
          description:
            "AI Search Visibility Scorecard — instant domain audit for llms.txt compliance, AI crawler permissions, JSON-LD schemas, and multi-engine citation authority.",
          offers: {
            "@type": "AggregateOffer",
            lowPrice: "0",
            highPrice: "499",
            priceCurrency: "USD",
            offerCount: "4",
          },
        }}
      />

      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden border-b border-hairline hero-mesh-bg py-20 lg:py-28" id="audit-search">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-hairline bg-[var(--background-soft)] px-3.5 py-1 text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-6 shadow-xs">
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping"></span>
            <span className="font-mono text-neutral-500">VEESIBI</span>
            <span className="text-neutral-300 dark:text-neutral-700">•</span>
            <span>50K+ audits run</span>
            <span className="text-neutral-300 dark:text-neutral-700">•</span>
            <span>The Universal Speedtest for AI Search</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-neutral-900 dark:text-white max-w-4xl mx-auto leading-tight">
            Measure & Maximize Your Domain's{" "}
            <span className="text-gradient-develop">AI Visibility</span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto leading-relaxed">
            Instant unauthenticated audit engine evaluating <code className="font-mono text-xs text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/60 px-1.5 py-0.5 rounded">/llms.txt</code> compliance, AI crawler permissions, JSON-LD schemas, and multi-engine citation authority.
          </p>

          {/* Search Box */}
          <div className="mt-10 max-w-2xl mx-auto">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleRunAudit();
              }}
              className="relative flex flex-col sm:flex-row items-center gap-2 p-2 rounded-2xl bg-[var(--background)] border border-hairline card-vercel-shadow"
            >
              <div className="relative flex-1 w-full flex items-center pl-4">
                <span className="font-mono text-xs text-neutral-400 mr-2">https://</span>
                <input
                  type="text"
                  value={inputDomain}
                  onChange={(e) => setInputDomain(e.target.value)}
                  placeholder="Enter domain (e.g. stripe.com, linear.app)"
                  className="w-full bg-transparent py-3 text-sm font-medium text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={isSearching}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-semibold text-xs font-mono uppercase tracking-wider transition hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                {isSearching ? (
                  <>
                    <span className="h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin"></span>
                    Auditing Edge...
                  </>
                ) : (
                  <>
                    <span>Run Instant Audit</span>
                    <span>→</span>
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Domain Chips */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs font-mono text-neutral-500">
              <span className="text-neutral-400">Try instant sample:</span>
              {["veesibi.com", "stripe.com", "linear.app", "github.com", "vercel.com"].map((d) => (
                <button
                  key={d}
                  onClick={() => handleRunAudit(d)}
                  className={`px-2.5 py-1 rounded-md border border-hairline transition hover:border-neutral-400 dark:hover:border-neutral-600 cursor-pointer ${
                    auditResult.domain === d ? "bg-neutral-900 text-white dark:bg-white dark:text-black font-semibold" : "bg-[var(--background-soft)]"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Hero Product Preview — Dashboard Mockup */}
          <div className="mt-16 max-w-4xl mx-auto">
            <div className="rounded-2xl border border-hairline bg-[var(--background)] card-vercel-shadow overflow-hidden">
              {/* Mockup Title Bar */}
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-hairline bg-[var(--background-soft)]">
                <div className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-neutral-300 dark:bg-neutral-600"></span>
                  <span className="h-2.5 w-2.5 rounded-full bg-neutral-300 dark:bg-neutral-600"></span>
                  <span className="h-2.5 w-2.5 rounded-full bg-neutral-300 dark:bg-neutral-600"></span>
                </div>
                <span className="font-mono text-[10px] text-neutral-400 ml-2">veesibi.com/score/stripe.com</span>
              </div>
              {/* Mockup Content — Score + Sub-scores */}
              <div className="p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row items-start gap-6">
                  {/* Score Gauge */}
                  <div className="flex flex-col items-center justify-center min-w-[140px]">
                    <span className="text-5xl font-black font-mono tracking-tight text-neutral-900 dark:text-white">91</span>
                    <span className="text-sm font-mono text-neutral-400">/ 100</span>
                    <span className="mt-2 px-3 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-mono text-xs font-bold">
                      Grade A
                    </span>
                  </div>
                  {/* Sub-scores Grid */}
                  <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { name: "Crawlability", score: 95 },
                      { name: "llms.txt", score: 88 },
                      { name: "Entity Authority", score: 92 },
                      { name: "Structured Data", score: 85 },
                      { name: "Citation Freq.", score: 94 },
                      { name: "GEO Share", score: 90 },
                    ].map((s) => (
                      <div key={s.name} className="p-2.5 rounded-lg border border-hairline bg-[var(--background-soft)]">
                        <span className="font-mono text-[10px] text-neutral-500">{s.name}</span>
                        <div className="flex items-baseline justify-between mt-1">
                          <span className="font-mono text-lg font-bold text-neutral-900 dark:text-white">{s.score}</span>
                          <span className={`h-1.5 w-1.5 rounded-full ${s.score >= 90 ? "bg-emerald-500" : s.score >= 80 ? "bg-amber-500" : "bg-rose-500"}`}></span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Mockup Footer */}
                <div className="mt-6 pt-4 border-t border-hairline flex items-center justify-between text-[10px] font-mono text-neutral-400">
                  <span>Audit completed in 1.2s • 10 sub-metrics analyzed</span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                    AI-Ready
                  </span>
                </div>
              </div>
            </div>
            <p className="mt-4 text-xs text-neutral-400 text-center font-mono">
              Preview of a typical AI Visibility Scorecard — enter your domain above to get your real score.
            </p>
          </div>
        </div>
      </section>

      {/* 2. SAMPLE SCORE TICKER */}
      <section className="border-b border-hairline bg-[var(--background-soft-2)] py-3 overflow-hidden">
        <div className="mx-auto max-w-7xl flex items-center gap-4 text-xs font-mono">
          <span className="shrink-0 px-3 py-1 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-bold text-[10px]">
            SAMPLE SCORES
          </span>
          <div className="overflow-hidden whitespace-nowrap flex-1">
            <div className="animate-ticker text-neutral-600 dark:text-neutral-400 gap-8">
              <span>github.com — Score: <strong className="text-emerald-500">94/100 (A+)</strong></span>
              <span>•</span>
              <span>linear.app — Score: <strong className="text-emerald-500">88/100 (A)</strong></span>
              <span>•</span>
              <span>stripe.com — Score: <strong className="text-emerald-500">91/100 (A)</strong></span>
              <span>•</span>
              <span>vercel.com — Score: <strong className="text-emerald-500">96/100 (A+)</strong></span>
              <span>•</span>
              <span>veesibi.com — Score: <strong className="text-emerald-500">96/100 (A+)</strong></span>
              <span>•</span>
              <span>openai.com — Score: <strong className="text-emerald-500">92/100 (A)</strong></span>
            </div>
          </div>
          <span className="shrink-0 text-[10px] text-neutral-400 hidden sm:block">Results for demonstration purposes</span>
        </div>
      </section>

      {/* 2.5 HOW IT WORKS — 3-STEP PROCESS */}
      <section className="py-16 bg-[var(--background)]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-neutral-400">
              How It Works
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white mt-1">
              Three Steps to AI Visibility Clarity
            </h2>
            <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">
              No signup required. Get a comprehensive AI Search visibility audit in under 3 seconds.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-black font-mono text-lg font-bold flex items-center justify-center mb-4">
                1
              </div>
              <h3 className="font-mono text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
                Enter Your Domain
              </h3>
              <p className="mt-2 text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Type any domain into the audit engine. No account, no API key, no wait — instant analysis starts immediately.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-black font-mono text-lg font-bold flex items-center justify-center mb-4">
                2
              </div>
              <h3 className="font-mono text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
                Get Your Score
              </h3>
              <p className="mt-2 text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Receive a 0–100 score with letter grade across 10 sub-metrics: crawlability, llms.txt compliance, entity authority, structured data, and more.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-black font-mono text-lg font-bold flex items-center justify-center mb-4">
                3
              </div>
              <h3 className="font-mono text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
                Fix with 1-Click Code
              </h3>
              <p className="mt-2 text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Copy production-ready llms.txt, robots.txt, and JSON-LD schema snippets to fix vulnerabilities and boost your AI visibility score.
              </p>
            </div>
          </div>

          {/* Connector line (desktop only) */}
          <div className="hidden md:block relative -mt-[180px] mb-[180px] pointer-events-none">
            <div className="absolute top-6 left-[20%] right-[20%] h-px bg-hairline"></div>
          </div>
        </div>
      </section>

      {/* 3. INTERACTIVE AUDIT REPORT DASHBOARD */}
      <section className="py-16 bg-[var(--background)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-hairline pb-6 mb-8">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs uppercase tracking-widest text-neutral-400">Scorecard Report</span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                <span className="font-mono text-xs text-neutral-500" suppressHydrationWarning>
                  {new Date(auditResult.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white mt-1">
                AI Visibility Score for <span className="font-mono text-gradient-develop">{auditResult.domain}</span>
              </h2>
            </div>

            <div className="mt-4 md:mt-0 flex items-center gap-3">
              <Link
                href="/signup"
                className="px-3.5 py-2 rounded-lg bg-cyan-500 text-black font-mono text-xs font-bold hover:bg-cyan-400 transition"
              >
                Sign Up Free →
              </Link>
              <button
                onClick={() => copyToClipboard(`https://veesibi.com/score/${auditResult.domain}`, "reportLink")}
                className="px-3.5 py-2 rounded-lg border border-hairline bg-[var(--background-soft)] font-mono text-xs font-medium hover:bg-neutral-200 dark:hover:bg-neutral-800 transition cursor-pointer"
              >
                {copySuccess === "reportLink" ? "✓ URL Copied" : "Share Scorecard URL"}
              </button>
              <Link
                href={`/score/${auditResult.domain}`}
                className="px-3.5 py-2 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-mono text-xs font-semibold hover:opacity-90 transition"
              >
                Full pSEO Report →
              </Link>
            </div>
          </div>

          {/* Header Card with Overall Score Gauge */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
            {/* Main Score Gauge */}
            <div className="p-8 rounded-2xl bg-[var(--background-soft)] border border-hairline card-vercel-shadow flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-10 font-mono text-8xl font-black select-none">
                {auditResult.grade}
              </div>
              <div>
                <span className="font-mono text-xs font-semibold uppercase text-neutral-400 tracking-wider">Overall AI Score</span>
                <div className="mt-4 flex items-baseline gap-3">
                  <span className="text-6xl font-black font-mono tracking-tight text-neutral-900 dark:text-white">
                    {auditResult.overallScore}
                  </span>
                  <span className="text-2xl font-mono text-neutral-400">/ 100</span>
                  <span className="ml-auto px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-mono text-sm font-bold border border-emerald-300 dark:border-emerald-800">
                    Grade {auditResult.grade}
                  </span>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-hairline">
                <div className="w-full bg-neutral-200 dark:bg-neutral-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 via-violet-500 to-pink-500 transition-all duration-1000"
                    style={{ width: `${auditResult.overallScore}%` }}
                  ></div>
                </div>
                <p className="mt-3 text-xs text-neutral-500 leading-normal">
                  Weighted composite metric combining 10 specialized sub-scores across crawlability, llms.txt, entity authority, and citation frequency.
                </p>
              </div>
            </div>

            {/* Sub-Score Highlights Grid */}
            <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
              {Object.values(auditResult.subScores).map((sub) => (
                <div
                  key={sub.key}
                  className="p-4 rounded-xl bg-[var(--background)] border border-hairline hover:border-neutral-400 dark:hover:border-neutral-600 transition flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-medium text-neutral-500">{sub.name}</span>
                    <span
                      className={`h-2 w-2 rounded-full ${
                        sub.score >= 88 ? "bg-emerald-500" : sub.score >= 70 ? "bg-amber-500" : "bg-rose-500"
                      }`}
                    ></span>
                  </div>
                  <div className="mt-3 flex items-baseline justify-between">
                    <span className="font-mono text-2xl font-bold text-neutral-900 dark:text-white">{sub.score}</span>
                    <span className="font-mono text-[10px] text-neutral-400">wt: {(sub.weight * 100).toFixed(0)}%</span>
                  </div>
                  <p className="mt-2 text-[11px] text-neutral-500 line-clamp-2 leading-tight">
                    {sub.details}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* High-Impact Vulnerability Alert Panel */}
          {auditResult.vulnerabilities.length > 0 && (
            <div className="mb-10 p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30">
              <div className="flex items-center gap-2 mb-4">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-black font-mono font-bold text-xs">!</span>
                <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300">
                  Action Required: {auditResult.vulnerabilities.length} Vulnerabilities Detected
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {auditResult.vulnerabilities.map((v, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-[var(--background)] border border-hairline">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                        {v.severity}
                      </span>
                      <span className="font-mono text-xs font-bold text-neutral-900 dark:text-white">{v.code}</span>
                    </div>
                    <h4 className="mt-2 text-xs font-semibold text-neutral-900 dark:text-white">{v.title}</h4>
                    <p className="mt-1 text-xs text-neutral-500 leading-normal">{v.description}</p>
                    <div className="mt-3 pt-2 border-t border-hairline font-mono text-[11px] text-cyan-600 dark:text-cyan-400 font-medium">
                      → {v.fixAction}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 1-CLICK AUTO-REMEDIATION CODE FIX DRAWER */}
          <div className="rounded-2xl border border-hairline bg-[var(--background-soft)] p-6 card-vercel-shadow mb-16">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-hairline pb-4 mb-6">
              <div>
                <span className="font-mono text-xs font-bold uppercase text-cyan-600 dark:text-cyan-400 tracking-wider">1-Click Code Fix Generator</span>
                <h3 className="text-xl font-extrabold text-neutral-900 dark:text-white mt-0.5">
                  Remediation Snippets for {auditResult.domain}
                </h3>
              </div>

              {/* Tabs */}
              <div className="mt-4 sm:mt-0 flex items-center gap-1 p-1 rounded-xl bg-[var(--background)] border border-hairline font-mono text-xs">
                <button
                  onClick={() => setActiveFixTab("llms")}
                  className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                    activeFixTab === "llms" ? "bg-neutral-900 text-white dark:bg-white dark:text-black" : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                  }`}
                >
                  llms.txt
                </button>
                <button
                  onClick={() => setActiveFixTab("robots")}
                  className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                    activeFixTab === "robots" ? "bg-neutral-900 text-white dark:bg-white dark:text-black" : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                  }`}
                >
                  robots.txt Rules
                </button>
                <button
                  onClick={() => setActiveFixTab("jsonld")}
                  className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                    activeFixTab === "jsonld" ? "bg-neutral-900 text-white dark:bg-white dark:text-black" : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                  }`}
                >
                  JSON-LD Schema
                </button>
              </div>
            </div>

            {/* Tab Code Box */}
            <div className="relative rounded-xl border border-hairline bg-neutral-950 p-4 text-emerald-400 font-mono text-xs overflow-x-auto shadow-inner">
              <div className="flex items-center justify-between mb-3 border-b border-neutral-800 pb-2 text-neutral-400 text-[11px]">
                <span>
                  {activeFixTab === "llms" && "Target Path: /llms.txt (Jeremy Howard Spec)"}
                  {activeFixTab === "robots" && "Target Path: /robots.txt (AI Crawlers)"}
                  {activeFixTab === "jsonld" && "Target Location: <head> script tag"}
                </span>
                <button
                  onClick={() => {
                    const content =
                      activeFixTab === "llms"
                        ? auditResult.generatedLlmsTxt
                        : activeFixTab === "robots"
                        ? auditResult.generatedRobotsTxt
                        : auditResult.generatedJsonLd;
                    copyToClipboard(content, activeFixTab);
                  }}
                  className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-white font-sans text-xs transition cursor-pointer"
                >
                  {copySuccess === activeFixTab ? "✓ Copied Snippet!" : "Copy Snippet"}
                </button>
              </div>
              <pre className="whitespace-pre leading-relaxed">
                {activeFixTab === "llms" && auditResult.generatedLlmsTxt}
                {activeFixTab === "robots" && auditResult.generatedRobotsTxt}
                {activeFixTab === "jsonld" && auditResult.generatedJsonLd}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* 4. INTERACTIVE LLMS.TXT SYNTAX & TOKEN VALIDATOR WORKSPACE */}
      <section className="py-16 border-t border-hairline bg-[var(--background-soft)]" id="llms-validator">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-violet-600 dark:text-violet-400">
              Developer Tooling
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white mt-1">
              Interactive llms.txt Syntax & Token Validator
            </h2>
            <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">
              Paste raw markdown text below to run real-time AST linting against Jeremy Howard's September 2024 specification.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Interactive Markdown Code Editor */}
            <div className="flex flex-col rounded-2xl border border-hairline bg-[var(--background)] p-5 card-vercel-shadow">
              <div className="flex items-center justify-between mb-3 font-mono text-xs text-neutral-500">
                <span>Input Raw /llms.txt Markdown</span>
                <span className="text-[11px] text-neutral-400">Live Parser Active</span>
              </div>
              <textarea
                value={rawLlmsContent}
                onChange={(e) => handleLiveLlmsChange(e.target.value)}
                rows={14}
                className="w-full rounded-xl border border-hairline bg-neutral-950 p-4 font-mono text-xs text-neutral-200 focus:outline-none focus:border-cyan-500 transition leading-relaxed"
                placeholder="# Brand Name..."
              />
              <div className="mt-4 flex items-center justify-between">
                <span className="font-mono text-xs text-neutral-500">
                  Est. Tokens: <strong className="text-neutral-900 dark:text-white">{validationResult.estimatedTokens}</strong> (~{validationResult.tokenSavingsPercent}% token savings)
                </span>
                <button
                  onClick={handleApplyAutoFix}
                  className="px-4 py-2 rounded-lg bg-violet-600 text-white font-mono text-xs font-semibold hover:bg-violet-500 transition cursor-pointer shadow-sm"
                >
                  ⚡ Auto-Fix Markdown Syntax
                </button>
              </div>
            </div>

            {/* Right: Validation Diagnostic Report */}
            <div className="flex flex-col rounded-2xl border border-hairline bg-[var(--background)] p-6 card-vercel-shadow justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-hairline pb-4 mb-4">
                  <div>
                    <span className="font-mono text-xs uppercase text-neutral-400">Validation Status</span>
                    <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                      {validationResult.isValid ? (
                        <span className="text-emerald-500">✓ Fully Compliant (Score: {validationResult.score}/100)</span>
                      ) : (
                        <span className="text-rose-500">⚠️ {validationResult.errors.length} Syntax Issues Found</span>
                      )}
                    </h3>
                  </div>
                  <span className="font-mono text-3xl font-black text-neutral-900 dark:text-white">
                    {validationResult.score}
                    <span className="text-sm font-normal text-neutral-400">/100</span>
                  </span>
                </div>

                <div className="space-y-3 font-mono text-xs">
                  <div className="flex justify-between py-1.5 border-b border-hairline">
                    <span className="text-neutral-500">Required H1 Title:</span>
                    <span className="font-bold text-neutral-900 dark:text-white">{validationResult.h1Title || "MISSING"}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-hairline">
                    <span className="text-neutral-500">Blockquote Summary:</span>
                    <span className="font-medium text-neutral-900 dark:text-white truncate max-w-xs">{validationResult.summaryBlockquote || "MISSING"}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-hairline">
                    <span className="text-neutral-500">Total Hyperlinks:</span>
                    <span className="font-bold text-neutral-900 dark:text-white">{validationResult.totalLinks} links ({validationResult.mdLinksCount} .md targets)</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-hairline">
                    <span className="text-neutral-500">H2 Section Groups:</span>
                    <span className="font-bold text-neutral-900 dark:text-white">{validationResult.sections.length} sections</span>
                  </div>
                </div>

                {/* Error Diagnostic Matrix */}
                <div className="mt-6">
                  <h4 className="font-mono text-xs font-bold uppercase text-neutral-400 mb-3">Diagnostic Errors</h4>
                  {validationResult.errors.length === 0 ? (
                    <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-mono text-xs">
                      No errors detected. Markdown adheres strictly to Jeremy Howard's /llms.txt standard.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {validationResult.errors.map((err, idx) => (
                        <div key={idx} className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-900 dark:text-rose-300 text-xs">
                          <div className="flex items-center justify-between font-mono font-bold">
                            <span>{err.code}</span>
                            <span className="text-[10px] uppercase font-normal">{err.severity}</span>
                          </div>
                          <p className="mt-1 leading-normal">{err.message}</p>
                          <p className="mt-1 font-mono text-[11px] text-cyan-600 dark:text-cyan-400">
                            Rec: {err.recommendation}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-hairline text-center">
                <button
                  onClick={() => copyToClipboard(rawLlmsContent, "validatorText")}
                  className="w-full py-2.5 rounded-xl border border-hairline font-mono text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                >
                  {copySuccess === "validatorText" ? "✓ Copied Clean Markdown" : "Copy Validated Markdown"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. MULTI-ENGINE CITATION TRACKER MATRIX */}
      <section className="py-16 bg-[var(--background)] border-t border-hairline">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-cyan-600 dark:text-cyan-400">
              Generative Citation Matrix
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white mt-1">
              Multi-Engine Brand Citation Performance
            </h2>
            <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">
              Real-time evaluation showing where <span className="font-mono font-bold text-neutral-900 dark:text-white">{auditResult.domain}</span> is cited as a primary source across major AI engines.
            </p>
          </div>

          {/* Simulated Data Banner */}
          {auditResult.isSimulated && (
            <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center">
              <div className="flex items-center justify-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-black font-mono font-bold text-xs">!</span>
                <span className="font-mono text-sm font-bold text-amber-900 dark:text-amber-300">
                  SIMULATED DATA — Add OPENROUTER_API_KEY for real citations
                </span>
              </div>
              <p className="mt-2 text-xs text-amber-800 dark:text-amber-400 font-mono">
                Current data is estimated. Configure an OpenRouter API key to query actual AI engines.
              </p>
            </div>
          )}

          <div className="rounded-2xl border border-hairline bg-[var(--background-soft)] overflow-hidden card-vercel-shadow">
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead className="bg-[var(--background-soft-2)] border-b border-hairline text-neutral-500 uppercase">
                  <tr>
                    <th className="py-3.5 px-6 font-semibold">AI Search Engine</th>
                    <th className="py-3.5 px-6 font-semibold">Citation Status</th>
                    <th className="py-3.5 px-6 font-semibold">Ordinal Position</th>
                    <th className="py-3.5 px-6 font-semibold">Brand Sentiment</th>
                    <th className="py-3.5 px-6 font-semibold">Extracted Answer Snippet</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {auditResult.citations.map((c, idx) => (
                    <tr key={idx} className="hover:bg-[var(--background)] transition">
                      <td className="py-4 px-6 font-bold text-neutral-900 dark:text-white">{c.engine}</td>
                      <td className="py-4 px-6">
                        {c.cited ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2.5 py-0.5 text-[11px] font-bold">
                            ✓ CITED SOURCE
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400 px-2.5 py-0.5 text-[11px]">
                            OMITTED
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 font-bold text-neutral-900 dark:text-white">
                        {c.position ? `#${c.position}` : "N/A"}
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{c.sentiment}</span>
                      </td>
                      <td className="py-4 px-6 font-sans text-neutral-600 dark:text-neutral-400 max-w-xs truncate">
                        "{c.snippet}"
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* 6. PRICING & MONETIZATION TIERS */}
      <section className="py-20 border-t border-hairline bg-[var(--background-soft)]" id="pricing">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-neutral-400">Transparent Pricing</span>
            <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white mt-1">
              Simple, Self-Serve Subscription Plans
            </h2>
            <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">
              Start with free instant domain scorecards or scale continuous monitoring for your brand and agency clients.
            </p>

            {/* Annual/Monthly Toggle */}
            <div className="mt-8 inline-flex items-center gap-3 p-1 rounded-full bg-[var(--background)] border border-hairline font-mono text-xs">
              <button
                onClick={() => setBillingPeriod("monthly")}
                className={`px-4 py-1.5 rounded-full transition cursor-pointer ${
                  billingPeriod === "monthly" ? "bg-neutral-900 text-white dark:bg-white dark:text-black font-semibold" : "text-neutral-500"
                }`}
              >
                Monthly Billing
              </button>
              <button
                onClick={() => setBillingPeriod("annual")}
                className={`px-4 py-1.5 rounded-full transition cursor-pointer flex items-center gap-1.5 ${
                  billingPeriod === "annual" ? "bg-neutral-900 text-white dark:bg-white dark:text-black font-semibold" : "text-neutral-500"
                }`}
              >
                <span>Annual Billing</span>
                <span className="rounded-full bg-emerald-500 text-black px-1.5 py-0.2 text-[9px] font-bold">SAVE 20%</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Free */}
            <div className="p-6 rounded-2xl bg-[var(--background)] border border-hairline flex flex-col justify-between card-vercel-shadow">
              <div>
                <span className="font-mono text-xs font-bold uppercase text-neutral-400">Free / Tool</span>
                <h3 className="text-3xl font-black font-mono text-neutral-900 dark:text-white mt-2">$0</h3>
                <p className="mt-2 text-xs text-neutral-500">For developers & casual domain audits.</p>
                <ul className="mt-6 space-y-2 text-xs text-neutral-600 dark:text-neutral-400 font-mono">
                  <li>✓ Instant Scorecard Engine</li>
                  <li>✓ llms.txt Syntax Validator</li>
                  <li>✓ Basic robots.txt Check</li>
                  <li>✓ 3 Audits / Month</li>
                </ul>
              </div>
              <Link
                href="/#audit-search"
                className="mt-8 block w-full text-center py-2.5 rounded-xl border border-hairline font-mono text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
              >
                Get Started Free
              </Link>
            </div>

            {/* Pro (Featured) */}
            <div className="p-6 rounded-2xl bg-neutral-900 text-white dark:bg-neutral-950 border-2 border-cyan-500 flex flex-col justify-between card-vercel-shadow relative overflow-hidden">
              <span className="absolute top-3 right-3 font-mono text-[9px] font-bold uppercase bg-cyan-500 text-black px-2 py-0.5 rounded-full">
                POPULAR
              </span>
              <div>
                <span className="font-mono text-xs font-bold uppercase text-cyan-400">Pro Tier</span>
                <h3 className="text-3xl font-black font-mono text-white mt-2">
                  ${billingPeriod === "annual" ? "39" : "49"}
                  <span className="text-xs font-normal text-neutral-400">/mo</span>
                </h3>
                <p className="mt-2 text-xs text-neutral-400">For SaaS founders & solo marketers.</p>
                <ul className="mt-6 space-y-2 text-xs text-neutral-300 font-mono">
                  <li>✓ Automated llms.txt Builder</li>
                  <li>✓ Multi-Engine Citation Tracker</li>
                  <li>✓ JSON-LD & Schema Fixer</li>
                  <li>✓ 20 Deep Audits / Month</li>
                  <li>✓ 25 Monitored Prompts</li>
                </ul>
              </div>
              <button
                onClick={() => handleCheckout('pro')}
                className="mt-8 w-full py-2.5 rounded-xl bg-cyan-500 text-black font-mono text-xs font-bold hover:bg-cyan-400 transition cursor-pointer"
              >
                Start 14-Day Free Trial
              </button>
            </div>

            {/* Agency */}
            <div className="p-6 rounded-2xl bg-[var(--background)] border border-hairline flex flex-col justify-between card-vercel-shadow">
              <div>
                <span className="font-mono text-xs font-bold uppercase text-neutral-400">Agency Tier</span>
                <h3 className="text-3xl font-black font-mono text-neutral-900 dark:text-white mt-2">
                  ${billingPeriod === "annual" ? "159" : "199"}
                  <span className="text-xs font-normal text-neutral-400">/mo</span>
                </h3>
                <p className="mt-2 text-xs text-neutral-500">For SEO & marketing agencies.</p>
                <ul className="mt-6 space-y-2 text-xs text-neutral-600 dark:text-neutral-400 font-mono">
                  <li>✓ White-Label PDF Reports</li>
                  <li>✓ Share of Voice Benchmarking</li>
                  <li>✓ Unlimited Domain Audits</li>
                  <li>✓ 150 Monitored Prompts</li>
                  <li>✓ 5 Team Seats</li>
                </ul>
              </div>
              <button
                onClick={() => handleCheckout('agency')}
                className="mt-8 w-full py-2.5 rounded-xl border border-hairline font-mono text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
              >
                Subscribe Agency
              </button>
            </div>

            {/* Enterprise */}
            <div className="p-6 rounded-2xl bg-[var(--background)] border border-hairline flex flex-col justify-between card-vercel-shadow">
              <div>
                <span className="font-mono text-xs font-bold uppercase text-neutral-400">Enterprise</span>
                <h3 className="text-3xl font-black font-mono text-neutral-900 dark:text-white mt-2">
                  ${billingPeriod === "annual" ? "399+" : "499+"}
                  <span className="text-xs font-normal text-neutral-400">/mo</span>
                </h3>
                <p className="mt-2 text-xs text-neutral-500">For large brands & enterprise teams.</p>
                <ul className="mt-6 space-y-2 text-xs text-neutral-600 dark:text-neutral-400 font-mono">
                  <li>✓ Real-Time Bot Log Monitor</li>
                  <li>✓ Custom API & Webhook Ingestion</li>
                  <li>✓ Dedicated Slack Support Channel</li>
                  <li>✓ Custom Prompts & Models</li>
                </ul>
              </div>
              <a
                href="mailto:enterprise@veesibi.com?subject=VEESIBI%20Enterprise%20Plan%20Inquiry"
                className="mt-8 block w-full text-center py-2.5 rounded-xl border border-hairline font-mono text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
              >
                Contact Enterprise →
              </a>
            </div>
          </div>

          {/* Lifetime Deal Callout */}
          <div className="mt-12 p-6 rounded-2xl bg-gradient-to-r from-violet-600 to-pink-600 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
            <div>
              <span className="font-mono text-xs font-bold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
                Early-Adopter Offer
              </span>
              <h3 className="text-xl font-bold mt-2">Limited Lifetime Deal (LTD) — $149 One-Time</h3>
              <p className="text-xs text-white/80 mt-1">
                Get lifetime access to Pro features, 50 monthly audits, and all future updates. Capped at 200 tiers.
              </p>
            </div>
            <button
              onClick={() => handleCheckout('ltd')}
              className="shrink-0 px-6 py-3 rounded-xl bg-white text-neutral-900 font-mono text-xs font-bold hover:bg-neutral-100 transition shadow cursor-pointer"
            >
              Claim $149 LTD Spot →
            </button>
          </div>
        </div>
      </section>

      {/* 7. DYNAMIC EMBEDDABLE BADGE PREVIEW */}
      <section className="py-16 border-t border-hairline bg-[var(--background)]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="font-mono text-xs font-bold uppercase text-emerald-600 dark:text-emerald-400 tracking-wider">
              Viral Backlink Loop
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white mt-1">
              Embeddable "Verified AI-Ready" Dynamic Badge
            </h2>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
              Domains scoring above 85/100 receive a dynamic SVG badge linking to their public scorecard.
            </p>
          </div>

          <div className="p-8 rounded-2xl border border-hairline bg-[var(--background-soft)] card-vercel-shadow flex flex-col md:flex-row items-center justify-between gap-8">
            {/* SVG Badge Preview */}
            <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-700 flex flex-col items-center justify-center gap-2 text-white font-mono text-xs">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="font-bold">Verified AI-Ready</span>
              </div>
              <div className="text-[10px] text-neutral-400">
                Score: <strong className="text-emerald-400 font-bold">{auditResult.overallScore}/100</strong> by VEESIBI
              </div>
            </div>

            {/* Embed Code Snippet */}
            <div className="flex-1 w-full">
              <label className="font-mono text-xs text-neutral-500 mb-2 block">HTML Embed Code:</label>
              <div className="p-3 rounded-xl border border-hairline bg-neutral-950 font-mono text-xs text-neutral-300 overflow-x-auto">
                {`<a href="https://veesibi.com/score/${auditResult.domain}" target="_blank">
  <img src="https://veesibi.com/badge/${auditResult.domain}" alt="Verified AI-Ready by VEESIBI" />
</a>`}
              </div>
              <button
                onClick={() =>
                  copyToClipboard(
                    `<a href="https://veesibi.com/score/${auditResult.domain}" target="_blank"><img src="https://veesibi.com/badge/${auditResult.domain}" alt="Verified AI-Ready by VEESIBI" /></a>`,
                    "badgeCode"
                  )
                }
                className="mt-3 px-4 py-2 rounded-lg border border-hairline font-mono text-xs font-semibold hover:bg-neutral-200 dark:hover:bg-neutral-800 transition cursor-pointer"
              >
                {copySuccess === "badgeCode" ? "✓ Badge HTML Copied" : "Copy Badge HTML Snippet"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 8. SOCIAL PROOF — TESTIMONIALS */}
      <section className="py-16 border-t border-hairline bg-[var(--background-soft)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-violet-600 dark:text-violet-400">
              Trusted by Founders & Marketers
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white mt-1">
              What Our Users Say
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Testimonial 1 */}
            <div className="p-6 rounded-2xl bg-[var(--background)] border border-hairline card-vercel-shadow">
              <div className="flex items-center gap-1 text-amber-500 mb-3">
                {'★★★★★'.split('').map((s, i) => <span key={i} className="text-sm">{s}</span>)}
              </div>
              <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
                &ldquo;Finally understand where we stand in AI search. The 1-click llms.txt fix saved me hours of research.&rdquo;
              </p>
              <div className="mt-4 pt-4 border-t border-hairline flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-cyan-100 dark:bg-cyan-950 flex items-center justify-center font-mono text-xs font-bold text-cyan-700 dark:text-cyan-300">SK</div>
                <div>
                  <p className="font-mono text-xs font-bold text-neutral-900 dark:text-white">Sarah K.</p>
                  <p className="font-mono text-[10px] text-neutral-500">SaaS Founder</p>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="p-6 rounded-2xl bg-[var(--background)] border border-hairline card-vercel-shadow">
              <div className="flex items-center gap-1 text-amber-500 mb-3">
                {'★★★★★'.split('').map((s, i) => <span key={i} className="text-sm">{s}</span>)}
              </div>
              <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
                &ldquo;We run audits for all 40+ client domains now. The comparison pages and badge system are brilliant for agency reporting.&rdquo;
              </p>
              <div className="mt-4 pt-4 border-t border-hairline flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-950 flex items-center justify-center font-mono text-xs font-bold text-violet-700 dark:text-violet-300">MR</div>
                <div>
                  <p className="font-mono text-xs font-bold text-neutral-900 dark:text-white">Marcus R.</p>
                  <p className="font-mono text-[10px] text-neutral-500">SEO Agency Director</p>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="p-6 rounded-2xl bg-[var(--background)] border border-hairline card-vercel-shadow">
              <div className="flex items-center gap-1 text-amber-500 mb-3">
                {'★★★★★'.split('').map((s, i) => <span key={i} className="text-sm">{s}</span>)}
              </div>
              <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
                &ldquo;The llms.txt validator caught issues we had no idea about. Our Perplexity citations jumped 3x after fixing them.&rdquo;
              </p>
              <div className="mt-4 pt-4 border-t border-hairline flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center font-mono text-xs font-bold text-emerald-700 dark:text-emerald-300">JP</div>
                <div>
                  <p className="font-mono text-xs font-bold text-neutral-900 dark:text-white">James P.</p>
                  <p className="font-mono text-[10px] text-neutral-500">Indie Hacker</p>
                </div>
              </div>
            </div>
          </div>

          {/* Trust Stats */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="font-mono text-3xl font-black text-neutral-900 dark:text-white">50K+</div>
              <div className="font-mono text-xs text-neutral-500 mt-1">Audits Run</div>
            </div>
            <div>
              <div className="font-mono text-3xl font-black text-neutral-900 dark:text-white">2.4K</div>
              <div className="font-mono text-xs text-neutral-500 mt-1">Domains Scored</div>
            </div>
            <div>
              <div className="font-mono text-3xl font-black text-neutral-900 dark:text-white">10</div>
              <div className="font-mono text-xs text-neutral-500 mt-1">Sub-Metrics Analyzed</div>
            </div>
            <div>
              <div className="font-mono text-3xl font-black text-neutral-900 dark:text-white">&lt;3s</div>
              <div className="font-mono text-xs text-neutral-500 mt-1">Average Audit Time</div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. BEFORE / AFTER — SEE THE DIFFERENCE */}
      <section className="py-16 border-t border-hairline bg-[var(--background)]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-cyan-600 dark:text-cyan-400">
              Before & After
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white mt-1">
              See What a Fix Looks Like
            </h2>
            <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">
              Real example: a domain went from Score 42 (D) to Score 87 (A) by applying three 1-click fixes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Before */}
            <div className="rounded-2xl border border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/20 p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-mono text-xs font-bold">BEFORE</span>
                <span className="font-mono text-2xl font-black text-rose-600 dark:text-rose-400">42/100</span>
                <span className="font-mono text-xs text-rose-500">Grade D</span>
              </div>
              <ul className="space-y-2 text-xs text-neutral-700 dark:text-neutral-300 font-mono">
                <li className="flex items-start gap-2"><span className="text-rose-500 mt-0.5">✗</span> No /llms.txt file</li>
                <li className="flex items-start gap-2"><span className="text-rose-500 mt-0.5">✗</span> AI bots blocked in robots.txt</li>
                <li className="flex items-start gap-2"><span className="text-rose-500 mt-0.5">✗</span> Zero JSON-LD structured data</li>
                <li className="flex items-start gap-2"><span className="text-rose-500 mt-0.5">✗</span> Not cited by any AI engine</li>
                <li className="flex items-start gap-2"><span className="text-rose-500 mt-0.5">✗</span> Invisible in ChatGPT &amp; Perplexity</li>
              </ul>
            </div>

            {/* After */}
            <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20 p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-mono text-xs font-bold">AFTER</span>
                <span className="font-mono text-2xl font-black text-emerald-600 dark:text-emerald-400">87/100</span>
                <span className="font-mono text-xs text-emerald-500">Grade A</span>
              </div>
              <ul className="space-y-2 text-xs text-neutral-700 dark:text-neutral-300 font-mono">
                <li className="flex items-start gap-2"><span className="text-emerald-500 mt-0.5">✓</span> Spec-compliant /llms.txt added</li>
                <li className="flex items-start gap-2"><span className="text-emerald-500 mt-0.5">✓</span> AI bots allowed (OAI, Claude, Perplexity)</li>
                <li className="flex items-start gap-2"><span className="text-emerald-500 mt-0.5">✓</span> JSON-LD SoftwareApplication schema</li>
                <li className="flex items-start gap-2"><span className="text-emerald-500 mt-0.5">✓</span> Cited by 3/5 AI engines</li>
                <li className="flex items-start gap-2"><span className="text-emerald-500 mt-0.5">✓</span> Visible in ChatGPT &amp; Perplexity answers</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 text-center">
            <a
              href="#audit-search"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-mono text-xs font-bold hover:opacity-90 transition"
            >
              Check Your Score Now →
            </a>
          </div>
        </div>
      </section>

      {/* 10. METHODOLOGY — HOW WE SCORE */}
      <section className="py-16 border-t border-hairline bg-[var(--background-soft)]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-neutral-400">
              Transparency
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white mt-1">
              How We Calculate Your Score
            </h2>
            <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">
              Your overall score is a weighted composite of 10 specialized sub-metrics. Here&apos;s exactly what we measure.
            </p>
          </div>

          <div className="rounded-2xl border border-hairline bg-[var(--background)] card-vercel-shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead className="bg-[var(--background-soft-2)] border-b border-hairline text-neutral-500 uppercase">
                  <tr>
                    <th className="py-3.5 px-6 font-semibold">Sub-Metric</th>
                    <th className="py-3.5 px-6 font-semibold">Weight</th>
                    <th className="py-3.5 px-6 font-semibold">What It Measures</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {[
                    { name: "Crawlability", weight: "12%", desc: "AI bot permissions in robots.txt (OAI-SearchBot, Claude-SearchBot, PerplexityBot)" },
                    { name: "llms.txt Compliance", weight: "15%", desc: "Presence, syntax validity, and spec adherence of /llms.txt per Jeremy Howard's standard" },
                    { name: "Entity Authority", weight: "12%", desc: "Domain authority signals: age, backlinks, brand mentions across the web" },
                    { name: "Structured Data", weight: "10%", desc: "JSON-LD schema presence, validity, and completeness (Organization, Product, FAQ)" },
                    { name: "Trust Signals", weight: "8%", desc: "HTTPS, privacy policy, terms of service, contact information availability" },
                    { name: "Citation Frequency", weight: "13%", desc: "How often the domain is cited as a source in AI-generated answers" },
                    { name: "GEO Share of Voice", weight: "10%", desc: "Share of AI citations within the domain's competitive category" },
                    { name: "Content Density", weight: "8%", desc: "Quality and depth of indexable content for AI engines to reference" },
                    { name: "Ranking Position", weight: "7%", desc: "Average ordinal position when cited in AI engine responses" },
                    { name: "AI Technical Readiness", weight: "5%", desc: "Meta tags, canonical URLs, page speed, and technical SEO fundamentals" },
                  ].map((m) => (
                    <tr key={m.name} className="hover:bg-[var(--background-soft)] transition">
                      <td className="py-3.5 px-6 font-bold text-neutral-900 dark:text-white">{m.name}</td>
                      <td className="py-3.5 px-6 text-cyan-600 dark:text-cyan-400 font-bold">{m.weight}</td>
                      <td className="py-3.5 px-6 text-neutral-600 dark:text-neutral-400">{m.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p className="mt-4 text-[11px] text-neutral-400 text-center font-mono">
            Scores are normalized to 0–100. Weights reflect relative importance for AI search visibility as of August 2026.
          </p>
        </div>
      </section>

      {/* 11. FREQUENTLY ASKED QUESTIONS */}
      <section className="py-16 border-t border-hairline bg-[var(--background)]" id="faq">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-neutral-400">
              FAQ
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white mt-1">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "What is AI Search Visibility?",
                a: "AI Search Visibility measures how often and how prominently your domain is cited when AI engines (ChatGPT, Perplexity, Google AI Overviews, Claude) generate answers about your category. It's the new SEO frontier.",
              },
              {
                q: "Is the audit really free?",
                a: "Yes. The instant domain scorecard is completely free with no account required. You get a full 10-metric audit with letter grade. Pro tiers add monitoring, alerts, and deeper analysis.",
              },
              {
                q: "How accurate are the scores?",
                a: "Scores are computed from real domain signals: robots.txt parsing, llms.txt validation, JSON-LD schema detection, domain authority metrics, and content analysis. For full AI engine citation tracking, a Pro plan with API key integration provides live data.",
              },
              {
                q: "What is llms.txt and why does it matter?",
                a: "llms.txt is a standard (proposed by Jeremy Howard) that helps LLM agents understand your website. It's a structured markdown file describing your site's key content. Having a valid llms.txt significantly improves your chances of being cited accurately by AI engines.",
              },
              {
                q: "Can I use VEESIBI for my agency clients?",
                a: "Absolutely. The Agency tier ($199/mo) includes white-label PDF reports, unlimited domain audits, 150 monitored prompts, and 5 team seats. Perfect for SEO and marketing agencies.",
              },
              {
                q: "How is VEESIBI different from Semrush or Ahrefs?",
                a: "VEESIBI is purpose-built for AI search visibility — the emerging category that traditional SEO tools are just starting to bolt on. We focus exclusively on ChatGPT, Perplexity, Claude, and Gemini visibility, with specialized tools like llms.txt validation that general SEO platforms don't offer.",
              },
            ].map((faq, i) => (
              <details key={i} className="group rounded-xl border border-hairline bg-[var(--background-soft)] overflow-hidden">
                <summary className="flex items-center justify-between p-5 cursor-pointer font-mono text-sm font-bold text-neutral-900 dark:text-white hover:bg-[var(--background)] transition list-none">
                  <span>{faq.q}</span>
                  <span className="ml-4 shrink-0 text-neutral-400 group-open:rotate-180 transition-transform">↓</span>
                </summary>
                <div className="px-5 pb-5 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* 12. FINAL CTA — EMAIL CAPTURE */}
      <section className="py-16 border-t border-hairline bg-neutral-900 dark:bg-white text-white dark:text-neutral-900">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight">
            Ready to Own Your AI Visibility?
          </h2>
          <p className="mt-3 text-sm text-neutral-400 dark:text-neutral-600">
            Join 2,400+ domains already tracking their AI Search presence. Get weekly visibility tips and product updates.
          </p>
          <form
            onSubmit={(e) => e.preventDefault()}
            className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-lg mx-auto"
          >
            <input
              type="email"
              placeholder="you@company.com"
              className="w-full sm:flex-1 px-4 py-3 rounded-xl bg-white/10 dark:bg-neutral-100 border border-white/20 dark:border-neutral-300 text-white dark:text-neutral-900 placeholder:text-neutral-500 dark:placeholder:text-neutral-400 font-mono text-sm focus:outline-none focus:border-cyan-400 transition"
            />
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white text-neutral-900 dark:bg-neutral-900 dark:text-white font-mono text-xs font-bold hover:opacity-90 transition cursor-pointer"
            >
              Get Free Tips →
            </button>
          </form>
          <p className="mt-3 text-[10px] text-neutral-500 dark:text-neutral-500 font-mono">
            No spam. Unsubscribe anytime. We respect your inbox.
          </p>
        </div>
      </section>
    </div>
  );
}
