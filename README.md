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
- [Node.js](https://nodejs.org/) v20.0.0 or later.
- [Docker Engine](https://docs.docker.com/engine/install/) or Docker Desktop running locally.

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/gamehost-deployer-proxy.git
   cd gamehost-deployer-proxy
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   ```bash
   cp .env.example .env
   ```
   *(Optional: set `GEMINI_API_KEY` for AI crash diagnoses and auto-remediation).*

4. **Build and Run**:
   ```bash
   # Development Mode (Vite Hot-Reload + Server)
   npm run dev

   # Production Build & Start
   npm run build
   npm run start
   ```

5. **Open your browser**:
   Navigate to `http://localhost:3000` (or `http://localhost:3001` if port 3000 is occupied).

---

## 🌐 Multi-Node Clustering

To run game servers across multiple dedicated servers or VPS instances:

1. **Generate an Enrollment Token on the Master Panel**:
   In the **Host Nodes** tab, click **"Enroll New Node"** or call the API:
   ```bash
   curl -X POST http://master-ip:3000/api/nodes/enroll
   ```
   *Response: `{"token": "gh_node_..."}`*

2. **Start the Worker Agent on the Remote Host**:
   Copy `agent.ts` and `package.json` to the remote server, then run:
   ```bash
   npx tsx agent.ts \
     --master=ws://master-ip:3000/ws/nodes \
     --token=YOUR_ENROLLMENT_TOKEN \
     --name="Frankfurt Dedicated AX102" \
     --location="Frankfurt, Germany"
   ```

3. The worker node will securely enroll into your cluster and immediately appear in the **Deploy Server** wizard.

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

## 🤝 Contributing

Contributions are welcome! Please review [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code style, test requirements, and pull request workflow.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
