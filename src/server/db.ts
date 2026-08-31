import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { DeployedServer, HostNode, ProxyRule, GameTemplate, BackupSnapshot, ServerSchedule, CrashReport } from '../types';
import { INITIAL_DEPLOYED_SERVERS, INITIAL_HOST_NODES, INITIAL_PROXY_RULES } from '../data/initialCluster';
import { GAME_TEMPLATES } from '../data/gameTemplates';

export interface ClusterDatabase {
  version: string;
  updatedAt: string;
  servers: DeployedServer[];
  hostNodes: HostNode[];
  proxyRules: ProxyRule[];
  customTemplates: GameTemplate[];
  backups: BackupSnapshot[];
  schedules: ServerSchedule[];
  enrollmentTokens: {
    token: string;
    createdAt: number;
    expiresAt: number;
    used?: boolean;
    nodeName?: string;
  }[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const VOLUMES_DIR = path.join(DATA_DIR, 'volumes');
const BACKUPS_DIR = path.join(DATA_DIR, 'backups');

// Ensure data directories exist
function ensureDirectories() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(VOLUMES_DIR)) {
    fs.mkdirSync(VOLUMES_DIR, { recursive: true });
  }
  if (!fs.existsSync(BACKUPS_DIR)) {
    fs.mkdirSync(BACKUPS_DIR, { recursive: true });
  }
}

class DatabaseManager {
  private cache: ClusterDatabase | null = null;

  constructor() {
    ensureDirectories();
    this.load();
  }

  public getVolumesDir(): string {
    return VOLUMES_DIR;
  }

  public getBackupsDir(): string {
    return BACKUPS_DIR;
  }

  private load(): ClusterDatabase {
    if (this.cache) return this.cache;

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        this.cache = {
          version: parsed.version || '2.5.0',
          updatedAt: parsed.updatedAt || new Date().toISOString(),
          servers: Array.isArray(parsed.servers) ? parsed.servers : INITIAL_DEPLOYED_SERVERS,
          hostNodes: Array.isArray(parsed.hostNodes) ? parsed.hostNodes : INITIAL_HOST_NODES,
          proxyRules: Array.isArray(parsed.proxyRules) ? parsed.proxyRules : INITIAL_PROXY_RULES,
          customTemplates: Array.isArray(parsed.customTemplates) ? parsed.customTemplates : [],
          backups: Array.isArray(parsed.backups) ? parsed.backups : [],
          schedules: Array.isArray(parsed.schedules) ? parsed.schedules : [],
          enrollmentTokens: Array.isArray(parsed.enrollmentTokens) ? parsed.enrollmentTokens : []
        };
        return this.cache;
      } catch (err) {
        console.warn('[Database]: Failed to parse db.json, re-initializing from defaults:', err);
      }
    }

    // Default Seed on first launch
    this.cache = {
      version: '2.5.0',
      updatedAt: new Date().toISOString(),
      servers: INITIAL_DEPLOYED_SERVERS,
      hostNodes: INITIAL_HOST_NODES,
      proxyRules: INITIAL_PROXY_RULES,
      customTemplates: [],
      backups: [],
      schedules: [],
      enrollmentTokens: []
    };

    this.persist();
    return this.cache;
  }

  private persist() {
    if (!this.cache) return;
    try {
      this.cache.updatedAt = new Date().toISOString();
      const tmpFile = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tmpFile, JSON.stringify(this.cache, null, 2), 'utf8');
      fs.renameSync(tmpFile, DB_FILE);
    } catch (err: any) {
      console.error('[Database]: Failed to persist db.json:', err.message);
    }
  }

  // --- Servers CRUD ---
  public getServers(): DeployedServer[] {
    return this.load().servers;
  }

  public getServerById(id: string): DeployedServer | undefined {
    return this.load().servers.find((s) => s.id === id);
  }

  public saveServer(server: DeployedServer): DeployedServer {
    const db = this.load();
    const index = db.servers.findIndex((s) => s.id === server.id);
    if (index >= 0) {
      db.servers[index] = server;
    } else {
      db.servers.unshift(server);
    }
    this.persist();
    return server;
  }

  public updateServer(id: string, partial: Partial<DeployedServer>): DeployedServer | null {
    const db = this.load();
    const index = db.servers.findIndex((s) => s.id === id);
    if (index === -1) return null;

    db.servers[index] = { ...db.servers[index], ...partial };
    this.persist();
    return db.servers[index];
  }

  public deleteServer(id: string): boolean {
    const db = this.load();
    const beforeLen = db.servers.length;
    db.servers = db.servers.filter((s) => s.id !== id);
    db.proxyRules = db.proxyRules.filter((p) => p.serverId !== id);
    this.persist();
    return db.servers.length < beforeLen;
  }

  // --- Host Nodes CRUD ---
  public getNodes(): HostNode[] {
    return this.load().hostNodes;
  }

  public getNodeById(id: string): HostNode | undefined {
    return this.load().hostNodes.find((n) => n.id === id);
  }

  public saveNode(node: HostNode): HostNode {
    const db = this.load();
    const index = db.hostNodes.findIndex((n) => n.id === node.id);
    if (index >= 0) {
      db.hostNodes[index] = { ...db.hostNodes[index], ...node };
    } else {
      db.hostNodes.push(node);
    }
    this.persist();
    return node;
  }

  public deleteNode(id: string): boolean {
    const db = this.load();
    const beforeLen = db.hostNodes.length;
    db.hostNodes = db.hostNodes.filter((n) => n.id !== id);
    this.persist();
    return db.hostNodes.length < beforeLen;
  }

  // --- Proxy Rules CRUD ---
  public getProxyRules(): ProxyRule[] {
    return this.load().proxyRules;
  }

  public saveProxyRule(rule: ProxyRule): ProxyRule {
    const db = this.load();
    const index = db.proxyRules.findIndex((p) => p.id === rule.id || p.serverId === rule.serverId);
    if (index >= 0) {
      db.proxyRules[index] = rule;
    } else {
      db.proxyRules.unshift(rule);
    }
    this.persist();
    return rule;
  }

  public deleteProxyRule(id: string): boolean {
    const db = this.load();
    const beforeLen = db.proxyRules.length;
    db.proxyRules = db.proxyRules.filter((p) => p.id !== id && p.serverId !== id);
    this.persist();
    return db.proxyRules.length < beforeLen;
  }

  // --- Game Templates ---
  public getAllTemplates(): GameTemplate[] {
    const db = this.load();
    return [...GAME_TEMPLATES, ...db.customTemplates];
  }

  public saveCustomTemplate(template: GameTemplate): GameTemplate {
    const db = this.load();
    const index = db.customTemplates.findIndex((t) => t.id === template.id);
    if (index >= 0) {
      db.customTemplates[index] = template;
    } else {
      db.customTemplates.push(template);
    }
    this.persist();
    return template;
  }

  // --- Enrollment Tokens ---
  public issueEnrollmentToken(durationMs: number = 3600000): string {
    const db = this.load();
    const token = `gh_node_${Date.now().toString(36)}_${crypto.randomBytes(6).toString('hex')}`;
    const entry = {
      token,
      createdAt: Date.now(),
      expiresAt: Date.now() + durationMs,
      used: false
    };

    // Clean up tokens older than 24h
    db.enrollmentTokens = db.enrollmentTokens.filter((t) => Date.now() - t.createdAt < 86400000);
    db.enrollmentTokens.push(entry);
    this.persist();
    return token;
  }

  public validateEnrollmentToken(token: string): boolean {
    if (!token) return false;
    // Allow development default token if explicitly configured
    if (token === 'token-dev-node' && process.env.NODE_ENV !== 'production') return true;

    const db = this.load();
    const found = db.enrollmentTokens.find((t) => t.token === token);
    if (!found) return false;
    if (Date.now() > found.expiresAt) return false;
    return true;
  }

  public markTokenUsed(token: string, nodeName?: string): void {
    const db = this.load();
    const found = db.enrollmentTokens.find((t) => t.token === token);
    if (found) {
      found.used = true;
      if (nodeName) found.nodeName = nodeName;
      this.persist();
    }
  }

  // --- Backups ---
  public getBackups(serverId?: string): BackupSnapshot[] {
    const db = this.load();
    if (serverId && serverId !== 'all') {
      return db.backups.filter((b) => b.serverId === serverId);
    }
    return db.backups;
  }

  public saveBackup(backup: BackupSnapshot): BackupSnapshot {
    const db = this.load();
    const index = db.backups.findIndex((b) => b.id === backup.id);
    if (index >= 0) {
      db.backups[index] = backup;
    } else {
      db.backups.unshift(backup);
    }
    this.persist();
    return backup;
  }

  public deleteBackup(id: string): boolean {
    const db = this.load();
    const beforeLen = db.backups.length;
    db.backups = db.backups.filter((b) => b.id !== id);
    this.persist();
    return db.backups.length < beforeLen;
  }

  // --- Schedules ---
  public getSchedules(serverId?: string): ServerSchedule[] {
    const db = this.load();
    if (serverId && serverId !== 'all') {
      return db.schedules.filter((s) => s.serverId === serverId);
    }
    return db.schedules;
  }

  public saveSchedule(schedule: ServerSchedule): ServerSchedule {
    const db = this.load();
    const index = db.schedules.findIndex((s) => s.id === schedule.id);
    if (index >= 0) {
      db.schedules[index] = schedule;
    } else {
      db.schedules.unshift(schedule);
    }
    this.persist();
    return schedule;
  }

  public deleteSchedule(id: string): boolean {
    const db = this.load();
    const beforeLen = db.schedules.length;
    db.schedules = db.schedules.filter((s) => s.id !== id);
    this.persist();
    return db.schedules.length < beforeLen;
  }

  // --- Crash Reports ---
  public addCrashReport(serverId: string, report: CrashReport): void {
    const db = this.load();
    const server = db.servers.find((s) => s.id === serverId);
    if (server) {
      server.crashReports = [report, ...(server.crashReports || [])].slice(0, 20);
      this.persist();
    }
  }
}

export const db = new DatabaseManager();
