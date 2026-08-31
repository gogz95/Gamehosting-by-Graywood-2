import React, { useState, useEffect } from 'react';
import { X, Rocket, Server, Network, ShieldCheck, CheckCircle2, Cpu, HardDrive, Lock, Terminal, ArrowRight, ArrowLeft, RefreshCw, Copy, Check } from 'lucide-react';
import { GAME_TEMPLATES } from '../data/gameTemplates';
import { GameTemplate, HostNode, ProxyEngine, DeployedServer } from '../types';

interface DeployModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedGameTemplate?: GameTemplate | null;
  hostNodes: HostNode[];
  onServerDeployed: (newServer: DeployedServer) => void;
}

export const DeployModal: React.FC<DeployModalProps> = ({
  isOpen,
  onClose,
  preselectedGameTemplate,
  hostNodes,
  onServerDeployed,
}) => {
  const [step, setStep] = useState<number>(1);
  const [selectedGame, setSelectedGame] = useState<GameTemplate>(
    preselectedGameTemplate || GAME_TEMPLATES[0]
  );

  // Form State
  const [serverName, setServerName] = useState('');
  const [selectedNodeId, setSelectedNodeId] = useState(hostNodes[0]?.id || 'node-eu-1');
  const [ramAllocatedGb, setRamAllocatedGb] = useState(4);
  const [cpuAllocatedCores, setCpuAllocatedCores] = useState(2);
  const [diskAllocatedGb, setDiskAllocatedGb] = useState(20);

  // Subdomain & Proxy State
  const [subdomain, setSubdomain] = useState('');
  const [baseDomain, setBaseDomain] = useState('srv.playcraft.gg');
  const [proxyEngine, setProxyEngine] = useState<ProxyEngine>('NGINX');
  const [enableSsl, setEnableSsl] = useState(true);

  // Game specific variables
  const [adminPassword, setAdminPassword] = useState('AdminPass2026!');
  const [maxPlayers, setMaxPlayers] = useState(20);
  const [worldName, setWorldName] = useState('NewWorld');

  // Deployment Stream state
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentLogs, setDeploymentLogs] = useState<string[]>([]);
  const [deployProgressPct, setDeployProgressPct] = useState(0);
  const [deploymentComplete, setDeploymentComplete] = useState(false);
  const [createdServer, setCreatedServer] = useState<DeployedServer | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (preselectedGameTemplate) {
      setSelectedGame(preselectedGameTemplate);
      setServerName(`${preselectedGameTemplate.name} Server`);
      setSubdomain(preselectedGameTemplate.recommendedSubdomainPrefix);
      setRamAllocatedGb(preselectedGameTemplate.defaultRamGb);
      setCpuAllocatedCores(preselectedGameTemplate.defaultCpuCores);
      setProxyEngine(preselectedGameTemplate.proxyTypeDefault);
    }
  }, [preselectedGameTemplate]);

  if (!isOpen) return null;

  const handleGameSelect = (game: GameTemplate) => {
    setSelectedGame(game);
    setServerName(`${game.name} Server`);
    setSubdomain(game.recommendedSubdomainPrefix);
    setRamAllocatedGb(game.defaultRamGb);
    setCpuAllocatedCores(game.defaultCpuCores);
    setProxyEngine(game.proxyTypeDefault);
  };

  const handleStartDeployment = () => {
    setStep(4);
    setIsDeploying(true);
    setDeploymentLogs([]);
    setDeployProgressPct(0);

    const selectedNode = hostNodes.find((n) => n.id === selectedNodeId) || hostNodes[0];
    const fullDomain = `${subdomain}.${baseDomain}`;

    const newServer: DeployedServer = {
      id: `srv-${Date.now().toString(36)}`,
      name: serverName || `${selectedGame.name} Server`,
      gameId: selectedGame.id,
      gameName: selectedGame.name,
      status: 'RUNNING',
      nodeId: selectedNode.id,
      nodeName: selectedNode.name,
      nodeIp: selectedNode.ipAddress,
      port: selectedGame.defaultPort,
      queryPort: selectedGame.queryPort,
      rconPort: selectedGame.rconPort,
      ramAllocatedGb,
      cpuAllocatedCores,
      diskAllocatedGb,
      currentPlayers: 0,
      maxPlayers,
      playersList: [],
      uptimeSeconds: 12,
      subdomain,
      baseDomain,
      fullDomain,
      proxyEngine,
      proxyStatus: 'ACTIVE',
      proxySsl: enableSsl,
      createdAt: new Date().toISOString(),
      autoRestart: true,
      cpuUsagePct: 12,
      ramUsagePct: 24,
      envVars: {
        ...selectedGame.defaultEnvVars,
        MAX_PLAYERS: String(maxPlayers),
        WORLD_NAME: worldName,
        ADMIN_PASS: adminPassword
      },
      activeConfigFile: selectedGame.configFiles[0]?.filename || 'server.properties',
      configContent: selectedGame.configFiles[0]?.defaultContent || '',
      logs: [
        { id: '1', timestamp: new Date().toLocaleTimeString(), level: 'SYSTEM', message: `Server container initialized on node ${selectedNode.name}` },
        { id: '2', timestamp: new Date().toLocaleTimeString(), level: 'INFO', message: `Proxy stream configured: ${fullDomain} -> ${selectedNode.ipAddress}:${selectedGame.defaultPort}` }
      ],
      mods: [],
      backups: []
    };

    setCreatedServer(newServer);

    // Simulated log build stream
    const steps = [
      { text: `[1/6] Allocating container hardware resources on ${selectedNode.name}...`, delay: 600, pct: 15 },
      { text: `[2/6] Pulling OCI image "${selectedGame.dockerImage}"...`, delay: 1200, pct: 35 },
      { text: `[3/6] Generating game configs & setting max players to ${maxPlayers}...`, delay: 1800, pct: 55 },
      { text: `[4/6] Creating bridge network and binding port ${selectedGame.defaultPort} (${selectedGame.protocol})...`, delay: 2400, pct: 75 },
      { text: `[5/6] Injecting ${proxyEngine} reverse proxy rule for ${fullDomain}...`, delay: 3000, pct: 90 },
      { text: `[6/6] Let's Encrypt SSL verified. Server container running healthy!`, delay: 3600, pct: 100 }
    ];

    steps.forEach((s) => {
      setTimeout(() => {
        setDeploymentLogs((prev) => [...prev, s.text]);
        setDeployProgressPct(s.pct);
        if (s.pct === 100) {
          setIsDeploying(false);
          setDeploymentComplete(true);
          onServerDeployed(newServer);
        }
      }, s.delay);
    });
  };

  const copyDomain = () => {
    if (createdServer) {
      navigator.clipboard.writeText(`${createdServer.fullDomain}:${createdServer.port}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0A0B10]/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#0F1117] border border-white/10 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 bg-[#0F1117]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-[0_0_15px_rgba(37,99,235,0.3)]">
              <Rocket className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-lg">
                1-Click Game Deployment
              </h3>
              <p className="text-xs text-slate-400">
                Step {step} of 4: {step === 1 ? 'Game & Hardware' : step === 2 ? 'Subdomain & Reverse Proxy' : step === 3 ? 'Game Settings' : 'Container Deployment'}
              </p>
            </div>
          </div>
          {!isDeploying && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/5 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6 flex-1 overflow-y-auto max-h-[70vh]">
          {/* Step Indicators */}
          <div className="grid grid-cols-4 gap-2 mb-2">
            {['1. Hardware', '2. Subdomain & Proxy', '3. Config', '4. Deploy'].map((label, idx) => (
              <div
                key={idx}
                className={`py-2 px-3 text-center rounded-xl text-xs font-bold border transition ${
                  step === idx + 1
                    ? 'bg-blue-600/20 text-blue-400 border-blue-500/40 shadow-[0_0_10px_rgba(37,99,235,0.2)]'
                    : step > idx + 1
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-[#161922] text-slate-500 border-white/5'
                }`}
              >
                {label}
              </div>
            ))}
          </div>

          {/* STEP 1: Game & Hardware Selection */}
          {step === 1 && (
            <div className="space-y-5">
              {/* Select Game Template */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Select Game Server Template
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {GAME_TEMPLATES.map((gt) => (
                    <button
                      key={gt.id}
                      type="button"
                      onClick={() => handleGameSelect(gt)}
                      className={`p-3 rounded-xl border text-left flex flex-col justify-between transition cursor-pointer ${
                        selectedGame.id === gt.id
                          ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <div className="font-bold text-xs">{gt.name}</div>
                      <div className="mt-2 text-[10px] text-slate-400 font-mono">
                        Port {gt.defaultPort} ({gt.protocol})
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Server Name Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Server Instance Name
                </label>
                <input
                  type="text"
                  value={serverName}
                  onChange={(e) => setServerName(e.target.value)}
                  placeholder="e.g. My Survival SMP"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Host Node Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Target Host Node (VPS / Dedicated Machine)
                </label>
                <select
                  value={selectedNodeId}
                  onChange={(e) => setSelectedNodeId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  {hostNodes.map((node) => (
                    <option key={node.id} value={node.id}>
                      {node.name} — {node.location} ({node.ipAddress})
                    </option>
                  ))}
                </select>
              </div>

              {/* Resource Sliders (RAM, CPU, Disk) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-medium">RAM Allocated</span>
                    <span className="font-bold text-indigo-400">{ramAllocatedGb} GB</span>
                  </div>
                  <input
                    type="range"
                    min={selectedGame.minRamGb}
                    max={32}
                    step={1}
                    value={ramAllocatedGb}
                    onChange={(e) => setRamAllocatedGb(Number(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                  <div className="text-[10px] text-slate-500">Min: {selectedGame.minRamGb}GB</div>
                </div>

                <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-medium">CPU Cores</span>
                    <span className="font-bold text-indigo-400">{cpuAllocatedCores} Cores</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={12}
                    step={1}
                    value={cpuAllocatedCores}
                    onChange={(e) => setCpuAllocatedCores(Number(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                  <div className="text-[10px] text-slate-500">Rec: {selectedGame.defaultCpuCores} Cores</div>
                </div>

                <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-medium">Disk Storage</span>
                    <span className="font-bold text-indigo-400">{diskAllocatedGb} GB</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={200}
                    step={5}
                    value={diskAllocatedGb}
                    onChange={(e) => setDiskAllocatedGb(Number(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                  <div className="text-[10px] text-slate-500">NVMe High-Speed SSD</div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Subdomain & Reverse Proxy Settings */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="bg-indigo-950/30 border border-indigo-500/20 rounded-xl p-4 text-xs text-slate-300 flex items-start space-x-3">
                <Network className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-indigo-200">Subdomain & Proxy Routing</div>
                  <p className="mt-0.5 text-slate-400">
                    Connect players directly via your own custom subdomain without needing to share raw IP addresses or custom port numbers.
                  </p>
                </div>
              </div>

              {/* Subdomain Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Subdomain Prefix
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={subdomain}
                    onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder="e.g. mc"
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono w-40"
                  />
                  <span className="text-slate-500 font-mono">.</span>
                  <input
                    type="text"
                    value={baseDomain}
                    onChange={(e) => setBaseDomain(e.target.value)}
                    placeholder="srv.playcraft.gg"
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono flex-1"
                  />
                </div>
                <p className="text-[11px] text-indigo-300 font-mono pt-1">
                  Full connection domain: <span className="font-bold underline">{subdomain || 'prefix'}.{baseDomain}</span>
                </p>
              </div>

              {/* Proxy Engine Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Reverse Proxy Engine
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { engine: 'NGINX' as ProxyEngine, name: 'NGINX Stream', desc: 'High throughput TCP/UDP proxy' },
                    { engine: 'VELOCITY' as ProxyEngine, name: 'Velocity Proxy', desc: 'Minecraft SNI player forwarding' },
                    { engine: 'CADDY' as ProxyEngine, name: 'Caddy v2', desc: 'Automatic Let\'s Encrypt SSL' },
                    { engine: 'TRAEFIK' as ProxyEngine, name: 'Traefik v3', desc: 'Dynamic Docker container labels' },
                    { engine: 'CLOUDFLARE_TUNNEL' as ProxyEngine, name: 'Cloudflare Tunnel', desc: 'Zero-trust NAT bypass' },
                    { engine: 'PLAYIT' as ProxyEngine, name: 'Playit.gg', desc: 'CGNAT home-hosting tunnel' },
                  ].map((p) => (
                    <button
                      key={p.engine}
                      type="button"
                      onClick={() => setProxyEngine(p.engine)}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                        proxyEngine === p.engine
                          ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="font-bold text-xs">{p.name}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{p.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* SSL Toggle */}
              <div className="flex items-center justify-between p-3.5 bg-slate-950 border border-slate-800 rounded-xl">
                <div className="flex items-center space-x-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <div>
                    <div className="text-xs font-semibold text-slate-200">
                      Automated TLS / SSL Certificate
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Provision Let's Encrypt SSL certificate for web administration & WebSocket RCON ports.
                    </div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={enableSsl}
                  onChange={(e) => setEnableSsl(e.target.checked)}
                  className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* STEP 3: Game Config & Credentials */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Server Admin Password
                  </label>
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Max Player Slots
                  </label>
                  <input
                    type="number"
                    min={2}
                    max={100}
                    value={maxPlayers}
                    onChange={(e) => setMaxPlayers(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Initial World / Map Name
                </label>
                <input
                  type="text"
                  value={worldName}
                  onChange={(e) => setWorldName(e.target.value)}
                  placeholder="World_Main"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Summary box before deployment */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2 text-xs">
                <div className="font-semibold text-slate-200 mb-2">Deployment Summary</div>
                <div className="flex justify-between text-slate-400">
                  <span>Game:</span>
                  <span className="text-slate-200 font-medium">{selectedGame.name}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Connection Address:</span>
                  <span className="text-indigo-400 font-mono font-bold">{subdomain}.{baseDomain}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Hardware Allocation:</span>
                  <span className="text-slate-200">{ramAllocatedGb} GB RAM | {cpuAllocatedCores} Cores</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Proxy Engine:</span>
                  <span className="text-slate-200">{proxyEngine}</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Live Deployment Logs Stream & Ready Screen */}
          {step === 4 && (
            <div className="space-y-4">
              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium text-slate-300">
                  <span>{isDeploying ? 'Deploying Server Container...' : 'Deployment Completed Successfully!'}</span>
                  <span className="text-indigo-400 font-mono">{deployProgressPct}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full transition-all duration-300"
                    style={{ width: `${deployProgressPct}%` }}
                  />
                </div>
              </div>

              {/* Log Stream Box */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-300 h-48 overflow-y-auto space-y-1.5">
                {deploymentLogs.map((log, idx) => (
                  <div key={idx} className="flex items-start space-x-2">
                    <span className="text-emerald-400 shrink-0">›</span>
                    <span>{log}</span>
                  </div>
                ))}
                {isDeploying && (
                  <div className="flex items-center space-x-2 text-indigo-400 animate-pulse pt-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Provisioning Docker stack and binding sockets...</span>
                  </div>
                )}
              </div>

              {/* Completion Banner */}
              {deploymentComplete && createdServer && (
                <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-4 space-y-3">
                  <div className="flex items-center space-x-2 text-emerald-300 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span>Server Online & Proxy Subdomain Ready!</span>
                  </div>
                  <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-lg p-3">
                    <div>
                      <div className="text-[10px] text-slate-400">Shareable Connection Address:</div>
                      <div className="text-sm font-mono font-bold text-indigo-300">
                        {createdServer.fullDomain}
                      </div>
                    </div>
                    <button
                      onClick={copyDomain}
                      className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3 py-1.5 rounded-lg transition cursor-pointer"
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied' : 'Copy Domain'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/80">
          {step > 1 && step < 4 && !isDeploying && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-slate-200 px-3 py-2 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          )}

          {step === 1 && <div />}

          {step < 3 && (
            <button
              onClick={() => setStep(step + 1)}
              className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition cursor-pointer ml-auto"
            >
              <span>Next: {step === 1 ? 'Subdomain Setup' : 'Game Config'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {step === 3 && (
            <button
              onClick={handleStartDeployment}
              className="flex items-center space-x-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-lg transition cursor-pointer ml-auto"
            >
              <Rocket className="w-4 h-4" />
              <span>Launch & Proxy Server Now</span>
            </button>
          )}

          {step === 4 && deploymentComplete && (
            <button
              onClick={onClose}
              className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-5 py-2 rounded-xl transition cursor-pointer ml-auto"
            >
              <span>Done (Go to Dashboard)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
