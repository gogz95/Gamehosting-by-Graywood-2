import React, { useState } from 'react';
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
  Network 
} from 'lucide-react';
import { HostNode } from '../types';

interface NodesManagerProps {
  hostNodes: HostNode[];
  onAddNode: (newNode: HostNode) => void;
  onDeleteNode?: (nodeId: string) => void;
}

export const NodesManager: React.FC<NodesManagerProps> = ({ hostNodes, onAddNode, onDeleteNode }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Modal Form State
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
    // Reset defaults
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
            <span>Infrastructure & VPS Docker Host Cluster</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Host Node Servers</h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-400 max-w-xl leading-relaxed">
            Manage multi-tier VPS nodes with custom CPU, RAM, and NVMe specs. Docker daemons run on each node to host game server containers and route custom subdomains.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.35)] transition cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Connect VPS Node</span>
        </button>
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
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
                    <h3 className="font-extrabold text-white text-lg">{node.name}</h3>
                  </div>
                  <div className="text-xs text-slate-400 font-mono">
                    {node.ipAddress}:{node.sshPort || 22} • {node.location}
                  </div>
                </div>

                <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 font-bold text-[10px] uppercase tracking-wider shrink-0">
                  {node.status}
                </span>
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
                      style={{ width: `${(node.usedDiskGb / node.totalDiskGb) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Docker Details Footer */}
            <div className="pt-3 border-t border-white/5 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-mono text-[11px]">{node.dockerVersion}</span>
                <span className="font-bold text-blue-400">{node.activeContainers} Game Containers</span>
              </div>

              {onDeleteNode && hostNodes.length > 1 && (
                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => onDeleteNode(node.id)}
                    className="text-rose-400 hover:text-rose-300 text-[11px] font-semibold flex items-center space-x-1 hover:bg-rose-500/10 px-2 py-1 rounded-lg transition"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Disconnect Node</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* CONNECT VPS NODE MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0A0B10]/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0F1117] border border-white/10 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col my-8">
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 bg-[#0F1117]">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-[0_0_15px_rgba(37,99,235,0.3)]">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-lg">
                    Connect New VPS Host Node
                  </h3>
                  <p className="text-xs text-slate-400">
                    Specify custom CPU, RAM, NVMe, and SSH credentials to join this server node to the Docker proxy cluster.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/5 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNode} className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
              {/* Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Node Friendly Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Node-04 (Tokyo High-RAM)"
                    value={nodeName}
                    onChange={(e) => setNodeName(e.target.value)}
                    className="w-full bg-[#161922] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Hosting Provider / Server Tier</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hetzner Dedicated / AWS / Bare Metal"
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                    className="w-full bg-[#161922] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">IPv4 Address</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 140.82.112.4"
                    value={ipAddress}
                    onChange={(e) => setIpAddress(e.target.value)}
                    className="w-full bg-[#161922] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">SSH Port</label>
                  <input
                    type="number"
                    required
                    value={sshPort}
                    onChange={(e) => setSshPort(Number(e.target.value))}
                    className="w-full bg-[#161922] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Location</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tokyo, Japan"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-[#161922] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Specs Fields */}
              <div className="border-t border-white/5 pt-4 space-y-4">
                <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider">Custom Hardware Specifications</h4>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">CPU Model & Architecture</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AMD Ryzen 9 7950X (16 Cores / 32 Threads @ 4.5GHz)"
                    value={cpuModel}
                    onChange={(e) => setCpuModel(e.target.value)}
                    className="w-full bg-[#161922] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Total RAM (GB)</label>
                    <input
                      type="number"
                      required
                      min={4}
                      value={totalRamGb}
                      onChange={(e) => setTotalRamGb(Number(e.target.value))}
                      className="w-full bg-[#161922] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">CPU Cores</label>
                    <input
                      type="number"
                      required
                      min={2}
                      value={cpuCores}
                      onChange={(e) => setCpuCores(Number(e.target.value))}
                      className="w-full bg-[#161922] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">NVMe Storage (GB)</label>
                    <input
                      type="number"
                      required
                      min={50}
                      value={totalDiskGb}
                      onChange={(e) => setTotalDiskGb(Number(e.target.value))}
                      className="w-full bg-[#161922] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Node Tags (comma separated)</label>
                    <input
                      type="text"
                      placeholder="High RAM, NVMe Gen4, Low Latency"
                      value={tagsInput}
                      onChange={(e) => setTagsInput(e.target.value)}
                      className="w-full bg-[#161922] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Mapped Domain Endpoints</label>
                    <input
                      type="text"
                      placeholder="srv.playcraft.gg, nexus-node.io"
                      value={domainInput}
                      onChange={(e) => setDomainInput(e.target.value)}
                      className="w-full bg-[#161922] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-2.5 bg-[#161922] hover:bg-white/10 text-slate-300 font-bold text-xs rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.35)] transition"
                >
                  Connect & Provision Docker Node
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
