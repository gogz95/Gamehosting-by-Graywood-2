import React from 'react';
import { Server, Globe, Cpu, Plus, Sparkles, Network, ShieldCheck, HardDrive, Puzzle, Database, Box } from 'lucide-react';
import { HostNode } from '../types';

interface HeaderProps {
  activeTab: 'servers' | 'catalog' | 'proxies' | 'nodes' | 'mods' | 'backups' | 'ai' | 'export';
  setActiveTab: (tab: 'servers' | 'catalog' | 'proxies' | 'nodes' | 'mods' | 'backups' | 'ai' | 'export') => void;
  onOpenDeployModal: (gameId?: string) => void;
  serverCount: number;
  runningCount: number;
  hostNodes: HostNode[];
  selectedNodeId: string;
  setSelectedNodeId: (id: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenDeployModal,
  serverCount,
  runningCount,
  hostNodes,
  selectedNodeId,
  setSelectedNodeId,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Server className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                  GameHost
                </span>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full">
                  Proxy v2.5
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                1-Click Game Deployer & Subdomain Proxy Manager
              </p>
            </div>
          </div>

          {/* Node Selector & Quick Stats */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-slate-800/80 border border-slate-700/60 rounded-lg px-3 py-1.5 text-xs text-slate-300">
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-slate-400">Node:</span>
              <select
                value={selectedNodeId}
                onChange={(e) => setSelectedNodeId(e.target.value)}
                className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-slate-900 text-slate-200">
                  All Active Nodes ({hostNodes.length})
                </option>
                {hostNodes.map((node) => (
                  <option key={node.id} value={node.id} className="bg-slate-900 text-slate-200">
                    {node.name} ({node.countryCode})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-3 text-xs bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-1.5">
              <div className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-slate-300 font-medium">{runningCount}/{serverCount} Servers Online</span>
              </div>
              <span className="text-slate-600">|</span>
              <div className="flex items-center space-x-1 text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                <span>SSL Active</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => onOpenDeployModal()}
              className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold px-3.5 py-2 rounded-lg shadow-md hover:shadow-indigo-500/25 transition duration-150 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Deploy Game Server</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 overflow-x-auto py-2 border-t border-slate-800/60 scrollbar-none">
          <button
            onClick={() => setActiveTab('servers')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition cursor-pointer whitespace-nowrap ${
              activeTab === 'servers'
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Active Servers ({serverCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('catalog')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition cursor-pointer whitespace-nowrap ${
              activeTab === 'catalog'
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Game Library</span>
          </button>

          <button
            onClick={() => setActiveTab('proxies')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition cursor-pointer whitespace-nowrap ${
              activeTab === 'proxies'
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            <span>Subdomains & Reverse Proxies</span>
          </button>

          <button
            onClick={() => setActiveTab('nodes')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'nodes'
                ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Host Nodes ({hostNodes.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('mods')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'mods'
                ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Puzzle className="w-3.5 h-3.5" />
            <span>Mods & Plugins</span>
          </button>

          <button
            onClick={() => setActiveTab('backups')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'backups'
                ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Automated Backups</span>
          </button>

          <button
            onClick={() => setActiveTab('ai')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'ai'
                ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>AI Server Assistant</span>
          </button>

          <button
            onClick={() => setActiveTab('export')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'export'
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Box className="w-3.5 h-3.5 text-indigo-400" />
            <span>Executable Packager</span>
          </button>
        </div>
      </div>
    </header>
  );
};
