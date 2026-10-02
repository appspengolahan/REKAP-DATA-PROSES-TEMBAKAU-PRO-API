import React, { useState } from 'react';
import { 
  SummaryKPI, 
  GroupSummary, 
  TrendJenisData, 
  PeriodeRange, 
  JenisProsesType 
} from '../types[RekapDataProsesTembakau]';
import { SummaryCardsRekapDataProsesTembakau } from './SummaryCards[RekapDataProsesTembakau]';
import { 
  MonthlyLossLineChart, 
  BakuVsHasilBarChart, 
  TobaccoVariantVolumeBarChart, 
  TrendJenisLineChart 
} from './Charts[RekapDataProsesTembakau]';
import { TableBulanRekapDataProsesTembakau } from './TableBulan[RekapDataProsesTembakau]';
import { TableJenisRekapDataProsesTembakau } from './TableJenis[RekapDataProsesTembakau]';
import { 
  ChartExpandedModalRekapDataProsesTembakau, 
  ChartModalType 
} from './ChartExpandedModal[RekapDataProsesTembakau]';
import { CalendarDays, Layers, FileText, RefreshCw, Filter, TrendingDown, Database, Maximize2 } from 'lucide-react';

interface DashboardViewProps {
  ringkasanTahunan: SummaryKPI;
  ringkasanBulanan: SummaryKPI;
  ringkasanPeriode: SummaryKPI;
  rekapBulan: GroupSummary[];
  rekapJenisTembakauPeriode: GroupSummary[];
  trendJenis: TrendJenisData;
  tahunList: string[];
  selectedTahun: string;
  onTahunChange: (t: string) => void;
  bulanList: string[];
  selectedBulanRingkasan: string;
  onBulanRingkasanChange: (b: string) => void;
  selectedTahunBulanan: string;
  onTahunBulananChange: (t: string) => void;
  jenisProses: JenisProsesType;
  onJenisProsesChange: (j: JenisProsesType) => void;
  periodeRange: PeriodeRange;
  onPeriodeRangeChange: (p: PeriodeRange) => void;
  onApplyPeriode: () => void;
  onSelectJenisTrend: (j: string) => void;
  onRefresh: () => void;
  onPullDatasheet?: () => void;
  isPullingDatasheet?: boolean;
  onExportSummaryPdf: () => void;
  onExportTabPdf: (tabName: string) => void;
}

export const DashboardViewRekapDataProsesTembakau: React.FC<DashboardViewProps> = ({
  ringkasanTahunan,
  ringkasanBulanan,
  ringkasanPeriode,
  rekapBulan,
  rekapJenisTembakauPeriode,
  trendJenis,
  tahunList,
  selectedTahun,
  onTahunChange,
  bulanList,
  selectedBulanRingkasan,
  onBulanRingkasanChange,
  selectedTahunBulanan,
  onTahunBulananChange,
  jenisProses,
  onJenisProsesChange,
  periodeRange,
  onPeriodeRangeChange,
  onApplyPeriode,
  onSelectJenisTrend,
  onRefresh,
  onPullDatasheet,
  isPullingDatasheet,
  onExportSummaryPdf,
  onExportTabPdf
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'bulan' | 'jenis'>('bulan');
  const [expandedChart, setExpandedChart] = useState<ChartModalType | null>(null);

  return (
    <div className="space-y-6">
      
      {/* Global Filter Bar */}
      <div className="no-print bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-sm flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Filter Global:</span>
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

        <div className="flex items-center gap-2 flex-wrap">
          {onPullDatasheet && (
            <button
              onClick={onPullDatasheet}
              disabled={isPullingDatasheet}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors shadow-sm ${
                isPullingDatasheet ? 'opacity-75 cursor-not-allowed' : ''
              }`}
              title="Tarik Data Langsung dari Google Spreadsheet (Datasheet Direct)"
            >
              <Database className={`w-3.5 h-3.5 ${isPullingDatasheet ? 'animate-spin' : ''}`} />
              <span>{isPullingDatasheet ? 'Menarik Data...' : 'Tarik Datasheet'}</span>
            </button>
          )}

          <button
            onClick={onRefresh}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>

          <button
            onClick={onExportSummaryPdf}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors shadow-sm"
          >
            <FileText className="w-3.5 h-3.5 text-blue-400" />
            <span>Export Ringkasan (PDF)</span>
          </button>
        </div>
      </div>

      {/* 3 Summary Cards */}
      <SummaryCardsRekapDataProsesTembakau
        ringkasanTahunan={ringkasanTahunan}
        ringkasanBulanan={ringkasanBulanan}
        ringkasanPeriode={ringkasanPeriode}
        tahunList={tahunList}
        selectedTahun={selectedTahun}
        onTahunChange={onTahunChange}
        bulanList={bulanList}
        selectedBulanRingkasan={selectedBulanRingkasan}
        onBulanRingkasanChange={onBulanRingkasanChange}
        selectedTahunBulanan={selectedTahunBulanan}
        onTahunBulananChange={onTahunBulananChange}
        periodeRange={periodeRange}
        onPeriodeRangeChange={onPeriodeRangeChange}
        onApplyPeriode={onApplyPeriode}
      />

      {/* Sub Tabs Selection */}
      <div className="flex items-center justify-between border-b border-slate-200 pt-2 no-print">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveSubTab('bulan')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
              activeSubTab === 'bulan'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            <span>Rekap per Bulan</span>
          </button>

          <button
            onClick={() => setActiveSubTab('jenis')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
              activeSubTab === 'jenis'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Rekap per Jenis Tembakau (54 Varian)</span>
          </button>
        </div>

        <button
          onClick={() => onExportTabPdf(activeSubTab === 'bulan' ? 'Rekap_Bulan' : 'Rekap_Jenis_Tembakau')}
          className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors mb-1"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Export Tab Ini (PDF)</span>
        </button>
      </div>

      {/* PANEL 1: REKAP PER BULAN */}
      {activeSubTab === 'bulan' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          
          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Card 1: Monthly Loss Line Chart */}
            <div 
              onClick={() => setExpandedChart('monthlyLoss')}
              className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm hover:shadow-md hover:border-blue-400 transition-all cursor-pointer group relative"
              title="Klik untuk memperbesar grafik tren susut bulanan ke tengah layar"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <span>Tren Susut Rata-rata (%) per Bulan</span>
                </h3>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedChart('monthlyLoss');
                  }}
                  className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-slate-500 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 rounded-lg border border-slate-200/90 group-hover:border-blue-300 transition-colors"
                  title="Perbesar Grafik ke Tengah Layar"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Perbesar</span>
                </button>
              </div>
              <MonthlyLossLineChart data={rekapBulan} />
            </div>

            {/* Card 2: Baku vs Hasil Bar Chart */}
            <div 
              onClick={() => setExpandedChart('bakuVsHasil')}
              className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm hover:shadow-md hover:border-blue-400 transition-all cursor-pointer group relative"
              title="Klik untuk memperbesar grafik bahan baku vs hasil jadi ke tengah layar"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <span>Bahan Baku vs Hasil Jadi per Bulan (Kg)</span>
                </h3>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedChart('bakuVsHasil');
                  }}
                  className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-slate-500 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 rounded-lg border border-slate-200/90 group-hover:border-blue-300 transition-colors"
                  title="Perbesar Grafik ke Tengah Layar"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Perbesar</span>
                </button>
              </div>
              <BakuVsHasilBarChart data={rekapBulan} />
            </div>
          </div>

          {/* Table Bulan */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm">
            <h3 className="font-bold text-sm text-slate-800 mb-3">
              Tabel Rekapitulasi per Bulan
            </h3>
            <TableBulanRekapDataProsesTembakau data={rekapBulan} />
          </div>

        </div>
      )}

      {/* PANEL 2: REKAP PER JENIS TEMBAKAU */}
      {activeSubTab === 'jenis' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            
            {/* Card 3: Horizontal Bar Chart (Top 8 Volume) */}
            <div 
              onClick={() => setExpandedChart('tobaccoVariant')}
              className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm lg:col-span-2 hover:shadow-md hover:border-blue-400 transition-all cursor-pointer group relative"
              title="Klik untuk memperbesar grafik peringkat kesusutan varian tembakau ke tengah layar"
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                    Susut Rata-rata (%) Varian Tembakau Terbesar
                  </h3>
                  <span className="text-[11px] text-slate-400 font-medium">Berdasarkan Volume Baku</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedChart('tobaccoVariant');
                  }}
                  className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-slate-500 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 rounded-lg border border-slate-200/90 group-hover:border-blue-300 transition-colors"
                  title="Perbesar Grafik ke Tengah Layar"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Perbesar</span>
                </button>
              </div>
              <TobaccoVariantVolumeBarChart data={rekapJenisTembakauPeriode} />
            </div>

            {/* Card 4: Selected Variant Trend Line Card */}
            <div 
              onClick={() => setExpandedChart('trendJenis')}
              className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm hover:shadow-md hover:border-blue-400 transition-all cursor-pointer group relative"
              title="Klik untuk memperbesar grafik tren varian tembakau spesifik ke tengah layar"
            >
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                  📈 Trend Kesusutan Varian
                </h3>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedChart('trendJenis');
                  }}
                  className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-slate-500 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 rounded-lg border border-slate-200/90 group-hover:border-blue-300 transition-colors"
                  title="Perbesar Grafik ke Tengah Layar"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Perbesar</span>
                </button>
              </div>
              <p className="text-[11px] font-semibold text-amber-700 truncate mb-2">
                {trendJenis.jenisTembakau || 'Pilih jenis di tabel bawah'}
              </p>
              <TrendJenisLineChart 
                data={trendJenis.data} 
                jenisTembakau={trendJenis.jenisTembakau || ''} 
              />
            </div>

          </div>

          {/* Table Jenis Tembakau */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2 mb-3">
              <h3 className="font-bold text-sm text-slate-800">
                Tabel Rekapitulasi per Jenis Tembakau
              </h3>
              <span className="text-xs text-slate-500">
                Periode: <strong className="text-slate-700">{ringkasanPeriode.periodeLabel}</strong>
              </span>
            </div>
            <TableJenisRekapDataProsesTembakau 
              data={rekapJenisTembakauPeriode}
              onSelectJenisTrend={onSelectJenisTrend}
              selectedJenisTrend={trendJenis.jenisTembakau}
            />
          </div>

        </div>
      )}

      {/* Centered Expanded Chart Modal */}
      {expandedChart && (
        <ChartExpandedModalRekapDataProsesTembakau
          isOpen={Boolean(expandedChart)}
          chartType={expandedChart}
          onClose={() => setExpandedChart(null)}
          onSelectChartType={setExpandedChart}
          rekapBulan={rekapBulan}
          rekapJenisTembakauPeriode={rekapJenisTembakauPeriode}
          trendJenis={trendJenis}
          onSelectJenisTrend={onSelectJenisTrend}
          ringkasanTahunan={ringkasanTahunan}
          ringkasanBulanan={ringkasanBulanan}
          ringkasanPeriode={ringkasanPeriode}
        />
      )}

    </div>
  );
};
