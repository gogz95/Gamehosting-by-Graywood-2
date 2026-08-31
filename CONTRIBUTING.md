# Contributing to GameHost Deployer & Proxy

Thank you for your interest in contributing to **GameHost Deployer & Proxy**! We welcome community contributions, bug fixes, feature proposals, and community game templates.

---

## Development Setup

1. **Fork and clone the repository**:
   ```bash
   git clone https://github.com/your-username/gamehost-deployer-proxy.git
   cd gamehost-deployer-proxy
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```
   This runs Vite with Hot Module Replacement (HMR) and mounts API routes on `http://localhost:3000`.

---

## Code Quality & Testing

Before submitting a Pull Request, make sure your code passes all type checks and builds without errors:

```bash
# Type check TypeScript codebase
npm run lint

# Compile production bundle
npm run build
```

We adhere to clean, modern TypeScript standards:
- Always define explicit types in `src/types.ts`.
- Ensure path traversal protections are retained for any file system operations.
- Handle potential port collisions gracefully using dynamic port fallbacks.

---

## Adding a New Game Template

To add a new pre-configured game to the 1-click catalog:

1. Open [`src/data/gameTemplates.ts`](src/data/gameTemplates.ts).
2. Append a new `GameTemplate` definition with:
   - Unique `id` and `gameKey`.
   - Category (`Survival`, `FPS`, `Sandbox`, `Simulation`, etc.).
   - Default ports and protocol (`TCP`, `UDP`, or `BOTH`).
   - Default RAM/CPU requirements.
   - Battle-tested OCI Docker image (e.g. from Docker Hub or GitHub Packages).
   - Volume working directory mapped in `getContainerDataPath()` in `server.ts` and `agent.ts`.
   - Initial configuration files and default environment variables.

---

## Submitting Pull Requests

1. Create a feature branch:
   ```bash
   git checkout -b feat/my-new-feature
   ```
2. Commit your changes using semantic commit messages:
   ```bash
   git commit -m "feat(templates): add BeamMP dedicated server template"
   ```
3. Push to your fork and open a Pull Request against `main`.
4. Provide a clear description of your changes and any verification steps performed.
