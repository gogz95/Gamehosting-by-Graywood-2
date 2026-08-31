import React, { useState, useEffect, useRef } from 'react';
import { 
  Puzzle, 
  Search, 
  Download, 
  Trash2, 
  ToggleLeft, 
  ToggleRight, 
  UploadCloud, 
  CheckCircle2, 
  Sparkles, 
  FileCode, 
  Globe, 
  RefreshCw, 
  Folder, 
  ExternalLink,
  Sliders,
  X,
  Zap,
  Info
} from 'lucide-react';
import { DeployedServer, ModPlugin } from '../types';

export interface ModManagerProps {
  servers: DeployedServer[];
  selectedServerId?: string;
  embedded?: boolean;
  onSelectServer?: (serverId: string) => void;
  onInstallMod: (serverId: string, mod: ModPlugin) => void;
  onUninstallMod: (serverId: string, modId: string) => void;
  onToggleMod: (serverId: string, modId: string) => void;
  onUpdateModConfig?: (serverId: string, modId: string, newConfig: string) => void;
}

// Curated Online Mod Repositories Mock Database
const MOCK_ONLINE_MOD_HUB: Record<string, ModPlugin[]> = {
  'minecraft-java': [
    {
      id: 'hub-mc-1',
      gameId: 'minecraft-java',
      name: 'Lithium (Optimization)',
      version: '0.12.1',
      author: 'CaffeineMC',
      description: 'General-purpose optimization mod for Fabric/Paper server chunk ticking, entity AI, and physics.',
      category: 'Performance',
      enabled: true,
      downloads: '14.2M',
      updatedAt: '2026-07-28',
      fileName: 'lithium-fabric-0.12.1.jar',
      fileSizeMb: 1.8,
      source: 'MOD_HUB',
      downloadUrl: 'https://modrinth.com/mod/lithium',
      configFilename: 'config/lithium.properties',
      configContent: '# Lithium Performance Tuning\nchunk_ticking.enabled=true\nentity_ai_optimization=true\nmath_fast_math=true'
    },
    {
      id: 'hub-mc-2',
      gameId: 'minecraft-java',
      name: 'LuckPerms',
      version: '5.4.102',
      author: 'Luck',
      description: 'Advanced permissions management plugin with web editor, MySQL/SQLite support, and rank hierarchies.',
      category: 'Admin',
      enabled: true,
      downloads: '18.9M',
      updatedAt: '2026-08-01',
      fileName: 'LuckPerms-Bukkit-5.4.102.jar',
      fileSizeMb: 3.2,
      source: 'MOD_HUB',
      downloadUrl: 'https://modrinth.com/plugin/luckperms',
      configFilename: 'plugins/LuckPerms/config.yml',
      configContent: 'storage-method: h2\nserver: survival-smp\nprimary-group: default'
    },
    {
      id: 'hub-mc-3',
      gameId: 'minecraft-java',
      name: 'CoreProtect',
      version: '22.2',
      author: 'PlayPro',
      description: 'Fast, efficient block logging and grief rollback inspector for server admins.',
      category: 'Admin',
      enabled: true,
      downloads: '9.4M',
      updatedAt: '2026-06-15',
      fileName: 'CoreProtect-v22.2.jar',
      fileSizeMb: 2.4,
      source: 'MOD_HUB',
      downloadUrl: 'https://spigotmc.org/resources/coreprotect.8631/'
    },
    {
      id: 'hub-mc-4',
      gameId: 'minecraft-java',
      name: 'Dynmap (Web Live Map)',
      version: '3.7.0',
      author: 'mikeprimm',
      description: 'Renders a real-time 3D web map of your Minecraft world accessible in any browser.',
      category: 'Utility',
      enabled: true,
      downloads: '11.5M',
      updatedAt: '2026-07-02',
      fileName: 'Dynmap-3.7.0-spigot.jar',
      fileSizeMb: 14.5,
      source: 'MOD_HUB'
    },
    {
      id: 'hub-mc-5',
      gameId: 'minecraft-java',
      name: 'Spark Profiler',
      version: '1.10.53',
      author: 'lucko',
      description: 'Performance profiler tool for inspecting server lag, CPU thread usage, and memory heap dumps.',
      category: 'Performance',
      enabled: true,
      downloads: '6.1M',
      updatedAt: '2026-08-05',
      fileName: 'spark-paper-1.10.53.jar',
      fileSizeMb: 2.1,
      source: 'MOD_HUB'
    }
  ],
  'valheim': [
    {
      id: 'hub-vh-1',
      gameId: 'valheim',
      name: 'ValheimPlus',
      version: '0.9.9.11',
      author: 'Grantapher',
      description: 'Comprehensive quality of life overhaul: stamina modifications, inventory sizing, build speeds, and server configs.',
      category: 'Gameplay',
      enabled: true,
      downloads: '2.8M',
      updatedAt: '2026-06-20',
      fileName: 'ValheimPlus.dll',
      fileSizeMb: 4.1,
      source: 'MOD_HUB',
      downloadUrl: 'https://valheim.thunderstore.io/package/ValheimPlus/'
    },
    {
      id: 'hub-vh-2',
      gameId: 'valheim',
      name: 'CraftFromContainers',
      version: '3.4.0',
      author: 'aedenthorn',
      description: 'Allows craft stations to pull resources directly from nearby chests automatically.',
      category: 'Utility',
      enabled: true,
      downloads: '1.9M',
      updatedAt: '2026-07-11',
      fileName: 'CraftFromContainers.dll',
      fileSizeMb: 0.8,
      source: 'MOD_HUB'
    },
    {
      id: 'hub-vh-3',
      gameId: 'valheim',
      name: 'ServerSync',
      version: '1.15.0',
      author: 'Smoothbrain',
      description: 'Enforces server configuration settings on all connecting clients to prevent cheating.',
      category: 'Core',
      enabled: true,
      downloads: '3.4M',
      updatedAt: '2026-07-29',
      fileName: 'ServerSync.dll',
      fileSizeMb: 0.5,
      source: 'MOD_HUB'
    }
  ],
  'satisfactory': [
    {
      id: 'hub-sat-1',
      gameId: 'satisfactory',
      name: 'Refined Power',
      version: '3.2.1',
      author: 'I3RO',
      description: 'Adds custom power generation: Wind Turbines, Solar Panels, Water Turbines, and Modular Reactors.',
      category: 'Gameplay',
      enabled: true,
      downloads: '850K',
      updatedAt: '2026-06-18',
      fileName: 'RefinedPower.smod',
      fileSizeMb: 12.4,
      source: 'MOD_HUB'
    },
    {
      id: 'hub-sat-2',
      gameId: 'satisfactory',
      name: 'Efficiency Checker Plus',
      version: '2.1.0',
      author: 'KittenBiting',
      description: 'Handheld tool and buildable monitor to check exact item throughput rates on conveyor belts.',
      category: 'Utility',
      enabled: true,
      downloads: '620K',
      updatedAt: '2026-07-04',
      fileName: 'EfficiencyChecker.smod',
      fileSizeMb: 3.8,
      source: 'MOD_HUB'
    }
  ]
};

export const ModManager: React.FC<ModManagerProps> = ({
  servers,
  selectedServerId: externalSelectedServerId,
  embedded = false,
  onSelectServer,
  onInstallMod,
  onUninstallMod,
  onToggleMod,
  onUpdateModConfig,
}) => {
  const [internalServerId, setInternalServerId] = useState<string>(servers[0]?.id || '');
  const activeServerId = externalSelectedServerId || internalServerId;
  const currentServer = servers.find((s) => s.id === activeServerId) || servers[0];

  const [activeTab, setActiveTab] = useState<'INSTALLED' | 'SEARCH_HUB' | 'PRELOADED_FOLDER' | 'UPLOAD'>('INSTALLED');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Self-Download Progress Modal State
  const [downloadingMod, setDownloadingMod] = useState<ModPlugin | null>(null);
  const [downloadStep, setDownloadStep] = useState<number>(0);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);

  // Live Modrinth API Hub State
  const [isLiveModrinth, setIsLiveModrinth] = useState(false);
  const [modrinthHits, setModrinthHits] = useState<any[]>([]);
  const [modrinthLoading, setModrinthLoading] = useState(false);
  const [installingSlug, setInstallingSlug] = useState<string | null>(null);

  // Config Editor Modal State
  const [editingMod, setEditingMod] = useState<ModPlugin | null>(null);
  const [modConfigText, setModConfigText] = useState<string>('');

  // Drag and drop / Custom upload state
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');

  // Timers cleanup ref
  const downloadTimerRef = useRef<NodeJS.Timeout | null>(null);
  const downloadTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (downloadTimerRef.current) clearInterval(downloadTimerRef.current);
      if (downloadTimeoutRef.current) clearTimeout(downloadTimeoutRef.current);
    };
  }, []);

  const handleServerChange = (id: string) => {
    setInternalServerId(id);
    if (onSelectServer) onSelectServer(id);
  };

  const currentServerMods = currentServer?.mods || [];
  const onlineCatalog = currentServer ? (MOCK_ONLINE_MOD_HUB[currentServer.gameId] || MOCK_ONLINE_MOD_HUB['minecraft-java'] || []) : [];

  const filteredOnlineMods = onlineCatalog.filter((m) => {
    const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) || m.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || m.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const searchModrinth = (q: string = searchTerm) => {
    setModrinthLoading(true);
    fetch(`/api/mods/modrinth/search?query=${encodeURIComponent(q || 'performance')}&game=${currentServer?.gameId || 'minecraft'}`)
      .then((res) => res.json())
      .then((data) => {
        setModrinthHits(data.hits || []);
      })
      .catch(() => {})
      .finally(() => setModrinthLoading(false));
  };

  const handleInstallFromModrinth = async (hit: any) => {
    if (!currentServer) return;
    setInstallingSlug(hit.slug);
    try {
      const res = await fetch('/api/mods/modrinth/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serverId: currentServer.id,
          projectSlug: hit.slug,
          title: hit.title
        })
      });
      const data = await res.json();
      if (data.success && data.mod) {
        onInstallMod(currentServer.id, data.mod);
      }
    } catch (e) {}
    finally {
      setInstallingSlug(null);
    }
  };

  const handleStartSelfDownload = (mod: ModPlugin) => {
    if (downloadTimerRef.current) clearInterval(downloadTimerRef.current);
    if (downloadTimeoutRef.current) clearTimeout(downloadTimeoutRef.current);

    setDownloadingMod(mod);
    setDownloadStep(1);
    setDownloadProgress(10);

    downloadTimerRef.current = setInterval(() => {
      setDownloadProgress((prev) => {
        if (prev >= 90) {
          if (downloadTimerRef.current) clearInterval(downloadTimerRef.current);
          downloadTimeoutRef.current = setTimeout(() => {
            setDownloadStep(2);
            if (currentServer) {
              onInstallMod(currentServer.id, {
                ...mod,
                id: `mod-${Date.now()}`,
                source: 'MOD_HUB'
              });
            }
            downloadTimeoutRef.current = setTimeout(() => {
              setDownloadingMod(null);
              setDownloadStep(0);
              setDownloadProgress(0);
            }, 1200);
          }, 600);
          return 100;
        }
        return prev + 20;
      });
    }, 250);
  };

  const handleSaveModConfig = () => {
    if (editingMod && currentServer) {
      if (onUpdateModConfig) {
        onUpdateModConfig(currentServer.id, editingMod.id, modConfigText);
      }
      editingMod.configContent = modConfigText;
      setEditingMod(null);
    }
  };

  const handleSimulateCustomFileUpload = () => {
    if (!uploadedFileName || !currentServer) return;
    const newMod: ModPlugin = {
      id: `custom-file-${Date.now()}`,
      gameId: currentServer.gameId,
      name: uploadedFileName.replace(/\.[^/.]+$/, ""),
      version: '1.0.0-custom',
      author: 'Self Uploaded',
      description: `Custom uploaded file (${uploadedFileName}) placed directly into server mods folder.`,
      category: 'Gameplay',
      enabled: true,
      downloads: '1',
      updatedAt: new Date().toISOString().split('T')[0],
      fileName: uploadedFileName,
      fileSizeMb: 3.5,
      source: 'FILE_UPLOAD'
    };
    onInstallMod(currentServer.id, newMod);
    setUploadedFileName('');
    setActiveTab('INSTALLED');
  };

  return (
    <div className="space-y-6">
      {/* Banner (hidden when embedded inside ServerDetailView) */}
      {!embedded && (
        <div className="bg-[#0F1117]/90 backdrop-blur-md border border-white/5 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 blur-[90px] rounded-full pointer-events-none" />
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <div className="inline-flex items-center space-x-2 px-3 py-1 bg-blue-600/10 border border-blue-500/20 rounded-full text-blue-400 text-xs font-bold uppercase tracking-wider mb-2">
                <Puzzle className="w-3.5 h-3.5 text-blue-400" />
                <span>Modding & Plugin Orchestration Hub</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Mod & Plugin Manager
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
                Self-download mods directly from online mod repositories (Modrinth, CurseForge, Thunderstore, uMod) or manage preloaded mod folders and `.jar` / `.dll` file uploads for your servers.
              </p>
            </div>

            {/* Server Selector Dropdown */}
            <div className="bg-[#161922] border border-white/10 rounded-2xl p-3.5 shadow-lg shrink-0 min-w-[260px]">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Select Game Server
              </label>
              <select
                value={activeServerId}
                onChange={(e) => handleServerChange(e.target.value)}
                className="w-full bg-[#0F1117] text-white text-xs font-bold py-2 px-3 rounded-xl border border-white/10 focus:outline-none focus:border-blue-500 transition cursor-pointer"
              >
                {servers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.gameName})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div className="flex items-center space-x-2 bg-[#0F1117] p-1.5 border border-white/5 rounded-2xl overflow-x-auto">
          <button
            onClick={() => setActiveTab('INSTALLED')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'INSTALLED'
                ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Puzzle className="w-3.5 h-3.5" />
            <span>Installed Mods ({currentServerMods.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('SEARCH_HUB')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'SEARCH_HUB'
                ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Online Mod Repository</span>
          </button>

          <button
            onClick={() => setActiveTab('PRELOADED_FOLDER')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'PRELOADED_FOLDER'
                ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Folder className="w-3.5 h-3.5" />
            <span>Preloaded Server Mods</span>
          </button>

          <button
            onClick={() => setActiveTab('UPLOAD')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'UPLOAD'
                ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Upload File</span>
          </button>
        </div>

        <div className="text-xs font-mono text-slate-400 flex items-center space-x-2">
          <Folder className="w-3.5 h-3.5 text-blue-400" />
          <span>Server Path: <code className="text-blue-300 bg-[#161922] px-2 py-0.5 rounded-lg border border-white/5">/home/docker/containers/{currentServer?.id}/mods</code></span>
        </div>
      </div>

      {/* TAB 1: INSTALLED MODS */}
      {activeTab === 'INSTALLED' && (
        <div className="space-y-4">
          {currentServerMods.length === 0 ? (
            <div className="bg-[#0F1117]/80 border border-white/5 rounded-3xl p-12 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto">
                <Puzzle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">No Mods Installed</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  There are currently no active mods or plugins installed on <span className="text-white font-semibold">{currentServer?.name}</span>. Browse the Online Mod Repository or preloaded folder to self-download mods.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('SEARCH_HUB')}
                className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-[0_0_15px_rgba(37,99,235,0.3)] transition cursor-pointer"
              >
                <Globe className="w-4 h-4" />
                <span>Browse Online Mod Repository</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentServerMods.map((mod) => (
                <div
                  key={mod.id}
                  className="bg-[#0F1117]/80 backdrop-blur-md border border-white/5 hover:border-white/10 rounded-2xl p-5 shadow-xl transition space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-extrabold text-white text-base">{mod.name}</h4>
                          <span className="text-[10px] font-mono font-bold bg-[#161922] text-blue-400 px-2 py-0.5 rounded-md border border-white/5">
                            v{mod.version}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-medium">By {mod.author}</span>
                      </div>

                      <button
                        onClick={() => onToggleMod(currentServer.id, mod.id)}
                        className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-[10px] font-bold cursor-pointer transition ${
                          mod.enabled
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20'
                        }`}
                      >
                        {mod.enabled ? <ToggleRight className="w-4 h-4 text-emerald-400" /> : <ToggleLeft className="w-4 h-4 text-amber-400" />}
                        <span>{mod.enabled ? 'Enabled' : 'Disabled'}</span>
                      </button>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                      {mod.description}
                    </p>

                    <div className="flex flex-wrap gap-2 text-[10px]">
                      <span className="px-2.5 py-1 bg-[#161922] border border-white/5 text-slate-300 rounded-lg font-bold">
                        Category: {mod.category}
                      </span>
                      {mod.fileName && (
                        <span className="px-2.5 py-1 bg-[#161922] border border-white/5 text-slate-400 rounded-lg font-mono">
                          File: {mod.fileName}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-white/5 text-xs">
                    {mod.configFilename ? (
                      <button
                        onClick={() => {
                          setEditingMod(mod);
                          setModConfigText(mod.configContent || '# Default Mod Config');
                        }}
                        className="flex items-center space-x-1.5 text-blue-400 hover:text-blue-300 font-bold cursor-pointer"
                      >
                        <FileCode className="w-3.5 h-3.5" />
                        <span>Edit Config File</span>
                      </button>
                    ) : (
                      <span className="text-slate-500 text-[11px]">No custom config required</span>
                    )}

                    <button
                      onClick={() => onUninstallMod(currentServer.id, mod.id)}
                      className="flex items-center space-x-1 text-rose-400 hover:text-rose-300 text-xs font-semibold hover:bg-rose-500/10 px-2.5 py-1 rounded-lg transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Uninstall</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ONLINE MOD REPOSITORY (SELF DOWNLOAD) */}
      {activeTab === 'SEARCH_HUB' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={isLiveModrinth ? "Search live Modrinth API (e.g. Lithium, Chunky)..." : `Search ${currentServer?.gameName} mods...`}
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    if (isLiveModrinth) searchModrinth(e.target.value);
                  }}
                  className="w-full bg-[#0F1117] border border-white/5 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/50 transition"
                />
              </div>

              <button
                onClick={() => {
                  const next = !isLiveModrinth;
                  setIsLiveModrinth(next);
                  if (next) searchModrinth();
                }}
                className={`flex items-center space-x-1.5 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  isLiveModrinth
                    ? 'bg-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                    : 'bg-[#0F1117] text-slate-400 hover:text-white border border-white/5'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                <span>{isLiveModrinth ? 'Modrinth API Active' : 'Live Modrinth Hub'}</span>
              </button>
            </div>

            {!isLiveModrinth && (
              <div className="flex items-center space-x-2 overflow-x-auto w-full sm:w-auto">
                {['ALL', 'Performance', 'Admin', 'Gameplay', 'Utility'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-blue-600 text-white'
                        : 'bg-[#0F1117] text-slate-400 hover:text-white border border-white/5'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Cards Grid */}
          {isLiveModrinth ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400 px-1 font-mono">
                <span>Modrinth REST API • Showing {modrinthHits.length} verified packages</span>
                {modrinthLoading && <span className="text-emerald-400 animate-pulse">Fetching from Modrinth...</span>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {modrinthHits.map((hit: any) => {
                  const isInstalled = currentServerMods.some((m) => m.name.toLowerCase() === hit.title.toLowerCase());
                  const isInstalling = installingSlug === hit.slug;

                  return (
                    <div
                      key={hit.project_id || hit.slug}
                      className="bg-[#0F1117]/80 backdrop-blur-md border border-white/5 hover:border-emerald-500/30 rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4 transition"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start space-x-3">
                            {hit.icon_url && (
                              <img src={hit.icon_url} alt="" className="w-10 h-10 rounded-xl bg-slate-900 border border-white/10 shrink-0" />
                            )}
                            <div>
                              <h4 className="font-extrabold text-white text-base">{hit.title}</h4>
                              <span className="text-[11px] text-slate-400">By {hit.author} • {Number(hit.downloads).toLocaleString()} downloads</span>
                            </div>
                          </div>
                          <span className="px-2.5 py-1 bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-lg uppercase tracking-wider">
                            {hit.categories?.[0] || 'Mod'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">{hit.description}</p>
                      </div>

                      <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                        <span className="text-[11px] font-mono text-slate-500">{hit.client_side === 'required' ? 'Client/Server' : 'Server-Ready'}</span>
                        <button
                          disabled={isInstalled || isInstalling}
                          onClick={() => handleInstallFromModrinth(hit)}
                          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                            isInstalled
                              ? 'bg-white/5 text-slate-500 cursor-not-allowed'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                          }`}
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>{isInstalled ? 'Installed' : isInstalling ? 'Downloading .jar...' : '1-Click Install'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredOnlineMods.map((mod) => {
                const isAlreadyInstalled = currentServerMods.some((m) => m.name.toLowerCase() === mod.name.toLowerCase());
                return (
                  <div
                    key={mod.id}
                    className="bg-[#0F1117]/80 backdrop-blur-md border border-white/5 rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4"
                  >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-extrabold text-white text-base">{mod.name}</h4>
                          <span className="text-[10px] font-mono font-bold bg-[#161922] text-blue-400 px-2 py-0.5 rounded-md border border-white/5">
                            v{mod.version}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">By {mod.author} • {mod.downloads} downloads</span>
                      </div>
                      <span className="px-2.5 py-1 bg-blue-600/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold rounded-lg uppercase tracking-wider">
                        {mod.category}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {mod.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-white/5 text-xs">
                    <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>Direct Server Auto-Download</span>
                    </div>

                    {isAlreadyInstalled ? (
                      <span className="inline-flex items-center space-x-1 px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Installed</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleStartSelfDownload(mod)}
                        className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-[0_0_15px_rgba(37,99,235,0.3)] transition cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>1-Click Self Download</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </div>
      )}

      {/* TAB 3: PRELOADED MODS */}
      {activeTab === 'PRELOADED_FOLDER' && (
        <div className="space-y-4">
          <div className="bg-[#161922] border border-white/5 rounded-2xl p-4 flex items-center space-x-3 text-xs text-slate-300">
            <Info className="w-4 h-4 text-blue-400 shrink-0" />
            <span>
              Preloaded mods are pre-bundled in the host container template for <strong className="text-white">{currentServer?.gameName}</strong> and can be loaded into your server with zero external bandwidth.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(MOCK_ONLINE_MOD_HUB['minecraft-java'] || []).map((mod) => {
              const isInstalled = currentServerMods.some((m) => m.name.toLowerCase() === mod.name.toLowerCase());
              return (
                <div
                  key={mod.id}
                  className="bg-[#0F1117]/80 border border-white/5 rounded-2xl p-5 shadow-xl flex items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-extrabold text-white text-sm">{mod.name}</h4>
                      <span className="text-[10px] text-slate-400 font-mono">({mod.fileName})</span>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-1">{mod.description}</p>
                  </div>

                  {isInstalled ? (
                    <span className="text-emerald-400 text-xs font-bold shrink-0">Active</span>
                  ) : (
                    <button
                      onClick={() => onInstallMod(currentServer.id, { ...mod, id: `preloaded-${Date.now()}` })}
                      className="bg-[#161922] hover:bg-white/10 border border-white/10 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition cursor-pointer shrink-0"
                    >
                      Load Mod
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: UPLOAD CUSTOM MOD FILE */}
      {activeTab === 'UPLOAD' && (
        <div className="bg-[#0F1117]/80 border border-white/5 rounded-3xl p-8 space-y-6">
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <h3 className="text-xl font-extrabold text-white">Upload Custom Mod / Plugin File</h3>
            <p className="text-xs text-slate-400">
              Upload custom <code className="text-blue-300 bg-[#161922] px-1.5 py-0.5 rounded">.jar</code>, <code className="text-blue-300 bg-[#161922] px-1.5 py-0.5 rounded">.dll</code>, <code className="text-blue-300 bg-[#161922] px-1.5 py-0.5 rounded">.zip</code>, or <code className="text-blue-300 bg-[#161922] px-1.5 py-0.5 rounded">.pak</code> files directly into the container's mod folder for {currentServer?.name}.
            </p>
          </div>

          <div className="max-w-xl mx-auto space-y-4">
            <div className="border-2 border-dashed border-white/10 hover:border-blue-500/50 rounded-2xl p-8 text-center bg-[#161922]/50 transition space-y-3 cursor-pointer">
              <UploadCloud className="w-10 h-10 text-blue-400 mx-auto" />
              <div>
                <p className="text-sm font-bold text-white">Drag & drop mod files here</p>
                <p className="text-xs text-slate-500 mt-1">Or select file from your system</p>
              </div>
              <input
                type="text"
                placeholder="Simulate filename (e.g. MyCustomMod.jar)"
                value={uploadedFileName}
                onChange={(e) => setUploadedFileName(e.target.value)}
                className="w-full bg-[#0F1117] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 text-center focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              disabled={!uploadedFileName}
              onClick={handleSimulateCustomFileUpload}
              className={`w-full py-3 rounded-xl font-bold text-xs transition cursor-pointer ${
                uploadedFileName
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.35)]'
                  : 'bg-white/5 text-slate-600 cursor-not-allowed'
              }`}
            >
              Upload to Server /mods Folder
            </button>
          </div>
        </div>
      )}

      {/* SELF DOWNLOAD PROGRESS MODAL */}
      {downloadingMod && (
        <div className="fixed inset-0 z-50 bg-[#0A0B10]/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0F1117] border border-white/10 rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl space-y-5 text-center">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(37,99,235,0.3)]">
              <Download className="w-6 h-6 animate-bounce" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-extrabold text-white">
                Downloading {downloadingMod.name}
              </h3>
              <p className="text-xs text-slate-400">
                Self-downloading from remote repository into container filesystem...
              </p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="w-full bg-[#161922] h-2.5 rounded-full overflow-hidden border border-white/5">
                <div
                  className="bg-blue-500 h-full rounded-full transition-all duration-200"
                  style={{ width: `${downloadProgress}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] font-mono text-slate-400">
                <span>{downloadProgress}% Completed</span>
                <span>{downloadingMod.fileName || 'binary.jar'}</span>
              </div>
            </div>

            <div className="text-xs font-mono text-blue-400 bg-[#161922] p-3 rounded-xl border border-white/5">
              {downloadStep === 1 && '-> Connecting to CDN API mirror...'}
              {downloadStep === 2 && '-> Extracting into /mods directory & restarting server thread...'}
            </div>
          </div>
        </div>
      )}

      {/* CONFIG EDITOR MODAL */}
      {editingMod && (
        <div className="fixed inset-0 z-50 bg-[#0A0B10]/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0F1117] border border-white/10 rounded-3xl p-6 w-full max-w-2xl shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center space-x-2">
                <FileCode className="w-4 h-4 text-blue-400" />
                <h3 className="font-extrabold text-white text-base">
                  Editing {editingMod.configFilename || 'mod.properties'}
                </h3>
              </div>
              <button
                onClick={() => setEditingMod(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <textarea
              rows={12}
              value={modConfigText}
              onChange={(e) => setModConfigText(e.target.value)}
              className="w-full bg-[#0A0B10] border border-white/10 rounded-2xl p-4 font-mono text-xs text-emerald-400 focus:outline-none focus:border-blue-500/50"
            />

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setEditingMod(null)}
                className="px-4 py-2 bg-[#161922] text-slate-300 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveModConfig}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-[0_0_15px_rgba(37,99,235,0.3)]"
              >
                Save Config File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
