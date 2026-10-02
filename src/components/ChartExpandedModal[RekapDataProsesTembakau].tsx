import React, { useState, useEffect } from 'react';
import { GroupSummary, TrendJenisData, SummaryKPI } from '../types[RekapDataProsesTembakau]';
import { formatKg, formatPct } from '../api[RekapDataProsesTembakau]';
import { 
  MonthlyLossLineChart, 
  BakuVsHasilBarChart, 
  TobaccoVariantVolumeBarChart, 
  TrendJenisLineChart 
} from './Charts[RekapDataProsesTembakau]';
import { 
  X, 
  Minimize2, 
  ChevronLeft, 
  ChevronRight, 
  TrendingDown, 
  BarChart3, 
  Layers, 
  Search, 
  ArrowUpRight, 
  ArrowDownRight, 
  Scale, 
  Info
} from 'lucide-react';

export type ChartModalType = 'monthlyLoss' | 'bakuVsHasil' | 'tobaccoVariant' | 'trendJenis';

interface ChartExpandedModalProps {
  isOpen: boolean;
  chartType: ChartModalType;
  onClose: () => void;
  onSelectChartType: (type: ChartModalType) => void;
  rekapBulan: GroupSummary[];
  rekapJenisTembakauPeriode: GroupSummary[];
  trendJenis: TrendJenisData;
  onSelectJenisTrend: (jenis: string) => void;
  ringkasanTahunan?: SummaryKPI;
  ringkasanBulanan?: SummaryKPI;
  ringkasanPeriode?: SummaryKPI;
}

export const ChartExpandedModalRekapDataProsesTembakau: React.FC<ChartExpandedModalProps> = ({
  isOpen,
  chartType,
  onClose,
  onSelectChartType,
  rekapBulan,
  rekapJenisTembakauPeriode,
  trendJenis,
  onSelectJenisTrend,
  ringkasanTahunan,
  ringkasanPeriode
}) => {
  const [variantSearch, setVariantSearch] = useState('');

  // Close on ESC key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        goToNextChart();
      } else if (e.key === 'ArrowLeft') {
        goToPrevChart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, chartType]);

  if (!isOpen) return null;

  const chartConfigs: { id: ChartModalType; label: string; icon: React.FC<{ className?: string }>; description: string }[] = [
    {
      id: 'monthlyLoss',
      label: 'Tren Susut Bulanan (%)',
      icon: TrendingDown,
      description: 'Grafik fluktuasi persentase kesusutan rata-rata per bulan'
    },
    {
      id: 'bakuVsHasil',
      label: 'Bahan Baku vs Hasil (Kg)',
      icon: BarChart3,
      description: 'Perbandingan komparatif volume input bahan baku terhadap output hasil jadi'
    },
    {
      id: 'tobaccoVariant',
      label: 'Susut per Varian (54 Jenis)',
      icon: Layers,
      description: 'Daftar perbandingan persentase susut antar seluruh varian tembakau'
    },
    {
      id: 'trendJenis',
      label: 'Trend Kesusutan Varian Spesifik',
      icon: TrendingDown,
      description: 'Riwayat dinamika kesusutan per bulan untuk varian tembakau terpilih'
    }
  ];

  const currentIdx = chartConfigs.findIndex(c => c.id === chartType);
  const currentConfig = chartConfigs[currentIdx] || chartConfigs[0];

  const goToNextChart = () => {
    const nextIdx = (currentIdx + 1) % chartConfigs.length;
    onSelectChartType(chartConfigs[nextIdx].id);
  };

  const goToPrevChart = () => {
    const prevIdx = (currentIdx - 1 + chartConfigs.length) % chartConfigs.length;
    onSelectChartType(chartConfigs[prevIdx].id);
  };

  // Helper stats for monthlyLoss
  const monthlyStats = (() => {
    if (!rekapBulan || rekapBulan.length === 0) return null;
    let maxMonth = rekapBulan[0];
    let minMonth = rekapBulan[0];
    let totalBaku = 0;
    let totalHasil = 0;
    let totalSusut = 0;

    for (const m of rekapBulan) {
      if (m.susutPct > maxMonth.susutPct) maxMonth = m;
      if (m.susutPct < minMonth.susutPct) minMonth = m;
      totalBaku += m.baku;
      totalHasil += m.hasil;
      totalSusut += m.susutKg;
    }
    const avgSusutPct = totalBaku > 0 ? (totalSusut / totalBaku) * 100 : 0;
    return { maxMonth, minMonth, totalBaku, totalHasil, totalSusut, avgSusutPct };
  })();

  // Helper stats for bakuVsHasil
  const bakuHasilStats = (() => {
    if (!rekapBulan || rekapBulan.length === 0) return null;
    const totalBaku = rekapBulan.reduce((acc, m) => acc + m.baku, 0);
    const totalHasil = rekapBulan.reduce((acc, m) => acc + m.hasil, 0);
    const totalSusut = totalBaku - totalHasil;
    const rendemenPct = totalBaku > 0 ? (totalHasil / totalBaku) * 100 : 0;
    const susutPct = totalBaku > 0 ? (totalSusut / totalBaku) * 100 : 0;
    return { totalBaku, totalHasil, totalSusut, rendemenPct, susutPct };
  })();

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-5xl max-h-[92vh] bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="bg-slate-900 text-white px-5 sm:px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <currentConfig.icon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-bold text-base sm:text-lg text-slate-100">
                  {currentConfig.label}
                </h2>
                <span className="text-[11px] font-semibold bg-blue-600/40 text-blue-300 border border-blue-500/40 px-2 py-0.5 rounded-full">
                  Tampilan Diperbesar
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {currentConfig.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1 bg-slate-800/90 rounded-xl p-1 border border-slate-700">
              <button
                onClick={goToPrevChart}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                title="Grafik Sebelumnya (Panah Kiri)"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-[11px] font-mono text-slate-400 px-1.5">
                {currentIdx + 1} / {chartConfigs.length}
              </span>
              <button
                onClick={goToNextChart}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                title="Grafik Selanjutnya (Panah Kanan)"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors border border-slate-700"
              title="Tutup (ESC)"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tutup</span>
              <kbd className="hidden md:inline-block text-[10px] bg-slate-900 px-1 py-0.2 rounded text-slate-400 font-mono ml-0.5">Esc</kbd>
            </button>
          </div>
        </div>

        {/* Quick Chart Switcher Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 sm:px-6 py-2.5 flex items-center gap-2 overflow-x-auto">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider shrink-0 mr-1">
            Pilih Grafik:
          </span>
          {chartConfigs.map((cfg) => {
            const isActive = cfg.id === chartType;
            const Icon = cfg.icon;
            return (
              <button
                key={cfg.id}
                onClick={() => onSelectChartType(cfg.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/90 hover:border-slate-300 hover:bg-slate-100/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{cfg.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          
          {/* 1. Monthly Loss Line Chart */}
          {chartType === 'monthlyLoss' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="bg-slate-50/70 border border-slate-200/90 rounded-2xl p-4 sm:p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">
                      Fluktuasi Kesusutan Rata-rata Bulanan
                    </h3>
                    <p className="text-xs text-slate-500">
                      Garis menunjukkan pergerakan persentase susut bobot tembakau di setiap periode bulan
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                      <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                      Susut (%)
                    </span>
                  </div>
                </div>

                <MonthlyLossLineChart data={rekapBulan} isExpanded={true} />
              </div>

              {/* Monthly Stats KPI Row */}
              {monthlyStats && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-sm">
                    <div className="text-[11px] font-semibold text-slate-400 uppercase">Susut Tertinggi</div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <ArrowUpRight className="w-4 h-4 text-rose-500" />
                      <span className="text-sm sm:text-base font-bold text-rose-600 font-mono">
                        {formatPct(monthlyStats.maxMonth.susutPct)}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                      Bulan: {monthlyStats.maxMonth.label}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-sm">
                    <div className="text-[11px] font-semibold text-slate-400 uppercase">Susut Terendah</div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <ArrowDownRight className="w-4 h-4 text-emerald-500" />
                      <span className="text-sm sm:text-base font-bold text-emerald-600 font-mono">
                        {formatPct(monthlyStats.minMonth.susutPct)}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                      Bulan: {monthlyStats.minMonth.label}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-sm">
                    <div className="text-[11px] font-semibold text-slate-400 uppercase">Rata-rata Susut</div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Scale className="w-4 h-4 text-blue-500" />
                      <span className="text-sm sm:text-base font-bold text-blue-700 font-mono">
                        {formatPct(monthlyStats.avgSusutPct)}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                      Total Susut: {formatKg(monthlyStats.totalSusut)}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-sm">
                    <div className="text-[11px] font-semibold text-slate-400 uppercase">Total Bahan Baku</div>
                    <div className="text-sm sm:text-base font-bold text-slate-800 font-mono mt-1">
                      {formatKg(monthlyStats.totalBaku)}
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                      Hasil: {formatKg(monthlyStats.totalHasil)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2. Baku vs Hasil Bar Chart */}
          {chartType === 'bakuVsHasil' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="bg-slate-50/70 border border-slate-200/90 rounded-2xl p-4 sm:p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">
                      Perbandingan Volume Bahan Baku vs Hasil Jadi
                    </h3>
                    <p className="text-xs text-slate-500">
                      Batang biru menunjukkan volume masukan (Kg) dan batang hijau menunjukkan volume luaran (Kg)
                    </p>
                  </div>
                </div>

                <BakuVsHasilBarChart data={rekapBulan} isExpanded={true} />
              </div>

              {/* Baku vs Hasil Stats KPI Row */}
              {bakuHasilStats && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-white rounded-2xl border border-blue-200/80 p-3.5 shadow-sm">
                    <div className="text-[11px] font-semibold text-blue-600 uppercase">Total Bahan Baku</div>
                    <div className="text-sm sm:text-base font-bold text-blue-900 font-mono mt-1">
                      {formatKg(bakuHasilStats.totalBaku)}
                    </div>
                    <div className="text-[11px] text-blue-600/80 font-medium mt-0.5">100% Volume Input</div>
                  </div>

                  <div className="bg-white rounded-2xl border border-emerald-200/80 p-3.5 shadow-sm">
                    <div className="text-[11px] font-semibold text-emerald-600 uppercase">Total Hasil Jadi</div>
                    <div className="text-sm sm:text-base font-bold text-emerald-900 font-mono mt-1">
                      {formatKg(bakuHasilStats.totalHasil)}
                    </div>
                    <div className="text-[11px] text-emerald-600/80 font-medium mt-0.5">
                      Rendemen: {formatPct(bakuHasilStats.rendemenPct)}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-amber-200/80 p-3.5 shadow-sm">
                    <div className="text-[11px] font-semibold text-amber-700 uppercase">Total Kesusutan</div>
                    <div className="text-sm sm:text-base font-bold text-amber-900 font-mono mt-1">
                      {formatKg(bakuHasilStats.totalSusut)}
                    </div>
                    <div className="text-[11px] text-amber-700/80 font-medium mt-0.5">
                      Selisih: {formatPct(bakuHasilStats.susutPct)}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-sm">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase">Rasio Efisiensi</div>
                    <div className="text-sm sm:text-base font-bold text-slate-800 font-mono mt-1">
                      {formatPct(bakuHasilStats.rendemenPct)}
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                      Output per Input
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 3. Tobacco Variant Volume Bar Chart */}
          {chartType === 'tobaccoVariant' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">
                      Peringkat Kesusutan 54 Varian Tembakau
                    </h3>
                    <p className="text-xs text-slate-500">
                      Diurutkan berdasarkan volume input bahan baku. Gunakan pencarian untuk memfilter jenis spesifik.
                    </p>
                  </div>

                  {/* Search box for variant */}
                  <div className="relative min-w-[240px]">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Cari jenis tembakau..."
                      value={variantSearch}
                      onChange={(e) => setVariantSearch(e.target.value)}
                      className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50"
                    />
                    {variantSearch && (
                      <button
                        onClick={() => setVariantSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>

                <TobaccoVariantVolumeBarChart 
                  data={rekapJenisTembakauPeriode} 
                  isExpanded={true} 
                  searchTerm={variantSearch}
                />
              </div>
            </div>
          )}

          {/* 4. Trend Jenis Line Chart */}
          {chartType === 'trendJenis' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">
                      Riwayat Tren Kesusutan per Varian Tembakau
                    </h3>
                    <p className="text-xs text-slate-500">
                      Pilih varian tembakau di bawah untuk melihat pola pergerakan susut bulanan
                    </p>
                  </div>

                  {/* Dropdown to change variant directly inside modal */}
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-slate-600">Pilih Varian:</label>
                    <select
                      value={trendJenis.jenisTembakau || ''}
                      onChange={(e) => onSelectJenisTrend(e.target.value)}
                      className="text-xs border border-slate-200 rounded-xl px-3 py-1.5 bg-white font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 max-w-[280px]"
                    >
                      {rekapJenisTembakauPeriode.map((v) => (
                        <option key={v.label} value={v.label}>
                          {v.label} ({formatPct(v.susutPct)})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="bg-amber-50/50 border border-amber-200/60 rounded-2xl p-4 mb-4">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-bold text-amber-900">
                      Varian Aktif: {trendJenis.jenisTembakau || 'Belum dipilih'}
                    </span>
                    <span className="text-amber-700 font-medium">
                      {trendJenis.data.length} Periode Bulan Tersedia
                    </span>
                  </div>
                  <TrendJenisLineChart 
                    data={trendJenis.data} 
                    jenisTembakau={trendJenis.jenisTembakau || ''} 
                    isExpanded={true} 
                  />
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Bottom Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 sm:px-6 py-3 flex items-center justify-between flex-wrap gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span>
              Tip: Tekan tombol <strong>ESC</strong> atau klik area luar modal untuk menutup. Gunakan tombol panah kiri / kanan untuk berganti grafik.
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold transition-colors"
          >
            Tutup Tampilan
          </button>
        </div>
      </div>
    </div>
  );
};
