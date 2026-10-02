import React from 'react';
import { X, HelpCircle, CheckCircle2, Sliders, Calendar, Layers, Printer, RefreshCw, Cpu } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModalRekapDataProsesTembakau: React.FC<HelpModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="no-print fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 text-blue-800 rounded-xl">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                Pusat Bantuan & Petunjuk Operasional
              </h2>
              <div className="text-xs text-slate-500 font-mono">
                Project: Monitoring Board — Rekap Data Proses Tembakau (v2.0 Modern Migration)
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700 leading-relaxed">
          
          <div className="p-3.5 bg-blue-50/80 rounded-xl border border-blue-100">
            <h3 className="font-bold text-slate-800 text-xs mb-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              Sistem Paralel (Migrasi Headless V2)
            </h3>
            <p className="text-[11px] text-slate-600">
              Web app ini membaca data mentah dari sheet <code>REKAP SUSUT TEMBAKAU</code>. Script Google Apps Script yang baru berjalan secara paralel tanpa mengganggu web app lama sampai seluruh tim produksi siap beralih.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-slate-900 text-sm mb-3">Cara Penggunaan:</h3>
            <ol className="space-y-3 pl-1">
              <li className="flex items-start gap-2.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-900 text-white font-bold text-[10px] flex-shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <strong>Filter Global Jalur (SKT vs SKM):</strong> Gunakan tombol switcher di header untuk memisahkan profil Sigaret Kretek Tangan (SKT) dan Sigaret Kretek Mesin (SKM) atau pilih &quot;Semua Jalur&quot;.
                </div>
              </li>

              <li className="flex items-start gap-2.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-900 text-white font-bold text-[10px] flex-shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  <strong>Filter Tahun & Bulan Ringkasan:</strong> Gunakan selector tahun untuk memfilter seluruh data. Di card Rekap Bulanan, pilih bulan tertentu untuk melihat kinerja bulan tersebut.
                </div>
              </li>

              <li className="flex items-start gap-2.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-900 text-white font-bold text-[10px] flex-shrink-0 mt-0.5">
                  3
                </span>
                <div>
                  <strong>Rekap Rentang Periode (Kuartal / Bebas):</strong> Di card rentang periode, tentukan bulan & tahun awal s/d akhir (mis. Januari 2026 s/d Maret 2026) lalu klik <em>Terapkan</em>. Kontrol ini sekaligus menyelaraskan tabel per Jenis Tembakau.
                </div>
              </li>

              <li className="flex items-start gap-2.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-900 text-white font-bold text-[10px] flex-shrink-0 mt-0.5">
                  4
                </span>
                <div>
                  <strong>Analisis 54 Jenis Tembakau & Tren Spesifik:</strong> Buka tab <em>Rekap per Jenis Tembakau</em>. Pilih jenis tembakau tertentu pada dropdown grafik tren untuk mengamati fluktuasi kesusutan varian tersebut antar bulan.
                </div>
              </li>

              <li className="flex items-start gap-2.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-900 text-white font-bold text-[10px] flex-shrink-0 mt-0.5">
                  5
                </span>
                <div>
                  <strong>Cetak Laporan Resmi (PDF):</strong> Klik tombol <em>Export PDF</em> di header. Halaman cetak otomatis disesuaikan secara rapi dengan nama dokumen terstandarisasi dan footer hak cipta resmi.
                </div>
              </li>

              <li className="flex items-start gap-2.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-900 text-white font-bold text-[10px] flex-shrink-0 mt-0.5">
                  6
                </span>
                <div>
                  <strong>Peralihan Antar Aplikasi Operasional:</strong> Gunakan tombol <em>Switch App</em> untuk beralih ke rekap Blend, Cengkeh, Krosok, maupun Persediaan Gudang PP1.
                </div>
              </li>
            </ol>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <h4 className="font-bold text-slate-800 text-xs mb-1">Ketentuan Desimal & Rumus Indonesia:</h4>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600">
              <li>Persentase Susut, Gagang, Air & Debu: <strong>2 desimal</strong> (contoh: <code>6.30%</code>).</li>
              <li>Netto Bahan Baku, Hasil & Susut (Kg): <strong>1 desimal</strong> (contoh: <code>3,250.0 Kg</code>).</li>
              <li>Rumus Spreadsheet memakai pemisah <strong>titik koma (;)</strong> standar regional Indonesia.</li>
            </ul>
          </div>
        </div>

        {/* Modal Footer Sesuai Ketentuan No. 5 */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 text-center space-y-1">
          <div className="text-xs font-semibold text-slate-800">
            Monitoring Board — Rekap Data Proses Tembakau All Rights Reserved . Divisi Produksi I . Developed by Lalu Mahendra
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            Jika menemukan bug atau kendala teknis, silahkan hubungi Developer [Lalu Mahendra]
          </div>
        </div>
      </div>
    </div>
  );
};
