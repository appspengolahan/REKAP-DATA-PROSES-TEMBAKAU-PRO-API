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
  ChevronRight,
  GitCompare,
  Check,
  Cable
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
  isAutoSync?: boolean;
  onToggleAutoSync?: () => void;
  onRefresh: () => void;
  onPullDatasheet?: () => void;
  isPullingDatasheet?: boolean;
  onOpenIntegrasiDhp?: () => void;
  onOpenSwitchBoard: () => void;
  onOpenGasCenter: () => void;
  onOpenHelp: () => void;
  onExportPdf: () => void;
  onOpenMobileSidebar?: () => void;
}

export const HeaderRekapDataProsesTembakau: React.FC<HeaderProps> = ({
  entriTerkini,
  role,
  onRoleChange,
  jenisProses,
  onJenisProsesChange,
  gasConfig,
  isSyncing,
  isAutoSync = true,
  onToggleAutoSync,
  onRefresh,
  onPullDatasheet,
  isPullingDatasheet,
  onOpenIntegrasiDhp,
  onOpenSwitchBoard,
  onOpenGasCenter,
  onOpenHelp,
  onExportPdf,
  onOpenMobileSidebar
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isJalurOpen, setIsJalurOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const jalurDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (jalurDropdownRef.current && !jalurDropdownRef.current.contains(event.target as Node)) {
        setIsJalurOpen(false);
      }
    };
    if (isDropdownOpen || isJalurOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen, isJalurOpen]);

  // Close dropdown on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsDropdownOpen(false);
        setIsJalurOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header className="no-print bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md flex-shrink-0">
      <div className="w-full px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          
          {/* Logo & Main Title (Always full title without truncation on desktop) */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-shrink-0">
            {/* Mobile/Tablet Hamburger Menu Button */}
            {onOpenMobileSidebar && (
              <button
                type="button"
                onClick={onOpenMobileSidebar}
                className="lg:hidden p-1.5 sm:p-2 -ml-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 transition-colors flex items-center justify-center shadow-sm"
                title="Buka Navigasi Sidebar & Modul Lengkap"
                aria-label="Buka Menu Sidebar"
              >
                <Menu className="w-5 h-5 text-blue-400" />
              </button>
            )}

            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center font-bold text-white shadow-md flex-shrink-0 text-sm sm:text-base tracking-wider ring-1 ring-amber-400/30">
              PP1
            </div>
            <div className="min-w-0 flex flex-col justify-center">
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base lg:text-lg font-bold tracking-tight text-slate-100 whitespace-nowrap">
                  <span className="hidden sm:inline">Monitoring Board — </span>Rekap Data Proses Tembakau
                </h1>
                <span className="hidden 2xl:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 flex-shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  {gasConfig.status === 'online' ? 'Headless GAS Online' : 'Offline Cache'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-slate-400 mt-0.5 whitespace-nowrap">
                <span className="text-slate-300 font-medium">PT Batu Karang</span>
                <span className="text-slate-600 hidden sm:inline">·</span>
                <span className="hidden sm:inline">Divisi Produksi I</span>
                <span className="text-slate-600">·</span>
                <span className="inline-flex items-center gap-1 text-amber-300/90 font-medium text-[11px]">
                  <Calendar className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  <span>Entri: {entriTerkini}</span>
                </span>
                <span className="hidden md:inline-flex 2xl:hidden items-center gap-1 text-[11px] text-emerald-400 font-medium">
                  <span className="text-slate-600">·</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  {gasConfig.status === 'online' ? 'GAS Online' : 'Offline'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Center */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            
            {/* Jalur Toggle Dropdown (Clean, compact replacement for wide segmented buttons) */}
            <div className="relative hidden md:block" ref={jalurDropdownRef}>
              <button
                type="button"
                onClick={() => setIsJalurOpen(prev => !prev)}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all select-none shadow-sm ${
                  jenisProses === 'SKT'
                    ? 'bg-amber-950/70 border-amber-600/80 text-amber-300 ring-1 ring-amber-500/30'
                    : jenisProses === 'SKM'
                    ? 'bg-blue-950/70 border-blue-600/80 text-blue-300 ring-1 ring-blue-500/30'
                    : 'bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 border-slate-700 hover:border-slate-600'
                }`}
                title="Pilih Jalur Proses (Semua / SKT / SKM)"
                aria-haspopup="true"
                aria-expanded={isJalurOpen}
              >
                <GitCompare className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <span className="text-slate-400 font-normal">Jalur:</span>
                <span className="font-bold">
                  {jenisProses === 'Semua' ? 'Semua Jalur' : jenisProses}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isJalurOpen ? 'rotate-180 text-white' : 'text-slate-400'}`} />
              </button>

              {/* Jalur Popover Menu */}
              {isJalurOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl z-50 overflow-hidden p-1.5 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Pilih Jalur Proses
                  </div>
                  {(['Semua', 'SKT', 'SKM'] as JenisProsesType[]).map((jp) => {
                    const isSelected = jenisProses === jp;
                    return (
                      <button
                        key={jp}
                        onClick={() => {
                          onJenisProsesChange(jp);
                          setIsJalurOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                          isSelected
                            ? jp === 'SKT'
                              ? 'bg-amber-600 text-white shadow-sm'
                              : jp === 'SKM'
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'bg-slate-700 text-white shadow-sm'
                            : 'hover:bg-slate-800 text-slate-300 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${
                            jp === 'SKT' ? 'bg-amber-400' : jp === 'SKM' ? 'bg-blue-400' : 'bg-slate-400'
                          }`} />
                          <span>{jp === 'Semua' ? 'Semua Jalur (SKT & SKM)' : jp === 'SKT' ? 'SKT (Tangan)' : 'SKM (Mesin)'}</span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Integrasi DHP Button (Visible on Tablet and Desktop) */}
            {onOpenIntegrasiDhp && (
              <button
                onClick={onOpenIntegrasiDhp}
                className="hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-blue-600/90 hover:bg-blue-600 text-white text-xs font-semibold shadow-sm border border-blue-500/40 transition-colors"
                title="Integrasi & Sinkronisasi DHP Tembakau (Presisi 100%)"
              >
                <Cable className="w-3.5 h-3.5 text-blue-200" />
                <span className="hidden xl:inline">Integrasi DHP</span>
                <span className="px-1.5 py-0.5 rounded-full text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-600 font-bold">
                  100%
                </span>
              </button>
            )}

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

            {/* Auto Sync / Auto Refresh Toggle Button (Circled in Red by User) */}
            <button
              onClick={onToggleAutoSync || onRefresh}
              className={`relative flex items-center gap-1.5 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border transition-all shadow-sm select-none ${
                isAutoSync
                  ? 'bg-emerald-950/80 border-emerald-500/70 text-emerald-300 ring-1 ring-emerald-500/40 hover:bg-emerald-900/90'
                  : 'bg-slate-800/90 hover:bg-slate-700/90 text-slate-400 hover:text-slate-200 border-slate-700'
              }`}
              title={
                isAutoSync
                  ? 'Auto Sync: AKTIF (Icon berputar terus — Data Google Sheet terus terupdate otomatis tiap 25 detik). Klik untuk menjeda.'
                  : 'Auto Sync: NONAKTIF. Klik untuk mengaktifkan Auto Refresh otomatis.'
              }
              aria-label="Toggle Auto Sync"
            >
              <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isAutoSync || isSyncing ? 'animate-spin text-emerald-400' : 'text-slate-400'}`} />
              <span className="hidden xl:inline text-xs font-semibold">
                {isAutoSync ? 'Auto Sync' : 'Sync'}
              </span>
              {isAutoSync && (
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              )}
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

                    {/* Auto Sync Live Switcher */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-700/60 text-[11px]">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <RefreshCw className={`w-3 h-3 ${isAutoSync ? 'animate-spin text-emerald-400' : 'text-slate-400'}`} />
                        <span>Auto Sync Live:</span>
                      </div>
                      {onToggleAutoSync && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleAutoSync();
                          }}
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-all ${
                            isAutoSync 
                              ? 'bg-emerald-600 text-white shadow-sm' 
                              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                          }`}
                          title="Klik untuk menghidupkan / mematikan Auto Refresh otomatis"
                        >
                          {isAutoSync ? '● AKTIF' : '○ NONAKTIF'}
                        </button>
                      )}
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

                    {/* Item: Integrasi DHP Tembakau */}
                    {onOpenIntegrasiDhp && (
                      <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          onOpenIntegrasiDhp();
                        }}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800 transition-colors text-left group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl group-hover:bg-blue-500/20 transition-colors">
                            <Cable className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-200 group-hover:text-white flex items-center gap-1.5">
                              <span>Integrasi DHP Tembakau</span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">100%</span>
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Otomasi &amp; sinkronisasi lembar DHP
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-300 transition-transform group-hover:translate-x-0.5" />
                      </button>
                    )}

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
