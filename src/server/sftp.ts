import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import ssh2 from 'ssh2';
import { db } from './db';
import { DeployedServer, SafeUser } from '../types';

const { STATUS_CODE, stringToFlags } = (ssh2 as any).utils.sftp;

export interface SftpConnectionInfo {
  host: string;
  port: number;
  usernameFormat: string;
  recommendedClient: string;
  serverVolumePath: string;
}

// ---------------------------------------------------------------------------
// Helpers: Volume Root & Path Traversal Guard
// ---------------------------------------------------------------------------
function resolveServerVolumeRoot(server: DeployedServer): string {
  const cleanName = (server.name || server.id).toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const volumeDir = path.join(db.getVolumesDir(), cleanName);
  if (!fs.existsSync(volumeDir)) {
    fs.mkdirSync(volumeDir, { recursive: true });
  }
  return volumeDir;
}

function resolveSafePath(volumeRoot: string, reqPath: string = ''): string | null {
  const normalized = reqPath.replace(/\\/g, '/').replace(/^\/+/, '');
  const target = path.resolve(volumeRoot, normalized);
  if (!target.startsWith(path.resolve(volumeRoot))) {
    return null; // Block traversal
  }
  return target;
}

function toSftpAttrs(stats: fs.Stats): any {
  return {
    mode: stats.mode,
    uid: stats.uid || 0,
    gid: stats.gid || 0,
    size: stats.size,
    atime: Math.floor(stats.atimeMs / 1000),
    mtime: Math.floor(stats.mtimeMs / 1000)
  };
}

// Ensure host key exists in data/sftp_host_rsa
function getOrCreateHostKey(): string {
  const dataDir = path.dirname(db.getVolumesDir());
  const keyPath = path.join(dataDir, 'sftp_host_rsa');
  if (fs.existsSync(keyPath)) {
    return fs.readFileSync(keyPath, 'utf8');
  }

  const { privateKey } = (crypto as any).generateKeyPairSync('rsa', {
    modulusLength: 2048,
    privateKeyEncoding: { type: 'pkcs1', format: 'pem' }
  });

  fs.writeFileSync(keyPath, privateKey, { mode: 0o600 });
  return privateKey;
}

export function getSftpInfo(server: DeployedServer, user?: SafeUser | null): SftpConnectionInfo {
  const host = process.env.SFTP_HOST || '127.0.0.1';
  const port = parseInt(process.env.SFTP_PORT || '2022', 10);
  const username = user?.username || 'admin';
  const usernameFormat = `${username}.${server.id}`;

  return {
    host,
    port,
    usernameFormat,
    recommendedClient: 'FileZilla / WinSCP / Cyberduck (Protocol: SFTP)',
    serverVolumePath: resolveServerVolumeRoot(server)
  };
}

export function startSftpServer(port = 2022): ssh2.Server {
  const hostKey = getOrCreateHostKey();

  const server = new ssh2.Server({ hostKeys: [hostKey] }, (client) => {
    let authenticatedUser: SafeUser | null = null;
    let targetServer: DeployedServer | null = null;

    client.on('authentication', (ctx) => {
      if (ctx.method === 'password') {
        const fullUsername = ctx.username.trim();
        // Support either "username.serverId" or "username"
        const dotIndex = fullUsername.indexOf('.');
        let username = fullUsername;
        let requestedServerId = '';

        if (dotIndex !== -1) {
          username = fullUsername.slice(0, dotIndex);
          requestedServerId = fullUsername.slice(dotIndex + 1);
        }

        const user = db.getUserByUsername(username);
        if (!user) {
          return ctx.reject();
        }

        const passHash = user.salt
          ? db.hashPassword(ctx.password, user.salt)
          : crypto.createHash('sha256').update(ctx.password).digest('hex');
        if (user.passwordHash !== passHash) {
          return ctx.reject();
        }

        const allServers = db.getServers();
        let accessibleServer: DeployedServer | undefined;

        if (requestedServerId) {
          accessibleServer = allServers.find(
            (s) => s.id === requestedServerId || s.name.toLowerCase().replace(/[^a-z0-9-]/g, '-') === requestedServerId.toLowerCase()
          );
        } else if (user.role === 'ADMIN') {
          accessibleServer = allServers[0];
        } else if (user.assignedServerIds && user.assignedServerIds.length > 0) {
          accessibleServer = allServers.find((s) => user.assignedServerIds?.includes(s.id));
        }

        if (!accessibleServer) {
          return ctx.reject();
        }

        // Enforce RBAC
        if (user.role !== 'ADMIN' && (!user.assignedServerIds || !user.assignedServerIds.includes(accessibleServer.id))) {
          return ctx.reject();
        }

        authenticatedUser = db.toSafeUser(user);
        targetServer = accessibleServer;
        return ctx.accept();
      }

      ctx.reject(['password']);
    });

    client.on('ready', () => {
      client.on('session', (accept) => {
        const session = accept();

        session.on('sftp', (acceptSftp) => {
          const sftp = acceptSftp();
          if (!targetServer) return;

          const volumeRoot = resolveServerVolumeRoot(targetServer);
          let handleCounter = 0;
          const openHandles = new Map<number, { path: string; fd?: number; isDir?: boolean; entries?: string[]; dirIndex?: number }>();

          // Resolve virtual path to real disk path within volume
          const toSafeDiskPath = (virtualPath: string): string | null => {
            return resolveSafePath(volumeRoot, virtualPath);
          };

          sftp.on('REALPATH', (reqid: number, p: string) => {
            // Standard realpath response
            let clean = p.replace(/\\/g, '/');
            if (!clean.startsWith('/')) clean = '/' + clean;
            sftp.name(reqid, [{ filename: clean, longname: clean, attrs: { mode: 0o755, uid: 0, gid: 0, size: 0, atime: 0, mtime: 0 } as any }]);
          });

          sftp.on('STAT', (reqid: number, p: string) => {
            const diskPath = toSafeDiskPath(p);
            if (!diskPath || !fs.existsSync(diskPath)) {
              return sftp.status(reqid, STATUS_CODE.NO_SUCH_FILE);
            }
            try {
              const stats = fs.statSync(diskPath);
              sftp.attrs(reqid, toSftpAttrs(stats));
            } catch {
              sftp.status(reqid, STATUS_CODE.FAILURE);
            }
          });

          sftp.on('LSTAT', (reqid: number, p: string) => {
            const diskPath = toSafeDiskPath(p);
            if (!diskPath || !fs.existsSync(diskPath)) {
              return sftp.status(reqid, STATUS_CODE.NO_SUCH_FILE);
            }
            try {
              const stats = fs.lstatSync(diskPath);
              sftp.attrs(reqid, toSftpAttrs(stats));
            } catch {
              sftp.status(reqid, STATUS_CODE.FAILURE);
            }
          });

          sftp.on('OPENDIR', (reqid: number, p: string) => {
            const diskPath = toSafeDiskPath(p);
            if (!diskPath || !fs.existsSync(diskPath)) {
              return sftp.status(reqid, STATUS_CODE.NO_SUCH_FILE);
            }

            try {
              const dirents = fs.readdirSync(diskPath);
              const handle = ++handleCounter;
              openHandles.set(handle, { path: diskPath, isDir: true, entries: dirents, dirIndex: 0 });
              const handleBuf = Buffer.alloc(4);
              handleBuf.writeUInt32BE(handle, 0);
              sftp.handle(reqid, handleBuf);
            } catch {
              sftp.status(reqid, STATUS_CODE.FAILURE);
            }
          });

          sftp.on('READDIR', (reqid: number, handleBuf: Buffer) => {
            const handle = handleBuf.readUInt32BE(0);
            const state = openHandles.get(handle);
            if (!state || !state.isDir || !state.entries) {
              return sftp.status(reqid, STATUS_CODE.BAD_MESSAGE);
            }

            const startIndex = state.dirIndex || 0;
            if (startIndex >= state.entries.length) {
              return sftp.status(reqid, STATUS_CODE.EOF);
            }

            // Return batch of files
            const batch = state.entries.slice(startIndex, startIndex + 64);
            state.dirIndex = startIndex + batch.length;

            const results = batch.map((name) => {
              const itemPath = path.join(state.path, name);
              let itemStat: any = {};
              try {
                itemStat = fs.statSync(itemPath);
              } catch {}
              return {
                filename: name,
                longname: name,
                attrs: toSftpAttrs(itemStat)
              };
            });

            sftp.name(reqid, results);
          });

          sftp.on('OPEN', (reqid: number, filename: string, flags: number) => {
            const diskPath = toSafeDiskPath(filename);
            if (!diskPath) {
              return sftp.status(reqid, STATUS_CODE.PERMISSION_DENIED);
            }

            try {
              const nodeFlags = stringToFlags(flags);
              const parent = path.dirname(diskPath);
              if (!fs.existsSync(parent)) {
                fs.mkdirSync(parent, { recursive: true });
              }
              const fd = fs.openSync(diskPath, nodeFlags);
              const handle = ++handleCounter;
              openHandles.set(handle, { path: diskPath, fd, isDir: false });
              const handleBuf = Buffer.alloc(4);
              handleBuf.writeUInt32BE(handle, 0);
              sftp.handle(reqid, handleBuf);
            } catch (err: any) {
              if (err.code === 'ENOENT') {
                return sftp.status(reqid, STATUS_CODE.NO_SUCH_FILE);
              }
              sftp.status(reqid, STATUS_CODE.FAILURE);
            }
          });

          sftp.on('READ', (reqid: number, handleBuf: Buffer, offset: number, length: number) => {
            const handle = handleBuf.readUInt32BE(0);
            const state = openHandles.get(handle);
            if (!state || state.fd === undefined) {
              return sftp.status(reqid, STATUS_CODE.BAD_MESSAGE);
            }

            const buffer = Buffer.alloc(length);
            try {
              const bytesRead = fs.readSync(state.fd, buffer, 0, length, offset);
              if (bytesRead === 0) {
                return sftp.status(reqid, STATUS_CODE.EOF);
              }
              sftp.data(reqid, buffer.subarray(0, bytesRead));
            } catch {
              sftp.status(reqid, STATUS_CODE.FAILURE);
            }
          });

          sftp.on('WRITE', (reqid: number, handleBuf: Buffer, offset: number, data: Buffer) => {
            const handle = handleBuf.readUInt32BE(0);
            const state = openHandles.get(handle);
            if (!state || state.fd === undefined) {
              return sftp.status(reqid, STATUS_CODE.BAD_MESSAGE);
            }

            try {
              fs.writeSync(state.fd, data, 0, data.length, offset);
              sftp.status(reqid, STATUS_CODE.OK);
            } catch {
              sftp.status(reqid, STATUS_CODE.FAILURE);
            }
          });

          sftp.on('FSTAT', (reqid: number, handleBuf: Buffer) => {
            const handle = handleBuf.readUInt32BE(0);
            const state = openHandles.get(handle);
            if (!state || state.fd === undefined) {
              return sftp.status(reqid, STATUS_CODE.BAD_MESSAGE);
            }

            try {
              const stats = fs.fstatSync(state.fd);
              sftp.attrs(reqid, toSftpAttrs(stats));
            } catch {
              sftp.status(reqid, STATUS_CODE.FAILURE);
            }
          });

          sftp.on('CLOSE', (reqid: number, handleBuf: Buffer) => {
            const handle = handleBuf.readUInt32BE(0);
            const state = openHandles.get(handle);
            if (state) {
              if (state.fd !== undefined) {
                try {
                  fs.closeSync(state.fd);
                } catch {}
              }
              openHandles.delete(handle);
            }
            sftp.status(reqid, STATUS_CODE.OK);
          });

          sftp.on('UNLINK', (reqid: number, p: string) => {
            const diskPath = toSafeDiskPath(p);
            if (!diskPath || !fs.existsSync(diskPath)) {
              return sftp.status(reqid, STATUS_CODE.NO_SUCH_FILE);
            }
            try {
              fs.unlinkSync(diskPath);
              sftp.status(reqid, STATUS_CODE.OK);
            } catch {
              sftp.status(reqid, STATUS_CODE.FAILURE);
            }
          });

          sftp.on('MKDIR', (reqid: number, p: string) => {
            const diskPath = toSafeDiskPath(p);
            if (!diskPath) {
              return sftp.status(reqid, STATUS_CODE.PERMISSION_DENIED);
            }
            try {
              fs.mkdirSync(diskPath, { recursive: true });
              sftp.status(reqid, STATUS_CODE.OK);
            } catch {
              sftp.status(reqid, STATUS_CODE.FAILURE);
            }
          });

          sftp.on('RMDIR', (reqid: number, p: string) => {
            const diskPath = toSafeDiskPath(p);
            if (!diskPath || !fs.existsSync(diskPath)) {
              return sftp.status(reqid, STATUS_CODE.NO_SUCH_FILE);
            }
            try {
              fs.rmdirSync(diskPath);
              sftp.status(reqid, STATUS_CODE.OK);
            } catch {
              sftp.status(reqid, STATUS_CODE.FAILURE);
            }
          });

          sftp.on('RENAME', (reqid: number, oldPath: string, newPath: string) => {
            const safeOld = toSafeDiskPath(oldPath);
            const safeNew = toSafeDiskPath(newPath);
            if (!safeOld || !safeNew || !fs.existsSync(safeOld)) {
              return sftp.status(reqid, STATUS_CODE.NO_SUCH_FILE);
            }
            try {
              fs.renameSync(safeOld, safeNew);
              sftp.status(reqid, STATUS_CODE.OK);
            } catch {
              sftp.status(reqid, STATUS_CODE.FAILURE);
            }
          });
        });
      });
    });

    client.on('error', (err) => {
      // Suppress client disconnect handshake noise
    });
  });

  server.listen(port, '0.0.0.0', () => {
    console.log(`[SFTP Service]: Wings-compatible SFTP Server listening on sftp://0.0.0.0:${port}`);
  });

  return server;
}
