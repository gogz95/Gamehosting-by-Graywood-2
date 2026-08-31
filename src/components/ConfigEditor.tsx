import React, { useState } from 'react';
import { Save, FileText, Check, RotateCcw } from 'lucide-react';

interface ConfigEditorProps {
  filename: string;
  initialContent: string;
  onSave: (newContent: string) => void;
}

export const ConfigEditor: React.FC<ConfigEditorProps> = ({ filename, initialContent, onSave }) => {
  const [content, setContent] = useState(initialContent);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onSave(content);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    setContent(initialContent);
  };

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden flex flex-col h-[520px] shadow-xl">
      {/* Editor Header */}
      <div className="flex items-center justify-between px-5 py-3 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center space-x-2 text-xs font-mono font-semibold text-slate-200">
          <FileText className="w-4 h-4 text-indigo-400" />
          <span>Editing {filename}</span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleReset}
            className="flex items-center space-x-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <button
            onClick={handleSave}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg text-xs shadow-md transition cursor-pointer"
          >
            {saved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            <span>{saved ? 'Saved Config' : 'Save File'}</span>
          </button>
        </div>
      </div>

      {/* Code Textarea */}
      <div className="flex-1 p-4 bg-slate-950 font-mono text-xs text-slate-200">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full h-full bg-transparent text-slate-200 font-mono text-xs focus:outline-none resize-none leading-relaxed"
          spellCheck={false}
        />
      </div>
    </div>
  );
};
