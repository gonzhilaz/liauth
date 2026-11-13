"use client";

import React, { useState } from "react";
import { KeyRound, Copy, Check, Sparkles } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";

interface LicenseIssueCardProps {
  selectedProduct: string;
  onGenerate: (data: {
    licensee: string;
    domain: string;
    tier: "ENTERPRISE" | "COMMERCIAL" | "TRIAL";
    durationDays: number;
  }) => Promise<void>;
  generatedToken: string | null;
}

export function LicenseIssueCard({
  selectedProduct,
  onGenerate,
  generatedToken,
}: LicenseIssueCardProps) {
  const [licensee, setLicensee] = useState("Captain Client");
  const [domain, setDomain] = useState("*");
  const [tier, setTier] = useState<"ENTERPRISE" | "COMMERCIAL" | "TRIAL">("ENTERPRISE");
  const [durationDays, setDurationDays] = useState("365");
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onGenerate({
        licensee: licensee.trim(),
        domain: domain.trim(),
        tier,
        durationDays: parseInt(durationDays) || 365,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const copyToken = () => {
    if (!generatedToken) return;
    navigator.clipboard.writeText(generatedToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full rounded-2xl bg-zinc-900/50 border border-zinc-800/80 p-4 space-y-4">
      {/* Card Header */}
      <div className="flex items-center justify-between pb-2 border-b border-zinc-800/60">
        <div className="flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-zinc-300" />
          <h2 className="text-xs font-semibold text-white tracking-tight">Issue License</h2>
          <Tooltip content="Signs an offline verifiable Ed25519 token bound to specific domain, expiration, and tier." />
        </div>
        <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-zinc-800 text-cyan-300 border border-zinc-700/60">
          {selectedProduct}
        </span>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="text-[11px] font-medium text-zinc-400 block mb-1">
            Client Name
          </label>
          <input
            type="text"
            required
            value={licensee}
            onChange={(e) => setLicensee(e.target.value)}
            placeholder="e.g. Captain Store"
            className="w-full bg-zinc-950/80 border border-zinc-800/80 rounded-xl px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600 transition-colors"
          />
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="text-[11px] font-medium text-zinc-400 block mb-1">
              Allowed Domain
            </label>
            <input
              type="text"
              required
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="* or app.domain.com"
              className="w-full bg-zinc-950/80 border border-zinc-800/80 rounded-xl px-3 py-1.5 text-xs text-white font-mono placeholder-zinc-500 focus:outline-none focus:border-zinc-600 transition-colors"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-zinc-400 block mb-1">
              License Tier
            </label>
            <select
              value={tier}
              onChange={(e) => setTier(e.target.value as any)}
              className="w-full bg-zinc-950/80 border border-zinc-800/80 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-600 transition-colors cursor-pointer"
            >
              <option value="ENTERPRISE">Enterprise</option>
              <option value="COMMERCIAL">Commercial</option>
              <option value="TRIAL">Trial 30d</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-[11px] font-medium text-zinc-400 block mb-1">
            Duration Days
          </label>
          <input
            type="number"
            min="1"
            required
            value={durationDays}
            onChange={(e) => setDurationDays(e.target.value)}
            className="w-full bg-zinc-950/80 border border-zinc-800/80 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-600 transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-2 px-4 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-semibold transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-zinc-950" />
          <span>{submitting ? "Signing..." : "Generate Signed Token"}</span>
        </button>
      </form>

      {/* Output Token Box */}
      {generatedToken && (
        <div className="p-3 rounded-xl bg-zinc-950/90 border border-zinc-800/80 space-y-1.5 animate-in fade-in">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium text-zinc-400">Signed Token</span>
            <button
              type="button"
              onClick={copyToken}
              className="inline-flex items-center gap-1 text-[10px] font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 text-zinc-400" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
          <div className="p-2 rounded-lg bg-zinc-900/60 border border-zinc-800/60 font-mono text-[10px] text-zinc-300 break-all select-all line-clamp-3">
            {generatedToken}
          </div>
        </div>
      )}
    </div>
  );
}
