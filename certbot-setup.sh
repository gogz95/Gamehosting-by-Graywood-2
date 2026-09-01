#!/usr/bin/env bash
# ==============================================================================
# certbot-setup.sh — Let's Encrypt TLS setup for GameHost Nginx proxy
# Usage: ./certbot-setup.sh YOUR_DOMAIN.COM your@email.com
# Run this on the Proxmox host/LXC that has ports 80/443 exposed.
# ==============================================================================

set -euo pipefail

DOMAIN="${1:-}"
EMAIL="${2:-}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CERTS_DIR="$SCRIPT_DIR/nginx/certs"
WEBROOT_DIR="$SCRIPT_DIR/nginx/webroot"

# ── Validation ────────────────────────────────────────────────────────────────
if [[ -z "$DOMAIN" || -z "$EMAIL" ]]; then
  echo "Usage: $0 <domain> <email>"
  echo "  e.g. $0 panel.yourdomain.com admin@yourdomain.com"
  exit 1
fi

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  GameHost TLS Setup — Let's Encrypt / Certbot               ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo "  Domain : $DOMAIN"
echo "  Email  : $EMAIL"
echo ""

# ── Install Certbot if missing ────────────────────────────────────────────────
if ! command -v certbot &>/dev/null; then
  echo "[1/4] Installing Certbot..."
  apt-get update -qq && apt-get install -y -qq certbot
else
  echo "[1/4] Certbot already installed — skipping."
fi

# ── Ensure Nginx webroot dir exists ──────────────────────────────────────────
mkdir -p "$WEBROOT_DIR" "$CERTS_DIR"

# ── Bring up Nginx (handles ACME challenge via webroot) ──────────────────────
echo "[2/4] Starting Nginx for ACME challenge..."
docker compose up -d nginx 2>/dev/null || true
sleep 3

# ── Obtain certificate ───────────────────────────────────────────────────────
echo "[3/4] Requesting certificate from Let's Encrypt..."
certbot certonly \
  --webroot \
  --webroot-path "$WEBROOT_DIR" \
  --non-interactive \
  --agree-tos \
  --email "$EMAIL" \
  --domain "$DOMAIN"

# ── Copy certs to nginx/certs/ ───────────────────────────────────────────────
echo "[4/4] Installing certificates..."
CERT_PATH="/etc/letsencrypt/live/$DOMAIN"

if [[ ! -f "$CERT_PATH/fullchain.pem" ]]; then
  echo "ERROR: Certificate not found at $CERT_PATH — did Certbot succeed?"
  exit 1
fi

cp -f "$CERT_PATH/fullchain.pem" "$CERTS_DIR/fullchain.pem"
cp -f "$CERT_PATH/privkey.pem"   "$CERTS_DIR/privkey.pem"

# ── Patch nginx.conf with actual domain ──────────────────────────────────────
sed -i "s/YOUR_DOMAIN\.COM/$DOMAIN/g" "$SCRIPT_DIR/nginx/nginx.conf"
echo "  nginx.conf patched with domain: $DOMAIN"

# ── Reload Nginx ─────────────────────────────────────────────────────────────
docker compose restart nginx
echo ""
echo "✅  TLS setup complete! Your panel is live at: https://$DOMAIN"
echo ""

# ── Auto-renewal cron (runs certbot renew twice daily) ───────────────────────
CRON_JOB="0 3,15 * * * certbot renew --quiet && cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem $CERTS_DIR/fullchain.pem && cp /etc/letsencrypt/live/$DOMAIN/privkey.pem $CERTS_DIR/privkey.pem && docker compose -f $SCRIPT_DIR/docker-compose.yml restart nginx"

(crontab -l 2>/dev/null | grep -v "certbot renew"; echo "$CRON_JOB") | crontab -
echo "🔄  Auto-renewal cron installed (runs at 03:00 and 15:00 daily)."
