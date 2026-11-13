"use client";

import React from "react";
import { Power, AlertTriangle } from "lucide-react";
import { DeploymentRecord } from "@/types/license";
import { Tooltip } from "@/components/ui/Tooltip";

interface KillSwitchControllerProps {
  deployments: DeploymentRecord[];
  onToggleKillSwitch: (licenseId: string, currentlyRevoked: boolean) => Promise<void>;
}

export function KillSwitchController({
  deployments,
  onToggleKillSwitch,
}: KillSwitchControllerProps) {
  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 shadow-xl space-y-4 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
          <div className="flex items-center gap-2">
            <Power className="w-4 h-4 text-rose-400" />
            <h2 className="text-sm font-bold text-white">Global Kill-Switch Controller</h2>
            <Tooltip content="Client installations periodically send an encrypted heartbeat. Toggling Kill-Switch instantly revokes authorization and halts transactions." />
          </div>
          <span className="text-[10px] font-mono text-zinc-400">
            {deployments.length} Active Deployments
          </span>
        </div>

        <p className="text-zinc-400 mt-2 mb-3">
          Deployments pinging Sentinel. You have sovereign power to instantly freeze any client deployment.
        </p>

        <div className="space-y-2 max-h-72 overflow-y-auto font-mono">
          {deployments.length === 0 ? (
            <div className="p-6 rounded-xl bg-zinc-950/60 border border-zinc-800 text-center text-zinc-500">
              No heartbeats recorded yet. Client pings will appear automatically.
            </div>
          ) : (
            deployments.map((d) => (
              <div
                key={d.license_id}
                className={`p-3 rounded-xl border flex items-center justify-between ${
                  d.is_revoked ? "bg-rose-500/10 border-rose-500/30" : "bg-zinc-950/70 border-zinc-800"
                }`}
              >
                <div>
                  <div className="text-white font-sans font-bold flex items-center gap-1.5">
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-cyan-400 font-mono">
                      {d.product_code}
                    </span>
                    <span>{d.licensee}</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                        d.is_revoked ? "bg-rose-500/20 text-rose-400" : "bg-emerald-500/20 text-emerald-400"
                      }`}
                    >
                      {d.is_revoked ? "REVOKED" : "ACTIVE"}
                    </span>
                  </div>
                  <div className="text-[10px] text-zinc-500 truncate max-w-[220px]">
                    {d.domain} • IP: {d.ip}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onToggleKillSwitch(d.license_id, d.is_revoked)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    d.is_revoked
                      ? "bg-emerald-500 hover:bg-emerald-400 text-zinc-950"
                      : "bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30"
                  }`}
                >
                  {d.is_revoked ? "Restore" : "Kill Switch"}
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
        <p className="text-[11px] leading-relaxed">
          <strong>Emergency Lockdown:</strong> Clicking Kill Switch immediately returns HTTP 402 on all client endpoints on their next heartbeat check.
        </p>
      </div>
    </div>
  );
}

