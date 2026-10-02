import React, { useState } from 'react';
import { GroupSummary } from '../types[RekapDataProsesTembakau]';
import { formatKg, formatPct } from '../api[RekapDataProsesTembakau]';

// 1. Line Chart: Tren Susut (%) Bulanan
export const MonthlyLossLineChart: React.FC<{ data: GroupSummary[]; isExpanded?: boolean }> = ({ data, isExpanded = false }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return <div className="p-8 text-center text-xs text-slate-400">Tidak ada data untuk grafik tren</div>;
  }

  const values = data.map(d => d.susutPct);
  const minVal = Math.max(0, Math.floor(Math.min(...values) - 1));
  const maxVal = Math.ceil(Math.max(...values) + 1);
  const range = maxVal - minVal || 1;

  const width = isExpanded ? 960 : 600;
  const height = isExpanded ? 360 : 220;
  const paddingX = isExpanded ? 60 : 40;
  const paddingY = isExpanded ? 40 : 30;
  const chartW = width - paddingX * 2;
  const chartH = height - paddingY * 2;

  const points = data.map((d, i) => {
    const x = paddingX + (i / Math.max(1, data.length - 1)) * chartW;
    const y = paddingY + chartH - ((d.susutPct - minVal) / range) * chartH;
    return { x, y, data: d };
  });

  const pathD = points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');
  const areaD = `${pathD} L ${points[points.length - 1].x} ${paddingY + chartH} L ${points[0].x} ${paddingY + chartH} Z`;

  return (
    <div className="w-full relative select-none">
      <svg viewBox={`0 0 ${width} ${height}`} className={`w-full ${isExpanded ? 'h-72 sm:h-96' : 'h-56'} overflow-visible`}>
        {/* Horizontal Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
          const y = paddingY + chartH * (1 - pct);
          const val = minVal + pct * range;
          return (
            <g key={idx}>
              <line x1={paddingX} y1={y} x2={width - paddingX} y2={y} stroke="#e2e8f0" strokeDasharray="3 3" />
              <text x={paddingX - 8} y={y + 3} textAnchor="end" className={`${isExpanded ? 'text-xs' : 'text-[10px]'} fill-slate-400 font-mono`}>
                {val.toFixed(1)}%
              </text>
            </g>
          );
        })}

        {/* Gradient area */}
        <defs>
          <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#blueGradient)" />

        {/* The line */}
        <path d={pathD} fill="none" stroke="#2563eb" strokeWidth={isExpanded ? 3.5 : 2.5} strokeLinecap="round" strokeLinejoin="round" />

        {/* Points & interactive hovers */}
        {points.map((p, i) => (
          <g key={i}>
            <circle
              cx={p.x}
              cy={p.y}
              r={hoveredIdx === i ? (isExpanded ? 8 : 6) : (isExpanded ? 5.5 : 4)}
              className={`transition-all ${hoveredIdx === i ? 'fill-blue-700 stroke-white stroke-2' : 'fill-white stroke-blue-600 stroke-2'}`}
            />
            {/* Number on point when expanded */}
            {isExpanded && (
              <text
                x={p.x}
                y={p.y - 12}
                textAnchor="middle"
                className="text-[11px] font-mono font-bold fill-blue-700 select-none"
              >
                {formatPct(p.data.susutPct)}
              </text>
            )}
            {/* Transparent touch area */}
            <circle
              cx={p.x}
              cy={p.y}
              r={isExpanded ? 28 : 20}
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            />
            {/* X-axis label */}
            <text
              x={p.x}
              y={height - (isExpanded ? 10 : 8)}
              textAnchor="middle"
              className={`${isExpanded ? 'text-xs font-semibold' : 'text-[10px] font-medium'} fill-slate-600`}
            >
              {isExpanded ? `${p.data.bulan?.substring(0, 3)} '${p.data.tahun?.slice(-2)}` : p.data.bulan?.substring(0, 3)}
            </text>
          </g>
        ))}
      </svg>

      {/* Tooltip */}
      {hoveredIdx !== null && (
        <div 
          className="absolute z-20 pointer-events-none bg-slate-900 text-white p-2.5 rounded-xl text-xs shadow-xl font-sans border border-slate-700 min-w-[140px]"
          style={{
            left: `${(points[hoveredIdx].x / width) * 100}%`,
            top: `${(points[hoveredIdx].y / height) * 100}%`,
            transform: 'translate(-50%, -125%)'
          }}
        >
          <div className="font-bold text-slate-100">{points[hoveredIdx].data.label}</div>
          <div className="text-amber-400 font-mono font-bold mt-0.5">Susut: {formatPct(points[hoveredIdx].data.susutPct)} ({formatKg(points[hoveredIdx].data.susutKg)})</div>
          <div className="text-blue-300 text-[11px] font-mono">Baku: {formatKg(points[hoveredIdx].data.baku)}</div>
          <div className="text-emerald-300 text-[11px] font-mono">Hasil: {formatKg(points[hoveredIdx].data.hasil)}</div>
        </div>
      )}
    </div>
  );
};

// 2. Bar Chart: Bahan Baku vs Hasil Jadi per Bulan
export const BakuVsHasilBarChart: React.FC<{ data: GroupSummary[]; isExpanded?: boolean }> = ({ data, isExpanded = false }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return <div className="p-8 text-center text-xs text-slate-400">Tidak ada data untuk grafik volume</div>;
  }

  const maxVal = Math.max(...data.map(d => Math.max(d.baku, d.hasil))) * 1.15 || 1000;
  const width = isExpanded ? 960 : 600;
  const height = isExpanded ? 360 : 220;
  const paddingX = isExpanded ? 70 : 50;
  const paddingY = isExpanded ? 35 : 25;
  const chartW = width - paddingX * 2;
  const chartH = height - paddingY * 2;

  const barGroupWidth = chartW / data.length;
  const barWidth = Math.min(isExpanded ? 24 : 18, barGroupWidth * 0.38);

  return (
    <div className="w-full relative select-none">
      <div className="flex items-center justify-end gap-4 text-xs mb-2">
        <span className="flex items-center gap-1.5 text-slate-700 font-medium">
          <span className="w-3 h-3 rounded bg-blue-600"></span>
          Bahan Baku (Kg)
        </span>
        <span className="flex items-center gap-1.5 text-slate-700 font-medium">
          <span className="w-3 h-3 rounded bg-emerald-600"></span>
          Hasil Jadi (Kg)
        </span>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className={`w-full ${isExpanded ? 'h-72 sm:h-96' : 'h-56'} overflow-visible`}>
        {/* Horizontal Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
          const y = paddingY + chartH * (1 - pct);
          const val = Math.round(pct * maxVal);
          return (
            <g key={idx}>
              <line x1={paddingX} y1={y} x2={width - 20} y2={y} stroke="#e2e8f0" strokeDasharray="3 3" />
              <text x={paddingX - 8} y={y + 3} textAnchor="end" className={`${isExpanded ? 'text-xs' : 'text-[10px]'} fill-slate-400 font-mono`}>
                {val.toLocaleString('id-ID')}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {data.map((d, i) => {
          const groupCenter = paddingX + i * barGroupWidth + barGroupWidth / 2;
          const hBaku = (d.baku / maxVal) * chartH;
          const hHasil = (d.hasil / maxVal) * chartH;

          const yBaku = paddingY + chartH - hBaku;
          const yHasil = paddingY + chartH - hHasil;

          return (
            <g 
              key={i} 
              className="cursor-pointer"
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {/* Baku Bar */}
              <rect
                x={groupCenter - barWidth - 1}
                y={yBaku}
                width={barWidth}
                height={hBaku}
                rx={isExpanded ? 4 : 3}
                className="fill-blue-600 hover:fill-blue-700 transition-colors"
              />
              {/* Hasil Bar */}
              <rect
                x={groupCenter + 1}
                y={yHasil}
                width={barWidth}
                height={hHasil}
                rx={isExpanded ? 4 : 3}
                className="fill-emerald-600 hover:fill-emerald-700 transition-colors"
              />
              {/* Month Label */}
              <text
                x={groupCenter}
                y={height - (isExpanded ? 8 : 6)}
                textAnchor="middle"
                className={`${isExpanded ? 'text-xs font-semibold' : 'text-[10px] font-medium'} fill-slate-600`}
              >
                {isExpanded ? `${d.bulan?.substring(0, 3)} '${d.tahun?.slice(-2)}` : d.bulan?.substring(0, 3)}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Tooltip */}
      {hoveredIdx !== null && (
        <div 
          className="absolute z-20 pointer-events-none bg-slate-900 text-white p-3 rounded-xl text-xs shadow-xl font-sans border border-slate-700 min-w-[150px]"
          style={{
            left: `${((paddingX + hoveredIdx * barGroupWidth + barGroupWidth / 2) / width) * 100}%`,
            top: '20%',
            transform: 'translateX(-50%)'
          }}
        >
          <div className="font-bold text-slate-100">{data[hoveredIdx].label}</div>
          <div className="text-blue-400 font-mono text-[11px] mt-1">Baku: {formatKg(data[hoveredIdx].baku)}</div>
          <div className="text-emerald-400 font-mono text-[11px]">Hasil: {formatKg(data[hoveredIdx].hasil)}</div>
          <div className="text-amber-400 font-mono text-[11px]">Susut: {formatKg(data[hoveredIdx].susutKg)} ({formatPct(data[hoveredIdx].susutPct)})</div>
        </div>
      )}
    </div>
  );
};

// 3. Horizontal Bar Chart: Perbandingan Susut Antar Jenis Tembakau
export const TobaccoVariantVolumeBarChart: React.FC<{ 
  data: GroupSummary[]; 
  isExpanded?: boolean;
  searchTerm?: string;
}> = ({ data, isExpanded = false, searchTerm = '' }) => {
  if (!data || data.length === 0) {
    return <div className="p-8 text-center text-xs text-slate-400">Tidak ada data jenis tembakau</div>;
  }

  let filtered = data;
  if (searchTerm && searchTerm.trim()) {
    const q = searchTerm.toLowerCase().trim();
    filtered = data.filter(d => d.label.toLowerCase().includes(q));
  }

  // Display top 8 on small card, all matching items when expanded
  const topList = isExpanded ? filtered : filtered.slice(0, 8);
  const maxSusutPct = Math.max(...topList.map(d => d.susutPct), 10);

  if (topList.length === 0) {
    return (
      <div className="p-8 text-center text-xs text-slate-400">
        Tidak ditemukan jenis tembakau yang cocok dengan &quot;{searchTerm}&quot;
      </div>
    );
  }

  return (
    <div className={`space-y-3 pt-2 ${isExpanded ? 'max-h-[520px] overflow-y-auto pr-3' : ''}`}>
      {topList.map((item, idx) => {
        const pctWidth = (item.susutPct / maxSusutPct) * 100;
        const isHigh = item.susutPct >= 8.5;
        const isLow = item.susutPct <= 5.5;

        return (
          <div key={idx} className="space-y-1.5 p-2 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200">
            <div className="flex items-center justify-between text-xs flex-wrap gap-2">
              <span className="font-semibold text-slate-800 truncate max-w-[320px] flex items-center gap-1.5">
                <span className="font-mono text-[10px] text-slate-400 w-5 inline-block">{idx + 1}.</span>
                {item.label}
              </span>
              <div className="flex items-center gap-3 font-mono text-[11px]">
                <span className="text-slate-500">Baku: <strong className="text-slate-700">{formatKg(item.baku)}</strong></span>
                {isExpanded && (
                  <span className="text-emerald-700">Hasil: <strong>{formatKg(item.hasil)}</strong></span>
                )}
                {isExpanded && (
                  <span className="text-amber-700">Susut Kg: <strong>{formatKg(item.susutKg)}</strong></span>
                )}
                <span className={`font-bold px-2 py-0.5 rounded-md ${
                  isHigh ? 'text-rose-700 bg-rose-50' : isLow ? 'text-emerald-700 bg-emerald-50' : 'text-blue-700 bg-blue-50'
                }`}>
                  Susut: {formatPct(item.susutPct)}
                </span>
              </div>
            </div>
            {/* Bar Track */}
            <div className={`${isExpanded ? 'h-3' : 'h-2'} w-full bg-slate-100 rounded-full overflow-hidden flex`}>
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isHigh ? 'bg-rose-500' : isLow ? 'bg-emerald-500' : 'bg-blue-600'
                }`}
                style={{ width: `${Math.min(100, pctWidth)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

// 4. Trend Line Chart untuk SATU Jenis Tembakau
export const TrendJenisLineChart: React.FC<{ 
  data: GroupSummary[];
  jenisTembakau: string;
  isExpanded?: boolean;
}> = ({ data, jenisTembakau, isExpanded = false }) => {
  if (!data || data.length === 0) {
    return (
      <div className="p-8 text-center text-xs text-slate-400">
        Belum ada riwayat proses bulanan untuk varian <strong>{jenisTembakau}</strong>
      </div>
    );
  }

  const values = data.map(d => d.susutPct);
  const minVal = Math.max(0, Math.floor(Math.min(...values) - 1));
  const maxVal = Math.ceil(Math.max(...values) + 1);
  const range = maxVal - minVal || 1;

  const width = isExpanded ? 960 : 500;
  const height = isExpanded ? 360 : 180;
  const paddingX = isExpanded ? 60 : 40;
  const paddingY = isExpanded ? 40 : 25;
  const chartW = width - paddingX * 2;
  const chartH = height - paddingY * 2;

  const points = data.map((d, i) => {
    const x = paddingX + (i / Math.max(1, data.length - 1)) * chartW;
    const y = paddingY + chartH - ((d.susutPct - minVal) / range) * chartH;
    return { x, y, data: d };
  });

  const pathD = points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className={`w-full ${isExpanded ? 'h-72 sm:h-96' : 'h-44'} overflow-visible`}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
          const y = paddingY + chartH * (1 - pct);
          const val = minVal + pct * range;
          return (
            <g key={idx}>
              <line x1={paddingX} y1={y} x2={width - paddingX} y2={y} stroke="#e2e8f0" strokeDasharray="3 3" />
              <text x={paddingX - 8} y={y + 3} textAnchor="end" className={`${isExpanded ? 'text-xs' : 'text-[10px]'} fill-slate-400 font-mono`}>
                {val.toFixed(1)}%
              </text>
            </g>
          );
        })}

        <path d={pathD} fill="none" stroke="#d97706" strokeWidth={isExpanded ? 3.5 : 2.5} strokeLinecap="round" strokeLinejoin="round" />

        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={isExpanded ? 6 : 4} className="fill-amber-500 stroke-white stroke-2" />
            <text x={p.x} y={p.y - (isExpanded ? 12 : 8)} textAnchor="middle" className={`${isExpanded ? 'text-xs' : 'text-[10px]'} font-mono font-bold fill-amber-700`}>
              {formatPct(p.data.susutPct)}
            </text>
            <text x={p.x} y={height - (isExpanded ? 10 : 6)} textAnchor="middle" className={`${isExpanded ? 'text-xs font-semibold' : 'text-[10px]'} fill-slate-600 font-medium`}>
              {isExpanded ? `${p.data.bulan?.substring(0, 3)} '${p.data.tahun?.slice(-2)}` : p.data.bulan?.substring(0, 3)}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};
