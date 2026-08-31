import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Calendar, 
  RotateCw, 
  Play, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Layers, 
  Terminal, 
  HardDrive, 
  X,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { ServerSchedule } from '../types';

interface SchedulerTabProps {
  serverId: string;
  serverName: string;
}

export const SchedulerTab: React.FC<SchedulerTabProps> = ({ serverId, serverName }) => {
  const [schedules, setSchedules] = useState<ServerSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [action, setAction] = useState<ServerSchedule['action']>('RESTART');
  const [cronExpression, setCronExpression] = useState('0 4 * * *');
  const [command, setCommand] = useState('');

  const fetchSchedules = () => {
    setLoading(true);
    fetch(`/api/servers/${serverId}/schedules`)
      .then((res) => res.json())
      .then((data) => {
        if (data.schedules) setSchedules(data.schedules);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSchedules();
  }, [serverId]);

  const handleApplyPreset = (presetName: string, presetCron: string, presetAction: ServerSchedule['action'], presetCmd: string = '') => {
    setName(presetName);
    setCronExpression(presetCron);
    setAction(presetAction);
    setCommand(presetCmd);
    setIsAddModalOpen(true);
  };

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newSchedule: ServerSchedule = {
      id: `sched-${Date.now().toString(36)}`,
      serverId,
      name: name.trim(),
      cronExpression,
      action,
      command: action === 'COMMAND' ? command : undefined,
      enabled: true
    };

    try {
      const res = await fetch(`/api/servers/${serverId}/schedules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSchedule)
      });
      const data = await res.json();
      setSchedules((prev) => [data, ...prev]);
      setIsAddModalOpen(false);
      setName('');
      setCommand('');
    } catch (e) {}
  };

  const handleToggleSchedule = async (schedule: ServerSchedule) => {
    const updated = { ...schedule, enabled: !schedule.enabled };
    try {
      await fetch(`/api/servers/${serverId}/schedules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      setSchedules((prev) => prev.map((s) => (s.id === schedule.id ? updated : s)));
    } catch (e) {}
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    try {
      await fetch(`/api/servers/${serverId}/schedules/${scheduleId}`, {
        method: 'DELETE'
      });
      setSchedules((prev) => prev.filter((s) => s.id !== scheduleId));
    } catch (e) {}
  };

  return (
    <div className="space-y-6">
      {/* Quick Presets Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-indigo-300 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>Recommended Automation Presets</span>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-600/20 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Custom Schedule</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => handleApplyPreset('Daily 4 AM Restart', '0 4 * * *', 'RESTART')}
            className="p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/40 rounded-xl text-left transition group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200 text-xs group-hover:text-indigo-300">Daily 4:00 AM Restart</span>
              <RotateCw className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Clears memory leaks and resets JVM heap safely.</p>
          </button>

          <button
            onClick={() => handleApplyPreset('12-Hour Automated Backup', 'interval:12h', 'BACKUP')}
            className="p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/40 rounded-xl text-left transition group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200 text-xs group-hover:text-indigo-300">12h Rolling Snapshot</span>
              <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Automatic tarball snapshot to local/S3 vault.</p>
          </button>

          <button
            onClick={() => handleApplyPreset('Hourly Server Announcement', 'interval:1h', 'COMMAND', 'say Welcome to the server! Join our Discord for events.')}
            className="p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/40 rounded-xl text-left transition group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200 text-xs group-hover:text-indigo-300">Hourly Chat Broadcast</span>
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Broadcasts in-game messages via RCON console.</p>
          </button>
        </div>
      </div>

      {/* Active Schedules List */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
          <h3 className="font-bold text-white text-xs uppercase tracking-wider flex items-center space-x-2">
            <Clock className="w-4 h-4 text-indigo-400" />
            <span>Configured Schedules ({schedules.length})</span>
          </h3>
          <span className="text-[11px] text-slate-500 font-mono">Daemon: 30s Polling Cycle</span>
        </div>

        {schedules.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No active schedules configured. Click a preset above to automate restarts, backups, or broadcasts.
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {schedules.map((sch) => (
              <div key={sch.id} className="p-4 flex items-center justify-between hover:bg-slate-900/30 transition">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-200 text-xs">{sch.name}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      sch.action === 'RESTART' ? 'bg-amber-500/20 text-amber-300' :
                      sch.action === 'BACKUP' ? 'bg-indigo-500/20 text-indigo-300' :
                      'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      {sch.action}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400 font-mono flex items-center space-x-3">
                    <span>Cron: {sch.cronExpression}</span>
                    {sch.command && <span>Cmd: "{sch.command}"</span>}
                    {sch.lastRunAt && (
                      <span className="text-slate-500">Last run: {new Date(sch.lastRunAt).toLocaleTimeString()}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleToggleSchedule(sch)}
                    className="text-slate-400 hover:text-white transition cursor-pointer"
                  >
                    {sch.enabled ? (
                      <ToggleRight className="w-6 h-6 text-emerald-400" />
                    ) : (
                      <ToggleLeft className="w-6 h-6 text-slate-600" />
                    )}
                  </button>

                  <button
                    onClick={() => handleDeleteSchedule(sch.id)}
                    className="p-1.5 hover:bg-rose-500/20 text-rose-400 rounded-lg transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Custom Schedule Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm flex items-center space-x-2">
                <Clock className="w-4 h-4 text-indigo-400" />
                <span>Configure Scheduled Task</span>
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSchedule} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400">Schedule Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Daily 4 AM Restart"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400">Action</label>
                  <select
                    value={action}
                    onChange={(e: any) => setAction(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="RESTART">Restart Server</option>
                    <option value="BACKUP">Create Snapshot</option>
                    <option value="COMMAND">RCON Command</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400">Timing Expression</label>
                  <select
                    value={cronExpression}
                    onChange={(e) => setCronExpression(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  >
                    <option value="0 4 * * *">Daily at 4:00 AM (0 4 * * *)</option>
                    <option value="interval:6h">Every 6 Hours</option>
                    <option value="interval:12h">Every 12 Hours</option>
                    <option value="interval:24h">Every 24 Hours</option>
                    <option value="interval:1h">Every 1 Hour</option>
                    <option value="interval:30m">Every 30 Minutes</option>
                  </select>
                </div>
              </div>

              {action === 'COMMAND' && (
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400">Console / RCON Command</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. say Server saving world data..."
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl"
                >
                  Save Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
