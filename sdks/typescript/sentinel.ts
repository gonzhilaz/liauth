import crypto from "node:crypto";

export const DEFAULT_MASTER_PUBLIC_KEY_HEX =
  "0c3b91b33c1596b8af5110b0c72074960cc25e92e0137628661d13a2ee6e8770";

export interface LicensePayload {
  license_id: string;
  product_code?: string;
  licensee: string;
  domain: string;
  tier: "ENTERPRISE" | "COMMERCIAL" | "TRIAL";
  issued_at: string;
  expires_at: string;
  heartbeat_url: string;
}

export class SentinelClient {
  private masterPublicKeyHex: string;
  private productCode: string;
  private isAuthorized = false;
  private lockReason = "";
  private payload: LicensePayload | null = null;
  private intervalTimer: NodeJS.Timeout | null = null;

  constructor(productCode: string, token: string, customPubKeyHex?: string) {
    this.productCode = productCode;
    this.masterPublicKeyHex = customPubKeyHex || DEFAULT_MASTER_PUBLIC_KEY_HEX;
    this.verifyOfflineToken(token);
  }

  public getAuthorized(): boolean {
    return this.isAuthorized;
  }

  public getLockReason(): string {
    return this.lockReason;
  }

  public getPayload(): LicensePayload | null {
    return this.payload;
  }

  public startHeartbeat(intervalMs: number = 6 * 60 * 60 * 1000): void {
    this.pingHeartbeat();
    this.intervalTimer = setInterval(() => {
      this.pingHeartbeat();
    }, intervalMs);
  }

  public stop(): void {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
  }

  private verifyOfflineToken(token: string): void {
    try {
      const parts = token.split(".");
      if (parts.length !== 2) {
        throw new Error("Malformed license token: expected 2 segments");
      }

      const payloadBuf = Buffer.from(parts[0], "base64url");
      const sigBuf = Buffer.from(parts[1], "base64url");
      const pubKeyBuf = Buffer.from(this.masterPublicKeyHex, "hex");

      // Wrap raw 32-byte Ed25519 into SPKI DER header
      const spkiHeader = Buffer.from("302a300506032b6570032100", "hex");
      const spkiDer = Buffer.concat([spkiHeader, pubKeyBuf]);
      const keyObj = crypto.createPublicKey({
        key: spkiDer,
        format: "der",
        type: "spki",
      });

      const valid = crypto.verify(null, payloadBuf, keyObj, sigBuf);
      if (!valid) {
        throw new Error("Cryptographic signature verification failed: invalid license");
      }

      const parsed: LicensePayload = JSON.parse(payloadBuf.toString("utf-8"));

      // Check expiry
      if (new Date(parsed.expires_at).getTime() < Date.now()) {
        throw new Error(`License expired on ${parsed.expires_at}`);
      }

      this.payload = parsed;
      this.isAuthorized = true;
      this.lockReason = "";
    } catch (err: any) {
      this.isAuthorized = false;
      this.lockReason = err.message || "License verification failed";
    }
  }

  private async pingHeartbeat(): Promise<void> {
    if (!this.payload || !this.payload.heartbeat_url) return;

    try {
      const res = await fetch(this.payload.heartbeat_url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          license_id: this.payload.license_id,
          product_code: this.productCode,
          domain: this.payload.domain,
          timestamp: Math.floor(Date.now() / 1000),
        }),
      });

      const data = await res.json();
      if (data.revoked || data.status === "REVOKED") {
        this.isAuthorized = false;
        this.lockReason = "LICENSE_REVOKED_BY_ISSUER: Global Kill-Switch active.";
      } else if (data.status === "ACTIVE") {
        this.isAuthorized = true;
        this.lockReason = "";
      }
    } catch {
      // Offline network resilience; signature validity remains
    }
  }

  /**
   * Express / Connect Middleware
   */
  public expressMiddleware() {
    return (req: any, res: any, next: any) => {
      if (!this.isAuthorized) {
        return res.status(402).json({
          success: false,
          error: "SYSTEM_UNLICENSED_OR_REVOKED",
          message: this.lockReason,
          product: this.productCode,
        });
      }
      next();
    };
  }
}
