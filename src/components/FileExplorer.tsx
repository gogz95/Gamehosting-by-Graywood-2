import React, { useState, useEffect, useRef } from 'react';
import { 
  Folder, 
  File, 
  FileText, 
  FileCode, 
  Archive, 
  Download, 
  Trash2, 
  Upload, 
  Plus, 
  RotateCw, 
  ChevronRight, 
  FolderPlus, 
  AlertCircle, 
  CheckCircle2, 
  FileArchive, 
  Edit3, 
  Search, 
  X,
  HardDrive
} from 'lucide-react';
import { FileItem } from '../types';

interface FileExplorerProps {
  serverId: string;
  serverName: string;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({ serverId, serverName }) => {
  const [currentPath, setCurrentPath] = useState<string>('');
  const [items, setItems] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [renamingItem, setRenamingItem] = useState<FileItem | null>(null);
  const [newName, setNewName] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDirectory = (targetPath: string = currentPath) => {
    setLoading(true);
    setError(null);
    fetch(`/api/servers/${serverId}/fs?path=${encodeURIComponent(targetPath)}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load directory');
        return res.json();
      })
      .then((data) => {
        setItems(data.items || []);
        setCurrentPath(data.currentPath === '/' ? '' : data.currentPath.replace(/^\//, ''));
      })
      .catch((err: any) => {
        setError(err.message || 'Error accessing volume directory');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDirectory('');
  }, [serverId]);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleNavigate = (subpath: string) => {
    setCurrentPath(subpath);
    fetchDirectory(subpath);
  };

  const handleBreadcrumbClick = (index: number) => {
    if (index < 0) {
      handleNavigate('');
      return;
    }
    const parts = currentPath.split('/').filter(Boolean);
    const target = parts.slice(0, index + 1).join('/');
    handleNavigate(target);
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    try {
      const res = await fetch(`/api/servers/${serverId}/fs/mkdir`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetDir: currentPath, name: newFolderName.trim() })
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Failed to create folder');

      setNewFolderName('');
      setIsNewFolderOpen(false);
      showSuccess(`Created folder "${newFolderName}"`);
      fetchDirectory();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = (event.target?.result as string).split(',')[1];
      try {
        const res = await fetch(`/api/servers/${serverId}/fs/upload`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targetDir: currentPath,
            filename: file.name,
            contentBase64: base64
          })
        });
        const data = await res.json();
        if (!res.ok || data.error) throw new Error(data.error || 'Upload failed');

        setIsUploadModalOpen(false);
        showSuccess(`Uploaded ${file.name}`);
        fetchDirectory();
      } catch (err: any) {
        setError(err.message);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDelete = async (item: FileItem) => {
    if (!window.confirm(`Are you sure you want to delete ${item.name}?`)) return;

    try {
      const res = await fetch(`/api/servers/${serverId}/fs/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: item.path })
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Failed to delete');

      showSuccess(`Deleted ${item.name}`);
      fetchDirectory();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renamingItem || !newName.trim()) return;

    try {
      const res = await fetch(`/api/servers/${serverId}/fs/rename`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPath: renamingItem.path, newName: newName.trim() })
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Failed to rename');

      setRenamingItem(null);
      setNewName('');
      showSuccess(`Renamed to ${newName}`);
      fetchDirectory();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleExtract = async (item: FileItem) => {
    try {
      showSuccess(`Extracting ${item.name}...`);
      const res = await fetch(`/api/servers/${serverId}/fs/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archivePath: item.path, targetDir: currentPath })
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Extraction failed');

      showSuccess(`Extracted ${item.name} successfully`);
      fetchDirectory();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileIcon = (item: FileItem) => {
    if (item.isDir) return <Folder className="w-4 h-4 text-amber-400 fill-amber-400/20" />;
    const ext = item.ext?.toLowerCase();
    if (ext === 'zip' || ext === 'gz' || ext === 'tar') {
      return <FileArchive className="w-4 h-4 text-purple-400" />;
    }
    if (ext === 'jar' || ext === 'pak') {
      return <FileCode className="w-4 h-4 text-rose-400" />;
    }
    if (ext === 'json' || ext === 'yml' || ext === 'yaml' || ext === 'toml' || ext === 'properties' || ext === 'cfg' || ext === 'ini') {
      return <FileText className="w-4 h-4 text-indigo-400" />;
    }
    return <File className="w-4 h-4 text-slate-400" />;
  };

  const breadcrumbs = currentPath.split('/').filter(Boolean);

  const filteredItems = items.filter((i) =>
    i.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col min-h-[580px]">
      {/* Top Header & Breadcrumb Bar */}
      <div className="p-4 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-1 text-xs font-mono overflow-x-auto scrollbar-none py-1">
          <button
            onClick={() => handleBreadcrumbClick(-1)}
            className="flex items-center space-x-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-lg transition"
          >
            <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-bold">volume:/{serverName.toLowerCase().replace(/[^a-z0-9-]/g, '-')}</span>
          </button>

          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              <button
                onClick={() => handleBreadcrumbClick(idx)}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition"
              >
                {crumb}
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 w-36 sm:w-48"
            />
          </div>

          <button
            onClick={() => setIsNewFolderOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            <FolderPlus className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">New Folder</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-600/20 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload</span>
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />

          <button
            onClick={() => fetchDirectory()}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition cursor-pointer"
          >
            <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="m-4 mb-0 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="m-4 mb-0 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-300 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* File List Table */}
      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900/60 text-[10px] text-slate-400 uppercase tracking-wider font-bold border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">Name</th>
              <th className="py-3 px-4 w-28">Size</th>
              <th className="py-3 px-4 w-36 hidden sm:table-cell">Last Modified</th>
              <th className="py-3 px-4 w-32 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-900 font-mono">
            {currentPath && (
              <tr
                onClick={() => {
                  const parts = currentPath.split('/').filter(Boolean);
                  parts.pop();
                  handleNavigate(parts.join('/'));
                }}
                className="hover:bg-slate-900/40 cursor-pointer text-slate-400"
              >
                <td className="py-2.5 px-4 flex items-center space-x-2">
                  <Folder className="w-4 h-4 text-slate-500" />
                  <span>..</span>
                </td>
                <td className="py-2.5 px-4">—</td>
                <td className="py-2.5 px-4 hidden sm:table-cell">—</td>
                <td className="py-2.5 px-4 text-right"></td>
              </tr>
            )}

            {filteredItems.length === 0 && !loading && (
              <tr>
                <td colSpan={4} className="py-12 text-center text-slate-500 text-xs font-sans">
                  This folder is currently empty. Upload a file or create a directory above.
                </td>
              </tr>
            )}

            {filteredItems.map((item) => (
              <tr key={item.path} className="hover:bg-slate-900/40 transition group">
                <td className="py-2.5 px-4">
                  {item.isDir ? (
                    <button
                      onClick={() => handleNavigate(item.path)}
                      className="flex items-center space-x-2 text-slate-200 hover:text-indigo-400 font-semibold cursor-pointer"
                    >
                      {getFileIcon(item)}
                      <span>{item.name}</span>
                    </button>
                  ) : (
                    <div className="flex items-center space-x-2 text-slate-300">
                      {getFileIcon(item)}
                      <span>{item.name}</span>
                    </div>
                  )}
                </td>
                <td className="py-2.5 px-4 text-slate-400 text-[11px]">
                  {item.isDir ? '—' : formatBytes(item.size)}
                </td>
                <td className="py-2.5 px-4 text-slate-500 text-[11px] hidden sm:table-cell">
                  {new Date(item.mtime).toLocaleDateString()} {new Date(item.mtime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </td>
                <td className="py-2.5 px-4 text-right">
                  <div className="flex items-center justify-end space-x-1.5 opacity-80 group-hover:opacity-100">
                    {/* Extract Action for archives */}
                    {(item.ext === 'zip' || item.ext === 'gz' || item.ext === 'tar') && (
                      <button
                        title="Extract in place"
                        onClick={() => handleExtract(item)}
                        className="p-1 hover:bg-purple-600/20 text-purple-400 rounded-md transition cursor-pointer"
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Download Action for files */}
                    {!item.isDir && (
                      <a
                        title="Download file"
                        href={`/api/servers/${serverId}/fs/download?path=${encodeURIComponent(item.path)}`}
                        download
                        className="p-1 hover:bg-indigo-600/20 text-indigo-400 rounded-md transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    )}

                    {/* Rename */}
                    <button
                      title="Rename"
                      onClick={() => {
                        setRenamingItem(item);
                        setNewName(item.name);
                      }}
                      className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-md transition cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete */}
                    <button
                      title="Delete"
                      onClick={() => handleDelete(item)}
                      className="p-1 hover:bg-rose-600/20 text-rose-400 rounded-md transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* New Folder Modal */}
      {isNewFolderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-white text-sm">Create New Directory</h3>
              <button onClick={() => setIsNewFolderOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateFolder} className="space-y-4">
              <input
                type="text"
                autoFocus
                placeholder="Folder name (e.g. mods, plugins)"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsNewFolderOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rename Modal */}
      {renamingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-white text-sm">Rename {renamingItem.isDir ? 'Folder' : 'File'}</h3>
              <button onClick={() => setRenamingItem(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleRename} className="space-y-4">
              <input
                type="text"
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setRenamingItem(null)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl"
                >
                  Rename
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
