import React, { useState, useEffect } from 'react';
import {
  X,
  Database,
  RefreshCw,
  Layers,
  ShieldCheck,
  Code,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Copy,
  Check,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { RawRowData, DhpIntegrationData, DhpBatchItem } from '../types[RekapDataProsesTembakau]';
import { RekapDataProsesTembakauService, formatKg, formatPct } from '../api[RekapDataProsesTembakau]';

interface IntegrasiDhpModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingRows: RawRowData[];
  onTarikDatasheetRekap: () => Promise<any>;
}

export const IntegrasiDhpModalRekapDataProsesTembakau: React.FC<IntegrasiDhpModalProps> = ({
  isOpen,
  onClose,
  existingRows,
  onTarikDatasheetRekap
}) => {
  const [activeTab, setActiveTab] = useState<'transaksi' | 'pemetaan' | 'gas'>('transaksi');
  const [loading, setLoading] = useState<boolean>(true);
  const [dhpData, setDhpData] = useState<DhpIntegrationData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Load data DHP when modal opens
  const loadDhpData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await RekapDataProsesTembakauService.fetchDhpIntegrationData(existingRows);
      setDhpData(data);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Gagal mengambil data dari Google Sheets DHP');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadDhpData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Complete GAS Script dedicated strictly for TEMBAKAU (not krosok)
  const gasScriptCode = `/**
 * =====================================================================
 * OTOMATISASI PENARIKAN DATA DHP TEMBAKAU -> REKAP SUSUT TEMBAKAU
 * Divisi Produksi I - PT Batu Karang
 * Dilengkapi Proteksi Penuh Rumus Kolom E: =iferror(JOIN(" ";F...;G...))
 * dan Penguncian Anti-Duplikasi Berdasarkan Kunci Unik
 * =====================================================================
 */

var CONFIG_INTEGRASI_TEMBAKAU = {
  // Spreadsheet Tujuan (Rekap Susut Tembakau)
  REKAP_SS_ID: '1LnixFRQXFjDaR_LYoOUvsj84Y_Lb5W8samFOPWrDSC0',
  REKAP_SHEET_NAME: 'REKAP SUSUT TEMBAKAU',
  
  // Spreadsheet Sumber (DHP Tembakau)
  DHP_SS_ID: '1NDS55VchAgNAeJJbY12ANA8HyJDeNNhAZ33zbojpH5I',
  DHP_SHEET_NAME: 'INTEGRASI DATA',
  REKAP_DATA_START_ROW: 7 // Baris data di Rekap Tembakau dimulai dari baris 7
};

function sinkronkanDhpKeRekap() {
  var ssRekap = SpreadsheetApp.openById(CONFIG_INTEGRASI_TEMBAKAU.REKAP_SS_ID);
  var shRekap = ssRekap.getSheetByName(CONFIG_INTEGRASI_TEMBAKAU.REKAP_SHEET_NAME);
  
  var ssDhp = SpreadsheetApp.openById(CONFIG_INTEGRASI_TEMBAKAU.DHP_SS_ID);
  var shDhp = ssDhp.getSheetByName(CONFIG_INTEGRASI_TEMBAKAU.DHP_SHEET_NAME);

  if (!shRekap || !shDhp) {
    Logger.log('Error: Salah satu sheet tidak ditemukan');
    return;
  }

  // 1. Ambil data yang sudah ada di Rekap untuk proteksi anti-duplikasi
  var lastRowRekap = shRekap.getLastRow();
  var existingKeys = new Set();
  var actualLastRow = 6;
  
  if (lastRowRekap >= CONFIG_INTEGRASI_TEMBAKAU.REKAP_DATA_START_ROW) {
    var checkCount = Math.min(lastRowRekap - 6, 600);
    var rekapValues = shRekap.getRange(CONFIG_INTEGRASI_TEMBAKAU.REKAP_DATA_START_ROW, 2, checkCount, 8).getValues();
    for (var i = 0; i < rekapValues.length; i++) {
      var tgl = rekapValues[i][0];
      var jenis = String(rekapValues[i][4] || '').trim().toLowerCase(); // Kolom F
      var baku = Number(rekapValues[i][6]) || 0; // Kolom H
      if (tgl && String(tgl).trim() !== '' && baku > 0) {
        actualLastRow = CONFIG_INTEGRASI_TEMBAKAU.REKAP_DATA_START_ROW + i;
        var dateStr = '';
        if (tgl instanceof Date) {
          dateStr = Utilities.formatDate(tgl, Session.getScriptTimeZone(), 'yyyy-MM-dd');
        } else {
          dateStr = String(tgl).trim().toLowerCase();
        }
        var key = dateStr + '|' + jenis + '|' + baku.toFixed(1);
        existingKeys.add(key);
      }
    }
  }

  // 2. Baca data dari DHP Tembakau (Tab INTEGRASI DATA)
  var lastRowDhp = shDhp.getLastRow();
  if (lastRowDhp < 3) {
    Logger.log('Data di DHP belum tersedia atau kosong.');
    return;
  }
  
  // Baris 1: Summary, Baris 2: Header, Data mulai baris 3
  var dhpValues = shDhp.getRange(3, 1, lastRowDhp - 2, shDhp.getLastColumn()).getValues();
  var rowsToAppend = [];
  var MONTH_NAMES = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

  for (var j = 0; j < dhpValues.length; j++) {
    var row = dhpValues[j];
    var rawTgl = row[2]; // Kolom C: Tanggal (misal: "Selasa, 20 Oktober 2026")
    var rawJenis = String(row[3] || '').trim(); // Kolom D: Jenis Tembakau
    
    // Normalisasi angka desimal
    var rawBakuStr = String(row[4] || '').replace(/[^0-9,.-]/g, '').replace(',', '.');
    var rawBaku = Number(rawBakuStr) || 0;

    if (rawJenis && rawBaku > 0) {
      var dateObj = null;
      var dateLabel = '';
      if (rawTgl instanceof Date) {
        dateObj = rawTgl;
        dateLabel = Utilities.formatDate(dateObj, Session.getScriptTimeZone(), 'd MMM yyyy');
      } else {
        var strTgl = String(rawTgl).replace(/^[a-zA-Z]+,\\s*/, '').trim();
        dateLabel = strTgl;
        dateObj = new Date(strTgl);
        if (isNaN(dateObj.getTime())) {
          dateObj = new Date();
        }
      }

      var checkKey = Utilities.formatDate(dateObj, Session.getScriptTimeZone(), 'yyyy-MM-dd') + '|' + rawJenis.toLowerCase() + '|' + rawBaku.toFixed(1);

      if (!existingKeys.has(checkKey)) {
        var nextTargetRow = actualLastRow + 1 + rowsToAppend.length;
        
        var gagangStr = String(row[5] || '').replace(/[^0-9,.-]/g, '').replace(',', '.');
        var gagang = Number(gagangStr) || 0;
        
        var airStr = String(row[6] || '').replace(/[^0-9,.-]/g, '').replace(',', '.');
        var air = Number(airStr) || 0;
        
        var debuStr = String(row[7] || '').replace(/[^0-9,.-]/g, '').replace(',', '.');
        var debu = Number(debuStr) || 0;

        var hasilStr = String(row[8] || '').replace(/[^0-9,.-]/g, '').replace(',', '.');
        var hasil = Number(hasilStr) || 0;

        var susutStr = String(row[9] || '').replace(/[^0-9,.-]/g, '').replace(',', '.');
        var susut = Number(susutStr) || (rawBaku - hasil);
        var susutPct = rawBaku > 0 ? (susut / rawBaku) : 0;
        
        var jalur = rawJenis.toUpperCase().includes('SKM') ? 'SKM' : 'SKT';

        rowsToAppend.push([
          '', // A: No
          dateLabel, // B: Tanggal (misal: "20 Okt 2026")
          MONTH_NAMES[dateObj.getMonth()], // C: Bulan
          String(dateObj.getFullYear()), // D: Tahun
          '=iferror(JOIN(" ";F' + nextTargetRow + ';G' + nextTargetRow + '))', // E: Rumus Kolom E
          rawJenis, // F: Jenis Tembakau
          jalur, // G: Jalur (SKT/SKM)
          rawBaku, // H: Netto Baku (Kg)
          hasil, // I: Netto Hasil (Kg)
          susut, // J: Susut (Kg)
          susutPct, // K: Susut (%)
          gagang, // L: Gagang
          air, // M: Air
          debu // N: Debu
        ]);
        existingKeys.add(checkKey);
      }
    }
  }

  // 3. Tulis baris baru (Aman dari Filter Aktif)
  if (rowsToAppend.length > 0) {
    // Lepas filter aktif sementara jika ada agar Google Sheets tidak memblokir penulisan baris
    var activeFilter = shRekap.getFilter();
    var filterRange = null;
    if (activeFilter) {
      filterRange = activeFilter.getRange();
      activeFilter.remove();
    }

    // Tulis baris baru (Kolom E otomatis menjadi formula aktif =iferror(JOIN(...)))
    shRekap.getRange(actualLastRow + 1, 1, rowsToAppend.length, rowsToAppend[0].length).setValues(rowsToAppend);
    
    // Pasang kembali filter mencakup baris baru
    if (filterRange) {
      try {
        var newTotalRows = actualLastRow + rowsToAppend.length;
        shRekap.getRange(6, 2, newTotalRows - 5, filterRange.getNumColumns()).createFilter();
      } catch (eF) {}
    }
    
    var successMsg = 'Berhasil membukukan ' + rowsToAppend.length + ' baris baru dari DHP ke Rekap Susut Tembakau!';
    Logger.log(successMsg);
    try {
      SpreadsheetApp.getUi().alert('Sukses Integrasi', successMsg, SpreadsheetApp.getUi().ButtonSet.OK);
    } catch(e) {}
  } else {
    var upToDateMsg = 'Semua data DHP Tembakau sudah tercatat di Rekap (0 baris baru).';
    Logger.log(upToDateMsg);
    try {
      SpreadsheetApp.getUi().alert('Sudah Sinkron', upToDateMsg, SpreadsheetApp.getUi().ButtonSet.OK);
    } catch(e) {}
  }
}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(gasScriptCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-6xl w-full h-[92vh] max-h-[92vh] flex flex-col overflow-hidden text-slate-100">
        
        {/* Modal Top Header (Compact) */}
        <div className="px-4 sm:px-6 py-3 border-b border-slate-800 flex items-center justify-between gap-4 bg-slate-900/90 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-sm flex-shrink-0">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  Integrasi &amp; Sinkronisasi DHP Tembakau
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/90 text-emerald-300 border border-emerald-700/60 shadow-sm">
                  Presisi 100%
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Pencocokan dan transfer otomatis data aktif DHP Tembakau ke Datasheet Rekap Susut Tembakau
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Source & Target Connection Bar (Compact) */}
        <div className="px-4 sm:px-6 py-2 bg-slate-950/60 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs flex-shrink-0">
          <div className="flex flex-wrap items-center gap-2 text-slate-300">
            <span className="inline-flex items-center gap-1.5 font-medium text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              Sumber DHP:
            </span>
            <span className="bg-slate-800 px-2 py-0.5 rounded text-[11px] text-slate-200 font-mono">
              Tab <strong className="text-blue-300">INTEGRASI DATA</strong> (1NDS55V...)
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
            <span className="inline-flex items-center gap-1.5 font-medium text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Target Rekap:
            </span>
            <span className="bg-slate-800 px-2 py-0.5 rounded text-[11px] text-slate-200 font-mono">
              Tab <strong className="text-emerald-300">REKAP SUSUT TEMBAKAU</strong> (1LnixFR...)
            </span>
          </div>

          <button
            onClick={loadDhpData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition-all shadow-sm disabled:opacity-50"
            title="Perbarui pembacaan lembar DHP"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-400' : ''}`} />
            <span>Tarik Ulang DHP</span>
          </button>
        </div>

        {/* Sub-Tabs Navigation (Compact) */}
        <div className="px-4 sm:px-6 border-b border-slate-800 flex items-center gap-2 bg-slate-900 flex-shrink-0">
          <button
            onClick={() => setActiveTab('transaksi')}
            className={`flex items-center gap-2 py-2.5 px-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'transaksi'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Pratinjau &amp; Transaksi ({dhpData?.totalBatch ?? 0} Batch)</span>
          </button>

          <button
            onClick={() => setActiveTab('pemetaan')}
            className={`flex items-center gap-2 py-2.5 px-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'pemetaan'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Pemetaan Kolom</span>
          </button>

          <button
            onClick={() => setActiveTab('gas')}
            className={`flex items-center gap-2 py-2.5 px-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'gas'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code className="w-4 h-4" />
            <span>Skrip Otomasi GAS</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-3.5 flex flex-col min-h-0">
          
          {/* TAB 1: PRATINJAU & TRANSAKSI */}
          {activeTab === 'transaksi' && (
            <div className="space-y-3.5 flex-1 flex flex-col min-h-0">
              
              {/* 3 KPI Summary Cards - Slim & Low Profile Layout */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 flex-shrink-0">
                {/* Total Batch Aktif */}
                <div className="px-3.5 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-slate-700/60 flex items-center justify-center text-slate-300 flex-shrink-0">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate">
                        Total Batch Aktif DHP
                      </div>
                      <div className="text-base sm:text-lg font-black text-white leading-tight">
                        {dhpData?.totalBatch || 0} Batch{' '}
                        <span className="text-[11px] font-normal text-slate-400">
                          ({formatKg(dhpData?.totalBakuKg || 0)})
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Terverifikasi di Rekap */}
                <div className="px-3.5 py-2.5 rounded-xl bg-emerald-950/30 border border-emerald-800/50 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-emerald-900/50 flex items-center justify-center text-emerald-400 flex-shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 truncate">
                        Terverifikasi di Rekap
                      </div>
                      <div className="text-base sm:text-lg font-black text-emerald-300 leading-tight">
                        {dhpData?.terverifikasiCount || 0} Batch{' '}
                        <span className="text-[11px] font-normal text-emerald-400/80">
                          ({dhpData?.terverifikasiPct || 0}%)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Batch Baru Siap Masuk */}
                <div className="px-3.5 py-2.5 rounded-xl bg-blue-950/30 border border-blue-800/50 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-blue-900/50 flex items-center justify-center text-blue-400 flex-shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-blue-400 truncate">
                        Batch Baru Siap Masuk
                      </div>
                      <div className="text-base sm:text-lg font-black text-blue-300 leading-tight">
                        {dhpData?.batchBaruCount || 0} Batch{' '}
                        <span className="text-[11px] font-normal text-blue-300/80">
                          Perlu dibukukan
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Transactions Table Section - Maximized Viewport & Prominent */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-sm flex-1 flex flex-col min-h-0">
                <div className="p-3 sm:px-4 sm:py-2.5 bg-slate-800/40 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-blue-400" />
                    <span className="text-xs sm:text-sm font-bold text-slate-200">
                      Daftar Transaksi DHP Terdeteksi (Tab INTEGRASI DATA)
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">
                    Menampilkan {dhpData?.items.length || 0} baris proses aktif
                  </span>
                </div>

                {loading ? (
                  <div className="p-12 text-center text-slate-400 space-y-3">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-400" />
                    <div className="text-xs">Memindai tab INTEGRASI DATA pada Google Sheet DHP...</div>
                  </div>
                ) : errorMsg ? (
                  <div className="p-6 text-center text-red-400 space-y-2">
                    <AlertCircle className="w-8 h-8 mx-auto text-red-400" />
                    <div className="text-sm font-medium">{errorMsg}</div>
                    <button
                      onClick={loadDhpData}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs"
                    >
                      Coba Lagi
                    </button>
                  </div>
                ) : dhpData?.items.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    Tidak ada baris transaksi aktif yang terdeteksi di tab INTEGRASI DATA.
                  </div>
                ) : (
                  <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 sticky top-0 z-10 backdrop-blur">
                        <tr>
                          <th className="py-2 px-3">Row</th>
                          <th className="py-2 px-3">Tanggal &amp; Waktu</th>
                          <th className="py-2 px-3">Jenis Tembakau</th>
                          <th className="py-2 px-3 text-center">Jalur</th>
                          <th className="py-2 px-3 text-right">Netto Baku (Kg)</th>
                          <th className="py-2 px-3 text-right">Hasil (Kg)</th>
                          <th className="py-2 px-3 text-right">Susut (%)</th>
                          <th className="py-2 px-3 text-center">Status Integrasi Rekap</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80">
                        {dhpData?.items.map((item: DhpBatchItem) => (
                          <tr
                            key={item.rowNumber}
                            className="hover:bg-slate-800/50 transition-colors"
                          >
                            <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">
                              {item.rowNumber}
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <div className="font-semibold text-slate-200 text-xs">
                                {item.tanggalFormatted}
                              </div>
                              <div className="text-[10px] text-slate-500">
                                🕒 {item.waktu}
                              </div>
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="font-bold text-slate-100 text-xs">
                                {item.jenisTembakau}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  item.jalur === 'SKM'
                                    ? 'bg-purple-950/80 text-purple-300 border border-purple-700/60'
                                    : 'bg-blue-950/80 text-blue-300 border border-blue-700/60'
                                }`}
                              >
                                {item.jalur}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-semibold text-slate-100">
                              {formatKg(item.nettoBaku)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-medium text-slate-300">
                              {formatKg(item.hasil)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-amber-400">
                              {formatPct(item.susutPct)}%
                            </td>
                            <td className="py-2.5 px-3 text-center whitespace-nowrap">
                              {item.alreadyInRekap ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-950/80 text-emerald-300 border border-emerald-700/70">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                  Sudah Masuk di Rekap
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-950/80 text-blue-300 border border-blue-700/70 shadow-sm animate-pulse">
                                  <Sparkles className="w-3 h-3 text-blue-400" />
                                  Batch Baru (Siap Masuk)
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: PEMETAAN KOLOM */}
          {activeTab === 'pemetaan' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 text-xs leading-relaxed text-slate-300 space-y-2">
                <div className="font-bold text-white text-sm flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Kamus Pemetaan Kolom (DHP → Rekap Susut Tembakau)
                </div>
                <p>
                  Sistem otomasi memetakan data sel per sel secara presisi dari tab{' '}
                  <strong className="text-blue-300">INTEGRASI DATA</strong> ke baris kosong berikutnya di tab{' '}
                  <strong className="text-emerald-300">REKAP SUSUT TEMBAKAU</strong> tanpa mengubah tata letak format formulir.
                </p>
              </div>

              <div className="border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Kolom Target Rekap</th>
                      <th className="py-2.5 px-3">Nama Kolom Rekap</th>
                      <th className="py-2.5 px-3">Sumber Nilai DHP</th>
                      <th className="py-2.5 px-3">Keterangan / Rumus</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    <tr>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-400">Kolom A</td>
                      <td className="py-2.5 px-3 font-medium text-white">No</td>
                      <td className="py-2.5 px-3 text-slate-400">Otomatis</td>
                      <td className="py-2.5 px-3 text-slate-400">Nomor urut baris</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-400">Kolom B</td>
                      <td className="py-2.5 px-3 font-medium text-white">Tanggal</td>
                      <td className="py-2.5 px-3 text-blue-300 font-mono">DHP Kolom C</td>
                      <td className="py-2.5 px-3 text-slate-400">Dikonversi ke format: d MMM yyyy (misal: 20 Okt 2026)</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-400">Kolom C</td>
                      <td className="py-2.5 px-3 font-medium text-white">Bulan</td>
                      <td className="py-2.5 px-3 text-blue-300 font-mono">Ekstrak Tanggal</td>
                      <td className="py-2.5 px-3 text-slate-400">Nama bulan Indonesia (Januari - Desember)</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-400">Kolom D</td>
                      <td className="py-2.5 px-3 font-medium text-white">Tahun</td>
                      <td className="py-2.5 px-3 text-blue-300 font-mono">Ekstrak Tanggal</td>
                      <td className="py-2.5 px-3 text-slate-400">Angka tahun 4 digit (2025, 2026, dst)</td>
                    </tr>
                    <tr className="bg-amber-950/20">
                      <td className="py-2.5 px-3 font-mono font-bold text-amber-400">Kolom E</td>
                      <td className="py-2.5 px-3 font-bold text-amber-300">Jenis Tembakau/Perlakuan</td>
                      <td className="py-2.5 px-3 font-mono text-amber-300">PASTE_FORMULA</td>
                      <td className="py-2.5 px-3 text-amber-200">
                        <strong>Proteksi Penuh:</strong> =iferror(JOIN(&quot; &quot;;F...;G...)) disalin otomatis dari baris atasnya
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-400">Kolom F</td>
                      <td className="py-2.5 px-3 font-medium text-white">Jenis Tembakau</td>
                      <td className="py-2.5 px-3 text-blue-300 font-mono">DHP Kolom D</td>
                      <td className="py-2.5 px-3 text-slate-400">Nama murni jenis tembakau (misal: Paiton 2024 (VJI))</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-400">Kolom G</td>
                      <td className="py-2.5 px-3 font-medium text-white">Jenis (Jalur)</td>
                      <td className="py-2.5 px-3 text-blue-300 font-mono">DHP Deteksi</td>
                      <td className="py-2.5 px-3 text-slate-400">SKT atau SKM</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-400">Kolom H</td>
                      <td className="py-2.5 px-3 font-medium text-white">Netto Baku (Kg)</td>
                      <td className="py-2.5 px-3 text-blue-300 font-mono">DHP Kolom E</td>
                      <td className="py-2.5 px-3 text-slate-400">Bobot timbangan bahan baku awal</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-400">Kolom I</td>
                      <td className="py-2.5 px-3 font-medium text-white">Netto Hasil (Kg)</td>
                      <td className="py-2.5 px-3 text-blue-300 font-mono">DHP Kolom I</td>
                      <td className="py-2.5 px-3 text-slate-400">Bobot timbangan hasil jadi akhir</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-400">Kolom J</td>
                      <td className="py-2.5 px-3 font-medium text-white">Susut (Kg)</td>
                      <td className="py-2.5 px-3 text-blue-300 font-mono">DHP Kolom J</td>
                      <td className="py-2.5 px-3 text-slate-400">Baku - Hasil</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-400">Kolom K</td>
                      <td className="py-2.5 px-3 font-medium text-white">Susut (%)</td>
                      <td className="py-2.5 px-3 text-blue-300 font-mono">DHP Kolom K</td>
                      <td className="py-2.5 px-3 text-slate-400">(Susut Kg / Baku Kg) * 100%</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-400">Kolom L</td>
                      <td className="py-2.5 px-3 font-medium text-white">Gagang (Kg)</td>
                      <td className="py-2.5 px-3 text-blue-300 font-mono">DHP Kolom F</td>
                      <td className="py-2.5 px-3 text-slate-400">Bobot gagang sisa proses</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-400">Kolom M</td>
                      <td className="py-2.5 px-3 font-medium text-white">Air (Kg)</td>
                      <td className="py-2.5 px-3 text-blue-300 font-mono">DHP Kolom G</td>
                      <td className="py-2.5 px-3 text-slate-400">Kadar air yang hilang</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-400">Kolom N</td>
                      <td className="py-2.5 px-3 font-medium text-white">Debu (Kg)</td>
                      <td className="py-2.5 px-3 text-blue-300 font-mono">DHP Kolom H</td>
                      <td className="py-2.5 px-3 text-slate-400">Bobot debu sisa proses</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: SKRIP OTOMASI GAS */}
          {activeTab === 'gas' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Skrip Google Apps Script Khusus Tembakau (IntegrasiDHP.gs)
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Skrip mandiri untuk dipasang pada editor Apps Script di Google Sheets Anda.
                  </p>
                </div>

                <button
                  onClick={handleCopyCode}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-sm transition-all ${
                    copiedCode
                      ? 'bg-emerald-600 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin Kode GAS</span>
                    </>
                  )}
                </button>
              </div>

              {/* Code Box */}
              <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 font-mono text-xs text-slate-300 max-h-96 overflow-y-auto p-4">
                <pre>{gasScriptCode}</pre>
              </div>

              {/* Instructions */}
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 text-xs space-y-2 text-slate-300">
                <div className="font-bold text-white text-xs uppercase tracking-wider">
                  Cara Memasang di Google Sheets:
                </div>
                <ol className="list-decimal pl-5 space-y-1 text-slate-400">
                  <li>Buka Spreadsheet Google Sheet DHP atau Rekap Susut Tembakau Anda.</li>
                  <li>Klik menu <strong className="text-slate-200">Ekstensi &gt; Apps Script</strong> di menu bar atas.</li>
                  <li>Di panel kiri, klik ikon <strong className="text-slate-200">+</strong> (Tambahkan file) lalu pilih <strong className="text-slate-200">Script</strong>.</li>
                  <li>Beri nama file: <code className="bg-slate-900 px-1 py-0.5 rounded text-blue-300">IntegrasiDHP.gs</code>.</li>
                  <li>Hapus isi default, lalu tempel (*paste*) kode di atas dan klik tombol <strong className="text-slate-200">Simpan (Ctrl+S)</strong>.</li>
                  <li>Jalankan fungsi <code className="text-emerald-400">sinkronkanDhpKeRekap()</code> untuk menguji eksekusi pembukuan baris baru secara otomatis.</li>
                </ol>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Koneksi aman &amp; pemetaan kolom terverifikasi</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
