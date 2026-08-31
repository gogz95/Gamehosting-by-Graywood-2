# 🚀 Production Deployment Guide

This guide details best practices for running **GameHost Deployer & Proxy** in production environments.

---

## Table of Contents
1. [System Requirements](#1-system-requirements)
2. [Running as a Systemd Service (Linux/Ubuntu)](#2-running-as-a-systemd-service)
3. [Running with Docker Compose](#3-running-with-docker-compose)
4. [Reverse Proxy & SSL Setup (Caddy / NGINX)](#4-reverse-proxy--ssl-setup)
5. [Firewall & Port Forwarding Configuration](#5-firewall--port-forwarding)
6. [Automated Off-Site Backups (AWS S3 & Cloudflare R2)](#6-off-site-backups-s3--r2)

---

## 1. System Requirements

### Master Panel (Controller)
- **OS**: Linux (Ubuntu 22.04+ / Debian 12 / RHEL 9), macOS, or Windows 11 / Server.
- **CPU**: 2+ Cores.
- **RAM**: Minimum 2 GB (4 GB recommended).
- **Disk**: 20 GB+ for panel code, database (`data/db.json`), and backups.
- **Docker**: Docker Engine 24.0+ with Docker socket access (`/var/run/docker.sock` or Windows named pipe).

### Worker Nodes (Game Hosts)
- **RAM**: 16 GB to 128 GB+ depending on player counts and modpacks.
- **Storage**: High-speed NVMe SSD (PCIe Gen4 recommended for Minecraft chunk generation and Ark/Rust level streaming).

---

## 2. Running as a Systemd Service

For native Linux bare-metal hosts:

1. **Build the production application**:
   ```bash
   cd /opt/gamehost
   npm install --frozen-lockfile
   npm run build
   ```

2. **Create the systemd unit file**:
   ```bash
   sudo nano /etc/systemd/system/gamehost.service
   ```

3. **Paste configuration**:
   ```ini
   [Unit]
   Description=GameHost Deployer & Routing Sentinel
   After=network.target docker.service
   Requires=docker.service

   [Service]
   Type=simple
   User=root
   WorkingDirectory=/opt/gamehost
   ExecStart=/usr/bin/node /opt/gamehost/dist/server.cjs
   Restart=always
   RestartSec=5
   Environment=NODE_ENV=production
   Environment=PORT=3000
   Environment=GEMINI_API_KEY=your_gemini_key_here

   [Install]
   WantedBy=multi-user.target
   ```

4. **Enable and start the service**:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable --now gamehost.service
   sudo systemctl status gamehost.service
   ```

---

## 3. Running with Docker Compose

Create a `docker-compose.yml` in the project root:

```yaml
version: '3.8'

services:
  gamehost-master:
    build: .
    container_name: gamehost-master
    restart: unless-stopped
    ports:
      - "3000:3000"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - ./data:/app/data
    environment:
      - NODE_ENV=production
      - PORT=3000
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      - S3_BUCKET=${S3_BUCKET}
      - S3_ACCESS_KEY_ID=${S3_ACCESS_KEY_ID}
      - S3_SECRET_ACCESS_KEY=${S3_SECRET_ACCESS_KEY}
```

Start the container:
```bash
docker compose up -d
```

---

## 4. Reverse Proxy & SSL Setup

### Option A: Caddy (Recommended - Zero Config SSL)
Add the following to your `/etc/caddy/Caddyfile`:

```caddy
panel.yourdomain.com {
    reverse_proxy localhost:3000 {
        # WebSocket support for terminal & worker agents
        header_up Host {host}
        header_up X-Real-IP {remote_host}
    }
}
```

Reload Caddy:
```bash
sudo systemctl reload caddy
```

### Option B: NGINX
Add to `/etc/nginx/sites-available/gamehost.conf`:

```nginx
server {
    server_name panel.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 5. Firewall & Port Forwarding

Ensure the following ports are open in your host firewall (`ufw` on Linux or Windows Defender Firewall):

| Port / Range | Protocol | Purpose |
| :--- | :--- | :--- |
| `80, 443` | TCP | Web panel SSL and public web traffic. |
| `3000` | TCP | GameHost direct API & WebSocket port (if not behind reverse proxy). |
| `25565 - 25600`| TCP / UDP | Minecraft Java and Velocity proxy routing. |
| `19132` | UDP | Minecraft Bedrock cross-play. |
| `27015 - 27030`| UDP | Source Engine games (CS2, TF2, GMod, Squad). |
| `7777 - 7780` | UDP | Terraria, Palworld, ARK. |
| `15636 - 15637`| UDP | Enshrouded dedicated server. |
| `34197` | UDP | Factorio dedicated server. |

On Ubuntu:
```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3000/tcp
sudo ufw allow 25565:25600/tcp
sudo ufw allow 27015:27030/udp
sudo ufw reload
```

---

## 6. Off-Site Backups (S3 & R2)

GameHost automatically archives server folders into compressed `.tar.gz` files on the host disk. To mirror them off-site:

1. In your `.env` file, specify your cloud storage credentials:
   ```bash
   S3_ENDPOINT="https://<account_id>.r2.cloudflarestorage.com"
   S3_BUCKET="gamehost-vault"
   S3_ACCESS_KEY_ID="your_access_key"
   S3_SECRET_ACCESS_KEY="your_secret_key"
   ```
2. When creating a backup snapshot from the web panel or automated scheduler, GameHost will stream the encrypted `.tar.gz` bundle directly to your S3 bucket.
