/**
 * src/server/routes/auth.ts
 * Authentication & User Management REST API routes.
 * Extracted from monolithic server.ts.
 */
import { Router } from "express";
import { db } from "../db.js";
import { activeSessions, getAuthenticatedUser, createSession, requireAdmin } from "../middleware/auth.js";
import type { UserRole } from "../../types.js";

export const authRouter = Router();

// POST /api/auth/login
authRouter.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password required" });
  }
  const user = db.getUserByUsername(username);
  if (!user) return res.status(401).json({ error: "Invalid username or password" });

  const hash = db.hashPassword(password, user.salt);
  if (hash !== user.passwordHash) return res.status(401).json({ error: "Invalid username or password" });

  const { token, expiresAt } = createSession(user.id);
  db.updateUser(user.id, { lastLoginAt: new Date().toISOString() });
  res.json({ token, user: db.toSafeUser(user), expiresAt });
});

// POST /api/auth/register
authRouter.post("/register", (req, res) => {
  const { username, password, email } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password required" });
  }
  try {
    const role: UserRole = db.getUsers().length === 0 ? "ADMIN" : "SERVER_OWNER";
    const newUser = db.createUser({ username, email, password, role, assignedServerIds: [] });
    const { token, expiresAt } = createSession(newUser.id);
    res.json({ token, user: newUser, expiresAt });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/auth/me
authRouter.get("/me", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    const allUsers = db.getUsers();
    const admin = allUsers.find((u) => u.role === "ADMIN") || allUsers[0];
    return res.json({ authenticated: false, user: null, availableUsersCount: allUsers.length, defaultAdminAvailable: !!admin });
  }
  res.json({ authenticated: true, user });
});

// POST /api/auth/logout
authRouter.post("/logout", (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    activeSessions.delete(authHeader.substring(7));
  }
  res.json({ success: true });
});

// GET /api/users (admin)
authRouter.get("/users", (req, res) => {
  const currentUser = getAuthenticatedUser(req);
  if (currentUser && currentUser.role !== "ADMIN") {
    return res.status(403).json({ error: "Admin privileges required to view users." });
  }
  res.json({ users: db.getUsers() });
});

// POST /api/users (admin)
authRouter.post("/users", (req, res) => {
  const currentUser = getAuthenticatedUser(req);
  if (currentUser && currentUser.role !== "ADMIN") {
    return res.status(403).json({ error: "Admin privileges required to create users." });
  }
  const { username, password, email, role, assignedServerIds } = req.body;
  if (!username || !password) return res.status(400).json({ error: "Username and password required" });
  try {
    const user = db.createUser({ username, email, password, role: role || "SERVER_OWNER", assignedServerIds: Array.isArray(assignedServerIds) ? assignedServerIds : [] });
    res.json({ user });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/users/:id (admin)
authRouter.put("/users/:id", (req, res) => {
  const currentUser = getAuthenticatedUser(req);
  if (currentUser && currentUser.role !== "ADMIN") {
    return res.status(403).json({ error: "Admin privileges required." });
  }
  try {
    const updated = db.updateUser(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: "User not found" });
    res.json({ user: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/users/:id (admin)
authRouter.delete("/users/:id", (req, res) => {
  const currentUser = getAuthenticatedUser(req);
  if (currentUser && currentUser.role !== "ADMIN") {
    return res.status(403).json({ error: "Admin privileges required." });
  }
  try {
    const deleted = db.deleteUser(req.params.id);
    res.json({ success: deleted });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});
