# Security Policy

The GameHost team takes the security of our software and the gaming infrastructure it powers seriously.

---

## Supported Versions

We provide security patches and bug fixes for the following versions:

| Version | Supported          |
| :---    | :---               |
| 2.5.x   | :white_check_mark: |
| < 2.0.0 | :x:                |

---

## Reporting a Vulnerability

If you discover a security vulnerability within GameHost Deployer & Proxy, please **do not report it publicly via GitHub Issues**.

Instead, please submit a report privately through one of the following methods:
- **GitHub Security Advisory**: Open a private advisory on the repository under the "Security" tab.
- **Email**: Send detailed reproduction steps and impact analysis to `security@graywood.io` or `gogz95@gmail.com`.

### What to Include in Your Report
- A clear description of the vulnerability.
- Step-by-step reproduction instructions or proof-of-concept (PoC).
- Any potential impact on container isolation, file systems, or cluster tokens.

We commit to acknowledging your report within 48 hours and keeping you updated on the resolution timeline.

---

## Architecture & Security Defenses

GameHost implements several layers of defense-in-depth:

### 1. Volume Sandbox & Path Traversal Guard
All file operations in the Web File Explorer and Config Editor are strictly validated using `resolveSafePath()`. Any requested path that attempts directory traversal (`../` or absolute symlink escapes) outside `./data/volumes/<serverName>/` is immediately rejected.

### 2. Node Clustering Cryptographic Tokens
Worker nodes connecting to the master cluster via WebSocket (`/ws/nodes`) must supply a time-bound, cryptographically generated enrollment token issued by `/api/nodes/enroll`. Unauthorized attempts are disconnected with WebSocket code `4001`.

### 3. Docker Container Isolation
Game servers are provisioned with explicit memory ceilings (`HostConfig.Memory`), CPU core pinning, and isolated network bridge bindings.
