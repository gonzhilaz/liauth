"use client";

import React, { useState } from "react";
import { Layers, X } from "lucide-react";

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProduct: (code: string, name: string) => Promise<void>;
}

export function AddProductModal({ isOpen, onClose, onAddProduct }: AddProductModalProps) {
  const [newProdCode, setNewProdCode] = useState("");
  const [newProdName, setNewProdName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdCode.trim() || !newProdName.trim()) return;

    setSubmitting(true);
    try {
      await onAddProduct(newProdCode.trim(), newProdName.trim());
      setNewProdCode("");
      setNewProdName("");
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-100">
      <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-2xl space-y-4 text-xs font-sans">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-zinc-300" />
            <h3 className="text-xs font-semibold text-white">Add Product</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-[11px] font-medium text-zinc-400 block mb-1">
              Product Code
            </label>
            <input
              type="text"
              required
              value={newProdCode}
              onChange={(e) => setNewProdCode(e.target.value)}
              placeholder="e.g. TRADING_BOT_V2"
              className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white font-mono uppercase placeholder-zinc-500 focus:outline-none focus:border-zinc-600 transition-colors"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-zinc-400 block mb-1">
              Display Name
            </label>
            <input
              type="text"
              required
              value={newProdName}
              onChange={(e) => setNewProdName(e.target.value)}
              placeholder="e.g. Arbitrage Bot"
              className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600 transition-colors"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl text-xs text-zinc-400 hover:text-white cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-1.5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-semibold transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer shadow-sm"
            >
              {submitting ? "Saving..." : "Save Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
