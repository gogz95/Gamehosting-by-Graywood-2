# 🎮 GameHost Deployer & Subdomain Routing Sentinel

<div align="center">

[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-v20%2B-green.svg?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg?logo=docker&logoColor=white)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-amber.svg)](LICENSE)
[![Status](https://img.shields.io/badge/Production-Ready-emerald.svg)]()

**Next-generation, zero-dependency game server orchestrator with 1-click Docker deployments, multi-protocol stream proxying, remote worker clustering, and AI crash diagnosis.**

[Quick Start](#-quick-start) • [Features](#-features) • [Supported Games](#-supported-games) • [Architecture](#-architecture) • [Multi-Node Clustering](#-multi-node-clustering) • [Documentation](DEPLOYMENT.md)

</div>

---

## 🌟 Why GameHost?

Traditional game hosting panels (like legacy Pterodactyl or PufferPanel) often require complicated multi-container dependencies (PHP, NGINX, Redis, MySQL/Postgres, RabbitMQ, and Wings) just to launch a basic server.

**GameHost** rethinks game server orchestration from the ground up:
- **Zero-Dependency Core**: Powered by an embedded, atomic file-backed database (`data/db.json`). No external databases or message brokers required.
- **True Persistent NVMe Storage**: Native Docker host volume mapping (`data/volumes/<serverName>/`) ensures player inventories, world saves, and configs never vanish across container restarts.
- **Autonomous Multi-Protocol Proxy**: Generates ready-to-run reverse proxy routing configs for **Velocity** (Minecraft Java SNI), **Caddy**, **NGINX Streams**, **Traefik**, **Cloudflare Tunnels**, and **Playit.gg**.
- **Gemini 2.5 AI Sentinel**: Automatically catches container crashes, reads error traces, diagnoses the root cause in natural language, and executes auto-recovery restarts.
- **Modern Web Suite**: Built-in Web File Explorer with in-place `.zip` extraction, Modrinth API integration, task cron scheduler, and Discord webhook embeds.

---

## 🚀 Features

### 📦 1-Click Game Deployments
- Deploy **16 popular multiplayer game servers** out-of-the-box with pre-tuned CPU/RAM allocations, environmental flags, and container ports.
- Dynamic **Pterodactyl Egg / Custom JSON Importer**: Import any community egg directly from GitHub or paste container specifications.

### 🌐 Subdomain & Proxy Routing
- Route players through human-friendly subdomains (e.g. `play.yourdomain.com:25565` or `cs2.yourdomain.com`).
- Generates verified configurations for Velocity, Caddy (HTTP/TCP/UDP), NGINX Stream, Traefik, Cloudflare Tunnel, and Playit.gg.

### 🖥️ Distributed Node Clustering
- Connect unlimited remote bare-metal or cloud worker nodes using lightweight worker agents (`agent.ts`).
- Secure WebSocket communication (`/ws/nodes`) authenticated with cryptographically signed, time-bound enrollment tokens.

### 📁 Web File Explorer & Archive Manager
- Web-based directory browser with path traversal sandboxing protecting host volumes.
- Drag-and-drop file uploader, direct downloads, folder management, and in-place `.zip` / `.tar.gz` extraction via native system archivers.

### ⏰ Cron Scheduler & Maintenance
- Automated daily restarts (e.g. `0 4 * * *` at 4:00 AM) to purge memory leaks.
- Recurring automated `.tar.gz` backup snapshots with automated retention rotation.
- Scheduled in-game console / RCON broadcast messages.

### 🤖 Crash Watchdog & AI Post-Mortem
- Background monitor scans container exit codes every 15 seconds.
- Abnormal terminations trigger **Gemini 2.5 Flash** to analyze stack traces and output root-cause diagnoses.
- Automatic container recovery and rich Discord webhook notifications.

### 🧩 Live Modrinth API Hub
- Connects directly to Modrinth's public REST API.
- Search thousands of Fabric, Paper, and Forge mods/plugins with download counts.
- 1-click install streams verified `.jar` packages straight into `./data/volumes/<serverName>/mods`.

### 🔄 1-Click Server Cloning
- Replicate any running server into an isolated staging instance with cloned volume data, a newly allocated port, and a `-dev` subdomain.

---

## 🕹️ Supported Games

| Game | Protocol & Port | Default Engine / Image | Reverse Proxy |
| :--- | :--- | :--- | :--- |
| **Minecraft Java Edition** | TCP `25565`, Query `25565` | `itzg/minecraft-server` | Velocity / Caddy |
| **Minecraft Bedrock Edition** | UDP `19132` | `itzg/minecraft-bedrock-server` | Playit.gg / NGINX |
| **Counter-Strike 2 (CS2)** | UDP `27015`, RCON `27015` | `cm2network/cs2` | NGINX Stream |
| **Enshrouded Dedicated** | UDP `15636`, Query `15637` | `skaronator/enshrouded-server` | NGINX Stream |
| **Factorio Dedicated** | UDP `34197`, RCON `27015` | `factoriotools/factorio:stable` | NGINX Stream |
| **7 Days to Die** | UDP/TCP `26900-26902` | `vinanrra/7dtd-server` | NGINX Stream |
| **V Rising Dedicated** | UDP `9876`, Query `9877` | `trueosiris/vrising` | NGINX Stream |
| **Sons of the Forest** | UDP `8766`, Query `27016` | `jammsen/sons-of-the-forest` | Playit.gg / NGINX |
| **Garry's Mod (GMod)** | UDP `27015`, RCON `27015` | `cm2network/gmod` | NGINX Stream |
| **Satisfactory Dedicated** | UDP `15777, 15000, 7777` | `wolveix/satisfactory-server` | NGINX Stream |
| **Valheim Dedicated** | UDP `2456-2458` | `mbentley/valheim` | NGINX Stream |
| **Palworld Server** | UDP `8211`, RCON `25575` | `thijsvanloef/palworld-server` | NGINX Stream |
| **Rust Dedicated Server** | UDP `28015`, RCON `28016` | `didstopia/rust-server` | NGINX Stream |
| **Terraria TShock** | TCP `7777` | `ryansheehan/terraria` | Caddy / NGINX |
| **ARK: Survival Evolved** | UDP `7777, 27015` | `hermsi/ark-server` | NGINX Stream |
| **Project Zomboid** | UDP `16261, 16262` | `reid41/zomboid-server` | Playit.gg / NGINX |

*Any game with a Docker container or Pterodactyl Egg can be added dynamically.*

---

## 🏗️ Architecture

```mermaid
graph TD
    Client["User / Admin (Browser)"] -->|HTTP / React UI| Master["GameHost Master Panel (Port 3000/3001)"]
    Client -->|WebSocket / Terminal| Master

    subgraph "Master Panel Core"
        Master --> DB[("Atomic Cluster DB\n(./data/db.json)")]
        Master --> VolMgr[("Host NVMe Volumes\n(./data/volumes/)")]
        Master --> Archiver["bsdtar Backup Engine\n(./data/backups/)"]
        Master --> Watchdog["Crash Watchdog &\nGemini AI Diagnosis"]
        Master --> Scheduler["Task Scheduler Daemon\n(30s Cron Polling)"]
    end

    subgraph "Local Execution"
        Master -->|Docker Socket| LocalDocker["Local Docker Engine"]
        LocalDocker --> C1["Minecraft Java Container"]
        LocalDocker --> C2["CS2 Dedicated Container"]
        VolMgr -->|Mount Bind| C1
        VolMgr -->|Mount Bind| C2
    end

    subgraph "Remote Worker Nodes"
        Master -->|Secure WebSocket Handshake\n(Enrollment Token Auth)| Agent["Worker Daemon (agent.ts)"]
        Agent -->|Docker Socket| RemoteDocker["Remote Docker Engine"]
        RemoteDocker --> C3["Palworld Dedicated Container"]
    end

    subgraph "Edge Network & Proxy"
        C1 -.-> Proxy["Velocity / Caddy / NGINX / Playit"]
        Proxy --> Players["Multiplayer Gamers"]
    end
```

---

## ⚡ Quick Start

### Prerequisites
- [Docker Engine](https://docs.docker.com/engine/install/) v24+ (Linux / Docker Desktop on Windows/Mac)
- [Node.js](https://nodejs.org/) v20+ *(only needed for native / dev mode)*

---

### 🐳 Option A: Docker Compose — Production (Recommended)
```bash
git clone https://github.com/your-username/gamehost-deployer-proxy.git
cd gamehost-deployer-proxy
cp .env.example .env   # fill in optional keys (Gemini, S3, Discord)
docker compose up -d
```
Panel live at **`http://localhost:3000`**. Add Nginx + TLS with one command:
```bash
./certbot-setup.sh panel.yourdomain.com admin@yourdomain.com
```

### 🔥 Option B: Docker — Hot-Reload Dev Mode
```bash
docker compose -f docker-compose.dev.yml up --build
```
Source files are bind-mounted — `tsx` restarts automatically on save.

### 🖥️ Option C: Proxmox LXC / VM Deployment
See **[PROXMOX.md](PROXMOX.md)** for a complete step-by-step guide covering:
- LXC setup with Docker nesting enabled
- VM alternative
- Pre-built GHCR image pull
- Nginx + TLS via Certbot
- Portainer one-click stack deployment

### ⚙️ Option D: Native Node.js
1. **Clone & install**:
   ```bash
   git clone https://github.com/your-username/gamehost-deployer-proxy.git
   cd gamehost-deployer-proxy && npm install
   ```
2. **Configure**: `cp .env.example .env`
3. **Run**:
   ```bash
   npm run dev    # development (hot-reload)
   npm run build  # production bundle
   npm run start  # serve production bundle
   ```
4. Open `http://localhost:3000`

### 📦 Available npm Scripts
| Script | Description |
|---|---|
| `npm run dev` | TypeScript hot-reload server |
| `npm run build` | Vite + esbuild production bundle |
| `npm run start` | Serve production bundle |
| `npm run docker:build` | Build production Docker image |
| `npm run docker:run` | Run image directly (no compose) |
| `npm run docker:dev` | Dev stack with live bind-mount |
| `npm run docker:down` | Stop compose stack |

---

## 🗺️ Roadmap

- [x] **16 Native Game Engines**: Pre-tuned Docker templates for major multiplayer titles.
- [x] **Subdomain & Stream Proxying**: Velocity, Caddy, NGINX Streams, Traefik, and Cloudflare Tunnel configurations.
- [x] **Multi-Node Clustering**: Secure WebSocket enrollment daemon (`agent.ts`) for distributed worker nodes.
- [x] **Web File Explorer**: Volume file navigation, drag-and-drop uploads, and in-place `.zip` extraction.
- [x] **Cron Task Scheduler**: Recurring automated restarts, backups, and broadcast tasks.
- [x] **Gemini 2.5 AI Crash Watchdog**: Stack trace analysis and auto-recovery restarts.
- [x] **Live Modrinth Hub**: Direct REST API integration for 1-click Fabric/Paper mod downloads.
- [x] **Multi-User RBAC**: Role-based access control with granular per-server permissions.
- [ ] **Steam Workshop Direct Downloader**: Enter Steam Workshop Collection or Item IDs to automatically download and mount maps/addons via SteamCMD for CS2, Garry's Mod, Rust, Squad, and DayZ.
- [ ] **Thunderstore Mod Hub**: 1-click BepInEx package installer for Valheim, Palworld, and V Rising.
- [ ] **Dynamic Multi-Node Autoscaling**: Provision and scale cloud worker nodes dynamically on Hetzner, AWS, and DigitalOcean.

---

## 🌐 Multi-Node Clustering

To run game servers across multiple Proxmox nodes or dedicated servers:

1. **Generate an Enrollment Token** on the master panel:
   - UI: **Host Nodes** tab → **"Enroll New Node"**
   - API: `curl -X POST http://master-ip:3000/api/nodes/enroll`
   > Response: `{"token": "gh_node_..."}`

2. **Start the Worker Agent** on each remote node:

   **Option A — Docker (recommended):**
   ```bash
   # On the worker Proxmox node:
   docker run -d --restart=unless-stopped \
     -e MASTER_URL=wss://panel.yourdomain.com \
     -e ENROLLMENT_TOKEN=gh_node_xxx \
     -e NODE_NAME="proxmox-node-2" \
     -v /var/run/docker.sock:/var/run/docker.sock \
     ghcr.io/your-username/gamehost-deployer-proxy/agent:latest
   ```
   Or use the agent compose file:
   ```bash
   MASTER_URL=wss://panel.yourdomain.com \
   ENROLLMENT_TOKEN=gh_node_xxx \
   NODE_NAME=proxmox-node-2 \
   docker compose -f docker-compose.agent.yml up -d
   ```

   **Option B — Native (one-liner):**
   ```bash
   curl -fsSL http://master-ip:3000/agent.ts | \
     MASTER_URL=wss://master-ip ENROLLMENT_TOKEN=gh_node_xxx npx tsx -
   ```

3. The node will securely enroll and immediately appear in the **Deploy Server** wizard.

---

## ⚙️ Environment Variables

| Variable | Default | Description |
| :--- | :--- | :--- |
| `PORT` | `3000` | HTTP port for web dashboard and API (auto-falls back if busy). |
| `DOCKER_HOST` | Local socket | Remote Docker daemon TCP endpoint (e.g. `tcp://127.0.0.1:2375`). |
| `GEMINI_API_KEY` | None | Google Gemini API key for AI crash diagnosis and troubleshooting. |
| `S3_ENDPOINT` | None | Custom S3/R2 endpoint for off-site backup storage. |
| `S3_BUCKET` | `gamehost-backups` | Target S3 bucket name. |
| `S3_ACCESS_KEY_ID` | None | S3 / Cloudflare R2 Access Key ID. |
| `S3_SECRET_ACCESS_KEY` | None | S3 / Cloudflare R2 Secret Access Key. |
| `NODE_ENV` | `development` | Run mode (`development` or `production`). |

---

## 🛡️ Security

- **Path Traversal Protection**: Volume file operations are strictly verified via `path.resolve` and `path.relative` to prevent escaping `./data/volumes/`.
- **Token Verification**: Remote nodes must authenticate with cryptographically random enrollment tokens; unauthorized connections are rejected with code `4001`.
- **Container Isolation**: Game servers run in unprivileged containers with memory limits (`HostConfig.Memory`) and CPU core constraints.

For security reports, please refer to [SECURITY.md](SECURITY.md).

---

## 🔐 CI/CD — GitHub Secrets Setup

The GitHub Actions workflow auto-builds and pushes the Docker image to GitHub Container Registry (GHCR) on every push to `main`. No secrets are needed for GHCR — it uses the automatic `GITHUB_TOKEN`.

To enable optional features, add these secrets in **GitHub → Settings → Secrets and variables → Actions**:

| Secret | Required For |
|---|---|
| *(automatic)* `GITHUB_TOKEN` | GHCR image push — built-in, no setup needed |
| `DOCKER_USERNAME` | Docker Hub push (optional, see commented section in `ci.yml`) |
| `DOCKER_PASSWORD` | Docker Hub push |

**Enable package write permissions** (one-time):
1. Go to your GitHub repo → **Settings** → **Actions** → **General**
2. Under *Workflow permissions*, select **Read and write permissions**
3. Save — the next push to `main` will publish the image to:
   `ghcr.io/YOUR_USERNAME/gamehost-deployer-proxy:latest`

---

## 🤝 Contributing

Contributions are welcome! Please review [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code style, test requirements, and pull request workflow.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
