/**
 * Realistic Initial Data for:
 * Monitoring Board — Rekap Data Proses Tembakau
 * Divisi Produksi I - PT Batu Karang
 * 
 * Sesuai struktur baris sheet "REKAP SUSUT TEMBAKAU"
 */

import { RawRowData } from './types[RekapDataProsesTembakau]';

import REAL_1487_ROWS from './sheetData[RekapDataProsesTembakau].json';

export const INITIAL_DATA_RAW: RawRowData[] = REAL_1487_ROWS as RawRowData[];

export const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const INITIAL_SERVER_DASHBOARD = {
  status: "success",
  version: "v2.0-Headless-2026-10-02",
  timestamp: "2026-10-02T08:32:53.349Z",
  filterOptions: {
    tahun: ["2026", "2025"],
    bulan: ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"],
    jenisTembakau: [
      "Beringin 2023 (ST)", "Beringin 2023 ZN)", "Beringin 2024 (HS)", "Beringin Grade A (2023)", "Besuki 2024 (ZN)", 
      "Besuki Grade A (2023)", "Besuki Grade B (2023)", "Diet Trial - 3 (2026)", "Garut 2024 (FR)", "Garut 2025 FR)", 
      "Garut Grade B (2023)", "Hang Madura 2024 (BAT)", "Hang Madura Grade B (2021)", "Janturan Grade B (2020)", 
      "Joning 2023 (AR)", "Joning 2024 (AR)", "Kasturi Grade C 2019)", "Madura 2022 (HL)", "Madura 2022 (HL) S", 
      "Madura 2023 (BAT)", "Madura 2023 (HL)", "Madura 2023 (HL) R", "Madura 2023 (HL) S", "Madura 2024 (BAT) R", 
      "Maesan 2023 LIM)", "Maesan 2023 (PMD)", "Maesan 2023 (ST)", "Maesan 2024 (HS)", "Maesan Grade C (2020)", 
      "Maesan Grade C (2021)", "Mranggen 2023 (LL)", "Mranggen 2024 (LL)", "Paiton 2023 DM)", "Paiton 2023 (GFK)", 
      "Paiton 2023 (TKH)", "Paiton 2023 (ZN)", "Paiton 2024 (BE)", "Paiton 2024 (BWN)", "Paiton Grade C (2020)", 
      "Pakpe Grade B (2022)", "Pakpie B Grade C 2022)", "Pakpie Grade C (2022)", "Ploso 2023 (SH)", "Ploso 2024 (MYN)", 
      "Ploso Owol 2023 (SH)", "Sapudi 2024 (GF)", "Sapudi Grade B (2023)", "Sapudi Grade C (2023)", "Tbk Escot 2024 BE)", 
      "Weleri 2023 (FN)", "Weleri 2023 (FN) NP", "Weleri 2023 (HK)", "Weleri 2024 (HK)", "Weleri Grade A (2022)", 
      "Weleri Grade B (2021)", "Weleri Grade C (2020)"
    ],
    jenisProses: ["SKM", "SKT"]
  },
  entriTerkini: "28 September 2026",
  ringkasanTahunan: {
    jumlahData: 1487,
    baku: 1493938.5,
    hasil: 1359103.6,
    susutKg: 134834.9,
    susutPct: 9.03,
    susutMinPct: -1.28,
    susutMaxPct: 33.65,
    gagangPct: 6.05,
    debuAirPct: 2.99,
    periodeLabel: "Semua Tahun"
  },
  ringkasanBulanan: {
    jumlahData: 1487,
    baku: 1493938.5,
    hasil: 1359103.6,
    susutKg: 134834.9,
    susutPct: 9.03,
    susutMinPct: -1.28,
    susutMaxPct: 33.65,
    gagangPct: 6.05,
    debuAirPct: 2.99,
    periodeLabel: "Semua Bulan Semua Tahun"
  },
  ringkasanPeriode: {
    jumlahData: 729,
    baku: 764612.0,
    hasil: 684380.2,
    susutKg: 80231.8,
    susutPct: 10.49,
    susutMinPct: 1.02,
    susutMaxPct: 29.92,
    gagangPct: 7.47,
    debuAirPct: 3.03,
    periodeLabel: "Januari 2026 — September 2026"
  },
  rekapBulan: [
    { label: "April 2025", bulan: "April", tahun: "2025", jumlahData: 49, baku: 33336.9, hasil: 30819.8, susutKg: 2517.1, susutPct: 7.55, minPct: 1.52, maxPct: 24.16, gagangPct: 4.66, debuAirPct: 2.91, kapasitasPct: 2.23 },
    { label: "Mei 2025", bulan: "Mei", tahun: "2025", jumlahData: 75, baku: 59906.6, hasil: 56025.1, susutKg: 3881.5, susutPct: 6.48, minPct: -1.28, maxPct: 30.53, gagangPct: 3.42, debuAirPct: 3.08, kapasitasPct: 4.01 },
    { label: "Juni 2025", bulan: "Juni", tahun: "2025", jumlahData: 92, baku: 83121.2, hasil: 76908.3, susutKg: 6212.9, susutPct: 7.47, minPct: 1.47, maxPct: 33.65, gagangPct: 3.64, debuAirPct: 3.83, kapasitasPct: 5.56 },
    { label: "Juli 2025", bulan: "Juli", tahun: "2025", jumlahData: 105, baku: 102643.1, hasil: 95143.1, susutKg: 7500.0, susutPct: 7.31, minPct: -1.04, maxPct: 24.91, gagangPct: 4.07, debuAirPct: 3.24, kapasitasPct: 6.87 },
    { label: "Agustus 2025", bulan: "Agustus", tahun: "2025", jumlahData: 94, baku: 94475.3, hasil: 87125.2, susutKg: 7350.1, susutPct: 7.78, minPct: 0.85, maxPct: 26.6, gagangPct: 4.51, debuAirPct: 3.29, kapasitasPct: 6.32 },
    { label: "September 2025", bulan: "September", tahun: "2025", jumlahData: 90, baku: 89837.4, hasil: 83325.8, susutKg: 6511.6, susutPct: 7.25, minPct: 0.93, maxPct: 25.71, gagangPct: 4.52, debuAirPct: 2.74, kapasitasPct: 6.01 },
    { label: "Oktober 2025", bulan: "Oktober", tahun: "2025", jumlahData: 94, baku: 94992.2, hasil: 88961.7, susutKg: 6030.5, susutPct: 6.35, minPct: -0.96, maxPct: 30.16, gagangPct: 4.05, debuAirPct: 2.32, kapasitasPct: 6.36 },
    { label: "November 2025", bulan: "November", tahun: "2025", jumlahData: 92, baku: 97151.1, hasil: 89606.9, susutKg: 7544.2, susutPct: 7.77, minPct: 0.08, maxPct: 26.48, gagangPct: 5.50, debuAirPct: 2.40, kapasitasPct: 6.50 },
    { label: "Desember 2025", bulan: "Desember", tahun: "2025", jumlahData: 67, baku: 73862.7, hasil: 66807.5, susutKg: 7055.2, susutPct: 9.55, minPct: 1.63, maxPct: 24.69, gagangPct: 6.82, debuAirPct: 2.73, kapasitasPct: 4.94 },
    { label: "Januari 2026", bulan: "Januari", tahun: "2026", jumlahData: 86, baku: 80815.7, hasil: 71591.7, susutKg: 9224.0, susutPct: 11.41, minPct: 2.42, maxPct: 25.10, gagangPct: 8.22, debuAirPct: 3.20, kapasitasPct: 5.41 },
    { label: "Februari 2026", bulan: "Februari", tahun: "2026", jumlahData: 81, baku: 78410.2, hasil: 69812.5, susutKg: 8597.7, susutPct: 10.96, minPct: 2.15, maxPct: 24.80, gagangPct: 7.85, debuAirPct: 3.11, kapasitasPct: 5.25 },
    { label: "Maret 2026", bulan: "Maret", tahun: "2026", jumlahData: 89, baku: 86540.0, hasil: 77312.0, susutKg: 9228.0, susutPct: 10.66, minPct: 2.01, maxPct: 26.30, gagangPct: 7.60, debuAirPct: 3.06, kapasitasPct: 5.79 },
    { label: "April 2026", bulan: "April", tahun: "2026", jumlahData: 74, baku: 72150.5, hasil: 64612.3, susutKg: 7538.2, susutPct: 10.45, minPct: 1.85, maxPct: 24.10, gagangPct: 7.40, debuAirPct: 3.05, kapasitasPct: 4.83 },
    { label: "Mei 2026", bulan: "Mei", tahun: "2026", jumlahData: 82, baku: 84300.0, hasil: 75480.0, susutKg: 8820.0, susutPct: 10.46, minPct: 1.92, maxPct: 25.50, gagangPct: 7.35, debuAirPct: 3.11, kapasitasPct: 5.64 },
    { label: "Juni 2026", bulan: "Juni", tahun: "2026", jumlahData: 88, baku: 91200.0, hasil: 81700.0, susutKg: 9500.0, susutPct: 10.42, minPct: 1.74, maxPct: 27.20, gagangPct: 7.32, debuAirPct: 3.10, kapasitasPct: 6.10 },
    { label: "Juli 2026", bulan: "Juli", tahun: "2026", jumlahData: 95, baku: 96400.0, hasil: 86280.0, susutKg: 10120.0, susutPct: 10.50, minPct: 1.65, maxPct: 28.40, gagangPct: 7.41, debuAirPct: 3.09, kapasitasPct: 6.45 },
    { label: "Agustus 2026", bulan: "Agustus", tahun: "2026", jumlahData: 90, baku: 92100.0, hasil: 82420.0, susutKg: 9680.0, susutPct: 10.51, minPct: 1.55, maxPct: 29.10, gagangPct: 7.45, debuAirPct: 3.06, kapasitasPct: 6.16 },
    { label: "September 2026", bulan: "September", tahun: "2026", jumlahData: 84, baku: 82695.6, hasil: 75163.7, susutKg: 7531.9, susutPct: 9.11, minPct: 1.02, maxPct: 24.50, gagangPct: 6.48, debuAirPct: 2.63, kapasitasPct: 5.54 }
  ]
};

/**
 * Ready-to-copy code for the NEW Google Apps Script project
 * File: Code[RekapDataProsesTembakau].gs
 * 
 * Standar Headless JSON REST Web App
 */
export const NEW_GAS_CODE_STRING = `/**
 * =====================================================================
 *  MONITORING BOARD — REKAP DATA PROSES TEMBAKAU (HEADLESS REST API V2)
 *  Divisi Produksi I - PT Batu Karang
 *  Developed by Lalu Mahendra
 *  
 *  - Membaca sheet sumber: "REKAP SUSUT TEMBAKAU"
 *  - TIDAK MENGGANGGU script lama (dijalankan di project GAS terpisah)
 *  - Output REST API JSON murni dengan CORS header terbuka
 *  - Support actions: getDashboardData, getFilterOptions, getTrend, ping
 * =====================================================================
 */

var BUILD_VERSION = 'v2.0-Headless-2026-10-02';
var SHEET_DATAMASTER = 'REKAP SUSUT TEMBAKAU';
var DATA_START_ROW = 12;

// JIKA SCRIPT TERIKAT LANGSUNG (Menu Ekstensi > Apps Script di Google Sheet):
// Biarkan SPREADSHEET_ID kosong ('').
// JIKA SCRIPT DIBUAT DARI script.google.com (Standalone):
// Masukkan ID Spreadsheet dari URL (karakter antara /d/ dan /edit).
var SPREADSHEET_ID = '';

var COL = {
  TANGGAL: 2,   // B
  BULAN: 3,     // C
  TAHUN: 4,     // D
  JENIS_PERLAKUAN: 5, // E
  JENIS_TEMBAKAU: 6,  // F
  JENIS_PROSES: 7,    // G (SKT / SKM)
  BAKU: 8,      // H (Kg)
  HASIL: 9,     // I (Kg)
  SUSUT_KG: 10, // J (Kg)
  SUSUT_PCT: 11,// K (%)
  GAGANG: 12,   // L (Kg)
  AIR: 13,      // M (Kg)
  DEBU: 14      // N (Kg)
};

var MONTH_ORDER = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

function getSpreadsheet_() {
  var ss = null;
  try {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  } catch (e) {
    ss = null;
  }
  if (!ss && SPREADSHEET_ID) {
    try {
      ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    } catch (e) {
      throw new Error('Gagal membuka spreadsheet dengan ID: ' + SPREADSHEET_ID + '. ' + e.message);
    }
  }
  if (!ss) {
    throw new Error('Spreadsheet tidak terdeteksi. Buka script ini via menu Ekstensi > Apps Script di Spreadsheet, atau isi variabel SPREADSHEET_ID di baris 8.');
  }
  return ss;
}

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'getDashboardData';
  var tahun = (e && e.parameter && e.parameter.tahun) ? e.parameter.tahun : 'Semua';
  var bulan = (e && e.parameter && e.parameter.bulan) ? e.parameter.bulan : 'Semua';
  var jenisProses = (e && e.parameter && e.parameter.jenisProses) ? e.parameter.jenisProses : 'Semua';
  var bulanMulai = (e && e.parameter && e.parameter.bulanMulai) ? e.parameter.bulanMulai : 'Januari';
  var tahunMulai = (e && e.parameter && e.parameter.tahunMulai) ? e.parameter.tahunMulai : '2026';
  var bulanAkhir = (e && e.parameter && e.parameter.bulanAkhir) ? e.parameter.bulanAkhir : 'September';
  var tahunAkhir = (e && e.parameter && e.parameter.tahunAkhir) ? e.parameter.tahunAkhir : '2026';
  var jenisTembakau = (e && e.parameter && e.parameter.jenisTembakau) ? e.parameter.jenisTembakau : '';

  var result = {
    status: 'success',
    version: BUILD_VERSION,
    timestamp: new Date().toISOString()
  };

  try {
    var rows = getRawData_();

    if (action === 'ping') {
      result.message = 'Headless REST API PP1 Tembakau Online & Terhubung ke Sheet';
      result.totalRows = rows.length;
      result.sheetSource = SHEET_DATAMASTER;
    } else if (action === 'getFilterOptions') {
      result.filterOptions = computeFilterOptions_(rows);
    } else {
      // Default: Full Dashboard Data Payload
      result.filterOptions = computeFilterOptions_(rows);
      result.entriTerkini = getEntriTerkini_(rows);
      result.ringkasanTahunan = computeRingkasan_(rows, tahun, null, jenisProses, 'tahunan');
      result.ringkasanBulanan = computeRingkasan_(rows, tahun, bulan, jenisProses, 'bulanan');
      result.ringkasanPeriode = computeRingkasanPeriode_(rows, tahunMulai, bulanMulai, tahunAkhir, bulanAkhir, jenisProses);
      result.rekapBulan = computeRekapBulan_(rows, tahun, jenisProses);
      result.rekapJenisTembakauPeriode = computeRekapJenisTembakauPeriode_(rows, tahunMulai, bulanMulai, tahunAkhir, bulanAkhir, jenisProses);
      
      var defaultJenis = jenisTembakau || (result.rekapJenisTembakauPeriode.length ? result.rekapJenisTembakauPeriode[0].label : null);
      result.trendJenis = defaultJenis ? computeTrendJenisTembakau_(rows, tahun, defaultJenis, jenisProses) : { jenisTembakau: null, data: [] };
      result.rawRows = rows; // kirim seluruh baris agar web app mengkalkulasikan data 100% akurat
    }
  } catch (err) {
    result.status = 'error';
    result.message = err.toString();
  }

  var callback = (e && e.parameter && e.parameter.callback) ? e.parameter.callback : null;
  if (callback) {
    return ContentService.createTextOutput(callback + '(' + JSON.stringify(result) + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  return doGet(e);
}

function getRawData_() {
  var ss = getSpreadsheet_();
  var sheet = ss.getSheetByName(SHEET_DATAMASTER);
  if (!sheet) {
    // Coba pencarian toleran spasi/huruf besar-kecil jika nama sheet agak berbeda
    var sheets = ss.getSheets();
    for (var s = 0; s < sheets.length; s++) {
      if (sheets[s].getName().trim().toUpperCase() === SHEET_DATAMASTER.toUpperCase()) {
        sheet = sheets[s];
        break;
      }
    }
  }
  if (!sheet) {
    throw new Error('Sheet "' + SHEET_DATAMASTER + '" tidak ditemukan di Spreadsheet.');
  }

  var lastRow = sheet.getLastRow();
  if (lastRow < DATA_START_ROW) return [];

  var numRows = lastRow - DATA_START_ROW + 1;
  var values = sheet.getRange(DATA_START_ROW, 1, numRows, 14).getValues();
  var rows = [];

  for (var i = 0; i < values.length; i++) {
    var r = values[i];
    var tanggal = r[COL.TANGGAL - 1];
    var baku = r[COL.BAKU - 1];
    var hasil = r[COL.HASIL - 1];

    if (!(tanggal instanceof Date) && typeof tanggal !== 'string') continue;
    if (typeof baku !== 'number' || typeof hasil !== 'number' || baku <= 0) continue;

    var susutKg = typeof r[COL.SUSUT_KG - 1] === 'number' ? r[COL.SUSUT_KG - 1] : (baku - hasil);
    var susutPct = typeof r[COL.SUSUT_PCT - 1] === 'number' ? r[COL.SUSUT_PCT - 1] : (susutKg / baku * 100);
    var gagangKg = typeof r[COL.GAGANG - 1] === 'number' ? r[COL.GAGANG - 1] : 0;
    var airKg = typeof r[COL.AIR - 1] === 'number' ? r[COL.AIR - 1] : 0;
    var debuKg = typeof r[COL.DEBU - 1] === 'number' ? r[COL.DEBU - 1] : 0;

    var dateStr = (tanggal instanceof Date) 
      ? Utilities.formatDate(tanggal, Session.getScriptTimeZone(), 'yyyy-MM-dd') 
      : String(tanggal);

    rows.push({
      srcRow: DATA_START_ROW + i,
      tanggal: dateStr,
      bulan: r[COL.BULAN - 1] || '',
      tahun: String(r[COL.TAHUN - 1] || ''),
      jenisTembakau: String(r[COL.JENIS_TEMBAKAU - 1] || 'Tembakau'),
      jenisProses: String(r[COL.JENIS_PROSES - 1] || 'SKT'),
      baku: Math.round(baku * 10) / 10,
      hasil: Math.round(hasil * 10) / 10,
      susutKg: Math.round(susutKg * 10) / 10,
      susutPct: Math.round(susutPct * 100) / 100,
      gagangKg: Math.round(gagangKg * 10) / 10,
      airKg: Math.round(airKg * 10) / 10,
      debuKg: Math.round(debuKg * 10) / 10,
      debuAirKg: Math.round((airKg + debuKg) * 10) / 10
    });
  }
  return rows;
}

function computeFilterOptions_(rows) {
  var tahunSet = {}, jenisTembakauSet = {}, jenisProsesSet = {};
  rows.forEach(function (r) {
    if (r.tahun) tahunSet[r.tahun] = true;
    if (r.jenisTembakau) jenisTembakauSet[r.jenisTembakau] = true;
    if (r.jenisProses) jenisProsesSet[r.jenisProses] = true;
  });
  return {
    tahun: Object.keys(tahunSet).sort().reverse(),
    bulan: MONTH_ORDER,
    jenisTembakau: Object.keys(jenisTembakauSet).sort(),
    jenisProses: Object.keys(jenisProsesSet).sort()
  };
}

function summarize_(filtered) {
  var sumBaku = 0, sumHasil = 0, sumSusut = 0, sumGagang = 0, sumDebuAir = 0;
  var minPct = Infinity, maxPct = -Infinity;
  filtered.forEach(function (r) {
    sumBaku += r.baku;
    sumHasil += r.hasil;
    sumSusut += r.susutKg;
    sumGagang += r.gagangKg;
    sumDebuAir += r.debuAirKg;
    if (r.susutPct < minPct) minPct = r.susutPct;
    if (r.susutPct > maxPct) maxPct = r.susutPct;
  });
  return {
    jumlahData: filtered.length,
    baku: Math.round(sumBaku * 10) / 10,
    hasil: Math.round(sumHasil * 10) / 10,
    susutKg: Math.round(sumSusut * 10) / 10,
    susutPct: Math.round((sumBaku ? (sumSusut / sumBaku * 100) : 0) * 100) / 100,
    susutMinPct: Math.round((minPct === Infinity ? 0 : minPct) * 100) / 100,
    susutMaxPct: Math.round((maxPct === -Infinity ? 0 : maxPct) * 100) / 100,
    gagangPct: Math.round((sumBaku ? (sumGagang / sumBaku * 100) : 0) * 100) / 100,
    debuAirPct: Math.round((sumBaku ? (sumDebuAir / sumBaku * 100) : 0) * 100) / 100
  };
}

function computeRingkasan_(rows, tahun, bulan, jenisProses, mode) {
  var filtered = rows.filter(function (r) {
    if (tahun && tahun !== 'Semua' && r.tahun !== tahun) return false;
    if (mode === 'bulanan' && bulan && bulan !== 'Semua' && r.bulan !== bulan) return false;
    if (jenisProses && jenisProses !== 'Semua' && r.jenisProses !== jenisProses) return false;
    return true;
  });
  var s = summarize_(filtered);
  var tahunLabel = (tahun && tahun !== 'Semua') ? tahun : 'Semua Tahun';
  var jenisLabel = (jenisProses && jenisProses !== 'Semua') ? (' · ' + jenisProses) : '';
  s.periodeLabel = ((mode === 'tahunan') ? tahunLabel : ((bulan && bulan !== 'Semua' ? bulan : 'Semua Bulan') + ' ' + tahunLabel)) + jenisLabel;
  return s;
}

function monthKey_(tahun, bulan) {
  return Number(tahun) * 12 + MONTH_ORDER.indexOf(bulan);
}

function computeRingkasanPeriode_(rows, tahunMulai, bulanMulai, tahunAkhir, bulanAkhir, jenisProses) {
  var startKey = monthKey_(tahunMulai, bulanMulai);
  var endKey = monthKey_(tahunAkhir, bulanAkhir);
  if (endKey < startKey) { var tmp = startKey; startKey = endKey; endKey = tmp; }
  
  var filtered = rows.filter(function (r) {
    if (jenisProses && jenisProses !== 'Semua' && r.jenisProses !== jenisProses) return false;
    var k = monthKey_(r.tahun, r.bulan);
    return k >= startKey && k <= endKey;
  });
  var s = summarize_(filtered);
  var labelMulai = bulanMulai + ' ' + tahunMulai;
  var labelAkhir = bulanAkhir + ' ' + tahunAkhir;
  s.periodeLabel = (labelMulai === labelAkhir ? labelMulai : (labelMulai + ' — ' + labelAkhir)) +
    ((jenisProses && jenisProses !== 'Semua') ? (' · ' + jenisProses) : '');
  return s;
}

function computeRekapJenisTembakauPeriode_(rows, tahunMulai, bulanMulai, tahunAkhir, bulanAkhir, jenisProses) {
  var startKey = monthKey_(tahunMulai, bulanMulai);
  var endKey = monthKey_(tahunAkhir, bulanAkhir);
  if (endKey < startKey) { var tmp = startKey; startKey = endKey; endKey = tmp; }

  var filtered = rows.filter(function (r) {
    if (jenisProses && jenisProses !== 'Semua' && r.jenisProses !== jenisProses) return false;
    var k = monthKey_(r.tahun, r.bulan);
    return k >= startKey && k <= endKey;
  });
  var totalBaku = filtered.reduce(function (s, r) { return s + r.baku; }, 0);
  var map = {};
  filtered.forEach(function (r) {
    var k = r.jenisTembakau;
    if (!map[k]) map[k] = { label: k, baku: 0, hasil: 0, susutKg: 0, gagangKg: 0, debuAirKg: 0, count: 0, minPct: Infinity, maxPct: -Infinity };
    var g = map[k];
    g.baku += r.baku; g.hasil += r.hasil; g.susutKg += r.susutKg; g.gagangKg += r.gagangKg; g.debuAirKg += r.debuAirKg; g.count += 1;
    if (r.susutPct < g.minPct) g.minPct = r.susutPct;
    if (r.susutPct > g.maxPct) g.maxPct = r.susutPct;
  });
  var list = Object.keys(map).map(function (k) {
    var g = map[k];
    return {
      label: k,
      jumlahData: g.count,
      baku: Math.round(g.baku * 10) / 10,
      hasil: Math.round(g.hasil * 10) / 10,
      susutKg: Math.round(g.susutKg * 10) / 10,
      susutPct: Math.round((g.baku ? (g.susutKg / g.baku * 100) : 0) * 100) / 100,
      minPct: Math.round((g.minPct === Infinity ? 0 : g.minPct) * 100) / 100,
      maxPct: Math.round((g.maxPct === -Infinity ? 0 : g.maxPct) * 100) / 100,
      gagangPct: Math.round((g.baku ? (g.gagangKg / g.baku * 100) : 0) * 100) / 100,
      debuAirPct: Math.round((g.baku ? (g.debuAirKg / g.baku * 100) : 0) * 100) / 100,
      kapasitasPct: Math.round((totalBaku ? (g.baku / totalBaku * 100) : 0) * 100) / 100
    };
  });
  return list.sort(function (a, b) { return b.baku - a.baku; });
}

function computeRekapBulan_(rows, tahun, jenisProses) {
  var filtered = rows.filter(function (r) {
    if (tahun && tahun !== 'Semua' && r.tahun !== tahun) return false;
    if (jenisProses && jenisProses !== 'Semua' && r.jenisProses !== jenisProses) return false;
    return true;
  });
  var totalBaku = filtered.reduce(function (s, r) { return s + r.baku; }, 0);
  var map = {};
  filtered.forEach(function (r) {
    var k = r.bulan + '||' + r.tahun;
    if (!map[k]) map[k] = { label: r.bulan + ' ' + r.tahun, bulan: r.bulan, tahun: r.tahun, baku: 0, hasil: 0, susutKg: 0, gagangKg: 0, debuAirKg: 0, count: 0, minPct: Infinity, maxPct: -Infinity };
    var g = map[k];
    g.baku += r.baku; g.hasil += r.hasil; g.susutKg += r.susutKg; g.gagangKg += r.gagangKg; g.debuAirKg += r.debuAirKg; g.count += 1;
    if (r.susutPct < g.minPct) g.minPct = r.susutPct;
    if (r.susutPct > g.maxPct) g.maxPct = r.susutPct;
  });
  var list = Object.keys(map).map(function (k) {
    var g = map[k];
    return {
      label: g.label,
      bulan: g.bulan,
      tahun: g.tahun,
      jumlahData: g.count,
      baku: Math.round(g.baku * 10) / 10,
      hasil: Math.round(g.hasil * 10) / 10,
      susutKg: Math.round(g.susutKg * 10) / 10,
      susutPct: Math.round((g.baku ? (g.susutKg / g.baku * 100) : 0) * 100) / 100,
      minPct: Math.round((g.minPct === Infinity ? 0 : g.minPct) * 100) / 100,
      maxPct: Math.round((g.maxPct === -Infinity ? 0 : g.maxPct) * 100) / 100,
      gagangPct: Math.round((g.baku ? (g.gagangKg / g.baku * 100) : 0) * 100) / 100,
      debuAirPct: Math.round((g.baku ? (g.debuAirKg / g.baku * 100) : 0) * 100) / 100,
      kapasitasPct: Math.round((totalBaku ? (g.baku / totalBaku * 100) : 0) * 100) / 100
    };
  });
  return list.sort(function (a, b) {
    if (a.tahun !== b.tahun) return a.tahun.localeCompare(b.tahun);
    return MONTH_ORDER.indexOf(a.bulan) - MONTH_ORDER.indexOf(b.bulan);
  });
}

function computeTrendJenisTembakau_(rows, tahun, jenisTembakau, jenisProses) {
  var filtered = rows.filter(function (r) {
    if (r.jenisTembakau !== jenisTembakau) return false;
    if (tahun && tahun !== 'Semua' && r.tahun !== tahun) return false;
    if (jenisProses && jenisProses !== 'Semua' && r.jenisProses !== jenisProses) return false;
    return true;
  });
  var totalBaku = filtered.reduce(function (s, r) { return s + r.baku; }, 0);
  var map = {};
  filtered.forEach(function (r) {
    var k = r.bulan + '||' + r.tahun;
    if (!map[k]) map[k] = { label: r.bulan.substring(0, 3) + ' ' + r.tahun, bulan: r.bulan, tahun: r.tahun, baku: 0, hasil: 0, susutKg: 0, count: 0 };
    var g = map[k];
    g.baku += r.baku; g.hasil += r.hasil; g.susutKg += r.susutKg; g.count += 1;
  });
  var list = Object.keys(map).map(function (k) {
    var g = map[k];
    return {
      label: g.label,
      bulan: g.bulan,
      tahun: g.tahun,
      baku: Math.round(g.baku * 10) / 10,
      hasil: Math.round(g.hasil * 10) / 10,
      susutKg: Math.round(g.susutKg * 10) / 10,
      susutPct: Math.round((g.baku ? (g.susutKg / g.baku * 100) : 0) * 100) / 100
    };
  });
  list.sort(function (a, b) {
    if (a.tahun !== b.tahun) return a.tahun.localeCompare(b.tahun);
    return MONTH_ORDER.indexOf(a.bulan) - MONTH_ORDER.indexOf(b.bulan);
  });
  return { jenisTembakau: jenisTembakau, data: list };
}

function getEntriTerkini_(rows) {
  if (!rows.length) return null;
  var maxTanggal = rows[0].tanggal;
  rows.forEach(function (r) { if (r.tanggal > maxTanggal) maxTanggal = r.tanggal; });
  var parts = maxTanggal.split('-');
  var tahun = parts[0], bulanIdx = parseInt(parts[1], 10) - 1, hari = parseInt(parts[2], 10);
  return hari + ' ' + MONTH_ORDER[bulanIdx] + ' ' + tahun;
}
`;
