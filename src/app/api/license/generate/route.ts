import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { signLicensePayload } from "@/lib/crypto";
import { GenerateLicenseRequest, LicensePayload } from "@/types/license";

export async function POST(req: NextRequest) {
  try {
    const body: GenerateLicenseRequest = await req.json();

    if (!body.licensee || !body.product_code) {
      return NextResponse.json({ error: "licensee and product_code are required" }, { status: 400 });
    }

    const durationDays = body.duration_days || 365;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

    const licenseId = `SENTINEL-LIC-${crypto.randomUUID()}`;
    const payload: LicensePayload = {
      license_id: licenseId,
      product_code: body.product_code.trim().toUpperCase(),
      licensee: body.licensee.trim(),
      domain: body.domain ? body.domain.trim() : "*",
      tier: body.tier || "ENTERPRISE",
      issued_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      heartbeat_url: process.env.NEXT_PUBLIC_VERIFY_URL || "https://license.yourdomain.vercel.app/api/verify",
      custom_features: body.custom_features || ["full_access"],
    };

    const token = signLicensePayload(payload);

    return NextResponse.json({
      success: true,
      license_id: licenseId,
      token,
      payload,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

