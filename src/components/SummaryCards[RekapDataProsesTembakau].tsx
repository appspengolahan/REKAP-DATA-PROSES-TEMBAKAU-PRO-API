import React from 'react';
import { Calendar, CalendarRange, Filter, TrendingDown, ArrowDownRight, Scale, Droplet, Wind, Sparkles } from 'lucide-react';
import { SummaryKPI, PeriodeRange } from '../types[RekapDataProsesTembakau]';
import { formatKg, formatPct } from '../api[RekapDataProsesTembakau]';

interface SummaryCardsProps {
  ringkasanTahunan: SummaryKPI;
  ringkasanBulanan: SummaryKPI;
  ringkasanPeriode: SummaryKPI;
  tahunList: string[];
  selectedTahun: string;
  onTahunChange: (t: string) => void;
  bulanList: string[];
  selectedBulanRingkasan: string;
  onBulanRingkasanChange: (b: string) => void;
  selectedTahunBulanan: string;
  onTahunBulananChange: (t: string) => void;
  periodeRange: PeriodeRange;
  onPeriodeRangeChange: (p: PeriodeRange) => void;
  onApplyPeriode: () => void;
}

export const SummaryCardsRekapDataProsesTembakau: React.FC<SummaryCardsProps> = ({
  ringkasanTahunan,
  ringkasanBulanan,
  ringkasanPeriode,
  tahunList,
  selectedTahun,
  onTahunChange,
  bulanList,
  selectedBulanRingkasan,
  onBulanRingkasanChange,
  selectedTahunBulanan,
  onTahunBulananChange,
  periodeRange,
  onPeriodeRangeChange,
  onApplyPeriode
}) => {

  const renderKpiGrid = (kpi: SummaryKPI, isFullWidth = false) => {
    // Pastikan angka terhitung presisi 100% riil dari data
    const susutKgVal = kpi.susutKg !== undefined && kpi.susutKg !== null ? kpi.susutKg : (kpi.baku * (kpi.susutPct / 100));
    const gagangKgVal = kpi.gagangKg !== undefined && kpi.gagangKg !== null ? kpi.gagangKg : (kpi.baku * (kpi.gagangPct / 100));
    const debuAirKgVal = kpi.debuAirKg !== undefined && kpi.debuAirKg !== null ? kpi.debuAirKg : (kpi.baku * (kpi.debuAirPct / 100));

    return (
      <div className={`grid gap-2.5 pt-3 ${
        isFullWidth 
          ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6' 
          : 'grid-cols-2 sm:grid-cols-3'
      }`}>
        
        {/* KPI 1: Jumlah Data */}
        <div className="bg-slate-50/90 border border-slate-200/80 rounded-xl p-3 transition-all hover:border-slate-300 min-w-0">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider truncate">
            Jumlah Data
          </div>
          <div className="text-sm sm:text-base font-bold text-slate-800 mt-1 font-mono tracking-tight whitespace-nowrap truncate">
            {kpi.jumlahData.toLocaleString('id-ID')}
          </div>
          <div className="text-[10px] text-slate-500 font-medium truncate mt-0.5">Batch terproses</div>
        </div>

        {/* KPI 2: Netto Baku */}
        <div className="bg-slate-50/90 border border-slate-200/80 rounded-xl p-3 transition-all hover:border-slate-300 min-w-0">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider truncate">
            Bahan Baku
          </div>
          <div className="text-sm sm:text-base font-bold text-blue-700 mt-1 font-mono tracking-tight whitespace-nowrap truncate" title={formatKg(kpi.baku)}>
            {formatKg(kpi.baku)}
          </div>
          <div className="text-[10px] text-slate-500 font-medium truncate mt-0.5">Netto awal (1 dec)</div>
        </div>

        {/* KPI 3: Netto Hasil */}
        <div className="bg-slate-50/90 border border-slate-200/80 rounded-xl p-3 transition-all hover:border-slate-300 min-w-0">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider truncate">
            Hasil Jadi
          </div>
          <div className="text-sm sm:text-base font-bold text-emerald-700 mt-1 font-mono tracking-tight whitespace-nowrap truncate" title={formatKg(kpi.hasil)}>
            {formatKg(kpi.hasil)}
          </div>
          <div className="text-[10px] text-slate-500 font-medium truncate mt-0.5">Hasil proses (1 dec)</div>
        </div>

        {/* KPI 4: Susut Rata² (%) */}
        <div className={`border rounded-xl p-3 transition-all min-w-0 ${
          kpi.susutPct >= 8.5 
            ? 'bg-rose-50/70 border-rose-200' 
            : kpi.susutPct <= 5.5 
            ? 'bg-emerald-50/70 border-emerald-200' 
            : 'bg-amber-50/70 border-amber-200'
        }`}>
          <div className="text-[10px] uppercase font-bold text-slate-600 tracking-wider flex items-center justify-between">
            <span className="truncate">Susut Rata²</span>
            <span className="text-[9px] font-mono text-slate-400 font-normal ml-1">Min/Max</span>
          </div>
          <div className={`text-sm sm:text-base font-bold mt-1 font-mono tracking-tight whitespace-nowrap flex items-center gap-1 truncate ${
            kpi.susutPct >= 8.5 ? 'text-rose-700' : kpi.susutPct <= 5.5 ? 'text-emerald-700' : 'text-amber-700'
          }`}>
            <TrendingDown className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{formatPct(kpi.susutPct)}</span>
          </div>
          <div className="text-[10px] text-slate-600 font-mono truncate mt-0.5" title={`${formatKg(susutKgVal)} · Min ${formatPct(kpi.susutMinPct)} Max ${formatPct(kpi.susutMaxPct)}`}>
            {formatKg(susutKgVal)}
          </div>
        </div>

        {/* KPI 5: Komponen Gagang (%) */}
        <div className="bg-slate-50/90 border border-slate-200/80 rounded-xl p-3 transition-all hover:border-slate-300 min-w-0">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1 truncate">
            <Scale className="w-3 h-3 text-amber-500 flex-shrink-0" />
            <span className="truncate">Gagang (%)</span>
          </div>
          <div className="text-sm sm:text-base font-bold text-amber-700 mt-1 font-mono tracking-tight whitespace-nowrap truncate" title={formatPct(kpi.gagangPct)}>
            {formatPct(kpi.gagangPct)}
          </div>
          <div className="text-[10px] text-slate-500 font-medium truncate mt-0.5" title={formatKg(gagangKgVal)}>
            {formatKg(gagangKgVal)} terpisah
          </div>
        </div>

        {/* KPI 6: Komponen Air + Debu (%) */}
        <div className="bg-slate-50/90 border border-slate-200/80 rounded-xl p-3 transition-all hover:border-slate-300 min-w-0">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1 truncate">
            <Droplet className="w-3 h-3 text-cyan-500 flex-shrink-0" />
            <span className="truncate">Air + Debu (%)</span>
          </div>
          <div className="text-sm sm:text-base font-bold text-cyan-700 mt-1 font-mono tracking-tight whitespace-nowrap truncate" title={formatPct(kpi.debuAirPct)}>
            {formatPct(kpi.debuAirPct)}
          </div>
          <div className="text-[10px] text-slate-500 font-medium truncate mt-0.5" title={formatKg(debuAirKgVal)}>
            {formatKg(debuAirKgVal)} evaporasi
          </div>
        </div>

      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* 2-Column Grid: Rekap Tahunan & Rekap Bulanan */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Card 1: Rekap Tahunan */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-50 text-blue-700 rounded-lg">
                <Calendar className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-slate-800">
                Rekap Tahunan
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
                {ringkasanTahunan.periodeLabel}
              </span>
              <select
                value={selectedTahun}
                onChange={(e) => onTahunChange(e.target.value)}
                className="no-print text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="Semua">Semua Tahun</option>
                {tahunList.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
          {renderKpiGrid(ringkasanTahunan)}
        </div>

        {/* Card 2: Rekap Bulanan */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
                <Calendar className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-slate-800">
                Rekap Bulanan
              </h3>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                {ringkasanBulanan.periodeLabel}
              </span>
              <select
                value={selectedBulanRingkasan}
                onChange={(e) => onBulanRingkasanChange(e.target.value)}
                className="no-print text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                title="Pilih Bulan"
              >
                <option value="Semua">Semua Bulan</option>
                {bulanList.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
              <select
                value={selectedTahunBulanan}
                onChange={(e) => onTahunBulananChange(e.target.value)}
                className="no-print text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                title="Pilih Tahun untuk Rekap Bulanan"
              >
                <option value="Semua">Semua Tahun</option>
                {tahunList.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
          {renderKpiGrid(ringkasanBulanan)}
        </div>

      </div>

      {/* Card 3: Rekap Rentang Periode (Full Width) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm" id="periodeCardAnchor">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-amber-50 text-amber-700 rounded-lg">
                <CalendarRange className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-slate-800">
                Rekap Rentang Periode Bebas / Kuartalan
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              🔗 Rentang ini otomatis mengatur metrik di sini serta tabel di tab &quot;Rekap per Jenis Tembakau&quot;
            </p>
          </div>

          {/* Date Picker Range Picker Controls */}
          <div className="no-print flex items-center gap-1.5 flex-wrap bg-slate-50 p-1.5 rounded-xl border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-500 px-1">Dari:</span>
            <select
              value={periodeRange.bulanMulai}
              onChange={(e) => onPeriodeRangeChange({ ...periodeRange, bulanMulai: e.target.value })}
              className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white text-slate-700 font-medium focus:outline-none"
            >
              {bulanList.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
            <select
              value={periodeRange.tahunMulai}
              onChange={(e) => onPeriodeRangeChange({ ...periodeRange, tahunMulai: e.target.value })}
              className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white text-slate-700 font-medium focus:outline-none"
            >
              {tahunList.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>

            <span className="text-[11px] font-semibold text-slate-500 px-1">Sampai:</span>
            <select
              value={periodeRange.bulanAkhir}
              onChange={(e) => onPeriodeRangeChange({ ...periodeRange, bulanAkhir: e.target.value })}
              className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white text-slate-700 font-medium focus:outline-none"
            >
              {bulanList.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
            <select
              value={periodeRange.tahunAkhir}
              onChange={(e) => onPeriodeRangeChange({ ...periodeRange, tahunAkhir: e.target.value })}
              className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white text-slate-700 font-medium focus:outline-none"
            >
              {tahunList.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>

            <button
              onClick={onApplyPeriode}
              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors ml-1 shadow-sm"
            >
              Terapkan
            </button>
          </div>
        </div>

        <div className="pt-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 mb-1">
            <span>Aktif: {ringkasanPeriode.periodeLabel}</span>
          </div>
          {renderKpiGrid(ringkasanPeriode, true)}
        </div>
      </div>
    </div>
  );
};
