import base64
import json
import threading
import time
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from urllib.request import Request, urlopen

try:
    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
except ImportError:
    Ed25519PublicKey = None

DEFAULT_MASTER_PUBLIC_KEY_HEX = "0c3b91b33c1596b8af5110b0c72074960cc25e92e0137628661d13a2ee6e8770"


class SentinelClient:
    def __init__(self, product_code: str, token: str, custom_pub_hex: Optional[str] = None):
        self.product_code = product_code
        self.pub_hex = custom_pub_hex or DEFAULT_MASTER_PUBLIC_KEY_HEX
        self.is_authorized = False
        self.lock_reason = ""
        self.payload: Optional[Dict[str, Any]] = None
        self._stop_event = threading.Event()
        self._lock = threading.Lock()

        self._verify_offline(token)

    def is_valid(self) -> bool:
        with self._lock:
            return self.is_authorized

    def get_lock_reason(self) -> str:
        with self._lock:
            return self.lock_reason

    def start_heartbeat_daemon(self, interval_seconds: int = 21600):
        def loop():
            self._ping()
            while not self._stop_event.wait(interval_seconds):
                self._ping()

        thread = threading.Thread(target=loop, daemon=True)
        thread.start()

    def stop(self):
        self._stop_event.set()

    def _verify_offline(self, token: str):
        if Ed25519PublicKey is None:
            self.lock_reason = "Missing dependency: please install 'cryptography'"
            return

        try:
            parts = token.split(".")
            if len(parts) != 2:
                raise ValueError("Invalid license format: expected 2 segments")

            # Base64url decode with padding
            def b64url_decode(s: str) -> bytes:
                s += "=" * ((4 - len(s) % 4) % 4)
                return base64.urlsafe_b64decode(s)

            payload_bytes = b64url_decode(parts[0])
            sig_bytes = b64url_decode(parts[1])
            pub_key_bytes = bytes.fromhex(self.pub_hex)

            public_key = Ed25519PublicKey.from_public_bytes(pub_key_bytes)
            public_key.verify(sig_bytes, payload_bytes)

            data = json.loads(payload_bytes.decode("utf-8"))
            exp_str = data.get("expires_at", "")
            exp_dt = datetime.fromisoformat(exp_str.replace("Z", "+00:00"))

            if datetime.now(timezone.utc) > exp_dt:
                raise ValueError(f"License expired on {exp_str}")

            self.payload = data
            self.is_authorized = True
            self.lock_reason = ""
        except Exception as e:
            self.is_authorized = False
            self.lock_reason = str(e)

    def _ping(self):
        if not self.payload or not self.payload.get("heartbeat_url"):
            return

        try:
            body = json.dumps({
                "license_id": self.payload.get("license_id"),
                "product_code": self.product_code,
                "domain": self.payload.get("domain"),
                "timestamp": int(time.time()),
            }).encode("utf-8")

            req = Request(
                self.payload["heartbeat_url"],
                data=body,
                headers={"Content-Type": "application/json"},
                method="POST"
            )

            with urlopen(req, timeout=8) as resp:
                res_data = json.loads(resp.read().decode("utf-8"))
                with self._lock:
                    if res_data.get("revoked") or res_data.get("status") == "REVOKED":
                        self.is_authorized = False
                        self.lock_reason = "LICENSE_REVOKED_BY_ISSUER: Global Kill-Switch engaged."
                    elif res_data.get("status") == "ACTIVE":
                        self.is_authorized = True
                        self.lock_reason = ""
        except Exception:
            pass  # Offline tolerance

    def fastapi_middleware(self):
        """Returns Starlette / FastAPI compatible ASGI middleware"""
        async def middleware(request, call_next):
            if not self.is_valid():
                from starlette.responses import JSONResponse
                return JSONResponse(
                    status_code=402,
                    content={
                        "success": False,
                        "error": "SYSTEM_UNLICENSED_OR_REVOKED",
                        "message": self.get_lock_reason(),
                        "product": self.product_code,
                    }
                )
            return await call_next(request)
        return middleware

