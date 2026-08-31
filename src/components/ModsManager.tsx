import React, { useState } from 'react';
import { Package, ToggleLeft, ToggleRight, Plus, Download, Check, Search } from 'lucide-react';
import { ModPlugin } from '../types';

interface ModsManagerProps {
  mods: ModPlugin[];
  onToggleMod: (modId: string) => void;
  onInstallMod: (newMod: ModPlugin) => void;
  gameId: string;
}

export const ModsManager: React.FC<ModsManagerProps> = ({ mods, onToggleMod, onInstallMod, gameId }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const sampleModsToBrowse: ModPlugin[] = [
    { id: 'bm-1', gameId, name: 'Dynmap', version: '3.4-beta', author: 'mikeprimm', description: 'Real-time interactive Google Maps-like web view of your Minecraft server.', category: 'World', enabled: false, downloads: '5.2M', updatedAt: '2026-06-22' },
    { id: 'bm-2', gameId, name: 'LuckPerms', version: '5.4.102', author: 'Luck', description: 'Advanced permissions plugin for ranks, groups, and nodes.', category: 'Admin', enabled: false, downloads: '8.1M', updatedAt: '2026-07-04' },
    { id: 'bm-3', gameId, name: 'ValheimPlus', version: '0.9.9', author: 'Grantapher', description: 'Comprehensive quality-of-life modifier for Valheim gameplay.', category: 'Gameplay', enabled: false, downloads: '1.4M', updatedAt: '2026-05-18' }
  ];

  return (
    <div className="space-y-6">
      {/* Active Mods List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Package className="w-4 h-4 text-indigo-400" />
            <h3 className="font-bold text-white text-sm">Installed Mods & Plugins</h3>
          </div>
          <span className="text-xs text-slate-400">{mods.length} Installed</span>
        </div>

        {mods.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 bg-slate-950/60 border border-slate-800 rounded-xl">
            No mods installed yet. Browse recommended plugins below.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {mods.map((mod) => (
              <div
                key={mod.id}
                className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-200 text-xs">{mod.name}</span>
                    <span className="px-1.5 py-0.5 bg-slate-800 text-[10px] text-slate-400 rounded font-mono">
                      v{mod.version}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{mod.description}</p>
                </div>

                <button
                  onClick={() => onToggleMod(mod.id)}
                  className="p-1 text-slate-300 hover:text-white transition cursor-pointer"
                >
                  {mod.enabled ? (
                    <ToggleRight className="w-6 h-6 text-emerald-400" />
                  ) : (
                    <ToggleLeft className="w-6 h-6 text-slate-600" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Plugin Directory */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <h3 className="font-bold text-white text-sm">Recommended Plugin Library</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {sampleModsToBrowse.map((m) => (
            <div key={m.id} className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex flex-col justify-between space-y-3">
              <div>
                <div className="font-bold text-slate-200 text-xs">{m.name}</div>
                <div className="text-[10px] text-indigo-400 font-mono mt-0.5">by {m.author}</div>
                <p className="text-[11px] text-slate-400 mt-2 line-clamp-2">{m.description}</p>
              </div>

              <button
                onClick={() => onInstallMod({ ...m, enabled: true })}
                className="w-full flex items-center justify-center space-x-1.5 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs py-1.5 rounded-lg transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Install Plugin</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
