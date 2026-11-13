"use client";

import React, { useState, useEffect } from "react";
import { Shield, RefreshCw, Check } from "lucide-react";
import { DeploymentRecord, Product } from "@/types/license";
import { IconButton } from "@/components/ui/IconButton";
import { LoginView } from "@/components/dashboard/LoginView";
import { ProductSelector } from "@/components/dashboard/ProductSelector";
import { LicenseGeneratorForm } from "@/components/dashboard/LicenseGeneratorForm";
import { KillSwitchController } from "@/components/dashboard/KillSwitchController";
import { AddProductModal } from "@/components/dashboard/AddProductModal";

export default function SentinelDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [authError, setAuthError] = useState(false);

  // Products & Deployments
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>("13C_GATEWAY");
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [deployments, setDeployments] = useState<DeploymentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Generated token
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === "developer-root" || passcode.length >= 8) {
      setIsAuthenticated(true);
      setAuthError(false);
      fetchData();
    } else {
      setAuthError(true);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/verify");
      const data = await res.json();
      if (data.deployments) setDeployments(data.deployments);
      if (data.products) {
        setProducts(data.products);
        if (data.products.length > 0 && !selectedProduct) {
          setSelectedProduct(data.products[0].code);
        }
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) fetchData();
  }, [isAuthenticated]);

  const handleGenerate = async (params: {
    licensee: string;
    domain: string;
    tier: "ENTERPRISE" | "COMMERCIAL" | "TRIAL";
    durationDays: number;
  }) => {
    const res = await fetch("/api/license/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product_code: selectedProduct,
        licensee: params.licensee,
        domain: params.domain,
        tier: params.tier,
        duration_days: params.durationDays,
      }),
    });
    const data = await res.json();
    if (data.token) {
      setGeneratedToken(data.token);
      setNotice(`Issued license for ${params.licensee} on ${selectedProduct}`);
      setTimeout(() => setNotice(null), 3000);
    }
  };

  const handleToggleKillSwitch = async (licenseId: string, currentlyRevoked: boolean) => {
    const action = currentlyRevoked ? "RESTORE" : "REVOKE";
    const promptText = currentlyRevoked
      ? `Restore system access for license ${licenseId}?`
      : `KILL-SWITCH ENGAGE: Are you sure you want to FREEZE client operations?`;

    if (!confirm(promptText)) return;

    try {
      await fetch("/api/license/toggle-revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ license_id: licenseId, action }),
      });
      fetchData();
      setNotice(currentlyRevoked ? "Access restored" : "Kill-switch activated!");
      setTimeout(() => setNotice(null), 3000);
    } catch (err: any) {
      alert("Action failed: " + err.message);
    }
  };

  const handleAddProduct = async (code: string, name: string) => {
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, name }),
    });
    const data = await res.json();
    if (data.product) {
      setProducts([...products, data.product]);
      setSelectedProduct(data.product.code);
      setNotice(`Registered product ${name} (${code})`);
      setTimeout(() => setNotice(null), 3000);
    }
  };

  if (!isAuthenticated) {
    return (
      <LoginView
        passcode={passcode}
        setPasscode={setPasscode}
        authError={authError}
        onSubmit={handleLogin}
      />
    );
  }

  return (
    <main className="min-h-screen bg-[#0B0E14] text-zinc-100 p-4 sm:p-8 space-y-6 max-w-6xl mx-auto font-sans text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-800 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white">Sentinel License Authority</h1>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-zinc-800 text-cyan-400 border border-zinc-700">
                Multi-Product
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">Ed25519 Cryptographic Signer & Global Remote Kill-Switch Hub</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <IconButton icon={RefreshCw} tooltip="Refresh Data" onClick={fetchData} loading={loading} size="sm" />
          <button
            type="button"
            onClick={() => setIsAuthenticated(false)}
            className="px-3 py-1.5 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800/50 cursor-pointer"
          >
            Lock Console
          </button>
        </div>
      </div>

      {notice && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center justify-between animate-in fade-in">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} className="text-zinc-400 hover:text-white cursor-pointer">
            <Check className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Product Selection Bar */}
      <ProductSelector
        products={products}
        selectedProduct={selectedProduct}
        onSelectProduct={setSelectedProduct}
        onOpenAddModal={() => setShowAddProductModal(true)}
      />

      {/* 2-Column Grid: Generator & Kill-Switch */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LicenseGeneratorForm
          selectedProduct={selectedProduct}
          onGenerate={handleGenerate}
          generatedToken={generatedToken}
        />

        <KillSwitchController
          deployments={deployments}
          onToggleKillSwitch={handleToggleKillSwitch}
        />
      </div>

      {/* Add Product Modal */}
      <AddProductModal
        isOpen={showAddProductModal}
        onClose={() => setShowAddProductModal(false)}
        onAddProduct={handleAddProduct}
      />
    </main>
  );
}
