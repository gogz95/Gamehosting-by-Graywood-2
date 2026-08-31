import React, { useState } from 'react';
import { Play, Square, RefreshCw, Terminal, Users, Network, FileText, Package, Database, ShieldCheck, Copy, Check, Globe, Cpu, HardDrive, ArrowLeft, Trash2 } from 'lucide-react';
import { DeployedServer, LogEntry, ModPlugin } from '../types';
import { ConsoleTerminal } from './ConsoleTerminal';
import { ConfigEditor } from './ConfigEditor';
import { ModManager } from './ModManager';
import { generateProxyConfig } from '../utils/proxyGenerator';

interface ServerDetailViewProps {
  server: DeployedServer;
  onBack: () => void;
  onUpdateServer: (updatedServer: DeployedServer) => void;
  onDeleteServer: (serverId: string) => void;
}

export const ServerDetailView: React.FC<ServerDetailViewProps> = ({
  server,
  onBack,
  onUpdateServer,
  onDeleteServer,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'console' | 'players' | 'proxy' | 'config' | 'mods' | 'backups'>('overview');
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleStatus = (action: 'START' | 'STOP' | 'RESTART') => {
    let newStatus = server.status;
    let newLogMsg = '';

    if (action === 'START') {
      newStatus = 'RUNNING';
      newLogMsg = 'Server started by operator.';
    } else if (action === 'STOP') {
      newStatus = 'STOPPED';
      newLogMsg = 'Server container stopped safely.';
    } else if (action === 'RESTART') {
      newStatus = 'RUNNING';
      newLogMsg = 'Server restarted. All memory pools cleared.';
    }

    const updated: DeployedServer = {
      ...server,
      status: newStatus,
      logs: [
        ...server.logs,
        { id: Date.now().toString(), timestamp: new Date().toLocaleTimeString(), level: 'SYSTEM', message: newLogMsg }
      ]
    };
    onUpdateServer(updated);
  };

  const handleSendCommand = (cmd: string) => {
    const newLog: LogEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString(),
      level: 'COMMAND',
      message: `> ${cmd}`
    };

    const trimmed = cmd.trim().toLowerCase();
    let replyMsg = `[Server]: Command executed (${cmd})`;

    if (cmd.startsWith('op ')) {
      replyMsg = `[Server]: Made ${cmd.split(' ')[1]} a server operator`;
    } else if (cmd.startsWith('kick ')) {
      replyMsg = `[Server]: Kicked player ${cmd.split(' ')[1] || 'target'}`;
    } else if (cmd.startsWith('say ')) {
      replyMsg = `[Server Broadcast]: ${cmd.slice(4)}`;
    } else if (trimmed === 'save-all') {
      replyMsg = '[Server]: Saved the world data to NVMe storage';
    } else if (trimmed === 'tps') {
      replyMsg = '[Server]: TPS = 20.0 (1m: 20.0, 5m: 19.98, 15m: 20.0) — Tick health 100% optimal';
    } else if (trimmed === 'status') {
      replyMsg = `[Server]: Status: ${server.status} | Players: ${server.currentPlayers}/${server.maxPlayers} | Memory: ${((server.ramAllocatedGb * server.ramUsagePct) / 100).toFixed(1)}GB/${server.ramAllocatedGb}GB`;
    } else if (trimmed === 'seed') {
      replyMsg = '[Server]: World Seed: [-582910482910481029] (Biome: Highlands & Ocean)';
    } else if (trimmed === 'list') {
      const playerNames = server.playersList.map((p) => p.username).join(', ') || 'No players currently connected';
      replyMsg = `[Server]: There are ${server.currentPlayers}/${server.maxPlayers} online: ${playerNames}`;
    } else if (trimmed.includes('time set')) {
      replyMsg = `[Server]: Set world time to ${cmd.split(' ')[2] || 'day'}`;
    }

    const replyLog: LogEntry = {
      id: (Date.now() + 1).toString(),
      timestamp: new Date().toLocaleTimeString(),
      level: 'INFO',
      message: replyMsg
    };

    const updated: DeployedServer = {
      ...server,
      logs: [...server.logs, newLog, replyLog]
    };
    onUpdateServer(updated);
  };

  const handleSaveConfig = (newContent: string) => {
    const updated: DeployedServer = {
      ...server,
      configContent: newContent,
      logs: [
        ...server.logs,
        { id: Date.now().toString(), timestamp: new Date().toLocaleTimeString(), level: 'SYSTEM', message: `Updated configuration file ${server.activeConfigFile}` }
      ]
    };
    onUpdateServer(updated);
  };

  const handleToggleMod = (_serverId: string, modId: string) => {
    const updatedMods = server.mods.map((m) => (m.id === modId ? { ...m, enabled: !m.enabled } : m));
    onUpdateServer({ ...server, mods: updatedMods });
  };

  const handleInstallMod = (_serverId: string, newMod: ModPlugin) => {
    if (!server.mods.some((m) => m.id === newMod.id || m.name === newMod.name)) {
      onUpdateServer({ ...server, mods: [...server.mods, newMod] });
    }
  };

  const handleUninstallMod = (_serverId: string, modId: string) => {
    onUpdateServer({ ...server, mods: server.mods.filter((m) => m.id !== modId) });
  };

  const handleUpdateModConfig = (_serverId: string, modId: string, newConfig: string) => {
    const updatedMods = server.mods.map((m) => (m.id === modId ? { ...m, configContent: newConfig } : m));
    onUpdateServer({ ...server, mods: updatedMods });
  };

  const proxyConfigSnippet = generateProxyConfig(
    server.subdomain,
    server.baseDomain,
    server.nodeIp,
    server.port,
    'TCP',
    server.proxyEngine,
    server.gameId
  );

  return (
    <div className="space-y-6">
      {/* Top Navigation & Status Bar */}
      <div className="bg-[#0F1117]/90 backdrop-blur-md border border-white/5 rounded-3xl p-6 md:p-8 shadow-2xl space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={onBack}
              className="p-2.5 text-slate-400 hover:text-white bg-[#161922] border border-white/5 rounded-2xl transition cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-2xl font-extrabold text-white tracking-tight">{server.name}</h2>
                <span
                  className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    server.status === 'RUNNING'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}
                >
                  {server.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {server.gameName} • Deployed on {server.nodeName}
              </p>
            </div>
          </div>

          {/* Controls & Delete */}
          <div className="flex items-center space-x-2">
            {server.status === 'RUNNING' ? (
              <>
                <button
                  onClick={() => handleToggleStatus('RESTART')}
                  className="flex items-center space-x-1.5 bg-[#161922] hover:bg-white/10 text-slate-200 text-xs font-bold px-4 py-2.5 rounded-xl border border-white/5 transition cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
                  <span>Restart</span>
                </button>
                <button
                  onClick={() => handleToggleStatus('STOP')}
                  className="flex items-center space-x-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white text-xs font-bold px-4 py-2.5 rounded-xl border border-rose-500/30 transition cursor-pointer"
                >
                  <Square className="w-3.5 h-3.5" />
                  <span>Stop</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => handleToggleStatus('START')}
                className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.3)] transition cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Start Server</span>
              </button>
            )}

            <button
              onClick={() => onDeleteServer(server.id)}
              className="p-2.5 text-slate-500 hover:text-rose-400 hover:bg-white/5 rounded-2xl transition cursor-pointer"
              title="Delete Server"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Subdomain Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-[#161922] border border-blue-500/30 rounded-2xl p-4 gap-3 shadow-lg">
          <div className="flex items-center space-x-2 font-mono text-xs">
            <Globe className="w-4 h-4 text-blue-400" />
            <span className="text-slate-400">Public Subdomain Route:</span>
            <span className="font-bold text-blue-300">{server.fullDomain}</span>
            <span className="text-slate-500">({server.proxyEngine})</span>
          </div>

          <button
            onClick={() => handleCopy(`${server.fullDomain}:${server.port}`)}
            className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-[0_0_15px_rgba(37,99,235,0.3)] transition cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Domain Address'}</span>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 overflow-x-auto pt-2 border-t border-slate-800/80 scrollbar-none">
          {[
            { id: 'overview', label: 'Overview Metrics', icon: Cpu },
            { id: 'console', label: 'Console Terminal', icon: Terminal },
            { id: 'players', label: `Players (${server.currentPlayers}/${server.maxPlayers})`, icon: Users },
            { id: 'proxy', label: 'Subdomain & Proxy Config', icon: Network },
            { id: 'config', label: 'Server Settings', icon: FileText },
            { id: 'mods', label: `Mods & Plugins (${server.mods.length})`, icon: Package },
            { id: 'backups', label: 'Backups', icon: Database },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-medium transition cursor-pointer whitespace-nowrap ${
                  activeTab === t.id
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Hardware Gauges */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
            <h3 className="font-bold text-white text-sm">Resource Allocation</h3>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">RAM Memory</span>
                  <span className="font-semibold text-indigo-300 font-mono">
                    {((server.ramAllocatedGb * server.ramUsagePct) / 100).toFixed(1)} GB / {server.ramAllocatedGb} GB
                  </span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full border border-slate-800 overflow-hidden">
                  <div
                    className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${server.ramUsagePct}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">CPU Container Load</span>
                  <span className="font-semibold text-purple-300 font-mono">{server.cpuUsagePct}%</span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full border border-slate-800 overflow-hidden">
                  <div
                    className="bg-purple-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${server.cpuUsagePct}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Connection Info */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
            <h3 className="font-bold text-white text-sm">Networking & Ports</h3>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Internal Container Port:</span>
                <span className="text-slate-200">{server.port}</span>
              </div>
              {server.rconPort && (
                <div className="flex justify-between text-slate-400">
                  <span>RCON Management Port:</span>
                  <span className="text-indigo-300">{server.rconPort}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-400">
                <span>Host Node IP:</span>
                <span className="text-slate-200">{server.nodeIp}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>SSL Status:</span>
                <span className="text-emerald-400">Active (Let's Encrypt)</span>
              </div>
            </div>
          </div>

          {/* Quick Player Overview */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
            <h3 className="font-bold text-white text-sm">Online Players</h3>
            <div className="text-2xl font-extrabold text-indigo-300">
              {server.currentPlayers} <span className="text-xs text-slate-500 font-normal">/ {server.maxPlayers} max</span>
            </div>
            <div className="space-y-1">
              {server.playersList.map((p) => (
                <div key={p.id} className="flex justify-between text-xs bg-slate-950 p-2 rounded-lg">
                  <span className="text-slate-200">{p.username}</span>
                  <span className="text-emerald-400 font-mono">{p.ping}ms</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'console' && (
        <ConsoleTerminal
          logs={server.logs}
          onSendCommand={handleSendCommand}
          serverName={server.name}
          containerId={server.dockerContainerId}
          rconPort={server.rconPort}
          rconPassword={server.rconPassword}
          hostIp={server.nodeIp}
        />
      )}

      {activeTab === 'players' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="font-bold text-white text-sm">Active Online Players</h3>
          {server.playersList.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">No players currently connected.</div>
          ) : (
            <div className="divide-y divide-slate-800">
              {server.playersList.map((player) => (
                <div key={player.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-200">{player.username}</div>
                    <div className="text-[10px] text-slate-500">Online since {player.onlineSince}</div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="font-mono text-emerald-400">{player.ping}ms ping</span>
                    <button
                      onClick={() => handleSendCommand(`kick ${player.username}`)}
                      className="px-2.5 py-1 bg-rose-600/20 text-rose-300 hover:bg-rose-600 hover:text-white rounded-lg text-xs transition cursor-pointer"
                    >
                      Kick
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'proxy' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="font-bold text-white text-sm">Generated Reverse Proxy File ({proxyConfigSnippet.filename})</h3>
          <pre className="bg-slate-950 p-4 rounded-xl font-mono text-xs text-indigo-300 overflow-x-auto">
            {proxyConfigSnippet.configText}
          </pre>
        </div>
      )}

      {activeTab === 'config' && (
        <ConfigEditor
          filename={server.activeConfigFile}
          initialContent={server.configContent}
          onSave={handleSaveConfig}
        />
      )}

      {activeTab === 'mods' && (
        <div className="bg-[#0F1117]/80 backdrop-blur-md border border-white/5 rounded-3xl p-6 shadow-xl">
          <ModManager
            servers={[server]}
            selectedServerId={server.id}
            embedded={true}
            onInstallMod={handleInstallMod}
            onUninstallMod={handleUninstallMod}
            onToggleMod={handleToggleMod}
            onUpdateModConfig={handleUpdateModConfig}
          />
        </div>
      )}

      {activeTab === 'backups' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 text-xs">
          <h3 className="font-bold text-white text-sm">World Snapshots & Backups</h3>
          <p className="text-slate-400">Automated daily backups stored securely on local NVMe disk.</p>
          <div className="space-y-2">
            {server.backups.map((b) => (
              <div key={b.id} className="bg-slate-950 p-3 rounded-xl flex items-center justify-between font-mono">
                <span className="text-slate-200">{b.name} ({b.sizeMb} MB)</span>
                <span className="text-indigo-400">{new Date(b.createdAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
