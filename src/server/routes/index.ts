/**
 * src/server/routes/index.ts
 * Barrel: registers all modular route groups onto the Express app.
 * Import this in server.ts instead of individual route files.
 */
import type { Express } from "express";
import { authRouter } from "./auth.js";
import { nodesRouter } from "./nodes.js";
import { proxyRouter } from "./proxy.js";
import { templatesRouter } from "./templates.js";

export function registerRoutes(app: Express): void {
  // Authentication & User Management
  app.use("/api/auth", authRouter);

  // Mirror /api/users onto the auth router (backwards compat)
  app.use("/api/users", authRouter);

  // Host Nodes
  app.use("/api/nodes", nodesRouter);

  // Reverse Proxy Rules
  app.use("/api/proxy", proxyRouter);

  // Game Templates
  app.use("/api/templates", templatesRouter);

  // NOTE: Servers, Docker actions, Files, Backups, Schedules, AI, RCON, and
  // WebSocket handlers remain in server.ts pending full extraction.
  // They are progressively migrated here — see feature/modularization branch.
}
