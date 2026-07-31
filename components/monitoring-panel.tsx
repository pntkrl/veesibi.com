"use client";

import { useState, useEffect } from "react";

interface DriftEvent {
  type: string;
  severity: string;
  endpoint: string;
  message: string;
  detectedAt: string;
}

interface EndpointStatus {
  url: string;
  status: 'up' | 'down' | 'degraded';
  statusCode: number;
  contentHash: string;
  ttfbMs: number;
}

interface MonitoringData {
  overallStatus: 'healthy' | 'degraded' | 'alerting' | 'unknown';
  lastCheckedAt: string | null;
  uptimePercent: number;
  checksTotal: number;
  checksPassed: number;
  endpoints: {
    llmsTxt: EndpointStatus | null;
    robotsTxt: EndpointStatus | null;
    rootHtml: EndpointStatus | null;
    llmsFullTxt: EndpointStatus | null;
  };
  botPermissions: Record<string, string>;
  recentDriftEvents: DriftEvent[];
}

export default function MonitoringPanel({ domain }: { domain: string }) {
  const [data, setData] = useState<MonitoringData | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, [domain]);

  async function fetchStatus() {
    try {
      const res = await fetch(`/api/monitor/status?domain=${encodeURIComponent(domain)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.overallStatus !== 'unknown') {
          setData(json);
        }
      }
    } catch {
      // Silent
    } finally {
      setLoading(false);
    }
  }

  async function runCheck() {
    setChecking(true);
    try {
      const res = await fetch('/api/monitor/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain })
      });
      if (res.ok) {
        await fetchStatus();
      }
    } catch {
      // Silent
    } finally {
      setChecking(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 rounded-2xl bg-[var(--background-soft)] border border-hairline card-vercel-shadow mb-10">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-1/4"></div>
          <div className="h-16 bg-neutral-200 dark:bg-neutral-800 rounded"></div>
        </div>
      </div>
    );
  }

  const statusColor = data?.overallStatus === 'healthy' ? 'emerald' : data?.overallStatus === 'degraded' ? 'amber' : data?.overallStatus === 'alerting' ? 'rose' : 'neutral';
  const statusLabel = data?.overallStatus === 'healthy' ? 'All Systems Operational' : data?.overallStatus === 'degraded' ? 'Degraded Performance' : data?.overallStatus === 'alerting' ? 'Issues Detected' : 'No Data Yet';

  return (
    <div className="p-6 rounded-2xl bg-[var(--background-soft)] border border-hairline card-vercel-shadow mb-10">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-neutral-400">
          Technical Monitoring
        </h3>
        <button
          onClick={runCheck}
          disabled={checking}
          className="px-3 py-1 rounded-lg bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 font-mono text-[11px] font-bold hover:bg-cyan-500/30 transition cursor-pointer disabled:opacity-50"
        >
          {checking ? 'Checking...' : '⚡ Run Check Now'}
        </button>
      </div>

      {!data ? (
        <div className="text-center py-8">
          <p className="text-xs text-neutral-500 mb-3">No monitoring data yet for this domain.</p>
          <button
            onClick={runCheck}
            disabled={checking}
            className="px-4 py-2 rounded-xl bg-cyan-500 text-white font-mono text-xs font-bold hover:bg-cyan-400 transition cursor-pointer disabled:opacity-50"
          >
            {checking ? 'Running First Check...' : 'Start Monitoring'}
          </button>
        </div>
      ) : (
        <>
          {/* Status Header */}
          <div className={`flex items-center gap-3 p-3 rounded-lg mb-4 border ${
            statusColor === 'emerald' ? 'bg-emerald-500/10 border-emerald-500/30' :
            statusColor === 'amber' ? 'bg-amber-500/10 border-amber-500/30' :
            statusColor === 'rose' ? 'bg-rose-500/10 border-rose-500/30' :
            'bg-neutral-500/10 border-neutral-500/30'
          }`}>
            <div className={`w-2.5 h-2.5 rounded-full ${
              statusColor === 'emerald' ? 'bg-emerald-500' :
              statusColor === 'amber' ? 'bg-amber-500' :
              statusColor === 'rose' ? 'bg-rose-500' : 'bg-neutral-500'
            }`} />
            <span className={`font-mono text-xs font-bold ${
              statusColor === 'emerald' ? 'text-emerald-700 dark:text-emerald-300' :
              statusColor === 'amber' ? 'text-amber-700 dark:text-amber-300' :
              statusColor === 'rose' ? 'text-rose-700 dark:text-rose-300' : 'text-neutral-700'
            }`}>
              {statusLabel}
            </span>
            <span className="ml-auto font-mono text-[10px] text-neutral-500">
              {data.uptimePercent}% uptime ({data.checksPassed}/{data.checksTotal} checks)
            </span>
          </div>

          {/* Endpoint Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {[
              { name: '/llms.txt', data: data.endpoints.llmsTxt },
              { name: '/robots.txt', data: data.endpoints.robotsTxt },
              { name: '/llms-full.txt', data: data.endpoints.llmsFullTxt },
              { name: 'Root HTML', data: data.endpoints.rootHtml }
            ].map((ep) => (
              <div key={ep.name} className="p-3 rounded-lg bg-[var(--background)] border border-hairline">
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    ep.data?.status === 'up' ? 'bg-emerald-500' :
                    ep.data?.status === 'degraded' ? 'bg-amber-500' : 'bg-neutral-400'
                  }`} />
                  <span className="font-mono text-[10px] font-bold text-neutral-700 dark:text-neutral-300 truncate">{ep.name}</span>
                </div>
                <div className="font-mono text-[10px] text-neutral-500">
                  {ep.data ? (
                    <>
                      <span className={ep.data.statusCode === 200 ? 'text-emerald-500' : 'text-amber-500'}>HTTP {ep.data.statusCode}</span>
                      {ep.data.ttfbMs > 0 && <span className="ml-1">• {ep.data.ttfbMs}ms</span>}
                    </>
                  ) : (
                    <span className="text-neutral-400">Not checked</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Bot Permissions */}
          <div className="mb-4">
            <h4 className="font-mono text-[10px] font-bold uppercase text-neutral-400 mb-2">AI Bot Permissions (robots.txt)</h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(data.botPermissions).map(([bot, permission]) => (
                <span
                  key={bot}
                  className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                    permission === 'Allowed' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' :
                    permission === 'Restricted' ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' :
                    'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {bot.replace(/([A-Z])/g, ' $1').trim()}: {permission}
                </span>
              ))}
            </div>
          </div>

          {/* Drift Events */}
          {data.recentDriftEvents.length > 0 && (
            <div>
              <h4 className="font-mono text-[10px] font-bold uppercase text-neutral-400 mb-2">Recent Drift Events</h4>
              <div className="space-y-1.5">
                {data.recentDriftEvents.slice(0, 5).map((event, idx) => (
                  <div
                    key={idx}
                    className={`p-2 rounded text-[11px] font-mono border ${
                      event.severity === 'critical' ? 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300' :
                      event.severity === 'high' ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300' :
                      'bg-neutral-500/10 border-neutral-500/30 text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    <span className="font-bold">[{event.severity}]</span> {event.message}
                    <span className="ml-1 text-neutral-400">• {event.endpoint}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.recentDriftEvents.length === 0 && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-mono text-[11px]">
              No drift events detected. All endpoints stable.
            </div>
          )}

          <div className="mt-4 pt-3 border-t border-hairline font-mono text-[10px] text-neutral-400 text-center">
            Last checked: {data.lastCheckedAt ? new Date(data.lastCheckedAt).toLocaleString() : 'Never'}
          </div>
        </>
      )}
    </div>
  );
}
