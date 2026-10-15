import React, { useState, useMemo } from 'react';
import { GroupSummary, SummaryKPI, JenisProsesType, RawRowData } from '../types[RekapDataProsesTembakau]';
import { formatKg, formatPct, RekapDataProsesTembakauService } from '../api[RekapDataProsesTembakau]';
import { MONTH_NAMES } from '../mockData[RekapDataProsesTembakau]';
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
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  RotateCcw,
  Calendar
} from 'lucide-react';

interface RekapBulanViewProps {
  rows?: RawRowData[];
  rekapBulan: GroupSummary[];
  ringkasanTahunan: SummaryKPI;
  tahunList: string[];
  selectedTahun: string;
  onTahunChange: (t: string) => void;
  jenisProses: JenisProsesType;
  onJenisProsesChange?: (j: JenisProsesType) => void;
  onPullDatasheet?: () => void;
  isPullingDatasheet?: boolean;
  onExportPdf: () => void;
}

export const RekapBulanViewRekapDataProsesTembakau: React.FC<RekapBulanViewProps> = ({
  rows,
  rekapBulan,
  ringkasanTahunan,
  tahunList,
  selectedTahun,
  onTahunChange,
  jenisProses,
  onExportPdf
}) => {
  const [expandedChart, setExpandedChart] = useState<ChartModalType | null>(null);

  // Filter State: Rentang Periode Bulan-Tahun (Dari: Bulan, Tahun | Sampai: Bulan, Tahun)
  // Default: Semua Tahun & Semua Bulan
  const [startBulan, setStartBulan] = useState<string>('Semua');
  const [startTahun, setStartTahun] = useState<string>('Semua');
  const [endBulan, setEndBulan] = useState<string>('Semua');
  const [endTahun, setEndTahun] = useState<string>('Semua');

  // Compute all available monthly records (across all years for currently selected Jalur)
  const allMonthsData = useMemo(() => {
    if (rows && rows.length > 0) {
      return RekapDataProsesTembakauService.computeRekapBulan(rows, 'Semua', jenisProses);
    }
    return rekapBulan;
  }, [rows, rekapBulan, jenisProses]);

  // Extract list of unique available years sorted ascending
  const availableYears = useMemo(() => {
    const yearsSet = new Set<string>();
    if (tahunList && tahunList.length > 0) {
      tahunList.forEach(t => { if (t && t !== 'Semua') yearsSet.add(t); });
    }
    allMonthsData.forEach(m => {
      if (m.tahun && m.tahun !== 'Semua') yearsSet.add(m.tahun);
    });
    return Array.from(yearsSet).sort();
  }, [tahunList, allMonthsData]);

  const minYearNum = useMemo(() => {
    const nums = availableYears.map(y => parseInt(y, 10)).filter(n => !isNaN(n));
    return nums.length > 0 ? Math.min(...nums) : 2020;
  }, [availableYears]);

  const maxYearNum = useMemo(() => {
    const nums = availableYears.map(y => parseInt(y, 10)).filter(n => !isNaN(n));
    return nums.length > 0 ? Math.max(...nums) : 2030;
  }, [availableYears]);

  const isFilterActive = startBulan !== 'Semua' || startTahun !== 'Semua' || endBulan !== 'Semua' || endTahun !== 'Semua';

  // Filtered monthly data based on startBulan, startTahun, endBulan, endTahun (automatically applied immediately)
  const displayedRekapBulan = useMemo(() => {
    if (!isFilterActive) {
      return allMonthsData;
    }

    const isYearFilterActive = startTahun !== 'Semua' || endTahun !== 'Semua';
    const isMonthFilterActive = startBulan !== 'Semua' || endBulan !== 'Semua';

    if (!isYearFilterActive && isMonthFilterActive) {
      // Month-only filtering across years
      const sIdx = startBulan !== 'Semua' ? MONTH_NAMES.indexOf(startBulan) : 0;
      const eIdx = endBulan !== 'Semua' ? MONTH_NAMES.indexOf(endBulan) : 11;
      const minMonth = Math.min(sIdx, eIdx);
      const maxMonth = Math.max(sIdx, eIdx);

      return allMonthsData.filter(item => {
        const itemMonthIdx = MONTH_NAMES.indexOf(item.bulan || '');
        return itemMonthIdx >= minMonth && itemMonthIdx <= maxMonth;
      });
    }

    let minKey = -Infinity;
    let maxKey = Infinity;

    // Start key computation
    if (startTahun !== 'Semua') {
      const sYear = parseInt(startTahun, 10);
      const sMonthIdx = startBulan !== 'Semua' ? MONTH_NAMES.indexOf(startBulan) : 0;
      minKey = sYear * 12 + Math.max(0, sMonthIdx);
    } else if (startBulan !== 'Semua') {
      const sMonthIdx = MONTH_NAMES.indexOf(startBulan);
      minKey = minYearNum * 12 + Math.max(0, sMonthIdx);
    }

    // End key computation
    if (endTahun !== 'Semua') {
      const eYear = parseInt(endTahun, 10);
      const eMonthIdx = endBulan !== 'Semua' ? MONTH_NAMES.indexOf(endBulan) : 11;
      maxKey = eYear * 12 + (eMonthIdx >= 0 ? eMonthIdx : 11);
    } else if (endBulan !== 'Semua') {
      const eMonthIdx = MONTH_NAMES.indexOf(endBulan);
      maxKey = maxYearNum * 12 + (eMonthIdx >= 0 ? eMonthIdx : 11);
    }

    // Swap if inverted
    if (minKey !== -Infinity && maxKey !== Infinity && minKey > maxKey) {
      const temp = minKey;
      minKey = maxKey;
      maxKey = temp;
    }

    return allMonthsData.filter(item => {
      const itemMonthIdx = MONTH_NAMES.indexOf(item.bulan || '');
      const itemYear = parseInt(item.tahun || '0', 10);
      const itemKey = itemYear * 12 + (itemMonthIdx >= 0 ? itemMonthIdx : 0);

      return itemKey >= minKey && itemKey <= maxKey;
    });
  }, [allMonthsData, isFilterActive, startBulan, startTahun, endBulan, endTahun, minYearNum, maxYearNum]);

  // Compute highest & lowest loss months, total baku, total hasil, and weighted susut % from filtered data
  const { maxLossMonth, minLossMonth, totalHasil, totalBaku, weightedSusutPct } = useMemo(() => {
    if (!displayedRekapBulan || displayedRekapBulan.length === 0) {
      return { 
        maxLossMonth: null, 
        minLossMonth: null, 
        totalHasil: 0, 
        totalBaku: 0, 
        weightedSusutPct: 0 
      };
    }

    const validMonths = displayedRekapBulan.filter(m => m.baku > 0);
    if (validMonths.length === 0) {
      return { 
        maxLossMonth: null, 
        minLossMonth: null, 
        totalHasil: 0, 
        totalBaku: 0, 
        weightedSusutPct: 0 
      };
    }

    const sortedByLoss = [...validMonths].sort((a, b) => b.susutPct - a.susutPct);
    const max = sortedByLoss[0];
    const min = sortedByLoss[sortedByLoss.length - 1];
    const hasil = validMonths.reduce((acc, curr) => acc + curr.hasil, 0);
    const baku = validMonths.reduce((acc, curr) => acc + curr.baku, 0);
    const susutKg = validMonths.reduce((acc, curr) => acc + curr.susutKg, 0);
    const weighted = baku > 0 ? (susutKg / baku) * 100 : 0;

    return { 
      maxLossMonth: max, 
      minLossMonth: min, 
      totalHasil: Math.round(hasil * 10) / 10, 
      totalBaku: Math.round(baku * 10) / 10, 
      weightedSusutPct: Math.round(weighted * 100) / 100 
    };
  }, [displayedRekapBulan]);

  const handleResetFilter = () => {
    setStartBulan('Semua');
    setStartTahun('Semua');
    setEndBulan('Semua');
    setEndTahun('Semua');
  };

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
            {/* Note: Redundant 'Tarik Datasheet' has been removed because it is already present in Header */}
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

        {/* Filters Row: Format persis seperti format pada gambar (Dari: [Bulan] [Tahun] | Sampai: [Bulan] [Tahun]) */}
        {/* Setiap perubahan bulan atau tahun secara otomatis diterapkan pada grafik dan data dibawahnya tanpa harus klik tombol 'Terapkan' */}
        <div className="pt-4 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold mr-1">
              <Filter className="w-3.5 h-3.5 text-blue-600" />
              <span>Filter Rentang Periode:</span>
            </div>

            {/* Filter Container matching gambar format */}
            <div className="no-print flex items-center gap-1.5 sm:gap-2 flex-wrap bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
              
              {/* Bagian Dari */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-600">Dari:</span>
                <select
                  value={startBulan}
                  onChange={(e) => setStartBulan(e.target.value)}
                  className="text-xs border border-slate-200 rounded-lg px-2.5 py-1 bg-white font-medium text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs cursor-pointer"
                  title="Pilih Bulan Awal"
                >
                  <option value="Semua">Semua Bulan</option>
                  {MONTH_NAMES.map((b) => (
                    <option key={`start-b-${b}`} value={b}>{b}</option>
                  ))}
                </select>
                <select
                  value={startTahun}
                  onChange={(e) => setStartTahun(e.target.value)}
                  className="text-xs border border-slate-200 rounded-lg px-2.5 py-1 bg-white font-medium text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs cursor-pointer"
                  title="Pilih Tahun Awal"
                >
                  <option value="Semua">Semua Tahun</option>
                  {availableYears.map((t) => (
                    <option key={`start-t-${t}`} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Pemisah / Arrow */}
              <span className="text-xs font-bold text-slate-400 px-1">s/d</span>

              {/* Bagian Sampai */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-600">Sampai:</span>
                <select
                  value={endBulan}
                  onChange={(e) => setEndBulan(e.target.value)}
                  className="text-xs border border-slate-200 rounded-lg px-2.5 py-1 bg-white font-medium text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs cursor-pointer"
                  title="Pilih Bulan Akhir"
                >
                  <option value="Semua">Semua Bulan</option>
                  {MONTH_NAMES.map((b) => (
                    <option key={`end-b-${b}`} value={b}>{b}</option>
                  ))}
                </select>
                <select
                  value={endTahun}
                  onChange={(e) => setEndTahun(e.target.value)}
                  className="text-xs border border-slate-200 rounded-lg px-2.5 py-1 bg-white font-medium text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs cursor-pointer"
                  title="Pilih Tahun Akhir"
                >
                  <option value="Semua">Semua Tahun</option>
                  {availableYears.map((t) => (
                    <option key={`end-t-${t}`} value={t}>{t}</option>
                  ))}
                </select>
              </div>

            </div>

            {/* Tombol Reset Cepat (Hanya muncul jika filter aktif) */}
            {isFilterActive && (
              <button
                onClick={handleResetFilter}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition-colors shadow-2xs"
                title="Reset filter kembali ke Semua Periode (Default)"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
              isFilterActive 
                ? 'bg-blue-50 text-blue-700 border-blue-200/80' 
                : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isFilterActive ? 'bg-blue-600 animate-pulse' : 'bg-slate-400'}`}></span>
              <span>
                {isFilterActive
                  ? `${displayedRekapBulan.length} Bulan Terpilih`
                  : `Semua Periode (${displayedRekapBulan.length} Bulan)`}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Monthly Highlight KPI Cards (4 Cards) - Dynamically Updated by Filter */}
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
              {formatKg(totalBaku)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Hasil Jadi: <span className="font-mono text-slate-600 font-medium">{formatKg(totalHasil)}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Rerata Susut */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Rerata Susut Periode</span>
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <TrendingDown className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold font-mono text-blue-600">
              {formatPct(weightedSusutPct)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Rasio Tertimbang ({displayedRekapBulan.length} Bulan)
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

      {/* 2 Monthly Interactive Charts - Dynamically Updated */}
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
          <MonthlyLossLineChart data={displayedRekapBulan} />
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
          <BakuVsHasilBarChart data={displayedRekapBulan} />
        </div>
      </div>

      {/* Full Monthly Detail Table - Dynamically Updated */}
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
          <div className="text-xs text-slate-500 font-mono font-medium">
            {displayedRekapBulan.length} Baris Data
          </div>
        </div>

        <TableBulanRekapDataProsesTembakau data={displayedRekapBulan} />
      </div>

      {/* Chart Expanded Modal */}
      {expandedChart && (
        <ChartExpandedModalRekapDataProsesTembakau
          isOpen={!!expandedChart}
          chartType={expandedChart}
          onClose={() => setExpandedChart(null)}
          onSelectChartType={setExpandedChart}
          rekapBulan={displayedRekapBulan}
          rekapJenisTembakauPeriode={[]}
          trendJenis={{ jenisTembakau: '', data: [] }}
          onSelectJenisTrend={() => {}}
          ringkasanTahunan={ringkasanTahunan}
        />
      )}
    </div>
  );
};
