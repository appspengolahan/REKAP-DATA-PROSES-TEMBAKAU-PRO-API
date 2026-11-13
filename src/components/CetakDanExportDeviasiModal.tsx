import React, { useState, useMemo } from 'react';
import { AnalisisBulananSummary, AnalisisDeviasiItem } from '../types[RekapDataProsesTembakau]';
import { formatKg, formatPct, isStaticHostingMode, markStaticHostingMode } from '../api[RekapDataProsesTembakau]';
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
  Scale,
  AlertTriangle
} from 'lucide-react';

export type DeviasiScopeType = 'all' | 'table_only' | 'summary_only';
export type DeviasiStatusFilter = 'all' | 'kritis_only' | 'toleransi_aman';

interface CetakDanExportDeviasiModalProps {
  isOpen: boolean;
  onClose: () => void;
  analisisBulanan: AnalisisBulananSummary;
  filterBulan: string;
  filterTahun: string;
  onApplyPrintSettings: (settings: {
    scope: DeviasiScopeType;
    statusFilter: DeviasiStatusFilter;
    orientation: 'landscape' | 'portrait';
  }) => void;
}

export const CetakDanExportDeviasiModal: React.FC<CetakDanExportDeviasiModalProps> = ({
  isOpen,
  onClose,
  analisisBulanan,
  filterBulan,
  filterTahun,
  onApplyPrintSettings
}) => {
  const [scope, setScope] = useState<DeviasiScopeType>('all');
  const [statusFilter, setStatusFilter] = useState<DeviasiStatusFilter>('all');
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [isExportingServerPdf, setIsExportingServerPdf] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const periodeLabel = `${filterBulan} ${filterTahun}`;

  // Filter items based on statusFilter
  const filteredItems = useMemo(() => {
    if (statusFilter === 'kritis_only') {
      return analisisBulanan.items.filter(it => it.status === 'kritis');
    }
    if (statusFilter === 'toleransi_aman') {
      return analisisBulanan.items.filter(it => it.status !== 'kritis');
    }
    return analisisBulanan.items;
  }, [analisisBulanan.items, statusFilter]);

  if (!isOpen) return null;

  // Aksi 1: CETAK LANGSUNG KE PRINTER
  const handleDirectPrint = () => {
    onApplyPrintSettings({
      scope,
      statusFilter,
      orientation
    });

    const origTitle = document.title;
    document.title = `Laporan_Evaluasi_Deviasi_Mutu_${periodeLabel.replace(/[^a-zA-Z0-9_-]/g, '_')}`;

    onClose();

    setTimeout(() => {
      window.print();
      setTimeout(() => {
        document.title = origTitle;
        document.body.removeAttribute('data-print-scope');
      }, 1000);
    }, 250);
  };

  // Aksi 2: UNDUH FILE PDF RESMI (Server-Engine dengan Deteksi Static Hosting Cloudflare)
  const handleDownloadServerPdf = async () => {
    if (isStaticHostingMode()) {
      handleDirectPrint();
      return;
    }
    setIsExportingServerPdf(true);
    setExportNotice('Menghasilkan dokumen PDF Evaluasi Deviasi resmi...');
    try {
      const response = await fetch('/api/export-pdf-deviasi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          items: filteredItems.map((it, idx) => ({
            no: idx + 1,
            jenisTembakau: it.jenisTembakau,
            jenisProses: it.jenisProses,
            bakuKg: it.bakuKg,
            hasilKg: it.hasilKg,
            susutRiilKg: it.susutKg,
            susutRiilPct: it.susutPct,
            standarAcuanPct: it.standarAcuanPct,
            toleransiPct: 1.0,
            deviasiPct: it.deviasiPct,
            statusDeviasi: it.status === 'normal' ? 'aman' : it.status,
            gagangKg: it.gagangKg,
            airKg: it.airKg,
            debuKg: it.debuKg
          })),
          periodeLabel,
          totalBakuKg: analisisBulanan.totalBakuKg,
          totalHasilKg: analisisBulanan.totalHasilKg,
          totalSusutKg: analisisBulanan.totalSusutKg,
          susutRiilWeightedPct: analisisBulanan.susutRiilWeightedPct,
          acuanWeightedPct: analisisBulanan.acuanWeightedPct,
          deviasiAgregatPct: analisisBulanan.deviasiAgregatPct,
          statusAgregat: analisisBulanan.statusAgregat,
          totalGagangKg: analisisBulanan.totalGagangKg,
          totalAirKg: analisisBulanan.totalAirKg,
          totalDebuKg: analisisBulanan.totalDebuKg,
          scope,
          statusFilter,
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
      a.download = `Monitoring_Board_Evaluasi_Deviasi_${periodeLabel.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setExportNotice('File PDF Evaluasi Deviasi berhasil diunduh!');
      setTimeout(() => {
        setExportNotice(null);
        onClose();
      }, 1500);
    } catch (err: any) {
      console.warn('Fallback cetak browser untuk PDF Deviasi:', err);
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
        aria-labelledby="cetak-deviasi-title"
      >
        {/* Header Modal */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shadow-sm shrink-0">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 id="cetak-deviasi-title" className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>Cetak &amp; Export Evaluasi Deviasi Mutu</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                  Audit Kualitas
                </span>
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Konfigurasi cakupan komparasi acuan mutu, varian tembakau, dan opsi cetak resmi
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
          
          {/* Notification banner */}
          {exportNotice && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs font-semibold text-amber-800 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 animate-spin" />
              <span>{exportNotice}</span>
            </div>
          )}

          {/* OPSI 1: PILIHAN CAKUPAN KONTEN */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-600" />
                <span>1. Pilih Cakupan Konten Dokumen</span>
              </label>
              <span className="text-[11px] text-slate-500">Pilih komponen laporan</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Option A: Lengkap */}
              <button
                type="button"
                onClick={() => setScope('all')}
                className={`p-3 rounded-2xl border text-left transition-all relative ${
                  scope === 'all'
                    ? 'bg-amber-50/70 border-amber-600 ring-2 ring-amber-500/30 shadow-xs'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900">Lengkap</span>
                  {scope === 'all' && <CheckCircle2 className="w-4 h-4 text-amber-600" />}
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Kartu KPI Mutu + Dekomposisi Fraksi + Tabel 54 Varian Komparasi
                </p>
              </button>

              {/* Option B: Hanya Tabel */}
              <button
                type="button"
                onClick={() => setScope('table_only')}
                className={`p-3 rounded-2xl border text-left transition-all relative ${
                  scope === 'table_only'
                    ? 'bg-amber-50/70 border-amber-600 ring-2 ring-amber-500/30 shadow-xs'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900">Hanya Tabel Deviasi</span>
                  {scope === 'table_only' && <CheckCircle2 className="w-4 h-4 text-amber-600" />}
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Fokus pada daftar 54 varian, nilai standar acuan, toleransi &amp; deviasi
                </p>
              </button>

              {/* Option C: Ringkasan Eksekutif */}
              <button
                type="button"
                onClick={() => setScope('summary_only')}
                className={`p-3 rounded-2xl border text-left transition-all relative ${
                  scope === 'summary_only'
                    ? 'bg-amber-50/70 border-amber-600 ring-2 ring-amber-500/30 shadow-xs'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900">Ringkasan Mutu</span>
                  {scope === 'summary_only' && <CheckCircle2 className="w-4 h-4 text-amber-600" />}
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Status agregat, susut tertimbang vs acuan &amp; dekomposisi limbah
                </p>
              </button>
            </div>
          </div>

          {/* OPSI 2: FILTER STATUS VARIAN */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>2. Filter Status Varian Tembakau</span>
              </label>
              <span className="text-[11px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200/60">
                {filteredItems.length} Varian Terpilih
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold text-center transition-all ${
                  statusFilter === 'all'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                Semua Varian ({analisisBulanan.items.length})
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('kritis_only')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold text-center transition-all ${
                  statusFilter === 'kritis_only'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                    : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                }`}
              >
                Hanya Perhatian OOS ({analisisBulanan.items.filter(it => it.status === 'kritis').length})
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('toleransi_aman')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold text-center transition-all ${
                  statusFilter === 'toleransi_aman'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                }`}
              >
                Toleransi &amp; Normal ({analisisBulanan.items.filter(it => it.status !== 'kritis').length})
              </button>
            </div>
          </div>

          {/* OPSI 3: ORIENTASI CETAK */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-amber-600" />
              <span>3. Orientasi Tata Letak Cetak</span>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setOrientation('landscape')}
                className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                  orientation === 'landscape'
                    ? 'bg-amber-50 border-amber-600 ring-2 ring-amber-500/30'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-slate-900">Lanskap (Landscape)</div>
                  <div className="text-[11px] text-slate-500">Standar resmi (komparasi kolom lengkap)</div>
                </div>
                {orientation === 'landscape' && <CheckCircle2 className="w-4 h-4 text-amber-600" />}
              </button>

              <button
                type="button"
                onClick={() => setOrientation('portrait')}
                className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                  orientation === 'portrait'
                    ? 'bg-amber-50 border-amber-600 ring-2 ring-amber-500/30'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-slate-900">Potret (Portrait)</div>
                  <div className="text-[11px] text-slate-500">Format vertikal ringkas</div>
                </div>
                {orientation === 'portrait' && <CheckCircle2 className="w-4 h-4 text-amber-600" />}
              </button>
            </div>
          </div>

          {/* RINGKASAN METRIK DOKUMEN */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/90 text-xs space-y-2">
            <div className="font-bold text-slate-800 flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                <span>Ringkasan Evaluasi Mutu Periode {periodeLabel}:</span>
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                analisisBulanan.statusAgregat === 'kritis' 
                  ? 'bg-rose-100 text-rose-700' 
                  : analisisBulanan.statusAgregat === 'toleransi' 
                  ? 'bg-amber-100 text-amber-700' 
                  : 'bg-emerald-100 text-emerald-700'
              }`}>
                {analisisBulanan.statusAgregat === 'kritis' ? 'PERHATIAN OOS' : analisisBulanan.statusAgregat === 'toleransi' ? 'TOLERANSI WAJAR' : 'ON-TARGET (NORMAL)'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
              <div>
                <span className="text-slate-500 block">Bahan Baku Olah:</span>
                <strong className="text-slate-900 font-mono">{formatKg(analisisBulanan.totalBakuKg)} Kg</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Susut Riil:</span>
                <strong className="text-blue-600 font-mono">{formatPct(analisisBulanan.susutRiilWeightedPct)}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Acuan Mutu:</span>
                <strong className="text-amber-600 font-mono">{formatPct(analisisBulanan.acuanWeightedPct)}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Net Deviasi:</span>
                <strong className={`font-mono font-bold ${analisisBulanan.deviasiAgregatPct > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {analisisBulanan.deviasiAgregatPct >= 0 ? '+' : ''}{formatPct(analisisBulanan.deviasiAgregatPct)}
                </strong>
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
              disabled={isExportingServerPdf}
              className="flex-1 sm:flex-initial min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold transition-all shadow-xs cursor-pointer"
              title="Cetak langsung ke printer fisik melalui dialog browser"
            >
              <Printer className="w-4 h-4 text-slate-700" />
              <span>🖨️ Cetak Langsung</span>
            </button>

            {/* Tombol Aksi 2: UNDUH FILE PDF */}
            <button
              type="button"
              onClick={handleDownloadServerPdf}
              disabled={isExportingServerPdf}
              className="flex-1 sm:flex-initial min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-70"
              title="Unduh berkas PDF resmi Evaluasi Deviasi Mutu"
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
