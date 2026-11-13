import { DeploymentRecord, Product } from "@/types/license";

declare global {
  var __SENTINEL_REVOCATIONS: Set<string> | undefined;
  var __SENTINEL_DEPLOYMENTS: Map<string, DeploymentRecord> | undefined;
  var __SENTINEL_PRODUCTS: Product[] | undefined;
}

if (!globalThis.__SENTINEL_REVOCATIONS) {
  globalThis.__SENTINEL_REVOCATIONS = new Set<string>();
}

if (!globalThis.__SENTINEL_DEPLOYMENTS) {
  globalThis.__SENTINEL_DEPLOYMENTS = new Map<string, DeploymentRecord>();
}

if (!globalThis.__SENTINEL_PRODUCTS) {
  globalThis.__SENTINEL_PRODUCTS = [
    {
      id: "prod-1",
      code: "13C_GATEWAY",
      name: "13C Crypto Payment Gateway",
      description: "Non-custodial & Escrow cryptocurrency payment processing engine",
      created_at: "2026-11-13T00:00:00Z",
    },
    {
      id: "prod-2",
      code: "EXP_P2P",
      name: "EXP P2P Escrow Platform",
      description: "Peer-to-peer cryptocurrency escrow exchange engine",
      created_at: "2026-11-13T00:00:00Z",
    },
    {
      id: "prod-3",
      code: "ENTERPRISE_ERP",
      name: "Enterprise Multi-Language ERP",
      description: "High-scale business automation and plantation management system",
      created_at: "2026-11-13T00:00:00Z",
    },
  ];
}

export const storage = {
  // Products
  getProducts(): Product[] {
    return globalThis.__SENTINEL_PRODUCTS!;
  },

  addProduct(product: Product) {
    globalThis.__SENTINEL_PRODUCTS!.push(product);
  },

  // Deployments
  recordDeployment(record: DeploymentRecord) {
    globalThis.__SENTINEL_DEPLOYMENTS!.set(record.license_id, record);
  },

  getDeployments(): DeploymentRecord[] {
    return Array.from(globalThis.__SENTINEL_DEPLOYMENTS!.values()).map((d) => ({
      ...d,
      is_revoked: globalThis.__SENTINEL_REVOCATIONS!.has(d.license_id),
    }));
  },

  // Revocation / Kill-Switch
  isRevoked(licenseId: string): boolean {
    return globalThis.__SENTINEL_REVOCATIONS!.has(licenseId);
  },

  setRevoked(licenseId: string, revoked: boolean) {
    if (revoked) {
      globalThis.__SENTINEL_REVOCATIONS!.add(licenseId);
    } else {
      globalThis.__SENTINEL_REVOCATIONS!.delete(licenseId);
    }
  },
};

