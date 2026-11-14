"use client";

import React from "react";
import { Shield, RefreshCw, Lock } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";
import { IconButton } from "@/components/ui/IconButton";

interface HeaderBarProps {
  onRefresh: () => void;
  onLock: () => void;
  loading: boolean;
}

export function HeaderBar({ onRefresh, onLock, loading }: HeaderBarProps) {
  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-zinc-800/80 gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-zinc-900 border border-zinc-700/60 flex items-center justify-center text-zinc-100 shadow-sm">
          <Shield className="w-5 h-5 text-zinc-200" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold text-white tracking-tight">Sentinel</h1>
            <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700/60">
              Authority
            </span>
            <Tooltip content="Sovereign Ed25519 cryptographic license authority and real-time remote kill-switch controller." />
          </div>
          <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Operational</span>
            <span className="text-zinc-600">•</span>
            <span>Ed25519 Engine</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <IconButton
          icon={RefreshCw}
          tooltip="Refresh Heartbeats"
          onClick={onRefresh}
          loading={loading}
          size="sm"
        />

        <button
          type="button"
          onClick={onLock}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-800 hover:border-zinc-700 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-medium transition-all active:scale-95 cursor-pointer"
        >
          <Lock className="w-3.5 h-3.5 text-zinc-400" />
          <span>Lock</span>
        </button>
      </div>
    </header>
  );
}

