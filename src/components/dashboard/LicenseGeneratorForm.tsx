"use client";

import React, { useState } from "react";
import { Key, Copy, Check } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";

interface LicenseGeneratorFormProps {
  selectedProduct: string;
  onGenerate: (data: {
    licensee: string;
    domain: string;
    tier: "ENTERPRISE" | "COMMERCIAL" | "TRIAL";
    durationDays: number;
  }) => Promise<void>;
  generatedToken: string | null;
}

export function LicenseGeneratorForm({
  selectedProduct,
  onGenerate,
  generatedToken,
}: LicenseGeneratorFormProps) {
  const [licensee, setLicensee] = useState("Captain Client");
  const [domain, setDomain] = useState("*");
  const [tier, setTier] = useState<"ENTERPRISE" | "COMMERCIAL" | "TRIAL">("ENTERPRISE");
  const [durationDays, setDurationDays] = useState("365");
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onGenerate({
        licensee,
        domain,
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
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 shadow-xl space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b border-zinc-800/80">
        <Key className="w-4 h-4 text-cyan-400" />
        <h2 className="text-sm font-bold text-white">Issue License for {selectedProduct}</h2>
        <Tooltip content="Generates an offline digitally signed Ed25519 token. Embedded public key in client app will strictly validate this signature." />
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="text-zinc-400 font-medium block mb-1">Licensee / Client Name</label>
          <input
            type="text"
            required
            value={licensee}
            onChange={(e) => setLicensee(e.target.value)}
            placeholder="e.g. Captain Client / Toko ABC"
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-zinc-400 font-medium block mb-1">Allowed Domain</label>
            <input
              type="text"
              required
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="* or client-domain.com"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="text-zinc-400 font-medium block mb-1">Tier</label>
            <select
              value={tier}
              onChange={(e) => setTier(e.target.value as any)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="ENTERPRISE">Enterprise (Full)</option>
              <option value="COMMERCIAL">Commercial Standard</option>
              <option value="TRIAL">Trial 30 Days</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-zinc-400 font-medium block mb-1">Duration (Days)</label>
          <input
            type="number"
            min="1"
            required
            value={durationDays}
            onChange={(e) => setDurationDays(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 text-zinc-950 font-bold transition-colors cursor-pointer"
        >
          {submitting ? "Signing Token..." : "Sign & Generate Enterprise Token"}
        </button>
      </form>

      {/* Generated Token Display */}
      {generatedToken && (
        <div className="p-3.5 rounded-xl bg-zinc-950 border border-cyan-500/30 space-y-2 animate-in fade-in">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">Signed Token</span>
            <button
              type="button"
              onClick={copyToken}
              className="inline-flex items-center gap-1 text-[11px] text-zinc-300 hover:text-white font-medium cursor-pointer"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? "Copied!" : "Copy Token"}</span>
            </button>
          </div>
          <p className="font-mono text-[10px] text-zinc-400 break-all select-all line-clamp-3">
            {generatedToken}
          </p>
        </div>
      )}
    </div>
  );
}

