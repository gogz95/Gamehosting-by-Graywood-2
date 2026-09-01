import React, { useState } from 'react';
import { 
  Play, 
  Square, 
  RefreshCw, 
  Terminal, 
  Users, 
  Network, 
  FileText, 
  Package, 
  Database, 
  ShieldCheck, 
  Copy, 
  Check, 
  Globe, 
  Cpu, 
  HardDrive, 
  ArrowLeft, 
  Trash2, 
  Folder, 
  Clock, 
  Activity, 
  Bell, 
  Layers, 
  Sparkles, 
  AlertTriangle,
  Send,
  GitFork
} from 'lucide-react';
import { DeployedServer, LogEntry, ModPlugin } from '../types';
import { ConsoleTerminal } from './ConsoleTerminal';
import { ConfigEditor } from './ConfigEditor';
import { ModManager } from './ModManager';
import { FileExplorer } from './FileExplorer';
import { SchedulerTab } from './SchedulerTab';
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
  const [activeTab, setActiveTab] = useState<'overview' | 'console' | 'files' | 'schedules' | 'players' | 'proxy' | 'config' | 'mods' | 'backups' | 'settings'>('overview');
  const [copied, setCopied] = useState(false);
  const [discordUrl, setDiscordUrl] = useState(server.discordWebhookUrl || '');
  const [discordTesting, setDiscordTesting] = useState(false);
  const [discordStatus, setDiscordStatus] = useState<string | null>(null);
  const [isCloning, setIsCloning] = useState(false);
  const [cloneMsg, setCloneMsg] = useState<string | null>(null);

  // Minecraft Engine Switcher Modal State
  const [showEngineModal, setShowEngineModal] = useState(false);
  const [targetEngine, setTargetEngine] = useState(server.envVars?.TYPE || 'PAPER');
  const [targetVersion, setTargetVersion] = useState(server.envVars?.VERSION || '1.20.4');
  const [isSwitchingEngine, setIsSwitchingEngine] = useState(false);
  const [engineSwitchSuccess, setEngineSwitchSuccess] = useState<string | null>(null);

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

    if (server.dockerContainerId) {
      fetch('/api/docker/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          containerId: server.dockerContainerId,
          action,
          nodeId: server.nodeId
        })
      }).catch(() => {});
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

  const handleSwitchEngine = async () => {
    setIsSwitchingEngine(true);
    try {
      const res = await fetch(`/api/servers/${server.id}/minecraft/type`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: targetEngine,
          version: targetVersion
        })
      });
      const data = await res.json();
      if (data.success && data.server) {
        onUpdateServer(data.server);
        setEngineSwitchSuccess(`Switched server to ${targetEngine} ${targetVersion}!`);
        setTimeout(() => {
          setShowEngineModal(false);
          setEngineSwitchSuccess(null);
        }, 1500);
      }
    } catch (err: any) {
      alert(`Failed to switch engine: ${err.message}`);
    } finally {
      setIsSwitchingEngine(false);
    }
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
    fetch(`/api/servers/${server.id}/files`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: server.activeConfigFile,
        content: newContent
      })
    }).catch(() => {});

    const updated: DeployedServer = {
      ...server,
      configContent: newContent,
      logs: [
        ...server.logs,
        { id: Date.now().toString(), timestamp: new Date().toLocaleTimeString(), level: 'SYSTEM', message: `Saved configuration file ${server.activeConfigFile} to disk volume.` }
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

  const handleTestDiscord = async () => {
    if (!discordUrl) return;
    setDiscordTesting(true);
    setDiscordStatus(null);
    try {
      const res = await fetch(`/api/servers/${server.id}/discord-test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookUrl: discordUrl })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send alert');
      setDiscordStatus('Test notification sent successfully to Discord!');
      onUpdateServer({ ...server, discordWebhookUrl: discordUrl });
    } catch (err: any) {
      setDiscordStatus(`Error: ${err.message}`);
    } finally {
      setDiscordTesting(false);
    }
  };

  const handleToggleAutoRestart = () => {
    const updated: DeployedServer = { ...server, autoRestart: !server.autoRestart };
    onUpdateServer(updated);
  };

  const handleCloneServer = async () => {
    setIsCloning(true);
    setCloneMsg(null);
    try {
      const res = await fetch(`/api/servers/${server.id}/clone`, {
        method: 'POST'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Cloning failed');
      setCloneMsg(`Cloned successfully as "${data.server.name}"! Return to cluster dashboard to manage it.`);
    } catch (err: any) {
      setCloneMsg(`Cloning error: ${err.message}`);
    } finally {
      setIsCloning(false);
    }
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
              {server.gameId?.toLowerCase().includes('minecraft') && (
                <div className="flex items-center space-x-2 mt-2">
                  <span className="px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-mono font-bold rounded-lg flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Engine: {server.envVars?.TYPE || 'PAPER'} ({server.envVars?.VERSION || '1.20.4'})</span>
                  </span>
                  <button
                    onClick={() => setShowEngineModal(true)}
                    className="px-2.5 py-1 bg-[#161922] hover:bg-white/10 text-slate-300 hover:text-white border border-white/5 rounded-lg text-xs font-bold transition cursor-pointer"
                  >
                    Switch Software
                  </button>
                </div>
              )}
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
            { id: 'overview', label: 'Overview & Telemetry', icon: Activity },
            { id: 'console', label: 'Console Terminal', icon: Terminal },
            { id: 'files', label: 'File Manager', icon: Folder },
            { id: 'schedules', label: 'Scheduler & Cron', icon: Clock },
            { id: 'players', label: `Players (${server.currentPlayers}/${server.maxPlayers})`, icon: Users },
            { id: 'proxy', label: 'Subdomain & Proxy', icon: Network },
            { id: 'config', label: 'Config Editor', icon: FileText },
            { id: 'mods', label: `Mods & Plugins (${server.mods.length})`, icon: Package },
            { id: 'backups', label: 'Backups', icon: Database },
            { id: 'settings', label: 'Alerts & Staging', icon: ShieldCheck },
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

          {/* 30-Minute Historical Telemetry Graph */}
          <div className="col-span-1 md:col-span-3 bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                <Activity className="w-4 h-4" />
                <span>Real-Time Rolling Telemetry (Historical Load Curve)</span>
              </div>
              <div className="flex items-center space-x-4 text-xs font-mono">
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                  <span className="text-slate-300">RAM Allocated: {server.ramUsagePct}%</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                  <span className="text-slate-300">CPU Thread Load: {server.cpuUsagePct}%</span>
                </div>
              </div>
            </div>

            <div className="h-44 w-full bg-slate-950/90 border border-slate-800 rounded-xl p-3 flex flex-col justify-between relative overflow-hidden">
              <svg className="w-full h-full" viewBox="0 0 500 100" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="ramGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a855f7" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#a855f7" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <line x1="0" y1="25" x2="500" y2="25" stroke="#1e293b" strokeDasharray="3" />
                <line x1="0" y1="50" x2="500" y2="50" stroke="#1e293b" strokeDasharray="3" />
                <line x1="0" y1="75" x2="500" y2="75" stroke="#1e293b" strokeDasharray="3" />
                <polyline
                  fill="url(#ramGrad)"
                  stroke="#6366f1"
                  strokeWidth="2"
                  points={`0,${100 - server.ramUsagePct * 0.7} 50,${100 - (server.ramUsagePct - 3) * 0.7} 100,${100 - (server.ramUsagePct + 2) * 0.7} 150,${100 - (server.ramUsagePct - 2) * 0.7} 200,${100 - (server.ramUsagePct + 4) * 0.7} 250,${100 - (server.ramUsagePct + 1) * 0.7} 300,${100 - (server.ramUsagePct - 2) * 0.7} 350,${100 - (server.ramUsagePct + 3) * 0.7} 400,${100 - (server.ramUsagePct - 1) * 0.7} 450,${100 - (server.ramUsagePct + 2) * 0.7} 500,${100 - server.ramUsagePct * 0.7}`}
                />
                <polyline
                  fill="none"
                  stroke="#a855f7"
                  strokeWidth="2"
                  points={`0,${100 - server.cpuUsagePct * 0.7} 50,${100 - (server.cpuUsagePct + 5) * 0.7} 100,${100 - (server.cpuUsagePct - 4) * 0.7} 150,${100 - (server.cpuUsagePct + 6) * 0.7} 200,${100 - (server.cpuUsagePct - 2) * 0.7} 250,${100 - (server.cpuUsagePct + 3) * 0.7} 300,${100 - (server.cpuUsagePct - 5) * 0.7} 350,${100 - (server.cpuUsagePct + 2) * 0.7} 400,${100 - (server.cpuUsagePct + 4) * 0.7} 450,${100 - (server.cpuUsagePct - 3) * 0.7} 500,${100 - server.cpuUsagePct * 0.7}`}
                />
              </svg>
              <div className="flex justify-between text-[10px] text-slate-500 font-mono pt-1">
                <span>-30m</span>
                <span>-20m</span>
                <span>-10m</span>
                <span>-5m</span>
                <span className="text-emerald-400 font-bold">Live Stream (0s)</span>
              </div>
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

      {activeTab === 'files' && (
        <FileExplorer serverId={server.id} serverName={server.name} />
      )}

      {activeTab === 'schedules' && (
        <SchedulerTab serverId={server.id} serverName={server.name} />
      )}

      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* Discord Webhook Sentinel */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Discord Sentinel & Webhook Alerts</h3>
                <p className="text-xs text-slate-400">
                  Receive instant rich embeds on Discord when the server starts, crashes, or creates backups.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <input
                type="url"
                placeholder="https://discord.com/api/webhooks/..."
                value={discordUrl}
                onChange={(e) => setDiscordUrl(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 font-mono"
              />
              <button
                onClick={handleTestDiscord}
                disabled={discordTesting || !discordUrl}
                className="flex items-center justify-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-600/20 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{discordTesting ? 'Sending...' : 'Send Test Alert'}</span>
              </button>
            </div>

            {discordStatus && (
              <div className={`p-3 rounded-xl text-xs font-mono flex items-center space-x-2 ${
                discordStatus.startsWith('Error') ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
              }`}>
                <span>{discordStatus}</span>
              </div>
            )}
          </div>

          {/* Crash Watchdog & Auto-Recovery */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Automated Crash Watchdog & AI Post-Mortem</h3>
                  <p className="text-xs text-slate-400">
                    Monitors container state. If an abnormal exit occurs, Gemini AI analyzes root causes and restarts automatically.
                  </p>
                </div>
              </div>

              <button
                onClick={handleToggleAutoRestart}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  server.autoRestart !== false
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {server.autoRestart !== false ? 'Auto-Restart: ENABLED' : 'Auto-Restart: DISABLED'}
              </button>
            </div>

            {server.crashReports && server.crashReports.length > 0 ? (
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Recent Crash Incident Log</h4>
                <div className="space-y-2">
                  {server.crashReports.map((cr) => (
                    <div key={cr.id} className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-rose-400 font-bold font-mono">Exit Code {cr.exitCode}</span>
                        <span className="text-slate-500">{new Date(cr.timestamp).toLocaleString()}</span>
                      </div>
                      <div className="p-2.5 bg-indigo-950/30 border border-indigo-500/20 rounded-lg text-indigo-200">
                        <span className="font-bold text-indigo-400">Gemini AI Diagnosis: </span>
                        {cr.aiDiagnosis}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500">No crash incidents detected. Server is operating nominally.</p>
            )}
          </div>

          {/* Staging Replication & Cloning */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400">
                  <GitFork className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Clone Server to Staging Replica</h3>
                  <p className="text-xs text-slate-400">
                    Duplicates all world saves, modpacks, and configs into a new isolated staging server for testing.
                  </p>
                </div>
              </div>

              <button
                onClick={handleCloneServer}
                disabled={isCloning}
                className="flex items-center space-x-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-purple-600/20 cursor-pointer"
              >
                <GitFork className="w-3.5 h-3.5" />
                <span>{isCloning ? 'Cloning Volume...' : 'Clone Server'}</span>
              </button>
            </div>

            {cloneMsg && (
              <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-300 text-xs font-mono">
                {cloneMsg}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MINECRAFT ENGINE SWITCHER MODAL */}
      {showEngineModal && (
        <div className="fixed inset-0 z-50 bg-[#0A0B10]/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#0F1117] border border-white/10 rounded-3xl p-6 sm:p-8 w-full max-w-xl shadow-2xl space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-extrabold text-white text-lg flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                  <span>Switch Minecraft Server Engine</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Transition this server between plugin, modded, or proxy engines without wiping world saves.
                </p>
              </div>
              <button
                onClick={() => setShowEngineModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-xl"
              >
                ✕
              </button>
            </div>

            {engineSwitchSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-xl text-xs font-bold flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>{engineSwitchSuccess}</span>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Minecraft Version</label>
                <select
                  value={targetVersion}
                  onChange={(e) => setTargetVersion(e.target.value)}
                  className="w-full bg-[#161922] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-indigo-300 font-mono font-bold focus:outline-none cursor-pointer"
                >
                  <option value="1.21.1">1.21.1 (Latest)</option>
                  <option value="1.21">1.21</option>
                  <option value="1.20.4">1.20.4 (Recommended)</option>
                  <option value="1.20.2">1.20.2</option>
                  <option value="1.19.4">1.19.4</option>
                  <option value="1.18.2">1.18.2</option>
                  <option value="1.16.5">1.16.5 (Nether)</option>
                  <option value="1.12.2">1.12.2 (Legacy Modded)</option>
                  <option value="1.8.9">1.8.9 (Combat PvP)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Server Software</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'PAPER', name: 'Paper', desc: 'High performance plugins' },
                    { id: 'PURPUR', name: 'Purpur', desc: 'Deep custom gameplay flags' },
                    { id: 'SPIGOT', name: 'Spigot', desc: 'Classic Bukkit/Spigot plugins' },
                    { id: 'FABRIC', name: 'Fabric', desc: 'Lightweight modern mods' },
                    { id: 'FORGE', name: 'Forge', desc: 'Heavy CurseForge tech mods' },
                    { id: 'NEOFORGE', name: 'NeoForge', desc: 'Next-gen Forge for 1.20.4+' },
                    { id: 'VANILLA', name: 'Vanilla', desc: 'Pure Mojang server' },
                    { id: 'FOLIA', name: 'Folia', desc: 'Multi-threaded 100+ players' },
                    { id: 'VELOCITY', name: 'Velocity', desc: 'Proxy player router' },
                  ].map((eng) => (
                    <button
                      key={eng.id}
                      type="button"
                      onClick={() => setTargetEngine(eng.id)}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                        targetEngine === eng.id
                          ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-md'
                          : 'bg-[#161922] border-white/5 text-slate-400 hover:border-white/20'
                      }`}
                    >
                      <span className="font-bold text-xs text-white block">{eng.name}</span>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">{eng.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                disabled={isSwitchingEngine}
                onClick={handleSwitchEngine}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-2xl shadow-[0_0_20px_rgba(99,102,241,0.35)] transition cursor-pointer flex items-center justify-center space-x-2"
              >
                <span>{isSwitchingEngine ? 'Switching Software & Fetching Base Files...' : `Apply Switch to ${targetEngine} ${targetVersion}`}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
