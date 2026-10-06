import React, { useState, useRef, useEffect } from 'react';
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
  Database,
  Menu,
  ChevronDown,
  X,
  ExternalLink,
  ChevronRight
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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Close dropdown on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header className="no-print bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md flex-shrink-0">
      <div className="w-full px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          
          {/* Logo & Main Title */}
          <div className="flex items-center gap-3 min-w-0 flex-shrink">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center font-bold text-white shadow-md flex-shrink-0 text-sm sm:text-base tracking-wider ring-1 ring-amber-400/30">
              PP1
            </div>
            <div className="min-w-0 flex flex-col justify-center">
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base lg:text-lg font-bold tracking-tight text-slate-100 truncate">
                  <span className="hidden md:inline">Monitoring Board — </span>Rekap Data Proses Tembakau
                </h1>
                <span className="hidden xl:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 flex-shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  {gasConfig.status === 'online' ? 'Headless GAS Online' : 'Offline Cache'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-slate-400 mt-0.5 truncate">
                <span className="text-slate-300 font-medium">PT Batu Karang</span>
                <span className="text-slate-600 hidden sm:inline">·</span>
                <span className="hidden sm:inline">Divisi Produksi I</span>
                <span className="text-slate-600">·</span>
                <span className="inline-flex items-center gap-1 text-amber-300/90 font-medium text-[11px]">
                  <Calendar className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  <span>Entri: {entriTerkini}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Action Center */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            
            {/* Global SKT / SKM Switcher (Visible on desktop) */}
            <div className="hidden lg:flex items-center bg-slate-800/90 p-1 rounded-xl border border-slate-700">
              <span className="text-xs text-slate-400 px-2 font-medium">Jalur:</span>
              {(['Semua', 'SKT', 'SKM'] as JenisProsesType[]).map((jp) => {
                const isActive = jenisProses === jp;
                return (
                  <button
                    key={jp}
                    onClick={() => onJenisProsesChange(jp)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
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

            {/* Tarik Data Langsung dari Datasheet Button */}
            {onPullDatasheet && (
              <button
                onClick={onPullDatasheet}
                disabled={isPullingDatasheet}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors ${
                  isPullingDatasheet ? 'opacity-70 cursor-not-allowed' : ''
                }`}
                title="Tarik Data Langsung dari Datasheet Google Sheet (1.493 baris riil)"
              >
                <Database className={`w-3.5 h-3.5 ${isPullingDatasheet ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{isPullingDatasheet ? 'Menarik...' : 'Tarik Datasheet'}</span>
              </button>
            )}

            {/* Quick 1-Tap Refresh Button */}
            <button
              onClick={onRefresh}
              disabled={isSyncing}
              className={`p-1.5 sm:p-2 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white transition-colors flex items-center justify-center ${
                isSyncing ? 'opacity-70 cursor-not-allowed' : ''
              }`}
              title="Refresh / Sinkronisasi Data Cepat"
            >
              <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isSyncing ? 'animate-spin text-amber-400' : ''}`} />
            </button>

            {/* Export PDF Button */}
            <button
              onClick={onExportPdf}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors"
              title="Cetak / Unduh Laporan PDF Resmi"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export PDF</span>
            </button>

            {/* UNIFIED TOGGLE DROPDOWN: PM: Lalu M. + Switch App + GAS Center */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(prev => !prev)}
                className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all select-none shadow-sm ${
                  isDropdownOpen
                    ? 'bg-slate-800 text-white border-blue-500 shadow-blue-900/40 ring-2 ring-blue-500/30'
                    : 'bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 border-slate-700 hover:border-slate-600'
                }`}
                title="Buka Menu Profil, Switch App & GAS Center"
                aria-haspopup="true"
                aria-expanded={isDropdownOpen}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                <span className="font-medium text-slate-100 truncate max-w-[90px] sm:max-w-none">
                  {role === 'Project Manager' ? 'PM: Lalu M.' : role}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180 text-blue-400' : 'text-slate-400'}`} />
              </button>

              {/* Dropdown Menu Popover */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-76 sm:w-84 bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl z-50 overflow-hidden divide-y divide-slate-800 animate-in fade-in slide-in-from-top-2 duration-150">
                  
                  {/* Section 1: User Profile & Role Switcher */}
                  <div className="p-3.5 bg-slate-800/60 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                        Peran Pengguna (RBAC)
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-800/70">
                        {role}
                      </span>
                    </div>

                    <div className="relative">
                      <select
                        value={role}
                        onChange={(e) => {
                          onRoleChange(e.target.value as UserRole);
                        }}
                        className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        title="Ganti Peran Pengguna"
                      >
                        <option value="Project Manager" className="bg-slate-900 text-white">PM: Lalu Mahendra</option>
                        <option value="Site Engineer" className="bg-slate-900 text-white">Site Engineer</option>
                        <option value="Admin" className="bg-slate-900 text-white">Super Admin</option>
                        <option value="Vendor" className="bg-slate-900 text-white">Vendor</option>
                        <option value="Client" className="bg-slate-900 text-white">Client Hub</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between pt-0.5 text-[11px]">
                      <span className="text-slate-400">Status Backend:</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        gasConfig.status === 'online' 
                          ? 'bg-emerald-950/90 text-emerald-400 border border-emerald-800' 
                          : 'bg-amber-950/90 text-amber-400 border border-amber-800'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${gasConfig.status === 'online' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
                        {gasConfig.status === 'online' ? 'Headless GAS Online' : 'Offline Cache'}
                      </span>
                    </div>
                  </div>

                  {/* Section 2: Quick Navigation & Modules (Switch App & GAS Center as in red boxes) */}
                  <div className="p-2 space-y-1">
                    
                    {/* Item 1: Switch App Board */}
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        onOpenSwitchBoard();
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800 transition-colors text-left group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl group-hover:bg-amber-500/20 transition-colors">
                          <LayoutGrid className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-200 group-hover:text-white flex items-center gap-1.5">
                            <span>Switch App Board</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-400 border border-amber-800 font-normal">Hub</span>
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Pindah monitoring board divisi lain
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-300 transition-transform group-hover:translate-x-0.5" />
                    </button>

                    {/* Item 2: Headless GAS Center */}
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        onOpenGasCenter();
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800 transition-colors text-left group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-xl group-hover:bg-cyan-500/20 transition-colors">
                          <Cpu className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-200 group-hover:text-white flex items-center gap-1.5">
                            <span>Headless GAS Center</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-normal">API V2</span>
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Konfigurasi REST API & Endpoint V2
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-300 transition-transform group-hover:translate-x-0.5" />
                    </button>

                    {/* Item 3: Bantuan & Panduan */}
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        onOpenHelp();
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800 transition-colors text-left group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-700/50 text-slate-300 rounded-xl group-hover:bg-slate-700 transition-colors">
                          <HelpCircle className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-200 group-hover:text-white">
                            Bantuan & Panduan
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Petunjuk fitur & rumus kesusutan
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-300 transition-transform group-hover:translate-x-0.5" />
                    </button>

                  </div>

                  {/* Section 3: Dropdown Footer Info */}
                  <div className="p-3 bg-slate-950/60 text-[10px] text-slate-500 flex items-center justify-between">
                    <span>PT Batu Karang · Divisi Produksi I</span>
                    <span className="font-mono text-slate-400">v2.0 Headless</span>
                  </div>

                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </header>
  );
};
