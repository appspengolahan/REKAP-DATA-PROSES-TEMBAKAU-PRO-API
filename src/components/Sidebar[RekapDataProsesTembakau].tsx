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
  Sparkles
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
}

export const SidebarRekapDataProsesTembakau: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  isCollapsed,
  onToggleCollapse,
  onOpenGasCenter,
  onOpenIntegrasiDhp
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
      id: 'switch-app' as ActiveTabType,
      label: 'Switch App',
      sublabel: 'Hub Ekosistem Pabrik PP1',
      icon: LayoutGrid
    }
  ];

  return (
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
  );
};
