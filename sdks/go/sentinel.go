package sentinel

import (
	"bytes"
	"crypto/ed25519"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"sync"
	"time"
)

// MasterPublicKeyHex is the Developer's sovereign Ed25519 Public Key.
// Replace with your public key from Sentinel Dashboard.
const DefaultMasterPublicKeyHex = "0c3b91b33c1596b8af5110b0c72074960cc25e92e0137628661d13a2ee6e8770"

type LicensePayload struct {
	LicenseID    string `json:"license_id"`
	ProductCode  string `json:"product_code,omitempty"`
	Licensee     string `json:"licensee"`
	Domain       string `json:"domain"`
	Tier         string `json:"tier"`
	IssuedAt     string `json:"issued_at"`
	ExpiresAt    string `json:"expires_at"`
	HeartbeatURL string `json:"heartbeat_url"`
}

type SentinelClient struct {
	mu            sync.RWMutex
	productCode   string
	masterPubKey  ed25519.PublicKey
	tokenRaw      string
	payload       *LicensePayload
	isAuthorized  bool
	lockReason    string
	stopChan      chan struct{}
}

// NewSentinel creates and initializes a Sentinel client.
func NewSentinel(productCode, token string, customPubKeyHex ...string) (*SentinelClient, error) {
	pubHex := DefaultMasterPublicKeyHex
	if len(customPubKeyHex) > 0 && customPubKeyHex[0] != "" {
		pubHex = customPubKeyHex[0]
	}

	pubBytes, err := hex.DecodeString(pubHex)
	if err != nil || len(pubBytes) != ed25519.PublicKeySize {
		return nil, fmt.Errorf("invalid ed25519 public key hex: %w", err)
	}

	client := &SentinelClient{
		productCode:  productCode,
		masterPubKey: ed25519.PublicKey(pubBytes),
		tokenRaw:     token,
		stopChan:     make(chan struct{}),
	}

	if err := client.verifyOfflineToken(token); err != nil {
		client.isAuthorized = false
		client.lockReason = err.Error()
		return client, err
	}

	client.isAuthorized = true
	return client, nil
}

// StartHeartbeatDaemon begins background remote check every interval (e.g. 6 hours).
func (s *SentinelClient) StartHeartbeatDaemon(interval time.Duration) {
	go func() {
		ticker := time.NewTicker(interval)
		defer ticker.Stop()
		s.pingHeartbeat()

		for {
			select {
			case <-ticker.C:
				s.pingHeartbeat()
			case <-s.stopChan:
				return
			}
		}
	}()
}

// Stop terminates background heartbeat routine.
func (s *SentinelClient) Stop() {
	close(s.stopChan)
}

// IsAuthorized returns whether license is valid and active.
func (s *SentinelClient) IsAuthorized() bool {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.isAuthorized
}

// LockReason returns the reason if unlicensed.
func (s *SentinelClient) LockReason() string {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.lockReason
}

func (s *SentinelClient) verifyOfflineToken(token string) error {
	parts := strings.Split(token, ".")
	if len(parts) != 2 {
		return errors.New("malformed license token")
	}

	payloadBytes, err := base64.RawURLEncoding.DecodeString(parts[0])
	if err != nil {
		return fmt.Errorf("invalid payload encoding: %w", err)
	}

	sigBytes, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return fmt.Errorf("invalid signature encoding: %w", err)
	}

	if !ed25519.Verify(s.masterPubKey, payloadBytes, sigBytes) {
		return errors.New("cryptographic signature verification failed: unauthorized token")
	}

	var payload LicensePayload
	if err := json.Unmarshal(payloadBytes, &payload); err != nil {
		return fmt.Errorf("failed to parse license payload: %w", err)
	}

	// Verify expiry
	exp, err := time.Parse(time.RFC3339, payload.ExpiresAt)
	if err == nil && time.Now().After(exp) {
		return fmt.Errorf("license expired on %s", payload.ExpiresAt)
	}

	s.payload = &payload
	return nil
}

func (s *SentinelClient) pingHeartbeat() {
	if s.payload == nil || s.payload.HeartbeatURL == "" {
		return
	}

	body, _ := json.Marshal(map[string]interface{}{
		"license_id":   s.payload.LicenseID,
		"product_code": s.productCode,
		"domain":       s.payload.Domain,
		"timestamp":    time.Now().Unix(),
	})

	httpClient := &http.Client{Timeout: 8 * time.Second}
	resp, err := httpClient.Post(s.payload.HeartbeatURL, "application/json", bytes.NewReader(body))
	if err != nil {
		// Tolerant to temporary network outage; offline cryptographic validity holds
		return
	}
	defer resp.Body.Close()

	var res struct {
		Status  string `json:"status"`
		Revoked bool   `json:"revoked"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&res); err != nil {
		return
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	if res.Revoked || res.Status == "REVOKED" {
		s.isAuthorized = false
		s.lockReason = "LICENSE_REVOKED_BY_ISSUER: Kill-switch engaged."
	} else if res.Status == "ACTIVE" {
		s.isAuthorized = true
		s.lockReason = ""
	}
}

// HTTPMiddleware provides standard net/http middleware.
func (s *SentinelClient) HTTPMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !s.IsAuthorized() {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusPaymentRequired) // 402
			json.NewEncoder(w).Encode(map[string]interface{}{
				"success": false,
				"error":   "SYSTEM_UNLICENSED_OR_REVOKED",
				"message": s.LockReason(),
				"product": s.productCode,
			})
			return
		}
		next.ServeHTTP(w, r)
	})
}
