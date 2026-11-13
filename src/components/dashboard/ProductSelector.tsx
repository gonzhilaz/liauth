"use client";

import React from "react";
import { Layers, Plus } from "lucide-react";
import { Product } from "@/types/license";
import { IconButton } from "@/components/ui/IconButton";

interface ProductSelectorProps {
  products: Product[];
  selectedProduct: string;
  onSelectProduct: (code: string) => void;
  onOpenAddModal: () => void;
}

export function ProductSelector({
  products,
  selectedProduct,
  onSelectProduct,
  onOpenAddModal,
}: ProductSelectorProps) {
  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-2 shadow-xl">
      <div className="flex items-center gap-2">
        <Layers className="w-4 h-4 text-cyan-400 ml-1" />
        <span className="text-xs text-zinc-400 font-semibold">Active Product:</span>
        <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-800">
          {products.map((p) => (
            <button
              key={p.code}
              type="button"
              onClick={() => onSelectProduct(p.code)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedProduct === p.code
                  ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      <IconButton
        icon={Plus}
        tooltip="Add New Product Code"
        onClick={onOpenAddModal}
        variant="primary"
        size="sm"
      />
    </div>
  );
}

