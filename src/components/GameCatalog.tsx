import React, { useState } from 'react';
import { Search, Rocket, Cpu, HardDrive, ShieldCheck, Network, CheckCircle2, Gamepad2, Layers } from 'lucide-react';
import { GAME_TEMPLATES } from '../data/gameTemplates';
import { GameTemplate } from '../types';

interface GameCatalogProps {
  onSelectGameForDeploy: (gameTemplate: GameTemplate) => void;
}

export const GameCatalog: React.FC<GameCatalogProps> = ({ onSelectGameForDeploy }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'Sandbox', 'Survival', 'FPS', 'Simulation'];

  const filteredGames = GAME_TEMPLATES.filter((game) => {
    const matchesSearch =
      game.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      game.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      game.features.some((f) => f.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = selectedCategory === 'All' || game.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#0F1117]/90 backdrop-blur-md border border-white/5 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/5 blur-[90px] rounded-full pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-blue-600/10 border border-blue-500/20 rounded-full text-blue-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Rocket className="w-3.5 h-3.5 text-blue-400" />
            <span>Automated Container & Subdomain Proxying</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Game Server Catalog
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Deploy dedicated instances for Minecraft, Satisfactory, Valheim, Palworld, Rust, and more.
            Every launch includes automated Docker container setup, port mapping, and instant subdomain proxy routing (e.g., <code className="text-blue-300 bg-[#161922] px-2 py-0.5 rounded-lg border border-white/5 font-mono text-xs">mc.nexus-node.io</code>).
          </p>
        </div>
      </div>

      {/* Controls Bar: Search & Category Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Category Tabs */}
        <div className="flex items-center space-x-1.5 bg-[#0F1117] p-1.5 border border-white/5 rounded-2xl overflow-x-auto w-full sm:w-auto scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search game servers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0F1117] border border-white/5 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/50 transition"
          />
        </div>
      </div>

      {/* Game Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGames.map((game) => (
          <div
            key={game.id}
            className="group bg-[#0F1117]/80 backdrop-blur-md border border-white/5 hover:border-blue-500/40 rounded-3xl overflow-hidden shadow-xl transition-all duration-200 flex flex-col justify-between"
          >
            <div>
              {/* Card Banner Image */}
              <div className="relative h-44 overflow-hidden bg-[#161922]">
                <img
                  src={game.banner}
                  alt={game.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0F1117] via-[#0F1117]/40 to-transparent" />
                
                {/* Category Badge */}
                <div className="absolute top-3 left-3 flex items-center space-x-2">
                  <span className="px-3 py-1 bg-[#0F1117]/80 backdrop-blur-md border border-white/10 rounded-full text-[10px] font-bold text-slate-200">
                    {game.category}
                  </span>
                  <span className="px-2 py-0.5 bg-blue-600/80 text-white rounded-md text-[10px] font-mono font-bold uppercase tracking-wider">
                    {game.protocol}
                  </span>
                </div>

                {/* Subdomain Preview Badge */}
                <div className="absolute top-3 right-3 bg-[#0F1117]/90 border border-blue-500/30 rounded-xl px-3 py-1 text-[11px] font-mono text-blue-300 flex items-center space-x-1.5 shadow-lg backdrop-blur-md">
                  <Network className="w-3.5 h-3.5 text-blue-400" />
                  <span>{game.recommendedSubdomainPrefix}.domain.com</span>
                </div>

                <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                  <h3 className="text-xl font-extrabold text-white group-hover:text-blue-300 transition">
                    {game.name}
                  </h3>
                </div>
              </div>

              {/* Card Content */}
              <div className="p-6 space-y-4">
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {game.description}
                </p>

                {/* Hardware Specs Grid */}
                <div className="grid grid-cols-3 gap-2 py-2.5 px-3 bg-[#161922] border border-white/5 rounded-2xl text-xs">
                  <div className="flex flex-col items-center text-center">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Rec. RAM</span>
                    <span className="font-semibold text-slate-200 mt-0.5">{game.defaultRamGb} GB</span>
                  </div>
                  <div className="flex flex-col items-center text-center border-x border-white/5">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">CPU Cores</span>
                    <span className="font-semibold text-slate-200 mt-0.5">{game.defaultCpuCores} Cores</span>
                  </div>
                  <div className="flex flex-col items-center text-center">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Default Port</span>
                    <span className="font-mono font-bold text-blue-400 mt-0.5">{game.defaultPort}</span>
                  </div>
                </div>

                {/* Features List */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Included Features
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {game.features.map((feature, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center space-x-1 text-[11px] bg-[#161922] border border-white/5 text-slate-300 px-2.5 py-1 rounded-xl"
                      >
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span>{feature}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Deploy Button */}
            <div className="p-6 pt-0">
              <button
                onClick={() => onSelectGameForDeploy(game)}
                className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-xs py-3 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.3)] transition duration-150 cursor-pointer"
              >
                <Rocket className="w-4 h-4" />
                <span>One-Click Deploy</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
