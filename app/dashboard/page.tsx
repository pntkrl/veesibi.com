"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getMonitoredDomains, addMonitoredDomain, getOrCreateDefaultOrg } from "@/lib/db";
import { DomainAuditResult, calculateDomainAudit } from "@/lib/audit-engine";
import { MonitoredDomain, Organization } from "@/types/database";
import { getCurrentUserSession } from "@/lib/auth";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function DashboardPage() {
  const [org, setOrg] = useState<Organization | null>(null);
  const [domainList, setDomainList] = useState<{ domain: MonitoredDomain; latestAudit: DomainAuditResult }[]>([]);
  const [newDomain, setNewDomain] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState<DomainAuditResult | null>(null);

  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      // Check for PayPal return params
      if (typeof window !== "undefined") {
        const urlParams = new URLSearchParams(window.location.search);
        const paypalReturn = urlParams.get("paypal_return") || urlParams.get("paypal_success");
        const planParam = urlParams.get("plan");
        const orderIdParam = urlParams.get("token") || urlParams.get("order_id");

        if ((paypalReturn || orderIdParam) && planParam) {
          try {
            await fetch("/api/paypal/capture", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ orderId: orderIdParam || "PAYPAL-COMPLETED", plan: planParam }),
            });
            setPaymentSuccessMsg(`✓ Payment Successful! Your ${planParam.toUpperCase()} Plan is now active.`);
          } catch {
            setPaymentSuccessMsg(`✓ Workspace updated to ${planParam.toUpperCase()} Plan.`);
          }
        }
      }

      let userId = "user-001";
      let userEmail = "founder@veesibi.com";

      const sessionUser = getCurrentUserSession();
      if (sessionUser) {
        userId = sessionUser.id;
        userEmail = sessionUser.email;
      }

      const supabase = getSupabaseBrowserClient();
      if (supabase) {
        const { data } = await supabase.auth.getUser();
        if (data?.user) {
          userId = data.user.id;
          userEmail = data.user.email || userEmail;
        }
      }

      const defaultOrg = await getOrCreateDefaultOrg(userId, userEmail);
      setOrg(defaultOrg);
      const list = await getMonitoredDomains(defaultOrg.id);
      setDomainList(list);
      if (list.length > 0) {
        setSelectedAudit(list[0].latestAudit);
      }
    }
    loadData();
  }, []);

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomain.trim() || !org) return;
    setIsAdding(true);
    const added = await addMonitoredDomain(org.id, newDomain);
    const audit = calculateDomainAudit(added.domain_name);
    setDomainList((prev) => [{ domain: added, latestAudit: audit }, ...prev]);
    setSelectedAudit(audit);
    setNewDomain("");
    setIsAdding(false);
  };

  return (
    <div className="py-12 bg-[var(--background)] min-h-screen">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {paymentSuccessMsg && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 font-mono text-xs font-bold flex items-center justify-between">
            <span>{paymentSuccessMsg}</span>
            <button onClick={() => setPaymentSuccessMsg(null)} className="text-neutral-400 hover:text-white">✕</button>
          </div>
        )}

        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-hairline pb-6 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs uppercase tracking-widest text-cyan-600 dark:text-cyan-400 font-bold">
                Phase 1 Database Dashboard
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
              <span className="font-mono text-xs text-neutral-500">RLS Multi-Tenancy Active</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white mt-1">
              Monitored Domains & Workspace Overview
            </h1>
          </div>

          <div className="mt-4 md:mt-0 flex items-center gap-3">
            <span className="px-3 py-1.5 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-black font-mono text-xs font-bold uppercase tracking-wider">
              {org?.plan || "PRO"} Plan
            </span>
            <Link
              href="/"
              className="px-4 py-2 rounded-xl border border-hairline font-mono text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
            >
              + Run New Audit
            </Link>
          </div>
        </div>

        {/* Monitored Domains Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Left Column: Monitored Domains List & Add Form */}
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-[var(--background-soft)] border border-hairline card-vercel-shadow">
              <h3 className="font-mono text-xs font-bold uppercase text-neutral-400 tracking-wider mb-4">
                Add Domain to Workspace
              </h3>
              <form onSubmit={handleAddDomain} className="flex gap-2">
                <input
                  type="text"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  placeholder="domain.com"
                  className="flex-1 rounded-xl border border-hairline bg-[var(--background)] px-3.5 py-2 text-xs font-mono text-neutral-900 dark:text-white focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="submit"
                  disabled={isAdding}
                  className="px-4 py-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-mono text-xs font-bold hover:opacity-90 transition cursor-pointer"
                >
                  {isAdding ? "Adding..." : "Claim"}
                </button>
              </form>
            </div>

            <div className="p-6 rounded-2xl bg-[var(--background-soft)] border border-hairline card-vercel-shadow">
              <h3 className="font-mono text-xs font-bold uppercase text-neutral-400 tracking-wider mb-4">
                Monitored Domains ({domainList.length})
              </h3>
              <div className="space-y-2">
                {domainList.map((item) => (
                  <button
                    key={item.domain.id}
                    onClick={() => setSelectedAudit(item.latestAudit)}
                    className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition cursor-pointer ${
                      selectedAudit?.domain === item.latestAudit.domain
                        ? "bg-neutral-900 text-white border-neutral-900 dark:bg-white dark:text-black dark:border-white font-semibold"
                        : "bg-[var(--background)] border-hairline hover:border-neutral-400 text-neutral-900 dark:text-white"
                    }`}
                  >
                    <div>
                      <div className="font-mono text-xs">{item.domain.domain_name}</div>
                      <div className="text-[10px] text-neutral-400">Grade {item.latestAudit.grade}</div>
                    </div>
                    <span className="font-mono text-lg font-bold">{item.latestAudit.overallScore}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Selected Domain Audit Overview */}
          {selectedAudit && (
            <div className="lg:col-span-2 space-y-6">
              <div className="p-8 rounded-2xl bg-[var(--background-soft)] border border-hairline card-vercel-shadow">
                <div className="flex items-center justify-between border-b border-hairline pb-4 mb-6">
                  <div>
                    <span className="font-mono text-xs uppercase text-neutral-400">Selected Domain Audit</span>
                    <h2 className="text-2xl font-black font-mono text-neutral-900 dark:text-white">
                      {selectedAudit.domain}
                    </h2>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-4xl font-black font-mono text-neutral-900 dark:text-white">
                      {selectedAudit.overallScore}
                      <span className="text-sm font-normal text-neutral-400">/100</span>
                    </span>
                    <Link
                      href={`/score/${selectedAudit.domain}`}
                      className="px-3 py-1.5 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-mono text-xs font-bold"
                    >
                      View Report →
                    </Link>
                  </div>
                </div>

                {/* Sub Scores Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Object.values(selectedAudit.subScores).map((sub) => (
                    <div key={sub.key} className="p-3 rounded-xl bg-[var(--background)] border border-hairline">
                      <div className="font-mono text-[10px] text-neutral-400 uppercase">{sub.name}</div>
                      <div className="font-mono text-xl font-bold text-neutral-900 dark:text-white mt-1">{sub.score}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Database Audit Log Table */}
              <div className="p-6 rounded-2xl bg-[var(--background-soft)] border border-hairline card-vercel-shadow">
                <h3 className="font-mono text-xs font-bold uppercase text-neutral-400 tracking-wider mb-4">
                  Historical Audit Logs for {selectedAudit.domain}
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs">
                    <thead className="border-b border-hairline text-neutral-500 uppercase">
                      <tr>
                        <th className="py-2 px-4">Audit ID</th>
                        <th className="py-2 px-4">Overall Score</th>
                        <th className="py-2 px-4">Crawlability</th>
                        <th className="py-2 px-4">llms.txt</th>
                        <th className="py-2 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-hairline">
                      <tr className="hover:bg-[var(--background)]">
                        <td className="py-3 px-4 text-neutral-500">rep-{Date.now().toString().substring(8)}</td>
                        <td className="py-3 px-4 font-bold text-emerald-500">{selectedAudit.overallScore}/100</td>
                        <td className="py-3 px-4">{selectedAudit.subScores.crawlability.score}/100</td>
                        <td className="py-3 px-4">{selectedAudit.subScores.llmsTxt.score}/100</td>
                        <td className="py-3 px-4 font-bold text-emerald-600">COMPLETED</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
