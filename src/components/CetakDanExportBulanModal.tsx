import React, { useState, useMemo } from 'react';
import { GroupSummary, JenisProsesType } from '../types[RekapDataProsesTembakau]';
import { formatKg, formatPct, isStaticHostingMode, markStaticHostingMode } from '../api[RekapDataProsesTembakau]';
import { 
  Printer, 
  FileText, 
  Download, 
  CheckCircle2, 
  Sliders, 
  Calendar, 
  X, 
  Sparkles,
  ArrowRight,
  Layers,
  FileCheck
} from 'lucide-react';

export type BulanPrintScopeType = 'all' | 'table_only' | 'summary_only';

interface CetakDanExportBulanModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: GroupSummary[];
  allMonthsData: GroupSummary[];
  jenisProses: JenisProsesType;
  filterLabel: string;
  totalBaku: number;
  totalHasil: number;
  weightedSusutPct: number;
  highestMonth?: GroupSummary | null;
  lowestMonth?: GroupSummary | null;
  onApplyPrintSettings: (settings: {
    scope: BulanPrintScopeType;
    orientation: 'landscape' | 'portrait';
  }) => void;
}

export const CetakDanExportBulanModal: React.FC<CetakDanExportBulanModalProps> = ({
  isOpen,
  onClose,
  data,
  allMonthsData,
  jenisProses,
  filterLabel,
  totalBaku,
  totalHasil,
  weightedSusutPct,
  highestMonth,
  lowestMonth,
  onApplyPrintSettings
}) => {
  const [scope, setScope] = useState<BulanPrintScopeType>('all');
  const [dataPreset, setDataPreset] = useState<'current' | 'all' | '2026' | '2025'>('current');
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [isExportingServerPdf, setIsExportingServerPdf] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Determine active data based on preset
  const targetData = useMemo(() => {
    if (dataPreset === 'current') return data;
    if (dataPreset === 'all') return allMonthsData;
    if (dataPreset === '2026') return allMonthsData.filter(d => d.tahun === '2026');
    if (dataPreset === '2025') return allMonthsData.filter(d => d.tahun === '2025');
    return data;
  }, [dataPreset, data, allMonthsData]);

  // Compute calculated metrics for targetData
  const metrics = useMemo(() => {
    const baku = targetData.reduce((s, it) => s + (it.baku || 0), 0);
    const hasil = targetData.reduce((s, it) => s + (it.hasil || 0), 0);
    const susutKg = Math.max(0, baku - hasil);
    const pct = baku > 0 ? (susutKg / baku) * 100 : 0;
    return { baku, hasil, susutKg, pct };
  }, [targetData]);

  const activePeriodeTitle = useMemo(() => {
    if (dataPreset === 'current') return filterLabel;
    if (dataPreset === 'all') return 'Semua Periode (April 2025 – Oktober 2026)';
    if (dataPreset === '2026') return 'Sepanjang Tahun 2026';
    if (dataPreset === '2025') return 'Sepanjang Tahun 2025';
    return filterLabel;
  }, [dataPreset, filterLabel]);

  if (!isOpen) return null;

  // Aksi 1: CETAK LANGSUNG (Physical Print Dialog)
  const handleDirectPrint = () => {
    onApplyPrintSettings({
      scope,
      orientation
    });

    const origTitle = document.title;
    document.title = `Laporan_Rekap_Bulanan_${activePeriodeTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}`;

    onClose();

    setTimeout(() => {
      window.print();
      setTimeout(() => {
        document.title = origTitle;
        document.body.removeAttribute('data-print-scope');
      }, 1000);
    }, 250);
  };

  // Aksi 2: UNDUH FILE PDF (Server-Engine PDF Generator dengan Deteksi Static Hosting Cloudflare)
  const handleDownloadServerPdf = async () => {
    if (isStaticHostingMode()) {
      handleDirectPrint();
      return;
    }
    setIsExportingServerPdf(true);
    setExportNotice('Menghasilkan dokumen PDF Rekap Bulanan resmi...');
    try {
      const response = await fetch('/api/export-pdf-rekap-bulan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          items: targetData.map((d, idx) => ({
            no: idx + 1,
            label: d.label,
            jumlahData: d.jumlahData,
            baku: d.baku,
            hasil: d.hasil,
            susutKg: Math.max(0, d.baku - d.hasil),
            susutPct: d.susutPct,
            gagangPct: d.gagangPct,
            debuAirPct: d.debuAirPct,
            minPct: d.minPct,
            maxPct: d.maxPct
          })),
          periodeLabel: activePeriodeTitle,
          jenisProsesLabel: jenisProses === 'Semua' ? 'Semua Jalur (SKT & SKM)' : jenisProses,
          totalBaku: metrics.baku,
          totalHasil: metrics.hasil,
          totalSusutKg: metrics.susutKg,
          weightedSusutPct: metrics.pct,
          highestMonth: highestMonth?.label,
          highestLoss: highestMonth?.susutPct,
          lowestMonth: lowestMonth?.label,
          lowestLoss: lowestMonth?.susutPct,
          scope,
          orientation,
          mode: 'download'
        })
      });

      const ct = (response.headers.get('content-type') || '').toLowerCase();
      if (!response.ok || ct.includes('text/html')) {
        if (ct.includes('text/html')) markStaticHostingMode();
        throw new Error(`Endpoint PDF server tidak tersedia (${response.status})`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Monitoring_Board_Rekap_Bulanan_${activePeriodeTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setExportNotice('File PDF Rekap Bulanan berhasil diunduh!');
      setTimeout(() => {
        setExportNotice(null);
        onClose();
      }, 1500);
    } catch (err: any) {
      console.warn('Fallback cetak browser untuk PDF Rekap Bulan:', err);
      setExportNotice('Mengalihkan ke dialog cetak/simpan PDF browser...');
      setTimeout(() => {
        setExportNotice(null);
        handleDirectPrint();
      }, 600);
    } finally {
      setIsExportingServerPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 md:backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90dvh] animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cetak-bulan-title"
      >
        {/* Header Modal */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-300 shadow-sm shrink-0">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 id="cetak-bulan-title" className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>Cetak &amp; Export Rekapitulasi Bulanan</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  Presisi Dokumen
                </span>
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Konfigurasi cakupan data, format cetak, dan pilihan dokumen resmi PT Batu Karang
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            title="Tutup dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-slate-700">
          
          {/* Notification banner if downloading */}
          {exportNotice && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl text-xs font-semibold text-blue-800 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600 animate-spin" />
              <span>{exportNotice}</span>
            </div>
          )}

          {/* OPSI 1: PILIHAN CAKUPAN KONTEN */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                <span>1. Pilih Cakupan Konten Laporan</span>
              </label>
              <span className="text-[11px] text-slate-500 font-medium">Bebas pilih bagian yang ingin dicetak</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Option A: Lengkap */}
              <button
                type="button"
                onClick={() => setScope('all')}
                className={`p-3 rounded-2xl border text-left transition-all relative ${
                  scope === 'all'
                    ? 'bg-blue-50/70 border-blue-600 ring-2 ring-blue-500/30 shadow-xs'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900">Lengkap</span>
                  {scope === 'all' && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Ringkasan 4 Kartu KPI + Grafik Tren Bulanan + Tabel Data Lengkap
                </p>
              </button>

              {/* Option B: Hanya Tabel */}
              <button
                type="button"
                onClick={() => setScope('table_only')}
                className={`p-3 rounded-2xl border text-left transition-all relative ${
                  scope === 'table_only'
                    ? 'bg-blue-50/70 border-blue-600 ring-2 ring-blue-500/30 shadow-xs'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900">Hanya Tabel Bulanan</span>
                  {scope === 'table_only' && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Fokus pada tabel data deret waktu, tanpa elemen grafik
                </p>
              </button>

              {/* Option C: Hanya Ringkasan & Grafik */}
              <button
                type="button"
                onClick={() => setScope('summary_only')}
                className={`p-3 rounded-2xl border text-left transition-all relative ${
                  scope === 'summary_only'
                    ? 'bg-blue-50/70 border-blue-600 ring-2 ring-blue-500/30 shadow-xs'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900">Ringkasan &amp; Tren</span>
                  {scope === 'summary_only' && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Kartu KPI Eksekutif dan visualisasi tren rasio susut (1 lembar)
                </p>
              </button>
            </div>
          </div>

          {/* OPSI 2: PILIHAN PERIODE DATA */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>2. Pilih Rentang Data Periode</span>
              </label>
              <span className="text-[11px] text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200/60">
                {targetData.length} Bulan Terpilih
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setDataPreset('current')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold text-center transition-all ${
                  dataPreset === 'current'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                Filter Saat Ini
              </button>

              <button
                type="button"
                onClick={() => setDataPreset('all')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold text-center transition-all ${
                  dataPreset === 'all'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                Semua Periode
              </button>

              <button
                type="button"
                onClick={() => setDataPreset('2026')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold text-center transition-all ${
                  dataPreset === '2026'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                Tahun 2026 Saja
              </button>

              <button
                type="button"
                onClick={() => setDataPreset('2025')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold text-center transition-all ${
                  dataPreset === '2025'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                Tahun 2025 Saja
              </button>
            </div>
          </div>

          {/* OPSI 3: ORIENTASI KERTAS */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-blue-600" />
              <span>3. Orientasi Tata Letak Cetak</span>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setOrientation('landscape')}
                className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                  orientation === 'landscape'
                    ? 'bg-blue-50 border-blue-600 ring-2 ring-blue-500/30'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-slate-900">Lanskap (Landscape)</div>
                  <div className="text-[11px] text-slate-500">Standar resmi (seluruh kolom muat utuh)</div>
                </div>
                {orientation === 'landscape' && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
              </button>

              <button
                type="button"
                onClick={() => setOrientation('portrait')}
                className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                  orientation === 'portrait'
                    ? 'bg-blue-50 border-blue-600 ring-2 ring-blue-500/30'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-slate-900">Potret (Portrait)</div>
                  <div className="text-[11px] text-slate-500">Format vertikal ringkas</div>
                </div>
                {orientation === 'portrait' && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
              </button>
            </div>
          </div>

          {/* RINGKASAN NERACA DOKUMEN YANG AKAN DICETAK */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/90 text-xs space-y-2.5">
            <div className="font-bold text-slate-800 flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                <span>Ringkasan Neraca Dokumen Bulanan:</span>
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                {activePeriodeTitle}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
              <div>
                <span className="text-slate-500 block">Total Baku:</span>
                <strong className="text-slate-900 font-mono">{formatKg(metrics.baku)} Kg</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Hasil Jadi:</span>
                <strong className="text-slate-900 font-mono">{formatKg(metrics.hasil)} Kg</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Susut Akumulasi:</span>
                <strong className="text-rose-600 font-mono">{formatKg(metrics.susutKg)} Kg</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Rasio Tertimbang:</span>
                <strong className="text-blue-600 font-mono font-bold">{formatPct(metrics.pct)}</strong>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer: DUA PILIHAN AKSI TERPISAH */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 transition-colors"
          >
            Batal
          </button>

          <div className="w-full sm:w-auto flex items-center gap-2.5">
            {/* Tombol Aksi 1: CETAK LANGSUNG KE PRINTER */}
            <button
              type="button"
              onClick={handleDirectPrint}
              disabled={isExportingServerPdf}
              className="flex-1 sm:flex-initial min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold transition-all shadow-xs cursor-pointer"
              title="Buka dialog cetak browser langsung ke printer fisik"
            >
              <Printer className="w-4 h-4 text-slate-700" />
              <span>🖨️ Cetak Langsung</span>
            </button>

            {/* Tombol Aksi 2: UNDUH FILE PDF */}
            <button
              type="button"
              onClick={handleDownloadServerPdf}
              disabled={isExportingServerPdf}
              className="flex-1 sm:flex-initial min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-70"
              title="Unduh berkas PDF resmi berkualitas tinggi ke komputer/ponsel"
            >
              <Download className={`w-4 h-4 ${isExportingServerPdf ? 'animate-bounce' : ''}`} />
              <span>{isExportingServerPdf ? 'Mengunduh...' : '📄 Unduh File PDF'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
