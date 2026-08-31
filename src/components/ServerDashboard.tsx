import React, { useState, useEffect } from 'react';
import { Server, Play, Square, RefreshCw, Globe, Users, Cpu, HardDrive, Terminal, Copy, Check, Plus, Network, ExternalLink, Rocket, Radio, Activity } from 'lucide-react';
import { DeployedServer, DockerSystemStatus } from '../types';

interface ServerDashboardProps {
  servers: DeployedServer[];
  onSelectServer: (server: DeployedServer) => void;
  onToggleStatus: (serverId: string, action: 'START' | 'STOP' | 'RESTART') => void;
  onOpenDeployModal: () => void;
  onOpenProxyManager: () => void;
}

export const ServerDashboard: React.FC<ServerDashboardProps> = ({
  servers,
  onSelectServer,
  onToggleStatus,
  onOpenDeployModal,
  onOpenProxyManager,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [dockerStatus, setDockerStatus] = useState<DockerSystemStatus | null>(null);
  const [queryingId, setQueryingId] = useState<string | null>(null);
  const [queryResults, setQueryResults] = useState<Record<string, any>>({});

  useEffect(() => {
    fetch('/api/docker/status')
      .then((res) => res.json())
      .then((data) => setDockerStatus(data))
      .catch(() => setDockerStatus({ online: false, mode: 'STANDALONE' }));
  }, []);

  const handleCopyDomain = (e: React.MouseEvent, text: string, id: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleLiveQuery = async (e: React.MouseEvent, srv: DeployedServer) => {
    e.stopPropagation();
    setQueryingId(srv.id);
    try {
      const res = await fetch('/api/game/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: srv.gameId.includes('minecraft') ? 'minecraft' : 'valheim',
          host: srv.nodeIp,
          port: srv.port
        })
      });
      const data = await res.json();
      setQueryResults((prev) => ({ ...prev, [srv.id]: data }));
    } catch (err) {}
    setQueryingId(null);
  };

  return (
    <div className="space-y-8">
      {/* Top Welcome Banner */}
      <div className="bg-[#0F1117]/90 backdrop-blur-md border border-white/5 rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/5 blur-[90px] rounded-full pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center space-x-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                Proxy Gateway Active
              </span>
            </div>

            {dockerStatus && (
              <div className={`flex items-center space-x-1.5 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${
                dockerStatus.online
                  ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                  : 'bg-slate-800/80 border-white/10 text-slate-400'
              }`}>
                <Activity className="w-3 h-3" />
                <span>
                  {dockerStatus.online ? `Docker Engine: Live (${dockerStatus.version})` : 'Docker: Standalone Mode'}
                </span>
              </div>
            )}
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Active Server Instances
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl leading-relaxed">
            Manage your game server clusters for Minecraft, Satisfactory, Valheim, and more. All instances are automatically proxied with custom subdomain routing and SSL.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0 relative z-10">
          <button
            onClick={onOpenProxyManager}
            className="flex items-center space-x-2 bg-[#161922] hover:bg-[#1f2430] text-slate-200 text-xs font-semibold px-4 py-3 rounded-xl border border-white/10 transition cursor-pointer"
          >
            <Network className="w-4 h-4 text-blue-400" />
            <span>Proxy Routing</span>
          </button>

          <button
            onClick={onOpenDeployModal}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-5 py-3 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.35)] transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Deploy Instance</span>
          </button>
        </div>
      </div>

      {/* Deployed Servers Grid */}
      {servers.length === 0 ? (
        <div className="bg-[#0F1117]/80 backdrop-blur-md border border-white/5 rounded-3xl p-12 text-center space-y-4">
          <div className="w-14 h-14 bg-blue-600/20 border border-blue-500/30 rounded-2xl flex items-center justify-center text-blue-400 mx-auto shadow-[0_0_15px_rgba(37,99,235,0.3)]">
            <Server className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">No Active Game Instances</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              You haven't deployed any game servers yet. Click below to launch your first instance with 1-click subdomain proxying.
            </p>
          </div>
          <button
            onClick={onOpenDeployModal}
            className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.35)] transition cursor-pointer"
          >
            <Rocket className="w-4 h-4" />
            <span>Deploy First Instance</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {servers.map((server) => (
            <div
              key={server.id}
              onClick={() => onSelectServer(server)}
              className="group bg-[#0F1117]/80 backdrop-blur-md border border-white/5 hover:border-blue-500/40 rounded-3xl p-6 shadow-xl transition duration-200 flex flex-col justify-between cursor-pointer space-y-5 relative overflow-hidden"
            >
              {/* Status Top Accent Bar */}
              <div
                className={`absolute top-0 left-0 right-0 h-1 ${
                  server.status === 'RUNNING' ? 'bg-emerald-500' : 'bg-slate-700'
                }`}
              />

              {/* Header */}
              <div className="space-y-3 pt-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">
                      {server.gameName}
                    </span>
                    <h3 className="font-extrabold text-white text-lg group-hover:text-blue-300 transition">
                      {server.name}
                    </h3>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shrink-0 ${
                      server.status === 'RUNNING'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-slate-500/10 text-slate-400 border border-white/5'
                    }`}
                  >
                    {server.status}
                  </span>
                </div>

                {/* Subdomain Pill */}
                <div
                  onClick={(e) => handleCopyDomain(e, server.fullDomain, server.id)}
                  className="flex items-center justify-between bg-[#161922] border border-white/5 hover:border-blue-500/30 rounded-2xl p-3 transition text-xs font-mono"
                >
                  <div className="flex items-center space-x-2 truncate pr-2">
                    <Globe className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span className="text-blue-300 font-bold truncate">{server.fullDomain}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0 hover:text-white flex items-center space-x-1">
                    {copiedId === server.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedId === server.id ? 'Copied' : 'Copy'}</span>
                  </span>
                </div>
              </div>

              {/* Hardware Progress Bars */}
              <div className="space-y-2.5 py-3 border-y border-white/5 text-xs">
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-400">RAM Memory</span>
                    <span className="font-mono font-semibold text-slate-300">
                      {((server.ramAllocatedGb * server.ramUsagePct) / 100).toFixed(1)}GB / {server.ramAllocatedGb}GB
                    </span>
                  </div>
                  <div className="w-full bg-[#161922] h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${server.ramUsagePct}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-400">CPU Load</span>
                    <span className="font-mono font-semibold text-slate-300">{server.cpuUsagePct}%</span>
                  </div>
                  <div className="w-full bg-[#161922] h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-purple-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${server.cpuUsagePct}%` }}
                    />
                  </div>
                </div>
              </div>

              {queryResults[server.id] && (
                <div className="bg-[#161922] border border-blue-500/30 rounded-xl px-3 py-1.5 text-[11px] font-mono flex items-center justify-between text-blue-300">
                  <span>Latency: {queryResults[server.id].ping}ms</span>
                  <span className={queryResults[server.id].online ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                    {queryResults[server.id].online ? '● Live UDP Query' : '○ Standalone'}
                  </span>
                </div>
              )}

              {/* Footer Controls & Stats */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                    <Users className="w-3.5 h-3.5 text-blue-400" />
                    <span className="font-semibold text-slate-200">
                      {queryResults[server.id]?.online ? queryResults[server.id].players : server.currentPlayers}/{server.maxPlayers}
                    </span>
                    <span>Online</span>
                  </div>

                  <button
                    onClick={(e) => handleLiveQuery(e, server)}
                    className="p-1 hover:bg-blue-600/10 text-blue-400 hover:text-blue-300 rounded-lg transition cursor-pointer"
                    title="Live UDP Protocol Ping (GameDig)"
                  >
                    <Radio className={`w-3.5 h-3.5 ${queryingId === server.id ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                <div className="flex items-center space-x-2">
                  {server.status === 'RUNNING' ? (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleStatus(server.id, 'RESTART');
                        }}
                        className="p-2 text-slate-400 hover:text-blue-300 hover:bg-[#161922] rounded-xl transition cursor-pointer border border-transparent hover:border-white/5"
                        title="Restart Container"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleStatus(server.id, 'STOP');
                        }}
                        className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition cursor-pointer border border-transparent hover:border-rose-500/20"
                        title="Stop Container"
                      >
                        <Square className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleStatus(server.id, 'START');
                      }}
                      className="p-2 text-emerald-400 hover:bg-emerald-500/10 rounded-xl transition cursor-pointer border border-transparent hover:border-emerald-500/20"
                      title="Start Container"
                    >
                      <Play className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <span className="px-3.5 py-1.5 bg-blue-600/10 text-blue-400 border border-blue-500/20 rounded-xl text-xs font-bold group-hover:bg-blue-600 group-hover:text-white transition shadow-[0_0_10px_rgba(37,99,235,0.1)]">
                    Manage →
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
