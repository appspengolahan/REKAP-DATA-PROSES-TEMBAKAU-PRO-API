/**
 * Types & Data Contracts for:
 * Monitoring Board — Rekap Data Proses Tembakau
 * Divisi Produksi I - PT Batu Karang
 */

export type JenisProsesType = 'Semua' | 'SKT' | 'SKM';

export type UserRole = 'Project Manager' | 'Site Engineer' | 'Vendor' | 'Client' | 'Admin';

export interface RawRowData {
  srcRow: number;
  batchNo?: string;
  tanggal: string; // yyyy-MM-dd
  bulan: string;   // e.g. "Januari", "Februari"
  tahun: string;   // e.g. "2026"
  jenisPerlakuan?: string;
  jenisTembakau: string; // e.g. "Madura 2023 (HL) R"
  jenisProses: 'SKT' | 'SKM' | string;
  baku: number;    // Netto Baku (Kg)
  hasil: number;   // Netto Hasil (Kg)
  susutKg: number; // Susut (Kg) = baku - hasil
  susutPct: number;// Susut (%) = (susutKg / baku) * 100
  gagangKg: number;// Gagang (Kg)
  airKg: number;   // Air (Kg)
  debuKg: number;  // Debu (Kg)
  debuAirKg: number; // Air + Debu (Kg)
  status?: 'Selesai' | 'On-Process' | 'Verifikasi QC';
  catatan?: string;
}

export interface SummaryKPI {
  jumlahData: number;
  baku: number;      // 1 decimal
  hasil: number;     // 1 decimal
  susutKg: number;   // 1 decimal
  susutPct: number;  // 2 decimals
  susutMinPct: number; // 2 decimals
  susutMaxPct: number; // 2 decimals
  gagangKg?: number;
  gagangPct: number; // 2 decimals
  airPct?: number;   // 2 decimals
  debuPct?: number;  // 2 decimals
  debuAirKg?: number;
  debuAirPct: number;// 2 decimals
  periodeLabel: string;
}

export interface GroupSummary {
  label: string;
  bulan?: string;
  tahun?: string;
  jumlahData: number;
  baku: number;       // 1 decimal
  hasil: number;      // 1 decimal
  susutKg: number;    // 1 decimal
  susutPct: number;   // 2 decimals
  minPct: number;     // 2 decimals
  maxPct: number;     // 2 decimals
  gagangPct: number;  // 2 decimals
  debuAirPct: number; // 2 decimals
  kapasitasPct: number; // 2 decimals (share of total baku)
}

export interface TrendJenisData {
  jenisTembakau: string;
  data: GroupSummary[];
}

export interface FilterOptions {
  tahun: string[];
  bulan: string[];
  jenisTembakau: string[];
  jenisProses: string[];
}

export interface PeriodeRange {
  bulanMulai: string;
  tahunMulai: string;
  bulanAkhir: string;
  tahunAkhir: string;
}

export interface GasConfig {
  apiUrl: string;
  lastSync: string | null;
  status: 'online' | 'offline' | 'syncing' | 'error';
  errorMessage?: string;
}

export interface ServerDashboardPayload {
  status: 'success' | 'error';
  version?: string;
  timestamp?: string;
  filterOptions?: FilterOptions;
  entriTerkini?: string;
  ringkasanTahunan?: SummaryKPI;
  ringkasanBulanan?: SummaryKPI;
  ringkasanPeriode?: SummaryKPI;
  rekapBulan?: GroupSummary[];
  rekapJenisTembakauPeriode?: GroupSummary[];
  trendJenis?: TrendJenisData;
  rawRows?: RawRowData[];
}
