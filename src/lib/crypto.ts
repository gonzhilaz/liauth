import crypto from "crypto";
import { LicensePayload } from "@/types/license";

export const DEV_PRIVATE_KEY_HEX =
  process.env.DEV_PRIVATE_KEY || "59886c805cfb34fe921c8ef9b552c945ed735aa42474064d73db3e8636905720";

export const DEV_PUBLIC_KEY_HEX =
  process.env.DEV_PUBLIC_KEY || "0c3b91b33c1596b8af5110b0c72074960cc25e92e0137628661d13a2ee6e8770";

/**
 * Signs a license payload using Developer's Ed25519 Private Key
 */
export function signLicensePayload(payload: LicensePayload): string {
  const payloadJson = JSON.stringify(payload);
  const payloadB64 = Buffer.from(payloadJson).toString("base64url");

  // Reconstruct PKCS#8 DER private key from raw 32-byte seed
  const privKeyDer = Buffer.concat([
    Buffer.from("302e020100300506032b657004220420", "hex"),
    Buffer.from(DEV_PRIVATE_KEY_HEX, "hex"),
  ]);

  const privateKey = crypto.createPrivateKey({
    key: privKeyDer,
    format: "der",
    type: "pkcs8",
  });

  const sig = crypto.sign(null, Buffer.from(payloadJson), privateKey);
  const sigB64 = sig.toString("base64url");

  return `${payloadB64}.${sigB64}`;
}

/**
 * Verifies a token's Ed25519 signature against Developer's Public Key
 */
export function verifyLicenseToken(token: string): { valid: boolean; payload?: LicensePayload; error?: string } {
  try {
    const parts = token.trim().split(".");
    if (parts.length !== 2) {
      return { valid: false, error: "Invalid token format, expected payload.signature" };
    }

    const payloadJson = Buffer.from(parts[0], "base64url").toString("utf-8");
    const sig = Buffer.from(parts[1], "base64url");

    // Reconstruct SPKI DER public key from raw 32-byte public key
    const pubKeyDer = Buffer.concat([
      Buffer.from("302a300506032b6570032100", "hex"),
      Buffer.from(DEV_PUBLIC_KEY_HEX, "hex"),
    ]);

    const publicKey = crypto.createPublicKey({
      key: pubKeyDer,
      format: "der",
      type: "spki",
    });

    const isVerified = crypto.verify(null, Buffer.from(payloadJson), publicKey, sig);
    if (!isVerified) {
      return { valid: false, error: "Tampered or invalid digital signature" };
    }

    const payload: LicensePayload = JSON.parse(payloadJson);
    return { valid: true, payload };
  } catch (err: any) {
    return { valid: false, error: err.message };
  }
}
