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
  Info,
  Link,
  Star,
  Layers,
  ArrowDownCircle,
  FileArchive,
  AlertCircle
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

const THUNDERSTORE_COMMUNITIES = [
  { id: 'valheim', name: 'Valheim', gameKeyword: 'valheim' },
  { id: 'palworld', name: 'Palworld', gameKeyword: 'palworld' },
  { id: 'v-rising', name: 'V Rising', gameKeyword: 'vrising' },
  { id: 'sons-of-the-forest', name: 'Sons of the Forest', gameKeyword: 'forest' },
  { id: 'satisfactory', name: 'Satisfactory', gameKeyword: 'satisfactory' },
  { id: 'lethal-company', name: 'Lethal Company', gameKeyword: 'lethal' }
];

function detectCommunity(gameId?: string): string {
  const g = (gameId || '').toLowerCase();
  for (const c of THUNDERSTORE_COMMUNITIES) {
    if (g.includes(c.gameKeyword)) return c.id;
  }
  return 'valheim';
}

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

  // Hub Provider State
  const isMinecraft = (currentServer?.gameId || '').toLowerCase().includes('minecraft');
  const [hubSource, setHubSource] = useState<'MODRINTH' | 'THUNDERSTORE' | 'URL_INGEST'>(
    isMinecraft ? 'MODRINTH' : 'THUNDERSTORE'
  );
  const [thunderstoreCommunity, setThunderstoreCommunity] = useState<string>(detectCommunity(currentServer?.gameId));

  // Live Modrinth API State
  const [modrinthHits, setModrinthHits] = useState<any[]>([]);
  const [modrinthLoading, setModrinthLoading] = useState(false);
  const [installingSlug, setInstallingSlug] = useState<string | null>(null);

  // Live Thunderstore API State
  const [thunderstorePackages, setThunderstorePackages] = useState<any[]>([]);
  const [thunderstoreLoading, setThunderstoreLoading] = useState(false);
  const [installingTsName, setInstallingTsName] = useState<string | null>(null);

  // Universal URL & Modpack Ingestion State
  const [ingestUrl, setIngestUrl] = useState('');
  const [ingestTargetFolder, setIngestTargetFolder] = useState<'mods' | 'plugins' | 'root'>('mods');
  const [ingestAutoExtract, setIngestAutoExtract] = useState(true);
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestMessage, setIngestMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Config Editor Modal State
  const [editingMod, setEditingMod] = useState<ModPlugin | null>(null);
  const [modConfigText, setModConfigText] = useState<string>('');

  // Drag & drop real file upload
  const [dragActive, setDragActive] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync hub selection when switching servers
  useEffect(() => {
    if (currentServer) {
      const isMc = (currentServer.gameId || '').toLowerCase().includes('minecraft');
      if (isMc) {
        setHubSource('MODRINTH');
      } else {
        setHubSource('THUNDERSTORE');
        setThunderstoreCommunity(detectCommunity(currentServer.gameId));
      }
    }
  }, [currentServer?.id]);

  const handleServerChange = (id: string) => {
    setInternalServerId(id);
    if (onSelectServer) onSelectServer(id);
  };

  const currentServerMods = currentServer?.mods || [];

  // Modrinth Search
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

  // Thunderstore Search
  const searchThunderstore = (q: string = searchTerm, comm: string = thunderstoreCommunity) => {
    setThunderstoreLoading(true);
    fetch(`/api/mods/thunderstore/search?community=${encodeURIComponent(comm)}&query=${encodeURIComponent(q)}`)
      .then((res) => res.json())
      .then((data) => {
        setThunderstorePackages(data.packages || []);
      })
      .catch(() => {})
      .finally(() => setThunderstoreLoading(false));
  };

  useEffect(() => {
    if (activeTab === 'SEARCH_HUB') {
      if (hubSource === 'MODRINTH' && modrinthHits.length === 0) {
        searchModrinth();
      } else if (hubSource === 'THUNDERSTORE' && thunderstorePackages.length === 0) {
        searchThunderstore(searchTerm, thunderstoreCommunity);
      }
    }
  }, [activeTab, hubSource, thunderstoreCommunity]);

  // 1-Click Install Modrinth
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

  // 1-Click Install Thunderstore
  const handleInstallFromThunderstore = async (pkg: any) => {
    if (!currentServer || !pkg.downloadUrl) return;
    setInstallingTsName(pkg.name);
    try {
      const res = await fetch('/api/mods/thunderstore/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serverId: currentServer.id,
          downloadUrl: pkg.downloadUrl,
          name: pkg.name,
          versionNumber: pkg.versionNumber
        })
      });
      const data = await res.json();
      if (data.success && data.mod) {
        onInstallMod(currentServer.id, data.mod);
      }
    } catch (e) {}
    finally {
      setInstallingTsName(null);
    }
  };

  // Universal Direct URL & Modpack Ingest
  const handleDirectUrlIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentServer || !ingestUrl) return;

    setIsIngesting(true);
    setIngestMessage(null);

    try {
      const res = await fetch('/api/mods/url-install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serverId: currentServer.id,
          url: ingestUrl.trim(),
          targetFolder: ingestTargetFolder,
          autoExtract: ingestAutoExtract
        })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to ingest URL');
      }

      if (data.success && data.mod) {
        onInstallMod(currentServer.id, data.mod);
        setIngestMessage({
          type: 'success',
          text: `Successfully downloaded ${data.filename} (${Math.round((data.sizeBytes / (1024 * 1024)) * 10) / 10} MB)${data.extracted ? ' and extracted archive' : ''}!`
        });
        setIngestUrl('');
      }
    } catch (err: any) {
      setIngestMessage({ type: 'error', text: err.message });
    } finally {
      setIsIngesting(false);
    }
  };

  // Real Drag & Drop File Upload
  const handleFileUpload = async (file: File) => {
    if (!currentServer) return;
    setIsUploading(true);
    setUploadStatus(`Uploading ${file.name}...`);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        const res = await fetch(`/api/servers/${currentServer.id}/fs/upload`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targetDir: 'mods',
            filename: file.name,
            contentBase64: base64Data
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Upload failed');

        const newMod: ModPlugin = {
          id: `file-${Date.now().toString(36)}`,
          gameId: currentServer.gameId,
          name: file.name.replace(/\.[^/.]+$/, ''),
          version: '1.0.0',
          author: 'Uploaded File',
          description: `Custom uploaded file: ${file.name}`,
          category: 'Utility',
          enabled: true,
          downloads: '1',
          updatedAt: new Date().toISOString(),
          fileName: file.name,
          fileSizeMb: Math.round((file.size / (1024 * 1024)) * 10) / 10 || 0.5,
          source: 'FILE_UPLOAD'
        };

        onInstallMod(currentServer.id, newMod);
        setUploadStatus(`Successfully uploaded ${file.name}!`);
        setTimeout(() => setUploadStatus(null), 4000);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setUploadStatus(`Upload failed: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
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

  return (
    <div className="space-y-6">
      {/* Banner */}
      {!embedded && (
        <div className="bg-[#0F1117]/90 backdrop-blur-md border border-white/5 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 blur-[90px] rounded-full pointer-events-none" />
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <div className="inline-flex items-center space-x-2 px-3 py-1 bg-blue-600/10 border border-blue-500/20 rounded-full text-blue-400 text-xs font-bold uppercase tracking-wider mb-2">
                <Puzzle className="w-3.5 h-3.5 text-blue-400" />
                <span>Multi-Source Mod & Plugin Ingestion Hub</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Mod & Plugin Manager
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
                1-Click downloads from live online repositories (<strong>Modrinth API</strong> &amp; <strong>Thunderstore Community Hub</strong>), high-speed <strong>Direct URL &amp; Modpack Ingestion</strong>, or custom drag-and-drop file uploads for {currentServer?.name}.
              </p>
            </div>

            {/* Server Selector Dropdown */}
            <div className="bg-[#161922] border border-white/10 rounded-2xl p-3.5 shadow-lg shrink-0 min-w-[260px]">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Active Game Server
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
            <span>Direct Ingestion & Upload</span>
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
              <div className="w-16 h-16 bg-blue-600/10 border border-blue-500/20 text-blue-400 rounded-3xl flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(37,99,235,0.2)]">
                <Puzzle className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-extrabold text-white">No Mods or Plugins Installed Yet</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Browse thousands of community mods in the <strong>Online Mod Repository</strong> (Modrinth or Thunderstore) or use <strong>Direct Ingestion</strong> to paste a download URL.
                </p>
              </div>
              <div className="flex items-center justify-center space-x-3 pt-2">
                <button
                  onClick={() => setActiveTab('SEARCH_HUB')}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-[0_0_15px_rgba(37,99,235,0.3)] transition cursor-pointer flex items-center space-x-2"
                >
                  <Globe className="w-4 h-4" />
                  <span>Browse Online Repository</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentServerMods.map((mod) => (
                <div
                  key={mod.id}
                  className="bg-[#0F1117]/80 backdrop-blur-md border border-white/5 hover:border-white/10 rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4 transition"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-extrabold text-white text-base">{mod.name}</h4>
                          <span className="text-[10px] font-mono bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-slate-300">
                            v{mod.version}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400 font-mono">By {mod.author}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        mod.enabled ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {mod.enabled ? 'ENABLED' : 'DISABLED'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {mod.description}
                    </p>

                    <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-500">
                      <span className="px-2 py-0.5 bg-[#161922] rounded border border-white/5">{mod.fileName}</span>
                      <span>•</span>
                      <span>{mod.fileSizeMb} MB</span>
                      <span>•</span>
                      <span className="text-blue-400">{mod.source}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                    <button
                      onClick={() => onToggleMod(currentServer.id, mod.id)}
                      className="text-xs font-bold flex items-center space-x-1.5 text-slate-300 hover:text-white transition cursor-pointer"
                    >
                      {mod.enabled ? <ToggleRight className="w-5 h-5 text-emerald-400" /> : <ToggleLeft className="w-5 h-5 text-slate-500" />}
                      <span>{mod.enabled ? 'Active' : 'Disabled'}</span>
                    </button>

                    <div className="flex items-center space-x-1">
                      {mod.configContent && (
                        <button
                          onClick={() => {
                            setEditingMod(mod);
                            setModConfigText(mod.configContent || '');
                          }}
                          className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition cursor-pointer"
                          title="Edit Config"
                        >
                          <Sliders className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => onUninstallMod(currentServer.id, mod.id)}
                        className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition cursor-pointer"
                        title="Uninstall"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ONLINE MOD REPOSITORY (MODRINTH & THUNDERSTORE & DIRECT URL) */}
      {activeTab === 'SEARCH_HUB' && (
        <div className="space-y-6">
          {/* Hub Source Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-[#0F1117]/80 border border-white/5 p-2 rounded-2xl">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setHubSource('MODRINTH')}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  hubSource === 'MODRINTH'
                    ? 'bg-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                <span>Modrinth Hub (Minecraft)</span>
              </button>

              <button
                onClick={() => setHubSource('THUNDERSTORE')}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  hubSource === 'THUNDERSTORE'
                    ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-purple-300" />
                <span>Thunderstore Hub (Unity/BepInEx)</span>
              </button>

              <button
                onClick={() => setHubSource('URL_INGEST')}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  hubSource === 'URL_INGEST'
                    ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Link className="w-3.5 h-3.5 text-blue-300" />
                <span>Direct URL &amp; Modpack Ingestion</span>
              </button>
            </div>

            {hubSource === 'THUNDERSTORE' && (
              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-400">Community:</span>
                <select
                  value={thunderstoreCommunity}
                  onChange={(e) => {
                    setThunderstoreCommunity(e.target.value);
                    searchThunderstore(searchTerm, e.target.value);
                  }}
                  className="bg-[#161922] text-xs font-bold text-slate-200 border border-white/10 rounded-xl px-2.5 py-1.5 focus:outline-none cursor-pointer"
                >
                  {THUNDERSTORE_COMMUNITIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* VIEW A: MODRINTH HUB */}
          {hubSource === 'MODRINTH' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative flex-1 sm:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search Modrinth (e.g. Lithium, Chunky, EssentialsX, FerriteCore)..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      searchModrinth(e.target.value);
                    }}
                    className="w-full bg-[#0F1117] border border-white/5 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 transition"
                  />
                </div>
                <span className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold rounded-xl flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Modrinth REST API Live</span>
                </span>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-400 px-1 font-mono">
                  <span>Showing {modrinthHits.length} verified community packages</span>
                  {modrinthLoading && <span className="text-emerald-400 animate-pulse">Querying Modrinth...</span>}
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
                            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded-md font-mono shrink-0">
                              {hit.project_type || 'MOD'}
                            </span>
                          </div>

                          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                            {hit.description}
                          </p>

                          {hit.categories && hit.categories.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {hit.categories.slice(0, 4).map((c: string) => (
                                <span key={c} className="px-2 py-0.5 bg-white/5 text-slate-400 text-[10px] rounded-md font-mono">
                                  {c}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                          <span className="text-[11px] font-mono text-slate-500">
                            Client & Server Safe
                          </span>

                          <button
                            disabled={isInstalled || isInstalling}
                            onClick={() => handleInstallFromModrinth(hit)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer ${
                              isInstalled
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 cursor-default'
                                : isInstalling
                                ? 'bg-emerald-600/50 text-white animate-pulse'
                                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                            }`}
                          >
                            {isInstalled ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Installed</span>
                              </>
                            ) : isInstalling ? (
                              <span>Downloading...</span>
                            ) : (
                              <>
                                <Download className="w-3.5 h-3.5" />
                                <span>1-Click Install</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* VIEW B: THUNDERSTORE HUB */}
          {hubSource === 'THUNDERSTORE' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative flex-1 sm:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder={`Search ${thunderstoreCommunity} mods (e.g. BepInEx, ValheimPlus, PalGuard)...`}
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      searchThunderstore(e.target.value, thunderstoreCommunity);
                    }}
                    className="w-full bg-[#0F1117] border border-white/5 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500/50 transition"
                  />
                </div>
                <span className="px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-bold rounded-xl flex items-center space-x-1.5">
                  <Zap className="w-3.5 h-3.5 text-purple-400" />
                  <span>Thunderstore Community API</span>
                </span>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-400 px-1 font-mono">
                  <span>Showing {thunderstorePackages.length} packages for {thunderstoreCommunity}</span>
                  {thunderstoreLoading && <span className="text-purple-400 animate-pulse">Syncing Thunderstore Packages...</span>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {thunderstorePackages.map((pkg: any) => {
                    const isInstalled = currentServerMods.some((m) => m.name.toLowerCase() === pkg.name.toLowerCase());
                    const isInstalling = installingTsName === pkg.name;

                    return (
                      <div
                        key={pkg.uuid4 || pkg.fullName}
                        className="bg-[#0F1117]/80 backdrop-blur-md border border-white/5 hover:border-purple-500/30 rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4 transition"
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start space-x-3">
                              {pkg.icon && (
                                <img src={pkg.icon} alt="" className="w-10 h-10 rounded-xl bg-slate-900 border border-white/10 shrink-0" />
                              )}
                              <div>
                                <h4 className="font-extrabold text-white text-base">{pkg.name}</h4>
                                <span className="text-[11px] text-slate-400">By {pkg.owner} • {Number(pkg.downloads).toLocaleString()} downloads</span>
                              </div>
                            </div>
                            <span className="px-2 py-0.5 bg-purple-500/10 text-purple-300 text-[10px] font-bold rounded-md font-mono shrink-0">
                              v{pkg.versionNumber}
                            </span>
                          </div>

                          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                            {pkg.description}
                          </p>

                          {pkg.categories && pkg.categories.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {pkg.categories.slice(0, 4).map((c: string) => (
                                <span key={c} className="px-2 py-0.5 bg-white/5 text-slate-400 text-[10px] rounded-md font-mono">
                                  {c}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                          <div className="flex items-center space-x-2 text-[11px] font-mono text-slate-500">
                            <span className="flex items-center space-x-1 text-amber-400">
                              <Star className="w-3 h-3 fill-amber-400" />
                              <span>{pkg.ratingScore || 0}</span>
                            </span>
                            <span>•</span>
                            <span>BepInEx Ready</span>
                          </div>

                          <button
                            disabled={isInstalled || isInstalling}
                            onClick={() => handleInstallFromThunderstore(pkg)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer ${
                              isInstalled
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 cursor-default'
                                : isInstalling
                                ? 'bg-purple-600/50 text-white animate-pulse'
                                : 'bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                            }`}
                          >
                            {isInstalled ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                                <span>Installed</span>
                              </>
                            ) : isInstalling ? (
                              <span>Extracting...</span>
                            ) : (
                              <>
                                <Download className="w-3.5 h-3.5" />
                                <span>1-Click Install</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* VIEW C: UNIVERSAL DIRECT URL & MODPACK INGESTION */}
          {hubSource === 'URL_INGEST' && (
            <div className="bg-[#0F1117]/80 border border-white/5 rounded-3xl p-6 sm:p-8 space-y-6">
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-blue-400">
                  <Link className="w-5 h-5" />
                  <h3 className="text-lg font-extrabold text-white">Universal Direct URL &amp; Modpack Ingestion</h3>
                </div>
                <p className="text-xs text-slate-400 max-w-2xl">
                  Stream and install any direct download link directly into this container at host datacenter speeds. Supports <code className="text-blue-300 bg-[#161922] px-1 rounded">.zip</code>, <code className="text-blue-300 bg-[#161922] px-1 rounded">.tar.gz</code>, <code className="text-blue-300 bg-[#161922] px-1 rounded">.mrpack</code>, <code className="text-blue-300 bg-[#161922] px-1 rounded">.jar</code>, or <code className="text-blue-300 bg-[#161922] px-1 rounded">.pak</code> files.
                </p>
              </div>

              {ingestMessage && (
                <div className={`p-3.5 rounded-2xl text-xs flex items-center space-x-2.5 ${
                  ingestMessage.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                }`}>
                  {ingestMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                  <span>{ingestMessage.text}</span>
                </div>
              )}

              <form onSubmit={handleDirectUrlIngest} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Direct Download URL</label>
                  <input
                    type="url"
                    required
                    value={ingestUrl}
                    onChange={(e) => setIngestUrl(e.target.value)}
                    placeholder="https://github.com/.../releases/download/v1.0/modpack.zip or https://cdn.modrinth.com/.../plugin.jar"
                    className="w-full bg-[#161922] border border-white/5 rounded-2xl px-4 py-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/50 font-mono"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Target Destination</label>
                    <select
                      value={ingestTargetFolder}
                      onChange={(e) => setIngestTargetFolder(e.target.value as any)}
                      className="w-full bg-[#161922] border border-white/5 rounded-2xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500/50 cursor-pointer"
                    >
                      <option value="mods">Mods Directory (/mods or /BepInEx/plugins)</option>
                      <option value="plugins">Plugins Directory (/plugins)</option>
                      <option value="root">Server Root Directory (/)</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-3 pt-6">
                    <input
                      type="checkbox"
                      id="autoExtract"
                      checked={ingestAutoExtract}
                      onChange={(e) => setIngestAutoExtract(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 bg-[#161922] border-white/10 cursor-pointer"
                    />
                    <label htmlFor="autoExtract" className="text-xs text-slate-300 font-medium cursor-pointer">
                      Auto-extract archives (<code className="text-blue-300 font-mono">.zip</code> / <code className="text-blue-300 font-mono">.tar.gz</code>)
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isIngesting || !ingestUrl}
                  className={`w-full py-3 rounded-2xl font-bold text-xs transition cursor-pointer flex items-center justify-center space-x-2 ${
                    isIngesting || !ingestUrl
                      ? 'bg-white/5 text-slate-500 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.35)]'
                  }`}
                >
                  <ArrowDownCircle className="w-4 h-4" />
                  <span>{isIngesting ? 'Downloading & Extracting to Server...' : 'Download & Ingest to Server'}</span>
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PRELOADED MODS */}
      {activeTab === 'PRELOADED_FOLDER' && (
        <div className="space-y-4">
          <div className="p-8 text-center bg-[#0F1117] border border-white/5 rounded-2xl text-xs text-slate-500">
            Pre-loaded image mods can be activated from the Online Mod Repository or by dropping files in the Upload &amp; Ingestion tab.
          </div>
        </div>
      )}

      {/* TAB 4: DIRECT INGESTION & REAL FILE UPLOAD */}
      {activeTab === 'UPLOAD' && (
        <div className="space-y-6">
          {/* Universal URL Ingest Bar */}
          <div className="bg-[#0F1117]/80 border border-white/5 rounded-3xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center space-x-2 text-blue-400">
              <Link className="w-5 h-5" />
              <h3 className="text-base font-extrabold text-white">1-Click Remote URL &amp; Modpack Ingestion</h3>
            </div>
            <p className="text-xs text-slate-400">
              Download modpacks, plugin archives, or direct releases without downloading them to your computer first:
            </p>

            <form onSubmit={handleDirectUrlIngest} className="flex flex-col sm:flex-row gap-3">
              <input
                type="url"
                required
                value={ingestUrl}
                onChange={(e) => setIngestUrl(e.target.value)}
                placeholder="https://.../modpack.zip or plugin.jar"
                className="flex-1 bg-[#161922] border border-white/5 rounded-2xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
              />
              <button
                type="submit"
                disabled={isIngesting || !ingestUrl}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-2xl shadow-[0_0_15px_rgba(37,99,235,0.3)] transition cursor-pointer flex items-center justify-center space-x-2 shrink-0"
              >
                <ArrowDownCircle className="w-4 h-4" />
                <span>{isIngesting ? 'Ingesting...' : 'Ingest to Server'}</span>
              </button>
            </form>
          </div>

          {/* Drag and Drop Real Upload */}
          <div className="bg-[#0F1117]/80 border border-white/5 rounded-3xl p-8 space-y-6">
            <div className="text-center space-y-2 max-w-xl mx-auto">
              <h3 className="text-xl font-extrabold text-white">Upload Custom Mod / Plugin File</h3>
              <p className="text-xs text-slate-400">
                Upload custom <code className="text-blue-300 bg-[#161922] px-1.5 py-0.5 rounded">.jar</code>, <code className="text-blue-300 bg-[#161922] px-1.5 py-0.5 rounded">.dll</code>, <code className="text-blue-300 bg-[#161922] px-1.5 py-0.5 rounded">.zip</code>, or <code className="text-blue-300 bg-[#161922] px-1.5 py-0.5 rounded">.pak</code> files directly into the container's mod folder for {currentServer?.name}.
              </p>
            </div>

            {uploadStatus && (
              <div className="max-w-xl mx-auto p-3 bg-blue-500/10 border border-blue-500/20 text-blue-300 rounded-2xl text-xs text-center">
                {uploadStatus}
              </div>
            )}

            <div className="max-w-xl mx-auto space-y-4">
              <div
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragActive(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileUpload(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center bg-[#161922]/50 transition space-y-3 cursor-pointer ${
                  dragActive ? 'border-blue-500 bg-blue-500/10' : 'border-white/10 hover:border-blue-500/50'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                />
                <UploadCloud className="w-10 h-10 text-blue-400 mx-auto" />
                <div>
                  <p className="text-sm font-bold text-white">Drag &amp; drop mod files here</p>
                  <p className="text-xs text-slate-500 mt-1">Or click to browse from your device</p>
                </div>
              </div>
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
                <FileCode className="w-5 h-5 text-blue-400" />
                <h3 className="font-extrabold text-white text-base">Configure {editingMod.name}</h3>
              </div>
              <button
                onClick={() => setEditingMod(null)}
                className="text-slate-400 hover:text-white p-1 rounded-xl"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <textarea
              value={modConfigText}
              onChange={(e) => setModConfigText(e.target.value)}
              rows={12}
              className="w-full bg-[#161922] border border-white/5 rounded-2xl p-4 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500/50"
            />

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setEditingMod(null)}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveModConfig}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-[0_0_15px_rgba(37,99,235,0.3)] cursor-pointer"
              >
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
