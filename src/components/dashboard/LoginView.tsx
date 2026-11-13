"use client";

import React from "react";
import { Shield } from "lucide-react";

interface LoginViewProps {
  passcode: string;
  setPasscode: (val: string) => void;
  authError: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export function LoginView({ passcode, setPasscode, authError, onSubmit }: LoginViewProps) {
  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-[#0B0E14] text-xs">
      <div className="w-full max-w-sm bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-4 font-sans">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white">Sentinel Authority</h1>
            <p className="text-[11px] text-zinc-400">Universal Developer Access</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-3 pt-2">
          <div>
            <label className="text-zinc-400 font-medium block mb-1">Developer Passcode</label>
            <input
              type="password"
              required
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="developer-root"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500"
            />
            {authError && <p className="text-[11px] text-rose-400 mt-1">Invalid passcode</p>}
          </div>

          <button
            type="submit"
            className="w-full py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold transition-colors cursor-pointer"
          >
            Sign In to Controller
          </button>
        </form>
      </div>
    </main>
  );
}
