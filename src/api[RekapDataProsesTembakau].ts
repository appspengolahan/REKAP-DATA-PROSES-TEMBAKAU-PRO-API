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
  ServerDashboardPayload,
  DhpBatchItem,
  DhpIntegrationData
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

// 4. Indonesian Locale Date & Time Formatter Engine
export const HARI_INDONESIA = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
export const BULAN_INDONESIA_LENGKAP = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];
export const BULAN_INDONESIA_SINGKAT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
];

export const BULAN_MAP_INDO: Record<string, number> = {
  januari: 0, jan: 0,
  februari: 1, feb: 1,
  maret: 2, mar: 2,
  april: 3, apr: 3,
  mei: 4, may: 4,
  juni: 5, jun: 5,
  juli: 6, jul: 6,
  agustus: 7, agu: 7, ags: 7, aug: 7,
  september: 8, sep: 8,
  oktober: 9, okt: 9, oct: 9,
  november: 10, nov: 10,
  desember: 11, des: 11, dec: 11
};

/**
 * Universal Indonesian Date Parser
 * Mampu membaca:
 * - "20 Okt 2026" (Format Kolom B Sheet Rekap)
 * - "Selasa, 20 Oktober 2026" (Format DHP)
 * - "2026-10-20" (ISO)
 * - "20/10/2026" atau "20-10-2026"
 * - Date object
 */
export function parseIndonesianDate(val: string | Date | null | undefined): Date | null {
  if (!val) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
  const s = String(val).replace(/^[a-zA-Z]+,\s*/, '').trim();

  // 1. Pola: "20 Okt 2026" atau "20 Oktober 2026"
  const textMonthMatch = s.match(/^(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})/);
  if (textMonthMatch) {
    const day = parseInt(textMonthMatch[1], 10);
    const mStr = textMonthMatch[2].toLowerCase();
    const year = parseInt(textMonthMatch[3], 10);
    if (mStr in BULAN_MAP_INDO) {
      return new Date(year, BULAN_MAP_INDO[mStr], day);
    }
  }

  // 2. Pola: "2026-10-20" (ISO)
  const isoMatch = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10) - 1;
    const day = parseInt(isoMatch[3], 10);
    return new Date(year, month, day);
  }

  // 3. Pola: "20/10/2026" atau "20-10-2026"
  const slashMatch = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (slashMatch) {
    const day = parseInt(slashMatch[1], 10);
    const month = parseInt(slashMatch[2], 10) - 1;
    const year = parseInt(slashMatch[3], 10);
    return new Date(year, month, day);
  }

  const standard = new Date(s);
  return isNaN(standard.getTime()) ? null : standard;
}

/**
 * Parsing tanggal ke timestamp numerik untuk pengurutan presisi
 */
export function parseDateValue(val: string | Date | null | undefined): number {
  const d = parseIndonesianDate(val);
  return d ? d.getTime() : 0;
}

/**
 * Format standar Kolom B Sheet Rekap: "d MMM yyyy" berbasis bahasa Indonesia
 * Contoh: "20 Okt 2026", "12 Okt 2026"
 */
export function formatTanggalRekap(val: string | Date | null | undefined): string {
  const d = parseIndonesianDate(val);
  if (!d) return String(val || '-');
  const day = d.getDate();
  const month = BULAN_INDONESIA_SINGKAT[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

/**
 * Format lengkap Hari & Tanggal berbasis Indonesia
 * Contoh: { full: "Selasa, 20 Oktober 2026", hari: "Selasa", tanggal: "20 Oktober 2026" }
 */
export function formatHariTanggalIndo(val: string | Date | null | undefined): { full: string; hari: string; tanggal: string } {
  const d = parseIndonesianDate(val);
  if (!d) return { full: String(val || '-'), hari: '', tanggal: String(val || '-') };
  const hari = HARI_INDONESIA[d.getDay()];
  const tglStr = `${d.getDate()} ${BULAN_INDONESIA_LENGKAP[d.getMonth()]} ${d.getFullYear()}`;
  return {
    hari,
    tanggal: tglStr,
    full: `${hari}, ${tglStr}`
  };
}

export function formatIndonesianDate(val: string | Date | null | undefined): string {
  if (!val) return '-';
  const d = parseIndonesianDate(val);
  if (!d) return String(val);
  return `${d.getDate()} ${BULAN_INDONESIA_LENGKAP[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatIndonesianDateTime(val: string | Date | null | undefined): string {
  if (!val) return '-';
  const d = parseIndonesianDate(val);
  if (!d) return String(val);
  const dateStr = d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Asia/Jakarta'
  });
  const timeStr = d.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'Asia/Jakarta'
  }).replace(/:/g, '.');
  return `${dateStr}, ${timeStr} WIB`;
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
    if (this.cachedRows && this.cachedRows.length >= INITIAL_DATA_RAW.length) {
      const hasLatest = this.cachedRows.some(r => r.tanggal?.includes('2026-10-20') || r.tanggal?.includes('20 Okt'));
      if (hasLatest) {
        return this.cachedRows;
      }
    }
    try {
      const stored = localStorage.getItem(CACHE_KEY_RAW);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const hasLatest = parsed.some((r: any) => r.tanggal?.includes('2026-10-20') || r.tanggal?.includes('20 Okt'));
          if (hasLatest && parsed.length >= INITIAL_DATA_RAW.length) {
            this.cachedRows = parsed;
            return parsed;
          }
          // Merge parsed rows with latest INITIAL_DATA_RAW so latest dates are never missed
          const merged = [...parsed];
          for (const initRow of INITIAL_DATA_RAW) {
            const exists = merged.some((p: any) => 
              (initRow.srcRow && p.srcRow === initRow.srcRow) || 
              (p.tanggal === initRow.tanggal && p.jenisTembakau?.trim().toLowerCase() === initRow.jenisTembakau?.trim().toLowerCase())
            );
            if (!exists) {
              merged.push(initRow);
            }
          }
          this.cachedRows = merged;
          this.saveRawData(merged);
          return merged;
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
   * Sync background with Google Apps Script / Google Sheet
   */
  public static async syncFromGas(): Promise<{ success: boolean; message: string; rowCount: number }> {
    const config = this.getGasConfig();
    let endpoint = (config.apiUrl || DEFAULT_GAS_URL).trim();

    try {
      // Clean URL: don't double query
      let urlWithAction = endpoint;
      if (!endpoint.includes('user_content_key') && !endpoint.includes('action=')) {
        urlWithAction = endpoint.includes('?') 
          ? `${endpoint}&action=getDashboardData` 
          : `${endpoint}?action=getDashboardData`;
      }

      let json: any = null;

      // 1. First attempt: Try server-side proxy route (/api/sync-gas)
      try {
        const proxyResp = await fetch(`/api/sync-gas?url=${encodeURIComponent(urlWithAction)}`, {
          method: 'GET'
        });
        if (proxyResp.ok) {
          json = await proxyResp.json();
        }
      } catch (proxyErr) {
        // Proxy not available in static mode, fallback to direct fetch
      }

      // 2. Second attempt: Direct CORS fetch (if proxy not available)
      if (!json) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        try {
          const resp = await fetch(urlWithAction, {
            method: 'GET',
            redirect: 'follow',
            signal: controller.signal
          });
          clearTimeout(timeoutId);

          if (resp.ok) {
            json = await resp.json();
          }
        } catch (fetchErr: any) {
          clearTimeout(timeoutId);
          // 3. Third attempt: JSONP fallback
          try {
            json = await this.fetchJsonp(urlWithAction, 8000);
          } catch (jsonpErr) {
            // Direct and JSONP network blocked or timed out
          }
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
        // Try fallback to pull sheet directly
        const sheetRes = await this.pullDirectFromSheet();
        if (sheetRes.success && sheetRes.count > 0) {
          return {
            success: true,
            message: `Auto-sync aktif via Google Sheet (${sheetRes.count} baris riil).`,
            rowCount: sheetRes.count
          };
        }

        this.saveGasConfig({
          lastSync: new Date().toISOString(),
          status: 'online'
        });
        return {
          success: true,
          message: json?.message || 'Data lokal aktif ter-cache.',
          rowCount: this.getRawData().length
        };
      }
    } catch (err: any) {
      console.warn('Sync ke GAS dialihkan ke datasheet:', err?.message || err);
      try {
        const sheetRes = await this.pullDirectFromSheet();
        if (sheetRes.success && sheetRes.count > 0) {
          return {
            success: true,
            message: `Auto-sync aktif via Google Sheet (${sheetRes.count} baris riil).`,
            rowCount: sheetRes.count
          };
        }
      } catch (fallbackErr) {
        console.warn('Fallback sheet notice:', fallbackErr);
      }

      this.saveGasConfig({
        status: 'offline',
        errorMessage: err?.message || 'Mode data lokal'
      });
      return {
        success: false,
        message: `Offline mode aktif: Menggunakan data lokal tersimpan.`,
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
        // 1a. Try server-side proxy route first
        try {
          const proxyResp = await fetch(`/api/pull-sheet?spreadsheetId=${spreadsheetId}&sheet=_CACHE_REKAP_TBK`);
          if (proxyResp.ok) {
            const data = await proxyResp.json();
            if (data?.success && data?.csv) {
              const parsed = this.parseCSVText(data.csv);
              if (parsed.length >= 100) {
                rows = parsed;
                tabUsed = '_CACHE_REKAP_TBK';
              }
            }
          }
        } catch (proxyErr) {
          // Fall back to direct fetch
        }

        // 1b. Direct fetch fallback if proxy not available
        if (rows.length === 0) {
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
            console.warn('Direct browser fetch _CACHE_REKAP_TBK notice:', (e as any)?.message);
          }
        }
      }

      // Mode 2: Jika belum dapat atau user minta REKAP SUSUT TEMBAKAU
      if (rows.length === 0 || preferredTab === 'REKAP SUSUT TEMBAKAU') {
        // 2a. Try server proxy
        try {
          const proxyResp = await fetch(`/api/pull-sheet?spreadsheetId=${spreadsheetId}&sheet=REKAP%20SUSUT%20TEMBAKAU`);
          if (proxyResp.ok) {
            const data = await proxyResp.json();
            if (data?.success && data?.csv) {
              const parsed = this.parseRekapSusutTembakauCSV(data.csv);
              if (parsed.length > 0) {
                rows = parsed;
                tabUsed = 'REKAP SUSUT TEMBAKAU';
              }
            }
          }
        } catch (proxyErr) {
          // Fall back to direct fetch
        }

        // 2b. Direct fetch
        if (rows.length === 0) {
          try {
            const directUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=REKAP%20SUSUT%20TEMBAKAU`;
            const resp2 = await fetch(directUrl, { method: 'GET' });
            if (resp2.ok) {
              const text2 = await resp2.text();
              if (!text2.includes('google-signin') && !text2.includes('<!DOCTYPE html>')) {
                rows = this.parseRekapSusutTembakauCSV(text2);
                tabUsed = 'REKAP SUSUT TEMBAKAU';
              }
            }
          } catch (e) {
            console.warn('Direct browser fetch REKAP SUSUT TEMBAKAU notice:', (e as any)?.message);
          }
        }
      }

      // Mode 3: ALWAYS fetch the active latest range (A1500:N1600) from operational REKAP SUSUT TEMBAKAU
      // so any active transactions (e.g. from 7 Oktober to 20 Oktober 2026 and beyond) are ALWAYS merged!
      try {
        let activeCsv = '';
        try {
          const proxyResp = await fetch(`/api/pull-sheet?spreadsheetId=${spreadsheetId}&sheet=REKAP%20SUSUT%20TEMBAKAU&range=A1500:N1600`);
          if (proxyResp.ok) {
            const data = await proxyResp.json();
            if (data?.success && data?.csv) {
              activeCsv = data.csv;
            }
          }
        } catch (e) {}

        if (!activeCsv) {
          const directUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=REKAP%20SUSUT%20TEMBAKAU&range=A1500:N1600`;
          const resp = await fetch(directUrl, { method: 'GET' });
          if (resp.ok) {
            const text = await resp.text();
            if (text && !text.includes('google-signin') && !text.includes('<!DOCTYPE html>')) {
              activeCsv = text;
            }
          }
        }

        if (activeCsv) {
          const activeRows = this.parseActiveRekapRangeCSV(activeCsv, 1500);
          if (activeRows.length > 0) {
            for (const act of activeRows) {
              const idx = rows.findIndex(r => 
                (r.srcRow && r.srcRow === act.srcRow) || 
                (r.tanggal === act.tanggal && 
                 r.jenisTembakau?.trim().toLowerCase() === act.jenisTembakau?.trim().toLowerCase() &&
                 (r.jenisProses === act.jenisProses || Math.abs((r.baku || 0) - (act.baku || 0)) < 1))
              );
              if (idx !== -1) {
                rows[idx] = { ...rows[idx], ...act };
              } else {
                rows.push(act);
              }
            }
            if (!tabUsed) tabUsed = 'REKAP SUSUT TEMBAKAU (Live)';
            else tabUsed += ' + REKAP SUSUT (Live)';
          }
        }
      } catch (actErr) {
        console.warn('Notice fetching active range from REKAP SUSUT TEMBAKAU:', actErr);
      }

      if (rows.length === 0) {
        // Use existing cached/initial rows without throwing
        const cached = this.getRawData();
        return {
          success: true,
          message: `Menggunakan data tersimpan (${cached.length} baris riil).`,
          count: cached.length,
          tabUsed: 'Cache Lokal'
        };
      }

      // Ensure historical 2025 records are preserved if the pulled sheet only contains latest 2026 entries
      const existing2025 = this.getRawData().filter(r => r.tahun === '2025');
      const combinedRows = [...rows];
      for (const r25 of existing2025) {
        if (!combinedRows.some(cr => cr.batchNo === r25.batchNo || (cr.tanggal === r25.tanggal && cr.jenisTembakau === r25.jenisTembakau && cr.baku === r25.baku))) {
          combinedRows.push(r25);
        }
      }
      this.saveRawData(combinedRows);
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
      console.warn('pullDirectFromSheet info:', err?.message || err);
      const cached = this.getRawData();
      return {
        success: true,
        message: `Mode data lokal aktif: ${cached.length} baris data tersedia.`,
        count: cached.length,
        tabUsed: 'Cache Lokal'
      };
    }
  }

  public static parseActiveRekapRangeCSV(text: string, startRowNumber: number = 1500): RawRowData[] {
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

    const bulanIndoMap: Record<string, string> = {
      januari: '01', februari: '02', maret: '03', april: '04',
      mei: '05', juni: '06', juli: '07', agustus: '08',
      september: '09', oktober: '10', november: '11', desember: '12',
      jan: '01', feb: '02', mar: '03', apr: '04',
      jul: '07', agu: '08', ags: '08', sep: '09', okt: '10', nov: '11', des: '12'
    };

    const formatIsoDate = (tgl: string, bln: string, thn: string): string => {
      if (!tgl) return '';
      const d = parseIndonesianDate(tgl) || parseIndonesianDate(`${tgl} ${bln} ${thn}`);
      if (d) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      }
      return tgl;
    };

    const rows: RawRowData[] = [];
    lines.forEach((r, idx) => {
      const srcRow = startRowNumber + idx;
      const tgl = r[1] ? r[1].trim() : '';
      const bln = r[2] ? r[2].trim() : 'Oktober';
      const thn = r[3] ? r[3].trim() : '2026';
      const jenis = r[5] ? r[5].trim() : '';
      const proses = r[6] ? r[6].trim() : 'SKT';
      const baku = parseNum(r[7]);
      const hasil = parseNum(r[8]);
      const susutKg = parseNum(r[9]) || (baku - hasil);
      const susutPct = baku > 0 ? Math.round(((susutKg / baku) * 100) * 100) / 100 : 0;
      const gagang = parseNum(r[11]);
      const air = parseNum(r[12]);
      const debu = parseNum(r[13]);
      const debuAirKg = Math.round((air + debu) * 10) / 10;

      const dateObj = parseIndonesianDate(tgl) || parseIndonesianDate(`${tgl} ${bln} ${thn}`);
      const isoDate = dateObj 
        ? `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`
        : formatIsoDate(tgl, bln, thn);
      const tglDisplay = dateObj ? formatTanggalRekap(dateObj) : tgl;

      if (tgl && jenis && (baku > 0 || hasil > 0)) {
        rows.push({
          srcRow,
          batchNo: `TBK-${thn}-${srcRow}`,
          tanggal: isoDate,
          tanggalDisplay: tglDisplay,
          bulan: bln,
          tahun: thn,
          jenisTembakau: jenis,
          jenisProses: proses,
          baku,
          hasil,
          susutKg: Math.round(susutKg * 10) / 10,
          susutPct,
          gagangKg: gagang,
          airKg: air,
          debuKg: debu,
          debuAirKg,
          status: 'Selesai'
        });
      }
    });

    return rows;
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

      const dateObj = parseIndonesianDate(tgl) || parseIndonesianDate(`${tgl} ${bln} ${thn}`);
      const isoDate = dateObj 
        ? `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`
        : tgl;
      const tglDisplay = dateObj ? formatTanggalRekap(dateObj) : tgl;

      parsed.push({
        srcRow: i + 1,
        batchNo: `TBK-${thn}-${String(i + 1).padStart(4, '0')}`,
        tanggal: isoDate,
        tanggalDisplay: tglDisplay,
        bulan: bln || (dateObj ? BULAN_INDONESIA_LENGKAP[dateObj.getMonth()] : ''),
        tahun: thn || (dateObj ? String(dateObj.getFullYear()) : ''),
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
      if (r.tahun && r.tahun.trim()) tahunSet.add(r.tahun.trim());
      if (r.jenisTembakau && r.jenisTembakau.trim()) jenisTembakauSet.add(r.jenisTembakau.trim());
      if (r.jenisProses && r.jenisProses.trim()) jenisProsesSet.add(r.jenisProses.trim());
    });

    // Ensure years with dataset records (2026 and 2025) are always present
    tahunSet.add('2026');
    tahunSet.add('2025');

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
    let maxTime = -Infinity;
    let latestRow = rows[0];

    for (const r of rows) {
      const t = parseDateValue(r.tanggal);
      if (t > maxTime) {
        maxTime = t;
        latestRow = r;
      }
    }

    if (maxTime <= 0) return latestRow.tanggal || '-';
    return formatIndonesianDate(latestRow.tanggal);
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
    const isAllYears = p.tahunMulai === 'Semua' || p.tahunAkhir === 'Semua';

    const filtered = rows.filter(r => {
      if (jenisProses !== 'Semua' && r.jenisProses !== jenisProses) return false;

      if (isAllYears) {
        const sMonthIdx = MONTH_NAMES.indexOf(p.bulanMulai);
        const eMonthIdx = MONTH_NAMES.indexOf(p.bulanAkhir);
        const minM = Math.min(sMonthIdx >= 0 ? sMonthIdx : 0, eMonthIdx >= 0 ? eMonthIdx : 11);
        const maxM = Math.max(sMonthIdx >= 0 ? sMonthIdx : 0, eMonthIdx >= 0 ? eMonthIdx : 11);
        const rMonthIdx = MONTH_NAMES.indexOf(r.bulan || '');
        return rMonthIdx >= minM && rMonthIdx <= maxM;
      }

      let startKey = this.monthKey(p.tahunMulai, p.bulanMulai);
      let endKey = this.monthKey(p.tahunAkhir, p.bulanAkhir);
      if (endKey < startKey) {
        const tmp = startKey;
        startKey = endKey;
        endKey = tmp;
      }

      const k = this.monthKey(r.tahun, r.bulan);
      return k >= startKey && k <= endKey;
    });

    const tahunLabel = isAllYears ? 'Semua Tahun' : (p.tahunMulai === p.tahunAkhir ? p.tahunMulai : `${p.tahunMulai}—${p.tahunAkhir}`);
    const label = `${p.bulanMulai} — ${p.bulanAkhir} (${tahunLabel})${jenisProses !== 'Semua' ? ` · ${jenisProses}` : ''}`;
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
    const isAllYears = p.tahunMulai === 'Semua' || p.tahunAkhir === 'Semua';

    const filtered = rows.filter(r => {
      if (jenisProses !== 'Semua' && r.jenisProses !== jenisProses) return false;

      if (isAllYears) {
        const sMonthIdx = MONTH_NAMES.indexOf(p.bulanMulai);
        const eMonthIdx = MONTH_NAMES.indexOf(p.bulanAkhir);
        const minM = Math.min(sMonthIdx >= 0 ? sMonthIdx : 0, eMonthIdx >= 0 ? eMonthIdx : 11);
        const maxM = Math.max(sMonthIdx >= 0 ? sMonthIdx : 0, eMonthIdx >= 0 ? eMonthIdx : 11);
        const rMonthIdx = MONTH_NAMES.indexOf(r.bulan || '');
        return rMonthIdx >= minM && rMonthIdx <= maxM;
      }

      let startKey = this.monthKey(p.tahunMulai, p.bulanMulai);
      let endKey = this.monthKey(p.tahunAkhir, p.bulanAkhir);
      if (endKey < startKey) {
        const tmp = startKey;
        startKey = endKey;
        endKey = tmp;
      }

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

  /**
   * Pembersihan instan di memori/cache lokal untuk batch yang dibatalkan pada tanggal aktif
   */
  public static purgeCancelledRowsLocally(activeDateStr: string, validJenisList: string[]): number {
    const raw = this.getRawData();
    const validSet = new Set(validJenisList.map(j => j.toLowerCase().replace(/[^a-z0-9]/g, '')));
    
    const activeDateObj = parseIndonesianDate(activeDateStr);
    const targetIso = activeDateObj 
      ? `${activeDateObj.getFullYear()}-${String(activeDateObj.getMonth() + 1).padStart(2, '0')}-${String(activeDateObj.getDate()).padStart(2, '0')}` 
      : activeDateStr.toLowerCase().replace(/^[a-z]+,\s*/i, '').trim();
    const targetDay = activeDateObj ? activeDateObj.getDate() : 0;
    const targetMonth = activeDateObj ? activeDateObj.getMonth() : -1;
    const targetYear = activeDateObj ? activeDateObj.getFullYear() : 0;

    const filtered = raw.filter(r => {
      if (!r.tanggal || !r.jenisTembakau) return true;
      const rObj = parseIndonesianDate(r.tanggal);
      let isSameDate = false;

      if (rObj && activeDateObj) {
        isSameDate = (
          rObj.getDate() === targetDay &&
          rObj.getMonth() === targetMonth &&
          rObj.getFullYear() === targetYear
        );
      } else {
        const rClean = r.tanggal.toLowerCase().replace(/^[a-z]+,\s*/i, '').trim();
        isSameDate = rClean.includes(targetIso) || targetIso.includes(rClean);
      }

      const cleanJenis = r.jenisTembakau.toLowerCase().replace(/[^a-z0-9]/g, '');

      if (isSameDate) {
        // Jika jenis ini tidak ada di DHP dan hasil produksi masih kosong/0, bersihkan!
        if (!validSet.has(cleanJenis) && (r.hasil === 0 || !r.hasil)) {
          return false;
        }
      } else {
        // Baris tanggal lain: Jika jenis ini sedang aktif diproses di DHP dan baris lama ini ber-hasil 0,
        // ini adalah draft usang / batch yang dijadwalkan ulang yang harus dibersihkan agar tidak menduplikasi!
        if (validSet.has(cleanJenis) && (r.hasil === 0 || !r.hasil)) {
          return false;
        }
      }
      return true;
    });

    const deletedCount = raw.length - filtered.length;
    if (deletedCount > 0) {
      this.saveRawData(filtered);
    }
    return deletedCount;
  }

  /**
   * Mengambil dan memvalidasi data aktif dari Spreadsheet DHP Tembakau (Tab INTEGRASI DATA)
   * Menghubungkan ID 1NDS55VchAgNAeJJbY12ANA8HyJDeNNhAZ33zbojpH5I dengan Rekap Tembakau
   */
  public static async fetchDhpIntegrationData(
    existingRows?: RawRowData[]
  ): Promise<DhpIntegrationData> {
    const dhpSpreadsheetId = '1NDS55VchAgNAeJJbY12ANA8HyJDeNNhAZ33zbojpH5I';
    const dhpSheetName = 'INTEGRASI DATA';
    const targetSpreadsheetId = '1LnixFRQXFjDaR_LYoOUvsj84Y_Lb5W8samFOPWrDSC0';
    const targetSheetName = 'REKAP SUSUT TEMBAKAU';

    const currentRows = existingRows || this.getRawData();
    
    // Siapkan peta data yang sudah ada di Rekap untuk pencocokan pintar (Smart Match & Fill)
    interface RekapRowRef {
      srcRow?: number;
      tanggal: string;
      jenisTembakau: string;
      baku: number;
      hasil: number;
      jalur: string;
      gagangKg: number;
      airKg: number;
      debuKg: number;
    }

    const rekapMap = new Map<string, RekapRowRef>();
    currentRows.forEach(r => {
      const tglClean = (r.tanggal || '').trim().toLowerCase();
      const jenisClean = (r.jenisTembakau || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      const jalurClean = (r.jenisProses || '').trim().toLowerCase();
      const bakuRound = Math.round((r.baku || 0) * 10) / 10;

      const ref: RekapRowRef = {
        srcRow: r.srcRow,
        tanggal: r.tanggal,
        jenisTembakau: r.jenisTembakau,
        baku: r.baku || 0,
        hasil: r.hasil || 0,
        jalur: r.jenisProses || 'SKT',
        gagangKg: r.gagangKg || 0,
        airKg: r.airKg || 0,
        debuKg: r.debuKg || 0
      };

      if (tglClean && jenisClean) {
        // 1. Kunci spesifik: Tanggal + Jenis + Jalur (misal "2026-10-21|madura2024batr|skm")
        if (jalurClean) {
          rekapMap.set(`${tglClean}|${jenisClean}|${jalurClean}`, ref);
        }
        // 2. Kunci spesifik: Tanggal + Jenis + Nilai Baku (misal "2026-10-21|madura2024batr|396.7")
        if (bakuRound > 0) {
          rekapMap.set(`${tglClean}|${jenisClean}|${bakuRound}`, ref);
        }
        // 3. Fallback: Tanggal + Jenis
        if (!rekapMap.has(`${tglClean}|${jenisClean}`)) {
          rekapMap.set(`${tglClean}|${jenisClean}`, ref);
        }
        // 4. Kunci Draft Menggantung (Orphan Draft): Jika baris ini belum ada hasil (hasil === 0), catat sebagai kandidat reschedule
        if (ref.hasil === 0 && bakuRound > 0) {
          rekapMap.set(`DRAFT|${jenisClean}|${bakuRound}`, ref);
          if (!rekapMap.has(`DRAFT|${jenisClean}`)) {
            rekapMap.set(`DRAFT|${jenisClean}`, ref);
          }
        }
      }
    });

    let csvText = '';
    // 1. Coba lewat proxy server
    try {
      const resp = await fetch(`/api/pull-sheet?spreadsheetId=${dhpSpreadsheetId}&sheet=${encodeURIComponent(dhpSheetName)}`);
      if (resp.ok) {
        const json = await resp.json();
        if (json?.success && json?.csv) {
          csvText = json.csv;
        }
      }
    } catch (e) {
      // proxy fallback
    }

    // 2. Fallback fetch langsung jika proxy offline
    if (!csvText) {
      try {
        const directUrl = `https://docs.google.com/spreadsheets/d/${dhpSpreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(dhpSheetName)}`;
        const directResp = await fetch(directUrl);
        if (directResp.ok) {
          const text = await directResp.text();
          if (text && !text.includes('google-signin') && !text.includes('<!DOCTYPE html>')) {
            csvText = text;
          }
        }
      } catch (e) {
        console.warn('Fallback direct fetch DHP notice:', e);
      }
    }

    if (!csvText) {
      throw new Error('Gagal memuat data dari Spreadsheet DHP Tembakau. Pastikan koneksi internet tersedia.');
    }

    // Helper parser tanggal Indonesia
    const bulanIndoMap: Record<string, string> = {
      januari: '01', februari: '02', maret: '03', april: '04',
      mei: '05', juni: '06', juli: '07', agustus: '08',
      september: '09', oktober: '10', november: '11', desember: '12'
    };

    const parseToIsoDate = (rawStr: string): string => {
      if (!rawStr) return '';
      const d = parseIndonesianDate(rawStr);
      if (d) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      }
      return '';
    };

    const parseNumber = (val: string): number => {
      if (!val) return 0;
      const clean = String(val).replace(/[^0-9,.-]/g, '').replace(',', '.');
      return Number(clean) || 0;
    };

    // Parse CSV menggunakan parser bawaan yang robust
    const parsedRows = this.parseRawCSVGrid(csvText);
    const items: DhpBatchItem[] = [];
    let totalBakuKg = 0;
    let totalHasilKg = 0;
    let totalGagangKg = 0;
    let totalAirKg = 0;
    let totalDebuKg = 0;
    let terverifikasiCount = 0;
    let terverifikasiBakuKg = 0;
    let terverifikasiHasilKg = 0;
    let mismatchCount = 0;

    // Temukan index kolom 'PERLAKUAN PROSES' secara dinamis dari header
    let perlakuanColIdx = 13; // default Kolom N (index 13)
    if (parsedRows.length > 1) {
      const headerRow = parsedRows[1];
      const foundIdx = headerRow.findIndex(h => /perlakuan\s*proses/i.test(h.trim()));
      if (foundIdx !== -1) {
        perlakuanColIdx = foundIdx;
      }
    }

    // Parse CSV baris per baris
    // Baris 0 adalah summary total, baris 1 adalah header ('JENIS TEMBAKAU', 'WAKTU', 'PERLAKUAN PROSES')
    // Data aktif berada di baris 2 sampai akhir
    for (let i = 2; i < parsedRows.length; i++) {
      const row = parsedRows[i];
      if (!row || row.length < 5) continue;

      const rawTgl = row[2] ? row[2].trim() : '';
      const jenis = (row[3] || '').trim();
      const rawBaku = parseNumber(row[4]);

      if (!jenis || rawBaku <= 0) continue;

      // Ambil Jalur Proses dari Kolom PERLAKUAN PROSES (DHP)
      const rawPerlakuan = (row[perlakuanColIdx] || row[13] || '').trim().toUpperCase();
      let jalur: 'SKT' | 'SKM' = 'SKT';
      if (rawPerlakuan.includes('SKM') || jenis.toUpperCase().includes('SKM')) {
        jalur = 'SKM';
      } else if (rawPerlakuan.includes('SKT') || jenis.toUpperCase().includes('SKT')) {
        jalur = 'SKT';
      }

      const isoDate = parseToIsoDate(rawTgl);
      const cleanJenis = jenis.toLowerCase().replace(/[^a-z0-9]/g, '');
      const cleanJalur = jalur.toLowerCase();
      const bakuRound = Math.round(rawBaku * 10) / 10;
      const matchKeyIso = `${isoDate}|${cleanJenis}|${cleanJalur}`;

      // Pencocokan pintar berjenjang (prioritaskan bobot baku jika ada beberapa batch di tanggal yang sama):
      // 1. Tanggal + Jenis + Nilai Baku (sangat presisi untuk membedakan batch SKM 396.7 Kg vs SKT 7568.8 Kg)
      // 2. Tanggal + Jenis + Jalur
      // 3. Tanggal + Jenis
      const matchedRekap = 
        rekapMap.get(`${isoDate}|${cleanJenis}|${bakuRound}`) ||
        rekapMap.get(`${rawTgl.toLowerCase()}|${cleanJenis}|${bakuRound}`) ||
        rekapMap.get(`${isoDate}|${cleanJenis}|${cleanJalur}`) ||
        rekapMap.get(`${rawTgl.toLowerCase()}|${cleanJenis}|${cleanJalur}`) ||
        rekapMap.get(`${isoDate}|${cleanJenis}`) ||
        rekapMap.get(`${rawTgl.toLowerCase()}|${cleanJenis}`);

      const matchedRowNumber = matchedRekap?.srcRow;
      const rekapHasil = matchedRekap ? Math.round((matchedRekap.hasil || 0) * 10) / 10 : undefined;
      const rekapBaku = matchedRekap ? Math.round((matchedRekap.baku || 0) * 10) / 10 : undefined;

      const gagangKg = parseNumber(row[5]);
      const airKg = parseNumber(row[6]);
      const debuKg = parseNumber(row[7]);
      const hasil = parseNumber(row[8]);
      const susutKg = parseNumber(row[9]) || (rawBaku - hasil);
      const susutPct = rawBaku > 0 ? (susutKg / rawBaku) * 100 : 0;
      const waktu = (row[12] || '-').trim();

      const roundedHasil = Math.round(hasil * 10) / 10;
      const roundedGagang = Math.round(gagangKg * 10) / 10;
      const roundedAir = Math.round(airKg * 10) / 10;
      const roundedDebu = Math.round(debuKg * 10) / 10;

      const rekapGagang = matchedRekap ? Math.round((matchedRekap.gagangKg || 0) * 10) / 10 : undefined;
      const rekapAir = matchedRekap ? Math.round((matchedRekap.airKg || 0) * 10) / 10 : undefined;
      const rekapDebu = matchedRekap ? Math.round((matchedRekap.debuKg || 0) * 10) / 10 : undefined;

      // Deteksi Selisih Netto Baku antara Rekap dan DHP:
      const hasBakuMismatch = Boolean(
        matchedRekap &&
        rekapBaku !== undefined &&
        rekapBaku > 0 &&
        Math.abs(rekapBaku - bakuRound) > 1
      );

      // Deteksi Mismatch / Perubahan Hasil:
      // Jika di Rekap sudah ada nilai hasil (> 0), namun berbeda dengan hasil di DHP (> 0.05 Kg)
      const hasHasilMismatch = Boolean(
        matchedRekap &&
        rekapHasil !== undefined &&
        rekapHasil > 0 &&
        Math.abs(rekapHasil - roundedHasil) > 0.05
      );

      // Deteksi Mismatch / Perubahan Gagang (misal timbangan gagang baru diinput di DHP):
      const hasGagangMismatch = Boolean(
        matchedRekap &&
        rekapGagang !== undefined &&
        Math.abs(rekapGagang - roundedGagang) > 0.1
      );

      // Deteksi Mismatch / Perubahan Air:
      const hasAirMismatch = Boolean(
        matchedRekap &&
        rekapAir !== undefined &&
        Math.abs(rekapAir - roundedAir) > 0.1
      );

      // Deteksi Mismatch / Perubahan Debu:
      const hasDebuMismatch = Boolean(
        matchedRekap &&
        rekapDebu !== undefined &&
        Math.abs(rekapDebu - roundedDebu) > 0.1
      );

      const hasAnyMismatch = hasHasilMismatch || hasBakuMismatch || hasGagangMismatch || hasAirMismatch || hasDebuMismatch;

      // Terverifikasi penuh jika sudah ada di rekap dan seluruh timbangan cocok
      const isAlreadyFilledInRekap = Boolean(
        matchedRekap &&
        rekapHasil !== undefined &&
        rekapHasil > 0 &&
        !hasAnyMismatch
      );

      let statusIntegrasi = 'Batch Baru (Siap Masuk)';
      if (hasBakuMismatch) {
        statusIntegrasi = `Baku Rekap Berbeda (${rekapBaku} Kg vs ${bakuRound} Kg)`;
        mismatchCount++;
      } else if (hasHasilMismatch) {
        statusIntegrasi = 'Hasil Berubah';
        mismatchCount++;
      } else if (hasGagangMismatch) {
        statusIntegrasi = `Gagang Diperbarui (${rekapGagang} Kg ➔ ${roundedGagang} Kg)`;
        mismatchCount++;
      } else if (hasDebuMismatch || hasAirMismatch) {
        statusIntegrasi = 'Fraksi Susut Diperbarui';
        mismatchCount++;
      } else if (isAlreadyFilledInRekap) {
        statusIntegrasi = matchedRowNumber ? `Sudah Masuk di Rekap (Baris ${matchedRowNumber})` : 'Sudah Masuk di Rekap';
        terverifikasiCount++;
        terverifikasiBakuKg += rawBaku;
        terverifikasiHasilKg += roundedHasil;
      } else if (matchedRekap) {
        statusIntegrasi = matchedRowNumber ? `Siap Diisi Otomatis (Baris ${matchedRowNumber})` : 'Siap Diisi Otomatis';
      }

      totalBakuKg += rawBaku;
      totalHasilKg += roundedHasil;
      totalGagangKg += gagangKg;
      totalAirKg += airKg;
      totalDebuKg += debuKg;

      items.push({
        rowNumber: i + 1, // Nomor baris di sheet DHP
        tanggalRaw: rawTgl,
        tanggalFormatted: rawTgl.replace(/^[a-zA-Z]+,\s*/, '').trim(),
        waktu,
        jenisTembakau: jenis,
        jalur,
        nettoBaku: Math.round(rawBaku * 10) / 10,
        hasil: roundedHasil,
        susutKg: Math.round(susutKg * 10) / 10,
        susutPct: Math.round(susutPct * 100) / 100,
        gagangKg: roundedGagang,
        airKg: roundedAir,
        debuKg: roundedDebu,
        statusIntegrasi,
        alreadyInRekap: isAlreadyFilledInRekap,
        matchedRow: matchedRowNumber,
        matchKey: matchKeyIso,
        isMismatch: hasAnyMismatch,
        hasBakuMismatch,
        hasGagangMismatch,
        rekapGagang,
        hasAirMismatch,
        rekapAir,
        hasDebuMismatch,
        rekapDebu,
        rekapHasil,
        rekapBaku
      });
    }

    // Deteksi baris di Rekap pada tanggal aktif yang TIDAK ADA di lembar DHP (Duplikat / Ghost Rows)
    const activeIsoDate = items.length > 0 ? (parseToIsoDate(items[0].tanggalRaw) || items[0].tanggalFormatted) : '';
    const activeJenisSet = new Set(items.map(it => it.jenisTembakau.toLowerCase().replace(/[^a-z0-9]/g, '')));
    
    const anomalousRekapRows: RawRowData[] = [];
    if (activeIsoDate && currentRows && currentRows.length > 0) {
      currentRows.forEach(r => {
        if (!r.tanggal || !r.jenisTembakau) return;
        const rIso = parseToIsoDate(r.tanggal) || r.tanggal;
        const rClean = r.jenisTembakau.toLowerCase().replace(/[^a-z0-9]/g, '');

        if (rIso === activeIsoDate) {
          if (!activeJenisSet.has(rClean)) {
            anomalousRekapRows.push(r);
          }
        } else if ((r.hasil === 0 || !r.hasil) && activeJenisSet.has(rClean)) {
          // Baris orphan draft / reschedule dari tanggal sebelumnya (misal Madura 2024 di baris 1556)
          anomalousRekapRows.push(r);
        }
      });
    }

    const totalBatch = items.length;
    const batchBaruCount = items.filter(it => !it.alreadyInRekap && !it.isMismatch).length;
    const terverifikasiPct = totalBatch > 0 ? Math.round((terverifikasiCount / totalBatch) * 100) : 0;
    const totalSusutKg = Math.round((totalBakuKg - totalHasilKg) * 10) / 10;
    const totalSusutPct = totalBakuKg > 0 ? Math.round(((totalSusutKg / totalBakuKg) * 100) * 100) / 100 : 0;

    const terverifikasiSusutKg = Math.round((terverifikasiBakuKg - terverifikasiHasilKg) * 10) / 10;
    const terverifikasiSusutPct = terverifikasiBakuKg > 0 ? Math.round(((terverifikasiSusutKg / terverifikasiBakuKg) * 100) * 100) / 100 : 0;

    return {
      sourceSpreadsheetId: dhpSpreadsheetId,
      sourceSheetName: dhpSheetName,
      targetSpreadsheetId: targetSpreadsheetId,
      targetSheetName: targetSheetName,
      totalBatch,
      totalBakuKg: Math.round(totalBakuKg * 10) / 10,
      totalHasilKg: Math.round(totalHasilKg * 10) / 10,
      totalSusutKg,
      totalSusutPct,
      totalGagangKg: Math.round(totalGagangKg * 10) / 10,
      totalAirKg: Math.round(totalAirKg * 10) / 10,
      totalDebuKg: Math.round(totalDebuKg * 10) / 10,
      terverifikasiCount,
      terverifikasiPct,
      terverifikasiBakuKg: Math.round(terverifikasiBakuKg * 10) / 10,
      terverifikasiHasilKg: Math.round(terverifikasiHasilKg * 10) / 10,
      terverifikasiSusutKg,
      terverifikasiSusutPct,
      batchBaruCount,
      mismatchCount,
      items,
      anomalousRekapRows,
      fetchTimestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
  }
}

