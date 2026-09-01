/**
 * src/server/routes/proxy.ts
 * Proxy Rule CRUD REST API routes.
 * Extracted from monolithic server.ts.
 */
import { Router } from "express";
import { db } from "../db.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import type { ProxyRule } from "../../types.js";

export const proxyRouter = Router();

// GET /api/proxy
proxyRouter.get("/", (req, res) => {
  res.json({ rules: db.getProxyRules() });
});

// POST /api/proxy
proxyRouter.post("/", requireAuth, (req, res) => {
  const rule = req.body as ProxyRule;
  if (!rule.id) rule.id = `proxy-${Date.now().toString(36)}`;
  const saved = db.saveProxyRule(rule);
  res.json(saved);
});

// PUT /api/proxy/:id
proxyRouter.put("/:id", requireAuth, (req, res) => {
  const saved = db.saveProxyRule({ ...req.body, id: req.params.id });
  res.json(saved);
});

// DELETE /api/proxy/:id
proxyRouter.delete("/:id", requireAuth, (req, res) => {
  const deleted = db.deleteProxyRule(req.params.id);
  res.json({ success: deleted });
});
