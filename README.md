# 🛡️ Sentinel Universal Software License Authority & Kill-Switch Hub

Sentinel is a **standalone, sovereign licensing and remote kill-switch authority** built for developers to protect, license, monitor, and remotely freeze client application deployments across any tech stack (Go, TypeScript/Next.js, Python, PHP, Flutter, etc.).

---

## 🌟 Core Architecture (Hybrid Security)

Sentinel operates on a **Dual-Layer Defense Architecture**:
1. **Layer 1: Offline Ed25519 Cryptographic Signatures**
   - The developer's **Private Key** lives *only* on your personal Sentinel Vercel instance and is NEVER shipped to clients.
   - Client applications only embed the developer's **Public Key**.
   - Even without an internet connection, client applications mathematically verify tokens and will reject forged, tampered, or expired licenses.
2. **Layer 2: Real-Time Heartbeat & Remote Kill-Switch**
   - Client applications periodically ping Sentinel (`/api/verify`).
   - If a client breaches terms, fails payment, or leaks code, you click **Kill Switch** on your dashboard.
   - On the client's next heartbeat, all endpoints immediately return **HTTP 402 Payment Required** and freeze core transactions.

---

## 🚀 Quick Start & Vercel Deployment

### 1. Deploy to Vercel
1. Create a private GitHub repository: `license-authority`.
2. Push this repository to your GitHub.
3. Import into [Vercel](https://vercel.com/new).
4. Configure Environment Variables in Vercel Project Settings:

| Environment Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `DEV_PRIVATE_KEY` | Developer Ed25519 Private Key (Hex) | `59886c805cfb34fe921c8ef9b552c945ed735aa42474064d73db3e8636905720` |
| `DEV_PUBLIC_KEY` | Developer Ed25519 Public Key (Hex) | `0c3b91b33c1596b8af5110b0c72074960cc25e92e0137628661d13a2ee6e8770` |
| `MASTER_DEV_PASSCODE` | Passcode to enter dashboard | `developer-root` (Change to your secret) |
| `UPSTASH_REDIS_REST_URL` | Optional: Persistent Redis URL | *(Leave blank for Edge Memory)* |
| `UPSTASH_REDIS_REST_TOKEN` | Optional: Persistent Redis Token | *(Leave blank for Edge Memory)* |

---

## 📦 Multi-Stack Drop-in SDKs

Drop-in SDKs are located in `/sdks/`:

### 1. Go (Gin / Fiber / net/http)
```go
import "your-module/sdks/go/sentinel"

func main() {
    client, err := sentinel.NewSentinel("13C_GATEWAY", os.Getenv("LICENSE_TOKEN"))
    if err != nil {
        log.Fatalf("License invalid: %v", err)
    }
    client.StartHeartbeatDaemon(6 * time.Hour)

    // Attach to HTTP router
    http.Handle("/api/", client.HTTPMiddleware(apiHandler))
}
```

### 2. TypeScript / Next.js / Express
```typescript
import { SentinelClient } from "./sdks/typescript/sentinel";

const sentinel = new SentinelClient("NEXT_SAAS", process.env.LICENSE_TOKEN!);
sentinel.startHeartbeat();

// Express
app.use("/api", sentinel.expressMiddleware());
```

### 3. Python (FastAPI / Starlette)
```python
from sdks.python.sentinel import SentinelClient

sentinel = SentinelClient("AI_BOT", os.environ["LICENSE_TOKEN"])
sentinel.start_heartbeat_daemon()

app.middleware("http")(sentinel.fastapi_middleware())
```

### 4. PHP / Laravel
```php
use Sentinel\SentinelClient;

$sentinel = new SentinelClient("STORE_PORTAL", env("LICENSE_TOKEN"));
$sentinel->pingHeartbeat();
```

---

## 🔒 Security Guarantee
- **Zero Client Access**: The client codebase contains only the public key. They cannot issue tokens or counterfeit licenses.
- **Atomic Kill-Switch**: Freezes client execution instantly with single-click authority.

