import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage";

export async function POST(req: NextRequest) {
  try {
    const { license_id, action } = await req.json();

    if (!license_id) {
      return NextResponse.json({ error: "license_id is required" }, { status: 400 });
    }

    const shouldRevoke = action === "REVOKE";
    storage.setRevoked(license_id, shouldRevoke);

    return NextResponse.json({
      success: true,
      license_id,
      is_revoked: storage.isRevoked(license_id),
      message: shouldRevoke
        ? "KILL-SWITCH ENGAGED: Client deployment revoked."
        : "ACCESS RESTORED: Client deployment unblocked.",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
