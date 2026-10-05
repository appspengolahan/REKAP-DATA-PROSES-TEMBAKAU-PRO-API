/**
 * Service & Aggregation Engine for:
 * Monitoring Board — Rekap Data Proses Tembakau
 * Divisi Produksi I - PT Batu Karang
 * 
 * Standar Decimal:
 * - Persentase (%): 2 desimal
 * - Non-persentase (Kg): 1 desimal
 * - Separasi formula spreadsheet: Titik koma (;)
 */

import {
  RawRowData,
  SummaryKPI,
  GroupSummary,
  TrendJenisData,
  FilterOptions,
  PeriodeRange,
  GasConfig,
  JenisProsesType,
  ServerDashboardPayload
} from './types[RekapDataProsesTembakau]';
import { INITIAL_DATA_RAW, MONTH_NAMES, INITIAL_SERVER_DASHBOARD } from './mockData[RekapDataProsesTembakau]';

const CACHE_KEY_RAW = 'CACHE_PP1_REKAP_DATA_PROSES_TEMBAKAU_RAW_V2';
const CACHE_KEY_CONFIG = 'CACHE_PP1_REKAP_DATA_PROSES_TEMBAKAU_GAS_CFG_V2';
const CACHE_KEY_DASHBOARD = 'CACHE_PP1_REKAP_DATA_PROSES_TEMBAKAU_SERVER_DASH_V2';

export const DEFAULT_GAS_URL = 'https://script.google.com/macros/s/AKfycbw34wezcB4YC4N-n2nL0ll9jofM3i9s5OHYxLZJ4Xu32_AmCEDcIAYi9V1AdPg2iACM/exec';
export const LEGACY_GAS_URL = 'https://script.google.com/macros/s/AKfycbxSN-YhfNR5dwYFBWKyT5A8FN7juS3AuahOitVpfr-UWNKhF5fUUUeQ6k8-_ORqy3mYGA/exec';

// FORMATTING RULES:
// 1. Persentase (%): Tepat 2 angka di belakang koma
export function formatPct(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return '0.00%';
  return val.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';
}

export function formatPctRaw(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return '0.00';
  return val.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// 2. Non-persentase (Kg / berat): Tepat 1 angka di belakang koma
export function formatKg(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return '0.0 Kg';
  return val.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' Kg';
}

export function formatKgRaw(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return '0.0';
  return val.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

// 3. Formula spreadsheet: Gunakan titik koma (;)
export function generateSheetFormulaSusut(bakuCell: string, hasilCell: string): string {
  return `=${bakuCell}-${hasilCell}`;
}

export function generateSheetFormulaSusutPct(bakuCell: string, susutCell: string): string {
  // Semicolon separator for Indonesian locale
  return `=IF(${bakuCell}>0; (${susutCell}/${bakuCell})*100; 0)`;
}

export class RekapDataProsesTembakauService {
  private static cachedRows: RawRowData[] | null = null;

  public static getGasConfig(): GasConfig {
    try {
      const stored = localStorage.getItem(CACHE_KEY_CONFIG);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Gagal membaca GAS config dari localStorage', e);
    }
    return {
      apiUrl: DEFAULT_GAS_URL,
      lastSync: new Date().toISOString(),
      status: 'online'
    };
  }

  public static saveGasConfig(cfg: Partial<GasConfig>): GasConfig {
    const current = this.getGasConfig();
    const updated: GasConfig = { ...current, ...cfg };
    try {
      localStorage.setItem(CACHE_KEY_CONFIG, JSON.stringify(updated));
    } catch (e) {
      console.error('Gagal menyimpan GAS config', e);
    }
    return updated;
  }

  public static getRawData(): RawRowData[] {
    if (this.cachedRows && this.cachedRows.length > 0) {
      return this.cachedRows;
    }
    try {
      const stored = localStorage.getItem(CACHE_KEY_RAW);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.cachedRows = parsed;
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Gagal membaca cache raw data, fallback ke initial data', e);
    }
    this.cachedRows = [...INITIAL_DATA_RAW];
    this.saveRawData(this.cachedRows);
    return this.cachedRows;
  }

  public static saveRawData(rows: RawRowData[]) {
    this.cachedRows = rows;
    try {
      localStorage.setItem(CACHE_KEY_RAW, JSON.stringify(rows));
    } catch (e) {
      console.error('Gagal menyimpan cache raw data', e);
    }
  }

  public static clearCache() {
    this.cachedRows = [...INITIAL_DATA_RAW];
    localStorage.removeItem(CACHE_KEY_RAW);
    localStorage.removeItem(CACHE_KEY_DASHBOARD);
    this.saveRawData(this.cachedRows);
  }

  public static getServerDashboardData(): ServerDashboardPayload | null {
    try {
      const stored = localStorage.getItem(CACHE_KEY_DASHBOARD);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Gagal membaca cache server dashboard', e);
    }
    return INITIAL_SERVER_DASHBOARD as any;
  }

  public static saveServerDashboardData(data: ServerDashboardPayload) {
    try {
      localStorage.setItem(CACHE_KEY_DASHBOARD, JSON.stringify(data));
    } catch (e) {
      console.error('Gagal menyimpan cache server dashboard', e);
    }
  }

  /**
   * JSONP fallback helper for Google Apps Script
   */
  public static fetchJsonp(url: string, timeoutMs = 12000): Promise<any> {
    return new Promise((resolve, reject) => {
      const callbackName = 'gasCallback_' + Math.round(100000 * Math.random());
      const script = document.createElement('script');
      let isCompleted = false;

      const timer = setTimeout(() => {
        if (!isCompleted) {
          isCompleted = true;
          delete (window as any)[callbackName];
          if (script.parentNode) script.parentNode.removeChild(script);
          reject(new Error('JSONP Timeout'));
        }
      }, timeoutMs);

      (window as any)[callbackName] = (data: any) => {
        if (!isCompleted) {
          isCompleted = true;
          clearTimeout(timer);
          delete (window as any)[callbackName];
          if (script.parentNode) script.parentNode.removeChild(script);
          resolve(data);
        }
      };

      script.onerror = () => {
        if (!isCompleted) {
          isCompleted = true;
          clearTimeout(timer);
          delete (window as any)[callbackName];
          if (script.parentNode) script.parentNode.removeChild(script);
          reject(new Error('JSONP Network Error'));
        }
      };

      const sep = url.includes('?') ? '&' : '?';
      script.src = `${url}${sep}callback=${callbackName}`;
      document.body.appendChild(script);
    });
  }

  /**
   * Sync background with Google Apps Script
   */
  public static async syncFromGas(): Promise<{ success: boolean; message: string; rowCount: number }> {
    const config = this.getGasConfig();
    let endpoint = (config.apiUrl || DEFAULT_GAS_URL).trim();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      // Clean URL: don't double query
      let urlWithAction = endpoint;
      if (!endpoint.includes('user_content_key') && !endpoint.includes('action=')) {
        urlWithAction = endpoint.includes('?') 
          ? `${endpoint}&action=getDashboardData` 
          : `${endpoint}?action=getDashboardData`;
      }

      let json: any = null;

      // 1. Try standard CORS fetch without custom headers (avoids CORS preflight)
      try {
        const resp = await fetch(urlWithAction, {
          method: 'GET',
          redirect: 'follow',
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (resp.ok) {
          json = await resp.json();
        } else {
          throw new Error(`HTTP Error ${resp.status}`);
        }
      } catch (fetchErr: any) {
        // 2. If standard fetch fails (CORS blocked on Google redirect), attempt JSONP fallback
        console.warn('Fetch langsung terkendala CORS, mencoba jalur JSONP...', fetchErr);
        try {
          json = await this.fetchJsonp(urlWithAction);
        } catch (jsonpErr) {
          throw fetchErr; // rethrow original fetch error
        }
      }

      if (json && (json.status === 'success' || json.ringkasanTahunan || json.filterOptions)) {
        // Save precomputed server dashboard payload
        this.saveServerDashboardData(json);

        let rowCount = 0;
        if (Array.isArray(json.rawRows) && json.rawRows.length > 0) {
          this.saveRawData(json.rawRows);
          rowCount = json.rawRows.length;
        } else if (json.ringkasanTahunan && json.ringkasanTahunan.jumlahData) {
          rowCount = json.ringkasanTahunan.jumlahData;
        } else {
          rowCount = this.getRawData().length;
        }

        this.saveGasConfig({
          lastSync: new Date().toISOString(),
          status: 'online'
        });

        return {
          success: true,
          message: `Sinkronisasi live sukses! Terhubung dengan Google Sheet (${rowCount} baris).`,
          rowCount
        };
      } else {
        this.saveGasConfig({
          lastSync: new Date().toISOString(),
          status: 'online'
        });
        return {
          success: true,
          message: json?.message || 'Koneksi ke GAS aktif.',
          rowCount: this.getRawData().length
        };
      }
    } catch (err: any) {
      console.warn('Gagal sync ke GAS, menggunakan offline cache lokal:', err);
      this.saveGasConfig({
        status: 'offline',
        errorMessage: err?.message || 'Koneksi time-out'
      });
      return {
        success: false,
        message: `Offline mode aktif: ${err?.message || 'Network Timeout'}.`,
        rowCount: this.getRawData().length
      };
    }
  }

  /**
   * Tarik Data Langsung dari Datasheet Google Sheets (via gviz CSV)
   * Mengambil data riil langsung dari Google Sheet tanpa ketergantungan deployment script.
   * Mendukung tab '_CACHE_REKAP_TBK' (1.487 baris riil 2025-2026) maupun 'REKAP SUSUT TEMBAKAU' (sheet operasional).
   */
  public static async pullDirectFromSheet(
    spreadsheetId: string = '1LnixFRQXFjDaR_LYoOUvsj84Y_Lb5W8samFOPWrDSC0',
    preferredTab: string = 'AUTO'
  ): Promise<{ success: boolean; message: string; count: number; tabUsed: string }> {
    try {
      let rows: RawRowData[] = [];
      let tabUsed = '';

      // Mode 1: AUTO - Coba tab _CACHE_REKAP_TBK terlebih dahulu (dataset terlengkap 1.487 baris)
      if (preferredTab === 'AUTO' || preferredTab === '_CACHE_REKAP_TBK') {
        try {
          const cacheUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=_CACHE_REKAP_TBK`;
          const resp = await fetch(cacheUrl, { method: 'GET' });
          if (resp.ok) {
            const text = await resp.text();
            if (text && !text.includes('google-signin') && !text.includes('<!DOCTYPE html>')) {
              const parsed = this.parseCSVText(text);
              if (parsed.length >= 100) {
                rows = parsed;
                tabUsed = '_CACHE_REKAP_TBK';
              }
            }
          }
        } catch (e) {
          console.warn('Gagal menarik dari _CACHE_REKAP_TBK, mencoba REKAP SUSUT TEMBAKAU', e);
        }
      }

      // Mode 2: Jika belum dapat atau user minta REKAP SUSUT TEMBAKAU
      if (rows.length === 0 || preferredTab === 'REKAP SUSUT TEMBAKAU') {
        const directUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=REKAP%20SUSUT%20TEMBAKAU`;
        const resp2 = await fetch(directUrl, { method: 'GET' });
        if (!resp2.ok) {
          throw new Error(`Gagal menghubungi Google Sheet (HTTP ${resp2.status})`);
        }
        const text2 = await resp2.text();
        if (text2.includes('google-signin') || text2.includes('<!DOCTYPE html>')) {
          throw new Error('Google Sheet memerlukan hak akses publik (Anyone with the link can view).');
        }
        rows = this.parseRekapSusutTembakauCSV(text2);
        tabUsed = 'REKAP SUSUT TEMBAKAU';
      }

      if (rows.length === 0) {
        throw new Error('Tidak ada baris data valid yang terbaca dari spreadsheet.');
      }

      this.saveRawData(rows);
      this.saveGasConfig({
        lastSync: new Date().toISOString(),
        status: 'online'
      });

      return {
        success: true,
        message: `Berhasil menarik ${rows.length} baris data riil langsung dari datasheet Google Sheet (Tab: ${tabUsed})!`,
        count: rows.length,
        tabUsed
      };
    } catch (err: any) {
      console.error('Error pullDirectFromSheet:', err);
      return {
        success: false,
        message: `Gagal menarik data langsung: ${err?.message || err}`,
        count: 0,
        tabUsed: ''
      };
    }
  }

  public static parseRekapSusutTembakauCSV(text: string): RawRowData[] {
    const lines = this.parseRawCSVGrid(text);
    const parseNum = (val: string): number => {
      if (!val) return 0;
      let clean = String(val).replace(/Kg/gi, '').replace(/%/gi, '').trim();
      if (clean.includes(',') && clean.includes('.')) {
        clean = clean.replace(/\./g, '').replace(',', '.');
      } else if (clean.includes(',')) {
        clean = clean.replace(',', '.');
      }
      const n = parseFloat(clean);
      return isNaN(n) ? 0 : Math.round(n * 100) / 100;
    };

    const parsed: RawRowData[] = [];
    for (let i = 6; i < lines.length; i++) {
      const r = lines[i];
      if (!r[1] && !r[5]) continue;
      const baku = parseNum(r[7]);
      if (baku <= 0) continue;
      const tgl = r[1] ? r[1].trim() : '';
      const bln = r[2] ? r[2].trim() : '';
      const thn = r[3] ? r[3].trim() : '';
      const varian = r[5] ? r[5].trim() : '';
      const proses = r[6] ? r[6].trim() : 'SKT';
      const hasil = parseNum(r[8]);
      const susutKg = parseNum(r[9]) || Math.round((baku - hasil) * 10) / 10;
      const susutPct = parseNum(r[10]) || (baku > 0 ? Math.round(((susutKg / baku) * 100) * 100) / 100 : 0);
      const gagangKg = parseNum(r[11]);
      const airKg = parseNum(r[12]);
      const debuKg = parseNum(r[13]);
      const debuAirKg = Math.round((airKg + debuKg) * 10) / 10;

      parsed.push({
        srcRow: i + 1,
        batchNo: `TBK-${thn}-${String(i + 1).padStart(4, '0')}`,
        tanggal: tgl,
        bulan: bln,
        tahun: thn,
        jenisTembakau: varian,
        jenisProses: proses,
        baku,
        hasil,
        susutKg,
        susutPct,
        gagangKg,
        airKg,
        debuKg,
        debuAirKg,
        status: 'Selesai'
      });
    }
    return parsed;
  }

  private static parseRawCSVGrid(text: string): string[][] {
    const lines: string[][] = [];
    let currentRow: string[] = [];
    let currentVal = '';
    let insideQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (c === '"') {
        if (insideQuotes && text[i + 1] === '"') {
          currentVal += '"';
          i++;
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (c === ',' && !insideQuotes) {
        currentRow.push(currentVal);
        currentVal = '';
      } else if ((c === '\r' || c === '\n') && !insideQuotes) {
        if (c === '\r' && text[i + 1] === '\n') i++;
        currentRow.push(currentVal);
        lines.push(currentRow);
        currentRow = [];
        currentVal = '';
      } else {
        currentVal += c;
      }
    }
    if (currentRow.length) {
      currentRow.push(currentVal);
      lines.push(currentRow);
    }
    return lines;
  }

  private static parseCSVText(text: string): RawRowData[] {
    const lines = this.parseRawCSVGrid(text);

    const parseNum = (val: string): number => {
      if (!val) return 0;
      let clean = String(val).replace(/Kg/gi, '').replace(/%/gi, '').trim();
      if (clean.includes(',') && clean.includes('.')) {
        clean = clean.replace(/\./g, '').replace(',', '.');
      } else if (clean.includes(',')) {
        clean = clean.replace(',', '.');
      }
      const n = parseFloat(clean);
      return isNaN(n) ? 0 : Math.round(n * 100) / 100;
    };

    const parsed: RawRowData[] = [];
    for (let i = 1; i < lines.length; i++) {
      const r = lines[i];
      if (!r[1]) continue;
      const srcRow = parseInt(r[0], 10) || (11 + i);
      const tanggal = r[1].trim();
      const bulan = r[2].trim();
      const tahun = r[3].trim();
      const jenisTembakau = r[4].trim();
      const jenisProses = r[5].trim();
      const baku = parseNum(r[6]);
      const hasil = parseNum(r[7]);
      const susutKg = parseNum(r[8]) || Math.round((baku - hasil) * 10) / 10;
      const susutPct = parseNum(r[9]) || (baku > 0 ? Math.round(((susutKg / baku) * 100) * 100) / 100 : 0);
      const gagangKg = parseNum(r[10]);
      const debuAirKg = parseNum(r[11]);
      const airKg = Math.round(debuAirKg * 0.6 * 10) / 10;
      const debuKg = Math.round((debuAirKg - airKg) * 10) / 10;

      parsed.push({
        srcRow,
        batchNo: `TBK-${tahun}-${String(srcRow).padStart(4, '0')}`,
        tanggal,
        bulan,
        tahun,
        jenisTembakau,
        jenisProses,
        baku,
        hasil,
        susutKg,
        susutPct,
        gagangKg,
        airKg,
        debuKg,
        debuAirKg,
        status: 'Selesai'
      });
    }
    return parsed;
  }

  /**
   * Filter and aggregate data locally for instant 0.01s responsive calculations
   */
  public static getFilterOptions(rows: RawRowData[]): FilterOptions {
    const tahunSet = new Set<string>();
    const jenisTembakauSet = new Set<string>();
    const jenisProsesSet = new Set<string>();

    rows.forEach(r => {
      if (r.tahun) tahunSet.add(r.tahun);
      if (r.jenisTembakau) jenisTembakauSet.add(r.jenisTembakau);
      if (r.jenisProses) jenisProsesSet.add(r.jenisProses);
    });

    const tahunArr = Array.from(tahunSet).sort((a, b) => b.localeCompare(a));
    const jenisArr = Array.from(jenisTembakauSet).sort();
    const prosesArr = Array.from(jenisProsesSet).sort();

    return {
      tahun: tahunArr,
      bulan: MONTH_NAMES,
      jenisTembakau: jenisArr,
      jenisProses: prosesArr
    };
  }

  public static getEntriTerkini(rows: RawRowData[]): string {
    if (!rows.length) return '-';
    let maxTanggal = rows[0].tanggal;
    for (const r of rows) {
      if (r.tanggal > maxTanggal) maxTanggal = r.tanggal;
    }
    const parts = maxTanggal.split('-');
    if (parts.length < 3) return maxTanggal;
    const tahun = parts[0];
    const bulanIdx = parseInt(parts[1], 10) - 1;
    const hari = parseInt(parts[2], 10);
    const bulanNama = MONTH_NAMES[bulanIdx] || parts[1];
    return `${hari} ${bulanNama} ${tahun}`;
  }

  public static summarize(filtered: RawRowData[], label: string): SummaryKPI {
    let sumBaku = 0;
    let sumHasil = 0;
    let sumSusut = 0;
    let sumGagang = 0;
    let sumDebuAir = 0;
    let minPct = Infinity;
    let maxPct = -Infinity;

    for (const r of filtered) {
      sumBaku += r.baku;
      sumHasil += r.hasil;
      sumSusut += r.susutKg;
      sumGagang += r.gagangKg;
      sumDebuAir += r.debuAirKg;
      if (r.susutPct < minPct) minPct = r.susutPct;
      if (r.susutPct > maxPct) maxPct = r.susutPct;
    }

    const susutPct = sumBaku > 0 ? (sumSusut / sumBaku) * 100 : 0;
    const gagangPct = sumBaku > 0 ? (sumGagang / sumBaku) * 100 : 0;
    const debuAirPct = sumBaku > 0 ? (sumDebuAir / sumBaku) * 100 : 0;

    return {
      jumlahData: filtered.length,
      baku: Math.round(sumBaku * 10) / 10,
      hasil: Math.round(sumHasil * 10) / 10,
      susutKg: Math.round(sumSusut * 10) / 10,
      susutPct: Math.round(susutPct * 100) / 100,
      susutMinPct: minPct === Infinity ? 0 : Math.round(minPct * 100) / 100,
      susutMaxPct: maxPct === -Infinity ? 0 : Math.round(maxPct * 100) / 100,
      gagangKg: Math.round(sumGagang * 10) / 10,
      gagangPct: Math.round(gagangPct * 100) / 100,
      debuAirKg: Math.round(sumDebuAir * 10) / 10,
      debuAirPct: Math.round(debuAirPct * 100) / 100,
      periodeLabel: label
    };
  }

  public static computeRingkasanTahunan(rows: RawRowData[], tahun: string, jenisProses: JenisProsesType): SummaryKPI {
    const filtered = rows.filter(r => {
      if (tahun !== 'Semua' && r.tahun !== tahun) return false;
      if (jenisProses !== 'Semua' && r.jenisProses !== jenisProses) return false;
      return true;
    });
    const label = `${tahun === 'Semua' ? 'Semua Tahun' : tahun}${jenisProses !== 'Semua' ? ` · ${jenisProses}` : ''}`;
    return this.summarize(filtered, label);
  }

  public static computeRingkasanBulanan(rows: RawRowData[], tahun: string, bulan: string, jenisProses: JenisProsesType): SummaryKPI {
    const filtered = rows.filter(r => {
      if (tahun !== 'Semua' && r.tahun !== tahun) return false;
      if (bulan !== 'Semua' && r.bulan !== bulan) return false;
      if (jenisProses !== 'Semua' && r.jenisProses !== jenisProses) return false;
      return true;
    });
    const label = `${bulan !== 'Semua' ? bulan : 'Semua Bulan'} ${tahun !== 'Semua' ? tahun : 'Semua Tahun'}${jenisProses !== 'Semua' ? ` · ${jenisProses}` : ''}`;
    return this.summarize(filtered, label);
  }

  private static monthKey(tahun: string, bulan: string): number {
    const t = parseInt(tahun, 10) || 0;
    const b = (bulan || '').trim();
    const idx = MONTH_NAMES.indexOf(b);
    return t * 12 + (idx >= 0 ? idx : 0);
  }

  public static computeRingkasanPeriode(rows: RawRowData[], p: PeriodeRange, jenisProses: JenisProsesType): SummaryKPI {
    let startKey = this.monthKey(p.tahunMulai, p.bulanMulai);
    let endKey = this.monthKey(p.tahunAkhir, p.bulanAkhir);
    if (endKey < startKey) {
      const tmp = startKey;
      startKey = endKey;
      endKey = tmp;
    }

    const filtered = rows.filter(r => {
      if (jenisProses !== 'Semua' && r.jenisProses !== jenisProses) return false;
      const k = this.monthKey(r.tahun, r.bulan);
      return k >= startKey && k <= endKey;
    });

    const label = `${p.bulanMulai} ${p.tahunMulai} — ${p.bulanAkhir} ${p.tahunAkhir}${jenisProses !== 'Semua' ? ` · ${jenisProses}` : ''}`;
    return this.summarize(filtered, label);
  }

  public static computeRekapBulan(rows: RawRowData[], tahun: string, jenisProses: JenisProsesType): GroupSummary[] {
    const filtered = rows.filter(r => {
      if (tahun !== 'Semua' && r.tahun !== tahun) return false;
      if (jenisProses !== 'Semua' && r.jenisProses !== jenisProses) return false;
      return true;
    });

    const totalBakuSemua = filtered.reduce((acc, r) => acc + r.baku, 0);
    const map = new Map<string, {
      label: string;
      bulan: string;
      tahun: string;
      count: number;
      baku: number;
      hasil: number;
      susutKg: number;
      gagangKg: number;
      debuAirKg: number;
      minPct: number;
      maxPct: number;
    }>();

    for (const r of filtered) {
      const key = `${r.bulan}||${r.tahun}`;
      if (!map.has(key)) {
        map.set(key, {
          label: `${r.bulan} ${r.tahun}`,
          bulan: r.bulan,
          tahun: r.tahun,
          count: 0,
          baku: 0,
          hasil: 0,
          susutKg: 0,
          gagangKg: 0,
          debuAirKg: 0,
          minPct: Infinity,
          maxPct: -Infinity
        });
      }
      const g = map.get(key)!;
      g.count += 1;
      g.baku += r.baku;
      g.hasil += r.hasil;
      g.susutKg += r.susutKg;
      g.gagangKg += r.gagangKg;
      g.debuAirKg += r.debuAirKg;
      if (r.susutPct < g.minPct) g.minPct = r.susutPct;
      if (r.susutPct > g.maxPct) g.maxPct = r.susutPct;
    }

    const list: GroupSummary[] = Array.from(map.values()).map(g => {
      const susutPct = g.baku > 0 ? (g.susutKg / g.baku) * 100 : 0;
      const gagangPct = g.baku > 0 ? (g.gagangKg / g.baku) * 100 : 0;
      const debuAirPct = g.baku > 0 ? (g.debuAirKg / g.baku) * 100 : 0;
      const kapasitasPct = totalBakuSemua > 0 ? (g.baku / totalBakuSemua) * 100 : 0;

      return {
        label: g.label,
        bulan: g.bulan,
        tahun: g.tahun,
        jumlahData: g.count,
        baku: Math.round(g.baku * 10) / 10,
        hasil: Math.round(g.hasil * 10) / 10,
        susutKg: Math.round(g.susutKg * 10) / 10,
        susutPct: Math.round(susutPct * 100) / 100,
        minPct: g.minPct === Infinity ? 0 : Math.round(g.minPct * 100) / 100,
        maxPct: g.maxPct === -Infinity ? 0 : Math.round(g.maxPct * 100) / 100,
        gagangPct: Math.round(gagangPct * 100) / 100,
        debuAirPct: Math.round(debuAirPct * 100) / 100,
        kapasitasPct: Math.round(kapasitasPct * 100) / 100
      };
    });

    return list.sort((a, b) => {
      if (a.tahun !== b.tahun) return (a.tahun || '').localeCompare(b.tahun || '');
      return MONTH_NAMES.indexOf(a.bulan || '') - MONTH_NAMES.indexOf(b.bulan || '');
    });
  }

  public static computeRekapJenisTembakauPeriode(
    rows: RawRowData[],
    p: PeriodeRange,
    jenisProses: JenisProsesType
  ): GroupSummary[] {
    let startKey = this.monthKey(p.tahunMulai, p.bulanMulai);
    let endKey = this.monthKey(p.tahunAkhir, p.bulanAkhir);
    if (endKey < startKey) {
      const tmp = startKey;
      startKey = endKey;
      endKey = tmp;
    }

    const filtered = rows.filter(r => {
      if (jenisProses !== 'Semua' && r.jenisProses !== jenisProses) return false;
      const k = this.monthKey(r.tahun, r.bulan);
      return k >= startKey && k <= endKey;
    });

    const totalBakuSemua = filtered.reduce((acc, r) => acc + r.baku, 0);
    const map = new Map<string, {
      label: string;
      count: number;
      baku: number;
      hasil: number;
      susutKg: number;
      gagangKg: number;
      debuAirKg: number;
      minPct: number;
      maxPct: number;
    }>();

    for (const r of filtered) {
      const key = r.jenisTembakau;
      if (!map.has(key)) {
        map.set(key, {
          label: key,
          count: 0,
          baku: 0,
          hasil: 0,
          susutKg: 0,
          gagangKg: 0,
          debuAirKg: 0,
          minPct: Infinity,
          maxPct: -Infinity
        });
      }
      const g = map.get(key)!;
      g.count += 1;
      g.baku += r.baku;
      g.hasil += r.hasil;
      g.susutKg += r.susutKg;
      g.gagangKg += r.gagangKg;
      g.debuAirKg += r.debuAirKg;
      if (r.susutPct < g.minPct) g.minPct = r.susutPct;
      if (r.susutPct > g.maxPct) g.maxPct = r.susutPct;
    }

    const list: GroupSummary[] = Array.from(map.values()).map(g => {
      const susutPct = g.baku > 0 ? (g.susutKg / g.baku) * 100 : 0;
      const gagangPct = g.baku > 0 ? (g.gagangKg / g.baku) * 100 : 0;
      const debuAirPct = g.baku > 0 ? (g.debuAirKg / g.baku) * 100 : 0;
      const kapasitasPct = totalBakuSemua > 0 ? (g.baku / totalBakuSemua) * 100 : 0;

      return {
        label: g.label,
        jumlahData: g.count,
        baku: Math.round(g.baku * 10) / 10,
        hasil: Math.round(g.hasil * 10) / 10,
        susutKg: Math.round(g.susutKg * 10) / 10,
        susutPct: Math.round(susutPct * 100) / 100,
        minPct: g.minPct === Infinity ? 0 : Math.round(g.minPct * 100) / 100,
        maxPct: g.maxPct === -Infinity ? 0 : Math.round(g.maxPct * 100) / 100,
        gagangPct: Math.round(gagangPct * 100) / 100,
        debuAirPct: Math.round(debuAirPct * 100) / 100,
        kapasitasPct: Math.round(kapasitasPct * 100) / 100
      };
    });

    return list.sort((a, b) => b.baku - a.baku);
  }

  public static computeTrendJenisTembakau(
    rows: RawRowData[],
    tahun: string,
    jenisTembakau: string,
    jenisProses: JenisProsesType
  ): TrendJenisData {
    const filtered = rows.filter(r => {
      if (r.jenisTembakau !== jenisTembakau) return false;
      if (tahun !== 'Semua' && r.tahun !== tahun) return false;
      if (jenisProses !== 'Semua' && r.jenisProses !== jenisProses) return false;
      return true;
    });

    const map = new Map<string, {
      label: string;
      bulan: string;
      tahun: string;
      baku: number;
      hasil: number;
      susutKg: number;
      count: number;
    }>();

    for (const r of filtered) {
      const key = `${r.bulan}||${r.tahun}`;
      if (!map.has(key)) {
        map.set(key, {
          label: `${r.bulan.substring(0, 3)} ${r.tahun}`,
          bulan: r.bulan,
          tahun: r.tahun,
          baku: 0,
          hasil: 0,
          susutKg: 0,
          count: 0
        });
      }
      const g = map.get(key)!;
      g.baku += r.baku;
      g.hasil += r.hasil;
      g.susutKg += r.susutKg;
      g.count += 1;
    }

    const data: GroupSummary[] = Array.from(map.values()).map(g => {
      const susutPct = g.baku > 0 ? (g.susutKg / g.baku) * 100 : 0;
      return {
        label: g.label,
        bulan: g.bulan,
        tahun: g.tahun,
        jumlahData: g.count,
        baku: Math.round(g.baku * 10) / 10,
        hasil: Math.round(g.hasil * 10) / 10,
        susutKg: Math.round(g.susutKg * 10) / 10,
        susutPct: Math.round(susutPct * 100) / 100,
        minPct: 0,
        maxPct: 0,
        gagangPct: 0,
        debuAirPct: 0,
        kapasitasPct: 0
      };
    });

    data.sort((a, b) => {
      if (a.tahun !== b.tahun) return (a.tahun || '').localeCompare(b.tahun || '');
      return MONTH_NAMES.indexOf(a.bulan || '') - MONTH_NAMES.indexOf(b.bulan || '');
    });

    return {
      jenisTembakau,
      data
    };
  }

  public static addNewBatchEntry(entry: Omit<RawRowData, 'srcRow' | 'susutKg' | 'susutPct' | 'debuAirKg'>): RawRowData {
    const raw = this.getRawData();
    const nextRow = raw.length > 0 ? Math.max(...raw.map(r => r.srcRow)) + 1 : 12;
    const susutKg = Math.round((entry.baku - entry.hasil) * 10) / 10;
    const susutPct = entry.baku > 0 ? Math.round(((susutKg / entry.baku) * 100) * 100) / 100 : 0;
    const debuAirKg = Math.round((entry.airKg + entry.debuKg) * 10) / 10;

    const newRecord: RawRowData = {
      ...entry,
      srcRow: nextRow,
      susutKg,
      susutPct,
      debuAirKg
    };

    const updated = [newRecord, ...raw];
    this.saveRawData(updated);
    return newRecord;
  }
}
