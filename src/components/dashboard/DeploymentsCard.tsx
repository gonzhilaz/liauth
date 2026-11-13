"use client";

import React, { useState, useMemo } from "react";
import { Server, Search, Power, AlertTriangle, ShieldCheck, ShieldAlert } from "lucide-react";
import { DeploymentRecord } from "@/types/license";
import { Tooltip } from "@/components/ui/Tooltip";

interface DeploymentsCardProps {
  deployments: DeploymentRecord[];
  onToggleKillSwitch: (licenseId: string, currentlyRevoked: boolean) => Promise<void>;
}

export function DeploymentsCard({
  deployments,
  onToggleKillSwitch,
}: DeploymentsCardProps) {
  const [search, setSearch] = useState("");
  const [confirmTarget, setConfirmTarget] = useState<DeploymentRecord | null>(null);
  const [processing, setProcessing] = useState(false);

  const filteredDeployments = useMemo(() => {
    return deployments.filter(
      (d) =>
        search === "" ||
        d.licensee.toLowerCase().includes(search.toLowerCase()) ||
        d.product_code.toLowerCase().includes(search.toLowerCase()) ||
        d.domain.toLowerCase().includes(search.toLowerCase()) ||
        d.ip.toLowerCase().includes(search.toLowerCase())
    );
  }, [deployments, search]);

  const handleConfirmAction = async () => {
    if (!confirmTarget) return;
    setProcessing(true);
    try {
      await onToggleKillSwitch(confirmTarget.license_id, confirmTarget.is_revoked);
      setConfirmTarget(null);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-full rounded-2xl bg-zinc-900/50 border border-zinc-800/80 p-4 space-y-3">
      {/* Card Header */}
      <div className="flex items-center justify-between pb-2 border-b border-zinc-800/60">
        <div className="flex items-center gap-2">
          <Server className="w-4 h-4 text-zinc-300" />
          <h2 className="text-xs font-semibold text-white tracking-tight">Deployments</h2>
          <Tooltip content="Live nodes receiving cryptographic telemetry. Toggling Kill Switch immediately returns HTTP 402 on client endpoints." />
        </div>
        <span className="text-[10px] font-mono text-zinc-400">
          {deployments.length} total
        </span>
      </div>

      {/* Mini Search */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter client, IP, domain..."
          className="w-full bg-zinc-950/80 border border-zinc-800/80 rounded-xl pl-8 pr-3 py-1.5 text-[11px] text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-600 transition-colors"
        />
      </div>

      {/* Deployments List */}
      <div className="flex-1 space-y-2 overflow-y-auto max-h-[380px] pr-1">
        {filteredDeployments.length === 0 ? (
          <div className="p-8 text-center text-[11px] text-zinc-500 rounded-xl border border-dashed border-zinc-800">
            No active nodes recorded yet
          </div>
        ) : (
          filteredDeployments.map((d) => (
            <div
              key={d.license_id}
              className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                d.is_revoked
                  ? "bg-rose-950/15 border-rose-900/30"
                  : "bg-zinc-950/40 border-zinc-800/60 hover:border-zinc-700/60"
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-white truncate">
                    {d.licensee}
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400">
                    {d.product_code}
                  </span>
                  {d.is_revoked ? (
                    <span className="text-[9px] font-medium px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      Revoked
                    </span>
                  ) : (
                    <span className="text-[9px] font-medium px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                      Active
                    </span>
                  )}
                </div>

                <div className="text-[10px] text-zinc-500 truncate mt-0.5 font-mono">
                  {d.domain} • IP: {d.ip}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setConfirmTarget(d)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all shrink-0 cursor-pointer ${
                  d.is_revoked
                    ? "bg-emerald-500 hover:bg-emerald-400 text-zinc-950"
                    : "bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30"
                }`}
              >
                {d.is_revoked ? "Restore" : "Revoke"}
              </button>
            </div>
          ))
        )}
      </div>

      {/* Confirmation Dialog */}
      {confirmTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-100">
          <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-2xl space-y-4 text-xs font-sans">
            <div className="flex items-center gap-2 text-white">
              <AlertTriangle className={`w-5 h-5 ${confirmTarget.is_revoked ? "text-emerald-400" : "text-rose-400"}`} />
              <h3 className="font-semibold text-sm">
                {confirmTarget.is_revoked ? "Restore Authorization" : "Engage Kill Switch"}
              </h3>
            </div>

            <p className="text-zinc-400 text-xs leading-relaxed">
              {confirmTarget.is_revoked
                ? `Restore operations for "${confirmTarget.licensee}" (${confirmTarget.product_code})? Client API requests will be allowed again.`
                : `Are you sure you want to freeze operations for "${confirmTarget.licensee}"? All client API calls will immediately return HTTP 402 Payment Required.`}
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setConfirmTarget(null)}
                className="px-3 py-1.5 rounded-xl text-zinc-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={processing}
                onClick={handleConfirmAction}
                className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  confirmTarget.is_revoked
                    ? "bg-emerald-500 hover:bg-emerald-400 text-zinc-950"
                    : "bg-rose-600 hover:bg-rose-500 text-white"
                }`}
              >
                {processing ? "Updating..." : confirmTarget.is_revoked ? "Confirm Restore" : "Confirm Revoke"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
