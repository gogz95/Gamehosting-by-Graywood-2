/**
 * src/server/routes/templates.ts
 * Game Templates REST API routes.
 * Extracted from monolithic server.ts.
 */
import { Router } from "express";
import { db } from "../db.js";
import { requireAdmin } from "../middleware/auth.js";
import type { GameTemplate } from "../../types.js";

export const templatesRouter = Router();

// GET /api/templates
templatesRouter.get("/", (req, res) => {
  res.json({ templates: db.getAllTemplates() });
});

// POST /api/templates (custom template)
templatesRouter.post("/", requireAdmin, (req, res) => {
  const template = req.body as GameTemplate;
  if (!template.id) template.id = `tmpl-${Date.now().toString(36)}`;
  const saved = db.saveCustomTemplate(template);
  res.json(saved);
});
