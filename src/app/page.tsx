"use client";

import React, { useState, useEffect } from "react";
import {
  Shield,
  Key,
  Power,
  RefreshCw,
  Copy,
  Check,
  Plus,
  Server,
  Layers,
  Globe,
  AlertTriangle,
  Lock,
} from "lucide-react";
import { DeploymentRecord, Product } from "@/types/license";
import { Tooltip } from "@/components/ui/Tooltip";
import { IconButton } from "@/components/ui/IconButton";

export default function SentinelDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [authError, setAuthError] = useState(false);

  // Products
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>("13C_GATEWAY");
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newProdCode, setNewProdCode] = useState("");
  const [newProdName, setNewProdName] = useState("");

  // Generator Form
  const [licensee, setLicensee] = useState("Captain Client");
  const [domain, setDomain] = useState("*");
  const [tier, setTier] = useState<"ENTERPRISE" | "COMMERCIAL" | "TRIAL">("ENTERPRISE");
  const [durationDays, setDurationDays] = useState("365");

  // Output
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Deployments
  const [deployments, setDeployments] = useState<DeploymentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

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
      // fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) fetchData();
  }, [isAuthenticated]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/license/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_code: selectedProduct,
          licensee,
          domain,
          tier,
          duration_days: parseInt(durationDays),
        }),
      });
      const data = await res.json();
      if (data.token) {
        setGeneratedToken(data.token);
        setNotice(`Issued license for ${licensee} on ${selectedProduct}`);
        setTimeout(() => setNotice(null), 3000);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
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

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdCode.trim() || !newProdName.trim()) return;

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: newProdCode, name: newProdName }),
      });
      const data = await res.json();
      if (data.product) {
        setProducts([...products, data.product]);
        setSelectedProduct(data.product.code);
        setShowAddProductModal(false);
        setNewProdCode("");
        setNewProdName("");
      }
    } catch (err: any) {
      alert("Failed to add product: " + err.message);
    }
  };

  const copyToken = () => {
    if (!generatedToken) return;
    navigator.clipboard.writeText(generatedToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-[#0B0E14] text-xs">
        <div className="w-full max-w-sm bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">Sentinel Authority</h1>
              <p className="text-[11px] text-zinc-400">Universal Developer Access</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-3 pt-2">
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
              className="w-full py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold transition-colors"
            >
              Sign In to Controller
            </button>
          </form>
        </div>
      </main>
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
            onClick={() => setIsAuthenticated(false)}
            className="px-3 py-1.5 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800/50"
          >
            Lock Console
          </button>
        </div>
      </div>

      {notice && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center justify-between animate-in fade-in">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} className="text-zinc-400 hover:text-white">
            <Check className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Product Selection Bar */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-2 shadow-xl">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400 ml-1" />
          <span className="text-xs text-zinc-400 font-semibold">Active Product:</span>
          <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-800">
            {products.map((p) => (
              <button
                key={p.code}
                onClick={() => setSelectedProduct(p.code)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
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
          onClick={() => setShowAddProductModal(true)}
          variant="primary"
          size="sm"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Generator Form */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-800/80">
            <Key className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-white">Issue License for {selectedProduct}</h2>
            <Tooltip content="Generates an offline digitally signed Ed25519 token. Embedded public key in client app will strictly validate this signature." />
          </div>

          <form onSubmit={handleGenerate} className="space-y-3">
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
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
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
              className="w-full py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-zinc-950 font-bold transition-colors"
            >
              Sign & Generate Enterprise Token
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
                  className="inline-flex items-center gap-1 text-[11px] text-zinc-300 hover:text-white font-medium"
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

        {/* Remote Kill-Switch Controller */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
              <div className="flex items-center gap-2">
                <Power className="w-4 h-4 text-rose-400" />
                <h2 className="text-sm font-bold text-white">Global Kill-Switch Controller</h2>
                <Tooltip content="Client installations periodically send an encrypted heartbeat. Toggling Kill-Switch instantly revokes authorization and halts transactions." />
              </div>
              <span className="text-[10px] font-mono text-zinc-400">{deployments.length} Active Deployments</span>
            </div>

            <p className="text-zinc-400 mt-2 mb-3">
              Deployments pinging Sentinel. You have sovereign power to instantly freeze any client deployment.
            </p>

            <div className="space-y-2 max-h-72 overflow-y-auto font-mono">
              {deployments.length === 0 ? (
                <div className="p-6 rounded-xl bg-zinc-950/60 border border-zinc-800 text-center text-zinc-500">
                  No heartbeats recorded yet. Client pings will appear automatically.
                </div>
              ) : (
                deployments.map((d) => (
                  <div
                    key={d.license_id}
                    className={`p-3 rounded-xl border flex items-center justify-between ${
                      d.is_revoked ? "bg-rose-500/10 border-rose-500/30" : "bg-zinc-950/70 border-zinc-800"
                    }`}
                  >
                    <div>
                      <div className="text-white font-sans font-bold flex items-center gap-1.5">
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-zinc-800 text-cyan-400 font-mono">
                          {d.product_code}
                        </span>
                        <span>{d.licensee}</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                            d.is_revoked ? "bg-rose-500/20 text-rose-400" : "bg-emerald-500/20 text-emerald-400"
                          }`}
                        >
                          {d.is_revoked ? "REVOKED" : "ACTIVE"}
                        </span>
                      </div>
                      <div className="text-[10px] text-zinc-500 truncate max-w-[220px]">
                        {d.domain} • IP: {d.ip}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleKillSwitch(d.license_id, d.is_revoked)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                        d.is_revoked
                          ? "bg-emerald-500 hover:bg-emerald-400 text-zinc-950"
                          : "bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30"
                      }`}
                    >
                      {d.is_revoked ? "Restore" : "Kill Switch"}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              <strong>Emergency Lockdown:</strong> Clicking Kill Switch immediately returns HTTP 402 on all client endpoints on their next heartbeat check.
            </p>
          </div>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm max-h-[90vh] overflow-y-auto bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-2xl space-y-4 text-xs font-sans">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">Add Product to Catalog</h3>
            </div>

            <form onSubmit={handleAddProduct} className="space-y-3">
              <div>
                <label className="text-zinc-400 block mb-1">Product Code</label>
                <input
                  type="text"
                  required
                  value={newProdCode}
                  onChange={(e) => setNewProdCode(e.target.value)}
                  placeholder="e.g. TRADING_BOT_V2"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono uppercase focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Product Display Name</label>
                <input
                  type="text"
                  required
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  placeholder="e.g. AI Arbitrage Trading Bot"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="px-3 py-1.5 rounded-xl text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-zinc-950 font-bold transition-colors"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

