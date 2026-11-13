import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { license_id, product_code, licensee, domain, tier } = body;

    if (!license_id) {
      return NextResponse.json({ status: "ERROR", message: "Missing license_id" }, { status: 400 });
    }

    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "sentinel-client-agent";

    // Record heartbeat ping
    storage.recordDeployment({
      license_id,
      product_code: product_code || "GENERIC",
      licensee: licensee || "Unknown Client",
      domain: domain || "*",
      tier: tier || "ENTERPRISE",
      ip,
      user_agent: userAgent,
      last_seen: new Date().toISOString(),
      is_revoked: storage.isRevoked(license_id),
      expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    });

    // Check Kill-Switch
    if (storage.isRevoked(license_id)) {
      return NextResponse.json({
        status: "REVOKED",
        valid: false,
        reason: "Access revoked by Developer via Sentinel License Authority.",
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      status: "ACTIVE",
      valid: true,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ status: "ERROR", message: err.message }, { status: 500 });
  }
}

export async function GET() {
  const deployments = storage.getDeployments();
  const products = storage.getProducts();

  return NextResponse.json({
    total_deployments: deployments.length,
    active_deployments: deployments.filter((d) => !d.is_revoked).length,
    revoked_deployments: deployments.filter((d) => d.is_revoked).length,
    products_count: products.length,
    deployments,
    products,
  });
}
