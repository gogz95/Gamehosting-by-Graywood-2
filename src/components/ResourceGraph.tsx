import React, { useId } from 'react';
import { Activity } from 'lucide-react';

interface ResourceGraphProps {
  title: string;
  data: number[];
  currentValue: number;
  unit: string;
  maxScale?: number;
  colorScheme?: 'blue' | 'emerald' | 'indigo' | 'amber';
  icon?: React.ReactNode;
  subtitle?: string;
}

export const ResourceGraph: React.FC<ResourceGraphProps> = ({
  title,
  data,
  currentValue,
  unit,
  maxScale,
  colorScheme = 'blue',
  icon,
  subtitle
}) => {
  const gradientId = useId();

  // Determine scaling
  const effectiveMax = Math.max(maxScale || 100, ...data, 1);
  const effectiveMin = 0;

  // Chart dimensions
  const width = 320;
  const height = 90;
  const paddingX = 4;
  const paddingY = 8;

  const points = data.length > 0 ? data : [0];
  const stepX = (width - paddingX * 2) / Math.max(points.length - 1, 1);

  // Generate SVG path coordinates
  const coords = points.map((val, idx) => {
    const clamped = Math.max(effectiveMin, Math.min(effectiveMax, val));
    const x = paddingX + idx * stepX;
    const y = height - paddingY - ((clamped - effectiveMin) / (effectiveMax - effectiveMin)) * (height - paddingY * 2);
    return { x, y };
  });

  // Smooth Bezier path string
  let linePath = '';
  if (coords.length > 0) {
    linePath = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const curr = coords[i];
      const next = coords[i + 1];
      const midX = (curr.x + next.x) / 2;
      linePath += ` C ${midX} ${curr.y}, ${midX} ${next.y}, ${next.x} ${next.y}`;
    }
  }

  // Area under curve
  const firstX = coords[0]?.x || paddingX;
  const lastX = coords[coords.length - 1]?.x || width - paddingX;
  const areaPath = `${linePath} L ${lastX} ${height} L ${firstX} ${height} Z`;

  // Color schemes
  const colors = {
    blue: {
      stroke: '#38bdf8',
      stopStart: 'rgba(56, 189, 248, 0.45)',
      stopEnd: 'rgba(56, 189, 248, 0.0)',
      accent: 'text-sky-400',
      badge: 'bg-sky-500/10 text-sky-300 border-sky-500/20'
    },
    emerald: {
      stroke: '#34d399',
      stopStart: 'rgba(52, 211, 153, 0.45)',
      stopEnd: 'rgba(52, 211, 153, 0.0)',
      accent: 'text-emerald-400',
      badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
    },
    indigo: {
      stroke: '#818cf8',
      stopStart: 'rgba(129, 140, 248, 0.45)',
      stopEnd: 'rgba(129, 140, 248, 0.0)',
      accent: 'text-indigo-400',
      badge: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20'
    },
    amber: {
      stroke: '#fbbf24',
      stopStart: 'rgba(251, 191, 36, 0.45)',
      stopEnd: 'rgba(251, 191, 36, 0.0)',
      accent: 'text-amber-400',
      badge: 'bg-amber-500/10 text-amber-300 border-amber-500/20'
    }
  };

  const scheme = colors[colorScheme];
  const lastCoord = coords[coords.length - 1] || { x: width - paddingX, y: height / 2 };

  return (
    <div className="bg-[#11131a] border border-white/5 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden group hover:border-white/10 transition duration-200">
      {/* Header */}
      <div className="flex items-center justify-between z-10 mb-2">
        <div className="flex items-center space-x-2">
          {icon || <Activity className={`w-4 h-4 ${scheme.accent}`} />}
          <div>
            <h4 className="text-xs font-bold text-slate-300 group-hover:text-white transition">{title}</h4>
            {subtitle && <p className="text-[10px] text-slate-500">{subtitle}</p>}
          </div>
        </div>
        <div className={`px-2 py-0.5 rounded-lg border text-xs font-mono font-bold ${scheme.badge}`}>
          {currentValue} {unit}
        </div>
      </div>

      {/* SVG Chart */}
      <div className="relative w-full h-[90px] overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="w-full h-full">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={scheme.stopStart} />
              <stop offset="100%" stopColor={scheme.stopEnd} />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1="0" y1="20" x2={width} y2="20" stroke="rgba(255,255,255,0.03)" strokeDasharray="3 3" />
          <line x1="0" y1="50" x2={width} y2="50" stroke="rgba(255,255,255,0.03)" strokeDasharray="3 3" />
          <line x1="0" y1="75" x2={width} y2="75" stroke="rgba(255,255,255,0.03)" strokeDasharray="3 3" />

          {/* Area Fill */}
          <path d={areaPath} fill={`url(#${gradientId})`} />

          {/* Line Stroke */}
          <path
            d={linePath}
            fill="none"
            stroke={scheme.stroke}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-all duration-300"
          />

          {/* Latest Point Indicator */}
          <circle cx={lastCoord.x} cy={lastCoord.y} r="4" fill={scheme.stroke} />
          <circle cx={lastCoord.x} cy={lastCoord.y} r="8" fill={scheme.stroke} opacity="0.3" className="animate-ping" />
        </svg>
      </div>

      {/* Bottom Axis Range */}
      <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 mt-1 z-10">
        <span>60s ago</span>
        <span>Peak: {Math.round(effectiveMax)} {unit}</span>
        <span>Now</span>
      </div>
    </div>
  );
};
