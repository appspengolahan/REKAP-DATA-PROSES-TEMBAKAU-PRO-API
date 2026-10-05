import React from 'react';
import { 
  RefreshCw, 
  HelpCircle, 
  FileText, 
  Cpu, 
  LayoutGrid, 
  ShieldCheck, 
  Calendar,
  CheckCircle2,
  AlertCircle,
  Database
} from 'lucide-react';
import { UserRole, JenisProsesType, GasConfig } from '../types[RekapDataProsesTembakau]';

interface HeaderProps {
  entriTerkini: string;
  role: UserRole;
  onRoleChange: (r: UserRole) => void;
  jenisProses: JenisProsesType;
  onJenisProsesChange: (j: JenisProsesType) => void;
  gasConfig: GasConfig;
  isSyncing: boolean;
  onRefresh: () => void;
  onPullDatasheet?: () => void;
  isPullingDatasheet?: boolean;
  onOpenSwitchBoard: () => void;
  onOpenGasCenter: () => void;
  onOpenHelp: () => void;
  onExportPdf: () => void;
}

export const HeaderRekapDataProsesTembakau: React.FC<HeaderProps> = ({
  entriTerkini,
  role,
  onRoleChange,
  jenisProses,
  onJenisProsesChange,
  gasConfig,
  isSyncing,
  onRefresh,
  onPullDatasheet,
  isPullingDatasheet,
  onOpenSwitchBoard,
  onOpenGasCenter,
  onOpenHelp,
  onExportPdf
}) => {
  return (
    <header className="no-print bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md flex-shrink-0">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3 sm:gap-4">
          
          {/* Logo & Main Title (Clean, 2-line layout without overlapping) */}
          <div className="flex items-center gap-3 min-w-0 flex-shrink">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center font-bold text-white shadow-md flex-shrink-0 text-base tracking-wider ring-1 ring-amber-400/30">
              PP1
            </div>
            <div className="min-w-0 flex flex-col justify-center">
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base lg:text-lg font-bold tracking-tight text-slate-100 truncate">
                  <span className="hidden md:inline">Monitoring Board — </span>Rekap Data Proses Tembakau
                </h1>
                <span className="hidden xl:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 flex-shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  {gasConfig.status === 'online' ? 'Headless GAS Active' : 'Offline Cache'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5 truncate">
                <span className="text-slate-300 font-medium">PT Batu Karang</span>
                <span className="text-slate-600">·</span>
                <span>Divisi Produksi I</span>
                <span className="text-slate-600 hidden sm:inline">·</span>
                <span className="hidden sm:inline-flex items-center gap-1 text-amber-300/90 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  Entri: {entriTerkini}
                </span>
              </div>
            </div>
          </div>

          {/* Action Center & Global Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            
            {/* Global SKT / SKM Switcher */}
            <div className="hidden lg:flex items-center bg-slate-800/90 p-1 rounded-lg border border-slate-700">
              <span className="text-xs text-slate-400 px-2 font-medium">Jalur:</span>
              {(['Semua', 'SKT', 'SKM'] as JenisProsesType[]).map((jp) => {
                const isActive = jenisProses === jp;
                return (
                  <button
                    key={jp}
                    onClick={() => onJenisProsesChange(jp)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded transition-all ${
                      isActive 
                        ? jp === 'SKT'
                          ? 'bg-amber-600 text-white shadow-sm'
                          : jp === 'SKM'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-slate-700 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    {jp === 'Semua' ? 'Semua Jalur' : jp}
                  </button>
                );
              })}
            </div>

            {/* RBAC Selector */}
            <div className="relative flex items-center bg-slate-800/90 border border-slate-700 rounded-lg px-2 sm:px-2.5 py-1 text-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-400 mr-1.5 hidden sm:inline flex-shrink-0" />
              <select
                value={role}
                onChange={(e) => onRoleChange(e.target.value as UserRole)}
                className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer pr-1 text-xs"
                title="Pilih Peran Pengguna (RBAC)"
              >
                <option value="Project Manager" className="bg-slate-900 text-white">PM: Lalu M.</option>
                <option value="Site Engineer" className="bg-slate-900 text-white">Site Engineer</option>
                <option value="Admin" className="bg-slate-900 text-white">Super Admin</option>
                <option value="Vendor" className="bg-slate-900 text-white">Vendor</option>
                <option value="Client" className="bg-slate-900 text-white">Client Hub</option>
              </select>
            </div>

            {/* Tarik Data Langsung dari Datasheet Button */}
            {onPullDatasheet && (
              <button
                onClick={onPullDatasheet}
                disabled={isPullingDatasheet}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors ${
                  isPullingDatasheet ? 'opacity-70 cursor-not-allowed' : ''
                }`}
                title="Tarik Data Langsung dari Datasheet Google Sheet (1.487 baris riil)"
              >
                <Database className={`w-3.5 h-3.5 ${isPullingDatasheet ? 'animate-spin' : ''}`} />
                <span className="hidden xl:inline">{isPullingDatasheet ? 'Menarik...' : 'Tarik Datasheet'}</span>
              </button>
            )}

            {/* Refresh Sync Button */}
            <button
              onClick={onRefresh}
              disabled={isSyncing}
              className={`p-1.5 sm:p-2 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-800 transition-colors text-slate-300 hover:text-white flex items-center justify-center ${
                isSyncing ? 'opacity-70 cursor-not-allowed' : ''
              }`}
              title="Sinkronisasi Data dengan Google Apps Script"
            >
              <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isSyncing ? 'animate-spin text-amber-400' : ''}`} />
            </button>

            {/* Switch App Board Button */}
            <button
              onClick={onOpenSwitchBoard}
              className="hidden lg:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-slate-200 text-xs font-semibold transition-colors"
              title="Pindah ke Monitoring Board Divisi Lain"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden xl:inline">Switch App</span>
            </button>

            {/* Headless GAS Center Button */}
            <button
              onClick={onOpenGasCenter}
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-slate-200 text-xs font-semibold transition-colors"
              title="Konfigurasi Headless GAS REST API"
            >
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden md:inline">GAS Center</span>
            </button>

            {/* Export PDF Button */}
            <button
              onClick={onExportPdf}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors"
              title="Cetak / Unduh Laporan PDF Resmi"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export PDF</span>
            </button>

            {/* Help Button */}
            <button
              onClick={onOpenHelp}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs flex items-center justify-center transition-colors flex-shrink-0"
              title="Bantuan & Petunjuk Penggunaan"
            >
              <HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

          </div>
        </div>
      </div>
    </header>
  );
};
