/**
 * src/server/middleware/auth.ts
 * Session authentication middleware and RBAC helpers.
 * Extracted from monolithic server.ts.
 */
import crypto from "crypto";
import express from "express";
import { db } from "../db.js";
import type { SafeUser } from "../../types.js";

export const activeSessions = new Map<string, { userId: string; expiresAt: number }>();

export function getAuthenticatedUser(req: express.Request): SafeUser | null {
  const authHeader = req.headers.authorization;
  let token = "";
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7);
  } else if (req.query.token) {
    token = String(req.query.token);
  }
  if (!token) return null;
  const session = activeSessions.get(token);
  if (!session || Date.now() > session.expiresAt) {
    if (session) activeSessions.delete(token);
    return null;
  }
  const user = db.getUserById(session.userId);
  return user ? db.toSafeUser(user) : null;
}

export function createSession(userId: string): { token: string; expiresAt: number } {
  const token = `gh_sess_${crypto.randomBytes(24).toString("hex")}`;
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
  activeSessions.set(token, { userId, expiresAt });
  return { token, expiresAt };
}

export function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const user = getAuthenticatedUser(req);
  if (!user) {
    if (process.env.NODE_ENV !== "production" && !req.headers.authorization && db.getUsers().length <= 1) {
      (req as any).user = db.getUsers()[0] || null;
      return next();
    }
    return res.status(401).json({ error: "Authentication required. Please sign in." });
  }
  (req as any).user = user;
  next();
}

export function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const user = getAuthenticatedUser(req);
  if (!user) {
    if (process.env.NODE_ENV !== "production" && !req.headers.authorization && db.getUsers().length <= 1) {
      (req as any).user = db.getUsers()[0] || null;
      return next();
    }
    return res.status(401).json({ error: "Authentication required. Please sign in." });
  }
  if (user.role !== "ADMIN") {
    return res.status(403).json({ error: "Administrator privileges required." });
  }
  (req as any).user = user;
  next();
}
