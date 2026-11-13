"use client";

import React, { useState, useEffect } from "react";
import { Check } from "lucide-react";
import { DeploymentRecord, Product } from "@/types/license";
import { LoginView } from "@/components/dashboard/LoginView";
import { HeaderBar } from "@/components/dashboard/HeaderBar";
import { MetricsBento } from "@/components/dashboard/MetricsBento";
import { ProductCatalogCard } from "@/components/dashboard/ProductCatalogCard";
import { LicenseIssueCard } from "@/components/dashboard/LicenseIssueCard";
import { DeploymentsCard } from "@/components/dashboard/DeploymentsCard";
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

  // Generated Token
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsAuthenticated(true);
        setAuthError(false);
        fetchData();
      } else {
        setAuthError(true);
      }
    } catch {
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
      // Offline fallback
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
      setNotice(`Issued license for ${params.licensee}`);
      setTimeout(() => setNotice(null), 3000);
    }
  };

  const handleToggleKillSwitch = async (licenseId: string, currentlyRevoked: boolean) => {
    const action = currentlyRevoked ? "RESTORE" : "REVOKE";
    try {
      await fetch("/api/license/toggle-revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ license_id: licenseId, action }),
      });
      await fetchData();
      setNotice(currentlyRevoked ? "Operations restored" : "Kill-switch engaged!");
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
      setNotice(`Registered ${name}`);
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

  const activeCount = deployments.filter((d) => !d.is_revoked).length;
  const revokedCount = deployments.filter((d) => d.is_revoked).length;

  return (
    <main className="min-h-screen bg-[#09090b] text-zinc-100 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto font-sans text-xs">
      {/* Sleek Minimalist Header */}
      <HeaderBar
        onRefresh={fetchData}
        onLock={() => setIsAuthenticated(false)}
        loading={loading}
      />

      {/* Floating Notice */}
      {notice && (
        <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-700/80 text-xs text-white flex items-center justify-between shadow-lg animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>{notice}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="text-zinc-400 hover:text-white cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Bento Quick Metrics */}
      <MetricsBento
        totalProducts={products.length}
        activeDeployments={activeCount}
        revokedDeployments={revokedCount}
      />

      {/* Main 3-Column Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left Column (3 cols): Product Catalog */}
        <div className="lg:col-span-3">
          <ProductCatalogCard
            products={products}
            selectedProduct={selectedProduct}
            onSelectProduct={setSelectedProduct}
            onOpenAddModal={() => setShowAddProductModal(true)}
            deployments={deployments}
          />
        </div>

        {/* Center Column (4 cols): Issue License Form */}
        <div className="lg:col-span-4">
          <LicenseIssueCard
            selectedProduct={selectedProduct}
            onGenerate={handleGenerate}
            generatedToken={generatedToken}
          />
        </div>

        {/* Right Column (5 cols): Deployments & Kill-Switch */}
        <div className="lg:col-span-5">
          <DeploymentsCard
            deployments={deployments}
            onToggleKillSwitch={handleToggleKillSwitch}
          />
        </div>
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
