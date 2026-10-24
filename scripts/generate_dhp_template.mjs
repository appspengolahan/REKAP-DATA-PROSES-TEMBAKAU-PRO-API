import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

// 1. Data Sheet 1: DHP_INPUT_PROSES
const headers = [
  'TIMESTAMP_ENTRI',
  'NO_BATCH',
  'TANGGAL_PROSES',
  'SHIFT',
  'JALUR_PROSES',
  'JENIS_TEMBAKAU',
  'NETTO_BAKU_KG',
  'NETTO_HASIL_KG',
  'SUSUT_KG',
  'SUSUT_PCT',
  'FRAKSI_GAGANG_KG',
  'FRAKSI_AIR_KG',
  'FRAKSI_DEBU_KG',
  'SELISIH_NERACA_KG',
  'OPERATOR_ADMIN',
  'STATUS_PROSES',
  'CATATAN_KENDALA'
];

const rows = [
  headers,
  [
    '2026-10-24 08:30:00',
    'BTH-202610-001',
    '2026-10-24',
    'Shift 1',
    'SKM',
    'Virginia FC',
    1250.00,
    1185.50,
    { f: 'G2-H2' },
    { f: 'IF(G2>0, (G2-H2)/G2, 0)' },
    38.20,
    18.50,
    7.80,
    { f: 'I2-(K2+L2+M2)' },
    'Ahmad Faisal',
    'COMPLETED',
    'Batch normal, kelembaban inlet 13.8%'
  ],
  [
    '2026-10-24 10:45:00',
    'BTH-202610-002',
    '2026-10-24',
    'Shift 1',
    'SKT',
    'Kasturi Super',
    850.00,
    804.20,
    { f: 'G3-H3' },
    { f: 'IF(G3>0, (G3-H3)/G3, 0)' },
    28.50,
    12.30,
    5.00,
    { f: 'I3-(K3+L3+M3)' },
    'Ahmad Faisal',
    'COMPLETED',
    'Sortir gagang halus manual optimal'
  ],
  [
    '2026-10-24 14:15:00',
    'BTH-202610-003',
    '2026-10-24',
    'Shift 2',
    'SKM',
    'Madura Rajang',
    1400.00,
    1326.00,
    { f: 'G4-H4' },
    { f: 'IF(G4>0, (G4-H4)/G4, 0)' },
    44.00,
    21.00,
    9.00,
    { f: 'I4-(K4+L4+M4)' },
    'Budi Santoso',
    'COMPLETED',
    'Kadar air bahan baku sedikit tinggi (14.2%)'
  ],
  [
    '2026-10-24 16:30:00',
    'BTH-202610-004',
    '2026-10-24',
    'Shift 2',
    'SKT',
    'Boyolali Gurih',
    920.00,
    871.50,
    { f: 'G5-H5' },
    { f: 'IF(G5>0, (G5-H5)/G5, 0)' },
    31.00,
    12.50,
    5.00,
    { f: 'I5-(K5+L5+M5)' },
    'Budi Santoso',
    'COMPLETED',
    'Kondisi pisau rajang baru di-asah'
  ],
  [
    '2026-10-24 21:00:00',
    'BTH-202610-005',
    '2026-10-24',
    'Shift 3',
    'SKM',
    'Temanggung Asli',
    1100.00,
    1039.50,
    { f: 'G6-H6' },
    { f: 'IF(G6>0, (G6-H6)/G6, 0)' },
    35.50,
    17.00,
    8.00,
    { f: 'I6-(K6+L6+M6)' },
    'Dian Pratama',
    'COMPLETED',
    'Shift malam lancar, neraca massa seimbang'
  ]
];

const wsDhp = XLSX.utils.aoa_to_sheet(rows);

// Format column widths for Sheet 1
wsDhp['!cols'] = [
  { wch: 20 }, // TIMESTAMP_ENTRI
  { wch: 16 }, // NO_BATCH
  { wch: 15 }, // TANGGAL_PROSES
  { wch: 10 }, // SHIFT
  { wch: 14 }, // JALUR_PROSES
  { wch: 18 }, // JENIS_TEMBAKAU
  { wch: 15 }, // NETTO_BAKU_KG
  { wch: 15 }, // NETTO_HASIL_KG
  { wch: 12 }, // SUSUT_KG
  { wch: 12 }, // SUSUT_PCT
  { wch: 18 }, // FRAKSI_GAGANG_KG
  { wch: 15 }, // FRAKSI_AIR_KG
  { wch: 16 }, // FRAKSI_DEBU_KG
  { wch: 18 }, // SELISIH_NERACA_KG
  { wch: 18 }, // OPERATOR_ADMIN
  { wch: 15 }, // STATUS_PROSES
  { wch: 35 }  // CATATAN_KENDALA
];

// 2. Data Sheet 2: MASTER_DATA
const masterHeaders = [
  'JENIS_TEMBAKAU',
  'JALUR_PROSES',
  'SHIFT',
  'STATUS_PROSES',
  'TOLERANSI_SUSUT_MAX',
  'KETERANGAN'
];

const masterRows = [
  masterHeaders,
  ['Virginia FC', 'SKM', 'Shift 1', 'COMPLETED', 0.052, 'Standar susut maks 5.2%'],
  ['Kasturi Super', 'SKT', 'Shift 2', 'ON-HOLD', 0.055, 'Standar susut maks 5.5%'],
  ['Madura Rajang', 'BLEND-A', 'Shift 3', 'REJECTED', 0.054, 'Standar susut maks 5.4%'],
  ['Boyolali Gurih', 'BLEND-B', '', 'IN-PROGRESS', 0.053, 'Standar susut maks 5.3%'],
  ['Temanggung Asli', '', '', '', 0.056, 'Standar susut maks 5.6%'],
  ['Burley Export', '', '', '', 0.050, 'Standar susut maks 5.0%'],
  ['Blend Signature', '', '', '', 0.052, 'Standar susut maks 5.2%']
];

const wsMaster = XLSX.utils.aoa_to_sheet(masterRows);
wsMaster['!cols'] = [
  { wch: 20 },
  { wch: 15 },
  { wch: 12 },
  { wch: 15 },
  { wch: 22 },
  { wch: 30 }
];

// 3. Data Sheet 3: KAMUS_DATA_WEB_APPS
const specHeaders = ['NAMA_KOLOM', 'TIPE_DATA_DB', 'VALIDASI_WEB_FORM', 'FORMULA_EXCEL', 'DESKRIPSI_DAN_CONTOH'];
const specRows = [
  specHeaders,
  ['TIMESTAMP_ENTRI', 'DATETIME / ISO8601', 'Auto-generated saat klik Simpan', '-', 'Waktu saat data di-submit di form web (cth: 2026-10-24 08:30:00)'],
  ['NO_BATCH', 'VARCHAR(30)', 'Required, Unik, Format regex: ^BTH-\\d{6}-\\d{3}$', '-', 'Nomor batch produksi tembakau (cth: BTH-202610-001)'],
  ['TANGGAL_PROSES', 'DATE (YYYY-MM-DD)', 'Required, Datepicker (max: today)', '-', 'Tanggal pengerjaan fisik di lantai produksi'],
  ['SHIFT', 'VARCHAR(10)', 'Dropdown: Shift 1, Shift 2, Shift 3', '-', 'Shift kerja operasional'],
  ['JALUR_PROSES', 'VARCHAR(20)', 'Dropdown: SKM, SKT, BLEND-A, BLEND-B', '-', 'Jalur mesin atau lantai proses produksi'],
  ['JENIS_TEMBAKAU', 'VARCHAR(50)', 'Dropdown dari Master Data Tembakau', '-', 'Jenis bahan baku tembakau yang diproses'],
  ['NETTO_BAKU_KG', 'DECIMAL(10,2)', 'Required, Min: 0.01, Step: 0.01', '-', 'Berat bersih bahan baku tembakau sebelum diproses'],
  ['NETTO_HASIL_KG', 'DECIMAL(10,2)', 'Required, Min: 0, Must <= NETTO_BAKU_KG', '-', 'Berat bersih tembakau hasil rajangan/proses'],
  ['SUSUT_KG', 'DECIMAL(10,2)', 'Readonly / Auto-computed', '=G2-H2', 'Total kehilangan berat (Baku - Hasil)'],
  ['SUSUT_PCT', 'DECIMAL(6,4)', 'Readonly / Auto-computed (Persentase)', '=IF(G2>0, (G2-H2)/G2, 0)', 'Persentase penyusutan terhadap bahan baku'],
  ['FRAKSI_GAGANG_KG', 'DECIMAL(10,2)', 'Optional, Default: 0', '-', 'Berat gagang tembakau yang dipisahkan'],
  ['FRAKSI_AIR_KG', 'DECIMAL(10,2)', 'Optional, Default: 0 (Moisture loss)', '-', 'Kehilangan bobot akibat penguapan air'],
  ['FRAKSI_DEBU_KG', 'DECIMAL(10,2)', 'Optional, Default: 0 (Filing/Dust)', '-', 'Debu/partikel tembakau yang terhisap dust collector'],
  ['SELISIH_NERACA_KG', 'DECIMAL(10,2)', 'Readonly / Warning jika != 0', '=I2-(K2+L2+M2)', 'Neraca Massa: Susut - (Gagang + Air + Debu). Ideal = 0'],
  ['OPERATOR_ADMIN', 'VARCHAR(50)', 'Dropdown atau Auto dari Akun Login', '-', 'Nama personil/admin yang menginput data'],
  ['STATUS_PROSES', 'VARCHAR(20)', 'Dropdown: COMPLETED, ON-HOLD, REJECTED', '-', 'Status verifikasi QC dan approval supervisor'],
  ['CATATAN_KENDALA', 'TEXT', 'Optional textarea', '-', 'Catatan khusus jika terjadi deviasi atau kendala mesin']
];

const wsSpec = XLSX.utils.aoa_to_sheet(specRows);
wsSpec['!cols'] = [
  { wch: 20 },
  { wch: 20 },
  { wch: 35 },
  { wch: 30 },
  { wch: 50 }
];

// Create workbook
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, wsDhp, 'DHP_INPUT_PROSES');
XLSX.utils.book_append_sheet(wb, wsMaster, 'MASTER_DATA');
XLSX.utils.book_append_sheet(wb, wsSpec, 'KAMUS_DATA_WEB_APPS');

// Ensure destination directories exist
const targetDir = path.resolve('public');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const outputPath = path.join(targetDir, 'TEMPLATE_DHP_TEMBAKAU_ADMIN_PROSES.xlsx');
XLSX.writeFile(wb, outputPath);
console.log('Successfully generated Excel template at:', outputPath);
