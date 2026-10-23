import React from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  Layers,
  GitCompare,
  Database,
  Cpu,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Cable,
  Sparkles,
  Menu,
  X,
  TrendingUp
} from 'lucide-react';
import { ActiveTabType } from '../types[RekapDataProsesTembakau]';

export type { ActiveTabType };

interface SidebarProps {
  activeTab: ActiveTabType;
  onTabChange: (tab: ActiveTabType) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onOpenGasCenter: () => void;
  onOpenIntegrasiDhp: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const SidebarRekapDataProsesTembakau: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  isCollapsed,
  onToggleCollapse,
  onOpenGasCenter,
  onOpenIntegrasiDhp,
  isMobileOpen = false,
  onCloseMobile
}) => {
  const menuItems = [
    {
      id: 'dashboard' as ActiveTabType,
      label: 'Dashboard Kesusutan',
      sublabel: 'Ringkasan & Rentang Periode',
      icon: LayoutDashboard
    },
    {
      id: 'rekap-bulan' as ActiveTabType,
      label: 'Rekap per Bulan',
      sublabel: 'Tren Bulanan & Rasio Bahan',
      icon: CalendarDays
    },
    {
      id: 'rekap-jenis' as ActiveTabType,
      label: 'Rekap per Jenis Tembakau',
      sublabel: '54 Varian & Analisis Spesifik',
      icon: Layers
    },
    {
      id: 'matriks-skt-skm' as ActiveTabType,
      label: 'Matriks SKT vs SKM',
      sublabel: 'Komponen Gagang, Air & Debu',
      icon: GitCompare
    },
    {
      id: 'data-explorer' as ActiveTabType,
      label: 'Log Data Harian',
      sublabel: 'Verifikasi & Audit Baris Mentah',
      icon: Database
    },
    {
      id: 'analisis-deviasi' as ActiveTabType,
      label: 'Analisis Deviasi & Acuan',
      sublabel: 'Evaluasi Riil vs Standar Mutu',
      icon: TrendingUp
    },
    {
      id: 'switch-app' as ActiveTabType,
      label: 'Switch App',
      sublabel: 'Hub Ekosistem Pabrik PP1',
      icon: LayoutGrid
    }
  ];

  return (
    <>
      {/* Desktop Persistent Sidebar (Screens >= lg) */}
      <aside
        className={`no-print hidden lg:flex bg-slate-900 border-r border-slate-800 text-slate-300 flex-col transition-all duration-300 relative select-none z-20 flex-shrink-0 h-full ${
          isCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        {/* Sidebar Header toggle */}
        <div className="h-12 border-b border-slate-800 flex items-center justify-between px-3">
          {!isCollapsed && (
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Navigasi Modul
            </span>
          )}
          <button
            onClick={onToggleCollapse}
            className={`p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors ${
              isCollapsed ? 'mx-auto' : 'ml-auto'
            }`}
            title={isCollapsed ? 'Perlebar Sidebar (256px)' : 'Kecilkan ke Rail Mode (68px)'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 py-4 px-2 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold shadow-sm shadow-blue-900/50'
                    : 'hover:bg-slate-800/80 text-slate-400 hover:text-slate-200'
                }`}
                title={item.label}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                {!isCollapsed && (
                  <div className="min-w-0">
                    <div className="text-xs font-semibold leading-tight truncate">{item.label}</div>
                    <div className={`text-[10px] leading-tight truncate ${isActive ? 'text-blue-100' : 'text-slate-500'}`}>
                      {item.sublabel}
                    </div>
                  </div>
                )}
              </button>
            );
          })}

          {/* Menu Khusus: Integrasi DHP Tembakau (Membuka Modal Integrasi & Otomasi) */}
          <button
            onClick={onOpenIntegrasiDhp}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all border border-blue-500/40 bg-gradient-to-r from-blue-950/50 to-indigo-950/40 hover:from-blue-900/60 hover:to-indigo-900/60 text-blue-200 hover:text-white shadow-sm my-1"
            title="Integrasi & Sinkronisasi DHP Tembakau (Presisi 100%)"
          >
            <div className="relative flex-shrink-0">
              <Cable className="w-5 h-5 text-blue-400" />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold leading-tight truncate text-white">Integrasi DHP Tembakau</div>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700/60">
                    100%
                  </span>
                </div>
                <div className="text-[10px] text-blue-200/70 leading-tight truncate">
                  Otomasi Lembar DHP
                </div>
              </div>
            )}
          </button>

          <div className="pt-4 mt-4 border-t border-slate-800">
            <button
              onClick={onOpenGasCenter}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-slate-800/80 text-cyan-400 hover:text-cyan-300 transition-colors`}
              title="Headless GAS Center (REST Engine)"
            >
              <Cpu className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && (
                <div className="min-w-0">
                  <div className="text-xs font-semibold leading-tight truncate">Headless GAS Center</div>
                  <div className="text-[10px] text-slate-500 leading-tight truncate">Endpoint & Script V2</div>
                </div>
              )}
            </button>
          </div>
        </nav>

        {/* Rail Mode Tooltip Footer */}
        {isCollapsed && (
          <div className="p-2 text-center text-[10px] text-slate-500 border-t border-slate-800">
            PP1
          </div>
        )}
      </aside>

      {/* Mobile & Tablet Slide-Over Drawer (Screens < lg: HP & Tablet) */}
      {isMobileOpen && (
        <div className="no-print lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop Dimmer */}
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />

          {/* Drawer Sidebar Panel */}
          <div className="relative w-80 max-w-[85vw] bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col h-full shadow-2xl z-10 animate-in slide-in-from-left duration-250">
            {/* Drawer Header */}
            <div className="h-16 border-b border-slate-800 flex items-center justify-between px-4 bg-slate-950/70 flex-shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center font-bold text-white shadow-md flex-shrink-0 text-sm">
                  PP1
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white leading-tight truncate">
                    Rekap Data Tembakau
                  </div>
                  <div className="text-[10px] text-slate-400 leading-tight truncate">
                    Divisi Produksi I · Navigasi Lengkap
                  </div>
                </div>
              </div>
              <button
                onClick={onCloseMobile}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                aria-label="Tutup Menu Sidebar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Navigation List */}
            <nav className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
              <div className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Modul Monitoring Board
              </div>

              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onTabChange(item.id);
                      onCloseMobile?.();
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-900/50'
                        : 'hover:bg-slate-800/80 text-slate-300 hover:text-white'
                    }`}
                  >
                    <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold leading-tight truncate">{item.label}</div>
                      <div className={`text-[10px] leading-tight truncate ${isActive ? 'text-blue-100' : 'text-slate-500'}`}>
                        {item.sublabel}
                      </div>
                    </div>
                  </button>
                );
              })}

              {/* Special Action Section: Integrasi DHP & Headless GAS */}
              <div className="pt-3 mt-3 border-t border-slate-800 space-y-2">
                <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Otomasi & Integrasi Sistem
                </div>

                {/* Integrasi DHP Tembakau */}
                <button
                  onClick={() => {
                    onCloseMobile?.();
                    onOpenIntegrasiDhp();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all border border-blue-500/50 bg-gradient-to-r from-blue-950/80 to-indigo-950/70 hover:from-blue-900 hover:to-indigo-900 text-blue-100 shadow-md"
                >
                  <div className="relative flex-shrink-0">
                    <Cable className="w-5 h-5 text-blue-400" />
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold leading-tight text-white">Integrasi DHP Tembakau</div>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700/60">
                        100%
                      </span>
                    </div>
                    <div className="text-[10px] text-blue-200/80 leading-tight">
                      Otomasi penarikan lembar DHP aktif
                    </div>
                  </div>
                </button>

                {/* Headless GAS Center */}
                <button
                  onClick={() => {
                    onCloseMobile?.();
                    onOpenGasCenter();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-slate-800/80 text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  <Cpu className="w-5 h-5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold leading-tight text-slate-200">Headless GAS Center</div>
                    <div className="text-[10px] text-slate-500 leading-tight">Endpoint REST API & Script V2</div>
                  </div>
                </button>
              </div>
            </nav>

            {/* Drawer Footer */}
            <div className="p-3 border-t border-slate-800 bg-slate-950/80 text-center flex-shrink-0">
              <div className="text-[11px] font-semibold text-slate-400">
                PT Batu Karang — Pabrik PP1
              </div>
              <div className="text-[10px] text-slate-500">
                Mode Akses HP &amp; Tablet Terintegrasi Penuh
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
