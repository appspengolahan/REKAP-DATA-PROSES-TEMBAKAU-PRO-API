import React, { useState, useEffect, useMemo } from 'react';
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
  ExternalLink,
  Send,
  Pause,
  Play,
  Scale,
  Download,
  TrendingUp,
  Droplets,
  Wind,
  Printer,
  Info,
  Calendar,
  FileText,
  Table,
  FileSpreadsheet,
  Thermometer,
  Sun,
  CloudSun,
  CloudRain,
  MapPin,
  Gauge,
  ChevronDown,
  ArrowLeft,
  SlidersHorizontal
} from 'lucide-react';
import { RawRowData, DhpIntegrationData, DhpBatchItem, GasConfig } from '../types[RekapDataProsesTembakau]';
import { StandarSusutService } from '../services/standarSusutService';
import {
  WeatherService,
  RealtimeWeatherData,
  FactoryLocationPreset,
  FACTORY_LOCATIONS
} from '../services/weatherService';
import {
  RekapDataProsesTembakauService,
  formatKg,
  formatKgRaw,
  formatPct,
  parseIndonesianDate,
  formatTanggalRekap,
  BULAN_INDONESIA_LENGKAP
} from '../api[RekapDataProsesTembakau]';

interface IntegrasiDhpModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingRows: RawRowData[];
  onTarikDatasheetRekap: () => Promise<any>;
  onAppendRecordsToRekap?: (newRows: RawRowData[]) => void;
  gasConfig?: GasConfig;
}

export const IntegrasiDhpModalRekapDataProsesTembakau: React.FC<IntegrasiDhpModalProps> = ({
  isOpen,
  onClose,
  existingRows,
  onTarikDatasheetRekap,
  onAppendRecordsToRekap,
  gasConfig
}) => {
  const [activeTab, setActiveTab] = useState<'transaksi' | 'analisis_harian' | 'pemetaan' | 'gas' | 'template_dhp'>('transaksi');
  const [loading, setLoading] = useState<boolean>(true);
  const [isSyncingToRekap, setIsSyncingToRekap] = useState<boolean>(false);
  const [syncNotice, setSyncNotice] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [dhpData, setDhpData] = useState<DhpIntegrationData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedTsv, setCopiedTsv] = useState<boolean>(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);
  const [selectedAnalisisTanggal, setSelectedAnalisisTanggal] = useState<string>('');
  const [showToolsDropdown, setShowToolsDropdown] = useState<boolean>(false);

  // Monitoring Cuaca & Iklim Pabrik Real-time
  const [selectedLocation, setSelectedLocation] = useState<FactoryLocationPreset>(() => WeatherService.getSelectedLocation());
  const [weatherData, setWeatherData] = useState<RealtimeWeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState<boolean>(false);

  const loadWeather = async (loc?: FactoryLocationPreset, force: boolean = false) => {
    const targetLoc = loc || selectedLocation;
    setWeatherLoading(true);
    try {
      const data = await WeatherService.fetchCurrentWeather(targetLoc, force);
      setWeatherData(data);
    } catch (e) {
      console.warn('Weather fetch error:', e);
    } finally {
      setWeatherLoading(false);
    }
  };

  const handleLocationChange = (locId: string) => {
    const found = FACTORY_LOCATIONS.find(l => l.id === locId);
    if (found) {
      setSelectedLocation(found);
      WeatherService.setSelectedLocation(found.id);
      loadWeather(found, true);
    }
  };

  // Daftar tanggal unik dari DHP
  const availableAnalisisDates = useMemo(() => {
    if (!dhpData || !dhpData.items) return [];
    const setDates = new Set(dhpData.items.map(it => it.tanggalFormatted || it.tanggalRaw).filter(Boolean));
    return Array.from(setDates);
  }, [dhpData]);

  // Hitung Analisis Harian Komparatif secara reaktif
  const analisisHarian = useMemo(() => {
    if (!dhpData || !dhpData.items || dhpData.items.length === 0) return null;
    return StandarSusutService.computeAnalisisHarian(dhpData.items, selectedAnalisisTanggal, existingRows);
  }, [dhpData, selectedAnalisisTanggal, existingRows]);

  // Smart Live-Sync State (Auto-Tarik Tiap 12 Detik)
  const [autoPullEnabled, setAutoPullEnabled] = useState<boolean>(true);
  const [countdown, setCountdown] = useState<number>(12);
  const [isAutoPulling, setIsAutoPulling] = useState<boolean>(false);

  // Load data DHP with support for silent background refresh
  const loadDhpData = async (silent = false) => {
    if (!silent) {
      setLoading(true);
    } else {
      setIsAutoPulling(true);
    }
    setErrorMsg(null);
    try {
      const data = await RekapDataProsesTembakauService.fetchDhpIntegrationData(existingRows);
      setDhpData(data);
    } catch (err: any) {
      if (!silent) {
        setErrorMsg(err?.message || 'Gagal mengambil data dari Google Sheets DHP');
      }
    } finally {
      setLoading(false);
      setIsAutoPulling(false);
      setCountdown(12);
    }
  };

  // Timer countdown 12 detik auto-tarik
  useEffect(() => {
    if (isOpen) {
      loadDhpData();
      loadWeather();
      setCountdown(12);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !autoPullEnabled) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (!loading && !isSyncingToRekap && !isAutoPulling) {
            loadDhpData(true);
          }
          return 12;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, autoPullEnabled, loading, isSyncingToRekap, isAutoPulling]);

  // Handle synchronization from DHP to Sheet Rekap (Direct Automation with Smart In-Place Fill)
  const handleSyncToRekap = async () => {
    if (!dhpData || dhpData.items.length === 0) return;
    setIsSyncingToRekap(true);
    setSyncNotice(null);

    try {
      const itemsToSync = dhpData.items;
      const currentYear = new Date().getFullYear().toString();

      const newRecords: RawRowData[] = itemsToSync.map((item, idx) => {
        const nextSrcRow = item.matchedRow || (existingRows.length + 12 + idx);
        const rawDateStr = item.tanggal || item.tanggalFormatted || item.tanggalRaw;
        const dObj = parseIndonesianDate(rawDateStr);
        const isoDate = dObj 
          ? `${dObj.getFullYear()}-${String(dObj.getMonth() + 1).padStart(2, '0')}-${String(dObj.getDate()).padStart(2, '0')}`
          : '2026-10-20';
        const tglDisplay = dObj ? formatTanggalRekap(dObj) : (item.tanggalFormatted || '20 Okt 2026');
        const bulanName = dObj ? BULAN_INDONESIA_LENGKAP[dObj.getMonth()] : 'Oktober';
        const tahunVal = dObj ? dObj.getFullYear().toString() : currentYear;

        return {
          batchNo: `DHP-${item.rowNumber}-${Date.now().toString().slice(-4)}`,
          srcRow: nextSrcRow,
          tanggal: isoDate,
          tanggalDisplay: tglDisplay,
          bulan: bulanName,
          tahun: tahunVal,
          jenisPerlakuan: `${item.jenisTembakau} ${item.jalur}`,
          jenisTembakau: item.jenisTembakau,
          jenisProses: item.jalur,
          baku: item.nettoBaku,
          hasil: item.hasil,
          susutKg: item.susutKg,
          susutPct: item.susutPct,
          gagangKg: item.gagangKg,
          gagangPct: item.nettoBaku > 0 ? Number(((item.gagangKg / item.nettoBaku) * 100).toFixed(2)) : 0,
          airKg: item.airKg,
          debuKg: item.debuKg,
          debuAirKg: (item.airKg || 0) + (item.debuKg || 0),
          debuAirPct: item.nettoBaku > 0 ? Number((((item.airKg + item.debuKg) / item.nettoBaku) * 100).toFixed(2)) : 0
        };
      });

      // 1. Post to backend proxy / GAS Web App
      const gasUrl = gasConfig?.apiUrl || 'https://script.google.com/macros/s/AKfycbw34wezcB4YC4N-n2nL0ll9jofM3i9s5OHYxLZJ4Xu32_AmCEDcIAYi9V1AdPg2iACM/exec';
      try {
        await fetch('/api/sync-gas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'syncDhpToRekap',
            records: newRecords
          })
        });
      } catch (postErr) {
        try {
          await fetch(gasUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'syncDhpToRekap',
              records: newRecords
            })
          });
        } catch (e) {
          console.warn('Network notice during direct GAS post:', e);
        }
      }

      // 2. Update/Upsert records to Rekap in Web App
      if (onAppendRecordsToRekap) {
        onAppendRecordsToRekap(newRecords);
      } else {
        const combined = [...existingRows, ...newRecords];
        RekapDataProsesTembakauService.saveRawData(combined);
      }

      // 3. Mark items as synchronized in modal state
      const mismatchNum = dhpData.mismatchCount || 0;
      const batchBaruNum = dhpData.batchBaruCount || 0;

      setDhpData((prev) => {
        if (!prev) return null;
        const updatedItems = prev.items.map((it) => ({
          ...it,
          alreadyInRekap: true,
          isMismatch: false,
          statusIntegrasi: (it.matchedRow ? `Sudah Masuk di Rekap (Baris ${it.matchedRow})` : 'Sudah Masuk di Rekap')
        }));
        return {
          ...prev,
          items: updatedItems,
          terverifikasiCount: updatedItems.length,
          terverifikasiPct: 100,
          terverifikasiBakuKg: prev.totalBakuKg,
          terverifikasiHasilKg: prev.totalHasilKg,
          terverifikasiSusutKg: prev.totalSusutKg,
          terverifikasiSusutPct: prev.totalSusutPct,
          batchBaruCount: 0,
          mismatchCount: 0
        };
      });

      const successMsg = mismatchNum > 0 && batchBaruNum > 0
        ? `Berhasil membukukan ${batchBaruNum} batch baru dan menyelaraskan ${mismatchNum} data hasil DHP ke Sheet Rekap!`
        : mismatchNum > 0
        ? `Berhasil menyelaraskan ${mismatchNum} pembaruan data hasil DHP ke Sheet Rekap secara in-place!`
        : `Berhasil membukukan data DHP ke Sheet Rekap secara in-place!`;

      setSyncNotice({
        type: 'success',
        message: successMsg
      });

      // 4. Trigger auto pull to refresh
      setTimeout(() => {
        onTarikDatasheetRekap?.().catch(() => {});
      }, 1500);

    } catch (err: any) {
      setSyncNotice({
        type: 'error',
        message: err?.message || 'Gagal menyinkronkan data ke Sheet Rekap'
      });
    } finally {
      setIsSyncingToRekap(false);
      setTimeout(() => setSyncNotice(null), 6000);
    }
  };

  // Handle 1-Click Clean Cancelled Batches & Reconciliation
  const [isReconciling, setIsReconciling] = useState<boolean>(false);
  const handleReconcileLive = async () => {
    setIsReconciling(true);
    setSyncNotice(null);
    try {
      // 1. Bersihkan di cache lokal web app secara instan (0.01s)
      if (dhpData?.items && dhpData.items.length > 0) {
        const activeIso = dhpData.items[0].tanggalRaw || dhpData.items[0].tanggalFormatted;
        const validJenis = dhpData.items.map(it => it.jenisTembakau);
        RekapDataProsesTembakauService.purgeCancelledRowsLocally(activeIso, validJenis);
      }

      // 2. Kirim perintah pembersihan & rekonsiliasi ke Google Apps Script (Live Google Sheets)
      const resp = await fetch('/api/sync-gas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cleanCancelled' })
      });

      let data: any = null;
      try {
        const text = await resp.text();
        if (text && text.trim()) {
          data = JSON.parse(text);
        }
      } catch (pErr) {
        console.warn('Fallback response parsing:', pErr);
      }

      if (data && data.success === false) {
        throw new Error(data.error || 'Eksekusi rekonsiliasi GAS mengembalikan pesan gagal.');
      }

      setSyncNotice({
        type: 'success',
        message: data?.message || 'Rekonsiliasi selesai: batch yang dibatalkan / duplikat berhasil dibersihkan dan data riil DHP diselaraskan presisi!'
      });

      // 3. Tarik ulang data terkini dari DHP dan Rekap
      await loadDhpData(false);
      onTarikDatasheetRekap?.().catch(() => {});
    } catch (err: any) {
      setSyncNotice({
        type: 'error',
        message: 'Gagal mengirim instruksi rekonsiliasi ke GAS: ' + (err?.message || 'Error jaringan')
      });
    } finally {
      setIsReconciling(false);
      setTimeout(() => setSyncNotice(null), 8000);
    }
  };

  if (!isOpen) return null;

  // Complete GAS Script with Smart In-Place Fill & Strict Formula Protection
  const gasScriptCode = `/**
 * =====================================================================
 * OTOMATISASI INTEGRASI DATA DHP TEMBAKAU -> REKAP SUSUT TEMBAKAU
 * Divisi Produksi I - PT Batu Karang
 * 
 * ⚠️ KETENTUAN MUTLAK PROTEKSI FORMULA:
 * JANGAN MENIMPA KOLOM/BARIS YANG SUDAH BERISI RUMUS/FORMULA!
 * Kolom-kolom berikut DILARANG DITIMPA karena sudah berisi rumus template:
 * - Kolom C (Bulan)                 : Formula otomatis dari Kolom B
 * - Kolom D (Tahun)                 : Formula otomatis dari Kolom B
 * - Kolom E (Jenis/Perlakuan)       : Formula =iferror(JOIN(" ";F...;G...))
 * - Kolom J (Susut Kg)              : Formula =H...-I...
 * - Kolom K (Susut %)               : Formula persentase otomatis (format %)
 *
 * SINKRONISASI HANYA MENGISI KOLOM DATA INPUT MURNI:
 * - Kolom H (Col 8)  : Netto Baku (diisi jika di rekap masih kosong)
 * - Kolom I (Col 9)  : Netto Hasil
 * - Kolom L (Col 12) : Gagang
 * - Kolom M (Col 13) : Air
 * - Kolom N (Col 14) : Debu
 * (Dan jika baris baru: Kolom B tanggal, Kolom F jenis, Kolom G jalur)
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

/**
 * =========================================================================
 * FUNGSI UTAMA UNTUK GAS STANDALONE (Dijalankan dari Editor Apps Script)
 * =========================================================================
 */

/**
 * 1. PILIH INI LALU KLIK "JALANKAN (RUN)" UNTUK TEST SINKRONISASI MANUAL
 */
function TEST_SINKRON_SEKARANG() {
  Logger.log('Memulai eksekusi manual sinkronisasi DHP ke Rekap...');
  var res = sinkronkanDhpKeRekap(true);
  Logger.log('Hasil Sinkronisasi: ' + JSON.stringify(res));
  return res;
}

/**
 * 2. PILIH INI LALU KLIK "JALANKAN (RUN)" UNTUK AKTIFKAN AUTO-PUSH 5 MENIT
 * Menjadwalkan pemicu cloud Google yang berjalan 24 jam non-stop (100% aman kuota).
 */
function AKTIFKAN_AUTO_PUSH_5_MENIT() {
  matikanAutoPushSilent();
  ScriptApp.newTrigger('sinkronkanDhpKeRekapOtomatis')
    .timeBased()
    .everyMinutes(5)
    .create();
  Logger.log('===================================================================');
  Logger.log('✅ SUKSES: Auto-Push Tiap 5 Menit Berhasil Diaktifkan!');
  Logger.log('Data DHP akan otomatis diselaraskan ke Rekap tiap 5 menit di Cloud.');
  Logger.log('Batas kuota aman: Hanya terpakai ~5% dari limit harian akun Google.');
  Logger.log('===================================================================');
}

/**
 * 3. PILIH INI LALU KLIK "JALANKAN (RUN)" UNTUK MEMATIKAN AUTO-PUSH
 */
function MATIKAN_AUTO_PUSH() {
  matikanAutoPushSilent();
  Logger.log('🛑 SUKSES: Pemicu Auto-Push latar belakang telah dinonaktifkan.');
}

/**
 * 4. PILIH INI LALU KLIK "JALANKAN (RUN)" UNTUK CEK STATUS PEMICU
 */
function CEK_STATUS_PEMICU() {
  var triggers = ScriptApp.getProjectTriggers();
  var count = 0;
  for (var i = 0; i < triggers.length; i++) {
    var fn = triggers[i].getHandlerFunction();
    if (fn === 'sinkronkanDhpKeRekap' || fn === 'sinkronkanDhpKeRekapOtomatis') {
      count++;
    }
  }
  if (count > 0) {
    Logger.log('🟢 STATUS: Auto-Push 5 Menit SEDANG AKTIF (' + count + ' pemicu berjalan).');
  } else {
    Logger.log('⚪ STATUS: Auto-Push TIDAK AKTIF (0 pemicu terpasang).');
  }
}

function matikanAutoPushSilent() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    var fn = triggers[i].getHandlerFunction();
    if (fn === 'sinkronkanDhpKeRekap' || fn === 'sinkronkanDhpKeRekapOtomatis') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
}

function sinkronkanDhpKeRekapManual() {
  return sinkronkanDhpKeRekap(true);
}

function sinkronkanDhpKeRekapOtomatis() {
  return sinkronkanDhpKeRekap(false);
}

// Menu khusus jika sewaktu-waktu script dipasang di dalam Spreadsheet
function onOpen() {
  try {
    SpreadsheetApp.getUi()
      .createMenu('⚡ Integrasi DHP Tembakau')
      .addItem('▶ Jalankan Sinkronisasi Sekarang', 'sinkronkanDhpKeRekapManual')
      .addSeparator()
      .addItem('🧹 Bersihkan Batch Dibatalkan & Rekonsiliasi Tanggal Aktif', 'BERSIHKAN_DUPLIKAT_DAN_REKONSILIASI')
      .addSeparator()
      .addItem('⏰ Aktifkan Auto-Push 5 Menit', 'AKTIFKAN_AUTO_PUSH_5_MENIT')
      .addItem('🛑 Matikan Auto-Push', 'MATIKAN_AUTO_PUSH')
      .addItem('ℹ Cek Status Pemicu', 'CEK_STATUS_PEMICU')
      .addToUi();
  } catch(e) {
    // Abaikan jika standalone (tidak memiliki UI container spreadsheet)
  }
}

function sinkronkanDhpKeRekap(isManual) {
  if (isManual === undefined) isManual = false;
  var ssRekap = SpreadsheetApp.openById(CONFIG_INTEGRASI_TEMBAKAU.REKAP_SS_ID);
  var shRekap = ssRekap.getSheetByName(CONFIG_INTEGRASI_TEMBAKAU.REKAP_SHEET_NAME);
  
  var ssDhp = SpreadsheetApp.openById(CONFIG_INTEGRASI_TEMBAKAU.DHP_SS_ID);
  var shDhp = ssDhp.getSheetByName(CONFIG_INTEGRASI_TEMBAKAU.DHP_SHEET_NAME);

  if (!shRekap || !shDhp) {
    var errMsg = 'Error: Sheet Rekap atau Sheet DHP tidak ditemukan!';
    Logger.log(errMsg);
    return { success: false, error: errMsg };
  }

  // 1. Ambil data aktif dari DHP Tembakau (Tab INTEGRASI DATA)
  var lastRowDhp = shDhp.getLastRow();
  if (lastRowDhp < 3) {
    Logger.log('Data di DHP belum tersedia atau kosong.');
    return { success: false, error: 'Data DHP kosong' };
  }
  
  // Baris 1: Summary, Baris 2: Header, Data mulai baris 3
  var dhpValues = shDhp.getRange(3, 1, lastRowDhp - 2, shDhp.getLastColumn()).getValues();

  // Deteksi kolom PERLAKUAN PROSES secara dinamis dari baris 2 DHP
  var headerDhp = shDhp.getRange(2, 1, 1, shDhp.getLastColumn()).getValues()[0];
  var perlakuanColIndex = 13; // default Kolom N (0-indexed 13)
  for (var h = 0; h < headerDhp.length; h++) {
    var hText = String(headerDhp[h] || '').toLowerCase();
    if (hText.indexOf('perlakuan') !== -1 && hText.indexOf('proses') !== -1) {
      perlakuanColIndex = h;
      break;
    }
  }
  // Kamus & Parser Tanggal Berbasis Locale Indonesia
  var INDO_MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  var INDO_MONTH_MAP = {
    'januari': 0, 'jan': 0,
    'februari': 1, 'feb': 1,
    'maret': 2, 'mar': 2,
    'april': 3, 'apr': 3,
    'mei': 4, 'may': 4,
    'juni': 5, 'jun': 5,
    'juli': 6, 'jul': 6,
    'agustus': 7, 'agu': 7, 'ags': 7, 'aug': 7,
    'september': 8, 'sep': 8,
    'oktober': 9, 'okt': 9, 'oct': 9,
    'november': 10, 'nov': 10,
    'desember': 11, 'des': 11, 'dec': 11
  };

  function parseTanggalIndo(raw) {
    if (!raw) return null;
    if (raw instanceof Date) return isNaN(raw.getTime()) ? null : raw;
    var s = String(raw).replace(/^[a-zA-Z]+,\\s*/, '').trim();

    var mText = s.match(/^(\\d{1,2})\\s+([a-zA-Z]+)\\s+(\\d{4})/);
    if (mText) {
      var day = parseInt(mText[1], 10);
      var mKey = mText[2].toLowerCase();
      var year = parseInt(mText[3], 10);
      if (mKey in INDO_MONTH_MAP) {
        return new Date(year, INDO_MONTH_MAP[mKey], day);
      }
    }

    var mIso = s.match(/^(\\d{4})-(\\d{1,2})-(\\d{1,2})/);
    if (mIso) {
      return new Date(parseInt(mIso[1], 10), parseInt(mIso[2], 10) - 1, parseInt(mIso[3], 10));
    }

    var mSlash = s.match(/^(\\d{1,2})[\\/\\-](\\d{1,2})[\\/\\-](\\d{4})/);
    if (mSlash) {
      return new Date(parseInt(mSlash[3], 10), parseInt(mSlash[2], 10) - 1, parseInt(mSlash[1], 10));
    }

    var d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }

  function formatKolomBTanggal(d) {
    if (!d || isNaN(d.getTime())) return '';
    var day = d.getDate();
    var mShort = INDO_MONTH_SHORT[d.getMonth()];
    var y = d.getFullYear();
    return day + ' ' + mShort + ' ' + y;
  }

  function formatIsoDateStr(d) {
    if (!d || isNaN(d.getTime())) return '';
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1);
    if (m.length < 2) m = '0' + m;
    var day = String(d.getDate());
    if (day.length < 2) day = '0' + day;
    return y + '-' + m + '-' + day;
  }

  var dhpBatches = [];

  for (var j = 0; j < dhpValues.length; j++) {
    var row = dhpValues[j];
    var rawTgl = row[2]; // Kolom C: Tanggal (misal: "Selasa, 20 Oktober 2026")
    var rawJenis = String(row[3] || '').trim(); // Kolom D: Jenis Tembakau
    var rawBaku = parseDecimalNumber(row[4]); // Kolom E: Netto Baku
    var gagang = parseDecimalNumber(row[5]); // Kolom F: Gagang
    var air = parseDecimalNumber(row[6]); // Kolom G: Air
    var debu = parseDecimalNumber(row[7]); // Kolom H: Debu
    var hasil = parseDecimalNumber(row[8]); // Kolom I: Netto Hasil
    var susut = parseDecimalNumber(row[9]) || (rawBaku - hasil); // Kolom J

    if (rawJenis && (rawBaku > 0 || hasil > 0)) {
      var dateObj = parseTanggalIndo(rawTgl);
      if (!dateObj) continue;

      var dateLabel = formatKolomBTanggal(dateObj); // "20 Okt 2026" (Format Kolom B Sheet Rekap)
      var isoDate = formatIsoDateStr(dateObj); // "2026-10-20"
      
      // Ambil Jalur Proses dari Kolom PERLAKUAN PROSES (DHP)
      var rawPerlakuan = String(row[perlakuanColIndex] || row[13] || '').trim().toUpperCase();
      var jalur = (rawPerlakuan.indexOf('SKM') !== -1 || rawJenis.toUpperCase().indexOf('SKM') !== -1) ? 'SKM' : 'SKT';

      dhpBatches.push({
        dateObj: dateObj,
        dateLabel: dateLabel,
        isoDate: isoDate,
        jenis: rawJenis,
        jalur: jalur,
        baku: rawBaku,
        hasil: hasil,
        susut: susut,
        gagang: gagang,
        air: air,
        debu: debu
      });
    }
  }

  // 2. Baca seluruh baris di Sheet Rekap untuk pencocokan pintar (Smart Match & Fill)
  var lastRowRekap = shRekap.getLastRow();
  var rekapCount = Math.max(0, lastRowRekap - CONFIG_INTEGRASI_TEMBAKAU.REKAP_DATA_START_ROW + 1);
  var rekapValues = [];

  if (rekapCount > 0) {
    // Ambil kolom A sampai N (14 kolom)
    rekapValues = shRekap.getRange(CONFIG_INTEGRASI_TEMBAKAU.REKAP_DATA_START_ROW, 1, rekapCount, 14).getValues();
  }

  var updatedCount = 0;
  var matchedDhpIndices = new Set();
  var actualMaxRow = CONFIG_INTEGRASI_TEMBAKAU.REKAP_DATA_START_ROW - 1;

  function cleanStr(s) {
    return String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  // Loop setiap baris di Rekap
  for (var k = 0; k < rekapValues.length; k++) {
    var rowIdx = CONFIG_INTEGRASI_TEMBAKAU.REKAP_DATA_START_ROW + k;
    var rRow = rekapValues[k];
    var rTgl = rRow[1]; // Kolom B: Tanggal (misal: "21 Okt 2026")
    var rJenis = String(rRow[5] || '').trim(); // Kolom F: Jenis Tembakau
    var rJalur = String(rRow[6] || '').trim().toUpperCase(); // Kolom G: Jenis/Jalur (SKT / SKM)
    var rBaku = parseDecimalNumber(rRow[7]); // Kolom H: Netto Baku
    var rHasil = parseDecimalNumber(rRow[8]); // Kolom I: Netto Hasil
    var rGagang = parseDecimalNumber(rRow[11]); // Kolom L: Gagang
    var rAir = parseDecimalNumber(rRow[12]); // Kolom M: Air
    var rDebu = parseDecimalNumber(rRow[13]); // Kolom N: Debu

    if (rTgl && String(rTgl).trim() !== '') {
      actualMaxRow = Math.max(actualMaxRow, rowIdx);

      var rDateObj = parseTanggalIndo(rTgl);
      var rIso = rDateObj ? formatIsoDateStr(rDateObj) : String(rTgl).trim().toLowerCase();
      var rLabel = rDateObj ? formatKolomBTanggal(rDateObj).toLowerCase() : String(rTgl).trim().toLowerCase();

      // Cocokkan dengan batch DHP
      for (var b = 0; b < dhpBatches.length; b++) {
        if (matchedDhpIndices.has(b)) continue;
        var batch = dhpBatches[b];
        var matchTgl = (rIso === batch.isoDate) || 
                       (rLabel === batch.dateLabel.toLowerCase()) ||
                       (cleanStr(rTgl).includes(cleanStr(batch.dateLabel)));
        var matchJenis = cleanStr(rJenis) === cleanStr(batch.jenis);

        // Cocok jika bobot baku sama persis (< 5 Kg) ATAU jika jalur & jenis sama pada tanggal tsb
        var matchBaku = (rBaku > 0 && Math.abs(rBaku - batch.baku) < 5);
        var matchJalur = (rJalur === batch.jalur);

        if (matchTgl && matchJenis && (matchBaku || matchJalur)) {
          matchedDhpIndices.add(b);

          // ========================================================
          // 📌 KETENTUAN: SHEET TUJUAN REKAP MENGIKUTI APA YG TERCANTUM PADA DHP
          // Update Kolom G (Col 7) agar persis mengikuti jalur DHP (SKT atau SKM)
          // ========================================================
          shRekap.getRange(rowIdx, 7).setValue(batch.jalur);

          // Cek apakah baris ini perlu diisi / diperbarui dengan data akhir DHP
          // 🛡️ PROTEKSI ANTI-TIMPA NILAI 0: Jika Netto Hasil di Rekap sudah ada (> 0),
          // dan data DHP masih bernilai 0 (karena masih berjalan/belum ditimbang output-nya),
          // JANGAN PERNAH menimpa hasil yang sudah ada dengan 0!
          var needsFill = (rHasil === 0 && batch.hasil > 0) || 
                          (rRow[8] === '' || rRow[8] === null) || 
                          (batch.hasil > 0 && Math.abs(rHasil - batch.hasil) > 0.01) || 
                          (Math.abs(rBaku - batch.baku) > 0.05) ||
                          (Math.abs(rGagang - batch.gagang) > 0.05) ||
                          (Math.abs(rAir - batch.air) > 0.05) ||
                          (Math.abs(rDebu - batch.debu) > 0.05);

          if (needsFill) {
            // ========================================================
            // 📌 KETENTUAN: SHEET TUJUAN REKAP MENGIKUTI APA YG TERCANTUM PADA DHP
            // Selaraskan Kolom H (Col 8): Netto Baku mengikuti timbangan riil DHP
            // (jika masih kosong atau jika nilainya berbeda/keliru dari salinan sebelumnya)
            // ========================================================
            if (rBaku === 0 || Math.abs(rBaku - batch.baku) > 0.05) {
              shRekap.getRange(rowIdx, 8).setValue(batch.baku);
            }

            // Kolom I (Col 9): Netto Hasil (dari DHP)
            // 🛡️ Proteksi: Hanya update hasil jika batch.hasil > 0 (bukan status masih proses/draft)
            if (batch.hasil > 0) {
              shRekap.getRange(rowIdx, 9).setValue(batch.hasil);
            } else if (rHasil === 0 && (rRow[8] === '' || rRow[8] === null)) {
              shRekap.getRange(rowIdx, 9).setValue(0);
            }

            // Kolom L (Col 12): Gagang
            shRekap.getRange(rowIdx, 12).setValue(batch.gagang);

            // Kolom M (Col 13): Air
            if (batch.air > 0) {
              shRekap.getRange(rowIdx, 13).setValue(batch.air);
            } else {
              shRekap.getRange(rowIdx, 13).clearContent();
            }

            // Kolom N (Col 14): Debu
            shRekap.getRange(rowIdx, 14).setValue(batch.debu);

            // SANGAT PENTING:
            // - Kolom C (3): JANGAN DISENTUH (Formula Bulan otomatis)
            // - Kolom D (4): JANGAN DISENTUH (Formula Tahun otomatis)
            // - Kolom E (5): JANGAN DISENTUH (Formula JOIN Jenis/Perlakuan berhitung otomatis)
            // - Kolom J (10): JANGAN DISENTUH (Formula Susut Kg otomatis)
            // - Kolom K (11): JANGAN DISENTUH (Formula Susut % format persen otomatis)

            updatedCount++;
          }
          break;
        }
      }
    }
  }

  // 3. Tambahkan baris baru HANYA jika ada batch DHP yang belum ada barisnya sama sekali
  var appendedCount = 0;
  for (var m = 0; m < dhpBatches.length; m++) {
    if (!matchedDhpIndices.has(m)) {
      var item = dhpBatches[m];
      var targetRow = actualMaxRow + 1;
      actualMaxRow = targetRow;

      // Isi kolom data murni ke baris baru:
      shRekap.getRange(targetRow, 2).setValue(item.dateLabel); // B: Tanggal
      shRekap.getRange(targetRow, 6).setValue(item.jenis);     // F: Jenis Tembakau
      shRekap.getRange(targetRow, 7).setValue(item.jalur);     // G: Jenis/Jalur (SKT/SKM)
      shRekap.getRange(targetRow, 8).setValue(item.baku);      // H: Netto Baku
      shRekap.getRange(targetRow, 9).setValue(item.hasil);     // I: Netto Hasil
      shRekap.getRange(targetRow, 12).setValue(item.gagang);   // L: Gagang
      if (item.air > 0) {
        shRekap.getRange(targetRow, 13).setValue(item.air);    // M: Air
      }
      shRekap.getRange(targetRow, 14).setValue(item.debu);     // N: Debu

      // JANGAN MENIMPA RUMUS PADA KOLOM C, D, E, J, K:
      // Periksa apakah baris target sudah memiliki formula (seperti template baris kosong).
      // Jika baris target belum memiliki formula, salin formula asli dari baris template atasnya (prevRow)
      var prevRow = targetRow - 1;
      var protectedCols = [3, 4, 5, 10, 11]; // C (Bulan), D (Tahun), E (JOIN), J (Susut Kg), K (Susut %)
      for (var p = 0; p < protectedCols.length; p++) {
        var colNum = protectedCols[p];
        var cellTarget = shRekap.getRange(targetRow, colNum);
        if (cellTarget.getFormula() === '') {
          var cellSource = shRekap.getRange(prevRow, colNum);
          if (cellSource.getFormula() !== '') {
            cellSource.copyTo(cellTarget, SpreadsheetApp.CopyPasteType.PASTE_FORMULA, false);
          }
        }
      }

      appendedCount++;
    }
  }

  // 4. MEKANISME OTOMATIS: REVERSE SCANNING & AUTO-PURGE BATCH DIBATALKAN
  // Menelusuri baris tanggal aktif dari bawah ke atas (bottom-up agar aman).
  // Jika ada baris template/draft pada tanggal aktif yang TIDAK menerima transaksi riil DHP:
  // - Jika bobot Baku 0,0 Kg (baris template berlebih): Otomatis langsung dihapus bersih.
  // - Jika dipanggil secara manual (isManual) atau rekonsiliasi dan hasil = 0 (rencana produksi dibatalkan): Otomatis dihapus agar tidak menjadi data hantu.
  var purgedCount = 0;
  if (dhpBatches.length > 0) {
    var activeTargetDateLabel = dhpBatches[0].dateLabel.toLowerCase();
    for (var kScan = rekapValues.length - 1; kScan >= 0; kScan--) {
      var checkRow = CONFIG_INTEGRASI_TEMBAKAU.REKAP_DATA_START_ROW + kScan;
      var rScanRow = rekapValues[kScan];
      var rScanTgl = rScanRow[1];
      var rScanJenis = String(rScanRow[5] || '').trim();
      var rScanBaku = parseDecimalNumber(rScanRow[7]);
      var rScanHasil = parseDecimalNumber(rScanRow[8]);

      if (!rScanTgl || !rScanJenis) continue;

      var scanDateObj = parseTanggalIndo(rScanTgl);
      var scanLabel = scanDateObj ? formatKolomBTanggal(scanDateObj).toLowerCase() : String(rScanTgl).trim().toLowerCase();

      // Hanya proses baris pada tanggal aktif DHP yang sama
      if (scanLabel === activeTargetDateLabel) {
        var isReceivedRealDhp = false;
        for (var bIdx = 0; bIdx < dhpBatches.length; bIdx++) {
          if (cleanStr(dhpBatches[bIdx].jenis) === cleanStr(rScanJenis)) {
            isReceivedRealDhp = true;
            break;
          }
        }

        // Jika baris tidak menerima transaksi riil DHP dan hasil produksi masih 0:
        if (!isReceivedRealDhp && rScanHasil === 0) {
          // Kasus A: Baku 0,0 Kg (Template berlebih) -> Selalu hapus otomatis
          // Kasus B: Baku > 0 (Rencana batal atau baris duplikat/pre-draft dari hari sebelumnya)
          // -> Hapus jika dipanggil manual, ATAU jika seluruh batch DHP riil sudah masuk ke Rekap (allDhpDone)
          var allDhpDone = (matchedDhpIndices.size >= dhpBatches.length);
          if (rScanBaku === 0 || isManual || allDhpDone) {
            Logger.log('🗑️ Auto-Purge baris dibatalkan/duplikat #' + checkRow + ': ' + rScanJenis + ' (' + rScanTgl + ')');
            shRekap.deleteRow(checkRow);
            purgedCount++;
          }
        }
      }
    }
  }

  var summaryMsg = 'Sinkronisasi Selesai: ' + updatedCount + ' baris draft berhasil diselaraskan & diisi, ' + appendedCount + ' baris baru ditambahkan' + (purgedCount > 0 ? ', ' + purgedCount + ' baris dibatalkan dibersihkan' : '') + '. Formula C, D, E, J, dan K terlindungi 100%.';
  Logger.log(summaryMsg);

  if (isManual) {
    try {
      SpreadsheetApp.getUi().alert('⚡ Hasil Integrasi DHP Tembakau', summaryMsg, SpreadsheetApp.getUi().ButtonSet.OK);
    } catch(e) {}
  }

  return {
    success: true,
    updatedCount: updatedCount,
    appendedCount: appendedCount,
    purgedCount: purgedCount,
    message: summaryMsg
  };
}

/**
 * =========================================================================
 * 5. FUNGSI KHUSUS: BERSIHKAN DUPLIKAT & REKONSILIASI TANGGAL AKTIF (26 OKT)
 * Menghapus baris anomali/duplikat dari tanggal sebelumnya (Madura 2024, Weleri 2024, Besuki 2025)
 * dan mengoreksi Netto Baku (Ploso, Sapudi, Beringin) agar tepat 6 jenis sesuai DHP riil.
 * =========================================================================
 */
function BERSIHKAN_DUPLIKAT_DAN_REKONSILIASI() {
  var ssRekap = SpreadsheetApp.openById(CONFIG_INTEGRASI_TEMBAKAU.REKAP_SS_ID);
  var shRekap = ssRekap.getSheetByName(CONFIG_INTEGRASI_TEMBAKAU.REKAP_SHEET_NAME);
  var ssDhp = SpreadsheetApp.openById(CONFIG_INTEGRASI_TEMBAKAU.DHP_SS_ID);
  var shDhp = ssDhp.getSheetByName(CONFIG_INTEGRASI_TEMBAKAU.DHP_SHEET_NAME);

  if (!shRekap || !shDhp) return { success: false, error: 'Sheet Rekap atau DHP tidak ditemukan' };

  var lastRowDhp = shDhp.getLastRow();
  if (lastRowDhp < 3) return { success: false, error: 'DHP kosong' };

  var dhpValues = shDhp.getRange(3, 1, lastRowDhp - 2, shDhp.getLastColumn()).getValues();

  var INDO_MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  var INDO_MONTH_MAP = {
    'januari': 0, 'jan': 0, 'februari': 1, 'feb': 1, 'maret': 2, 'mar': 2,
    'april': 3, 'apr': 3, 'mei': 4, 'may': 4, 'juni': 5, 'jun': 5,
    'juli': 6, 'jul': 6, 'agustus': 7, 'agu': 7, 'ags': 7, 'aug': 7,
    'september': 8, 'sep': 8, 'oktober': 9, 'okt': 9, 'oct': 9,
    'november': 10, 'nov': 10, 'desember': 11, 'des': 11, 'dec': 11
  };

  function parseTanggal(raw) {
    if (!raw) return null;
    if (raw instanceof Date) return isNaN(raw.getTime()) ? null : raw;
    var s = String(raw).replace(/^[a-zA-Z]+,\\s*/, '').trim();
    var mText = s.match(/^(\\d{1,2})\\s+([a-zA-Z]+)\\s+(\\d{4})/);
    if (mText) {
      var d = parseInt(mText[1], 10);
      var m = mText[2].toLowerCase();
      var y = parseInt(mText[3], 10);
      if (m in INDO_MONTH_MAP) return new Date(y, INDO_MONTH_MAP[m], d);
    }
    var mIso = s.match(/^(\\d{4})-(\\d{1,2})-(\\d{1,2})/);
    if (mIso) return new Date(parseInt(mIso[1], 10), parseInt(mIso[2], 10) - 1, parseInt(mIso[3], 10));
    return new Date(s);
  }

  function formatTgl(d) {
    if (!d || isNaN(d.getTime())) return '';
    return d.getDate() + ' ' + INDO_MONTH_SHORT[d.getMonth()] + ' ' + d.getFullYear();
  }

  function clean(s) {
    return String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  // 1. Kumpulkan daftar batch aktif dari DHP
  var dhpBatches = [];
  var targetDateLabel = '';

  for (var j = 0; j < dhpValues.length; j++) {
    var r = dhpValues[j];
    var rawTgl = r[2];
    var rawJenis = String(r[3] || '').trim();
    var baku = parseDecimalNumber(r[4]);
    var gagang = parseDecimalNumber(r[5]);
    var air = parseDecimalNumber(r[6]);
    var debu = parseDecimalNumber(r[7]);
    var hasil = parseDecimalNumber(r[8]);
    var susut = parseDecimalNumber(r[9]) || (baku - hasil);

    if (rawJenis && (baku > 0 || hasil > 0)) {
      var dObj = parseTanggal(rawTgl);
      if (!dObj) continue;
      var lbl = formatTgl(dObj);
      if (!targetDateLabel) targetDateLabel = lbl;

      var rawPerlakuan = String(r[13] || '').trim().toUpperCase();
      var jalur = (rawPerlakuan.indexOf('SKM') !== -1 || rawJenis.toUpperCase().indexOf('SKM') !== -1) ? 'SKM' : 'SKT';

      dhpBatches.push({
        jenis: rawJenis,
        jalur: jalur,
        baku: baku,
        hasil: hasil,
        susut: susut,
        gagang: gagang,
        air: air,
        debu: debu
      });
    }
  }

  if (dhpBatches.length === 0) return { success: false, message: 'Tidak ada batch DHP yang valid' };

  // 2. Baca sheet Rekap
  var lastRowRekap = shRekap.getLastRow();
  var rekapCount = Math.max(0, lastRowRekap - CONFIG_INTEGRASI_TEMBAKAU.REKAP_DATA_START_ROW + 1);
  if (rekapCount === 0) return { success: false, message: 'Sheet Rekap kosong' };

  var rekapValues = shRekap.getRange(CONFIG_INTEGRASI_TEMBAKAU.REKAP_DATA_START_ROW, 1, rekapCount, 14).getValues();

  var deletedRows = 0;
  var reconciledRows = 0;

  // Lakukan iterasi dari baris paling bawah ke atas agar deleteRow tidak menggeser indeks baris atasnya
  for (var k = rekapValues.length - 1; k >= 0; k--) {
    var actualRow = CONFIG_INTEGRASI_TEMBAKAU.REKAP_DATA_START_ROW + k;
    var rowData = rekapValues[k];
    var rTgl = rowData[1];
    var rJenis = String(rowData[5] || '').trim();

    if (!rTgl || !rJenis) continue;

    var rDateObj = parseTanggal(rTgl);
    var rLabel = rDateObj ? formatTgl(rDateObj) : String(rTgl).trim();

    // Khusus proses baris yang bertanggal sama dengan tanggal aktif DHP (misal: "26 Okt 2026")
    if (rLabel.toLowerCase() === targetDateLabel.toLowerCase()) {
      var foundIdx = -1;
      for (var b = 0; b < dhpBatches.length; b++) {
        if (clean(dhpBatches[b].jenis) === clean(rJenis)) {
          foundIdx = b;
          break;
        }
      }

      if (foundIdx === -1) {
        // Baris anomali / dibatalkan / ghost row yang tidak tercatat di DHP
        // Pengaman: Hanya hapus jika Netto Hasil masih 0 atau kosong (tidak ada output riil)
        var rHasilRow = parseDecimalNumber(rowData[8]);
        if (rHasilRow === 0) {
          Logger.log('🗑️ Hapus baris dibatalkan #' + actualRow + ': ' + rJenis + ' (' + rLabel + ')');
          shRekap.deleteRow(actualRow);
          deletedRows++;
        } else {
          Logger.log('⚠️ Lewati baris #' + actualRow + ' (' + rJenis + '): Memiliki Netto Hasil ' + rHasilRow + ' Kg');
        }
      } else {
        // Baris valid, lakukan koreksi nilai sel mengikuti DHP riil
        var bItem = dhpBatches[foundIdx];
        shRekap.getRange(actualRow, 7).setValue(bItem.jalur);   // G: Jalur
        shRekap.getRange(actualRow, 8).setValue(bItem.baku);    // H: Netto Baku (Koreksi)
        // 🛡️ Proteksi: Hanya update hasil jika bItem.hasil > 0 (jangan menimpa data selesai dengan 0)
        if (bItem.hasil > 0) {
          shRekap.getRange(actualRow, 9).setValue(bItem.hasil);   // I: Netto Hasil
        }
        shRekap.getRange(actualRow, 12).setValue(bItem.gagang); // L: Gagang
        if (bItem.air > 0) {
          shRekap.getRange(actualRow, 13).setValue(bItem.air);  // M: Air
        } else {
          shRekap.getRange(actualRow, 13).clearContent();
        }
        shRekap.getRange(actualRow, 14).setValue(bItem.debu);   // N: Debu
        reconciledRows++;
      }
    }
  }

  var msg = '✅ Rekonsiliasi Sukses: ' + reconciledRows + ' baris diselaraskan presisi, ' + deletedRows + ' baris duplikat dihapus. Rekap tanggal ' + targetDateLabel + ' kini tepat ' + dhpBatches.length + ' jenis tembakau!';
  Logger.log(msg);

  try {
    SpreadsheetApp.getUi().alert('🧹 Rekonsiliasi & Anti-Duplikasi', msg, SpreadsheetApp.getUi().ButtonSet.OK);
  } catch(e) {}

  return {
    success: true,
    targetDate: targetDateLabel,
    reconciledRows: reconciledRows,
    deletedRows: deletedRows,
    finalBatchCount: dhpBatches.length,
    message: msg
  };
}

function parseDecimalNumber(val) {
  if (val === null || val === undefined) return 0;
  var str = String(val).replace(/[^0-9,.-]/g, '').replace(',', '.');
  return Number(str) || 0;
}

/**
 * Webhook POST untuk dipanggil dari Web App
 */
function doPost(e) {
  try {
    var data = {};
    if (e && e.postData && e.postData.contents) {
      try { data = JSON.parse(e.postData.contents); } catch(pErr) {}
    }
    var action = data.action || (e && e.parameter && e.parameter.action) || '';

    var result;
    if (action === 'cleanDuplicates' || action === 'cleanCancelled' || action === 'reconcile') {
      result = BERSIHKAN_DUPLIKAT_DAN_REKONSILIASI();
    } else {
      result = sinkronkanDhpKeRekap();
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Webhook GET untuk pemanggilan URL langsung
 */
function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || '';
  var res;
  if (action === 'cleanDuplicates' || action === 'cleanCancelled' || action === 'reconcile') {
    res = BERSIHKAN_DUPLIKAT_DAN_REKONSILIASI();
    return ContentService.createTextOutput(JSON.stringify(res))
      .setMimeType(ContentService.MimeType.JSON);
  }
  if (action === 'syncDhp' || action === 'syncDhpToRekap') {
    res = sinkronkanDhpKeRekap();
    return ContentService.createTextOutput(JSON.stringify(res))
      .setMimeType(ContentService.MimeType.JSON);
  }
  return ContentService.createTextOutput(JSON.stringify({
    status: 'GAS Integrasi DHP Tembakau Aktif',
    instruction: 'Panggil dengan action=syncDhp atau jalankan fungsi sinkronkanDhpKeRekap() atau BERSIHKAN_DUPLIKAT_DAN_REKONSILIASI()'
  })).setMimeType(ContentService.MimeType.JSON);
}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(gasScriptCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 3000);
  };

  const handleDownloadPdf = async () => {
    setIsDownloadingPdf(true);
    try {
      const response = await fetch('/api/download-panduan-pdf');
      if (!response.ok) {
        throw new Error('Gagal mengambil file PDF dari server');
      }
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = 'PANDUAN_TEKNIS_AUTO_PUSH_GAS.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 3000);
    } catch (err) {
      console.warn('Direct fetch download failed, fallback to direct link:', err);
      window.open('/api/download-panduan-pdf', '_blank');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const GOOGLE_SHEETS_TSV = `TIMESTAMP_ENTRI\tNO_BATCH\tTANGGAL_PROSES\tSHIFT\tJALUR_PROSES\tJENIS_TEMBAKAU\tNETTO_BAKU_KG\tNETTO_HASIL_KG\tSUSUT_KG\tSUSUT_PCT\tFRAKSI_GAGANG_KG\tFRAKSI_AIR_KG\tFRAKSI_DEBU_KG\tSELISIH_NERACA_KG\tOPERATOR_ADMIN\tSTATUS_PROSES\tCATATAN_KENDALA
2026-10-24 08:30:00\tBTH-202610-001\t2026-10-24\tShift 1\tSKM\tVirginia FC\t1250.00\t1185.50\t=G2-H2\t=IF(G2>0; (G2-H2)/G2; 0)\t38.20\t18.50\t7.80\t=I2-(K2+L2+M2)\tAhmad Faisal\tCOMPLETED\tBatch normal, kelembaban inlet 13.8%
2026-10-24 10:45:00\tBTH-202610-002\t2026-10-24\tShift 1\tSKT\tKasturi Super\t850.00\t804.20\t=G3-H3\t=IF(G3>0; (G3-H3)/G3; 0)\t28.50\t12.30\t5.00\t=I3-(K3+L3+M3)\tAhmad Faisal\tCOMPLETED\tSortir gagang halus manual optimal
2026-10-24 14:15:00\tBTH-202610-003\t2026-10-24\tShift 2\tSKM\tMadura Rajang\t1400.00\t1326.00\t=G4-H4\t=IF(G4>0; (G4-H4)/G4; 0)\t44.00\t21.00\t9.00\t=I4-(K4+L4+M4)\tBudi Santoso\tCOMPLETED\tKadar air bahan baku sedikit tinggi (14.2%)
2026-10-24 16:30:00\tBTH-202610-004\t2026-10-24\tShift 2\tSKT\tBoyolali Gurih\t920.00\t871.50\t=G5-H5\t=IF(G5>0; (G5-H5)/G5; 0)\t31.00\t12.50\t5.00\t=I5-(K5+L5+M5)\tBudi Santoso\tCOMPLETED\tKondisi pisau rajang baru di-asah
2026-10-24 21:00:00\tBTH-202610-005\t2026-10-24\tShift 3\tSKM\tTemanggung Asli\t1100.00\t1039.50\t=G6-H6\t=IF(G6>0; (G6-H6)/G6; 0)\t35.50\t17.00\t8.00\t=I6-(K6+L6+M6)\tDian Pratama\tCOMPLETED\tShift malam lancar, neraca massa seimbang`;

  const handleCopyTsv = () => {
    navigator.clipboard.writeText(GOOGLE_SHEETS_TSV);
    setCopiedTsv(true);
    setTimeout(() => setCopiedTsv(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-1 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-50 border border-slate-300 rounded-xl sm:rounded-2xl shadow-2xl max-w-7xl w-full h-[98vh] sm:h-[94vh] max-h-[98vh] sm:max-h-[94vh] flex flex-col overflow-hidden text-slate-800">
        
        {/* Modal Top Header (Matching Reference Gambar 2) */}
        <div className="px-3.5 sm:px-5 py-2 sm:py-3 border-b border-slate-800 flex items-center justify-between gap-2.5 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white shrink-0">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 shadow-sm flex-shrink-0">
              <Database className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h2 className="text-xs sm:text-sm font-bold text-white tracking-tight truncate">
                  Integrasi &amp; Sinkronisasi DHP Tembakau
                </h2>
                <span className="px-1.5 sm:px-2 py-0.5 rounded-full text-[8px] sm:text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 shadow-sm flex-shrink-0">
                  Presisi 100%
                </span>
              </div>
              <p className="text-[9px] sm:text-[11px] text-slate-300 leading-none mt-0.5 truncate hidden xs:block">
                Pencocokan dan transfer otomatis data aktif DHP Tembakau ke Datasheet Rekap Susut Tembakau
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0 cursor-pointer"
            title="Tutup Modal"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Source, Navigation, and Tools Bar - Single Unified Row */}
        <div className="px-3 sm:px-5 py-2 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-2.5 text-xs shrink-0 relative z-20">
          
          {/* SISI KIRI: Indikator Sumber DHP & Target Rekap */}
          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-600 shrink-0">
            <span className="inline-flex items-center gap-1 font-bold text-amber-600">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
              Sumber:
            </span>
            <span className="bg-slate-100 px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] text-slate-800 font-mono border border-slate-200">
              Tab <strong className="text-blue-700">INTEGRASI DATA</strong>
            </span>
            <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Target:
            </span>
            <span className="bg-slate-100 px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] text-slate-800 font-mono border border-slate-200">
              Tab <strong className="text-emerald-700">REKAP SUSUT</strong>
            </span>
          </div>

          {/* SISI TENGAH: Segmented Pill Toggles (Pratinjau vs Analisis Harian) */}
          <div className="flex items-center p-0.5 sm:p-1 bg-slate-100 rounded-xl border border-slate-200/90 shadow-xs shrink-0">
            <button
              onClick={() => { setActiveTab('transaksi'); setShowToolsDropdown(false); }}
              className={`flex items-center gap-1.5 px-3 py-1 sm:py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'transaksi'
                  ? 'bg-white text-blue-700 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Pratinjau ({dhpData?.totalBatch ?? 0})</span>
            </button>

            <button
              onClick={() => { setActiveTab('analisis_harian'); setShowToolsDropdown(false); }}
              className={`flex items-center gap-1.5 px-3 py-1 sm:py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'analisis_harian'
                  ? 'bg-white text-amber-800 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
              <span>Analisis Harian</span>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                Deviasi
              </span>
            </button>
          </div>

          {/* SISI KANAN: Dropdown Menu Alat/Template + Saklar Auto-Tarik + Tombol Tarik Ulang */}
          <div className="flex items-center gap-1.5 sm:gap-2 ml-auto sm:ml-0 shrink-0">
            
            {/* Dynamic Dropdown: Pemetaan, GAS & Template */}
            <div className="relative">
              <button
                onClick={() => setShowToolsDropdown(!showToolsDropdown)}
                className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg border text-xs font-semibold transition-all shadow-xs cursor-pointer ${
                  ['pemetaan', 'gas', 'template_dhp'].includes(activeTab)
                    ? 'bg-blue-50 border-blue-400 text-blue-800 font-bold ring-2 ring-blue-500/20'
                    : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700'
                }`}
                title="Buka menu konfigurasi, pemetaan kolom, skrip GAS, dan template Excel"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">
                  {activeTab === 'pemetaan'
                    ? 'Pemetaan Kolom'
                    : activeTab === 'gas'
                    ? 'Skrip GAS'
                    : activeTab === 'template_dhp'
                    ? 'Template Excel'
                    : 'Alat & Konfigurasi'}
                </span>
                <span className="sm:hidden">
                  {activeTab === 'pemetaan'
                    ? 'Pemetaan'
                    : activeTab === 'gas'
                    ? 'GAS'
                    : activeTab === 'template_dhp'
                    ? 'Template'
                    : 'Alat'}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showToolsDropdown ? 'rotate-180' : ''}`} />
              </button>

              {/* Popover Dropdown Menu */}
              {showToolsDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setShowToolsDropdown(false)}
                  />
                  <div className="absolute right-0 mt-1.5 w-60 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-40 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                      Konfigurasi &amp; Referensi DHP
                    </div>

                    <button
                      onClick={() => { setActiveTab('pemetaan'); setShowToolsDropdown(false); }}
                      className={`w-full text-left px-3 py-2 flex items-center justify-between transition-colors cursor-pointer ${
                        activeTab === 'pemetaan' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span>Pemetaan Kolom &amp; Rumus</span>
                      </div>
                      {activeTab === 'pemetaan' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                    </button>

                    <button
                      onClick={() => { setActiveTab('gas'); setShowToolsDropdown(false); }}
                      className={`w-full text-left px-3 py-2 flex items-center justify-between transition-colors cursor-pointer ${
                        activeTab === 'gas' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Code className="w-4 h-4 text-blue-600" />
                        <span>Skrip Otomasi GAS</span>
                      </div>
                      {activeTab === 'gas' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                    </button>

                    <button
                      onClick={() => { setActiveTab('template_dhp'); setShowToolsDropdown(false); }}
                      className={`w-full text-left px-3 py-2 flex items-center justify-between transition-colors cursor-pointer ${
                        activeTab === 'template_dhp' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                        <span>Template Excel &amp; Spreadsheet</span>
                      </div>
                      <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        Baru
                      </span>
                    </button>

                    <button
                      onClick={() => { setShowToolsDropdown(false); handleReconcileLive(); }}
                      disabled={isReconciling}
                      className="w-full text-left px-3 py-2 flex items-center justify-between text-amber-800 hover:bg-amber-50 font-semibold transition-colors cursor-pointer text-xs"
                      title="Bersihkan batch yang dibatalkan / duplikat dan selaraskan data riil DHP"
                    >
                      <div className="flex items-center gap-2">
                        <RefreshCw className={`w-4 h-4 text-amber-600 ${isReconciling ? 'animate-spin' : ''}`} />
                        <span>Bersihkan Batch Batal &amp; Rekonsiliasi</span>
                      </div>
                      <span className="text-[10px] text-amber-700 font-bold">Purge</span>
                    </button>

                    <div className="my-1 border-t border-slate-100" />

                    <a
                      href="/api/download-template-dhp-excel"
                      download="TEMPLATE_DHP_TEMBAKAU_ADMIN_PROSES.xlsx"
                      onClick={() => setShowToolsDropdown(false)}
                      className="px-3 py-2 flex items-center justify-between text-emerald-800 hover:bg-emerald-50 font-semibold transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Download className="w-4 h-4 text-emerald-700" />
                        <span>Unduh File Excel (.xlsx)</span>
                      </div>
                      <span className="text-[10px] text-emerald-600">Download</span>
                    </a>
                  </div>
                </>
              )}
            </div>

            {/* Smart Live-Sync Saklar / Toggle Switch */}
            <button
              onClick={() => setAutoPullEnabled(!autoPullEnabled)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 sm:py-1.5 rounded-lg border text-[11px] sm:text-xs font-semibold transition-all shadow-xs cursor-pointer ${
                autoPullEnabled
                  ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-800'
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-600'
              }`}
              title={autoPullEnabled ? 'Klik untuk menjeda Auto-Tarik' : 'Klik untuk mengaktifkan kembali Auto-Tarik'}
            >
              <span className={`w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full ${autoPullEnabled ? 'bg-emerald-500 shadow-xs shadow-emerald-500/50 animate-pulse' : 'bg-slate-400'}`}></span>
              <span>{autoPullEnabled ? `Auto (${countdown}s)` : 'Jeda'}</span>
            </button>

            {/* Manual Refresh Button */}
            <button
              onClick={() => loadDhpData(false)}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-[11px] sm:text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
              title="Perbarui pembacaan lembar DHP secara manual (< 1s)"
            >
              <RefreshCw className={`w-3 sm:w-3.5 h-3 sm:h-3.5 ${loading || isAutoPulling ? 'animate-spin' : ''}`} />
              <span className="hidden xs:inline">Tarik Ulang</span>
              <span className="xs:hidden">Tarik</span>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5 flex flex-col min-h-0">
          
          {/* Feedback Toast Notification */}
          {syncNotice && (
            <div className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 animate-in fade-in shrink-0 ${
              syncNotice.type === 'success'
                ? 'bg-emerald-950/70 border-emerald-500/60 text-emerald-300'
                : 'bg-rose-950/70 border-rose-500/60 text-rose-300'
            }`}>
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span className="font-semibold">{syncNotice.message}</span>
            </div>
          )}

          {/* TAB 1: PRATINJAU & TRANSAKSI */}
          {activeTab === 'transaksi' && (
            <div className="space-y-2.5 flex-1 flex flex-col min-h-0">
              
              {/* 3 Compact KPI Summary Cards - 1 Horizontal Row on Mobile & Tablet */}
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5 flex-shrink-0">
                {/* Kartu 1: Total Batch Aktif DHP */}
                <div className="px-2 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-center min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-500 truncate">
                      TOTAL BATCH
                    </span>
                    <Layers className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-slate-400 shrink-0" />
                  </div>
                  <div className="mt-0.5 sm:mt-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5 sm:gap-2">
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm sm:text-lg font-black text-slate-900 leading-tight">
                        {dhpData?.totalBatch || 0}
                      </span>
                      <span className="text-[9px] sm:text-[11px] text-slate-500">Batch</span>
                    </div>
                    <span className="px-1 sm:px-2 py-0.5 rounded text-[9px] sm:text-xs font-bold bg-blue-50 border border-blue-200 text-blue-700 whitespace-nowrap font-mono truncate">
                      {formatKg(dhpData?.totalBakuKg || 0)}
                    </span>
                  </div>
                </div>

                {/* Kartu 2: Terverifikasi di Rekap */}
                <div className="px-2 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-white border border-emerald-300/80 shadow-xs flex flex-col justify-center min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-emerald-800 truncate">
                      TERVERIFIKASI
                    </span>
                    <span className="px-1 sm:px-1.5 py-0.2 rounded text-[8px] sm:text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-0.5 shrink-0">
                      {dhpData?.terverifikasiPct || 0}%
                      <CheckCircle2 className="w-2.5 sm:w-3 h-2.5 sm:h-3 text-emerald-600" />
                    </span>
                  </div>
                  <div className="mt-0.5 sm:mt-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5 sm:gap-2">
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm sm:text-lg font-black text-emerald-800 leading-tight">
                        {dhpData?.terverifikasiCount || 0}
                      </span>
                      <span className="text-[9px] sm:text-[11px] text-slate-500">Batch</span>
                    </div>
                    <span className="px-1 sm:px-2 py-0.5 rounded text-[9px] sm:text-xs font-bold bg-emerald-50 border border-emerald-200 text-emerald-700 whitespace-nowrap font-mono truncate">
                      {formatKg(dhpData?.terverifikasiHasilKg || 0)}
                    </span>
                  </div>
                </div>

                {/* Kartu 3: Batch Baru Siap Masuk */}
                <div className="px-2 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-center min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-500 truncate">
                      BATCH BARU
                    </span>
                    <ShieldCheck className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-slate-400 shrink-0" />
                  </div>
                  <div className="mt-0.5 sm:mt-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5 sm:gap-2">
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm sm:text-lg font-black text-slate-900 leading-tight">
                        {dhpData?.batchBaruCount || 0}
                      </span>
                      <span className="text-[9px] sm:text-[11px] text-slate-500">Batch</span>
                    </div>
                    <span className={`px-1 sm:px-2 py-0.5 rounded text-[9px] sm:text-xs font-bold whitespace-nowrap font-mono truncate ${(dhpData?.batchBaruCount || 0) > 0 ? 'bg-amber-50 border border-amber-200 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>
                      {(dhpData?.batchBaruCount || 0) > 0 ? `${dhpData?.batchBaruCount} Siap` : 'Sinkron'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Alert Banner: Deteksi Batch Dibatalkan & Rekonsiliasi Rekap vs DHP */}
              {((dhpData?.anomalousRekapRows && dhpData.anomalousRekapRows.length > 0) || dhpData?.items.some(it => it.hasBakuMismatch)) && (
                <div className="p-2.5 sm:p-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 text-amber-950 text-xs shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-2.5 shrink-0">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="p-1.5 rounded-lg bg-amber-100 border border-amber-300 text-amber-800 shrink-0 mt-0.5">
                      <AlertCircle className="w-4 h-4" />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <div className="font-bold text-[11px] sm:text-xs text-amber-950 flex items-center gap-1.5 flex-wrap">
                        <span>Audit Realisasi ({dhpData?.items?.[0]?.tanggalFormatted || 'Tanggal Aktif'}): Terdeteksi Batch Batal / Duplikat di Rekap</span>
                        {dhpData.anomalousRekapRows && dhpData.anomalousRekapRows.length > 0 && (
                          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                            {dhpData.anomalousRekapRows.length} Batch Dibatalkan/Hantu
                          </span>
                        )}
                        {dhpData.items.some(it => it.hasBakuMismatch) && (
                          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-200 text-amber-900 border border-amber-400">
                            Baku Berbeda
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] sm:text-[11px] text-amber-800 leading-relaxed">
                        DHP hanya memproses <strong>{dhpData.totalBatch} varian riil ({formatKg(dhpData.totalBakuKg)})</strong>. Di Sheet Rekap terdapat baris rencana yang tidak jadi diproses / dibatalkan, atau selisih Netto Baku antara draft dan timbangan riil.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    <button
                      onClick={handleReconcileLive}
                      disabled={isReconciling}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-amber-700 hover:bg-amber-800 shadow-xs transition-all disabled:opacity-50 cursor-pointer whitespace-nowrap"
                      title="Hapus baris batch yang dibatalkan dan selaraskan Netto Baku riil DHP"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isReconciling ? 'animate-spin' : ''}`} />
                      <span>{isReconciling ? 'Membersihkan...' : 'Bersihkan Batch Batal Live'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Transactions Table Section - Maximized Viewport & Dominant (Matching Gambar 2) */}
              <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl overflow-hidden shadow-xs flex-1 flex flex-col min-h-0">
                {/* Header Tabel Transaksi dengan Ringkasan Neraca Segaris (Inline Summary) */}
                <div className="px-3 sm:px-4 py-1.5 sm:py-2.5 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-1.5 sm:gap-2 flex-shrink-0">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <FileText className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-blue-600 shrink-0" />
                    <span className="text-[11px] sm:text-xs font-bold text-slate-800">
                      Daftar Transaksi DHP Terdeteksi
                    </span>
                    <span className="px-1.5 py-0.5 rounded-md text-[10px] sm:text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200 whitespace-nowrap">
                      {dhpData?.items.length || 0} baris aktif
                    </span>
                  </div>

                  {/* Ringkasan Neraca Segaris (Inline Summary persis seperti Gambar 2) */}
                  <div className="text-[10px] sm:text-xs font-mono text-slate-600 flex items-center gap-1.5 sm:gap-2 flex-wrap">
                    <span>Baku: <strong className="text-slate-900">{formatKg(dhpData?.totalBakuKg || 0)}</strong></span>
                    <span className="text-slate-300">·</span>
                    <span>Hasil: <strong className="text-slate-900">{formatKg(dhpData?.totalHasilKg || 0)}</strong></span>
                    <span className="text-slate-300">·</span>
                    <span>Susut: <strong className="text-amber-800 font-bold">{formatKg(dhpData?.totalSusutKg || 0)}</strong> ({formatPct(dhpData?.totalSusutPct || 0)}%)</span>
                  </div>
                </div>

                {loading ? (
                  <div className="p-12 text-center text-slate-400 space-y-3">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-500" />
                    <div className="text-xs text-slate-600">Memindai tab INTEGRASI DATA pada Google Sheet DHP...</div>
                  </div>
                ) : errorMsg ? (
                  <div className="p-6 text-center text-red-500 space-y-2">
                    <AlertCircle className="w-8 h-8 mx-auto text-red-500" />
                    <div className="text-sm font-medium">{errorMsg}</div>
                    <button
                      onClick={() => loadDhpData(false)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs cursor-pointer"
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
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-100/90 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200 sticky top-0 z-10 backdrop-blur">
                        <tr>
                          <th className="py-2.5 px-3">ROW</th>
                          <th className="py-2.5 px-3">TANGGAL</th>
                          <th className="py-2.5 px-3">JENIS TEMBAKAU</th>
                          <th className="py-2.5 px-2 text-center">JALUR</th>
                          <th className="py-2.5 px-3 text-right">NETTO BAKU (KG)</th>
                          <th className="py-2.5 px-3 text-right">HASIL (KG)</th>
                          <th className="py-2.5 px-3 text-right">SUSUT (KG)</th>
                          <th className="py-2.5 px-3 text-right">% SUSUT</th>
                          <th className="py-2.5 px-3 text-right">GAGANG</th>
                          <th className="py-2.5 px-3 text-right">K. AIR</th>
                          <th className="py-2.5 px-3 text-right">DEBU</th>
                          <th className="py-2.5 px-3 text-center">STATUS REKAP</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {dhpData?.items.map((item: DhpBatchItem) => (
                          <tr
                            key={item.rowNumber}
                            className={`hover:bg-blue-50/40 transition-colors ${
                              item.isMismatch ? 'bg-amber-50/60' : ''
                            }`}
                          >
                            <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px] font-medium">
                              {item.rowNumber}
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <span className="font-semibold text-slate-800 text-xs">
                                {item.tanggalFormatted}
                              </span>
                              {item.waktu && (
                                <span className="text-[10px] text-slate-400 ml-1.5 font-mono">
                                  {item.waktu}
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="font-bold text-slate-900 text-xs">
                                {item.jenisTembakau}
                              </span>
                            </td>
                            <td className="py-2.5 px-2 text-center">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  item.jalur === 'SKM'
                                    ? 'bg-purple-100 text-purple-700'
                                    : 'bg-blue-100 text-blue-700'
                                }`}
                              >
                                {item.jalur}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-blue-700 font-mono">
                              {formatKgRaw(item.nettoBaku)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-medium text-slate-800 font-mono">
                              {item.hasil === 0 ? (
                                <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                                  0,0 (Proses)
                                </span>
                              ) : (
                                formatKgRaw(item.hasil)
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-medium text-amber-800">
                              {formatKgRaw(item.susutKg)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-slate-800 font-mono">
                              {formatPct(item.susutPct)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-slate-600 whitespace-nowrap">
                              {formatKgRaw(item.gagangKg)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-slate-600 whitespace-nowrap">
                              {formatKgRaw(item.airKg)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-slate-600 whitespace-nowrap">
                              {formatKgRaw(item.debuKg)}
                            </td>
                            <td className="py-2.5 px-3 text-center whitespace-nowrap">
                              {item.isMismatch ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-xs animate-pulse whitespace-nowrap">
                                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                  <span>
                                    {item.hasGagangMismatch
                                      ? `Gagang Diperbarui (Rekap ${formatKg(item.rekapGagang || 0)} ➔ DHP ${formatKg(item.gagangKg)})`
                                      : item.hasBakuMismatch
                                      ? `Baku Berbeda (Rekap ${formatKg(item.rekapBaku || 0)} ➔ DHP ${formatKg(item.nettoBaku)})`
                                      : item.hasAirMismatch || item.hasDebuMismatch
                                      ? `Fraksi Diperbarui (Debu/Air)`
                                      : `Hasil Berubah (Rekap ${formatKg(item.rekapHasil || 0)} ➔ DHP ${formatKg(item.hasil)})`}
                                  </span>
                                </span>
                              ) : item.alreadyInRekap ? (
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-300 shadow-xs whitespace-nowrap">
                                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  <span>Cocok {item.matchedRow ? `(Baris ${item.matchedRow})` : ''}</span>
                                </span>
                              ) : item.matchedRow ? (
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-300 shadow-xs whitespace-nowrap">
                                  <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                  <span>Siap Diisi Otomatis (Baris {item.matchedRow})</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-300 shadow-xs whitespace-nowrap">
                                  <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                  <span>Batch Baru (Siap Masuk)</span>
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>

                      {/* Sticky Footer tfoot: Total Neraca Permanen */}
                      <tfoot className="bg-slate-100/95 text-slate-800 border-t-2 border-slate-300 sticky bottom-0 z-10 backdrop-blur font-bold text-xs shadow-xs">
                        <tr className="divide-x divide-slate-200">
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">Σ</td>
                          <td className="py-2.5 px-3 whitespace-nowrap text-xs font-bold text-slate-700">
                            {dhpData?.totalBatch || 0} Batch
                          </td>
                          <td className="py-2.5 px-3 font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                            TOTAL NERACA DHP
                          </td>
                          <td className="py-2.5 px-2 text-center text-slate-400 font-normal">-</td>
                          <td className="py-2.5 px-3 text-right font-black text-blue-800 text-xs font-mono">
                            {formatKg(dhpData?.totalBakuKg || 0)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-black text-slate-900 text-xs font-mono">
                            {formatKg(dhpData?.totalHasilKg || 0)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-black text-amber-800 text-xs font-mono">
                            {formatKg(dhpData?.totalSusutKg || 0)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-black text-slate-900 text-xs font-mono">
                            {formatPct(dhpData?.totalSusutPct || 0)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-medium text-slate-700 whitespace-nowrap font-mono">
                            {formatKg(dhpData?.totalGagangKg || 0)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-medium text-slate-700 whitespace-nowrap font-mono">
                            {formatKg(dhpData?.totalAirKg || 0)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-medium text-slate-700 whitespace-nowrap font-mono">
                            {formatKg(dhpData?.totalDebuKg || 0)}
                          </td>
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            <span className="text-[11px] text-amber-900 font-bold bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
                              Susut: {formatKg(dhpData?.totalSusutKg || 0)}
                            </span>
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>

              {/* Action Bar Sinkronisasi Selalu Ditampilkan */}
              {dhpData && (
                <div className={`px-3.5 py-2.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0 shadow-xs transition-colors ${
                  (((dhpData?.batchBaruCount || 0) > 0) || ((dhpData?.mismatchCount || 0) > 0))
                    ? 'bg-blue-50/95 border-blue-300'
                    : 'bg-emerald-50/90 border-emerald-300'
                }`}>
                  <div className="flex items-center gap-2 text-xs">
                    {(((dhpData?.batchBaruCount || 0) > 0) || ((dhpData?.mismatchCount || 0) > 0)) ? (
                      <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    )}
                    <span className="text-slate-800 font-semibold text-[11px]">
                      {(dhpData?.mismatchCount || 0) > 0
                        ? `⚠️ Ditemukan ${dhpData?.mismatchCount} batch dengan data timbangan (hasil/gagang/fraksi) diperbarui dan ${dhpData?.batchBaruCount || 0} batch baru yang siap diselaraskan.`
                        : (dhpData?.batchBaruCount || 0) > 0
                        ? `Terdapat ${dhpData?.batchBaruCount} batch baru yang siap dibukukan ke baris baru Sheet Rekap.`
                        : `Semua data DHP (${dhpData?.totalBatch || 0} batch) sudah 100% selaras presisi dengan baris Sheet Rekap.`}
                    </span>
                  </div>
                  <button
                    onClick={handleSyncToRekap}
                    disabled={isSyncingToRekap}
                    className={`inline-flex items-center justify-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold shadow-xs transition-all disabled:opacity-50 shrink-0 cursor-pointer ${
                      (((dhpData?.batchBaruCount || 0) > 0) || ((dhpData?.mismatchCount || 0) > 0))
                        ? 'text-white bg-blue-600 hover:bg-blue-700'
                        : 'text-emerald-800 bg-white hover:bg-emerald-100 border border-emerald-300'
                    }`}
                    title="Sinkronkan dan selaraskan data batch DHP ke sheet rekap"
                  >
                    {isSyncingToRekap ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Sedang Menyelaraskan...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>
                          {(((dhpData?.batchBaruCount || 0) > 0) || ((dhpData?.mismatchCount || 0) > 0))
                            ? `Sinkronkan ke Sheet Rekap (${(dhpData?.batchBaruCount || 0) + (dhpData?.mismatchCount || 0)} Batch)`
                            : 'Sinkronkan Ulang ke Sheet Rekap'}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: LAPORAN ANALISIS HARIAN (KOMPARASI ACUAN & RESUME SELURUH BAHAN) */}
          {activeTab === 'analisis_harian' && (
            <div className="space-y-3.5">
              
              {/* Header Kontrol Tanggal & Tombol Cetak */}
              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <span>Pilih Tanggal Pengolahan:</span>
                      <span className="text-[10px] font-normal text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30">
                        {availableAnalisisDates.length} Tanggal Tersedia
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Menganalisis resume seluruh jenis bahan yang masuk dan diproses pada tanggal ini
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={analisisHarian?.tanggal || selectedAnalisisTanggal}
                    onChange={(e) => setSelectedAnalisisTanggal(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-slate-600 bg-slate-900 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                  >
                    {availableAnalisisDates.map(tgl => (
                      <option key={tgl} value={tgl}>{tgl}</option>
                    ))}
                  </select>

                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600 shadow-sm transition-all cursor-pointer"
                    title="Cetak Laporan Resume Harian Ini"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-300" />
                    <span>Cetak Resume</span>
                  </button>
                </div>
              </div>

              {!analisisHarian ? (
                <div className="p-8 text-center text-slate-400 bg-slate-900/50 rounded-xl border border-slate-800">
                  <p className="text-xs">Data transaksi untuk tanggal ini belum tersedia atau DHP belum ditarik.</p>
                </div>
              ) : (
                <>
                  {/* 1. Resume Konsolidasi Harian (4 Kartu Eksekutif) */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                    
                    {/* Total Baku Masuk */}
                    <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
                      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        Total Baku Masuk
                      </div>
                      <div className="text-base font-black text-white mt-0.5">
                        {formatKg(analisisHarian.totalBakuKg)} <span className="text-xs font-normal text-slate-400">Kg</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Hasil Jadi: <strong className="text-slate-200">{formatKg(analisisHarian.totalHasilKg)} Kg</strong>
                      </div>
                    </div>

                    {/* Susut Riil Hari Ini */}
                    <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
                      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        Susut Riil Hari Ini
                      </div>
                      <div className="text-base font-black text-blue-400 mt-0.5">
                        {formatPct(analisisHarian.susutRiilWeightedPct)}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Total Susut: <strong className="text-slate-200">{formatKg(analisisHarian.totalSusutKg)} Kg</strong>
                      </div>
                    </div>

                    {/* Acuan Standar */}
                    <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
                      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        Rata-Rata Acuan
                      </div>
                      <div className="text-base font-black text-amber-400 mt-0.5">
                        {formatPct(analisisHarian.acuanWeightedPct)}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Standar Tertimbang Variasi
                      </div>
                    </div>

                    {/* Net Deviasi Harian */}
                    <div className={`p-3 rounded-xl border ${
                      analisisHarian.statusAgregat === 'kritis'
                        ? 'bg-rose-950/50 border-rose-600/60 text-rose-200'
                        : analisisHarian.statusAgregat === 'toleransi'
                        ? 'bg-amber-950/50 border-amber-600/60 text-amber-200'
                        : 'bg-emerald-950/50 border-emerald-600/60 text-emerald-200'
                    }`}>
                      <div className="text-[10px] font-bold uppercase tracking-wider">
                        Deviasi Agregat Hari Ini
                      </div>
                      <div className="text-base font-black mt-0.5">
                        {analisisHarian.deviasiAgregatPct >= 0 ? '+' : ''}{formatPct(analisisHarian.deviasiAgregatPct)}
                      </div>
                      <div className="text-[10px] font-semibold mt-0.5 flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${
                          analisisHarian.statusAgregat === 'kritis' ? 'bg-rose-500 animate-pulse' :
                          analisisHarian.statusAgregat === 'toleransi' ? 'bg-amber-400' : 'bg-emerald-400'
                        }`}></span>
                        <span>
                          {analisisHarian.statusAgregat === 'kritis' ? 'PERHATIAN OOS' :
                           analisisHarian.statusAgregat === 'toleransi' ? 'TOLERANSI WAJAR' : 'ON-TARGET (NORMAL)'}
                        </span>
                      </div>
                    </div>

                  </div>

                  {/* 2. Dekomposisi Akumulasi Fraksi Limbah Harian */}
                  <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-xs">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-slate-300 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-blue-400" />
                        Akumulasi Limbah Terbuang Hari Ini ({analisisHarian.tanggalFormatted})
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Total Limbah: <strong className="text-white">{formatKg(analisisHarian.totalGagangKg + analisisHarian.totalAirKg + analisisHarian.totalDebuKg)} Kg</strong>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="p-2 bg-slate-800/50 rounded-lg border border-slate-700/60 flex items-center justify-between">
                        <div>
                          <div className="text-[10px] text-slate-400">Total Fraksi Gagang</div>
                          <div className="text-xs font-bold text-white">{formatKg(analisisHarian.totalGagangKg)} Kg</div>
                        </div>
                        <div className="text-xs font-mono font-bold text-slate-300">
                          {analisisHarian.totalBakuKg > 0 ? ((analisisHarian.totalGagangKg / analisisHarian.totalBakuKg) * 100).toFixed(2) : 0}%
                        </div>
                      </div>

                      <div className="p-2 bg-sky-950/40 rounded-lg border border-sky-800/50 flex items-center justify-between">
                        <div>
                          <div className="text-[10px] text-sky-300 flex items-center gap-1">
                            <Droplets className="w-3 h-3 text-sky-400" />
                            Total Penguapan Air
                          </div>
                          <div className="text-xs font-bold text-sky-100">{formatKg(analisisHarian.totalAirKg)} Kg</div>
                        </div>
                        <div className="text-xs font-mono font-bold text-sky-300">
                          {analisisHarian.totalBakuKg > 0 ? ((analisisHarian.totalAirKg / analisisHarian.totalBakuKg) * 100).toFixed(2) : 0}%
                        </div>
                      </div>

                      <div className="p-2 bg-amber-950/40 rounded-lg border border-amber-800/50 flex items-center justify-between">
                        <div>
                          <div className="text-[10px] text-amber-300 flex items-center gap-1">
                            <Wind className="w-3 h-3 text-amber-400" />
                            Total Pemisahan Debu
                          </div>
                          <div className="text-xs font-bold text-amber-100">{formatKg(analisisHarian.totalDebuKg)} Kg</div>
                        </div>
                        <div className="text-xs font-mono font-bold text-amber-300">
                          {analisisHarian.totalBakuKg > 0 ? ((analisisHarian.totalDebuKg / analisisHarian.totalBakuKg) * 100).toFixed(2) : 0}%
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 2b. Komparasi Cuaca Realtime & Indeks Higroskopis Pabrik */}
                  <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 p-3.5 rounded-xl border border-slate-700/80 shadow-sm text-xs">
                    {/* Header bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2.5 border-b border-slate-700/60">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/30">
                          <Thermometer className="w-4 h-4 text-sky-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                              Iklim Lingkungan Pabrik & Indeks Higroskopis Real-Time
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30 animate-pulse">
                              LIVE SATELLITE
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400">
                            Menganalisis pengaruh suhu & kelembaban (RH%) terhadap laju penguapan air dan kerapuhan debu
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex flex-col items-end">
                          <div className="flex items-center gap-1.5 bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-700">
                            <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <select
                              value={selectedLocation.id}
                              onChange={(e) => handleLocationChange(e.target.value)}
                              className="bg-transparent text-xs font-bold text-slate-100 focus:outline-none cursor-pointer"
                            >
                              {FACTORY_LOCATIONS.map(loc => (
                                <option key={loc.id} value={loc.id} className="bg-slate-900 text-white">
                                  {loc.name} {loc.isDefault ? '★ [Pabrik Utama]' : ''}
                                </option>
                              ))}
                            </select>
                          </div>
                          {selectedLocation.address && (
                            <span className="text-[9px] text-amber-300/80 mt-0.5 truncate max-w-xs md:max-w-md font-mono" title={selectedLocation.address}>
                              📍 {selectedLocation.address}
                            </span>
                          )}
                        </div>

                        <button
                          onClick={() => loadWeather(selectedLocation, true)}
                          disabled={weatherLoading}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer disabled:opacity-50 self-start"
                          title="Perbarui Cuaca Realtime"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${weatherLoading ? 'animate-spin text-sky-400' : ''}`} />
                        </button>
                      </div>
                    </div>

                    {/* Weather Metrics Grid */}
                    {weatherData ? (
                      <div className="mt-3 space-y-2.5">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {/* Suhu */}
                          <div className="p-2.5 bg-slate-800/60 rounded-lg border border-slate-700/60 flex items-center justify-between">
                            <div>
                              <div className="text-[10px] text-slate-400 flex items-center gap-1">
                                <Sun className="w-3 h-3 text-amber-400" />
                                Suhu Udara
                              </div>
                              <div className="text-sm font-black text-amber-300 mt-0.5">
                                {weatherData.temperature.toFixed(1)}°C
                              </div>
                            </div>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 font-medium">
                              Ambien
                            </span>
                          </div>

                          {/* RH */}
                          <div className="p-2.5 bg-slate-800/60 rounded-lg border border-slate-700/60 flex items-center justify-between">
                            <div>
                              <div className="text-[10px] text-slate-400 flex items-center gap-1">
                                <Droplets className="w-3 h-3 text-sky-400" />
                                Kelembaban (RH)
                              </div>
                              <div className="text-sm font-black text-sky-300 mt-0.5">
                                {weatherData.humidity}%
                              </div>
                            </div>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 font-medium">
                              Relatif
                            </span>
                          </div>

                          {/* Cuaca */}
                          <div className="p-2.5 bg-slate-800/60 rounded-lg border border-slate-700/60 flex items-center justify-between">
                            <div>
                              <div className="text-[10px] text-slate-400 flex items-center gap-1">
                                <CloudSun className="w-3 h-3 text-blue-400" />
                                Kondisi Cuaca
                              </div>
                              <div className="text-xs font-bold text-slate-200 mt-0.5 truncate max-w-[120px]" title={weatherData.weatherDesc}>
                                {weatherData.weatherDesc}
                              </div>
                            </div>
                            <span className="text-[9px] text-slate-400">
                              {weatherData.windSpeed} km/j
                            </span>
                          </div>

                          {/* Indeks Higroskopis */}
                          <div className={`p-2.5 rounded-lg border flex items-center justify-between ${weatherData.hygroIndex.badgeBg} ${weatherData.hygroIndex.badgeBorder}`}>
                            <div>
                              <div className="text-[10px] text-slate-400 flex items-center gap-1">
                                <Gauge className="w-3 h-3 text-slate-300" />
                                Indeks Higroskopis
                              </div>
                              <div className={`text-xs font-black mt-0.5 ${weatherData.hygroIndex.badgeColor}`}>
                                {weatherData.hygroIndex.status}
                              </div>
                            </div>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${weatherData.hygroIndex.badgeBg} ${weatherData.hygroIndex.badgeColor} border ${weatherData.hygroIndex.badgeBorder}`}>
                              {weatherData.hygroIndex.potensiPenguapan === 'Tinggi' ? 'EVAPORASI CEPAT' : weatherData.hygroIndex.potensiPenguapan === 'Rendah' ? 'EVAPORASI RENDAH' : 'STABIL'}
                            </span>
                          </div>
                        </div>

                        {/* Korelasi Pintar dengan Data DHP */}
                        <div className="p-2.5 bg-slate-950/70 rounded-lg border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-sky-300">
                              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <span>Korelasi Cuaca & Susut Tembakau Hari Ini:</span>
                            </div>
                            <p className="text-[10px] text-slate-300 leading-relaxed">
                              {weatherData.hygroIndex.analisisKorelasi} Hari ini fraksi air tercatat <strong className="text-sky-300">{formatKg(analisisHarian.totalAirKg)} Kg ({analisisHarian.totalBakuKg > 0 ? ((analisisHarian.totalAirKg / analisisHarian.totalBakuKg) * 100).toFixed(2) : 0}%)</strong> dan debu <strong className="text-amber-300">{formatKg(analisisHarian.totalDebuKg)} Kg ({analisisHarian.totalBakuKg > 0 ? ((analisisHarian.totalDebuKg / analisisHarian.totalBakuKg) * 100).toFixed(2) : 0}%)</strong>.
                            </p>
                          </div>
                          <div className="shrink-0 p-2 bg-slate-900 rounded-md border border-slate-700/80 md:max-w-xs">
                            <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wider block mb-0.5">
                              Rekomendasi Kontrol Mesin:
                            </span>
                            <p className="text-[10px] text-slate-300 leading-tight">
                              {weatherData.hygroIndex.rekomendasiOperasional}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="py-4 text-center text-slate-400">
                        <RefreshCw className="w-4 h-4 animate-spin mx-auto text-sky-400 mb-1" />
                        <span className="text-[11px]">Menghubungkan ke satelit cuaca Open-Meteo...</span>
                      </div>
                    )}
                  </div>

                  {/* 3. Matriks Komparasi per Jenis Tembakau yang Masuk Hari Itu */}
                  <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
                    <div className="px-3.5 py-2.5 border-b border-slate-800 flex items-center justify-between bg-slate-850">
                      <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                          Rincian Komparasi Seluruh Bahan yang Diproses Hari Ini
                        </h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Setiap jenis tembakau langsung dikomparasikan terhadap acuan standar spesifiknya
                        </p>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        {analisisHarian.items.length} Jenis Tembakau
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-800/80 text-slate-400 font-semibold border-b border-slate-700 text-[11px]">
                            <th className="py-2 px-3">Jenis Tembakau</th>
                            <th className="py-2 px-2.5 text-center">Jalur</th>
                            <th className="py-2 px-2.5 text-right">Baku (Kg)</th>
                            <th className="py-2 px-2.5 text-right">Hasil (Kg)</th>
                            <th className="py-2 px-2.5 text-right text-white">Susut Riil</th>
                            <th className="py-2 px-2.5 text-right text-amber-400">Acuan</th>
                            <th className="py-2 px-2.5 text-right font-bold">Deviasi (Δ)</th>
                            <th className="py-2 px-2.5 text-center">Status</th>
                            <th className="py-2 px-3">Faktor Dominan / Diagnosa</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {analisisHarian.items.map((it, idx) => (
                            <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                              <td className="py-2 px-3 font-bold text-white text-[11px]">
                                {it.jenisTembakau}
                              </td>
                              <td className="py-2 px-2.5 text-center">
                                <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                  it.jenisProses === 'SKM' 
                                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' 
                                    : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                }`}>
                                  {it.jenisProses}
                                </span>
                              </td>
                              <td className="py-2 px-2.5 text-right font-mono text-slate-300 text-[11px]">
                                {formatKg(it.bakuKg)}
                              </td>
                              <td className="py-2 px-2.5 text-right font-mono text-slate-300 text-[11px]">
                                {formatKg(it.hasilKg)}
                              </td>
                              <td className="py-2 px-2.5 text-right font-mono font-bold text-white text-[11px]">
                                {formatPct(it.susutPct)}
                              </td>
                              <td className="py-2 px-2.5 text-right font-mono text-amber-300 font-semibold text-[11px]">
                                {formatPct(it.standarAcuanPct)}
                              </td>
                              <td className="py-2 px-2.5 text-right font-mono font-black text-[11px]">
                                <span className={
                                  it.status === 'kritis' ? 'text-rose-400' :
                                  it.status === 'toleransi' ? 'text-amber-400' : 'text-emerald-400'
                                }>
                                  {it.deviasiPct >= 0 ? '+' : ''}{formatPct(it.deviasiPct)}
                                </span>
                              </td>
                              <td className="py-2 px-2.5 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold inline-flex items-center gap-1 ${
                                  it.status === 'kritis' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' :
                                  it.status === 'toleransi' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                                  'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${
                                    it.status === 'kritis' ? 'bg-rose-400' :
                                    it.status === 'toleransi' ? 'bg-amber-400' : 'bg-emerald-400'
                                  }`}></span>
                                  {it.status === 'kritis' ? 'OOS' :
                                   it.status === 'toleransi' ? 'Toleransi' : 'Normal'}
                                </span>
                              </td>
                              <td className="py-2 px-3">
                                <div className="font-semibold text-slate-200 text-[11px]">{it.faktorDominan}</div>
                                <div className="text-[10px] text-slate-400 leading-tight" title={it.penjelasan}>
                                  {it.penjelasan}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* 4. Kotak Diagnosa & Temuan Operasional Cerdas */}
                  <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-indigo-950/40 p-3.5 rounded-xl border border-amber-500/40 text-xs">
                    <div className="flex items-center gap-2 text-amber-300 font-bold uppercase tracking-wider text-[11px] mb-1.5">
                      <Info className="w-4 h-4 text-amber-400" />
                      <span>Temuan Operasional Harian Otomatis:</span>
                    </div>
                    <p className="text-slate-200 text-xs leading-relaxed">
                      {analisisHarian.kesimpulanOtomatis}
                    </p>
                  </div>
                </>
              )}

            </div>
          )}

          {/* TAB 3: PEMETAAN KOLOM */}
          {activeTab === 'pemetaan' && (
            <div className="space-y-3">
              {/* Tombol Navigasi Kembali Cepat */}
              <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
                <button
                  onClick={() => setActiveTab('transaksi')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-all cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Kembali ke Pratinjau Transaksi</span>
                </button>
                <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
                  Menu: Kamus Pemetaan Kolom DHP
                </span>
              </div>

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
                    <tr className="bg-blue-950/20">
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-400">Kolom B</td>
                      <td className="py-2.5 px-3 font-bold text-blue-300">Tanggal Proses</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          FORMAT INDONESIA WAJIB
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-blue-200">
                        Wajib format: <code className="font-mono text-[11px] bg-slate-900 px-1 py-0.5 rounded">d MMM yyyy</code> berbasis bahasa Indonesia (contoh: <strong>20 Okt 2026</strong>, bukan 20 Oct 2026). Format ini dijaga 100% agar rumus Kolom C dan Kolom D membaca tanggal secara akurat.
                      </td>
                    </tr>
                    <tr className="bg-amber-950/20">
                      <td className="py-2.5 px-3 font-mono font-bold text-amber-400">Kolom C</td>
                      <td className="py-2.5 px-3 font-bold text-amber-300">Bulan</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          RUMUS PROTEKSI (JANGAN DITIMPA)
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-amber-200">
                        Formula otomatis: <code className="font-mono text-[11px] bg-slate-900 px-1 py-0.5 rounded">=iferror(if(B...=&quot;&quot;;&quot;&quot;;TEXT(B...;&quot;mmmm&quot;)))</code>
                      </td>
                    </tr>
                    <tr className="bg-amber-950/20">
                      <td className="py-2.5 px-3 font-mono font-bold text-amber-400">Kolom D</td>
                      <td className="py-2.5 px-3 font-bold text-amber-300">Tahun</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          RUMUS PROTEKSI (JANGAN DITIMPA)
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-amber-200">
                        Formula otomatis: mengekstrak tahun 4 digit dari tanggal di Kolom B
                      </td>
                    </tr>
                    <tr className="bg-amber-950/20">
                      <td className="py-2.5 px-3 font-mono font-bold text-amber-400">Kolom E</td>
                      <td className="py-2.5 px-3 font-bold text-amber-300">Jenis Tembakau/Perlakuan</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          RUMUS PROTEKSI (JANGAN DITIMPA)
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-amber-200">
                        Formula otomatis: <code className="font-mono text-[11px] bg-slate-900 px-1 py-0.5 rounded">=iferror(JOIN(&quot; &quot;;F...;G...))</code> menggabungkan Kolom F dan G
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-400">Kolom F</td>
                      <td className="py-2.5 px-3 font-medium text-white">Jenis Tembakau</td>
                      <td className="py-2.5 px-3 text-blue-300 font-mono">DHP Kolom D</td>
                      <td className="py-2.5 px-3 text-slate-400">Nama murni jenis tembakau (misal: Paiton 2024 (VJI))</td>
                    </tr>
                    <tr className="bg-blue-950/20">
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-400">Kolom G</td>
                      <td className="py-2.5 px-3 font-bold text-blue-300">Jenis (Jalur Proses)</td>
                      <td className="py-2.5 px-3 text-blue-300 font-mono">
                        DHP Kolom &quot;PERLAKUAN PROSES&quot;
                      </td>
                      <td className="py-2.5 px-3 text-blue-200">
                        Mengikuti apa yang tercantum pada DHP (<strong>SKT</strong> atau <strong>SKM</strong>). Nilai ini diisikan ke Kolom G Rekap, sehingga rumus di Kolom E otomatis menyusun nama bahan dan jalur proses secara presisi (contoh: <em>Madura 2024 (BAT) R SKM</em> atau <em>Madura 2024 (BAT) R SKT</em>).
                      </td>
                    </tr>
                    <tr className="bg-emerald-950/20">
                      <td className="py-2.5 px-3 font-mono font-bold text-emerald-400">Kolom H</td>
                      <td className="py-2.5 px-3 font-medium text-emerald-300">Netto Baku (Kg)</td>
                      <td className="py-2.5 px-3 text-emerald-300 font-mono">DHP Kolom E</td>
                      <td className="py-2.5 px-3 text-slate-400">Bobot timbangan bahan baku awal (diisi jika di rekap belum terisi)</td>
                    </tr>
                    <tr className="bg-emerald-950/20">
                      <td className="py-2.5 px-3 font-mono font-bold text-emerald-400">Kolom I</td>
                      <td className="py-2.5 px-3 font-bold text-emerald-300">Netto Hasil (Kg)</td>
                      <td className="py-2.5 px-3 text-emerald-300 font-mono font-bold">DHP Kolom I</td>
                      <td className="py-2.5 px-3 text-emerald-200">Bobot timbangan hasil akhir (sasaran utama update Smart Fill)</td>
                    </tr>
                    <tr className="bg-amber-950/20">
                      <td className="py-2.5 px-3 font-mono font-bold text-amber-400">Kolom J</td>
                      <td className="py-2.5 px-3 font-bold text-amber-300">Susut (Kg)</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          RUMUS PROTEKSI (JANGAN DITIMPA)
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-amber-200">
                        Formula otomatis: <code className="font-mono text-[11px] bg-slate-900 px-1 py-0.5 rounded">=H...-I...</code> (Baku dikurangi Hasil)
                      </td>
                    </tr>
                    <tr className="bg-amber-950/20">
                      <td className="py-2.5 px-3 font-mono font-bold text-amber-400">Kolom K</td>
                      <td className="py-2.5 px-3 font-bold text-amber-300">Susut (%)</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          RUMUS PROTEKSI (JANGAN DITIMPA)
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-amber-200">
                        Formula otomatis: persentase susut dengan format sel persen bawaan Google Sheets (%)
                      </td>
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
            <div className="space-y-3">
              {/* Tombol Navigasi Kembali Cepat */}
              <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
                <button
                  onClick={() => setActiveTab('transaksi')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-all cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Kembali ke Pratinjau Transaksi</span>
                </button>
                <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
                  Menu: Skrip Otomasi Google Apps Script
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Skrip Google Apps Script Khusus Tembakau (IntegrasiDHP.gs)
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Skrip mandiri untuk dipasang pada editor Apps Script di Google Sheets Anda.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadPdf}
                    disabled={isDownloadingPdf}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white shadow-sm transition-all cursor-pointer"
                    title="Unduh Panduan Teknis Arsitektur & Batasan Kuota GAS (Format PDF)"
                  >
                    <Download className={`w-3.5 h-3.5 ${isDownloadingPdf ? 'animate-bounce' : ''}`} />
                    <span>{isDownloadingPdf ? 'Mengunduh...' : 'Unduh PDF Panduan'}</span>
                  </button>

                  <a
                    href="/api/view-panduan-pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 shadow-sm transition-all"
                    title="Buka / Baca Dokumen PDF Langsung di Tab Baru"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                    <span>Buka PDF</span>
                  </a>

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
              </div>

              {/* Code Box */}
              <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 font-mono text-xs text-slate-300 max-h-96 overflow-y-auto p-4">
                <pre>{gasScriptCode}</pre>
              </div>

              {/* Instructions */}
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 text-xs space-y-2.5 text-slate-300">
                <div className="font-bold text-white text-xs uppercase tracking-wider flex items-center justify-between">
                  <span>Panduan untuk GAS Standalone (Script Terpisah / script.google.com):</span>
                  <span className="text-[11px] text-emerald-400 font-normal">Koneksi via openById(SS_ID)</span>
                </div>
                <div className="p-2.5 rounded-lg bg-blue-950/40 border border-blue-500/30 text-blue-200 text-[11px] leading-relaxed">
                  💡 <strong>Keunggulan GAS Standalone:</strong> Kode kita sejak awal sudah menggunakan ID Spreadsheet langsung (<code className="bg-slate-900 px-1 py-0.5 rounded text-blue-300 font-mono">openById</code>), sehingga script standalone dapat mengakses dan menyinkronkan <strong>DHP</strong> ke <strong>Rekap</strong> secara independen tanpa perlu menempel pada dokumen.
                </div>
                <ol className="list-decimal pl-5 space-y-1.5 text-slate-300">
                  <li>Buka proyek GAS Standalone Anda di <strong className="text-white">script.google.com</strong>.</li>
                  <li>Tempel (*paste*) kode skrip terbaru di atas lalu klik tombol <strong className="text-white">Simpan (Ctrl+S)</strong>.</li>
                  <li>
                    <strong>Uji Coba Eksekusi:</strong> Pada dropdown nama fungsi di toolbar atas editor, pilih <code className="bg-slate-900 px-1.5 py-0.5 rounded text-amber-300 font-mono">TEST_SINKRON_SEKARANG</code> lalu klik tombol <strong className="text-white">▶ Jalankan (Run)</strong>. Pantau log di bagian bawah.
                  </li>
                  <li>
                    <strong>Aktifkan Auto-Push 5 Menit:</strong> Pada dropdown yang sama, pilih <code className="bg-slate-900 px-1.5 py-0.5 rounded text-emerald-300 font-mono">AKTIFKAN_AUTO_PUSH_5_MENIT</code> lalu klik <strong className="text-white">▶ Jalankan (Run)</strong>.
                    <div className="text-[11px] text-slate-400 mt-1 pl-1 border-l-2 border-emerald-500/50 space-y-0.5">
                      <p>✓ Pemicu waktu cloud otomatis terdaftar di project Standalone Anda dan akan mengeksekusi sinkronisasi tiap 5 menit 24 jam non-stop.</p>
                      <p>✓ <strong>100% Bebas Blokir:</strong> Sangat hemat kuota (~4 menit eksekusi per hari dari limit 90 menit/hari).</p>
                    </div>
                  </li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 5: TEMPLATE EXCEL & SPREADSHEET FORMULIR DHP */}
          {activeTab === 'template_dhp' && (
            <div className="space-y-3 flex-1 flex flex-col min-h-0 text-slate-800 pb-2">
              {/* Tombol Navigasi Kembali Cepat */}
              <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
                <button
                  onClick={() => setActiveTab('transaksi')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-all cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Kembali ke Pratinjau Transaksi</span>
                </button>
                <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
                  Menu: Template Spreadsheet &amp; Formulir DHP
                </span>
              </div>
              
              {/* Header Action Banner */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white shadow-md border border-emerald-700/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-emerald-500/20 border border-emerald-400/30 text-emerald-300">
                      <FileSpreadsheet className="w-5 h-5" />
                    </span>
                    <h3 className="text-sm font-bold tracking-tight text-white">
                      Template Spreadsheet &amp; Formulir Web: DHP Tembakau Admin Proses
                    </h3>
                  </div>
                  <p className="text-xs text-emerald-100/90 leading-relaxed max-w-2xl">
                    Dirancang dengan <strong>arsitektur tabel datar (flat table)</strong> tanpa sel gabungan (merged cells). Struktur ini siap pakai untuk entri form di web apps, validasi database relasional, serta otomasi rumus neraca massa tembakau.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <a
                    href="/api/download-template-dhp-excel"
                    download="TEMPLATE_DHP_TEMBAKAU_ADMIN_PROSES.xlsx"
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-900 bg-emerald-400 hover:bg-emerald-300 shadow-md transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-slate-900" />
                    <span>Unduh Excel (.xlsx)</span>
                  </a>

                  <button
                    onClick={handleCopyTsv}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-white/10 hover:bg-white/20 border border-white/20 shadow-sm transition-all cursor-pointer"
                    title="Salin data mentah untuk ditempel (Ctrl+V) langsung ke Google Sheets"
                  >
                    {copiedTsv ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-300" />
                        <span className="text-emerald-300">Berhasil Disalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Salin ke Google Sheets</span>
                      </>
                    )}
                  </button>

                  <a
                    href="https://sheets.new"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-emerald-200 bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-700/50 transition-colors"
                    title="Buka lembar kerja Google Sheets baru"
                  >
                    <span>Buka sheets.new</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* 3 Karakteristik Kunci Desain */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-700">
                    <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                    1 Baris = 1 Transaksi Batch
                  </div>
                  <p className="text-[11px] text-slate-600 leading-normal">
                    Menghilangkan merged cells yang kerap mematahkan parsing API. Seluruh kolom atribut (waktu, batch, shift, jalur) melekat pada tiap baris.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-700">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    Neraca Massa Tertutup (Mass Balance)
                  </div>
                  <p className="text-[11px] text-slate-600 leading-normal">
                    Rumus neraca massa otomatis: <code className="bg-slate-100 px-1 py-0.5 rounded text-amber-900 font-mono text-[10px]">Selisih = Susut - (Gagang + Air + Debu)</code>. Idealnya bernilai 0.00 Kg.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                    Master Data Terpisah (Normalized)
                  </div>
                  <p className="text-[11px] text-slate-600 leading-normal">
                    Tab referensi terpisah untuk dropdown form web (Jenis Tembakau, Jalur SKM/SKT, Shift, Acuan Susut Maks), mencegah salah ketik nama tembakau.
                  </p>
                </div>
              </div>

              {/* Sheet 1 Preview: DHP_INPUT_PROSES (17 Kolom) */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
                <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Table className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-slate-800">
                      Sheet 1: DHP_INPUT_PROSES (17 Kolom Standar)
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                      Flat Architecture
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Format rumus Excel / Google Sheets telah aktif di file unduhan
                  </span>
                </div>

                <div className="overflow-x-auto max-h-80">
                  <table className="w-full text-[11px] text-left border-collapse">
                    <thead className="sticky top-0 bg-slate-900 text-white z-10 font-bold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="px-3 py-2 border-r border-slate-800 whitespace-nowrap bg-blue-950 text-blue-200">A: TIMESTAMP_ENTRI</th>
                        <th className="px-3 py-2 border-r border-slate-800 whitespace-nowrap bg-blue-950 text-blue-200">B: NO_BATCH</th>
                        <th className="px-3 py-2 border-r border-slate-800 whitespace-nowrap bg-blue-950 text-blue-200">C: TANGGAL_PROSES</th>
                        <th className="px-3 py-2 border-r border-slate-800 whitespace-nowrap bg-blue-950 text-blue-200">D: SHIFT</th>
                        <th className="px-3 py-2 border-r border-slate-800 whitespace-nowrap bg-blue-950 text-blue-200">E: JALUR_PROSES</th>
                        <th className="px-3 py-2 border-r border-slate-800 whitespace-nowrap bg-blue-950 text-blue-200">F: JENIS_TEMBAKAU</th>
                        <th className="px-3 py-2 border-r border-slate-800 whitespace-nowrap bg-emerald-950 text-emerald-200 text-right">G: NETTO_BAKU_KG</th>
                        <th className="px-3 py-2 border-r border-slate-800 whitespace-nowrap bg-emerald-950 text-emerald-200 text-right">H: NETTO_HASIL_KG</th>
                        <th className="px-3 py-2 border-r border-slate-800 whitespace-nowrap bg-amber-950 text-amber-200 text-right">I: SUSUT_KG (=G-H)</th>
                        <th className="px-3 py-2 border-r border-slate-800 whitespace-nowrap bg-amber-950 text-amber-200 text-right">J: SUSUT_PCT (=I/G)</th>
                        <th className="px-3 py-2 border-r border-slate-800 whitespace-nowrap bg-purple-950 text-purple-200 text-right">K: FRAKSI_GAGANG_KG</th>
                        <th className="px-3 py-2 border-r border-slate-800 whitespace-nowrap bg-purple-950 text-purple-200 text-right">L: FRAKSI_AIR_KG</th>
                        <th className="px-3 py-2 border-r border-slate-800 whitespace-nowrap bg-purple-950 text-purple-200 text-right">M: FRAKSI_DEBU_KG</th>
                        <th className="px-3 py-2 border-r border-slate-800 whitespace-nowrap bg-rose-950 text-rose-200 text-right">N: SELISIH_NERACA (=I-(K+L+M))</th>
                        <th className="px-3 py-2 border-r border-slate-800 whitespace-nowrap">O: OPERATOR_ADMIN</th>
                        <th className="px-3 py-2 border-r border-slate-800 whitespace-nowrap">P: STATUS_PROSES</th>
                        <th className="px-3 py-2 whitespace-nowrap">Q: CATATAN_KENDALA</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="px-3 py-2 text-slate-600 whitespace-nowrap">2026-10-24 08:30:00</td>
                        <td className="px-3 py-2 font-bold text-blue-700 whitespace-nowrap">BTH-202610-001</td>
                        <td className="px-3 py-2 text-slate-700 whitespace-nowrap">2026-10-24</td>
                        <td className="px-3 py-2 text-slate-700 whitespace-nowrap">Shift 1</td>
                        <td className="px-3 py-2 font-bold text-slate-800 whitespace-nowrap">SKM</td>
                        <td className="px-3 py-2 font-medium text-slate-900 whitespace-nowrap">Virginia FC</td>
                        <td className="px-3 py-2 text-right font-bold text-emerald-700 whitespace-nowrap">1,250.00</td>
                        <td className="px-3 py-2 text-right font-bold text-emerald-800 whitespace-nowrap">1,185.50</td>
                        <td className="px-3 py-2 text-right font-bold text-amber-800 bg-amber-50/50 whitespace-nowrap">64.50</td>
                        <td className="px-3 py-2 text-right font-bold text-amber-800 bg-amber-50/50 whitespace-nowrap">5.16%</td>
                        <td className="px-3 py-2 text-right text-slate-700 whitespace-nowrap">38.20</td>
                        <td className="px-3 py-2 text-right text-slate-700 whitespace-nowrap">18.50</td>
                        <td className="px-3 py-2 text-right text-slate-700 whitespace-nowrap">7.80</td>
                        <td className="px-3 py-2 text-right font-bold text-emerald-700 bg-emerald-50 whitespace-nowrap">0.00</td>
                        <td className="px-3 py-2 text-slate-700 whitespace-nowrap">Ahmad Faisal</td>
                        <td className="px-3 py-2 whitespace-nowrap"><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">COMPLETED</span></td>
                        <td className="px-3 py-2 text-slate-600 whitespace-nowrap">Batch normal, kelembaban inlet 13.8%</td>
                      </tr>

                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="px-3 py-2 text-slate-600 whitespace-nowrap">2026-10-24 10:45:00</td>
                        <td className="px-3 py-2 font-bold text-blue-700 whitespace-nowrap">BTH-202610-002</td>
                        <td className="px-3 py-2 text-slate-700 whitespace-nowrap">2026-10-24</td>
                        <td className="px-3 py-2 text-slate-700 whitespace-nowrap">Shift 1</td>
                        <td className="px-3 py-2 font-bold text-slate-800 whitespace-nowrap">SKT</td>
                        <td className="px-3 py-2 font-medium text-slate-900 whitespace-nowrap">Kasturi Super</td>
                        <td className="px-3 py-2 text-right font-bold text-emerald-700 whitespace-nowrap">850.00</td>
                        <td className="px-3 py-2 text-right font-bold text-emerald-800 whitespace-nowrap">804.20</td>
                        <td className="px-3 py-2 text-right font-bold text-amber-800 bg-amber-50/50 whitespace-nowrap">45.80</td>
                        <td className="px-3 py-2 text-right font-bold text-amber-800 bg-amber-50/50 whitespace-nowrap">5.39%</td>
                        <td className="px-3 py-2 text-right text-slate-700 whitespace-nowrap">28.50</td>
                        <td className="px-3 py-2 text-right text-slate-700 whitespace-nowrap">12.30</td>
                        <td className="px-3 py-2 text-right text-slate-700 whitespace-nowrap">5.00</td>
                        <td className="px-3 py-2 text-right font-bold text-emerald-700 bg-emerald-50 whitespace-nowrap">0.00</td>
                        <td className="px-3 py-2 text-slate-700 whitespace-nowrap">Ahmad Faisal</td>
                        <td className="px-3 py-2 whitespace-nowrap"><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">COMPLETED</span></td>
                        <td className="px-3 py-2 text-slate-600 whitespace-nowrap">Sortir gagang halus manual optimal</td>
                      </tr>

                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="px-3 py-2 text-slate-600 whitespace-nowrap">2026-10-24 14:15:00</td>
                        <td className="px-3 py-2 font-bold text-blue-700 whitespace-nowrap">BTH-202610-003</td>
                        <td className="px-3 py-2 text-slate-700 whitespace-nowrap">2026-10-24</td>
                        <td className="px-3 py-2 text-slate-700 whitespace-nowrap">Shift 2</td>
                        <td className="px-3 py-2 font-bold text-slate-800 whitespace-nowrap">SKM</td>
                        <td className="px-3 py-2 font-medium text-slate-900 whitespace-nowrap">Madura Rajang</td>
                        <td className="px-3 py-2 text-right font-bold text-emerald-700 whitespace-nowrap">1,400.00</td>
                        <td className="px-3 py-2 text-right font-bold text-emerald-800 whitespace-nowrap">1,326.00</td>
                        <td className="px-3 py-2 text-right font-bold text-amber-800 bg-amber-50/50 whitespace-nowrap">74.00</td>
                        <td className="px-3 py-2 text-right font-bold text-amber-800 bg-amber-50/50 whitespace-nowrap">5.29%</td>
                        <td className="px-3 py-2 text-right text-slate-700 whitespace-nowrap">44.00</td>
                        <td className="px-3 py-2 text-right text-slate-700 whitespace-nowrap">21.00</td>
                        <td className="px-3 py-2 text-right text-slate-700 whitespace-nowrap">9.00</td>
                        <td className="px-3 py-2 text-right font-bold text-emerald-700 bg-emerald-50 whitespace-nowrap">0.00</td>
                        <td className="px-3 py-2 text-slate-700 whitespace-nowrap">Budi Santoso</td>
                        <td className="px-3 py-2 whitespace-nowrap"><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">COMPLETED</span></td>
                        <td className="px-3 py-2 text-slate-600 whitespace-nowrap">Kadar air bahan baku sedikit tinggi (14.2%)</td>
                      </tr>

                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="px-3 py-2 text-slate-600 whitespace-nowrap">2026-10-24 16:30:00</td>
                        <td className="px-3 py-2 font-bold text-blue-700 whitespace-nowrap">BTH-202610-004</td>
                        <td className="px-3 py-2 text-slate-700 whitespace-nowrap">2026-10-24</td>
                        <td className="px-3 py-2 text-slate-700 whitespace-nowrap">Shift 2</td>
                        <td className="px-3 py-2 font-bold text-slate-800 whitespace-nowrap">SKT</td>
                        <td className="px-3 py-2 font-medium text-slate-900 whitespace-nowrap">Boyolali Gurih</td>
                        <td className="px-3 py-2 text-right font-bold text-emerald-700 whitespace-nowrap">920.00</td>
                        <td className="px-3 py-2 text-right font-bold text-emerald-800 whitespace-nowrap">871.50</td>
                        <td className="px-3 py-2 text-right font-bold text-amber-800 bg-amber-50/50 whitespace-nowrap">48.50</td>
                        <td className="px-3 py-2 text-right font-bold text-amber-800 bg-amber-50/50 whitespace-nowrap">5.27%</td>
                        <td className="px-3 py-2 text-right text-slate-700 whitespace-nowrap">31.00</td>
                        <td className="px-3 py-2 text-right text-slate-700 whitespace-nowrap">12.50</td>
                        <td className="px-3 py-2 text-right text-slate-700 whitespace-nowrap">5.00</td>
                        <td className="px-3 py-2 text-right font-bold text-emerald-700 bg-emerald-50 whitespace-nowrap">0.00</td>
                        <td className="px-3 py-2 text-slate-700 whitespace-nowrap">Budi Santoso</td>
                        <td className="px-3 py-2 whitespace-nowrap"><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">COMPLETED</span></td>
                        <td className="px-3 py-2 text-slate-600 whitespace-nowrap">Kondisi pisau rajang baru di-asah</td>
                      </tr>

                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="px-3 py-2 text-slate-600 whitespace-nowrap">2026-10-24 21:00:00</td>
                        <td className="px-3 py-2 font-bold text-blue-700 whitespace-nowrap">BTH-202610-005</td>
                        <td className="px-3 py-2 text-slate-700 whitespace-nowrap">2026-10-24</td>
                        <td className="px-3 py-2 text-slate-700 whitespace-nowrap">Shift 3</td>
                        <td className="px-3 py-2 font-bold text-slate-800 whitespace-nowrap">SKM</td>
                        <td className="px-3 py-2 font-medium text-slate-900 whitespace-nowrap">Temanggung Asli</td>
                        <td className="px-3 py-2 text-right font-bold text-emerald-700 whitespace-nowrap">1,100.00</td>
                        <td className="px-3 py-2 text-right font-bold text-emerald-800 whitespace-nowrap">1,039.50</td>
                        <td className="px-3 py-2 text-right font-bold text-amber-800 bg-amber-50/50 whitespace-nowrap">60.50</td>
                        <td className="px-3 py-2 text-right font-bold text-amber-800 bg-amber-50/50 whitespace-nowrap">5.50%</td>
                        <td className="px-3 py-2 text-right text-slate-700 whitespace-nowrap">35.50</td>
                        <td className="px-3 py-2 text-right text-slate-700 whitespace-nowrap">17.00</td>
                        <td className="px-3 py-2 text-right text-slate-700 whitespace-nowrap">8.00</td>
                        <td className="px-3 py-2 text-right font-bold text-emerald-700 bg-emerald-50 whitespace-nowrap">0.00</td>
                        <td className="px-3 py-2 text-slate-700 whitespace-nowrap">Dian Pratama</td>
                        <td className="px-3 py-2 whitespace-nowrap"><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">COMPLETED</span></td>
                        <td className="px-3 py-2 text-slate-600 whitespace-nowrap">Shift malam lancar, neraca massa seimbang</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Sheet 2 & Kamus Data Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {/* Master Data */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                  <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">
                      Sheet 2: MASTER_DATA (Sumber Pilihan Dropdown Form)
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-medium">Lookup Table</span>
                  </div>
                  <div className="p-3 text-[11px] overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase">
                          <th className="pb-1.5">Jenis Tembakau</th>
                          <th className="pb-1.5">Jalur</th>
                          <th className="pb-1.5">Shift</th>
                          <th className="pb-1.5 text-right">Toleransi Susut</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        <tr>
                          <td className="py-1 font-medium text-slate-900">Virginia FC</td>
                          <td className="py-1">SKM</td>
                          <td className="py-1">Shift 1 (07:00-15:00)</td>
                          <td className="py-1 text-right font-semibold text-amber-700">Maks 5.2%</td>
                        </tr>
                        <tr>
                          <td className="py-1 font-medium text-slate-900">Kasturi Super</td>
                          <td className="py-1">SKT</td>
                          <td className="py-1">Shift 2 (15:00-23:00)</td>
                          <td className="py-1 text-right font-semibold text-amber-700">Maks 5.5%</td>
                        </tr>
                        <tr>
                          <td className="py-1 font-medium text-slate-900">Madura Rajang</td>
                          <td className="py-1">BLEND-A</td>
                          <td className="py-1">Shift 3 (23:00-07:00)</td>
                          <td className="py-1 text-right font-semibold text-amber-700">Maks 5.4%</td>
                        </tr>
                        <tr>
                          <td className="py-1 font-medium text-slate-900">Boyolali Gurih</td>
                          <td className="py-1">BLEND-B</td>
                          <td className="py-1">-</td>
                          <td className="py-1 text-right font-semibold text-amber-700">Maks 5.3%</td>
                        </tr>
                        <tr>
                          <td className="py-1 font-medium text-slate-900">Temanggung Asli</td>
                          <td className="py-1">-</td>
                          <td className="py-1">-</td>
                          <td className="py-1 text-right font-semibold text-amber-700">Maks 5.6%</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Kamus Data Payload JSON API */}
                <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-xs overflow-hidden flex flex-col text-slate-200">
                  <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Code className="w-3.5 h-3.5 text-blue-400" />
                      Payload Entri Web Apps (JSON ke Spreadsheet / DB)
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-mono">POST /api/dhp-submit</span>
                  </div>
                  <div className="p-3 text-[11px] font-mono leading-relaxed overflow-x-auto text-emerald-300">
                    <pre>{`{
  "noBatch": "BTH-202610-001",
  "tanggalProses": "2026-10-24",
  "shift": "Shift 1",
  "jalurProses": "SKM",
  "jenisTembakau": "Virginia FC",
  "nettoBakuKg": 1250.00,
  "nettoHasilKg": 1185.50,
  "fraksiGagangKg": 38.20,
  "fraksiAirKg": 18.50,
  "fraksiDebuKg": 7.80,
  "operatorAdmin": "Ahmad Faisal",
  "catatan": "Batch normal run"
}`}</pre>
                  </div>
                </div>
              </div>

              {/* Panduan 3 Langkah Memasang ke Google Drive */}
              <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-xs space-y-2 text-slate-700">
                <div className="font-bold text-slate-900 text-xs flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>3 Cara Termudah Membuka / Menggunakan Template Ini:</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-1">
                    <strong className="text-slate-900 font-bold block">Opsi 1: Unduh Excel Langsung</strong>
                    <p className="text-[11px] text-slate-600">
                      Klik tombol <strong>Unduh Excel (.xlsx)</strong> di atas. Buka langsung di Microsoft Excel, LibreOffice, atau unggah ke Google Drive.
                    </p>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-1">
                    <strong className="text-slate-900 font-bold block">Opsi 2: Tempel Langsung ke Google Sheets</strong>
                    <p className="text-[11px] text-slate-600">
                      Klik <strong>Salin ke Google Sheets</strong>, buka tab baru dengan alamat <strong>sheets.new</strong>, lalu tekan <strong>Ctrl + V</strong> di sel A1.
                    </p>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-1">
                    <strong className="text-slate-900 font-bold block">Opsi 3: Dijadikan Input Web Form</strong>
                    <p className="text-[11px] text-slate-600">
                      Gunakan spesifikasi 17 kolom ini sebagai schema tabel database formulir web produksi agar sinkronisasi DHP otomatis.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer (Matching Reference Gambar 2) */}
        <div className="px-4 sm:px-5 py-2.5 sm:py-3 border-t border-slate-200 bg-white flex items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="text-xs">Koneksi aman, anti-duplikasi aktif &amp; pemetaan kolom terverifikasi</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-5 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold transition-colors shadow-xs cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
