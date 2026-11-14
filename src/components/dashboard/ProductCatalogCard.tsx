"use client";

import React, { useState, useMemo } from "react";
import { Layers, Plus, Search, CheckCircle2 } from "lucide-react";
import { Product, DeploymentRecord } from "@/types/license";
import { Tooltip } from "@/components/ui/Tooltip";
import { IconButton } from "@/components/ui/IconButton";

interface ProductCatalogCardProps {
  products: Product[];
  selectedProduct: string;
  onSelectProduct: (code: string) => void;
  onOpenAddModal: () => void;
  deployments: DeploymentRecord[];
}

export function ProductCatalogCard({
  products,
  selectedProduct,
  onSelectProduct,
  onOpenAddModal,
  deployments,
}: ProductCatalogCardProps) {
  const [search, setSearch] = useState("");

  const filteredProducts = useMemo(() => {
    return products.filter(
      (p) =>
        search === "" ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.code.toLowerCase().includes(search.toLowerCase())
    );
  }, [products, search]);

  const getProductDeploymentCount = (code: string) => {
    return deployments.filter((d) => d.product_code === code).length;
  };

  return (
    <div className="flex flex-col h-full rounded-2xl bg-zinc-900/50 border border-zinc-800/80 p-4 space-y-3">
      {/* Card Header */}
      <div className="flex items-center justify-between pb-2 border-b border-zinc-800/60">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-zinc-300" />
          <h2 className="text-xs font-semibold text-white tracking-tight">Products</h2>
          <Tooltip content="Software catalogs configured for independent cryptographic licensing and kill-switch governance." />
        </div>
        <IconButton
          icon={Plus}
          tooltip="Add Product"
          onClick={onOpenAddModal}
          size="xs"
          variant="primary"
        />
      </div>

      {/* Mini Search */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search catalog..."
          className="w-full bg-zinc-950/80 border border-zinc-800/80 rounded-xl pl-8 pr-3 py-1.5 text-[11px] text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-600 transition-colors"
        />
      </div>

      {/* Product List */}
      <div className="flex-1 space-y-1.5 overflow-y-auto max-h-[380px] pr-1">
        {filteredProducts.length === 0 ? (
          <div className="p-6 text-center text-[11px] text-zinc-500 rounded-xl border border-dashed border-zinc-800">
            No products found
          </div>
        ) : (
          filteredProducts.map((p) => {
            const isSelected = selectedProduct === p.code;
            const count = getProductDeploymentCount(p.code);

            return (
              <button
                key={p.code}
                type="button"
                onClick={() => onSelectProduct(p.code)}
                className={`w-full text-left p-2.5 rounded-xl border transition-all duration-150 flex items-center justify-between cursor-pointer group ${
                  isSelected
                    ? "bg-zinc-800/80 border-zinc-600 text-white shadow-sm"
                    : "bg-zinc-950/40 border-zinc-800/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 hover:border-zinc-700/60"
                }`}
              >
                <div className="min-w-0 pr-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium truncate">{p.name}</span>
                    {isSelected && <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />}
                  </div>
                  <div className="text-[10px] font-mono text-zinc-400 truncate mt-0.5">
                    {p.code}
                  </div>
                </div>

                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full shrink-0 ${
                    count > 0
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-zinc-800 text-zinc-400"
                  }`}
                >
                  {count} {count === 1 ? "node" : "nodes"}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

