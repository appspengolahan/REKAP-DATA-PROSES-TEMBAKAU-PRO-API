import React, { useState, useMemo } from 'react';
import { RawRowData } from '../types[RekapDataProsesTembakau]';
import { formatKg, formatPct, formatInt } from '../api[RekapDataProsesTembakau]';
import { 
  Printer, 
  FileText, 
  Download, 
  CheckCircle2, 
  Sliders, 
  Layers, 
  X, 
  Calendar, 
  FileCheck, 
  Sparkles,
  ArrowRight
} from 'lucide-react';

export type LogRangePreset = 'current_page' | 'recent_50' | 'recent_100' | 'recent_250' | 'custom';

interface CetakDanExportLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  allRows: RawRowData[];
  currentPageRows: RawRowData[];
  filterJalur: string;
  onApplyPrintSettings: (selectedRows: RawRowData[], orientation: 'landscape' | 'portrait') => void;
}

export const CetakDanExportLogModal: React.FC<CetakDanExportLogModalProps> = ({
  isOpen,
  onClose,
  allRows,
  currentPageRows,
  filterJalur,
  onApplyPrintSettings
}) => {
  const [rangePreset, setRangePreset] = useState<LogRangePreset>('current_page');
  const [customStart, setCustomStart] = useState<number>(1);
  const [customEnd, setCustomEnd] = useState<number>(Math.min(100, allRows.length));
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [isExporting, setIsExporting] = useState(false);

  // Compute targeted rows based on selected preset
  const targetRows = useMemo(() => {
    if (rangePreset === 'current_page') {
      return currentPageRows;
    }
    if (rangePreset === 'recent_50') {
      return allRows.slice(0, 50);
    }
    if (rangePreset === 'recent_100') {
      return allRows.slice(0, 100);
    }
    if (rangePreset === 'recent_250') {
      return allRows.slice(0, 250);
    }
    if (rangePreset === 'custom') {
      const start = Math.max(0, customStart - 1);
      const end = Math.min(allRows.length, Math.max(start, customEnd));
      return allRows.slice(start, end);
    }
    return currentPageRows;
  }, [rangePreset, currentPageRows, allRows, customStart, customEnd]);

  // Compute totals for targeted rows
  const stats = useMemo(() => {
    const count = targetRows.length;
    const totalBaku = targetRows.reduce((s, r) => s + (r.baku || 0), 0);
    const totalHasil = targetRows.reduce((s, r) => s + (r.hasil || 0), 0);
    const totalSusut = Math.max(0, totalBaku - totalHasil);
    const susutPct = totalBaku > 0 ? (totalSusut / totalBaku) * 100 : 0;
    const estPages = Math.max(1, Math.ceil(count / 28));
    return { count, totalBaku, totalHasil, totalSusut, susutPct, estPages };
  }, [targetRows]);

  if (!isOpen) return null;

  // Aksi 1: CETAK LANGSUNG KE PRINTER
  const handleDirectPrint = () => {
    onApplyPrintSettings(targetRows, orientation);

    const origTitle = document.title;
    document.title = `Buku_Log_Data_Harian_DHP_${targetRows.length}_Batch`;

    onClose();

    setTimeout(() => {
      window.print();
      setTimeout(() => {
        document.title = origTitle;
      }, 1000);
    }, 250);
  };

  // Aksi 2: UNDUH FILE LAPORAN (PDF/Cetak Format)
  const handleDownloadPdf = () => {
    setIsExporting(true);
    // Setting up print layout and letting browser save as PDF
    onApplyPrintSettings(targetRows, orientation);
    const origTitle = document.title;
    document.title = `Buku_Log_Data_Harian_DHP_${targetRows.length}_Batch_${new Date().toISOString().split('T')[0]}`;
    onClose();
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        document.title = origTitle;
        setIsExporting(false);
      }, 1000);
    }, 250);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 md:backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90dvh] animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cetak-log-title"
      >
        {/* Header Modal */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-300 shadow-sm shrink-0">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 id="cetak-log-title" className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>Cetak &amp; Export Log Data Harian (DHP)</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  Batch Logger
                </span>
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Pilih rentang baris batch, orientasi cetak, dan mode cetak dokumen resmi PT Batu Karang
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Tutup dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-slate-700">
          
          {/* OPSI 1: PILIHAN RENTANG DATA */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                <span>1. Pilih Rentang Baris Batch untuk Dicetak</span>
              </label>
              <span className="text-[11px] text-slate-500">
                Total Arsip: <strong>{formatInt(allRows.length)} batch</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Preset A: Halaman Saat Ini */}
              <button
                type="button"
                onClick={() => setRangePreset('current_page')}
                className={`p-3 rounded-2xl border text-left transition-all relative ${
                  rangePreset === 'current_page'
                    ? 'bg-indigo-50/70 border-indigo-600 ring-2 ring-indigo-500/30 shadow-xs'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-bold text-slate-900">Halaman Saat Ini</span>
                  {rangePreset === 'current_page' && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                </div>
                <p className="text-[11px] text-slate-500">
                  {currentPageRows.length} baris yang sedang aktif di layar tampilan
                </p>
              </button>

              {/* Preset B: 50 Entri Terkini */}
              <button
                type="button"
                onClick={() => setRangePreset('recent_50')}
                className={`p-3 rounded-2xl border text-left transition-all relative ${
                  rangePreset === 'recent_50'
                    ? 'bg-indigo-50/70 border-indigo-600 ring-2 ring-indigo-500/30 shadow-xs'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-bold text-slate-900">50 Transaksi Terkini</span>
                  {rangePreset === 'recent_50' && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                </div>
                <p className="text-[11px] text-slate-500">
                  50 batch proses paling baru (hari ini &amp; kemarin)
                </p>
              </button>

              {/* Preset C: 100 Entri Terkini */}
              <button
                type="button"
                onClick={() => setRangePreset('recent_100')}
                className={`p-3 rounded-2xl border text-left transition-all relative ${
                  rangePreset === 'recent_100'
                    ? 'bg-indigo-50/70 border-indigo-600 ring-2 ring-indigo-500/30 shadow-xs'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-bold text-slate-900">100 Transaksi Terkini</span>
                  {rangePreset === 'recent_100' && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                </div>
                <p className="text-[11px] text-slate-500">
                  100 batch proses terbaru untuk arsip mingguan
                </p>
              </button>

              {/* Preset D: Kustom Rentang Baris */}
              <button
                type="button"
                onClick={() => setRangePreset('custom')}
                className={`p-3 rounded-2xl border text-left transition-all relative ${
                  rangePreset === 'custom'
                    ? 'bg-indigo-50/70 border-indigo-600 ring-2 ring-indigo-500/30 shadow-xs'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-bold text-slate-900">Rentang Baris Kustom</span>
                  {rangePreset === 'custom' && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                </div>
                <p className="text-[11px] text-slate-500">
                  Tentukan nomor awal dan akhir baris secara manual
                </p>
              </button>
            </div>

            {/* Custom Inputs */}
            {rangePreset === 'custom' && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-3 text-xs">
                <span>Dari Baris No:</span>
                <input
                  type="number"
                  min="1"
                  max={allRows.length}
                  value={customStart}
                  onChange={(e) => setCustomStart(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-20 px-2 py-1 bg-white border border-slate-300 rounded-lg text-center font-bold"
                />
                <span>s/d Baris No:</span>
                <input
                  type="number"
                  min="1"
                  max={allRows.length}
                  value={customEnd}
                  onChange={(e) => setCustomEnd(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-20 px-2 py-1 bg-white border border-slate-300 rounded-lg text-center font-bold"
                />
                <span className="text-slate-400 text-[11px]">
                  (Maks {allRows.length} baris)
                </span>
              </div>
            )}
          </div>

          {/* OPSI 2: ORIENTASI CETAK */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-indigo-600" />
              <span>2. Orientasi Halaman Cetak</span>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setOrientation('landscape')}
                className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                  orientation === 'landscape'
                    ? 'bg-indigo-50 border-indigo-600 ring-2 ring-indigo-500/30'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-slate-900">Lanskap (Landscape)</div>
                  <div className="text-[11px] text-slate-500">Standar buku log (seluruh kolom muat utuh)</div>
                </div>
                {orientation === 'landscape' && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
              </button>

              <button
                type="button"
                onClick={() => setOrientation('portrait')}
                className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                  orientation === 'portrait'
                    ? 'bg-indigo-50 border-indigo-600 ring-2 ring-indigo-500/30'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-slate-900">Potret (Portrait)</div>
                  <div className="text-[11px] text-slate-500">Format vertikal ringkas</div>
                </div>
                {orientation === 'portrait' && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
              </button>
            </div>
          </div>

          {/* RINGKASAN DATA YANG AKAN DICETAK */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/90 text-xs space-y-2">
            <div className="font-bold text-slate-800 flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                <span>Ringkasan Log Batch Terpilih:</span>
              </span>
              <span className="text-[11px] text-indigo-700 bg-indigo-50 font-bold px-2 py-0.5 rounded-lg border border-indigo-200">
                {stats.count} Batch (~{stats.estPages} Lembar A4)
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
              <div>
                <span className="text-slate-500 block">Total Baku:</span>
                <strong className="text-slate-900 font-mono">{formatKg(stats.totalBaku)} Kg</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Total Hasil:</span>
                <strong className="text-slate-900 font-mono">{formatKg(stats.totalHasil)} Kg</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Total Susut:</span>
                <strong className="text-rose-600 font-mono">{formatKg(stats.totalSusut)} Kg</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Rata-rata Susut:</span>
                <strong className="text-indigo-600 font-mono font-bold">{formatPct(stats.susutPct)}</strong>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer: DUA PILIHAN AKSI TERPISAH */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            Batal
          </button>

          <div className="w-full sm:w-auto flex items-center gap-2.5">
            {/* Tombol Aksi 1: CETAK LANGSUNG KE PRINTER */}
            <button
              type="button"
              onClick={handleDirectPrint}
              className="flex-1 sm:flex-initial min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold transition-all shadow-xs cursor-pointer"
              title="Cetak langsung ke printer fisik melalui dialog print browser"
            >
              <Printer className="w-4 h-4 text-slate-700" />
              <span>🖨️ Cetak Langsung</span>
            </button>

            {/* Tombol Aksi 2: UNDUH FILE PDF */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="flex-1 sm:flex-initial min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
              title="Unduh berkas PDF log data harian"
            >
              <Download className="w-4 h-4" />
              <span>📄 Export PDF Log</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
