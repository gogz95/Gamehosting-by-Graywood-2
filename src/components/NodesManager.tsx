import React, { useState, useEffect } from 'react';
import { 
  HardDrive, 
  Cpu, 
  Server, 
  Plus, 
  ShieldCheck, 
  CheckCircle2, 
  Terminal, 
  Globe, 
  Trash2, 
  X, 
  Layers, 
  Zap, 
  Info, 
  Network,
  Radio,
  Copy,
  Check,
  ExternalLink,
  Activity,
  Boxes
} from 'lucide-react';
import { HostNode } from '../types';

interface NodesManagerProps {
  hostNodes: HostNode[];
  onAddNode: (newNode: HostNode) => void;
  onDeleteNode?: (nodeId: string) => void;
}

export const NodesManager: React.FC<NodesManagerProps> = ({ hostNodes, onAddNode, onDeleteNode }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);

  // Manual Node Modal Form State
  const [nodeName, setNodeName] = useState('');
  const [ipAddress, setIpAddress] = useState('');
  const [provider, setProvider] = useState('Hetzner Cloud Dedicated AX102');
  const [location, setLocation] = useState('Frankfurt, Germany');
  const [countryCode, setCountryCode] = useState('DE');
  const [cpuModel, setCpuModel] = useState('AMD Ryzen 9 7950X 16-Core @ 4.5GHz');
  const [cpuCores, setCpuCores] = useState(16);
  const [totalRamGb, setTotalRamGb] = useState(64);
  const [totalDiskGb, setTotalDiskGb] = useState(1000);
  const [sshPort, setSshPort] = useState(22);
  const [tagsInput, setTagsInput] = useState('High RAM, NVMe Gen4, DDoS Protected');
  const [domainInput, setDomainInput] = useState('srv.playcraft.gg');

  // Connect Remote Agent Wizard State
  const [selectedAgentOS, setSelectedAgentOS] = useState<'LINUX' | 'WINDOWS' | 'DOCKER' | 'MANUAL'>('LINUX');
  const [enrollData, setEnrollData] = useState<{
    token: string;
    masterUrl: string;
    curlCommand: string;
    powershellCommand: string;
    dockerCommand: string;
    manualCommand: string;
  } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [enrolledNodeFound, setEnrolledNodeFound] = useState<HostNode | null>(null);

  // Fetch enrollment data when modal opens
  useEffect(() => {
    if (isConnectModalOpen) {
      setEnrolledNodeFound(null);
      fetch('/api/nodes/enroll')
        .then((res) => res.json())
        .then((data) => setEnrollData(data))
        .catch(() => {});
    }
  }, [isConnectModalOpen]);

  // Poll for newly connected agent while enrollment modal is open
  useEffect(() => {
    if (!isConnectModalOpen || !enrollData) return;

    const interval = setInterval(() => {
      fetch('/api/nodes')
        .then((res) => res.json())
        .then((data) => {
          if (data.nodes && data.nodes.length > 0) {
            const newlyConnected = data.nodes.find(
              (n: HostNode) => n.agentConnected && !hostNodes.some((h) => h.id === n.id)
            );
            if (newlyConnected) {
              setEnrolledNodeFound(newlyConnected);
              onAddNode(newlyConnected);
            }
          }
        })
        .catch(() => {});
    }, 2000);

    return () => clearInterval(interval);
  }, [isConnectModalOpen, enrollData, hostNodes, onAddNode]);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCreateNode = (e: React.FormEvent) => {
    e.preventDefault();
    const newNode: HostNode = {
      id: `node-${Date.now()}`,
      name: nodeName || `Node-${hostNodes.length + 1} (${location.split(',')[0]})`,
      ipAddress: ipAddress || `${Math.floor(Math.random() * 200 + 10)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      location: location || 'Frankfurt, Germany',
      countryCode: countryCode.toUpperCase() || 'DE',
      status: 'ONLINE',
      cpuUsagePct: Math.floor(Math.random() * 20 + 10),
      ramUsagePct: Math.floor(Math.random() * 25 + 15),
      totalRamGb: Number(totalRamGb) || 32,
      usedRamGb: Math.round((Number(totalRamGb) || 32) * 0.2 * 10) / 10,
      totalDiskGb: Number(totalDiskGb) || 512,
      usedDiskGb: Math.round((Number(totalDiskGb) || 512) * 0.15),
      dockerVersion: 'Docker v26.1.3 (API v1.45)',
      activeContainers: 0,
      provider: provider || 'Custom VPS Host',
      cpuModel: cpuModel || 'Intel Xeon Gold 8-Core',
      cpuCores: Number(cpuCores) || 8,
      sshPort: Number(sshPort) || 22,
      dockerEndpoint: `tcp://${ipAddress || '127.0.0.1'}:2375`,
      region: location.toLowerCase().includes('us') ? 'us-east-1' : 'eu-central-1',
      tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
      publicDomains: domainInput.split(',').map((d) => d.trim()).filter(Boolean),
    };

    onAddNode(newNode);
    setIsAddModalOpen(false);
    setNodeName('');
    setIpAddress('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#0F1117]/90 backdrop-blur-md border border-white/5 rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-blue-600/10 border border-blue-500/20 rounded-full text-blue-400 text-xs font-bold uppercase tracking-wider mb-2">
            <HardDrive className="w-3.5 h-3.5 text-blue-400" />
            <span>Infrastructure & Distributed Worker Cluster</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Host Node Servers</h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-400 max-w-xl leading-relaxed">
            Distribute different games across different physical nodes (Frankfurt, Virginia, home lab). Attach any remote VPS with a single command via our lightweight outbound agent.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={() => setIsConnectModalOpen(true)}
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.35)] transition cursor-pointer"
          >
            <Radio className="w-4 h-4 animate-pulse" />
            <span>+ Connect Remote Node</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center space-x-2 bg-[#161922] hover:bg-white/10 text-slate-200 border border-white/10 font-semibold text-xs px-4 py-3 rounded-xl transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Manual Node</span>
          </button>
        </div>
      </div>

      {/* Nodes Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {hostNodes.map((node) => (
          <div
            key={node.id}
            className="bg-[#0F1117]/80 backdrop-blur-md border border-white/5 hover:border-blue-500/30 rounded-3xl p-6 shadow-xl space-y-5 transition flex flex-col justify-between"
          >
            <div className="space-y-4">
              {/* Top Node Title & Status */}
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${node.agentConnected ? 'bg-emerald-400 animate-ping' : 'bg-emerald-400'}`} />
                    <h3 className="font-extrabold text-white text-lg">{node.name}</h3>
                  </div>
                  <div className="text-xs text-slate-400 font-mono">
                    {node.ipAddress} • {node.location}
                  </div>
                </div>

                <div className="flex flex-col items-end space-y-1">
                  <span className={`px-3 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider ${
                    node.agentConnected
                      ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                      : 'bg-blue-500/10 border border-blue-500/20 text-blue-400'
                  }`}>
                    {node.agentConnected ? '● Live Agent' : node.status}
                  </span>
                  {node.osType && (
                    <span className="text-[10px] font-mono text-slate-500 uppercase">
                      {node.osType}
                    </span>
                  )}
                </div>
              </div>

              {/* Hardware Specs Highlights */}
              <div className="bg-[#161922] border border-white/5 rounded-2xl p-3.5 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-300 font-medium">
                  <span className="text-slate-500 text-[11px]">Provider:</span>
                  <span className="font-bold text-white">{node.provider || 'VPS Host'}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300 font-medium">
                  <span className="text-slate-500 text-[11px]">CPU Processor:</span>
                  <span className="font-mono text-[11px] text-blue-300 truncate max-w-[190px]">{node.cpuModel || 'Multi-Core CPU'}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300 font-medium">
                  <span className="text-slate-500 text-[11px]">CPU Cores:</span>
                  <span className="font-bold text-slate-200">{node.cpuCores || 8} Cores</span>
                </div>
              </div>

              {/* Tags */}
              {node.tags && node.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {node.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-0.5 bg-blue-600/10 border border-blue-500/20 text-blue-300 rounded-md text-[10px] font-bold"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Metrics Sliders */}
              <div className="space-y-3 pt-1">
                {/* RAM Usage */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">RAM Memory Allocation</span>
                    <span className="font-bold text-blue-400 font-mono">
                      {node.usedRamGb} GB / {node.totalRamGb} GB ({node.ramUsagePct}%)
                    </span>
                  </div>
                  <div className="w-full bg-[#161922] h-2 rounded-full overflow-hidden border border-white/5">
                    <div
                      className="bg-blue-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${node.ramUsagePct}%` }}
                    />
                  </div>
                </div>

                {/* CPU Usage */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">CPU Load Utilization</span>
                    <span className="font-bold text-purple-400 font-mono">
                      {node.cpuUsagePct}%
                    </span>
                  </div>
                  <div className="w-full bg-[#161922] h-2 rounded-full overflow-hidden border border-white/5">
                    <div
                      className="bg-purple-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${node.cpuUsagePct}%` }}
                    />
                  </div>
                </div>

                {/* Disk Usage */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">NVMe Storage</span>
                    <span className="font-semibold text-slate-300 font-mono">
                      {node.usedDiskGb} GB / {node.totalDiskGb} GB
                    </span>
                  </div>
                  <div className="w-full bg-[#161922] h-2 rounded-full overflow-hidden border border-white/5">
                    <div
                      className="bg-slate-400 h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.round((node.usedDiskGb / (node.totalDiskGb || 1)) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center space-x-1.5 font-mono text-[11px]">
                <Boxes className="w-3.5 h-3.5 text-indigo-400" />
                <span>{node.activeContainers || 0} Game Containers</span>
              </div>

              {onDeleteNode && (
                <button
                  onClick={() => onDeleteNode(node.id)}
                  className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
                  title="Remove Node from Cluster"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* --------------------------------------------------------------------------- */}
      {/* Interactive 1-Click Connect Node Enrollment Wizard Modal */}
      {/* --------------------------------------------------------------------------- */}
      {isConnectModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0F1117] border border-white/10 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl space-y-6 p-6 sm:p-8 relative">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="inline-flex items-center space-x-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 text-xs font-bold uppercase tracking-wider">
                  <Radio className="w-3.5 h-3.5 animate-pulse" />
                  <span>Outbound WebSocket Enrollment</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-white">Connect Remote Worker Node</h3>
                <p className="text-xs text-slate-400 max-w-md">
                  No open inbound ports needed. Run this 1-line installer on any remote Linux VPS or Windows PC to register it instantly.
                </p>
              </div>

              <button
                onClick={() => setIsConnectModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target OS Switcher */}
            <div className="flex space-x-2 border-b border-white/10 pb-3">
              {[
                { id: 'LINUX' as const, label: 'Linux (Ubuntu/Debian/Rocky)' },
                { id: 'WINDOWS' as const, label: 'Windows Server / PC' },
                { id: 'DOCKER' as const, label: 'Docker Container' },
                { id: 'MANUAL' as const, label: 'Manual Node CLI' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedAgentOS(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    selectedAgentOS === tab.id
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Command Copy Box */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span>Run this command on your remote server:</span>
                <span className="text-slate-500 font-mono text-[11px]">Token: {enrollData?.token || 'loading...'}</span>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center justify-between font-mono text-xs text-indigo-300 gap-4">
                <code className="break-all select-all">
                  {selectedAgentOS === 'LINUX' && (enrollData?.curlCommand || 'Loading command...')}
                  {selectedAgentOS === 'WINDOWS' && (enrollData?.powershellCommand || 'Loading command...')}
                  {selectedAgentOS === 'DOCKER' && (enrollData?.dockerCommand || 'Loading command...')}
                  {selectedAgentOS === 'MANUAL' && (enrollData?.manualCommand || 'Loading command...')}
                </code>

                <button
                  onClick={() => {
                    const cmd =
                      selectedAgentOS === 'LINUX'
                        ? enrollData?.curlCommand
                        : selectedAgentOS === 'WINDOWS'
                        ? enrollData?.powershellCommand
                        : selectedAgentOS === 'DOCKER'
                        ? enrollData?.dockerCommand
                        : enrollData?.manualCommand;
                    if (cmd) handleCopy(cmd, 'agent-cmd');
                  }}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs flex items-center space-x-1.5 shrink-0 transition cursor-pointer shadow-md"
                >
                  {copiedKey === 'agent-cmd' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'agent-cmd' ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Connection Status Box */}
            {enrolledNodeFound ? (
              <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-2xl p-4 flex items-center justify-between text-xs text-emerald-300">
                <div className="flex items-center space-x-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <strong className="text-white block font-semibold">Node Successfully Enrolled!</strong>
                    <span>{enrolledNodeFound.name} ({enrolledNodeFound.cpuCores} Cores, {enrolledNodeFound.totalRamGb}GB RAM) is now active in your cluster.</span>
                  </div>
                </div>
                <button
                  onClick={() => setIsConnectModalOpen(false)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition cursor-pointer"
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="bg-[#161922] border border-white/5 rounded-2xl p-4 flex items-center space-x-3 text-xs text-slate-400">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping shrink-0" />
                <span>Listening for agent outbound connection on <code className="text-indigo-300 font-mono">/ws/nodes</code>... Run the command above on your server.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------------- */}
      {/* Manual VPS Node Registration Modal */}
      {/* --------------------------------------------------------------------------- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0F1117] border border-white/10 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-extrabold text-white">Add Pre-Configured VPS Node</h3>
                <p className="text-xs text-slate-400">Register an existing cloud server into your management inventory.</p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNode} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Node Nickname</label>
                <input
                  type="text"
                  required
                  value={nodeName}
                  onChange={(e) => setNodeName(e.target.value)}
                  placeholder="e.g. Frankfurt Dedicated 1 (Ryzen 9)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">IP Address</label>
                  <input
                    type="text"
                    required
                    value={ipAddress}
                    onChange={(e) => setIpAddress(e.target.value)}
                    placeholder="162.55.180.42"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Location</label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Frankfurt, Germany"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">RAM (GB)</label>
                  <input
                    type="number"
                    value={totalRamGb}
                    onChange={(e) => setTotalRamGb(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">CPU Cores</label>
                  <input
                    type="number"
                    value={cpuCores}
                    onChange={(e) => setCpuCores(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition cursor-pointer shadow-md"
                >
                  Save Node
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
