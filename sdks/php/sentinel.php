<?php

namespace Sentinel;

class SentinelClient
{
    const DEFAULT_MASTER_PUBLIC_KEY_HEX = "0c3b91b33c1596b8af5110b0c72074960cc25e92e0137628661d13a2ee6e8770";

    private string $productCode;
    private string $masterPubKeyHex;
    private bool $isAuthorized = false;
    private string $lockReason = "";
    private ?array $payload = null;

    public function __construct(string $productCode, string $token, ?string $customPubKeyHex = null)
    {
        $this->productCode = $productCode;
        $this->masterPubKeyHex = $customPubKeyHex ?: self::DEFAULT_MASTER_PUBLIC_KEY_HEX;
        $this->verifyOfflineToken($token);
    }

    public function isAuthorized(): bool
    {
        return $this->isAuthorized;
    }

    public function getLockReason(): string
    {
        return $this->lockReason;
    }

    public function getPayload(): ?array
    {
        return $this->payload;
    }

    private function base64UrlDecode(string $input): string
    {
        $remainder = strlen($input) % 4;
        if ($remainder) {
            $input .= str_repeat('=', 4 - $remainder);
        }
        return base64_decode(strtr($input, '-_', '+/'));
    }

    private function verifyOfflineToken(string $token): void
    {
        if (!function_exists('sodium_crypto_sign_verify_detached')) {
            $this->isAuthorized = false;
            $this->lockReason = "Ext-sodium is required for cryptographic license verification";
            return;
        }

        try {
            $parts = explode('.', $token);
            if (count($parts) !== 2) {
                throw new \Exception("Malformed license token: expected 2 segments");
            }

            $payloadBytes = $this->base64UrlDecode($parts[0]);
            $sigBytes = $this->base64UrlDecode($parts[1]);
            $pubKeyBytes = hex2bin($this->masterPubKeyHex);

            $valid = sodium_crypto_sign_verify_detached($sigBytes, $payloadBytes, $pubKeyBytes);
            if (!$valid) {
                throw new \Exception("Cryptographic signature mismatch: unauthorized license");
            }

            $data = json_decode($payloadBytes, true);
            if (!$data) {
                throw new \Exception("Failed to decode license payload JSON");
            }

            if (isset($data['expires_at']) && strtotime($data['expires_at']) < time()) {
                throw new \Exception("License expired on " . $data['expires_at']);
            }

            $this->payload = $data;
            $this->isAuthorized = true;
            $this->lockReason = "";
        } catch (\Exception $e) {
            $this->isAuthorized = false;
            $this->lockReason = $e->getMessage();
        }
    }

    public function pingHeartbeat(): void
    {
        if (!$this->payload || empty($this->payload['heartbeat_url'])) {
            return;
        }

        $body = json_encode([
            'license_id' => $this->payload['license_id'] ?? '',
            'product_code' => $this->productCode,
            'domain' => $this->payload['domain'] ?? '*',
            'timestamp' => time(),
        ]);

        $opts = [
            'http' => [
                'method'  => 'POST',
                'header'  => "Content-Type: application/json\r\n",
                'content' => $body,
                'timeout' => 5,
            ]
        ];

        $context = stream_context_create($opts);
        $result = @file_get_contents($this->payload['heartbeat_url'], false, $context);
        if ($result === false) {
            return; // Offline fallback
        }

        $res = json_decode($result, true);
        if (!empty($res['revoked']) || ($res['status'] ?? '') === 'REVOKED') {
            $this->isAuthorized = false;
            $this->lockReason = "LICENSE_REVOKED_BY_ISSUER: Global Kill-Switch engaged.";
        } elseif (($res['status'] ?? '') === 'ACTIVE') {
            $this->isAuthorized = true;
            $this->lockReason = "";
        }
    }

    /**
     * Laravel / PSR-15 Middleware Handler
     */
    public function handle($request, \Closure $next)
    {
        if (!$this->isAuthorized()) {
            return response()->json([
                'success' => false,
                'error' => 'SYSTEM_UNLICENSED_OR_REVOKED',
                'message' => $this->getLockReason(),
                'product' => $this->productCode,
            ], 402);
        }

        return $next($request);
    }
}

