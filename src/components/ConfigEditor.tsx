import React, { useState, useMemo } from 'react';
import { Save, FileText, Check, RotateCcw, AlertCircle, Sparkles } from 'lucide-react';

interface ConfigEditorProps {
  filename: string;
  initialContent: string;
  onSave: (newContent: string) => void;
}

export const ConfigEditor: React.FC<ConfigEditorProps> = ({ filename, initialContent, onSave }) => {
  const [content, setContent] = useState(initialContent);
  const [saved, setSaved] = useState(false);

  const hasUnsavedChanges = content !== initialContent;

  const fileType = useMemo(() => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'properties') return 'PROPERTIES';
    if (ext === 'yml' || ext === 'yaml') return 'YAML';
    if (ext === 'toml') return 'TOML';
    if (ext === 'json') return 'JSON';
    return 'CONFIG';
  }, [filename]);

  const syntaxValidation = useMemo(() => {
    if (fileType === 'PROPERTIES') {
      const lines = content.split('\n');
      const duplicateKeys = new Set<string>();
      const seenKeys = new Set<string>();

      lines.forEach((line) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const key = trimmed.split('=')[0]?.trim();
          if (key) {
            if (seenKeys.has(key)) {
              duplicateKeys.add(key);
            } else {
              seenKeys.add(key);
            }
          }
        }
      });

      if (duplicateKeys.size > 0) {
        return {
          valid: false,
          warning: `Duplicate key(s) detected: ${Array.from(duplicateKeys).join(', ')}`
        };
      }
    } else if (fileType === 'JSON') {
      try {
        JSON.parse(content);
      } catch (err: any) {
        return {
          valid: false,
          warning: `JSON syntax error: ${err.message}`
        };
      }
    }
    return { valid: true, warning: null };
  }, [content, fileType]);

  const handleSave = () => {
    onSave(content);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    setContent(initialContent);
  };

  const lineCount = content.split('\n').length;
  const charCount = content.length;

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden flex flex-col h-[560px] shadow-xl">
      {/* Editor Header */}
      <div className="flex flex-wrap items-center justify-between px-5 py-3 bg-slate-900 border-b border-slate-800 gap-2">
        <div className="flex items-center space-x-3 text-xs font-mono">
          <div className="flex items-center space-x-1.5 text-slate-200 font-semibold">
            <FileText className="w-4 h-4 text-indigo-400" />
            <span>{filename}</span>
          </div>

          <span className="px-2 py-0.5 bg-slate-800 text-indigo-300 text-[10px] font-bold rounded uppercase tracking-wider">
            {fileType}
          </span>

          {hasUnsavedChanges && (
            <span className="flex items-center space-x-1 text-amber-400 text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span>Unsaved changes</span>
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {hasUnsavedChanges && (
            <button
              onClick={handleReset}
              className="flex items-center space-x-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition cursor-pointer"
              title="Revert to last saved version"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Revert</span>
            </button>
          )}

          <button
            onClick={handleSave}
            className="flex items-center space-x-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg text-xs shadow-md transition cursor-pointer"
          >
            {saved ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Save className="w-3.5 h-3.5" />}
            <span>{saved ? 'Saved Config' : 'Save Config'}</span>
          </button>
        </div>
      </div>

      {/* Syntax Warning Banner */}
      {!syntaxValidation.valid && (
        <div className="bg-amber-950/40 border-b border-amber-500/30 px-4 py-2 flex items-center space-x-2 text-xs text-amber-300 font-mono">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{syntaxValidation.warning}</span>
        </div>
      )}

      {/* Code Textarea */}
      <div className="flex-1 p-4 bg-slate-950 font-mono text-xs text-slate-200 overflow-hidden flex">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full h-full bg-transparent text-slate-200 font-mono text-xs focus:outline-none resize-none leading-relaxed selection:bg-indigo-600 selection:text-white"
          spellCheck={false}
          placeholder="Configuration content..."
        />
      </div>

      {/* Status Bar */}
      <div className="px-5 py-2 bg-slate-900/90 border-t border-slate-800 text-[11px] font-mono text-slate-400 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span>Lines: {lineCount}</span>
          <span>Characters: {charCount}</span>
          <span>Encoding: UTF-8</span>
        </div>
        <div className="flex items-center space-x-1.5 text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>Direct NVMe Sync Ready</span>
        </div>
      </div>
    </div>
  );
};
