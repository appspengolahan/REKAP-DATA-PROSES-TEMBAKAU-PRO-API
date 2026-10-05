import React, { useState, useMemo } from 'react';
import { GroupSummary, SummaryKPI, JenisProsesType } from '../types[RekapDataProsesTembakau]';
import { formatKg, formatPct } from '../api[RekapDataProsesTembakau]';
import { MonthlyLossLineChart, BakuVsHasilBarChart } from './Charts[RekapDataProsesTembakau]';
import { TableBulanRekapDataProsesTembakau } from './TableBulan[RekapDataProsesTembakau]';
import { ChartExpandedModalRekapDataProsesTembakau, ChartModalType } from './ChartExpandedModal[RekapDataProsesTembakau]';
import { 
  CalendarDays, 
  TrendingDown, 
  Scale, 
  AlertTriangle, 
  CheckCircle2, 
  Maximize2, 
  FileText, 
  Database,
  Filter,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

interface RekapBulanViewProps {
  rekapBulan: GroupSummary[];
  ringkasanTahunan: SummaryKPI;
  tahunList: string[];
  selectedTahun: string;
  onTahunChange: (t: string) => void;
  jenisProses: JenisProsesType;
  onJenisProsesChange: (j: JenisProsesType) => void;
  onPullDatasheet?: () => void;
  isPullingDatasheet?: boolean;
  onExportPdf: () => void;
}

export const RekapBulanViewRekapDataProsesTembakau: React.FC<RekapBulanViewProps> = ({
  rekapBulan,
  ringkasanTahunan,
  tahunList,
  selectedTahun,
  onTahunChange,
  jenisProses,
  onJenisProsesChange,
  onPullDatasheet,
  isPullingDatasheet,
  onExportPdf
}) => {
  const [expandedChart, setExpandedChart] = useState<ChartModalType | null>(null);

  // Compute highest & lowest loss months from actual data
  const { maxLossMonth, minLossMonth, totalHasil } = useMemo(() => {
    if (!rekapBulan || rekapBulan.length === 0) {
      return { maxLossMonth: null, minLossMonth: null, totalHasil: 0 };
    }

    const validMonths = rekapBulan.filter(m => m.baku > 0);
    if (validMonths.length === 0) {
      return { maxLossMonth: null, minLossMonth: null, totalHasil: 0 };
    }

    const sortedByLoss = [...validMonths].sort((a, b) => b.susutPct - a.susutPct);
    const max = sortedByLoss[0];
    const min = sortedByLoss[sortedByLoss.length - 1];
    const hasil = validMonths.reduce((acc, curr) => acc + curr.hasil, 0);

    return { maxLossMonth: max, minLossMonth: min, totalHasil: hasil };
  }, [rekapBulan]);

  return (
    <div className="space-y-6">
      
      {/* Header Banner & Filter */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <CalendarDays className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-slate-800 tracking-tight">
                  Rekapitulasi Kesusutan per Bulan
                </h2>
                <p className="text-xs text-slate-500">
                  Analisis deret waktu pemrosesan tembakau bulanan, rasio bahan baku vs hasil jadi, dan deviasi mutu
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {onPullDatasheet && (
              <button
                onClick={onPullDatasheet}
                disabled={isPullingDatasheet}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors ${
                  isPullingDatasheet ? 'opacity-70 cursor-not-allowed' : ''
                }`}
                title="Tarik Data Terkini dari Datasheet Google Sheet"
              >
                <Database className={`w-3.5 h-3.5 ${isPullingDatasheet ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{isPullingDatasheet ? 'Menarik...' : 'Tarik Datasheet'}</span>
              </button>
            )}

            <button
              onClick={onExportPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors"
              title="Unduh Laporan PDF Rekap Bulanan"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Export PDF Bulanan</span>
            </button>
          </div>
        </div>

        {/* Filters Row */}
        <div className="pt-4 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span>Filter Data:</span>
            </div>

            <div className="flex items-center gap-1.5">
              <label className="text-xs text-slate-500">Tahun:</label>
              <select
                value={selectedTahun}
                onChange={(e) => onTahunChange(e.target.value)}
                className="text-xs border border-slate-200 rounded-lg px-2.5 py-1 bg-white font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="Semua">Semua Tahun</option>
                {tahunList.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
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
            Periode Data: {rekapBulan.length} Bulan Aktif Terdata
          </div>
        </div>
      </div>

      {/* Monthly Highlight KPI Cards (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Baku */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Bahan Baku Terproses</span>
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <Scale className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold font-mono text-slate-800">
              {formatKg(ringkasanTahunan.baku)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Hasil Jadi: <span className="font-mono text-slate-600 font-medium">{formatKg(totalHasil)}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Rerata Susut */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Rerata Susut Tahunan</span>
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <TrendingDown className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold font-mono text-blue-600">
              {formatPct(ringkasanTahunan.susutPct)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Rasio Tertimbang Kumulatif
            </div>
          </div>
        </div>

        {/* Card 3: Bulan Susut Tertinggi */}
        <div className="bg-white rounded-2xl border border-rose-200 p-4 shadow-sm bg-gradient-to-br from-white to-rose-50/30 flex flex-col justify-between">
          <div className="flex items-center justify-between text-rose-600 text-xs font-semibold">
            <span className="flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" /> Susut Tertinggi
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
              Waspada
            </span>
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold text-slate-800 truncate">
              {maxLossMonth ? maxLossMonth.label : '-'}
            </div>
            <div className="text-[11px] text-rose-600 font-mono font-bold mt-0.5 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Susut: {maxLossMonth ? formatPct(maxLossMonth.susutPct) : '-'}
            </div>
          </div>
        </div>

        {/* Card 4: Bulan Paling Efisien */}
        <div className="bg-white rounded-2xl border border-emerald-200 p-4 shadow-sm bg-gradient-to-br from-white to-emerald-50/30 flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-600 text-xs font-semibold">
            <span className="flex items-center gap-1">
              <ArrowDownRight className="w-3.5 h-3.5" /> Paling Efisien
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
              Optimal
            </span>
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold text-slate-800 truncate">
              {minLossMonth ? minLossMonth.label : '-'}
            </div>
            <div className="text-[11px] text-emerald-600 font-mono font-bold mt-0.5 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Susut Terendah: {minLossMonth ? formatPct(minLossMonth.susutPct) : '-'}
            </div>
          </div>
        </div>
      </div>

      {/* 2 Monthly Interactive Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Chart 1: Tren Susut Bulanan */}
        <div 
          onClick={() => setExpandedChart('monthlyLoss')}
          className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm hover:shadow-md hover:border-blue-400 transition-all cursor-pointer group"
          title="Klik untuk memperbesar grafik tren susut bulanan"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
              Tren Susut Rata-rata (%) per Bulan
            </h3>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setExpandedChart('monthlyLoss');
              }}
              className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-slate-500 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 rounded-lg border border-slate-200/90 transition-colors"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Perbesar</span>
            </button>
          </div>
          <MonthlyLossLineChart data={rekapBulan} />
        </div>

        {/* Chart 2: Baku vs Hasil Bar Chart */}
        <div 
          onClick={() => setExpandedChart('bakuVsHasil')}
          className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm hover:shadow-md hover:border-blue-400 transition-all cursor-pointer group"
          title="Klik untuk memperbesar grafik bahan baku vs hasil"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
              Bahan Baku vs Hasil Jadi per Bulan (Kg)
            </h3>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setExpandedChart('bakuVsHasil');
              }}
              className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-slate-500 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 rounded-lg border border-slate-200/90 transition-colors"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Perbesar</span>
            </button>
          </div>
          <BakuVsHasilBarChart data={rekapBulan} />
        </div>
      </div>

      {/* Full Monthly Detail Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Tabel Kinerja Kesusutan per Bulan
            </h3>
            <p className="text-xs text-slate-500">
              Rincian bahan baku, hasil jadi, susut netto, rasio gagang & debu, serta rentang min/max
            </p>
          </div>
          <div className="text-xs text-slate-400 font-mono">
            {rekapBulan.length} Baris Data
          </div>
        </div>

        <TableBulanRekapDataProsesTembakau data={rekapBulan} />
      </div>

      {/* Chart Expanded Modal */}
      {expandedChart && (
        <ChartExpandedModalRekapDataProsesTembakau
          isOpen={!!expandedChart}
          chartType={expandedChart}
          onClose={() => setExpandedChart(null)}
          onSelectChartType={setExpandedChart}
          rekapBulan={rekapBulan}
          rekapJenisTembakauPeriode={[]}
          trendJenis={{ jenisTembakau: '', data: [] }}
          onSelectJenisTrend={() => {}}
          ringkasanTahunan={ringkasanTahunan}
        />
      )}
    </div>
  );
};
