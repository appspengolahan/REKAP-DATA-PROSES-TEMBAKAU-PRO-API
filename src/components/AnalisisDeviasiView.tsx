import React, { useState, useMemo } from 'react';
import { 
  RawRowData, 
  StandarSusutItem, 
  AnalisisBulananSummary, 
  AnalisisDeviasiItem 
} from '../types[RekapDataProsesTembakau]';
import { StandarSusutService } from '../services/standarSusutService';
import { formatKg, formatPct } from '../api[RekapDataProsesTembakau]';
import { 
  TrendingUp, 
  Scale, 
  Sliders, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  Calendar, 
  Download, 
  RefreshCw, 
  Save, 
  RotateCcw,
  Plus,
  ArrowRight,
  Info,
  Droplets,
  Wind,
  ShieldCheck,
  Building2,
  Search,
  Check
} from 'lucide-react';

interface AnalisisDeviasiViewProps {
  rows: RawRowData[];
  selectedTahun: string;
  selectedBulan: string;
  onExportPdf?: () => void;
}

export const AnalisisDeviasiView: React.FC<AnalisisDeviasiViewProps> = ({
  rows,
  selectedTahun: initialTahun,
  selectedBulan: initialBulan,
  onExportPdf
}) => {
  // 1. Sub-Tab State
  const [subTab, setSubTab] = useState<'evaluasi-bulanan' | 'manajemen-acuan'>('evaluasi-bulanan');

  // 2. Filter State Khusus Evaluasi Bulanan
  const [filterTahun, setFilterTahun] = useState<string>(initialTahun === 'Semua' ? '2026' : initialTahun);
  const [filterBulan, setFilterBulan] = useState<string>(initialBulan === 'Semua' ? 'Oktober' : initialBulan);

  // 3. Standar Registry State (Aktif Sistem)
  const [standarList, setStandarList] = useState<StandarSusutItem[]>(() => 
    StandarSusutService.getStandarList(rows)
  );

  // Modal / Form Edit Standar State
  const [editingItem, setEditingItem] = useState<StandarSusutItem | null>(null);
  const [editStandarPct, setEditStandarPct] = useState<string>('');
  const [editToleransiPct, setEditToleransiPct] = useState<string>('');
  const [editKeterangan, setEditKeterangan] = useState<string>('');

  // Auto Baseline Calculator Form State
  const [baselineBulanMulai, setBaselineBulanMulai] = useState<string>('Agustus');
  const [baselineBulanAkhir, setBaselineBulanAkhir] = useState<string>('September');
  const [baselineTahun, setBaselineTahun] = useState<string>('2026');
  const [baselineSearchQuery, setBaselineSearchQuery] = useState<string>('');
  const [baselineJalurFilter, setBaselineJalurFilter] = useState<'Semua' | 'SKT' | 'SKM'>('Semua');
  const [acuanViewMode, setAcuanViewMode] = useState<'periode-terpilih' | 'acuan-aktif'>('periode-terpilih');
  const [noticeMessage, setNoticeMessage] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  // Kumpulan Bulan & Tahun unik dari rows
  const availableTahun = useMemo(() => {
    const setT = new Set(rows.map(r => r.tahun).filter(Boolean));
    return ['Semua', ...Array.from(setT).sort().reverse()];
  }, [rows]);

  const BULAN_LIST = [
    'Semua', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  // Daftar bulan yang dipilih secara inklusif (inklusif berurutan)
  const baselinePeriodMonths = useMemo(() => {
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const idxStart = months.indexOf(baselineBulanMulai);
    const idxEnd = months.indexOf(baselineBulanAkhir);

    if (idxStart === -1 || idxEnd === -1) return [baselineBulanMulai];
    if (idxStart <= idxEnd) {
      return months.slice(idxStart, idxEnd + 1);
    } else {
      return months.slice(idxEnd, idxStart + 1);
    }
  }, [baselineBulanMulai, baselineBulanAkhir]);

  const baselinePeriodLabel = useMemo(() => {
    if (baselineBulanMulai === baselineBulanAkhir) {
      return `${baselineBulanMulai} ${baselineTahun}`;
    }
    return `${baselineBulanMulai} - ${baselineBulanAkhir} ${baselineTahun}`;
  }, [baselineBulanMulai, baselineBulanAkhir, baselineTahun]);

  // Perhitungan dinamis & reaktif seluruh varian tembakau pada rentang periode yang dipilih
  const periodCalculatedStandards: StandarSusutItem[] = useMemo(() => {
    return StandarSusutService.calculateBaselineFromPeriod(
      rows,
      baselinePeriodMonths,
      baselineTahun,
      baselinePeriodLabel,
      false // Jangan otomatis overwrite localStorage sampai pengguna menetapkan
    );
  }, [rows, baselinePeriodMonths, baselineTahun, baselinePeriodLabel]);

  // Cek apakah standar acuan aktif sistem saat ini sama dengan periode yang sedang dipilih
  const isCurrentPeriodActive = useMemo(() => {
    if (standarList.length === 0) return false;
    return standarList.some(s => s.periodeAcuan === baselinePeriodLabel);
  }, [standarList, baselinePeriodLabel]);

  // Daftar yang ditampilkan di tabel (berdasarkan mode tampilan & filter)
  const baseItemsToDisplay = acuanViewMode === 'periode-terpilih'
    ? periodCalculatedStandards
    : standarList;

  const filteredStandarList = useMemo(() => {
    return baseItemsToDisplay.filter(item => {
      const matchSearch = !baselineSearchQuery || 
        item.jenisTembakau.toLowerCase().includes(baselineSearchQuery.toLowerCase());
      const matchJalur = baselineJalurFilter === 'Semua' || 
        item.jenisProses === baselineJalurFilter || 
        item.jenisProses === 'Semua';
      return matchSearch && matchJalur;
    });
  }, [baseItemsToDisplay, baselineSearchQuery, baselineJalurFilter]);

  // Hitung Analisis Bulanan secara reaktif dengan acuan standar aktif
  const analisisBulanan: AnalisisBulananSummary = useMemo(() => {
    return StandarSusutService.computeAnalisisBulanan(rows, filterBulan, filterTahun, standarList);
  }, [rows, filterBulan, filterTahun, standarList]);

  // Handler: Tetapkan Standar dari Periode Ini Sebagai Acuan Aktif Sistem
  const handleApplyPeriodAsActive = () => {
    StandarSusutService.saveStandarList(periodCalculatedStandards);
    setStandarList(periodCalculatedStandards);
    setNoticeMessage({
      text: `Berhasil! Seluruh ${periodCalculatedStandards.length} standar acuan tembakau periode ${baselinePeriodLabel} telah ditetapkan sebagai acuan aktif sistem.`,
      type: 'success'
    });
    setTimeout(() => setNoticeMessage(null), 5000);
  };

  // Handler: Reset ke Default Pabrik
  const handleResetStandar = () => {
    if (confirm('Apakah Anda yakin ingin mengembalikan seluruh standar acuan ke nilai default pabrik (Agustus - September 2026)?')) {
      const def = StandarSusutService.resetToDefault(rows);
      setStandarList(def);
      setNoticeMessage({
        text: 'Standar acuan susut telah dikembalikan ke nilai default pabrik (Agustus - September 2026).',
        type: 'info'
      });
      setTimeout(() => setNoticeMessage(null), 4000);
    }
  };

  // Handler: Mulai Edit Standar
  const handleStartEdit = (item: StandarSusutItem) => {
    setEditingItem(item);
    setEditStandarPct(String(item.standarSusutPct));
    setEditToleransiPct(String(item.toleransiPct));
    setEditKeterangan(item.keterangan || '');
  };

  // Handler: Simpan Edit Standar
  const handleSaveEdit = () => {
    if (!editingItem) return;
    const numStd = parseFloat(editStandarPct.replace(',', '.'));
    const numTol = parseFloat(editToleransiPct.replace(',', '.'));

    if (isNaN(numStd) || numStd < 0) {
      alert('Harap masukkan angka standar susut yang valid');
      return;
    }

    let updated = standarList.map(s => {
      if (s.id === editingItem.id || (s.jenisTembakau === editingItem.jenisTembakau && s.jenisProses === editingItem.jenisProses)) {
        return {
          ...s,
          standarSusutPct: Math.round(numStd * 100) / 100,
          toleransiPct: !isNaN(numTol) ? Math.round(numTol * 100) / 100 : s.toleransiPct,
          keterangan: editKeterangan,
          updatedAt: new Date().toISOString().split('T')[0]
        };
      }
      return s;
    });

    // Jika item baru berasal dari perhitungan periode terpilih dan belum ada di standar aktif
    const exists = updated.some(s => s.jenisTembakau === editingItem.jenisTembakau && s.jenisProses === editingItem.jenisProses);
    if (!exists) {
      updated = [
        ...updated,
        {
          ...editingItem,
          standarSusutPct: Math.round(numStd * 100) / 100,
          toleransiPct: !isNaN(numTol) ? Math.round(numTol * 100) / 100 : editingItem.toleransiPct,
          keterangan: editKeterangan,
          updatedAt: new Date().toISOString().split('T')[0]
        }
      ];
    }

    setStandarList(updated);
    StandarSusutService.saveStandarList(updated);
    setEditingItem(null);
    setNoticeMessage({
      text: `Standar acuan untuk ${editingItem.jenisTembakau} (${editingItem.jenisProses}) berhasil disimpan!`,
      type: 'success'
    });
    setTimeout(() => setNoticeMessage(null), 4000);
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10">
      
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-indigo-950 border border-slate-800 rounded-2xl p-4 sm:p-5 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300 shadow-sm shrink-0">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Analisis Deviasi &amp; Standar Acuan Susut
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                Kontrol Kualitas Mutu
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Komparasi susut riil seluruh varian tembakau terhadap standar acuan, dekomposisi fraksi limbah, dan evaluasi berkala Divisi Produksi I
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-start md:self-center shrink-0">
          {onExportPdf && (
            <button
              onClick={onExportPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all"
              title="Cetak Laporan Resmi Evaluasi Bulanan (PDF)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export PDF Evaluasi</span>
            </button>
          )}
        </div>
      </div>

      {/* Floating Notice */}
      {noticeMessage && (
        <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 shadow-sm animate-in fade-in ${
          noticeMessage.type === 'success'
            ? 'bg-emerald-950/70 border-emerald-500/60 text-emerald-200'
            : 'bg-blue-950/70 border-blue-500/60 text-blue-200'
        }`}>
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{noticeMessage.text}</span>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 bg-white p-1.5 rounded-xl shadow-xs">
        <button
          onClick={() => setSubTab('evaluasi-bulanan')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            subTab === 'evaluasi-bulanan'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Evaluasi Bulanan Komparasi Seluruh Bahan</span>
        </button>

        <button
          onClick={() => setSubTab('manajemen-acuan')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            subTab === 'manajemen-acuan'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Manajemen Standar Acuan Susut ({periodCalculatedStandards.length} Varian Terhitung)</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* SUB-TAB 1: EVALUASI BULANAN KOMPARASI SELURUH BAHAN             */}
      {/* ============================================================== */}
      {subTab === 'evaluasi-bulanan' && (
        <div className="space-y-4">
          
          {/* Filter Bar Periode */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold text-slate-800">Periode Evaluasi:</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-500 font-medium">Bulan:</span>
                <select
                  value={filterBulan}
                  onChange={(e) => setFilterBulan(e.target.value)}
                  className="px-2.5 py-1 rounded-lg border border-slate-300 bg-slate-50 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {BULAN_LIST.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-500 font-medium">Tahun:</span>
                <select
                  value={filterTahun}
                  onChange={(e) => setFilterTahun(e.target.value)}
                  className="px-2.5 py-1 rounded-lg border border-slate-300 bg-slate-50 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {availableTahun.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <span className="text-[11px] text-slate-400 pl-2">
                Terdata: <strong className="text-slate-700">{analisisBulanan.totalBatch}</strong> batch olah
              </span>
            </div>
          </div>

          {/* 4 Kartu KPI Ringkasan Eksekutif */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            
            {/* Total Olah */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Total Bahan Masuk
              </div>
              <div className="text-lg font-black text-slate-900 mt-1">
                {formatKg(analisisBulanan.totalBakuKg)} <span className="text-xs font-medium text-slate-500">Kg</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Hasil: <strong className="text-slate-700">{formatKg(analisisBulanan.totalHasilKg)} Kg</strong>
              </div>
            </div>

            {/* Susut Riil Tertimbang */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Susut Riil Tertimbang
              </div>
              <div className="text-lg font-black text-blue-600 mt-1">
                {formatPct(analisisBulanan.susutRiilWeightedPct)}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Total Susut: <strong className="text-slate-700">{formatKg(analisisBulanan.totalSusutKg)} Kg</strong>
              </div>
            </div>

            {/* Acuan Standar Periode */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Acuan Standar Periode
              </div>
              <div className="text-lg font-black text-amber-600 mt-1">
                {formatPct(analisisBulanan.acuanWeightedPct)}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Basis: <span className="text-slate-600 font-medium">Standar Tertimbang Q3</span>
              </div>
            </div>

            {/* Net Deviasi Agregat */}
            <div className={`p-3.5 rounded-2xl border shadow-xs ${
              analisisBulanan.statusAgregat === 'kritis'
                ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                : analisisBulanan.statusAgregat === 'toleransi'
                ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
            }`}>
              <div className="text-[11px] font-bold uppercase tracking-wider">
                Net Deviasi Agregat
              </div>
              <div className="text-lg font-black mt-1">
                {analisisBulanan.deviasiAgregatPct >= 0 ? '+' : ''}{formatPct(analisisBulanan.deviasiAgregatPct)}
              </div>
              <div className="text-[11px] font-semibold mt-1 flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${
                  analisisBulanan.statusAgregat === 'kritis' ? 'bg-rose-600 animate-pulse' :
                  analisisBulanan.statusAgregat === 'toleransi' ? 'bg-amber-500' : 'bg-emerald-600'
                }`}></span>
                <span>
                  {analisisBulanan.statusAgregat === 'kritis' ? 'PERHATIAN OOS' :
                   analisisBulanan.statusAgregat === 'toleransi' ? 'TOLERANSI WAJAR' : 'ON-TARGET (NORMAL)'}
                </span>
              </div>
            </div>

          </div>

          {/* Akumulasi Fraksi Limbah Bulanan */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                Dekomposisi Fraksi Limbah Periode {filterBulan} {filterTahun}
              </span>
              <span className="text-[11px] text-slate-500">
                Total Limbah Terdata: <strong>{formatKg(analisisBulanan.totalGagangKg + analisisBulanan.totalAirKg + analisisBulanan.totalDebuKg)} Kg</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-semibold text-slate-500">Fraksi Gagang / Batang</div>
                  <div className="text-sm font-bold text-slate-800">{formatKg(analisisBulanan.totalGagangKg)} Kg</div>
                </div>
                <div className="text-xs font-bold text-slate-600">
                  {analisisBulanan.totalBakuKg > 0 ? ((analisisBulanan.totalGagangKg / analisisBulanan.totalBakuKg) * 100).toFixed(2) : 0}%
                </div>
              </div>

              <div className="p-2.5 bg-sky-50 rounded-xl border border-sky-200/80 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-semibold text-sky-700 flex items-center gap-1">
                    <Droplets className="w-3 h-3 text-sky-600" />
                    Penguapan Kadar Air
                  </div>
                  <div className="text-sm font-bold text-sky-900">{formatKg(analisisBulanan.totalAirKg)} Kg</div>
                </div>
                <div className="text-xs font-bold text-sky-700">
                  {analisisBulanan.totalBakuKg > 0 ? ((analisisBulanan.totalAirKg / analisisBulanan.totalBakuKg) * 100).toFixed(2) : 0}%
                </div>
              </div>

              <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200/80 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-semibold text-amber-700 flex items-center gap-1">
                    <Wind className="w-3 h-3 text-amber-600" />
                    Pemisahan Debu / Ayakan
                  </div>
                  <div className="text-sm font-bold text-amber-900">{formatKg(analisisBulanan.totalDebuKg)} Kg</div>
                </div>
                <div className="text-xs font-bold text-amber-700">
                  {analisisBulanan.totalBakuKg > 0 ? ((analisisBulanan.totalDebuKg / analisisBulanan.totalBakuKg) * 100).toFixed(2) : 0}%
                </div>
              </div>
            </div>
          </div>

          {/* Tabel Komparasi Detail Seluruh Bahan Baku */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Matriks Komparasi Seluruh Varian Tembakau vs Acuan Standar
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Diurutkan berdasarkan varian dengan deviasi kesusutan terbesar (paling memerlukan perhatian)
                </p>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                {analisisBulanan.items.length} Varian Diproses
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/80 text-slate-600 font-bold border-b border-slate-200 text-[11px]">
                    <th className="py-2.5 px-3">No</th>
                    <th className="py-2.5 px-3">Jenis Tembakau</th>
                    <th className="py-2.5 px-3 text-center">Jalur</th>
                    <th className="py-2.5 px-3 text-right">Baku (Kg)</th>
                    <th className="py-2.5 px-3 text-right">Hasil (Kg)</th>
                    <th className="py-2.5 px-3 text-right">Susut Riil</th>
                    <th className="py-2.5 px-3 text-right">Acuan</th>
                    <th className="py-2.5 px-3 text-right">Deviasi (Δ)</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3">Faktor Dominan / Diagnosa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {analisisBulanan.items.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-slate-400">
                        Tidak ada data proses untuk periode terpilih.
                      </td>
                    </tr>
                  ) : (
                    analisisBulanan.items.map((item, idx) => {
                      const isOver = item.deviasiPct > 0;
                      return (
                        <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-900">
                            {item.jenisTembakau}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              item.jenisProses === 'SKM' 
                                ? 'bg-purple-100 text-purple-700' 
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {item.jenisProses}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                            {formatKg(item.bakuKg)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                            {formatKg(item.hasilKg)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                            {formatPct(item.susutPct)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-500 font-medium">
                            {formatPct(item.standarAcuanPct)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-black">
                            <span className={
                              item.status === 'kritis' ? 'text-rose-600' :
                              item.status === 'toleransi' ? 'text-amber-600' : 'text-emerald-600'
                            }>
                              {isOver ? '+' : ''}{formatPct(item.deviasiPct)}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                              item.status === 'kritis' ? 'bg-rose-100 text-rose-700 border border-rose-200' :
                              item.status === 'toleransi' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                              'bg-emerald-100 text-emerald-700 border border-emerald-200'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                item.status === 'kritis' ? 'bg-rose-500' :
                                item.status === 'toleransi' ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}></span>
                              {item.status === 'kritis' ? 'OOS' :
                               item.status === 'toleransi' ? 'Toleransi' : 'Normal'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-slate-800 text-[11px]">{item.faktorDominan}</div>
                            <div className="text-[10px] text-slate-500 leading-tight mt-0.5 line-clamp-1" title={item.penjelasan}>
                              {item.penjelasan}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Kotak Kesimpulan & Rekomendasi Manajerial */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            
            {/* Kesimpulan Naratif */}
            <div className="bg-indigo-950/90 text-white p-4 rounded-2xl border border-indigo-800/80 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-2">
                  <Info className="w-4 h-4 text-indigo-400" />
                  Kesimpulan Analitik Periode {filterBulan} {filterTahun}
                </div>
                <p className="text-xs text-indigo-100/90 leading-relaxed">
                  {analisisBulanan.kesimpulanOtomatis}
                </p>
              </div>
              <div className="mt-3 pt-3 border-t border-indigo-800/60 flex items-center justify-between text-[11px] text-indigo-300">
                <span>Status Agregat: <strong className="text-white uppercase">{analisisBulanan.statusAgregat}</strong></span>
                <span>Divisi Produksi I</span>
              </div>
            </div>

            {/* Rekomendasi Tindakan Manajerial */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-slate-800 text-xs font-bold uppercase tracking-wider mb-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Rekomendasi Tindakan Manajerial (Continuous Improvement)
                </div>
                <ul className="space-y-1.5 text-xs text-slate-600">
                  {analisisBulanan.rekomendasiManajerial.map((rek, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="leading-relaxed">{rek}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-3 pt-2 text-[10px] text-slate-400 italic">
                * Rekomendasi disusun otomatis berdasarkan dekomposisi fraksi air, gagang, debu, dan kapasitas batch.
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ============================================================== */}
      {/* SUB-TAB 2: MANAJEMEN STANDAR ACUAN SUSUT (REGISTRY)             */}
      {/* ============================================================== */}
      {subTab === 'manajemen-acuan' && (
        <div className="space-y-4">
          
          {/* Card 1: Penentuan Rentang Periode Acuan Standar */}
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300/70 rounded-2xl p-4 bg-white shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
              <div>
                <h3 className="text-xs font-bold text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                  Kalkulasi Standar Acuan dari Periode Produksi Nyata
                </h3>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Pilih rentang bulan dan tahun acuan. Sistem secara otomatis menghitung rata-rata tertimbang seluruh tembakau yang diproses pada rentang tersebut.
                </p>
              </div>
              
              <div className="flex items-center gap-2 self-start md:self-auto">
                <button
                  onClick={handleApplyPeriodAsActive}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white shadow-xs transition-all cursor-pointer ${
                    isCurrentPeriodActive
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-amber-600 hover:bg-amber-700'
                  }`}
                  title="Gunakan hasil kalkulasi periode ini sebagai acuan pembanding pada seluruh sistem"
                >
                  {isCurrentPeriodActive ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Acuan Periode Ini Aktif (Perbarui)</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Tetapkan Periode Ini Sebagai Acuan Aktif Sistem</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Filter Bar Periode Acuan */}
            <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-amber-200/70 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-700 font-bold">Bulan Mulai:</span>
                <select
                  value={baselineBulanMulai}
                  onChange={(e) => setBaselineBulanMulai(e.target.value)}
                  className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {BULAN_LIST.filter(b => b !== 'Semua').map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-slate-700 font-bold">Sampai Bulan:</span>
                <select
                  value={baselineBulanAkhir}
                  onChange={(e) => setBaselineBulanAkhir(e.target.value)}
                  className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {BULAN_LIST.filter(b => b !== 'Semua').map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-slate-700 font-bold">Tahun:</span>
                <select
                  value={baselineTahun}
                  onChange={(e) => setBaselineTahun(e.target.value)}
                  className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {availableTahun.filter(t => t !== 'Semua').map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="ml-auto flex items-center gap-2">
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                  {periodCalculatedStandards.length} Jenis Tembakau Terhitung Otomatis
                </span>
                {isCurrentPeriodActive && (
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Aktif di Sistem
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Card 2: Ringkasan Metrik Periode Terpilih */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Jenis Tembakau Ada Data
              </div>
              <div className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
                {periodCalculatedStandards.filter(s => s.jenisTembakau !== 'Semua / Umum').length} Varian
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Total {periodCalculatedStandards.length} aturan proses
              </div>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Total Batch Terolah
              </div>
              <div className="text-base sm:text-lg font-black text-blue-700 mt-0.5 font-mono">
                {periodCalculatedStandards.reduce((acc, s) => acc + (s.batchCount || 0), 0)} Batch
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Periode {baselinePeriodLabel}
              </div>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Total Bahan Baku Diolah
              </div>
              <div className="text-base sm:text-lg font-black text-slate-900 mt-0.5 font-mono">
                {formatKg(periodCalculatedStandards.reduce((acc, s) => acc + (s.totalBakuKg || 0), 0))}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Dasar pembobotan susut
              </div>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Rata-rata Susut Agregat
              </div>
              <div className="text-base sm:text-lg font-black text-amber-700 mt-0.5 font-mono">
                {(periodCalculatedStandards.find(s => s.jenisTembakau === 'Semua / Umum')?.standarSusutPct || 5.50).toFixed(2)}%
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Toleransi wajar ±1.20%
              </div>
            </div>
          </div>

          {/* Card 3: Tabel Standar Acuan Terdaftar */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            
            {/* Header Toolbar: Tab Mode, Search & Filter */}
            <div className="px-4 py-3 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50">
              
              {/* Switch View Mode */}
              <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-xl">
                <button
                  onClick={() => setAcuanViewMode('periode-terpilih')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    acuanViewMode === 'periode-terpilih'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tembakau Periode Ini ({periodCalculatedStandards.length})
                </button>
                <button
                  onClick={() => setAcuanViewMode('acuan-aktif')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    acuanViewMode === 'acuan-aktif'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Acuan Aktif Sistem ({standarList.length})
                </button>
              </div>

              {/* Search & Filter Toolbar */}
              <div className="flex flex-wrap items-center gap-2">
                
                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={baselineSearchQuery}
                    onChange={(e) => setBaselineSearchQuery(e.target.value)}
                    placeholder="Cari jenis tembakau..."
                    className="pl-8 pr-3 py-1 text-xs rounded-lg border border-slate-300 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-44 sm:w-56"
                  />
                  {baselineSearchQuery && (
                    <button
                      onClick={() => setBaselineSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Filter Jalur */}
                <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-lg p-0.5 text-xs font-semibold">
                  {(['Semua', 'SKT', 'SKM'] as const).map(j => (
                    <button
                      key={j}
                      onClick={() => setBaselineJalurFilter(j)}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                        baselineJalurFilter === j
                          ? 'bg-slate-800 text-white'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {j}
                    </button>
                  ))}
                </div>

                {/* Reset to Default */}
                <button
                  onClick={handleResetStandar}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition-colors cursor-pointer ml-auto"
                  title="Kembalikan ke standar acuan bawaan pabrik (Agustus - September 2026)"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Reset Default</span>
                </button>
              </div>

            </div>

            {/* Table Area */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/80 text-slate-600 font-bold border-b border-slate-200 text-[11px]">
                    <th className="py-2.5 px-3">No</th>
                    <th className="py-2.5 px-3">Jenis Tembakau</th>
                    <th className="py-2.5 px-3 text-center">Jalur</th>
                    <th className="py-2.5 px-3 text-right">Standar Susut (%)</th>
                    <th className="py-2.5 px-3 text-right">Toleransi (±%)</th>
                    <th className="py-2.5 px-3 text-right">Total Baku (Kg)</th>
                    <th className="py-2.5 px-3 text-center">Jumlah Batch</th>
                    <th className="py-2.5 px-3">Periode Acuan</th>
                    <th className="py-2.5 px-3">Keterangan / Rationale</th>
                    <th className="py-2.5 px-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStandarList.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-slate-500">
                        <div className="font-semibold text-sm">Tidak ada varian tembakau yang cocok</div>
                        <p className="text-xs text-slate-400 mt-1">
                          {baselineSearchQuery 
                            ? `Tidak ada jenis tembakau yang cocok dengan kata kunci "${baselineSearchQuery}".`
                            : `Tidak ada data produksi tembakau pada rentang ${baselinePeriodLabel}.`}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredStandarList.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">
                          <div className="flex items-center gap-1.5">
                            <span>{item.jenisTembakau}</span>
                            {item.jenisTembakau === 'Semua / Umum' && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] bg-slate-200 text-slate-700 font-normal">
                                Fallback Agregat
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.jenisProses === 'SKM' 
                              ? 'bg-purple-100 text-purple-700' 
                              : item.jenisProses === 'SKT'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {item.jenisProses}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-black text-amber-700 text-sm">
                          {item.standarSusutPct.toFixed(2)}%
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                          ±{item.toleransiPct.toFixed(2)}%
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-700 font-medium">
                          {item.totalBakuKg !== undefined ? formatKg(item.totalBakuKg) : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-slate-600">
                          {item.batchCount !== undefined ? `${item.batchCount} batch` : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 font-medium">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px]">
                            {item.periodeAcuan}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                          {item.keterangan || '-'}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={() => handleStartEdit(item)}
                            className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-100 hover:bg-blue-50 text-blue-600 border border-slate-200 hover:border-blue-300 transition-colors cursor-pointer"
                          >
                            Ubah Standar
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer Count */}
            <div className="px-4 py-2.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
              <div>
                Menampilkan <strong className="text-slate-800">{filteredStandarList.length}</strong> dari {baseItemsToDisplay.length} jenis tembakau
                {baselineSearchQuery && ` (difilter dari "${baselineSearchQuery}")`}
              </div>
              <div className="text-[11px] text-slate-400">
                Data historis dihitung dari {periodCalculatedStandards.reduce((a, b) => a + (b.batchCount || 0), 0)} batch produksi PT Batu Karang
              </div>
            </div>

          </div>

          {/* Modal Edit Standar */}
          {editingItem && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
              <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Ubah Standar Acuan Susut</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {editingItem.jenisTembakau} ({editingItem.jenisProses})
                    </p>
                  </div>
                  <button
                    onClick={() => setEditingItem(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Target Standar Susut (%):
                    </label>
                    <input
                      type="text"
                      value={editStandarPct}
                      onChange={(e) => setEditStandarPct(e.target.value)}
                      placeholder="Contoh: 5.20"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Batas Toleransi Wajar (±%):
                    </label>
                    <input
                      type="text"
                      value={editToleransiPct}
                      onChange={(e) => setEditToleransiPct(e.target.value)}
                      placeholder="Contoh: 1.00"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Keterangan / Dokumen SK Penetapan:
                    </label>
                    <textarea
                      value={editKeterangan}
                      onChange={(e) => setEditKeterangan(e.target.value)}
                      placeholder="Contoh: Rata-rata tertimbang Agustus-September berdasarkan SK Produksi No. 12"
                      rows={2}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => setEditingItem(null)}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Simpan Standar</span>
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
