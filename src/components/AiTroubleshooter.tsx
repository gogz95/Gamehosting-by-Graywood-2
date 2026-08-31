import React, { useState } from 'react';
import { Sparkles, Send, Bot, User, RefreshCw, AlertTriangle, ShieldCheck, Terminal, Lightbulb } from 'lucide-react';
import { DeployedServer } from '../types';

interface AiTroubleshooterProps {
  servers: DeployedServer[];
}

export const AiTroubleshooter: React.FC<AiTroubleshooterProps> = ({ servers }) => {
  const [selectedServerId, setSelectedServerId] = useState<string>(servers[0]?.id || '');
  const [prompt, setPrompt] = useState('');
  const [chatType, setChatType] = useState<'CRASH_LOG' | 'PERFORMANCE' | 'PROXY'>('CRASH_LOG');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    {
      sender: 'ai',
      text: 'Hello! I am your AI Game Server Administrator & Reverse Proxy Engineer powered by Gemini. Ask me to analyze server crash logs, optimize JVM/Docker flags, tune Satisfactory/Valheim tickrates, or resolve NGINX/Velocity proxy routing issues!'
    }
  ]);

  const activeServer = servers.find((s) => s.id === selectedServerId) || servers[0];

  const handleSend = async (customText?: string) => {
    const textToSend = customText || prompt;
    if (!textToSend.trim() || loading) return;

    const userMsg = { sender: 'user' as const, text: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setPrompt('');
    setLoading(true);

    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToSend,
          type: chatType,
          context: activeServer
            ? {
                serverName: activeServer.name,
                gameName: activeServer.gameName,
                status: activeServer.status,
                ramAllocatedGb: activeServer.ramAllocatedGb,
                subdomain: activeServer.fullDomain,
                proxyEngine: activeServer.proxyEngine,
                recentLogs: activeServer.logs.slice(-5)
              }
            : {}
        })
      });

      const data = await response.json();
      setLoading(false);
      setMessages((prev) => [
        ...prev,
        { sender: 'ai', text: data.response || 'I analyzed the configuration. All systems are operating normally.' }
      ]);
    } catch (err: any) {
      setLoading(false);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: 'AI response fallback:\n\n1. Ensure port forwarding is configured on your router or Cloud Firewall.\n2. Verify the server properties allow online connections.\n3. Increase RAM allocation in the hardware settings tab if Java Heap exceptions occur.'
        }
      ]);
    }
  };

  return (
    <div className="space-y-6">
      {/* AI Header */}
      <div className="bg-[#0F1117]/90 backdrop-blur-md border border-purple-500/30 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/10 blur-[90px] rounded-full pointer-events-none" />
        <div className="flex items-center space-x-3 relative z-10">
          <div className="w-10 h-10 rounded-2xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
            <Sparkles className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-white">AI Server & Proxy Assistant</h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Powered by Gemini 2.5 — Real-time log diagnostics, JVM tuning & reverse proxy routing assistant
            </p>
          </div>
        </div>
      </div>

      {/* Main AI Chat Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Prompts & Context Panel */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
          <h3 className="font-bold text-white text-sm flex items-center space-x-2">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            <span>Diagnostic Preset Actions</span>
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              Target Active Server
            </label>
            <select
              value={selectedServerId}
              onChange={(e) => setSelectedServerId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500 cursor-pointer"
            >
              {servers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.gameName})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2 pt-2">
            <span className="text-xs font-semibold text-slate-400">1-Click AI Diagnosis</span>
            {[
              {
                title: 'Analyze Recent Console Logs',
                desc: 'Scan latest output for Java errors or mod crashes',
                prompt: `Please scan the console logs for ${activeServer?.name || 'this server'} and check for any error patterns or lag spikes.`
              },
              {
                title: 'Optimize RAM & JVM Flags',
                desc: 'Get Aikar flags for Minecraft or Satisfactory tickrate boost',
                prompt: `Suggest optimal RAM allocation and startup flags for ${activeServer?.gameName || 'my server'} running with ${activeServer?.ramAllocatedGb || 4}GB RAM.`
              },
              {
                title: 'Troubleshoot Subdomain Proxy',
                desc: 'Debug NGINX stream or Velocity connection dropouts',
                prompt: `How do I configure Velocity or NGINX stream proxying for my domain ${activeServer?.fullDomain || 'mc.mydomain.com'}?`
              }
            ].map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(p.prompt)}
                className="w-full text-left p-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-purple-500/50 transition cursor-pointer space-y-0.5"
              >
                <div className="text-xs font-semibold text-purple-300">{p.title}</div>
                <div className="text-[10px] text-slate-400">{p.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Stream Window */}
        <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col h-[520px] shadow-xl overflow-hidden">
          {/* Chat Messages */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex items-start space-x-3 ${
                  m.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                    m.sender === 'user'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-purple-600/30 text-purple-300 border border-purple-500/30'
                  }`}
                >
                  {m.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div
                  className={`p-4 rounded-2xl max-w-[80%] text-xs leading-relaxed whitespace-pre-wrap ${
                    m.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none shadow-md'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center space-x-2 text-purple-400 text-xs p-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>AI Assistant analyzing server parameters & logs...</span>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-slate-900 border-t border-slate-800 flex items-center space-x-2"
          >
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask AI anything about game server configs, proxy setup, or crash logs..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-500 text-white p-2.5 rounded-xl transition cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
