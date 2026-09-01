# GameHost Deployer & Proxy — Proxmox Deployment Guide

This guide covers deploying the GameHost master panel on a **Proxmox VE** node using Docker inside an LXC container or a full VM.

---

## Option 1: LXC Container (Recommended — lightweight)

### 1. Create an LXC container
In the Proxmox web UI:
- **Template**: Ubuntu 22.04 or Debian 12
- **CPU**: 2+ cores
- **RAM**: 2 GB minimum (4 GB recommended)
- **Disk**: 20 GB minimum
- **Network**: DHCP or static IP

> **Important**: Enable **nesting** and **keyctl** in the LXC options (`Features` tab) so Docker runs inside it.

### 2. Install Docker inside LXC
```bash
apt update && apt install -y docker.io docker-compose-plugin curl git
systemctl enable --now docker
```

### 3. Clone and configure
```bash
git clone https://github.com/YOUR_USERNAME/gamehost-deployer-proxy.git /opt/gamehost
cd /opt/gamehost
cp .env.example .env
nano .env   # set GEMINI_API_KEY, S3 creds, Discord webhook, etc.
```

### 4. Launch the stack
```bash
docker compose up -d
```

The panel is now live at `http://<LXC-IP>:3000`.

---

## Option 2: VM with Docker Engine

Same steps as LXC — no extra `Features` flags required since VMs have full kernel access.

---

## Option 3: Pull pre-built image from GHCR (CI/CD)

Every push to `main` auto-builds and pushes to GitHub Container Registry.

```bash
# Pull the latest image
docker pull ghcr.io/YOUR_USERNAME/gamehost-deployer-proxy:latest

# Run with Docker Compose (uses the pre-built image)
docker compose up -d
```

---

## Nginx + TLS (Optional but recommended for production)

1. Place TLS certs in `./nginx/certs/`:
   - `fullchain.pem`
   - `privkey.pem`

2. Edit `./nginx/nginx.conf` — replace `YOUR_DOMAIN.COM` with your domain.

3. Make sure ports 80 and 443 are open on the Proxmox firewall and forwarded to the LXC/VM.

4. `docker compose up -d` — Nginx starts and terminates TLS, proxying to the panel.

**Certbot (Let's Encrypt) example:**
```bash
apt install certbot
certbot certonly --webroot -w ./nginx/webroot -d YOUR_DOMAIN.COM
cp /etc/letsencrypt/live/YOUR_DOMAIN.COM/fullchain.pem ./nginx/certs/
cp /etc/letsencrypt/live/YOUR_DOMAIN.COM/privkey.pem  ./nginx/certs/
docker compose restart nginx
```

---

## Worker Agent Nodes

Each additional Proxmox node can run the lightweight agent daemon that connects back to the master panel:

```bash
# One-liner install (run on each worker node):
curl -fsSL http://<MASTER_IP>:3000/agent.ts | tsx -
```

The agent connects via secure WebSocket using an enrollment token issued from the master panel UI.

---

## Useful Commands

| Command | Description |
|---|---|
| `npm run docker:build` | Build the production Docker image |
| `npm run docker:run` | Run image directly (no compose) |
| `npm run docker:dev` | Start dev stack with hot-reload |
| `npm run docker:down` | Stop and remove compose stack |
| `docker compose logs -f` | Tail live logs |
| `docker compose pull` | Pull latest image from GHCR |
