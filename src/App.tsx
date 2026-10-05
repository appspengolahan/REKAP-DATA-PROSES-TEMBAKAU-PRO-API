import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  RawRowData, 
  UserRole, 
  JenisProsesType, 
  PeriodeRange, 
  GasConfig, 
  GroupSummary, 
  SummaryKPI,
  TrendJenisData
} from './types[RekapDataProsesTembakau]';
import { 
  RekapDataProsesTembakauService, 
  formatKg, 
  formatPct 
} from './api[RekapDataProsesTembakau]';
import { HeaderRekapDataProsesTembakau } from './components/Header[RekapDataProsesTembakau]';
import { 
  SidebarRekapDataProsesTembakau, 
  ActiveTabType 
} from './components/Sidebar[RekapDataProsesTembakau]';
import { DashboardViewRekapDataProsesTembakau } from './components/DashboardView[RekapDataProsesTembakau]';
import { RekapBulanViewRekapDataProsesTembakau } from './components/RekapBulanView[RekapDataProsesTembakau]';
import { RekapJenisViewRekapDataProsesTembakau } from './components/RekapJenisView[RekapDataProsesTembakau]';
import { MatriksSktSkmRekapDataProsesTembakau } from './components/MatriksSktSkm[RekapDataProsesTembakau]';
import { DataExplorerRekapDataProsesTembakau } from './components/DataExplorer[RekapDataProsesTembakau]';
import { SwitchBoardModalRekapDataProsesTembakau } from './components/SwitchBoardModal[RekapDataProsesTembakau]';
import { GasCenterModalRekapDataProsesTembakau } from './components/GasCenterModal[RekapDataProsesTembakau]';
import { HelpModalRekapDataProsesTembakau } from './components/HelpModal[RekapDataProsesTembakau]';
import { FooterRekapDataProsesTembakau } from './components/Footer[RekapDataProsesTembakau]';
import { 
  LayoutDashboard, 
  CalendarDays, 
  Layers, 
  GitCompare, 
  Database,
  CheckCircle2,
  FileText
} from 'lucide-react';

const STORAGE_SIDEBAR_COLLAPSED = 'PP1_SIDEBAR_COLLAPSED_TBK';
const APP_TITLE_DEFAULT = 'Monitoring Board — Rekap Data Proses Tembakau';

export default function App() {
  // 1. Data State (Loaded instantly from LocalStorage cache 0.01s)
  const [rows, setRows] = useState<RawRowData[]>(() => RekapDataProsesTembakauService.getRawData());
  const [gasConfig, setGasConfig] = useState<GasConfig>(() => RekapDataProsesTembakauService.getGasConfig());
  const [serverDashboard, setServerDashboard] = useState(() => RekapDataProsesTembakauService.getServerDashboardData());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // 2. Navigation & UI State
  const [activeTab, setActiveTab] = useState<ActiveTabType>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_SIDEBAR_COLLAPSED) === 'true';
  });

  // 3. Modals State
  const [isSwitchBoardOpen, setIsSwitchBoardOpen] = useState(false);
  const [isGasCenterOpen, setIsGasCenterOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // 4. Role-Based Access Control State
  const [userRole, setUserRole] = useState<UserRole>('Project Manager');

  // 5. Global Filter State
  const [selectedTahun, setSelectedTahun] = useState<string>('Semua');
  const [selectedBulanRingkasan, setSelectedBulanRingkasan] = useState<string>('Semua');
  const [selectedTahunBulanan, setSelectedTahunBulanan] = useState<string>('Semua');
  const [jenisProses, setJenisProses] = useState<JenisProsesType>('Semua');

  // Tarik Datasheet & Feedback Notification State
  const [isPullingDatasheet, setIsPullingDatasheet] = useState<boolean>(false);
  const [toastNotification, setToastNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // 6. Range Period State (Default: 2026 Januari - September)
  const [periodeRange, setPeriodeRange] = useState<PeriodeRange>(() => {
    return {
      bulanMulai: 'Januari',
      tahunMulai: '2026',
      bulanAkhir: 'September',
      tahunAkhir: '2026'
    };
  });

  // 7. Selected Tobacco Variety for Trend Chart
  const [selectedJenisTrend, setSelectedJenisTrend] = useState<string>('');

  // Save sidebar state to localStorage
  const handleToggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem(STORAGE_SIDEBAR_COLLAPSED, String(next));
      return next;
    });
  };

  // Silent Background Sync on Mount
  useEffect(() => {
    const doSync = async () => {
      setIsSyncing(true);
      try {
        await RekapDataProsesTembakauService.syncFromGas();
        setRows(RekapDataProsesTembakauService.getRawData());
        setGasConfig(RekapDataProsesTembakauService.getGasConfig());
        setServerDashboard(RekapDataProsesTembakauService.getServerDashboardData());
      } catch (e) {
        console.warn('Initial sync error, continuing with local cache', e);
      } finally {
        setIsSyncing(false);
      }
    };
    doSync();
  }, []);

  // Compute Filter Options directly from actual rows
  const filterOptions = useMemo(() => {
    return RekapDataProsesTembakauService.getFilterOptions(rows);
  }, [rows]);

  // Compute Entri Terkini directly from actual rows
  const entriTerkini = useMemo(() => {
    return RekapDataProsesTembakauService.getEntriTerkini(rows);
  }, [rows]);

  // Compute Ringkasan Tahunan dynamically from actual rows (single source of truth)
  const ringkasanTahunan = useMemo(() => {
    return RekapDataProsesTembakauService.computeRingkasanTahunan(rows, selectedTahun, jenisProses);
  }, [rows, selectedTahun, jenisProses]);

  // Compute Ringkasan Bulanan dynamically from actual rows with explicit year & month
  const ringkasanBulanan = useMemo(() => {
    return RekapDataProsesTembakauService.computeRingkasanBulanan(rows, selectedTahunBulanan, selectedBulanRingkasan, jenisProses);
  }, [rows, selectedTahunBulanan, selectedBulanRingkasan, jenisProses]);

  // Compute Ringkasan Periode dynamically from actual rows
  const ringkasanPeriode = useMemo(() => {
    return RekapDataProsesTembakauService.computeRingkasanPeriode(rows, periodeRange, jenisProses);
  }, [rows, periodeRange, jenisProses]);

  // Compute Rekap per Bulan dynamically from actual rows
  const rekapBulan = useMemo(() => {
    return RekapDataProsesTembakauService.computeRekapBulan(rows, selectedTahun, jenisProses);
  }, [rows, selectedTahun, jenisProses]);

  // Compute Rekap per Jenis Tembakau untuk periode yang sama dynamically from actual rows
  const rekapJenisTembakauPeriode = useMemo(() => {
    return RekapDataProsesTembakauService.computeRekapJenisTembakauPeriode(rows, periodeRange, jenisProses);
  }, [rows, periodeRange, jenisProses]);

  // Determine active trend variety
  const activeJenisTrend = useMemo(() => {
    if (selectedJenisTrend && rekapJenisTembakauPeriode.some(r => r.label === selectedJenisTrend)) {
      return selectedJenisTrend;
    }
    return rekapJenisTembakauPeriode.length > 0 ? rekapJenisTembakauPeriode[0].label : '';
  }, [selectedJenisTrend, rekapJenisTembakauPeriode]);

  // Compute Trend per Jenis Tembakau dynamically from actual rows
  const trendJenis = useMemo(() => {
    if (!activeJenisTrend) return { jenisTembakau: '', data: [] };
    return RekapDataProsesTembakauService.computeTrendJenisTembakau(rows, selectedTahun, activeJenisTrend, jenisProses);
  }, [rows, selectedTahun, activeJenisTrend, jenisProses]);

  // Refresh Trigger
  const handleManualRefresh = async () => {
    setIsSyncing(true);
    try {
      await RekapDataProsesTembakauService.syncFromGas();
      setRows(RekapDataProsesTembakauService.getRawData());
      setGasConfig(RekapDataProsesTembakauService.getGasConfig());
      setServerDashboard(RekapDataProsesTembakauService.getServerDashboardData());
    } finally {
      setIsSyncing(false);
    }
  };

  // Tarik Data Langsung dari Datasheet Google Sheets (via gviz CSV)
  const handleTarikDatasheet = async (tabName: string = 'AUTO') => {
    setIsPullingDatasheet(true);
    try {
      const res = await RekapDataProsesTembakauService.pullDirectFromSheet(
        '1LnixFRQXFjDaR_LYoOUvsj84Y_Lb5W8samFOPWrDSC0',
        tabName
      );
      if (res.success) {
        const freshRows = RekapDataProsesTembakauService.getRawData();
        setRows(freshRows);
        setGasConfig(RekapDataProsesTembakauService.getGasConfig());
        setToastNotification({
          message: `Berhasil menarik ${res.count} baris data riil dari Google Sheet (Tab: ${res.tabUsed})! Seluruh kartu & tabel kini 100% presisi.`,
          type: 'success'
        });
        setTimeout(() => setToastNotification(null), 6000);
      } else {
        setToastNotification({
          message: res.message || 'Gagal menarik data dari sheet',
          type: 'error'
        });
        setTimeout(() => setToastNotification(null), 6000);
      }
      return res;
    } catch (e: any) {
      setToastNotification({
        message: e?.message || 'Terjadi kesalahan saat menarik data dari Google Sheet',
        type: 'error'
      });
      setTimeout(() => setToastNotification(null), 6000);
      return { success: false, message: e?.message, count: 0, tabUsed: '' };
    } finally {
      setIsPullingDatasheet(false);
    }
  };

  // Add new batch entry
  const handleAddNewBatch = (entryData: any) => {
    const created = RekapDataProsesTembakauService.addNewBatchEntry(entryData);
    setRows(RekapDataProsesTembakauService.getRawData());
  };

  // Export PDF with naming convention: Monitoring_Board_Rekap_Data_Proses_Tembakau_[Tab/Field].pdf
  const handleExportPdf = useCallback((fieldOrTab: string = 'Ringkasan_Kesusutan') => {
    const cleanTab = fieldOrTab.replace(/[^a-zA-Z0-9_-]/g, '_');
    const targetTitle = `Monitoring_Board_Rekap_Data_Proses_Tembakau_${cleanTab}`;
    const originalTitle = document.title;
    
    document.title = targetTitle;
    window.print();
    
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  }, []);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-slate-50 font-sans text-slate-800 antialiased selection:bg-blue-600 selection:text-white">
      
      {/* Floating Toast Notification */}
      {toastNotification && (
        <div className="no-print fixed top-20 right-6 z-50 animate-in slide-in-from-top-4 duration-300">
          <div className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl border text-xs font-semibold ${
            toastNotification.type === 'success'
              ? 'bg-emerald-900 text-emerald-100 border-emerald-700/80 shadow-emerald-950/20'
              : 'bg-rose-900 text-rose-100 border-rose-700/80 shadow-rose-950/20'
          }`}>
            <span className={`w-2 h-2 rounded-full ${toastNotification.type === 'success' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}></span>
            <span>{toastNotification.message}</span>
            <button
              onClick={() => setToastNotification(null)}
              className="ml-2 text-white/70 hover:text-white text-sm font-bold"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Top Executive Header */}
      <HeaderRekapDataProsesTembakau
        entriTerkini={entriTerkini}
        role={userRole}
        onRoleChange={setUserRole}
        jenisProses={jenisProses}
        onJenisProsesChange={setJenisProses}
        gasConfig={gasConfig}
        isSyncing={isSyncing}
        onRefresh={handleManualRefresh}
        onPullDatasheet={() => handleTarikDatasheet('AUTO')}
        isPullingDatasheet={isPullingDatasheet}
        onOpenSwitchBoard={() => setIsSwitchBoardOpen(true)}
        onOpenGasCenter={() => setIsGasCenterOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
        onExportPdf={() => handleExportPdf(activeTab)}
      />

      {/* Main Workspace with Collapsible Sidebar */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        
        {/* Sidebar */}
        <SidebarRekapDataProsesTembakau
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={handleToggleSidebar}
          onOpenGasCenter={() => setIsGasCenterOpen(true)}
        />

        {/* Dynamic Content Canvas */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 main-content min-h-0">
          <div className="max-w-7xl mx-auto space-y-6">
            
            {/* View 1: Main Dashboard (Default) */}
            {activeTab === 'dashboard' && (
              <DashboardViewRekapDataProsesTembakau
                ringkasanTahunan={ringkasanTahunan}
                ringkasanBulanan={ringkasanBulanan}
                ringkasanPeriode={ringkasanPeriode}
                rekapBulan={rekapBulan}
                rekapJenisTembakauPeriode={rekapJenisTembakauPeriode}
                trendJenis={trendJenis}
                tahunList={filterOptions.tahun}
                selectedTahun={selectedTahun}
                onTahunChange={setSelectedTahun}
                bulanList={filterOptions.bulan}
                selectedBulanRingkasan={selectedBulanRingkasan}
                onBulanRingkasanChange={setSelectedBulanRingkasan}
                selectedTahunBulanan={selectedTahunBulanan}
                onTahunBulananChange={setSelectedTahunBulanan}
                jenisProses={jenisProses}
                onJenisProsesChange={setJenisProses}
                periodeRange={periodeRange}
                onPeriodeRangeChange={setPeriodeRange}
                onApplyPeriode={() => {}}
                onSelectJenisTrend={setSelectedJenisTrend}
                onRefresh={handleManualRefresh}
                onPullDatasheet={() => handleTarikDatasheet('AUTO')}
                isPullingDatasheet={isPullingDatasheet}
                onExportSummaryPdf={() => handleExportPdf('Ringkasan_Tahunan_Bulanan')}
                onExportTabPdf={(tab) => handleExportPdf(tab)}
              />
            )}

            {/* View 2: Dedicated Rekap per Bulan & Tren Waktu */}
            {activeTab === 'rekap-bulan' && (
              <RekapBulanViewRekapDataProsesTembakau
                rekapBulan={rekapBulan}
                ringkasanTahunan={ringkasanTahunan}
                tahunList={filterOptions.tahun}
                selectedTahun={selectedTahun}
                onTahunChange={setSelectedTahun}
                jenisProses={jenisProses}
                onJenisProsesChange={setJenisProses}
                onPullDatasheet={() => handleTarikDatasheet('AUTO')}
                isPullingDatasheet={isPullingDatasheet}
                onExportPdf={() => handleExportPdf('Rekap_Bulan_Detail')}
              />
            )}

            {/* View 3: Dedicated Rekap per Jenis Tembakau (54 Varian & Efisiensi Bahan) */}
            {activeTab === 'rekap-jenis' && (
              <RekapJenisViewRekapDataProsesTembakau
                rekapJenisTembakauPeriode={rekapJenisTembakauPeriode}
                trendJenis={trendJenis}
                periodeRange={periodeRange}
                onPeriodeRangeChange={setPeriodeRange}
                jenisProses={jenisProses}
                onJenisProsesChange={setJenisProses}
                onSelectJenisTrend={setSelectedJenisTrend}
                onExportPdf={() => handleExportPdf('Rekap_Jenis_Tembakau_Lengkap')}
              />
            )}

            {/* View 4: Matriks SKT vs SKM */}
            {activeTab === 'matriks-skt-skm' && (
              <MatriksSktSkmRekapDataProsesTembakau
                rows={rows}
                selectedTahun={selectedTahun}
              />
            )}

            {/* View 5: Data Explorer Batch */}
            {activeTab === 'data-explorer' && (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                    <div>
                      <h2 className="text-base font-bold text-slate-800">
                        Data Explorer & Verifikasi Batch Mentah
                      </h2>
                      <p className="text-xs text-slate-500">
                        Penelusuran detail setiap baris entri sheet REKAP SUSUT TEMBAKAU
                      </p>
                    </div>
                    <button
                      onClick={() => handleExportPdf('Data_Explorer_Batch')}
                      className="no-print flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Export PDF</span>
                    </button>
                  </div>
                  <DataExplorerRekapDataProsesTembakau
                    rows={rows}
                    onAddNewBatch={handleAddNewBatch}
                    userRole={userRole}
                  />
                </div>
              </div>
            )}

          </div>

          {/* Web App Footer as required by Rule 2 */}
          <FooterRekapDataProsesTembakau />
        </main>
      </div>

      {/* Mobile Bottom Quick Navigation */}
      <nav className="no-print lg:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 text-white px-2 py-1.5 flex items-center justify-around z-30 shadow-lg">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-[10px] font-medium transition-colors ${
            activeTab === 'dashboard' ? 'text-blue-400 font-bold' : 'text-slate-400'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Dashboard</span>
        </button>
        <button
          onClick={() => setActiveTab('rekap-bulan')}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-[10px] font-medium transition-colors ${
            activeTab === 'rekap-bulan' ? 'text-blue-400 font-bold' : 'text-slate-400'
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          <span>Bulanan</span>
        </button>
        <button
          onClick={() => setActiveTab('rekap-jenis')}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-[10px] font-medium transition-colors ${
            activeTab === 'rekap-jenis' ? 'text-blue-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Varian</span>
        </button>
        <button
          onClick={() => setActiveTab('matriks-skt-skm')}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-[10px] font-medium transition-colors ${
            activeTab === 'matriks-skt-skm' ? 'text-blue-400 font-bold' : 'text-slate-400'
          }`}
        >
          <GitCompare className="w-4 h-4" />
          <span>SKT/SKM</span>
        </button>
        <button
          onClick={() => setActiveTab('data-explorer')}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-[10px] font-medium transition-colors ${
            activeTab === 'data-explorer' ? 'text-blue-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Batch</span>
        </button>
      </nav>

      {/* Switch Board Modal */}
      <SwitchBoardModalRekapDataProsesTembakau
        isOpen={isSwitchBoardOpen}
        onClose={() => setIsSwitchBoardOpen(false)}
      />

      {/* Headless GAS Center Modal */}
      <GasCenterModalRekapDataProsesTembakau
        isOpen={isGasCenterOpen}
        onClose={() => setIsGasCenterOpen(false)}
        config={gasConfig}
        onUpdateConfig={(cfg) => {
          const updated = RekapDataProsesTembakauService.saveGasConfig(cfg);
          setGasConfig(updated);
        }}
        onTriggerSync={handleManualRefresh}
        onPullDatasheet={handleTarikDatasheet}
        isPullingDatasheet={isPullingDatasheet}
        cachedCount={rows.length}
      />

      {/* Help Modal */}
      <HelpModalRekapDataProsesTembakau
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />

    </div>
  );
}
