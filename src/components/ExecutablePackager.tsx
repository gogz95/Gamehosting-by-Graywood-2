import React, { useState, useRef } from 'react';
import { 
  Box, 
  Terminal, 
  Download, 
  Upload,
  Copy, 
  Check, 
  Monitor, 
  Server, 
  FileCode, 
  Layers, 
  ShieldCheck, 
  Zap, 
  Cpu, 
  Globe, 
  FolderArchive,
  ExternalLink,
  Info,
  CheckCircle2,
  FileJson
} from 'lucide-react';
import { DeployedServer, HostNode, ProxyRule } from '../types';

interface ExecutablePackagerProps {
  servers?: DeployedServer[];
  hostNodes?: HostNode[];
  proxyRules?: ProxyRule[];
  onImportCluster?: (data: { servers: DeployedServer[]; hostNodes: HostNode[]; proxyRules: ProxyRule[] }) => void;
}

export const ExecutablePackager: React.FC<ExecutablePackagerProps> = ({
  servers = [],
  hostNodes = [],
  proxyRules = [],
  onImportCluster,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [selectedOS, setSelectedOS] = useState<'BOTH' | 'WINDOWS' | 'LINUX'>('BOTH');
  const [activePlatform, setActivePlatform] = useState<'ELECTRON_EXE' | 'PKG_BINARY' | 'DOCKER_CONTAINER'>('ELECTRON_EXE');
  const [importStatus, setImportStatus] = useState<{ text: string; success: boolean } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportTopology = () => {
    const data = {
      exportVersion: '2.5.0',
      exportedAt: new Date().toISOString(),
      cluster: {
        hostNodes,
        servers,
        proxyRules
      }
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexus-cluster-backup-${Date.now().toString(36)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportTopology = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.cluster && onImportCluster) {
          onImportCluster({
            servers: parsed.cluster.servers || [],
            hostNodes: parsed.cluster.hostNodes || [],
            proxyRules: parsed.cluster.proxyRules || []
          });
          setImportStatus({
            text: `Successfully restored ${parsed.cluster.servers?.length || 0} servers and ${parsed.cluster.hostNodes?.length || 0} nodes!`,
            success: true
          });
          setTimeout(() => setImportStatus(null), 4000);
        } else {
          setImportStatus({ text: 'Invalid cluster snapshot format.', success: false });
          setTimeout(() => setImportStatus(null), 4000);
        }
      } catch (err) {
        setImportStatus({ text: 'Failed to parse JSON file.', success: false });
        setTimeout(() => setImportStatus(null), 4000);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleCopy = (key: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const electronMainJs = `// electron/main.js
const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    title: 'GameHost Proxy Control Panel',
    icon: path.join(__dirname, '../public/icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:3000');
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});`;

  const electronBuilderJson = `{
  "appId": "com.gamehost.proxy.panel",
  "productName": "GameHost Proxy Control Panel",
  "directories": {
    "output": "dist-executable"
  },
  "files": [
    "dist/**/*",
    "electron/**/*",
    "package.json"
  ],
  "win": {
    "target": ["nsis", "portable"],
    "icon": "public/icon.ico"
  },
  "linux": {
    "target": ["AppImage", "deb", "tar.gz"],
    "category": "Network",
    "icon": "public/icon.png"
  }
}`;

  const linuxSystemdService = `# /etc/systemd/system/gamehost-proxy.service
[Unit]
Description=GameHost Proxy Control Panel Daemon
After=network.target

[Service]
Type=simple
User=gamehost
WorkingDirectory=/opt/gamehost-proxy
ExecStart=/opt/gamehost-proxy/bin/gamehost-proxy-linux
Restart=always
RestartSec=5
Environment=NODE_ENV=production PORT=3000

[Install]
WantedBy=multi-user.target`;

  const dockerfileSnippet = `# Standalone Multi-Stage Dockerfile (Linux / Windows WSL2)
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
CMD ["npm", "run", "start"]`;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#0F1117]/90 backdrop-blur-md border border-white/5 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-indigo-600/10 border border-indigo-500/20 rounded-full text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Box className="w-3.5 h-3.5 text-indigo-400" />
              <span>Dual Target: Windows Executable (.exe) & Linux Binary (ELF / AppImage)</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Windows & Linux Executable Packager
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
              Export and compile GameHost Proxy into native standalone executables for both <strong className="text-white">Windows</strong> (<code className="text-indigo-300 font-mono">.exe</code> setup & portable) and <strong className="text-white">Linux</strong> (<code className="text-indigo-300 font-mono">.AppImage</code>, <code className="text-indigo-300 font-mono">.deb</code>, or single-file ELF binary daemon).
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              onClick={handleExportTopology}
              className="flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-3 rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.35)] transition cursor-pointer"
            >
              <FileJson className="w-4 h-4" />
              <span>Export Cluster Topology (JSON)</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center space-x-2 bg-[#161922] hover:bg-white/10 text-slate-200 font-bold text-xs px-4 py-3 rounded-xl border border-white/10 transition cursor-pointer"
            >
              <Upload className="w-4 h-4 text-indigo-400" />
              <span>Import Cluster Backup</span>
            </button>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportTopology}
              accept=".json"
              className="hidden"
            />
          </div>
        </div>

        {importStatus && (
          <div
            className={`mt-4 p-3 rounded-xl text-xs flex items-center space-x-2 border ${
              importStatus.success
                ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{importStatus.text}</span>
          </div>
        )}
      </div>

      {/* Target OS Filter Switcher */}
      <div className="flex items-center justify-between bg-[#0F1117] p-2 border border-white/5 rounded-2xl">
        <span className="text-xs font-bold text-slate-400 px-3">Select Operating System View:</span>
        <div className="flex space-x-1">
          <button
            onClick={() => setSelectedOS('BOTH')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              selectedOS === 'BOTH' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Windows & Linux (Both)
          </button>
          <button
            onClick={() => setSelectedOS('WINDOWS')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              selectedOS === 'WINDOWS' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            🪟 Windows (.exe)
          </button>
          <button
            onClick={() => setSelectedOS('LINUX')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              selectedOS === 'LINUX' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            🐧 Linux (AppImage / ELF)
          </button>
        </div>
      </div>

      {/* Target Packaging Strategy Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => setActivePlatform('ELECTRON_EXE')}
          className={`p-5 rounded-2xl border text-left transition flex flex-col justify-between space-y-3 cursor-pointer ${
            activePlatform === 'ELECTRON_EXE'
              ? 'bg-indigo-600/10 border-indigo-500/50 text-white shadow-[0_0_20px_rgba(79,70,229,0.2)]'
              : 'bg-[#0F1117]/80 border-white/5 text-slate-400 hover:border-white/10 hover:text-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <Monitor className={`w-6 h-6 ${activePlatform === 'ELECTRON_EXE' ? 'text-indigo-400' : 'text-slate-400'}`} />
            <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
              Desktop GUI App
            </span>
          </div>
          <div>
            <h4 className="font-extrabold text-white text-base">Electron Desktop App</h4>
            <p className="text-xs text-slate-400">Windows Installer (.exe) & Linux Desktop Package (.AppImage / .deb)</p>
          </div>
        </button>

        <button
          onClick={() => setActivePlatform('PKG_BINARY')}
          className={`p-5 rounded-2xl border text-left transition flex flex-col justify-between space-y-3 cursor-pointer ${
            activePlatform === 'PKG_BINARY'
              ? 'bg-indigo-600/10 border-indigo-500/50 text-white shadow-[0_0_20px_rgba(79,70,229,0.2)]'
              : 'bg-[#0F1117]/80 border-white/5 text-slate-400 hover:border-white/10 hover:text-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <Cpu className={`w-6 h-6 ${activePlatform === 'PKG_BINARY' ? 'text-indigo-400' : 'text-slate-400'}`} />
            <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">
              Portable Binary
            </span>
          </div>
          <div>
            <h4 className="font-extrabold text-white text-base">Single Executable Binary (PKG)</h4>
            <p className="text-xs text-slate-400">Directly executable binary file with no Node.js required on target machine.</p>
          </div>
        </button>

        <button
          onClick={() => setActivePlatform('DOCKER_CONTAINER')}
          className={`p-5 rounded-2xl border text-left transition flex flex-col justify-between space-y-3 cursor-pointer ${
            activePlatform === 'DOCKER_CONTAINER'
              ? 'bg-indigo-600/10 border-indigo-500/50 text-white shadow-[0_0_20px_rgba(79,70,229,0.2)]'
              : 'bg-[#0F1117]/80 border-white/5 text-slate-400 hover:border-white/10 hover:text-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <Server className={`w-6 h-6 ${activePlatform === 'DOCKER_CONTAINER' ? 'text-indigo-400' : 'text-slate-400'}`} />
            <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">
              Server Daemon
            </span>
          </div>
          <div>
            <h4 className="font-extrabold text-white text-base">Docker & Systemd Daemon</h4>
            <p className="text-xs text-slate-400">Deploy as a background system service on Linux servers or Windows WSL2.</p>
          </div>
        </button>
      </div>

      {/* PLATFORM SPECIFIC CARDS */}
      {(selectedOS === 'BOTH' || selectedOS === 'WINDOWS') && (
        <div className="bg-[#0F1117]/80 backdrop-blur-md border border-white/5 rounded-3xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-lg">
                🪟
              </div>
              <div>
                <h3 className="font-extrabold text-white text-lg">Windows Executable Deployment (.exe)</h3>
                <p className="text-xs text-slate-400">Generate Windows 10/11 64-bit setup installer or portable standalone .exe</p>
              </div>
            </div>

            <span className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-xs font-bold font-mono">
              Windows x64 Target
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#161922] p-4 rounded-2xl border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center space-x-2">
                  <Monitor className="w-4 h-4 text-blue-400" />
                  <span>1. Electron Windows GUI Installer</span>
                </span>
                <button
                  onClick={() => handleCopy('winExeCmd', 'npm run build:win')}
                  className="text-xs text-blue-400 hover:text-blue-300 font-bold cursor-pointer"
                >
                  {copiedKey === 'winExeCmd' ? 'Copied!' : 'Copy Command'}
                </button>
              </div>
              <pre className="bg-[#0F1117] p-3 rounded-xl border border-white/5 text-xs text-blue-300 font-mono">
                npm run build:win
              </pre>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Compiles Vite frontend and bundles into <code className="text-white font-mono">dist-executable/GameHost-Setup-2.5.0.exe</code> NSIS setup installer.
              </p>
            </div>

            <div className="bg-[#161922] p-4 rounded-2xl border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center space-x-2">
                  <Cpu className="w-4 h-4 text-purple-400" />
                  <span>2. Portable CLI Binary (.exe)</span>
                </span>
                <button
                  onClick={() => handleCopy('winPkgCmd', 'npm run build:pkg:win')}
                  className="text-xs text-purple-400 hover:text-purple-300 font-bold cursor-pointer"
                >
                  {copiedKey === 'winPkgCmd' ? 'Copied!' : 'Copy Command'}
                </button>
              </div>
              <pre className="bg-[#0F1117] p-3 rounded-xl border border-white/5 text-xs text-purple-300 font-mono">
                npm run build:pkg:win
              </pre>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Generates <code className="text-white font-mono">bin/gamehost-proxy-win.exe</code> single portable binary file with Node runtime embedded.
              </p>
            </div>
          </div>
        </div>
      )}

      {(selectedOS === 'BOTH' || selectedOS === 'LINUX') && (
        <div className="bg-[#0F1117]/80 backdrop-blur-md border border-white/5 rounded-3xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-lg">
                🐧
              </div>
              <div>
                <h3 className="font-extrabold text-white text-lg">Linux Executable Deployment (AppImage / DEB / ELF)</h3>
                <p className="text-xs text-slate-400">Generate Linux executables for Ubuntu, Debian, CentOS, RHEL, Arch</p>
              </div>
            </div>

            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-bold font-mono">
              Linux x86_64 Target
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#161922] p-4 rounded-2xl border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center space-x-2">
                  <Monitor className="w-4 h-4 text-emerald-400" />
                  <span>1. Desktop AppImage & .DEB</span>
                </span>
                <button
                  onClick={() => handleCopy('linuxExeCmd', 'npm run build:linux')}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-bold cursor-pointer"
                >
                  {copiedKey === 'linuxExeCmd' ? 'Copied!' : 'Copy Command'}
                </button>
              </div>
              <pre className="bg-[#0F1117] p-3 rounded-xl border border-white/5 text-xs text-emerald-300 font-mono">
                npm run build:linux
              </pre>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Builds <code className="text-white font-mono">dist-executable/GameHost-Proxy-2.5.0.AppImage</code> and <code className="text-white font-mono">.deb</code> package.
              </p>
            </div>

            <div className="bg-[#161922] p-4 rounded-2xl border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center space-x-2">
                  <Cpu className="w-4 h-4 text-purple-400" />
                  <span>2. Single ELF Server Binary</span>
                </span>
                <button
                  onClick={() => handleCopy('linuxPkgCmd', 'npm run build:pkg:linux')}
                  className="text-xs text-purple-400 hover:text-purple-300 font-bold cursor-pointer"
                >
                  {copiedKey === 'linuxPkgCmd' ? 'Copied!' : 'Copy Command'}
                </button>
              </div>
              <pre className="bg-[#0F1117] p-3 rounded-xl border border-white/5 text-xs text-purple-300 font-mono">
                npm run build:pkg:linux
              </pre>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Creates <code className="text-white font-mono">bin/gamehost-proxy-linux</code> ELF executable ready for systemd daemon deployment.
              </p>
            </div>
          </div>

          {/* Linux Systemd Service */}
          <div className="space-y-2 pt-2 border-t border-white/5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-200">
              <span className="flex items-center space-x-2">
                <Server className="w-4 h-4 text-emerald-400" />
                <span>Linux Systemd Daemon Service Configuration</span>
              </span>
              <button
                onClick={() => handleCopy('systemd', linuxSystemdService)}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-bold cursor-pointer"
              >
                {copiedKey === 'systemd' ? 'Copied!' : 'Copy Service File'}
              </button>
            </div>
            <pre className="bg-[#161922] p-3.5 rounded-xl border border-white/5 text-xs text-slate-300 font-mono overflow-x-auto max-h-40">
              {linuxSystemdService}
            </pre>
          </div>
        </div>
      )}

      {/* CONFIGURATION FILES SUMMARY */}
      {activePlatform === 'ELECTRON_EXE' && (
        <div className="bg-[#0F1117]/80 backdrop-blur-md border border-white/5 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <FileCode className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-white text-base">electron-builder.json Config</h3>
                <p className="text-xs text-slate-400">Cross-compilation targets for Windows and Linux</p>
              </div>
            </div>

            <button
              onClick={() => handleCopy('ebJson', electronBuilderJson)}
              className="flex items-center space-x-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-bold cursor-pointer"
            >
              {copiedKey === 'ebJson' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedKey === 'ebJson' ? 'Copied!' : 'Copy JSON'}</span>
            </button>
          </div>

          <pre className="bg-[#161922] p-4 rounded-2xl border border-white/5 text-xs text-indigo-300 font-mono overflow-x-auto max-h-60">
            {electronBuilderJson}
          </pre>
        </div>
      )}

      {/* EXPORT INSTRUCTIONS */}
      <div id="export-instructions" className="bg-[#0F1117]/80 backdrop-blur-md border border-white/5 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center space-x-3 border-b border-white/5 pb-4">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <FolderArchive className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-white text-lg">How to Download & Build the Executables</h3>
            <p className="text-xs text-slate-400">Export the source code from AI Studio to compile on your machine.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="bg-[#161922] p-4 rounded-2xl border border-white/5 space-y-2">
            <div className="font-extrabold text-amber-300 flex items-center space-x-2">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px]">1</span>
              <span>Export Code ZIP</span>
            </div>
            <p className="text-slate-400">
              Click Settings gear icon in top right corner of AI Studio & select <strong>"Export project as ZIP"</strong> or push to GitHub.
            </p>
          </div>

          <div className="bg-[#161922] p-4 rounded-2xl border border-white/5 space-y-2">
            <div className="font-extrabold text-blue-300 flex items-center space-x-2">
              <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-[10px]">2</span>
              <span>Build Windows .EXE</span>
            </div>
            <p className="text-slate-400">
              Extract ZIP on Windows and run <code className="text-white font-mono">npm install</code> then <code className="text-white font-mono">npm run build:win</code>.
            </p>
          </div>

          <div className="bg-[#161922] p-4 rounded-2xl border border-white/5 space-y-2">
            <div className="font-extrabold text-emerald-300 flex items-center space-x-2">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px]">3</span>
              <span>Build Linux Binary</span>
            </div>
            <p className="text-slate-400">
              On Linux or WSL2, run <code className="text-white font-mono">npm run build:linux</code> or <code className="text-white font-mono">npm run build:pkg:linux</code>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
