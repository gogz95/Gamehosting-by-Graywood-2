/**
 * src/server/routes/nodes.ts
 * Host Node management REST API routes.
 * Extracted from monolithic server.ts.
 */
import { Router } from "express";
import { db } from "../db.js";
import { requireAdmin, getAuthenticatedUser } from "../middleware/auth.js";
import type { HostNode } from "../../types.js";

export const nodesRouter = Router();

// GET /api/nodes
nodesRouter.get("/", (req, res) => {
  res.json({ nodes: db.getNodes() });
});

// POST /api/nodes
nodesRouter.post("/", requireAdmin, (req, res) => {
  const node = req.body as HostNode;
  if (!node.id) node.id = `node-${Date.now().toString(36)}`;
  const saved = db.saveNode(node);
  res.json(saved);
});

// PUT /api/nodes/:id
nodesRouter.put("/:id", requireAdmin, (req, res) => {
  const existing = db.getNodeById(req.params.id);
  if (!existing) return res.status(404).json({ error: "Node not found" });
  const updated = db.saveNode({ ...existing, ...req.body, id: req.params.id });
  res.json(updated);
});

// DELETE /api/nodes/:id
nodesRouter.delete("/:id", requireAdmin, (req, res) => {
  const deleted = db.deleteNode(req.params.id);
  res.json({ success: deleted });
});

// POST /api/nodes/enroll — issue a one-time enrollment token for agent nodes
nodesRouter.post("/enroll", requireAdmin, (req, res) => {
  const token = db.issueEnrollmentToken();
  res.json({ token, expiresIn: "1 hour" });
});
