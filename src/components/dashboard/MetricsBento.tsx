"use client";

import React from "react";
import { Layers, Server, Power, KeyRound } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";

interface MetricsBentoProps {
  totalProducts: number;
  activeDeployments: number;
  revokedDeployments: number;
}

export function MetricsBento({
  totalProducts,
  activeDeployments,
  revokedDeployments,
}: MetricsBentoProps) {
  const cards = [
    {
      label: "Products",
      value: totalProducts,
      icon: Layers,
      tooltip: "Registered software products managed under this authority instance.",
      accent: "text-zinc-200",
    },
    {
      label: "Active Nodes",
      value: activeDeployments,
      icon: Server,
      tooltip: "Client installations with verified active heartbeats within valid license parameters.",
      accent: "text-emerald-400",
      live: true,
    },
    {
      label: "Revoked Nodes",
      value: revokedDeployments,
      icon: Power,
      tooltip: "Deployments currently locked down via remote kill-switch.",
      accent: revokedDeployments > 0 ? "text-rose-400" : "text-zinc-400",
    },
    {
      label: "Signing Engine",
      value: "Ed25519",
      icon: KeyRound,
      tooltip: "Elliptic curve digital signature algorithm operating with 256-bit sovereign master key.",
      accent: "text-cyan-400",
      isMono: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div
            key={c.label}
            className="group relative p-4 rounded-2xl bg-zinc-900/50 hover:bg-zinc-900/80 border border-zinc-800/80 hover:border-zinc-700/80 transition-all duration-200"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-zinc-400 tracking-tight flex items-center gap-1.5">
                {c.live && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                <span>{c.label}</span>
                <Tooltip content={c.tooltip} />
              </span>
              <div className="w-7 h-7 rounded-lg bg-zinc-800/50 flex items-center justify-center text-zinc-400 group-hover:text-zinc-200 transition-colors">
                <Icon className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className={`text-xl font-bold tracking-tight text-white ${c.isMono ? "font-mono text-sm" : ""}`}>
                {c.value}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
