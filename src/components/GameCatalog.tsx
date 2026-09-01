import React, { useState, useEffect } from 'react';
import { Search, Rocket, Cpu, HardDrive, ShieldCheck, Network, CheckCircle2, Gamepad2, Layers, Plus, Upload, X, FileJson, AlertCircle } from 'lucide-react';
import { GAME_TEMPLATES } from '../data/gameTemplates';
import { GameTemplate } from '../types';

interface GameCatalogProps {
  onSelectGameForDeploy: (gameTemplate: GameTemplate) => void;
}

const PTERODACTYL_EGG_PRESETS = [
  {
    name: 'Minecraft (Paper)',
    desc: 'Paper high-performance Minecraft Java server with Java 21 Yolks',
    url: 'https://raw.githubusercontent.com/parkervcp/eggs/master/game_eggs/minecraft/java/paper/egg-paper.json'
  },
  {
    name: 'Palworld Dedicated',
    desc: 'Palworld SteamCMD dedicated server with multi-core performance',
    url: 'https://raw.githubusercontent.com/parkervcp/eggs/master/game_eggs/steamcmd_servers/palworld/egg-palworld.json'
  },
  {
    name: 'Rust Dedicated',
    desc: 'Rust survival multiplayer server with Oxide mod support',
    url: 'https://raw.githubusercontent.com/parkervcp/eggs/master/game_eggs/steamcmd_servers/rust/egg-rust.json'
  },
  {
    name: 'Satisfactory Dedicated',
    desc: 'Satisfactory automation factory server with UDP proxying',
    url: 'https://raw.githubusercontent.com/parkervcp/eggs/master/game_eggs/steamcmd_servers/satisfactory/egg-satisfactory.json'
  },
  {
    name: 'Project Zomboid',
    desc: 'Hardcore isometric zombie apocalypse survival multiplayer server',
    url: 'https://raw.githubusercontent.com/parkervcp/eggs/master/game_eggs/steamcmd_servers/project_zomboid/egg-project-zomboid.json'
  },
  {
    name: 'Enshrouded',
    desc: 'Co-op voxel action-RPG server by Keen Games',
    url: 'https://raw.githubusercontent.com/parkervcp/eggs/master/game_eggs/steamcmd_servers/enshrouded/egg-enshrouded.json'
  }
];

export const GameCatalog: React.FC<GameCatalogProps> = ({ onSelectGameForDeploy }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [templates, setTemplates] = useState<GameTemplate[]>(GAME_TEMPLATES);

  // Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importMode, setImportMode] = useState<'EGG_URL' | 'JSON' | 'FORM'>('EGG_URL');
  const [eggUrlInput, setEggUrlInput] = useState('');
  const [jsonInput, setJsonInput] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick Form State
  const [formName, setFormName] = useState('');
  const [formImage, setFormImage] = useState('');
  const [formPort, setFormPort] = useState(25565);
  const [formRam, setFormRam] = useState(4);
  const [formCores, setFormCores] = useState(2);
  const [formCategory, setFormCategory] = useState<'Sandbox' | 'Survival' | 'FPS' | 'Simulation'>('Sandbox');
  const [formSubdomain, setFormSubdomain] = useState('');

  // Fetch dynamic templates from backend
  useEffect(() => {
    fetch('/api/templates')
      .then((res) => res.json())
      .then((data) => {
        if (data.templates && Array.isArray(data.templates) && data.templates.length > 0) {
          setTemplates(data.templates);
        }
      })
      .catch(() => {});
  }, []);

  const categories = ['All', 'Sandbox', 'Survival', 'FPS', 'Simulation'];

  const filteredGames = templates.filter((game) => {
    const matchesSearch =
      game.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      game.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      game.features.some((f) => f.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = selectedCategory === 'All' || game.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleImportEggUrl = async (urlToFetch?: string) => {
    const targetUrl = (urlToFetch || eggUrlInput).trim();
    setImportError(null);
    if (!targetUrl) {
      setImportError('Please enter a valid GitHub or HTTP URL to a Pterodactyl egg JSON.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/templates/import-egg-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl })
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to import egg');
      }

      if (data.template) {
        setTemplates((prev) => [data.template, ...prev]);
        setIsImportModalOpen(false);
        setEggUrlInput('');
      }
    } catch (err: any) {
      setImportError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImportJson = async () => {
    setImportError(null);
    if (!jsonInput.trim()) {
      setImportError('Please enter valid JSON or Pterodactyl egg definition.');
      return;
    }

    try {
      const parsed = JSON.parse(jsonInput);
      setIsSubmitting(true);

      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed)
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to import template');
      }

      if (data.template) {
        setTemplates((prev) => [data.template, ...prev]);
        setIsImportModalOpen(false);
        setJsonInput('');
      }
    } catch (err: any) {
      setImportError(err.message || 'Invalid JSON format');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setImportError(null);
    if (!formName || !formImage) {
      setImportError('Server Name and Docker Image are required.');
      return;
    }

    const newTemplate: GameTemplate = {
      id: `custom-${formName.toLowerCase().replace(/[^a-z0-9-]/g, '-')}-${Date.now().toString(36)}`,
      name: formName,
      gameKey: formName.toLowerCase().replace(/[^a-z0-9]/g, ''),
      category: formCategory,
      description: `Custom OCI Container deployment for ${formName}`,
      icon: 'Gamepad2',
      banner: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
      defaultPort: Number(formPort) || 25565,
      protocol: 'TCP',
      defaultRamGb: Number(formRam) || 4,
      minRamGb: 2,
      defaultCpuCores: Number(formCores) || 2,
      dockerImage: formImage,
      proxyTypeDefault: 'NGINX',
      recommendedSubdomainPrefix: formSubdomain || formName.toLowerCase().slice(0, 5),
      configFiles: [
        {
          filename: 'server.properties',
          description: 'Primary configuration',
          defaultContent: '# Custom Server Configuration\n'
        }
      ],
      defaultEnvVars: {},
      features: ['Custom Container', 'Persistent NVMe Mount', 'Subdomain Proxy']
    };

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTemplate)
      });
      const data = await res.json();
      if (data.template) {
        setTemplates((prev) => [data.template, ...prev]);
        setIsImportModalOpen(false);
        setFormName('');
        setFormImage('');
      }
    } catch (err: any) {
      setImportError(err.message || 'Failed to save custom template');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#0F1117]/90 backdrop-blur-md border border-white/5 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/5 blur-[90px] rounded-full pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-blue-600/10 border border-blue-500/20 rounded-full text-blue-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Rocket className="w-3.5 h-3.5 text-blue-400" />
              <span>Automated Container & Subdomain Proxying</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Game Server Catalog & Egg Hub
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Deploy dedicated instances for Minecraft, Satisfactory, Valheim, Palworld, Rust, or import custom Pterodactyl Eggs.
              Every launch includes automated Docker container setup, persistent NVMe storage, and instant subdomain proxy routing.
            </p>
          </div>

          <div className="shrink-0">
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center space-x-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl font-bold text-xs shadow-lg shadow-blue-500/20 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Import Custom Egg / Game</span>
            </button>
          </div>
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

      {/* Import / Custom Egg Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="bg-[#0F1117] border border-white/10 rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-blue-600/20 text-blue-400 rounded-xl">
                  <FileJson className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Import Custom Game Template / Egg</h3>
                  <p className="text-xs text-slate-400">Pterodactyl Egg compatible JSON or Quick Container Creator</p>
                </div>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Switcher */}
            <div className="flex bg-[#161922] p-1 rounded-xl border border-white/5 gap-1">
              <button
                onClick={() => setImportMode('EGG_URL')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                  importMode === 'EGG_URL' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                1-Click Egg Presets / URL
              </button>
              <button
                onClick={() => setImportMode('JSON')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                  importMode === 'JSON' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Raw Egg JSON
              </button>
              <button
                onClick={() => setImportMode('FORM')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                  importMode === 'FORM' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Custom Container
              </button>
            </div>

            {importError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{importError}</span>
              </div>
            )}

            {importMode === 'EGG_URL' ? (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Pterodactyl Egg GitHub / Raw URL</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={eggUrlInput}
                      onChange={(e) => setEggUrlInput(e.target.value)}
                      placeholder="https://raw.githubusercontent.com/parkervcp/eggs/master/..."
                      className="flex-1 bg-[#161922] border border-white/10 rounded-xl px-3 py-2 text-xs text-indigo-300 font-mono focus:outline-none focus:border-blue-500/50"
                    />
                    <button
                      onClick={() => handleImportEggUrl()}
                      disabled={isSubmitting}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/20 transition disabled:opacity-50"
                    >
                      {isSubmitting ? 'Fetching...' : 'Import'}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Or select a community Egg preset (parkervcp/eggs):
                  </span>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    {PTERODACTYL_EGG_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleImportEggUrl(preset.url)}
                        disabled={isSubmitting}
                        className="text-left p-2.5 bg-[#161922] hover:bg-blue-600/10 hover:border-blue-500/30 border border-white/5 rounded-xl transition cursor-pointer group"
                      >
                        <div className="font-bold text-xs text-white group-hover:text-blue-300 transition">
                          {preset.name}
                        </div>
                        <div className="text-[10px] text-slate-400 line-clamp-2 mt-0.5">
                          {preset.desc}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : importMode === 'JSON' ? (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Paste Egg JSON Specification</label>
                  <textarea
                    rows={8}
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                    placeholder={`{\n  "meta": { "version": "PTDL_v2" },\n  "name": "Minecraft Paper",\n  "docker_images": { "latest": "ghcr.io/pterodactyl/yolks:java_17" },\n  "variables": []\n}`}
                    className="w-full bg-[#161922] border border-white/10 rounded-xl p-3 font-mono text-xs text-indigo-300 focus:outline-none focus:border-blue-500/50"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    onClick={() => setIsImportModalOpen(false)}
                    className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleImportJson}
                    disabled={isSubmitting}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/20 transition disabled:opacity-50"
                  >
                    {isSubmitting ? 'Importing...' : 'Import Template'}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleQuickCreate} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400">Server Display Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Enshrouded Dedicated"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full bg-[#161922] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400">Docker Image</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. steamcmd/enshrouded:latest"
                      value={formImage}
                      onChange={(e) => setFormImage(e.target.value)}
                      className="w-full bg-[#161922] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400">Default Port</label>
                    <input
                      type="number"
                      value={formPort}
                      onChange={(e) => setFormPort(parseInt(e.target.value, 10))}
                      className="w-full bg-[#161922] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400">Rec. RAM (GB)</label>
                    <input
                      type="number"
                      value={formRam}
                      onChange={(e) => setFormRam(parseInt(e.target.value, 10))}
                      className="w-full bg-[#161922] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400">CPU Cores</label>
                    <input
                      type="number"
                      value={formCores}
                      onChange={(e) => setFormCores(parseInt(e.target.value, 10))}
                      className="w-full bg-[#161922] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400">Category</label>
                    <select
                      value={formCategory}
                      onChange={(e: any) => setFormCategory(e.target.value)}
                      className="w-full bg-[#161922] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200"
                    >
                      <option value="Sandbox">Sandbox</option>
                      <option value="Survival">Survival</option>
                      <option value="FPS">FPS</option>
                      <option value="Simulation">Simulation</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400">Subdomain Prefix</label>
                    <input
                      type="text"
                      placeholder="e.g. enshrouded"
                      value={formSubdomain}
                      onChange={(e) => setFormSubdomain(e.target.value)}
                      className="w-full bg-[#161922] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsImportModalOpen(false)}
                    className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/20 transition disabled:opacity-50"
                  >
                    {isSubmitting ? 'Creating...' : 'Save Game Template'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
