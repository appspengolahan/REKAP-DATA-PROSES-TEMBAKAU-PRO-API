import React, { useState } from 'react';
import { 
  X, 
  Cpu, 
  Check, 
  Copy, 
  RefreshCw, 
  Database, 
  Terminal, 
  CheckCircle2, 
  AlertTriangle,
  RotateCcw,
  Code
} from 'lucide-react';
import { GasConfig } from '../types[RekapDataProsesTembakau]';
import { DEFAULT_GAS_URL, LEGACY_GAS_URL, RekapDataProsesTembakauService } from '../api[RekapDataProsesTembakau]';
import { NEW_GAS_CODE_STRING } from '../mockData[RekapDataProsesTembakau]';

interface GasCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: GasConfig;
  onUpdateConfig: (cfg: Partial<GasConfig>) => void;
  onTriggerSync: () => Promise<void>;
  onPullDatasheet?: (tabName?: string) => Promise<any>;
  isPullingDatasheet?: boolean;
  cachedCount: number;
}

export const GasCenterModalRekapDataProsesTembakau: React.FC<GasCenterModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
  onTriggerSync,
  onPullDatasheet,
  isPullingDatasheet,
  cachedCount
}) => {
  if (!isOpen) return null;

  const [inputUrl, setInputUrl] = useState(config.apiUrl || DEFAULT_GAS_URL);
  const [selectedSheetTab, setSelectedSheetTab] = useState<'AUTO' | '_CACHE_REKAP_TBK' | 'REKAP SUSUT TEMBAKAU'>('AUTO');
  const [pullResult, setPullResult] = useState<{ success: boolean; message: string; count?: number; tabUsed?: string } | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [testResult, setTestResult] = useState<{
    tested: boolean;
    success: boolean;
    latencyMs?: number;
    message: string;
    details?: string;
  } | null>(null);
  const [testing, setTesting] = useState(false);
  const [activeTab, setActiveTab] = useState<'config' | 'datasheet' | 'code' | 'cache'>('datasheet');

  const handlePullDirect = async () => {
    if (!onPullDatasheet) return;
    setPullResult(null);
    try {
      const res = await onPullDatasheet(selectedSheetTab);
      if (res) {
        setPullResult({
          success: res.success,
          message: res.message,
          count: res.count,
          tabUsed: res.tabUsed
        });
      }
    } catch (e: any) {
      setPullResult({
        success: false,
        message: e?.message || 'Gagal menarik data dari sheet'
      });
    }
  };

  const handleSaveUrl = () => {
    onUpdateConfig({ apiUrl: inputUrl.trim() });
    setTestResult({
      tested: true,
      success: true,
      message: 'URL endpoint berhasil disimpan ke cache lokal.'
    });
  };

  const handleResetUrl = () => {
    setInputUrl(DEFAULT_GAS_URL);
    onUpdateConfig({ apiUrl: DEFAULT_GAS_URL });
  };

  const handlePingTest = async () => {
    setTesting(true);
    setTestResult(null);
    const start = performance.now();
    try {
      const cleanUrl = inputUrl.trim();
      const pingUrl = cleanUrl.includes('?') ? `${cleanUrl}&action=ping` : `${cleanUrl}?action=ping`;
      const res = await fetch(pingUrl, {
        method: 'GET',
        redirect: 'follow'
      });
      const end = performance.now();
      const latency = Math.round(end - start);

      if (res.ok) {
        const json = await res.json().catch(() => null);
        setTestResult({
          tested: true,
          success: true,
          latencyMs: latency,
          message: `Koneksi Berhasil! Server Google Apps Script merespons (HTTP ${res.status})`,
          details: json ? JSON.stringify(json, null, 2) : 'Payload valid diterima dari server Google Apps Script.'
        });
        onUpdateConfig({ apiUrl: cleanUrl, status: 'online', lastSync: new Date().toISOString() });
        // Automatically sync all dashboard data
        await onTriggerSync();
      } else {
        setTestResult({
          tested: true,
          success: false,
          latencyMs: latency,
          message: `Server merespons dengan status error: HTTP ${res.status}`,
          details: 'Pastikan Web App GAS telah di-deploy dengan akses: "Anyone" (Siapa saja).'
        });
      }
    } catch (err: any) {
      const end = performance.now();
      // Try JSONP ping as fallback
      try {
        const json = await RekapDataProsesTembakauService.fetchJsonp(inputUrl.trim());
        setTestResult({
          tested: true,
          success: true,
          latencyMs: Math.round(performance.now() - start),
          message: `Koneksi Berhasil via Jalur JSONP!`,
          details: JSON.stringify(json, null, 2)
        });
        onUpdateConfig({ apiUrl: inputUrl.trim(), status: 'online', lastSync: new Date().toISOString() });
        await onTriggerSync();
      } catch (jsonpErr) {
        setTestResult({
          tested: true,
          success: false,
          latencyMs: Math.round(end - start),
          message: 'Gagal terhubung ke endpoint (CORS atau URL tidak valid)',
          details: err?.message || 'Network request failed'
        });
      }
    } finally {
      setTesting(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(NEW_GAS_CODE_STRING);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  return (
    <div className="no-print fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-950 text-cyan-400 border border-cyan-800 rounded-xl">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100">
                  Headless GAS Center (REST Engine V2)
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Parallel Migration
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Pusat integrasi Google Apps Script tanpa menyentuh kode sistem lama
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2 gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab('datasheet')}
            className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'datasheet'
                ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-emerald-600" />
            <span>Tarik Datasheet Google Sheets</span>
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'config'
                ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Endpoint & Health Check
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'code'
                ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            Kode GAS Baru (Code[RekapDataProsesTembakau].gs)
          </button>
          <button
            onClick={() => setActiveTab('cache')}
            className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'cache'
                ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Offline Cache Engine ({cachedCount} Baris)
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {activeTab === 'datasheet' && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-emerald-950">
                      Tarik Data Langsung dari Google Spreadsheet (Datasheet Direct)
                    </h4>
                    <p className="text-xs text-emerald-800 mt-0.5">
                      Fitur ini mengambil baris data aktual langsung dari Google Sheet Anda untuk memastikan akurasi dan presisi 100% tanpa ketergantungan deployment script.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Pilih Tab Sumber Data:
                  </label>
                  <select
                    value={selectedSheetTab}
                    onChange={(e) => setSelectedSheetTab(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white text-slate-700 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="AUTO">AUTO (Rekomendasi - Coba _CACHE_REKAP_TBK 1.487 baris riil, fallback ke REKAP SUSUT TEMBAKAU)</option>
                    <option value="_CACHE_REKAP_TBK">Tab: _CACHE_REKAP_TBK (Dataset Lengkap 2025 - 2026)</option>
                    <option value="REKAP SUSUT TEMBAKAU">Tab: REKAP SUSUT TEMBAKAU (Sheet Operasional Pabrik)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="text-xs text-slate-500">
                    ID Spreadsheet: <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px]">1LnixFRQXFjDaR_LYoOUvsj84Y_Lb5W8samFOPWrDSC0</code>
                  </div>
                  <button
                    onClick={handlePullDirect}
                    disabled={isPullingDatasheet}
                    className={`flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm ${
                      isPullingDatasheet ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                  >
                    <Database className={`w-4 h-4 ${isPullingDatasheet ? 'animate-spin' : ''}`} />
                    <span>{isPullingDatasheet ? 'Sedang Menarik Data...' : 'Tarik Data Sekarang'}</span>
                  </button>
                </div>

                {pullResult && (
                  <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                    pullResult.success 
                      ? 'bg-emerald-100/70 border-emerald-300 text-emerald-900' 
                      : 'bg-rose-100/70 border-rose-300 text-rose-900'
                  }`}>
                    {pullResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                    )}
                    <span>{pullResult.message}</span>
                  </div>
                )}
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <h5 className="text-xs font-bold text-slate-700 mb-1">
                  Kenapa Fitur Ini Menjamin Presisi?
                </h5>
                <ul className="list-disc list-inside text-xs text-slate-600 space-y-1">
                  <li>Data dihitung secara dinamis dari setiap baris fisik (Bahan Baku, Hasil, Susut Kg, Gagang, Air/Debu).</li>
                  <li>Tidak ada data statis atau estimasi: semua kartu rentang, tabel bulanan, dan tabel varian bersumber dari dataset yang persis sama.</li>
                  <li>Setiap perubahan di Google Sheet dapat langsung ditarik kapan saja dengan 1 klik.</li>
                </ul>
              </div>
            </div>
          )}
          {activeTab === 'config' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Web App Exec URL (REST Endpoint)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="flex-1 px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono text-slate-700"
                  />
                  <button
                    onClick={handleSaveUrl}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
                  >
                    Simpan
                  </button>
                  <button
                    onClick={handleResetUrl}
                    className="px-3 py-2 border border-slate-300 hover:bg-slate-100 text-slate-600 text-xs font-medium rounded-xl transition-colors"
                    title="Kembalikan ke Default"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="text-[11px] text-slate-500 font-semibold">Pilihan Cepat:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setInputUrl(DEFAULT_GAS_URL);
                      onUpdateConfig({ apiUrl: DEFAULT_GAS_URL });
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                      inputUrl === DEFAULT_GAS_URL
                        ? 'bg-blue-50 text-blue-700 border-blue-300 ring-1 ring-blue-400/40'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    ⚡ GAS Standalone Baru (AKfycbw34...)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setInputUrl(LEGACY_GAS_URL);
                      onUpdateConfig({ apiUrl: LEGACY_GAS_URL });
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                      inputUrl === LEGACY_GAS_URL
                        ? 'bg-amber-50 text-amber-700 border-amber-300 ring-1 ring-amber-400/40'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    🕒 GAS Lama / Legacy (AKfycbxSN...)
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  URL ini akan menerima query GET <code className="bg-slate-100 px-1 py-0.5 rounded">?action=getDashboardData</code> dan mengembalikan JSON.
                </p>
              </div>

              {/* Status Box */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700">Status Endpoint:</span>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      config.status === 'online' 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {config.status === 'online' ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Online & Tersambung
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          Offline Cache Active
                        </>
                      )}
                    </span>
                  </div>
                  <button
                    onClick={handlePingTest}
                    disabled={testing}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
                    {testing ? 'Menguji...' : 'Test Ping / Health Check'}
                  </button>
                </div>

                {testResult && (
                  <div className={`p-3 rounded-lg text-xs border ${
                    testResult.success 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                      : 'bg-amber-50 border-amber-200 text-amber-900'
                  }`}>
                    <div className="font-bold flex items-center justify-between">
                      <span>{testResult.message}</span>
                      {testResult.latencyMs !== undefined && (
                        <span className="text-[11px] font-mono opacity-80">{testResult.latencyMs} ms</span>
                      )}
                    </div>
                    {testResult.details && (
                      <pre className="mt-2 p-2 bg-white/80 rounded border border-slate-200 font-mono text-[10px] overflow-x-auto max-h-32">
                        {testResult.details}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'code' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">
                    File: Code[RekapDataProsesTembakau].gs
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Salin script ini ke <strong>Project Google Apps Script Baru</strong> Anda (jangan modifikasi script lama).
                  </p>
                </div>
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Tersalin!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Salin Kode GAS Baru
                    </>
                  )}
                </button>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                <span className="font-bold">Langkah Deploy di Google Apps Script:</span>
                <ol className="list-decimal list-inside mt-1 space-y-1 text-[11px]">
                  <li>Buka <code>script.google.com</code> &rarr; Buat Project Baru: <code>PP1 - Rekap Data Proses Tembakau REST V2</code>.</li>
                  <li>Paste kode di bawah ke dalam file <code>Code.gs</code>.</li>
                  <li>Klik <strong>Deploy &rarr; New Deployment &rarr; Web app</strong>.</li>
                  <li>Execute as: <strong>Me</strong> (Akun Anda), Who has access: <strong>Anyone</strong> (Siapa saja).</li>
                  <li>Salin Web App URL dan tempel ke tab <strong>Endpoint & Health Check</strong> di modal ini.</li>
                </ol>
              </div>

              <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl font-mono text-[11px] overflow-x-auto max-h-72 border border-slate-800">
                {NEW_GAS_CODE_STRING}
              </pre>
            </div>
          )}

          {activeTab === 'cache' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Database className="w-8 h-8 text-blue-600" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">
                      Penyimpanan Lokal (Offline Cache)
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Menyimpan {cachedCount} baris data historis secara terenkripsi di browser untuk loading instan 0.01 detik.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    RekapDataProsesTembakauService.clearCache();
                    window.location.reload();
                  }}
                  className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg text-xs font-semibold transition-colors"
                >
                  Reset Cache
                </button>
              </div>

              <div className="text-xs text-slate-600 space-y-2">
                <p>
                  <strong>Prinsip Offline-First:</strong> Saat aplikasi dibuka, antarmuka langsung dirender dari cache dalam 0.01 detik tanpa harus menunggu jaringan Google Apps Script. 
                </p>
                <p>
                  Secara simultan di latar belakang (*silent sync*), sistem mengecek apakah ada baris data baru di sheet <code>REKAP SUSUT TEMBAKAU</code>.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Headless GAS REST V2 · Divisi Produksi I</span>
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
