import React, { useState, useMemo } from 'react';
import { GroupSummary, SummaryKPI, TrendJenisData, PeriodeRange, JenisProsesType } from '../types[RekapDataProsesTembakau]';
import { formatKg, formatPct } from '../api[RekapDataProsesTembakau]';
import { TobaccoVariantVolumeBarChart, TrendJenisLineChart } from './Charts[RekapDataProsesTembakau]';
import { TableJenisRekapDataProsesTembakau } from './TableJenis[RekapDataProsesTembakau]';
import { ChartExpandedModalRekapDataProsesTembakau, ChartModalType } from './ChartExpandedModal[RekapDataProsesTembakau]';
import { 
  Layers, 
  TrendingDown, 
  Scale, 
  Award, 
  AlertTriangle, 
  CheckCircle2, 
  Maximize2, 
  FileText, 
  Filter,
  Calendar,
  Sparkles
} from 'lucide-react';

interface RekapJenisViewProps {
  rekapJenisTembakauPeriode: GroupSummary[];
  trendJenis: TrendJenisData;
  periodeRange: PeriodeRange;
  onPeriodeRangeChange: (p: PeriodeRange) => void;
  jenisProses: JenisProsesType;
  onJenisProsesChange: (j: JenisProsesType) => void;
  onSelectJenisTrend: (j: string) => void;
  onExportPdf: () => void;
}

const BULAN_OPTIONS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const RekapJenisViewRekapDataProsesTembakau: React.FC<RekapJenisViewProps> = ({
  rekapJenisTembakauPeriode,
  trendJenis,
  periodeRange,
  onPeriodeRangeChange,
  jenisProses,
  onJenisProsesChange,
  onSelectJenisTrend,
  onExportPdf
}) => {
  const [expandedChart, setExpandedChart] = useState<ChartModalType | null>(null);

  // Compute stats across tobacco varieties
  const { topVolume, mostEfficient, highestLoss, totalVolume } = useMemo(() => {
    if (!rekapJenisTembakauPeriode || rekapJenisTembakauPeriode.length === 0) {
      return { topVolume: null, mostEfficient: null, highestLoss: null, totalVolume: 0 };
    }

    const total = rekapJenisTembakauPeriode.reduce((acc, curr) => acc + curr.baku, 0);
    const sortedByVolume = [...rekapJenisTembakauPeriode].sort((a, b) => b.baku - a.baku);
    const topVol = sortedByVolume[0];

    // Filter varieties with meaningful volume (> 500 Kg) for efficiency comparison
    const meaningfulVarieties = rekapJenisTembakauPeriode.filter(v => v.baku > 500);
    const candidates = meaningfulVarieties.length > 0 ? meaningfulVarieties : rekapJenisTembakauPeriode;

    const sortedByLoss = [...candidates].sort((a, b) => a.susutPct - b.susutPct);
    const efficient = sortedByLoss[0];
    const highest = sortedByLoss[sortedByLoss.length - 1];

    return {
      topVolume: topVol,
      mostEfficient: efficient,
      highestLoss: highest,
      totalVolume: total
    };
  }, [rekapJenisTembakauPeriode]);

  return (
    <div className="space-y-6">
      
      {/* Header Banner & Period Filter */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
                <Layers className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-slate-800 tracking-tight">
                  Rekapitulasi 54 Jenis Varian Tembakau
                </h2>
                <p className="text-xs text-slate-500">
                  Analisis kapasitas volume pemrosesan (Kg), peringkat mutu, dan evaluasi efisiensi per varian
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={onExportPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors"
              title="Unduh Laporan PDF Rekap Varian Tembakau"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Export PDF Varian</span>
            </button>
          </div>
        </div>

        {/* Filters Row */}
        <div className="pt-4 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span>Rentang Periode:</span>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-xl border border-slate-200/80 text-xs">
              <select
                value={periodeRange.bulanMulai}
                onChange={(e) => onPeriodeRangeChange({ ...periodeRange, bulanMulai: e.target.value })}
                className="bg-white border border-slate-200 rounded px-2 py-0.5 text-slate-700 font-medium"
              >
                {BULAN_OPTIONS.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
              <span className="text-slate-400 font-bold">s/d</span>
              <select
                value={periodeRange.bulanAkhir}
                onChange={(e) => onPeriodeRangeChange({ ...periodeRange, bulanAkhir: e.target.value })}
                className="bg-white border border-slate-200 rounded px-2 py-0.5 text-slate-700 font-medium"
              >
                {BULAN_OPTIONS.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
              <span className="text-slate-400 font-medium">{periodeRange.tahunMulai}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <label className="text-xs text-slate-500">Jalur:</label>
              <select
                value={jenisProses}
                onChange={(e) => onJenisProsesChange(e.target.value as JenisProsesType)}
                className="text-xs border border-slate-200 rounded-lg px-2.5 py-1 bg-white font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="Semua">Semua Jalur (SKT & SKM)</option>
                <option value="SKT">SKT (Sigaret Kretek Tangan)</option>
                <option value="SKM">SKM (Sigaret Kretek Mesin)</option>
              </select>
            </div>
          </div>

          <div className="text-xs text-slate-400 font-medium">
            Total Terdata: {rekapJenisTembakauPeriode.length} Varian Aktif
          </div>
        </div>
      </div>

      {/* Variety Highlight KPI Cards (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Varian Terproses */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Katalog Varian Tembakau</span>
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Layers className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold font-mono text-slate-800">
              {rekapJenisTembakauPeriode.length} <span className="text-sm font-sans font-normal text-slate-500">Varian</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Total Volume: <span className="font-mono text-slate-600 font-medium">{formatKg(totalVolume)}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Varian Volume Terbesar */}
        <div className="bg-white rounded-2xl border border-amber-200 p-4 shadow-sm bg-gradient-to-br from-white to-amber-50/30 flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-700 text-xs font-semibold">
            <span className="flex items-center gap-1">
              <Award className="w-3.5 h-3.5" /> Volume Terbesar
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
              Top 1
            </span>
          </div>
          <div className="mt-2">
            <div className="text-base font-bold text-slate-800 truncate" title={topVolume?.label}>
              {topVolume ? topVolume.label : '-'}
            </div>
            <div className="text-[11px] text-amber-700 font-mono font-medium mt-0.5">
              {topVolume ? `${formatKg(topVolume.baku)} (${formatPct(topVolume.kapasitasPct)})` : '-'}
            </div>
          </div>
        </div>

        {/* Card 3: Varian Paling Efisien */}
        <div className="bg-white rounded-2xl border border-emerald-200 p-4 shadow-sm bg-gradient-to-br from-white to-emerald-50/30 flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-600 text-xs font-semibold">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Paling Hemat (Yield Max)
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
              Optimal
            </span>
          </div>
          <div className="mt-2">
            <div className="text-base font-bold text-slate-800 truncate" title={mostEfficient?.label}>
              {mostEfficient ? mostEfficient.label : '-'}
            </div>
            <div className="text-[11px] text-emerald-600 font-mono font-bold mt-0.5 flex items-center gap-1">
              <span>Susut Terendah: {mostEfficient ? formatPct(mostEfficient.susutPct) : '-'}</span>
            </div>
          </div>
        </div>

        {/* Card 4: Varian Susut Tertinggi */}
        <div className="bg-white rounded-2xl border border-rose-200 p-4 shadow-sm bg-gradient-to-br from-white to-rose-50/30 flex flex-col justify-between">
          <div className="flex items-center justify-between text-rose-600 text-xs font-semibold">
            <span className="flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> Susut Tertinggi
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
              Evaluasi
            </span>
          </div>
          <div className="mt-2">
            <div className="text-base font-bold text-slate-800 truncate" title={highestLoss?.label}>
              {highestLoss ? highestLoss.label : '-'}
            </div>
            <div className="text-[11px] text-rose-600 font-mono font-bold mt-0.5">
              Susut: {highestLoss ? formatPct(highestLoss.susutPct) : '-'}
            </div>
          </div>
        </div>
      </div>

      {/* 2 Variety Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Chart 1: 10 Varian Terbesar */}
        <div 
          onClick={() => setExpandedChart('tobaccoVariant')}
          className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm hover:shadow-md hover:border-blue-400 transition-all cursor-pointer group"
          title="Klik untuk memperbesar grafik varian tembakau"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
              10 Varian Teratas Berdasarkan Volume Bahan Baku (Kg)
            </h3>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setExpandedChart('tobaccoVariant');
              }}
              className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-slate-500 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 rounded-lg border border-slate-200/90 transition-colors"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Perbesar</span>
            </button>
          </div>
          <TobaccoVariantVolumeBarChart data={rekapJenisTembakauPeriode} />
        </div>

        {/* Chart 2: Interactive Individual Variety Trend */}
        <div 
          onClick={() => setExpandedChart('trendJenis')}
          className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm hover:shadow-md hover:border-blue-400 transition-all cursor-pointer group"
          title="Klik untuk memperbesar grafik tren per varian"
        >
          <div className="flex items-center justify-between mb-2 gap-2">
            <div className="min-w-0">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 truncate">
                Tren Susut Bulanan: <span className="text-blue-600">{trendJenis.jenisTembakau || 'Semua'}</span>
              </h3>
            </div>
            
            <div className="flex items-center gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              <select
                value={trendJenis.jenisTembakau}
                onChange={(e) => onSelectJenisTrend(e.target.value)}
                className="text-[11px] border border-slate-200 rounded-lg px-2 py-1 bg-white font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 max-w-[130px] truncate"
                title="Pilih varian tembakau untuk melihat tren susut bulanan"
              >
                {rekapJenisTembakauPeriode.map(v => (
                  <option key={v.label} value={v.label}>{v.label}</option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setExpandedChart('trendJenis')}
                className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-slate-500 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 rounded-lg border border-slate-200/90 transition-colors"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <TrendJenisLineChart 
            data={trendJenis.data} 
            jenisTembakau={trendJenis.jenisTembakau || ''} 
          />
        </div>
      </div>

      {/* Full Variety Table with Search and Sorting */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <span>Tabel Lengkap Rekapitulasi per Jenis Tembakau</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                Klik varian untuk melihat grafik tren
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Cari varian, sortir berdasarkan volume bahan baku, rasio susut, atau pangsa kapasitas
            </p>
          </div>
          <div className="text-xs text-slate-400 font-mono">
            {rekapJenisTembakauPeriode.length} Varian
          </div>
        </div>

        <TableJenisRekapDataProsesTembakau 
          data={rekapJenisTembakauPeriode} 
          onSelectJenisTrend={onSelectJenisTrend}
          selectedJenisTrend={trendJenis.jenisTembakau}
        />
      </div>

      {/* Chart Expanded Modal */}
      {expandedChart && (
        <ChartExpandedModalRekapDataProsesTembakau
          isOpen={!!expandedChart}
          chartType={expandedChart}
          onClose={() => setExpandedChart(null)}
          onSelectChartType={setExpandedChart}
          rekapBulan={[]}
          rekapJenisTembakauPeriode={rekapJenisTembakauPeriode}
          trendJenis={trendJenis}
          onSelectJenisTrend={onSelectJenisTrend}
        />
      )}
    </div>
  );
};
