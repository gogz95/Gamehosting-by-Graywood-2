import React, { useState } from 'react';
import { 
  Database, 
  ShieldCheck, 
  Clock, 
  Download, 
  RotateCcw, 
  Trash2, 
  Plus, 
  HardDrive, 
  Lock, 
  Sparkles, 
  Server, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  FolderArchive, 
  Settings, 
  Key, 
  Zap, 
  Calendar,
  Layers,
  FileCheck,
  Globe,
  Sliders,
  X
} from 'lucide-react';
import { DeployedServer, BackupSnapshot, StorageBucketConfig, BackupScheduleConfig } from '../types';

interface BackupManagerProps {
  servers: DeployedServer[];
  onTakeSnapshot: (serverId: string, snapshotName: string) => void;
  onRestoreSnapshot: (serverId: string, snapshotId: string) => void;
  onDeleteSnapshot: (serverId: string, snapshotId: string) => void;
}

const INITIAL_BUCKETS: StorageBucketConfig[] = [
  {
    id: 'bucket-s3-eu',
    name: 'Primary S3 Game Vault (EU)',
    provider: 'AWS_S3',
    bucketName: 'game-saves-vault-frankfurt',
    region: 'eu-central-1',
    accessKeyId: 'AKIA3902810XPL99A',
    secretAccessKeyMasked: '••••••••••••••••••••••••••••3aF9',
    encryptionEnabled: true,
    encryptionKey: 'AES-256-GCM (KMS Rotated)',
    status: 'CONNECTED',
    totalStoredGb: 14.8
  },
  {
    id: 'bucket-hetzner',
    name: 'Hetzner Storage Box Cold Archive',
    provider: 'HETZNER_STORAGE_BOX',
    bucketName: 'bx11-backup-server-de',
    region: 'eu-central-1',
    accessKeyId: 'u319201-sub1',
    secretAccessKeyMasked: '••••••••••••••••••••••••••••92K1',
    encryptionEnabled: true,
    encryptionKey: 'AES-256-GCM',
    status: 'CONNECTED',
    totalStoredGb: 42.5
  }
];

export const BackupManager: React.FC<BackupManagerProps> = ({
  servers,
  onTakeSnapshot,
  onRestoreSnapshot,
  onDeleteSnapshot,
}) => {
  const [selectedServerId, setSelectedServerId] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'SNAPSHOTS' | 'SCHEDULE' | 'BUCKETS' | 'LOGS'>('SNAPSHOTS');
  
  // Storage Buckets state
  const [buckets, setBuckets] = useState<StorageBucketConfig[]>(INITIAL_BUCKETS);
  const [isAddBucketOpen, setIsAddBucketOpen] = useState(false);
  const [newBucketProvider, setNewBucketProvider] = useState<StorageBucketConfig['provider']>('AWS_S3');
  const [newBucketName, setNewBucketName] = useState('');
  const [newBucketRegion, setNewBucketRegion] = useState('eu-central-1');
  const [newAccessKey, setNewAccessKey] = useState('');

  // Schedule Config State per Server
  const [schedules, setSchedules] = useState<Record<string, BackupScheduleConfig>>(() => {
    const initial: Record<string, BackupScheduleConfig> = {};
    servers.forEach((s) => {
      initial[s.id] = {
        serverId: s.id,
        enabled: true,
        frequency: 'DAILY',
        timeOfDayUtc: '02:00',
        retentionDays: 14,
        compressionLevel: 'HIGH',
        includePlayerSaves: true,
        includeWorldData: true,
        includeModConfigs: true,
        encryptedBucketId: 'bucket-s3-eu',
        lastBackupAt: '2026-08-08 02:00 UTC',
        nextBackupAt: '2026-08-09 02:00 UTC'
      };
    });
    return initial;
  });

  // Manual Snapshot Modal State
  const [isSnapshotModalOpen, setIsSnapshotModalOpen] = useState(false);
  const [snapshotServerId, setSnapshotServerId] = useState<string>(servers[0]?.id || '');
  const [snapshotCustomName, setSnapshotCustomName] = useState<string>('');
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureProgress, setCaptureProgress] = useState(0);
  const [captureStage, setCaptureStage] = useState('');

  // Restore Modal State
  const [restoringSnapshot, setRestoringSnapshot] = useState<{ serverId: string; snapshot: BackupSnapshot } | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreProgress, setRestoreProgress] = useState(0);

  // Filtered Snapshots
  const allSnapshots: (BackupSnapshot & { serverName: string })[] = [];
  servers.forEach((s) => {
    (s.backups || []).forEach((b) => {
      allSnapshots.push({
        ...b,
        serverName: s.name,
        encrypted: b.encrypted ?? true,
        encryptionAlgorithm: b.encryptionAlgorithm || 'AES-256-GCM',
        bucketDestination: b.bucketDestination || 's3://game-saves-vault-frankfurt'
      });
    });
  });

  const displayedSnapshots = selectedServerId === 'all'
    ? allSnapshots
    : allSnapshots.filter((s) => s.serverId === selectedServerId);

  // Trigger Manual Snapshot simulation
  const handleStartManualSnapshot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!snapshotServerId) return;

    setIsCapturing(true);
    setCaptureProgress(10);
    setCaptureStage('Freezing world thread & pausing autosave...');

    setTimeout(() => {
      setCaptureProgress(35);
      setCaptureStage('Packing save files into TAR.GZ archive...');
      setTimeout(() => {
        setCaptureProgress(70);
        setCaptureStage('Encrypting payload with AES-256-GCM key...');
        setTimeout(() => {
          setCaptureProgress(95);
          setCaptureStage('Streaming encrypted blob to S3 Bucket...');
          setTimeout(() => {
            setCaptureProgress(100);
            const targetServer = servers.find((s) => s.id === snapshotServerId);
            const name = snapshotCustomName || `${targetServer?.gameId || 'game'}-manual-save-${Date.now().toString(36)}.tar.gz`;
            onTakeSnapshot(snapshotServerId, name);
            setIsCapturing(false);
            setIsSnapshotModalOpen(false);
            setSnapshotCustomName('');
            setCaptureProgress(0);
          }, 600);
        }, 600);
      }, 700);
    }, 600);
  };

  // Trigger Restore simulation
  const handleConfirmRestore = () => {
    if (!restoringSnapshot) return;
    setIsRestoring(true);
    setRestoreProgress(20);

    setTimeout(() => {
      setRestoreProgress(60);
      setTimeout(() => {
        setRestoreProgress(100);
        setTimeout(() => {
          onRestoreSnapshot(restoringSnapshot.serverId, restoringSnapshot.snapshot.id);
          setIsRestoring(false);
          setRestoringSnapshot(null);
          setRestoreProgress(0);
        }, 500);
      }, 700);
    }, 700);
  };

  // Toggle Schedule
  const handleToggleSchedule = (serverId: string) => {
    setSchedules((prev) => ({
      ...prev,
      [serverId]: {
        ...prev[serverId],
        enabled: !prev[serverId]?.enabled
      }
    }));
  };

  // Update Schedule field
  const handleUpdateSchedule = (serverId: string, field: keyof BackupScheduleConfig, value: any) => {
    setSchedules((prev) => ({
      ...prev,
      [serverId]: {
        ...prev[serverId],
        [field]: value
      }
    }));
  };

  const handleAddBucket = (e: React.FormEvent) => {
    e.preventDefault();
    const newBucket: StorageBucketConfig = {
      id: `bucket-${Date.now()}`,
      name: newBucketName || `${newBucketProvider} Vault (${newBucketRegion})`,
      provider: newBucketProvider,
      bucketName: newBucketName.toLowerCase().replace(/[^a-z0-9-]/g, '') || 'my-game-vault',
      region: newBucketRegion,
      accessKeyId: newAccessKey || 'AKIA8291048102948',
      secretAccessKeyMasked: '••••••••••••••••••••••••••••7bE2',
      encryptionEnabled: true,
      encryptionKey: 'AES-256-GCM (Auto Key Rotation)',
      status: 'CONNECTED',
      totalStoredGb: 0.1
    };
    setBuckets((prev) => [...prev, newBucket]);
    setIsAddBucketOpen(false);
    setNewBucketName('');
  };

  const totalVaultSize = displayedSnapshots.reduce((acc, curr) => acc + (curr.sizeMb || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#0F1117]/90 backdrop-blur-md border border-white/5 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-blue-600/10 border border-blue-500/20 rounded-full text-blue-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Database className="w-3.5 h-3.5 text-blue-400" />
              <span>Automated Game Save & Encrypted Bucket Vault</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Automated Backup Manager
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
              Schedule automated daily backups for your game server save files and store encrypted AES-256 snapshots in AWS S3, Hetzner, or custom cloud storage buckets with 1-click restore capabilities.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              onClick={() => {
                setSnapshotServerId(servers[0]?.id || '');
                setIsSnapshotModalOpen(true);
              }}
              className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.35)] transition cursor-pointer"
            >
              <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
              <span>Take Instant Snapshot</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0F1117]/80 border border-white/5 rounded-2xl p-4 shadow-xl flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
            <FolderArchive className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Snapshots</div>
            <div className="text-2xl font-extrabold text-white">{allSnapshots.length} Files</div>
          </div>
        </div>

        <div className="bg-[#0F1117]/80 border border-white/5 rounded-2xl p-4 shadow-xl flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Vault Storage Used</div>
            <div className="text-2xl font-extrabold text-white font-mono">
              {(totalVaultSize / 1024).toFixed(2)} GB
            </div>
          </div>
        </div>

        <div className="bg-[#0F1117]/80 border border-white/5 rounded-2xl p-4 shadow-xl flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Encryption Engine</div>
            <div className="text-sm font-extrabold text-white">AES-256-GCM</div>
            <div className="text-[10px] text-emerald-400 font-semibold">Active Key Rotation</div>
          </div>
        </div>

        <div className="bg-[#0F1117]/80 border border-white/5 rounded-2xl p-4 shadow-xl flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Daily Schedule</div>
            <div className="text-sm font-extrabold text-white">02:00 UTC (Daily)</div>
            <div className="text-[10px] text-slate-400">Retention: 14 Days</div>
          </div>
        </div>
      </div>

      {/* Tabs & Server Filter Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div className="flex items-center space-x-2 bg-[#0F1117] p-1.5 border border-white/5 rounded-2xl overflow-x-auto w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('SNAPSHOTS')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'SNAPSHOTS'
                ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Save Snapshots ({allSnapshots.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('SCHEDULE')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'SCHEDULE'
                ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Daily Schedule Config</span>
          </button>

          <button
            onClick={() => setActiveTab('BUCKETS')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'BUCKETS'
                ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Encrypted Buckets ({buckets.length})</span>
          </button>
        </div>

        {/* Server Filter Dropdown */}
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-400 whitespace-nowrap">Filter Server:</span>
          <select
            value={selectedServerId}
            onChange={(e) => setSelectedServerId(e.target.value)}
            className="bg-[#0F1117] text-white text-xs font-bold py-2 px-3 rounded-xl border border-white/10 focus:outline-none focus:border-blue-500 transition cursor-pointer w-full sm:w-auto"
          >
            <option value="all">All Game Servers</option>
            {servers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.gameName})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* TAB 1: SAVE SNAPSHOTS LIST */}
      {activeTab === 'SNAPSHOTS' && (
        <div className="space-y-4">
          {displayedSnapshots.length === 0 ? (
            <div className="bg-[#0F1117]/80 border border-white/5 rounded-3xl p-12 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto">
                <FolderArchive className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">No Snapshots Found</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  There are no game save file backups currently saved in the encrypted vault for this server filter.
                </p>
              </div>
              <button
                onClick={() => {
                  setSnapshotServerId(servers[0]?.id || '');
                  setIsSnapshotModalOpen(true);
                }}
                className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-[0_0_15px_rgba(37,99,235,0.3)] transition cursor-pointer"
              >
                <Zap className="w-4 h-4 text-amber-300" />
                <span>Take First Manual Snapshot</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayedSnapshots.map((snapshot) => (
                <div
                  key={snapshot.id}
                  className="bg-[#0F1117]/80 backdrop-blur-md border border-white/5 hover:border-blue-500/30 rounded-3xl p-5 shadow-xl transition flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-600/10 px-2.5 py-0.5 rounded-md border border-blue-500/20">
                          {snapshot.serverName}
                        </span>
                        <h4 className="font-extrabold text-white text-base truncate max-w-[200px]" title={snapshot.name}>
                          {snapshot.name}
                        </h4>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider shrink-0 ${
                          snapshot.type === 'AUTOMATIC'
                            ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}
                      >
                        {snapshot.type}
                      </span>
                    </div>

                    <div className="bg-[#161922] border border-white/5 rounded-2xl p-3 space-y-2 text-xs font-mono">
                      <div className="flex justify-between text-slate-400">
                        <span>Archive Size:</span>
                        <span className="text-white font-bold">{snapshot.sizeMb} MB</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Created Date:</span>
                        <span className="text-slate-300">{new Date(snapshot.createdAt).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Storage Bucket:</span>
                        <span className="text-blue-300 truncate max-w-[130px]">{snapshot.bucketDestination}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 text-[11px] text-emerald-400 font-medium bg-emerald-500/5 border border-emerald-500/10 p-2 rounded-xl">
                      <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
                      <span>{snapshot.encryptionAlgorithm || 'AES-256-GCM Encrypted'}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-white/5 text-xs">
                    <button
                      onClick={() => setRestoringSnapshot({ serverId: snapshot.serverId, snapshot })}
                      className="flex items-center space-x-1.5 text-blue-400 hover:text-blue-300 font-bold hover:bg-blue-500/10 px-2.5 py-1.5 rounded-xl transition cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restore Save</span>
                    </button>

                    <button
                      onClick={() => onDeleteSnapshot(snapshot.serverId, snapshot.id)}
                      className="flex items-center space-x-1 text-rose-400 hover:text-rose-300 font-semibold hover:bg-rose-500/10 px-2.5 py-1.5 rounded-xl transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DAILY SCHEDULE CONFIGURATION */}
      {activeTab === 'SCHEDULE' && (
        <div className="space-y-6">
          <div className="bg-[#161922] border border-white/5 rounded-2xl p-4 flex items-center space-x-3 text-xs text-slate-300">
            <Clock className="w-4 h-4 text-blue-400 shrink-0" />
            <span>
              Configure background automated daily save routines. Each server runs a cron job on its host node to package world save files, player items, and custom mod configs before sending encrypted blobs to your storage bucket.
            </span>
          </div>

          <div className="space-y-4">
            {servers.map((server) => {
              const sched = schedules[server.id] || {
                serverId: server.id,
                enabled: true,
                frequency: 'DAILY',
                timeOfDayUtc: '02:00',
                retentionDays: 14,
                compressionLevel: 'HIGH',
                includePlayerSaves: true,
                includeWorldData: true,
                includeModConfigs: true,
                encryptedBucketId: 'bucket-s3-eu'
              };

              return (
                <div
                  key={server.id}
                  className="bg-[#0F1117]/80 backdrop-blur-md border border-white/5 rounded-3xl p-6 shadow-xl space-y-6"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-lg">
                        <Server className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-white text-base">{server.name}</h3>
                        <p className="text-xs text-slate-400">Node: {server.nodeName} • Game: {server.gameName}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleSchedule(server.id)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition ${
                        sched.enabled
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400 border border-white/5'
                      }`}
                    >
                      <CheckCircle2 className={`w-4 h-4 ${sched.enabled ? 'text-emerald-400' : 'text-slate-500'}`} />
                      <span>{sched.enabled ? 'Automated Daily Backups Active' : 'Schedule Paused'}</span>
                    </button>
                  </div>

                  {sched.enabled && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-300">Backup Frequency</label>
                        <select
                          value={sched.frequency}
                          onChange={(e) => handleUpdateSchedule(server.id, 'frequency', e.target.value)}
                          className="w-full bg-[#161922] text-white text-xs font-bold py-2.5 px-3 rounded-xl border border-white/10 focus:outline-none focus:border-blue-500"
                        >
                          <option value="EVERY_6_HOURS">Every 6 Hours</option>
                          <option value="EVERY_12_HOURS">Every 12 Hours</option>
                          <option value="DAILY">Daily (Once Every 24h)</option>
                          <option value="WEEKLY">Weekly</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-300">Execution Time (UTC)</label>
                        <input
                          type="text"
                          value={sched.timeOfDayUtc}
                          onChange={(e) => handleUpdateSchedule(server.id, 'timeOfDayUtc', e.target.value)}
                          placeholder="02:00"
                          className="w-full bg-[#161922] text-white font-mono text-xs font-bold py-2.5 px-3 rounded-xl border border-white/10 focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-300">Retention Policy</label>
                        <select
                          value={sched.retentionDays}
                          onChange={(e) => handleUpdateSchedule(server.id, 'retentionDays', Number(e.target.value))}
                          className="w-full bg-[#161922] text-white text-xs font-bold py-2.5 px-3 rounded-xl border border-white/10 focus:outline-none focus:border-blue-500"
                        >
                          <option value={7}>Keep last 7 days</option>
                          <option value={14}>Keep last 14 days</option>
                          <option value={30}>Keep last 30 days</option>
                          <option value={90}>Keep last 90 days</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-300">Destination Vault</label>
                        <select
                          value={sched.encryptedBucketId}
                          onChange={(e) => handleUpdateSchedule(server.id, 'encryptedBucketId', e.target.value)}
                          className="w-full bg-[#161922] text-white text-xs font-bold py-2.5 px-3 rounded-xl border border-white/10 focus:outline-none focus:border-blue-500"
                        >
                          {buckets.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.name} ({b.provider})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: ENCRYPTED BUCKETS MANAGER */}
      {activeTab === 'BUCKETS' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-extrabold text-white">Cloud Storage Buckets</h3>
              <p className="text-xs text-slate-400">Manage encrypted AWS S3, Google Cloud Storage, or Hetzner backup destinations.</p>
            </div>

            <button
              onClick={() => setIsAddBucketOpen(true)}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-[0_0_15px_rgba(37,99,235,0.3)] transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Connect Storage Bucket</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {buckets.map((b) => (
              <div
                key={b.id}
                className="bg-[#0F1117]/80 backdrop-blur-md border border-white/5 rounded-3xl p-6 shadow-xl space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                      <HardDrive className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-white text-base">{b.name}</h4>
                      <p className="text-xs text-slate-400 font-mono">Bucket: {b.bucketName}</p>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    {b.status}
                  </span>
                </div>

                <div className="bg-[#161922] border border-white/5 rounded-2xl p-4 space-y-2 text-xs font-mono">
                  <div className="flex justify-between text-slate-400">
                    <span>Provider:</span>
                    <span className="text-white font-bold">{b.provider}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Region:</span>
                    <span className="text-slate-300">{b.region}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Access Key ID:</span>
                    <span className="text-slate-300">{b.accessKeyId}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Encryption Engine:</span>
                    <span className="text-emerald-400 font-semibold">{b.encryptionKey}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-white/5">
                  <span>Storage Used: <strong className="text-white font-mono">{b.totalStoredGb} GB</strong></span>
                  <span className="text-emerald-400 text-[11px] font-semibold flex items-center space-x-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>AES-256 Active</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* INSTANT SNAPSHOT MODAL */}
      {isSnapshotModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0A0B10]/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0F1117] border border-white/10 rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.3)]">
                  <Zap className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-lg">Take Instant Save Snapshot</h3>
                  <p className="text-xs text-slate-400">Package world state & upload encrypted archive.</p>
                </div>
              </div>

              {!isCapturing && (
                <button onClick={() => setIsSnapshotModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {isCapturing ? (
              <div className="space-y-6 py-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(37,99,235,0.3)]">
                  <RefreshCw className="w-6 h-6 animate-spin" />
                </div>

                <div className="space-y-2">
                  <h4 className="font-extrabold text-white text-base">Creating Encrypted Snapshot...</h4>
                  <p className="text-xs font-mono text-blue-400 bg-[#161922] p-2.5 rounded-xl border border-white/5">
                    {captureStage}
                  </p>
                </div>

                <div className="w-full bg-[#161922] h-2.5 rounded-full overflow-hidden border border-white/5">
                  <div
                    className="bg-blue-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${captureProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <form onSubmit={handleStartManualSnapshot} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Select Game Server</label>
                  <select
                    value={snapshotServerId}
                    onChange={(e) => setSnapshotServerId(e.target.value)}
                    className="w-full bg-[#161922] text-white text-xs font-bold py-2.5 px-3 rounded-xl border border-white/10 focus:outline-none focus:border-blue-500"
                  >
                    {servers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.gameName})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Custom Snapshot Label (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. pre-boss-fight-backup.tar.gz"
                    value={snapshotCustomName}
                    onChange={(e) => setSnapshotCustomName(e.target.value)}
                    className="w-full bg-[#161922] text-white text-xs font-mono py-2.5 px-3.5 rounded-xl border border-white/10 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="pt-4 border-t border-white/5 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsSnapshotModalOpen(false)}
                    className="px-4 py-2.5 bg-[#161922] text-slate-300 text-xs font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-[0_0_15px_rgba(37,99,235,0.3)]"
                  >
                    Start Save & Encrypt
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* RESTORE CONFIRMATION MODAL */}
      {restoringSnapshot && (
        <div className="fixed inset-0 z-50 bg-[#0A0B10]/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0F1117] border border-white/10 rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl space-y-5 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(245,158,11,0.3)]">
              <RotateCcw className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-extrabold text-white">Restore World Save Snapshot?</h3>
              <p className="text-xs text-slate-400">
                This will overwrite current world save data on <span className="text-white font-semibold">{restoringSnapshot.snapshot.serverName}</span> with <span className="text-blue-300 font-mono">{restoringSnapshot.snapshot.name}</span>.
              </p>
            </div>

            {isRestoring ? (
              <div className="space-y-3">
                <div className="w-full bg-[#161922] h-2.5 rounded-full overflow-hidden border border-white/5">
                  <div
                    className="bg-amber-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${restoreProgress}%` }}
                  />
                </div>
                <span className="text-xs text-slate-400 font-mono">Restoring world save files to container...</span>
              </div>
            ) : (
              <div className="flex justify-center space-x-3 pt-2">
                <button
                  onClick={() => setRestoringSnapshot(null)}
                  className="px-4 py-2.5 bg-[#161922] text-slate-300 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmRestore}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                >
                  Confirm Restore
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CONNECT BUCKET MODAL */}
      {isAddBucketOpen && (
        <div className="fixed inset-0 z-50 bg-[#0A0B10]/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0F1117] border border-white/10 rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center">
                  <HardDrive className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-lg">Connect Encrypted Cloud Storage Bucket</h3>
                  <p className="text-xs text-slate-400">AWS S3 / Hetzner Storage / Cloudflare R2</p>
                </div>
              </div>

              <button onClick={() => setIsAddBucketOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddBucket} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Provider</label>
                <select
                  value={newBucketProvider}
                  onChange={(e) => setNewBucketProvider(e.target.value as any)}
                  className="w-full bg-[#161922] text-white text-xs font-bold py-2.5 px-3 rounded-xl border border-white/10"
                >
                  <option value="AWS_S3">AWS S3 Bucket</option>
                  <option value="HETZNER_STORAGE_BOX">Hetzner Storage Box</option>
                  <option value="CLOUDFLARE_R2">Cloudflare R2</option>
                  <option value="GOOGLE_CLOUD_STORAGE">Google Cloud Storage</option>
                  <option value="MINIO_S3">MinIO Self-Hosted S3</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Bucket Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. my-game-saves-vault"
                    value={newBucketName}
                    onChange={(e) => setNewBucketName(e.target.value)}
                    className="w-full bg-[#161922] text-white text-xs py-2.5 px-3 rounded-xl border border-white/10"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Region</label>
                  <input
                    type="text"
                    required
                    value={newBucketRegion}
                    onChange={(e) => setNewBucketRegion(e.target.value)}
                    className="w-full bg-[#161922] text-white text-xs py-2.5 px-3 rounded-xl border border-white/10"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Access Key ID</label>
                <input
                  type="text"
                  required
                  placeholder="AKIA..."
                  value={newAccessKey}
                  onChange={(e) => setNewAccessKey(e.target.value)}
                  className="w-full bg-[#161922] text-white text-xs font-mono py-2.5 px-3 rounded-xl border border-white/10"
                />
              </div>

              <div className="flex items-center space-x-2 text-xs text-emerald-400 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>AES-256 client-side encryption is automatically enabled on all bucket snapshots.</span>
              </div>

              <div className="pt-4 border-t border-white/5 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddBucketOpen(false)}
                  className="px-4 py-2.5 bg-[#161922] text-slate-300 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-[0_0_15px_rgba(37,99,235,0.3)]"
                >
                  Connect Bucket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
