import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Send, Trash2, ArrowDown, Play, Filter, Copy, Check } from 'lucide-react';
import { LogEntry } from '../types';

interface ConsoleTerminalProps {
  logs: LogEntry[];
  onSendCommand: (cmd: string) => void;
  serverName: string;
}

export const ConsoleTerminal: React.FC<ConsoleTerminalProps> = ({ logs, onSendCommand, serverName }) => {
  const [commandInput, setCommandInput] = useState('');
  const [filterLevel, setFilterLevel] = useState<string>('ALL');
  const [autoScroll, setAutoScroll] = useState(true);
  const [copied, setCopied] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll) {
      logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandInput.trim()) return;
    onSendCommand(commandInput.trim());
    setCommandInput('');
  };

  const handleQuickMacro = (macro: string) => {
    onSendCommand(macro);
  };

  const filteredLogs = logs.filter((log) => {
    if (filterLevel === 'ALL') return true;
    return log.level === filterLevel;
  });

  const getLogColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'ERROR':
        return 'text-rose-400 bg-rose-500/10 px-1 py-0.5 rounded';
      case 'WARN':
        return 'text-amber-300';
      case 'SYSTEM':
        return 'text-indigo-400 font-semibold';
      case 'COMMAND':
        return 'text-emerald-300 font-bold';
      default:
        return 'text-slate-300';
    }
  };

  const copyLogs = () => {
    const text = logs.map((l) => `[${l.timestamp}] [${l.level}] ${l.message}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden flex flex-col h-[520px] shadow-xl">
      {/* Console Bar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 gap-2">
        <div className="flex items-center space-x-2">
          <Terminal className="w-4 h-4 text-indigo-400" />
          <span className="font-mono text-xs font-semibold text-slate-200">
            Console Terminal — {serverName}
          </span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </div>

        {/* Console Controls */}
        <div className="flex items-center space-x-2 text-xs">
          {/* Level Filter */}
          <div className="flex items-center space-x-1 bg-slate-800/80 rounded-lg px-2 py-1 text-slate-400">
            <Filter className="w-3 h-3 text-slate-400" />
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900">All Logs</option>
              <option value="INFO" className="bg-slate-900">INFO</option>
              <option value="WARN" className="bg-slate-900">WARN</option>
              <option value="ERROR" className="bg-slate-900">ERROR</option>
              <option value="COMMAND" className="bg-slate-900">COMMANDS</option>
            </select>
          </div>

          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition cursor-pointer ${
              autoScroll
                ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/30'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            Auto-Scroll
          </button>

          <button
            onClick={copyLogs}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition cursor-pointer"
            title="Copy Logs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Log Feed Box */}
      <div className="flex-1 p-4 font-mono text-xs space-y-1.5 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
        {filteredLogs.map((log) => (
          <div key={log.id} className="flex items-start space-x-2 hover:bg-slate-900/60 p-0.5 rounded transition">
            <span className="text-slate-500 select-none text-[11px]">[{log.timestamp}]</span>
            <span className={`text-[10px] uppercase tracking-wider font-semibold select-none ${getLogColor(log.level)}`}>
              [{log.level}]
            </span>
            <span className={`break-all ${getLogColor(log.level)}`}>{log.message}</span>
          </div>
        ))}
        <div ref={logEndRef} />
      </div>

      {/* Quick Macros */}
      <div className="px-4 py-2 bg-slate-900/60 border-t border-slate-800/80 flex items-center space-x-2 overflow-x-auto text-xs scrollbar-none">
        <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider shrink-0">Macros:</span>
        {[
          { label: 'save-all', cmd: 'save-all' },
          { label: 'op player', cmd: 'op AlexTheBuilder' },
          { label: 'say Welcome', cmd: 'say Welcome to our GameHost server!' },
          { label: 'status', cmd: 'status' },
          { label: 'list players', cmd: 'list' },
          { label: 'kick all', cmd: 'kick @a Maintenance restart' }
        ].map((m, idx) => (
          <button
            key={idx}
            onClick={() => handleQuickMacro(m.cmd)}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-md text-[11px] font-mono border border-slate-700/60 transition shrink-0 cursor-pointer"
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Command Input Form */}
      <form onSubmit={handleSubmit} className="p-3 bg-slate-900 border-t border-slate-800 flex items-center space-x-2">
        <span className="font-mono text-emerald-400 text-sm pl-1 font-bold">›</span>
        <input
          type="text"
          value={commandInput}
          onChange={(e) => setCommandInput(e.target.value)}
          placeholder="Type server command (e.g. op, kick, say, save-all, status)..."
          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
        />
        <button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-xl transition shadow-md cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
