import React from 'react';
import { X, ExternalLink, CheckCircle2, Layers, Package, Activity, FileSpreadsheet, Users, ShieldAlert } from 'lucide-react';

interface SwitchBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SwitchBoardModalRekapDataProsesTembakau: React.FC<SwitchBoardModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const currentCommodityApps = [
    {
      name: "Rekap Susut Tembakau",
      desc: "Dashboard Kesusutan Proses Tembakau (SKT & SKM) 54 Varian",
      status: "active",
      url: "#",
      badge: "Sedang Dibuka"
    },
    {
      name: "Rekap Susut Blend",
      desc: "Monitoring Komposisi & Yield Formula Blend Pabrik",
      status: "external",
      url: "https://appspengolahan.github.io/Rekap-Proses-Blend/",
      badge: "Live App"
    },
    {
      name: "Rekap Susut Cengkeh",
      desc: "Kesusutan Sortasi & Pemisahan Gagang Cengkeh",
      status: "external",
      url: "https://appspengolahan.github.io/Rekap-proses-cengkeh/",
      badge: "Live App"
    },
    {
      name: "Rekap Susut Krosok",
      desc: "Monitoring Grading & Destemming Bahan Baku Krosok",
      status: "external",
      url: "https://appspengolahan.github.io/Rekap-Proses-Krosok/",
      badge: "Live App"
    }
  ];

  const factoryEcosystemApps = [
    {
      name: "Monitoring Stock Persediaan PP1",
      desc: "Stok Live 4 Komoditas: Cengkeh, Tembakau, Krosok, Blend",
      url: "https://script.google.com/macros/s/AKfycbywAsu-wvbBxWwl2P9YojeZgR13U3BR9cS8THDCGE9EMINUXIIcR1HjoAK59W1Aqm1lYQ/exec",
      icon: Package,
      type: "Vercel / GAS Live"
    },
    {
      name: "General Monitoring & OEE Pabrik",
      desc: "Telemetri 4 Lini Mesin Pengolahan, Suhu & Kelembaban (RH)",
      url: "#",
      icon: Activity,
      type: "Modul PP1"
    },
    {
      name: "Modul HR Pekerja Harian Lepas (PHL)",
      desc: "Master NIP PHL, Presensi Mandor, Output Tonase & Upah Borongan",
      url: "#",
      icon: Users,
      type: "Roadmap PP1"
    },
    {
      name: "Modul HR Staff & Karyawan Tetap",
      desc: "Presensi Geofence GPS 150m, Shift 1-3 & Scoring KPI Bulanan",
      url: "#",
      icon: ShieldAlert,
      type: "Roadmap PP1"
    }
  ];

  return (
    <div className="no-print fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                Pabrik PP1 — Master Switch Board
              </h2>
              <p className="text-xs text-slate-500">
                Akses cepat ekosistem aplikasi operasional Divisi Produksi I
              </p>
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
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Komoditas Pengolahan Section */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Monitoring Rekap 4 Komoditas
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentCommodityApps.map((app, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl border transition-all ${
                    app.status === 'active'
                      ? 'bg-blue-50/70 border-blue-200 ring-2 ring-blue-500/20'
                      : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h4 className="font-semibold text-xs sm:text-sm text-slate-800">
                      {app.name}
                    </h4>
                    {app.status === 'active' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                        <CheckCircle2 className="w-3 h-3 text-blue-600" />
                        Aktif
                      </span>
                    ) : (
                      <a
                        href={app.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800"
                      >
                        Buka
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2">
                    {app.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Sistem Sentral Pabrik PP1 */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Sistem Operasional Terintegrasi
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {factoryEcosystemApps.map((app, idx) => {
                const Icon = app.icon;
                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex items-start gap-3"
                  >
                    <div className="p-2 rounded-lg bg-slate-100 text-slate-600 flex-shrink-0 mt-0.5">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <h4 className="font-semibold text-xs text-slate-800 truncate">
                          {app.name}
                        </h4>
                        {app.url !== '#' && (
                          <a
                            href={app.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:text-blue-700 flex-shrink-0"
                            title="Buka Link"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                        {app.desc}
                      </p>
                      <span className="inline-block mt-1 text-[9px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                        {app.type}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>PT Batu Karang — Master Blueprint Roadmap</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 text-white font-medium hover:bg-slate-700 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
