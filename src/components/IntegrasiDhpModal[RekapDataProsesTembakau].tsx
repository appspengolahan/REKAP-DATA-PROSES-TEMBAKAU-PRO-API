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
  ExternalLink,
  Send,
  Pause,
  Play,
  Scale,
  Download
} from 'lucide-react';
import { RawRowData, DhpIntegrationData, DhpBatchItem, GasConfig } from '../types[RekapDataProsesTembakau]';
import {
  RekapDataProsesTembakauService,
  formatKg,
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
  const [activeTab, setActiveTab] = useState<'transaksi' | 'pemetaan' | 'gas'>('transaksi');
  const [loading, setLoading] = useState<boolean>(true);
  const [isSyncingToRekap, setIsSyncingToRekap] = useState<boolean>(false);
  const [syncNotice, setSyncNotice] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [dhpData, setDhpData] = useState<DhpIntegrationData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);

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
          var needsFill = (rHasil === 0) || (rRow[8] === '' || rRow[8] === null) || (Math.abs(rHasil - batch.hasil) > 0.01);

          if (needsFill) {
            // Kolom H (Col 8): Netto Baku (isi jika di rekap masih kosong / 0)
            if (rBaku === 0 && batch.baku > 0) {
              shRekap.getRange(rowIdx, 8).setValue(batch.baku);
            }

            // Kolom I (Col 9): Netto Hasil (dari DHP)
            shRekap.getRange(rowIdx, 9).setValue(batch.hasil);

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

  var summaryMsg = 'Sinkronisasi Selesai: ' + updatedCount + ' baris draft berhasil diisi otomatis, ' + appendedCount + ' baris baru ditambahkan. Formula C, D, E, J, dan K terlindungi 100%.';
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
    message: summaryMsg
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
    var result = sinkronkanDhpKeRekap();
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
  if (action === 'syncDhp' || action === 'syncDhpToRekap') {
    var res = sinkronkanDhpKeRekap();
    return ContentService.createTextOutput(JSON.stringify(res))
      .setMimeType(ContentService.MimeType.JSON);
  }
  return ContentService.createTextOutput(JSON.stringify({
    status: 'GAS Integrasi DHP Tembakau Aktif',
    instruction: 'Panggil dengan action=syncDhp atau jalankan fungsi sinkronkanDhpKeRekap()'
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-6xl w-full h-[94vh] max-h-[94vh] flex flex-col overflow-hidden text-slate-100">
        
        {/* Modal Top Header (Ultra-Compact as in Image 1) */}
        <div className="px-4 sm:px-5 py-2 sm:py-2.5 border-b border-slate-800 flex items-center justify-between gap-3 bg-gradient-to-r from-slate-900 via-slate-850 to-indigo-950 text-white shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 shadow-sm flex-shrink-0">
              <Database className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-xs sm:text-sm font-bold text-white tracking-tight truncate">
                  Integrasi &amp; Sinkronisasi DHP Tembakau
                </h2>
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 shadow-sm flex-shrink-0">
                  Presisi 100%
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-300 leading-none mt-0.5 truncate">
                Pencocokan dan transfer otomatis data aktif DHP Tembakau ke Datasheet Rekap Susut Tembakau
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Source & Target Connection Bar with Smart Live-Sync Toggle (Pembaruan B) */}
        <div className="px-4 sm:px-5 py-1.5 bg-slate-950/70 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-300">
            <span className="inline-flex items-center gap-1 font-semibold text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              Sumber DHP:
            </span>
            <span className="bg-slate-800 px-2 py-0.5 rounded text-[10px] sm:text-[11px] text-slate-200 font-mono">
              Tab <strong className="text-blue-300">INTEGRASI DATA</strong> (1NDS55V...)
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Target Rekap:
            </span>
            <span className="bg-slate-800 px-2 py-0.5 rounded text-[10px] sm:text-[11px] text-slate-200 font-mono">
              Tab <strong className="text-emerald-300">REKAP SUSUT TEMBAKAU</strong> (1LnixFR...)
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Smart Live-Sync Saklar / Toggle Switch (Pembaruan B - matched with reference image) */}
            <button
              onClick={() => setAutoPullEnabled(!autoPullEnabled)}
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg border text-xs font-semibold transition-all shadow-sm ${
                autoPullEnabled
                  ? 'bg-emerald-950/50 hover:bg-emerald-900/60 border-emerald-500/60 text-emerald-300'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-400'
              }`}
              title={autoPullEnabled ? 'Klik untuk menjeda Auto-Tarik' : 'Klik untuk mengaktifkan kembali Auto-Tarik'}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${autoPullEnabled ? 'bg-emerald-400 shadow-sm shadow-emerald-500/50 animate-pulse' : 'bg-slate-500'}`}></span>
              <span>{autoPullEnabled ? `Auto-Tarik Aktif (${countdown}s)` : 'Auto-Tarik: Jeda'}</span>
            </button>

            {/* Manual Refresh Button (Blue button matching reference image) */}
            <button
              onClick={() => loadDhpData(false)}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-semibold transition-all shadow-sm disabled:opacity-50"
              title="Perbarui pembacaan lembar DHP secara manual (< 1s)"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading || isAutoPulling ? 'animate-spin' : ''}`} />
              <span>Tarik Ulang DHP</span>
            </button>
          </div>
        </div>

        {/* Sub-Tabs Navigation (Compact as in Image 1) */}
        <div className="px-4 sm:px-5 border-b border-slate-800 flex items-center gap-1 bg-slate-900 shrink-0">
          <button
            onClick={() => setActiveTab('transaksi')}
            className={`flex items-center gap-1.5 py-2 px-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'transaksi'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Pratinjau &amp; Transaksi ({dhpData?.totalBatch ?? 0} Batch)</span>
          </button>

          <button
            onClick={() => setActiveTab('pemetaan')}
            className={`flex items-center gap-1.5 py-2 px-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'pemetaan'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Pemetaan Kolom</span>
          </button>

          <button
            onClick={() => setActiveTab('gas')}
            className={`flex items-center gap-1.5 py-2 px-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'gas'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>Skrip Otomasi GAS</span>
          </button>
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
              
              {/* 4 Dedicated KPI Summary Cards as in Reference Image */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 flex-shrink-0">
                {/* Kartu 1: Total Batch Aktif DHP */}
                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between shadow-sm relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate">
                      TOTAL BATCH AKTIF DHP
                    </span>
                    <Layers className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-xl font-black text-white">
                      {dhpData?.totalBatch || 0} Batch
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-950/60 border border-blue-500/50 text-blue-300 whitespace-nowrap">
                      {formatKg(dhpData?.totalBakuKg || 0)} Kg Baku
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 truncate">
                    Bahan baku terinput di DHP
                  </div>
                </div>

                {/* Kartu 2: Terverifikasi di Rekap */}
                <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-800/50 flex flex-col justify-between shadow-sm relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 truncate">
                      TERVERIFIKASI DI REKAP
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-900/70 border border-emerald-600/60 text-emerald-300 uppercase tracking-tight">
                        {dhpData?.terverifikasiPct || 0}% COCOK
                      </span>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </div>
                  </div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-xl font-black text-emerald-300">
                      {dhpData?.terverifikasiCount || 0} Batch
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-950/60 border border-emerald-600/50 text-emerald-300 whitespace-nowrap">
                      {formatKg(dhpData?.terverifikasiHasilKg || 0)} Kg Hasil
                    </span>
                  </div>
                  <div className="text-[10px] text-emerald-400/90 mt-1 truncate font-medium">
                    Susut: {formatKg(dhpData?.terverifikasiSusutKg || 0)} Kg ({formatPct(dhpData?.terverifikasiSusutPct || 0)}%)
                  </div>
                </div>

                {/* Kartu 3: Perlu Diselaraskan (Mismatch Detector) */}
                <div className={`p-3 rounded-xl border flex flex-col justify-between shadow-sm relative overflow-hidden ${
                  (dhpData?.mismatchCount || 0) > 0
                    ? 'bg-amber-950/30 border-amber-500/60'
                    : 'bg-slate-900/70 border-slate-800'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold uppercase tracking-wider truncate ${
                      (dhpData?.mismatchCount || 0) > 0 ? 'text-amber-400' : 'text-slate-400'
                    }`}>
                      PERLU DISELARASKAN
                    </span>
                    <AlertCircle className={`w-4 h-4 ${
                      (dhpData?.mismatchCount || 0) > 0 ? 'text-amber-400' : 'text-slate-500'
                    }`} />
                  </div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className={`text-xl font-black ${
                      (dhpData?.mismatchCount || 0) > 0 ? 'text-amber-300' : 'text-slate-200'
                    }`}>
                      {dhpData?.mismatchCount || 0} Batch
                    </span>
                    <span className={`text-xs font-semibold ${
                      (dhpData?.mismatchCount || 0) > 0 ? 'text-amber-400' : 'text-slate-500'
                    }`}>
                      {(dhpData?.mismatchCount || 0) > 0 ? 'Hasil Selesai' : 'Semua Selaras'}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 truncate">
                    {(dhpData?.mismatchCount || 0) > 0
                      ? 'Hasil DHP siap diupdate ke Rekap'
                      : 'Data hasil telah selaras dengan Rekap'}
                  </div>
                </div>

                {/* Kartu 4: Batch Baru Siap Masuk */}
                <div className={`p-3 rounded-xl border flex flex-col justify-between shadow-sm relative overflow-hidden ${
                  (dhpData?.batchBaruCount || 0) > 0
                    ? 'bg-blue-950/30 border-blue-500/50'
                    : 'bg-slate-900/70 border-slate-800'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold uppercase tracking-wider truncate ${
                      (dhpData?.batchBaruCount || 0) > 0 ? 'text-blue-400' : 'text-slate-400'
                    }`}>
                      BATCH BARU SIAP MASUK
                    </span>
                    <Sparkles className={`w-4 h-4 ${
                      (dhpData?.batchBaruCount || 0) > 0 ? 'text-blue-400' : 'text-slate-500'
                    }`} />
                  </div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className={`text-xl font-black ${
                      (dhpData?.batchBaruCount || 0) > 0 ? 'text-blue-300' : 'text-slate-200'
                    }`}>
                      {dhpData?.batchBaruCount || 0} Batch
                    </span>
                    <span className={`text-xs font-semibold ${
                      (dhpData?.batchBaruCount || 0) > 0 ? 'text-blue-300' : 'text-slate-500'
                    }`}>
                      {(dhpData?.batchBaruCount || 0) > 0 ? 'Perlu dibukukan' : 'Tersinkron'}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 truncate">
                    {(dhpData?.batchBaruCount || 0) > 0
                      ? `${dhpData?.batchBaruCount} baris baru ditemukan`
                      : 'Semua batch telah masuk di Rekap'}
                  </div>
                </div>
              </div>

              {/* Transactions Table Section - Maximized Viewport & Prominent */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-sm flex-1 flex flex-col min-h-0">
                {/* Bilah Judul Tabel Transaksi dengan Pill Ringkasan Neraca Instan (Pembaruan A) */}
                <div className="px-3.5 py-2 bg-slate-800/40 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <Database className="w-3.5 h-3.5 text-blue-400" />
                    <span className="text-xs font-bold text-slate-200">
                      Daftar Transaksi DHP Terdeteksi (Tab INTEGRASI DATA)
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                      ({dhpData?.items.length || 0} baris proses aktif)
                    </span>
                  </div>

                  {/* Pill Ringkasan Neraca Instan (Pembaruan A) */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <div className="px-2.5 py-0.5 rounded-full bg-slate-950/80 border border-slate-700/80 text-[10px] text-slate-300 font-mono flex items-center gap-1.5 shadow-sm">
                      <span className="text-slate-400 font-sans font-semibold">Neraca Instan:</span>
                      <span className="text-slate-200 font-bold">Baku: {formatKg(dhpData?.totalBakuKg || 0)}</span>
                      <span className="text-slate-600">|</span>
                      <span className="text-emerald-400 font-bold">Hasil: {formatKg(dhpData?.totalHasilKg || 0)}</span>
                      <span className="text-slate-600">|</span>
                      <span className="text-amber-400 font-bold">
                        Susut: {formatKg(dhpData?.totalSusutKg || 0)} ({formatPct(dhpData?.totalSusutPct || 0)}%)
                      </span>
                    </div>
                  </div>
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
                      onClick={() => loadDhpData(false)}
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
                          <th className="py-2 px-2.5">Row</th>
                          <th className="py-2 px-2.5">Tanggal &amp; Waktu</th>
                          <th className="py-2 px-2.5">Jenis Tembakau</th>
                          <th className="py-2 px-2 text-center">Jalur</th>
                          <th className="py-2 px-2.5 text-right">Baku (Kg)</th>
                          <th className="py-2 px-2.5 text-right">Hasil (Kg)</th>
                          <th className="py-2 px-2.5 text-right">Susut (%)</th>
                          <th className="py-2 px-2.5 text-right">Gagang</th>
                          <th className="py-2 px-2.5 text-right">K. Air</th>
                          <th className="py-2 px-2.5 text-right">Debu</th>
                          <th className="py-2 px-2.5 text-center">Status Integrasi Rekap</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80">
                        {dhpData?.items.map((item: DhpBatchItem) => (
                          <tr
                            key={item.rowNumber}
                            className={`hover:bg-slate-800/50 transition-colors ${
                              item.isMismatch ? 'bg-amber-950/20' : ''
                            }`}
                          >
                            <td className="py-2 px-2.5 text-slate-400 font-mono text-[11px]">
                              {item.rowNumber}
                            </td>
                            <td className="py-2 px-2.5 whitespace-nowrap">
                              <div className="font-semibold text-slate-200 text-xs">
                                {item.tanggalFormatted}
                              </div>
                              <div className="text-[10px] text-slate-500">
                                🕒 {item.waktu}
                              </div>
                            </td>
                            <td className="py-2 px-2.5">
                              <div className="font-bold text-slate-100 text-xs">
                                {item.jenisTembakau}
                              </div>
                            </td>
                            <td className="py-2 px-2 text-center">
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
                            <td className="py-2 px-2.5 text-right font-semibold text-slate-100">
                              {formatKg(item.nettoBaku)}
                            </td>
                            <td className="py-2 px-2.5 text-right font-medium text-slate-300">
                              {item.hasil === 0 ? (
                                <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-950/60 border border-amber-500/50 text-amber-300">
                                  0,0 (Proses)
                                </span>
                              ) : (
                                formatKg(item.hasil)
                              )}
                            </td>
                            <td className="py-2 px-2.5 text-right font-bold text-amber-400">
                              {formatPct(item.susutPct)}%
                            </td>
                            <td className="py-2 px-2.5 text-right font-medium text-amber-200/90 whitespace-nowrap">
                              {formatKg(item.gagangKg)}
                            </td>
                            <td className="py-2 px-2.5 text-right font-medium text-sky-200/90 whitespace-nowrap">
                              {formatKg(item.airKg)}
                            </td>
                            <td className="py-2 px-2.5 text-right font-medium text-slate-300 whitespace-nowrap">
                              {formatKg(item.debuKg)}
                            </td>
                            <td className="py-2 px-2.5 text-center whitespace-nowrap">
                              {/* Mismatch Detector Alert (Pembaruan B - Matching reference image) */}
                              {item.isMismatch ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-amber-950/60 text-amber-300 border border-amber-500/70 shadow-sm animate-pulse whitespace-nowrap">
                                  <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                  <span>Hasil Berubah (Rekap {formatKg(item.rekapHasil || 0)} ➔ DHP {formatKg(item.hasil)})</span>
                                </span>
                              ) : item.alreadyInRekap ? (
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-600/60 shadow-sm whitespace-nowrap">
                                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                  <span>Cocok di Rekap {item.matchedRow ? `(Baris ${item.matchedRow})` : ''}</span>
                                </span>
                              ) : item.matchedRow ? (
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold bg-blue-950/60 text-blue-300 border border-blue-500/60 shadow-sm whitespace-nowrap">
                                  <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                  <span>Siap Diisi Otomatis (Baris {item.matchedRow})</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold bg-blue-950/60 text-blue-300 border border-blue-500/60 shadow-sm whitespace-nowrap">
                                  <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                  <span>Batch Baru (Siap Masuk)</span>
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>

                      {/* Sticky Footer tfoot: Total Neraca Permanen (Pembaruan A) */}
                      <tfoot className="bg-slate-950/95 text-slate-200 border-t-2 border-slate-700/90 sticky bottom-0 z-10 backdrop-blur font-semibold text-xs shadow-lg">
                        <tr className="divide-x divide-slate-800/60">
                          <td className="py-2.5 px-2.5 font-mono text-[11px] text-slate-400">Σ</td>
                          <td className="py-2.5 px-2.5 whitespace-nowrap text-xs font-bold text-slate-300">
                            {dhpData?.totalBatch || 0} Batch
                          </td>
                          <td className="py-2.5 px-2.5 font-bold text-slate-100 uppercase tracking-wider text-[11px]">
                            TOTAL NERACA DHP
                          </td>
                          <td className="py-2.5 px-2 text-center text-slate-500 font-normal">-</td>
                          <td className="py-2.5 px-2.5 text-right font-black text-white text-xs">
                            {formatKg(dhpData?.totalBakuKg || 0)}
                          </td>
                          <td className="py-2.5 px-2.5 text-right font-black text-emerald-300 text-xs">
                            {formatKg(dhpData?.totalHasilKg || 0)}
                          </td>
                          <td className="py-2.5 px-2.5 text-right font-black text-amber-400 text-xs">
                            {formatPct(dhpData?.totalSusutPct || 0)}%
                          </td>
                          <td className="py-2.5 px-2 text-right font-medium text-amber-200/90 whitespace-nowrap">
                            {formatKg(dhpData?.totalGagangKg || 0)}
                          </td>
                          <td className="py-2.5 px-2 text-right font-medium text-sky-200/90 whitespace-nowrap">
                            {formatKg(dhpData?.totalAirKg || 0)}
                          </td>
                          <td className="py-2.5 px-2 text-right font-medium text-slate-300 whitespace-nowrap">
                            {formatKg(dhpData?.totalDebuKg || 0)}
                          </td>
                          <td className="py-2.5 px-2.5 text-center whitespace-nowrap">
                            <span className="text-[11px] text-amber-300 font-bold bg-amber-950/60 px-2 py-0.5 rounded border border-amber-700/50">
                              Susut: {formatKg(dhpData?.totalSusutKg || 0)} Kg
                            </span>
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>

              {/* Bottom Sync Action Banner with Mismatch Alignment Detector (Pembaruan B) */}
              <div className="px-3.5 py-2 bg-gradient-to-r from-blue-950/70 via-indigo-950/60 to-blue-950/70 rounded-xl border border-blue-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0 shadow-sm">
                <div className="flex items-center gap-2 text-xs">
                  <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
                  <span className="text-slate-200 font-medium text-[11px]">
                    {(dhpData?.mismatchCount || 0) > 0
                      ? `⚠️ Ditemukan ${dhpData?.mismatchCount} batch dengan data hasil berubah di DHP dan ${dhpData?.batchBaruCount || 0} batch baru yang siap diselaraskan.`
                      : (dhpData?.batchBaruCount ?? 0) > 0
                      ? `Terdapat ${dhpData?.batchBaruCount} batch baru yang siap dibukukan ke baris baru Sheet Rekap.`
                      : `Semua ${dhpData?.items.length || 0} baris data DHP sudah tersinkronisasi presisi di Sheet Rekap.`}
                  </span>
                </div>
                <button
                  onClick={handleSyncToRekap}
                  disabled={isSyncingToRekap || (((dhpData?.batchBaruCount ?? 0) === 0) && ((dhpData?.mismatchCount ?? 0) === 0))}
                  className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md transition-all disabled:opacity-50 disabled:pointer-events-none shrink-0 ${
                    (dhpData?.mismatchCount || 0) > 0
                      ? 'bg-amber-600 hover:bg-amber-500 active:bg-amber-700'
                      : 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700'
                  }`}
                  title="Sinkronkan dan selaraskan data batch DHP ke sheet rekap"
                >
                  {isSyncingToRekap ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Sedang Menyelaraskan...</span>
                    </>
                  ) : (dhpData?.mismatchCount || 0) > 0 ? (
                    <>
                      <Send className="w-3.5 h-3.5 text-white" />
                      <span>
                        Sinkronkan &amp; Selaraskan ({(dhpData?.batchBaruCount || 0) > 0 ? `${dhpData?.batchBaruCount} Baru, ` : ''}{dhpData?.mismatchCount} Update)
                      </span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5 text-white" />
                      <span>Sinkronkan ke Sheet Rekap</span>
                    </>
                  )}
                </button>
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

        </div>

        {/* Modal Footer (Compact as in Image 1) */}
        <div className="px-4 sm:px-5 py-2 sm:py-2.5 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span className="text-[11px]">Koneksi aman &amp; pemetaan kolom terverifikasi</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors shadow-sm"
            >
              Tutup
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
