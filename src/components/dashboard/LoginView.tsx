"use client";

import React, { useState } from "react";
import { Shield, ArrowRight, Lock } from "lucide-react";

interface LoginViewProps {
  passcode: string;
  setPasscode: (val: string) => void;
  authError: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export function LoginView({ passcode, setPasscode, authError, onSubmit }: LoginViewProps) {
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-[#09090b] text-xs">
      <div className="w-full max-w-sm bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 shadow-2xl backdrop-blur-xl space-y-5 font-sans">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-zinc-200 shadow-sm">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white tracking-tight">Sentinel Authority</h1>
            <p className="text-[11px] text-zinc-400">Developer Master Access</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-medium text-zinc-400">
                Master Passcode
              </label>
              <Lock className="w-3 h-3 text-zinc-500" />
            </div>
            <input
              type="password"
              required
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="Enter master passcode..."
              className="w-full bg-zinc-950/80 border border-zinc-800/80 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600 transition-colors"
            />
            {authError && (
              <p className="text-[11px] text-rose-400 mt-1.5 animate-in fade-in">
                Invalid Master Passcode
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-semibold transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            <span>{submitting ? "Authenticating..." : "Sign In to Console"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        <div className="pt-2 border-t border-zinc-800/60 text-center">
          <span className="text-[10px] text-zinc-400 font-mono">
            Ed25519 Asymmetric Protected
          </span>
        </div>
      </div>
    </main>
  );
}
