import React, { useState, useMemo } from 'react';
import { GroupSummary, PeriodeRange, JenisProsesType } from '../types[RekapDataProsesTembakau]';
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
  HelpCircle,
  Sparkles,
  ArrowRight,
  Maximize2,
  FileSpreadsheet
} from 'lucide-react';

export type PrintScopeType = 'all' | 'table_only' | 'summary_only';
export type PageRangeOption = 'all' | 'custom' | 'preset_p1' | 'preset_p2' | 'preset_top10';

interface CetakDanExportJenisModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: GroupSummary[];
  periodeRange: PeriodeRange;
  jenisProses: JenisProsesType;
  totalVolume: number;
  topVolume: GroupSummary | null;
  mostEfficient: GroupSummary | null;
  highestLoss: GroupSummary | null;
  onApplyPrintSettings: (settings: {
    scope: PrintScopeType;
    startRow: number;
    endRow: number;
    orientation: 'landscape' | 'portrait';
  }) => void;
}

export const CetakDanExportJenisModal: React.FC<CetakDanExportJenisModalProps> = ({
  isOpen,
  onClose,
  data,
  periodeRange,
  jenisProses,
  totalVolume,
  topVolume,
  mostEfficient,
  highestLoss,
  onApplyPrintSettings
}) => {
  const [scope, setScope] = useState<PrintScopeType>('all');
  const [pageRangeOption, setPageRangeOption] = useState<PageRangeOption>('all');
  const [startRow, setStartRow] = useState<number>(1);
  const [endRow, setEndRow] = useState<number>(data.length || 54);
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [isExportingServerPdf, setIsExportingServerPdf] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const totalItems = data.length;

  // Sync endRow if totalItems changes
  React.useEffect(() => {
    if (pageRangeOption === 'all') {
      setEndRow(totalItems);
    }
  }, [totalItems, pageRangeOption]);

  const handlePresetSelect = (preset: PageRangeOption) => {
    setPageRangeOption(preset);
    if (preset === 'all') {
      setStartRow(1);
      setEndRow(totalItems);
    } else if (preset === 'preset_p1') {
      setStartRow(1);
      setEndRow(Math.min(25, totalItems));
    } else if (preset === 'preset_p2') {
      setStartRow(26);
      setEndRow(totalItems);
    } else if (preset === 'preset_top10') {
      setStartRow(1);
      setEndRow(Math.min(10, totalItems));
    }
  };

  // Compute selected items count & volume
  const selectedStats = useMemo(() => {
    const s = Math.max(1, startRow);
    const e = Math.min(totalItems, Math.max(s, endRow));
    const count = Math.max(0, e - s + 1);

    // Approximate pages
    let estPages = 1;
    if (scope === 'all') {
      estPages = 1 + Math.ceil(count / 26);
    } else if (scope === 'table_only') {
      estPages = Math.max(1, Math.ceil(count / 26));
    } else {
      estPages = 1;
    }

    return {
      count,
      estPages,
      start: s,
      end: e
    };
  }, [startRow, endRow, totalItems, scope]);

  // Format label periode
  const periodeLabel = useMemo(() => {
    const thn = periodeRange.tahunMulai && periodeRange.tahunMulai !== 'Semua' 
      ? `Tahun ${periodeRange.tahunMulai}` 
      : 'Semua Tahun (2025–2026)';
    return `${periodeRange.bulanMulai} s/d ${periodeRange.bulanAkhir} ${thn}`;
  }, [periodeRange]);

  if (!isOpen) return null;

  // Aksi 1: CETAK LANGSUNG (Print Fisik)
  const handleDirectPrint = () => {
    onApplyPrintSettings({
      scope,
      startRow: selectedStats.start,
      endRow: selectedStats.end,
      orientation
    });

    // Set page title for print header
    const origTitle = document.title;
    document.title = `Laporan_Rekap_Jenis_Tembakau_${periodeLabel.replace(/[^a-zA-Z0-9_-]/g, '_')}`;

    // Close modal first so modal itself is not in DOM print
    onClose();

    // Trigger window.print after microtask
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        document.title = origTitle;
        // Reset body attributes
        document.body.removeAttribute('data-print-scope');
      }, 1000);
    }, 250);
  };

  // Aksi 2: UNDUH / EXPORT FILE PDF RESMI (Server-Engine dengan Deteksi Static Hosting Cloudflare)
  const handleDownloadServerPdf = async () => {
    if (isStaticHostingMode()) {
      handleDirectPrint();
      return;
    }
    setIsExportingServerPdf(true);
    setExportNotice('Menghasilkan dokumen PDF resmi beresolusi tinggi...');
    try {
      const response = await fetch('/api/export-pdf-rekap-jenis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          items: data.map((d, idx) => ({
            no: idx + 1,
            label: d.label,
            jumlahData: d.jumlahData,
            baku: d.baku,
            hasil: d.hasil,
            susutKg: d.susutKg,
            susutPct: d.susutPct,
            gagangPct: d.gagangPct,
            debuAirPct: d.debuAirPct,
            kapasitasPct: d.kapasitasPct
          })),
          periodeLabel,
          jenisProsesLabel: jenisProses === 'Semua' ? 'Semua Jalur (SKT & SKM)' : jenisProses,
          totalVolume,
          topVolumeLabel: topVolume?.label,
          topVolumeBaku: topVolume?.baku,
          efficientLabel: mostEfficient?.label,
          efficientLoss: mostEfficient?.susutPct,
          highestLossLabel: highestLoss?.label,
          highestLoss: highestLoss?.susutPct,
          scope,
          startRow: selectedStats.start,
          endRow: selectedStats.end,
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
      a.download = `Monitoring_Board_Rekap_Jenis_Tembakau_${selectedStats.start}-${selectedStats.end}_${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setExportNotice('✅ File PDF berhasil diunduh ke perangkat Anda!');
      setTimeout(() => {
        setExportNotice(null);
        onClose();
      }, 1500);
    } catch (err: any) {
      console.warn('Fallback ke browser print PDF:', err);
      setExportNotice('Mengalihkan ke dialog simpan PDF browser...');
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
        className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90dvh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white flex items-center justify-between border-b border-slate-700/60">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-blue-500/20 text-blue-300 border border-blue-400/30 shadow-inner">
              <Printer className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Cetak &amp; Ekspor Rekap Jenis Tembakau</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-200 border border-blue-400/40">
                  Dinamis Multi-Halaman
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                Pilih cakupan konten, tentukan rentang halaman/varian, dan cetak langsung atau unduh PDF
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Tutup dialog cetak"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-700">
          
          {/* Notification Alert if any */}
          {exportNotice && (
            <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 text-xs font-semibold flex items-center gap-2.5 animate-in slide-in-from-top-2">
              <Sparkles className="w-4 h-4 text-blue-600 animate-spin" />
              <span>{exportNotice}</span>
            </div>
          )}

          {/* Bagian 1: Cakupan Konten (Scope) */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>1. Pilih Cakupan Konten yang Dicetak</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Option 1: Semua Bagian (Lengkap) */}
              <div 
                onClick={() => setScope('all')}
                className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                  scope === 'all'
                    ? 'border-blue-600 bg-blue-50/50 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-800">Lengkap (Semua)</span>
                  <input 
                    type="radio" 
                    name="scope" 
                    checked={scope === 'all'} 
                    onChange={() => setScope('all')}
                    className="text-blue-600 focus:ring-blue-500" 
                  />
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Header + 4 Kartu KPI + 2 Grafik + Tabel 54 Varian Tembakau.
                </p>
              </div>

              {/* Option 2: Hanya Tabel Jenis Tembakau */}
              <div 
                onClick={() => setScope('table_only')}
                className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                  scope === 'table_only'
                    ? 'border-blue-600 bg-blue-50/50 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-800">Hanya Tabel Data</span>
                  <input 
                    type="radio" 
                    name="scope" 
                    checked={scope === 'table_only'} 
                    onChange={() => setScope('table_only')}
                    className="text-blue-600 focus:ring-blue-500" 
                  />
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Fokus data detail 54 varian tembakau tanpa kartu dan grafik.
                </p>
              </div>

              {/* Option 3: Hanya Ringkasan & Grafik */}
              <div 
                onClick={() => setScope('summary_only')}
                className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                  scope === 'summary_only'
                    ? 'border-blue-600 bg-blue-50/50 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-800">Ringkasan &amp; Grafik</span>
                  <input 
                    type="radio" 
                    name="scope" 
                    checked={scope === 'summary_only'} 
                    onChange={() => setScope('summary_only')}
                    className="text-blue-600 focus:ring-blue-500" 
                  />
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Ringkasan eksekutif 4 kartu KPI dan visual tren susut (1 halaman).
                </p>
              </div>
            </div>
          </div>

          {/* Bagian 2: Pilihan Rentang Halaman / Baris Varian (Dinamis) */}
          {scope !== 'summary_only' && (
            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/90">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-blue-600" />
                  <span>2. Pilihan Rentang Halaman &amp; Baris Varian</span>
                </label>
                <span className="text-[11px] text-slate-500 font-mono">
                  Total Terdaftar: <strong className="text-slate-800">{totalItems} Varian</strong>
                </span>
              </div>

              {/* Radio Group Pilihan Rentang */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {/* Semua Halaman / Varian */}
                <label className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                  pageRangeOption === 'all' 
                    ? 'bg-white border-blue-500 font-bold text-blue-900 shadow-2xs' 
                    : 'bg-white/80 border-slate-200 text-slate-700 hover:bg-white'
                }`}>
                  <input
                    type="radio"
                    name="pageRange"
                    checked={pageRangeOption === 'all'}
                    onChange={() => handlePresetSelect('all')}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span>Semua Halaman (Varian No. 1 s/d {totalItems})</span>
                </label>

                {/* Rentang Kustom */}
                <label className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                  pageRangeOption === 'custom' 
                    ? 'bg-white border-blue-500 font-bold text-blue-900 shadow-2xs' 
                    : 'bg-white/80 border-slate-200 text-slate-700 hover:bg-white'
                }`}>
                  <input
                    type="radio"
                    name="pageRange"
                    checked={pageRangeOption === 'custom'}
                    onChange={() => setPageRangeOption('custom')}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span>Rentang Varian Tertentu (Kustom)</span>
                </label>
              </div>

              {/* Tombol Preset Cepat */}
              <div className="flex items-center gap-2 flex-wrap pt-1">
                <span className="text-[11px] text-slate-500 font-medium">Pilihan Cepat:</span>
                <button
                  type="button"
                  onClick={() => handlePresetSelect('preset_p1')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                    pageRangeOption === 'preset_p1'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Halaman 1 (No. 1–25)
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetSelect('preset_p2')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                    pageRangeOption === 'preset_p2'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Halaman 2 (No. 26–{totalItems})
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetSelect('preset_top10')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                    pageRangeOption === 'preset_top10'
                      ? 'bg-amber-600 text-white border-amber-600'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-amber-50'
                  }`}
                >
                  ⭐ Top 10 Volume Terbesar
                </button>
              </div>

              {/* Input Nomor Awal & Akhir */}
              <div className="flex items-center gap-3 pt-2">
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
                  <span className="text-slate-500 font-medium">Dari No:</span>
                  <input
                    type="number"
                    min={1}
                    max={totalItems}
                    value={startRow}
                    onChange={(e) => {
                      setPageRangeOption('custom');
                      setStartRow(Math.max(1, parseInt(e.target.value, 10) || 1));
                    }}
                    className="w-14 text-center font-bold text-slate-800 bg-slate-50 rounded px-1.5 py-0.5 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <span className="text-slate-400 font-bold text-xs">s/d</span>

                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
                  <span className="text-slate-500 font-medium">Sampai No:</span>
                  <input
                    type="number"
                    min={startRow}
                    max={totalItems}
                    value={endRow}
                    onChange={(e) => {
                      setPageRangeOption('custom');
                      setEndRow(Math.min(totalItems, parseInt(e.target.value, 10) || totalItems));
                    }}
                    className="w-14 text-center font-bold text-slate-800 bg-slate-50 rounded px-1.5 py-0.5 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="text-xs text-slate-500 ml-auto font-medium">
                  Terpilih: <strong className="text-blue-700">{selectedStats.count} Varian</strong> (~{selectedStats.estPages} Halaman)
                </div>
              </div>
            </div>
          )}

          {/* Bagian 3: Orientasi Kertas */}
          <div className="flex items-center justify-between gap-4 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
            <div>
              <span className="text-xs font-bold text-slate-800 block">Orientasi Dokumen / Kertas</span>
              <span className="text-[11px] text-slate-500">
                Format Landscape sangat direkomendasikan agar 9 kolom tabel terbaca jelas tanpa terpotong
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => setOrientation('landscape')}
                className={`px-3 py-1.5 rounded-xl font-bold border transition-all ${
                  orientation === 'landscape'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Landscape (Horizontal)
              </button>
              <button
                type="button"
                onClick={() => setOrientation('portrait')}
                className={`px-3 py-1.5 rounded-xl font-bold border transition-all ${
                  orientation === 'portrait'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Portrait (Vertikal)
              </button>
            </div>
          </div>

          {/* Ringkasan Parameter Dokumen */}
          <div className="bg-blue-50/60 rounded-2xl p-3.5 border border-blue-100 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-blue-950">
              <Calendar className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <span>
                <strong>Periode:</strong> {periodeLabel} &bull; <strong>Jalur:</strong> {jenisProses}
              </span>
            </div>
            <div className="text-blue-800 font-mono text-[11px] whitespace-nowrap">
              Estimasi: {selectedStats.estPages} Halaman
            </div>
          </div>

        </div>

        {/* Modal Footer: 2 Tindakan Utama (Direct Print vs Export PDF) */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-100/80 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3">
          
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-xl transition-colors text-center order-3 sm:order-1"
          >
            Batal
          </button>

          <div className="flex items-center gap-2.5 flex-1 sm:justify-end order-1 sm:order-2">
            {/* Tombol 1: PRINT LANGSUNG (Printer Fisik) */}
            <button
              type="button"
              onClick={handleDirectPrint}
              className="flex-1 sm:flex-none min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold shadow-sm transition-all hover:shadow"
              title="Kirim langsung ke printer fisik atau jendela dialog cetak"
            >
              <Printer className="w-4 h-4 text-blue-300" />
              <span>Cetak Langsung</span>
            </button>

            {/* Tombol 2: UNDUH / EXPORT PDF */}
            <button
              type="button"
              onClick={handleDownloadServerPdf}
              disabled={isExportingServerPdf}
              className="flex-1 sm:flex-none min-h-[44px] flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all hover:shadow-lg hover:shadow-blue-500/30"
              title="Unduh dokumen resmi dalam bentuk file PDF resolusi tinggi"
            >
              <Download className="w-4 h-4" />
              <span>{isExportingServerPdf ? 'Membuat PDF...' : 'Unduh File PDF'}</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
