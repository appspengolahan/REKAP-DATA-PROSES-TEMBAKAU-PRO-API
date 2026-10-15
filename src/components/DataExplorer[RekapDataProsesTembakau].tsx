import React, { useState, useMemo, useEffect } from 'react';
import { RawRowData, UserRole } from '../types[RekapDataProsesTembakau]';
import { formatKg, formatPct } from '../api[RekapDataProsesTembakau]';
import {
  Search,
  Plus,
  CheckCircle2,
  Clock,
  Filter,
  AlertCircle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface DataExplorerProps {
  rows: RawRowData[];
  onAddNewBatch?: (data: any) => void;
  userRole: UserRole;
}

// Helper format hari dan tanggal ke bahasa Indonesia
const HARI_INDONESIA = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const BULAN_INDONESIA = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

function formatHariTanggal(dateStr: string): { full: string; hari: string; tanggal: string } {
  if (!dateStr) return { full: '-', hari: '', tanggal: '-' };
  try {
    const parts = dateStr.trim().split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) {
        const hari = HARI_INDONESIA[d.getDay()];
        const tglStr = `${day} ${BULAN_INDONESIA[month]} ${year}`;
        return {
          hari,
          tanggal: tglStr,
          full: `${hari}, ${tglStr}`
        };
      }
    }

    const slashParts = dateStr.trim().split('/');
    if (slashParts.length === 3) {
      const day = parseInt(slashParts[0], 10);
      const month = parseInt(slashParts[1], 10) - 1;
      const year = parseInt(slashParts[2], 10);
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) {
        const hari = HARI_INDONESIA[d.getDay()];
        const tglStr = `${day} ${BULAN_INDONESIA[month]} ${year}`;
        return {
          hari,
          tanggal: tglStr,
          full: `${hari}, ${tglStr}`
        };
      }
    }

    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const hari = HARI_INDONESIA[d.getDay()];
      const tglStr = `${d.getDate()} ${BULAN_INDONESIA[d.getMonth()]} ${d.getFullYear()}`;
      return {
        hari,
        tanggal: tglStr,
        full: `${hari}, ${tglStr}`
      };
    }
  } catch (e) {
    // ignore
  }
  return { full: dateStr, hari: '', tanggal: dateStr };
}

// Helper parsing tanggal ke timestamp numerik untuk pengurutan akurat
function parseDateValue(dateStr: string): number {
  if (!dateStr) return 0;
  const s = String(dateStr).trim();
  const dashMatch = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (dashMatch) {
    const y = parseInt(dashMatch[1], 10);
    const m = parseInt(dashMatch[2], 10) - 1;
    const d = parseInt(dashMatch[3], 10);
    return new Date(y, m, d).getTime();
  }
  const slashMatch = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (slashMatch) {
    const d = parseInt(slashMatch[1], 10);
    const m = parseInt(slashMatch[2], 10) - 1;
    const y = parseInt(slashMatch[3], 10);
    return new Date(y, m, d).getTime();
  }
  const parsed = new Date(s).getTime();
  return isNaN(parsed) ? 0 : parsed;
}

export const DataExplorerRekapDataProsesTembakau: React.FC<DataExplorerProps> = ({
  rows,
  onAddNewBatch,
  userRole
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterJalur, setFilterJalur] = useState<string>('Semua');
  // Default sort: 'desc' (Terbaru di posisi paling atas, Terlama di posisi paling bawah)
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [pageSize, setPageSize] = useState<number>(50);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [showAddModal, setShowAddModal] = useState(false);

  // New form fields
  const [formTembakau, setFormTembakau] = useState('');
  const [formJalur, setFormJalur] = useState<'SKT' | 'SKM'>('SKT');
  const [formBaku, setFormBaku] = useState('');
  const [formHasil, setFormHasil] = useState('');
  const [formGagang, setFormGagang] = useState('');
  const [formAir, setFormAir] = useState('');
  const [formDebu, setFormDebu] = useState('');
  const [formCatatan, setFormCatatan] = useState('');

  // Reset page to 1 when filters or sort change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterJalur, sortOrder, pageSize]);

  // Urutkan dan filter data: default terbaru berada paling atas
  const sortedAndFiltered = useMemo(() => {
    const searchLower = searchTerm.trim().toLowerCase();
    const result = rows.filter((r) => {
      const dateFormatted = formatHariTanggal(r.tanggal);
      const matchSearch =
        !searchLower ||
        r.jenisTembakau.toLowerCase().includes(searchLower) ||
        (r.batchNo && r.batchNo.toLowerCase().includes(searchLower)) ||
        r.tanggal.includes(searchLower) ||
        dateFormatted.full.toLowerCase().includes(searchLower);
      const matchJalur = filterJalur === 'Semua' || r.jenisProses === filterJalur;
      return matchSearch && matchJalur;
    });

    return result.sort((a, b) => {
      const timeA = parseDateValue(a.tanggal);
      const timeB = parseDateValue(b.tanggal);

      // Primary sort: Hari & Tanggal
      if (timeA !== timeB) {
        return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
      }

      // Secondary sort: Batch / srcRow (Batch terbaru berada di atas untuk hari yang sama)
      const rowA = a.srcRow || 0;
      const rowB = b.srcRow || 0;
      if (rowA !== rowB) {
        return sortOrder === 'desc' ? rowB - rowA : rowA - rowB;
      }

      const batchA = a.batchNo || '';
      const batchB = b.batchNo || '';
      return sortOrder === 'desc'
        ? batchB.localeCompare(batchA, undefined, { numeric: true })
        : batchA.localeCompare(batchB, undefined, { numeric: true });
    });
  }, [rows, searchTerm, filterJalur, sortOrder]);

  // Pagination calculation
  const totalItems = sortedAndFiltered.length;
  const isAll = pageSize === -1;
  const totalPages = isAll ? 1 : Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const displayedRows = useMemo(() => {
    if (isAll) return sortedAndFiltered;
    const startIdx = (safeCurrentPage - 1) * pageSize;
    return sortedAndFiltered.slice(startIdx, startIdx + pageSize);
  }, [sortedAndFiltered, isAll, safeCurrentPage, pageSize]);

  const handleToggleSort = () => {
    setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'));
  };

  const handleSaveNew = (e: React.FormEvent) => {
    e.preventDefault();
    const baku = parseFloat(formBaku) || 0;
    const hasil = parseFloat(formHasil) || 0;
    const gagangKg = parseFloat(formGagang) || 0;
    const airKg = parseFloat(formAir) || 0;
    const debuKg = parseFloat(formDebu) || 0;

    if (!formTembakau || baku <= 0 || hasil <= 0) {
      alert('Mohon isi jenis tembakau dan nilai netto bahan baku serta hasil dengan benar.');
      return;
    }

    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const monthNames = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

    if (onAddNewBatch) {
      onAddNewBatch({
        batchNo: `TBK-${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 900) + 100)}`,
        tanggal: dateStr,
        bulan: monthNames[today.getMonth()],
        tahun: String(today.getFullYear()),
        jenisTembakau: formTembakau,
        jenisProses: formJalur,
        baku,
        hasil,
        gagangKg,
        airKg,
        debuKg,
        status: 'Verifikasi QC',
        catatan: formCatatan || 'Input data mandor operasional PP1'
      });
    }

    setShowAddModal(false);
    setFormTembakau('');
    setFormBaku('');
    setFormHasil('');
    setFormGagang('');
    setFormAir('');
    setFormDebu('');
    setFormCatatan('');
  };

  return (
    <div className="space-y-4">
      {/* Header filter & actions */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Search box */}
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari hari, tanggal, nomor batch, jenis tembakau..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Jalur Filter */}
          <select
            value={filterJalur}
            onChange={(e) => setFilterJalur(e.target.value)}
            className="text-xs border border-slate-200 rounded-xl px-2.5 py-1.5 bg-white text-slate-700 font-medium focus:outline-none"
          >
            <option value="Semua">Semua Jalur</option>
            <option value="SKT">SKT (Tangan)</option>
            <option value="SKM">SKM (Mesin)</option>
          </select>

          {/* Tombol Urutan Periode: Terbaru / Terlama */}
          <button
            type="button"
            onClick={handleToggleSort}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              sortOrder === 'desc'
                ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100/70'
                : 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100/70'
            }`}
            title="Klik untuk membalik urutan data"
          >
            {sortOrder === 'desc' ? (
              <>
                <ArrowDown className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
                <span>Urutan: <strong>Terbaru di Atas</strong></span>
              </>
            ) : (
              <>
                <ArrowUp className="w-3.5 h-3.5 text-amber-600" />
                <span>Urutan: <strong>Terlama di Atas</strong></span>
              </>
            )}
          </button>

          {/* Total data info badge */}
          <div className="hidden lg:flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-600 text-[11px] font-medium">
            <span>Total:</span>
            <span className="font-bold text-slate-800">{totalItems.toLocaleString('id-ID')}</span>
            <span>batch</span>
          </div>
        </div>

        {/* Right side controls: Page size & Add Button */}
        <div className="flex items-center gap-2 justify-end">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="text-[11px]">Baris:</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(parseInt(e.target.value, 10))}
              className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white text-slate-700 font-medium focus:outline-none"
            >
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
              <option value="250">250</option>
              <option value="-1">Semua</option>
            </select>
          </div>

          {/* Add Button for PM & Admin */}
          {(userRole === 'Project Manager' || userRole === 'Admin' || userRole === 'Site Engineer') && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Batch Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Swipe Hint */}
      <div className="sm:hidden text-[11px] text-slate-400 italic flex items-center gap-1.5 px-1">
        <span>👉</span>
        <span>Geser tabel ke samping untuk melihat detail batch lengkap</span>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-white shadow-sm">
        <table className="w-full text-xs text-left border-collapse min-w-[780px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <th
                onClick={handleToggleSort}
                className="py-3 px-3 min-w-[170px] cursor-pointer hover:bg-slate-100/90 transition-colors select-none group"
                title="Klik untuk membalik urutan Hari, Tanggal & Batch"
              >
                <div className="flex items-center gap-1.5">
                  <span>Hari, Tanggal & Batch</span>
                  <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold ${
                    sortOrder === 'desc'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {sortOrder === 'desc' ? 'Terbaru ↓' : 'Terlama ↑'}
                  </span>
                </div>
              </th>
              <th className="py-3 px-3">Jenis Tembakau</th>
              <th className="py-3 px-3">Jalur</th>
              <th className="py-3 px-3 text-right">Baku (Kg)</th>
              <th className="py-3 px-3 text-right">Hasil (Kg)</th>
              <th className="py-3 px-3 text-right">Susut (Kg)</th>
              <th className="py-3 px-3 text-right">Susut (%)</th>
              <th className="py-3 px-3 text-right">Gagang (%)</th>
              <th className="py-3 px-3 text-right">Air+Debu (%)</th>
              <th className="py-3 px-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {displayedRows.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-8 text-center text-slate-400 text-xs italic">
                  Tidak ditemukan data batch yang cocok dengan kriteria pencarian/filter.
                </td>
              </tr>
            ) : (
              displayedRows.map((r, idx) => {
                const isHigh = r.susutPct >= 8.5;
                const isLow = r.susutPct <= 5.5;
                const dateInfo = formatHariTanggal(r.tanggal);

                return (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 min-w-[170px]">
                      {/* Informasi Utama: Hari dan Tanggal (Warna Hitam) */}
                      <div className="font-semibold text-slate-900 text-[11px] leading-snug">
                        {dateInfo.full}
                      </div>
                      {/* Informasi Kedua: Batch (Warna Abu-abu) */}
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5 tracking-tight flex items-center gap-1.5">
                        <span>{r.batchNo || `SRC-ROW-${r.srcRow}`}</span>
                        {r.srcRow && (
                          <span className="text-[9px] text-slate-300 font-sans">
                            (R-{r.srcRow})
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">
                      {r.jenisTembakau}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        r.jenisProses === 'SKT'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {r.jenisProses}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-800 font-mono font-medium">
                      {formatKg(r.baku)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-700 font-mono">
                      {formatKg(r.hasil)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-700 font-mono">
                      {formatKg(r.susutKg)}
                    </td>
                    <td className={`py-2.5 px-3 text-right font-mono font-bold ${
                      isHigh ? 'text-rose-600' : isLow ? 'text-emerald-600' : 'text-slate-800'
                    }`}>
                      {formatPct(r.susutPct)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-amber-700 font-mono">
                      {formatPct((r.baku > 0 ? (r.gagangKg / r.baku) * 100 : 0))}
                    </td>
                    <td className="py-2.5 px-3 text-right text-cyan-700 font-mono">
                      {formatPct((r.baku > 0 ? (r.debuAirKg / r.baku) * 100 : 0))}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        {r.status || 'Selesai'}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls Footer */}
      {totalPages > 1 && !isAll && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 text-xs">
          <div className="text-slate-500 text-xs">
            Menampilkan <strong className="text-slate-800 font-semibold">{((safeCurrentPage - 1) * pageSize) + 1}</strong> -{' '}
            <strong className="text-slate-800 font-semibold">{Math.min(safeCurrentPage * pageSize, totalItems)}</strong> dari{' '}
            <strong className="text-slate-800 font-semibold">{totalItems.toLocaleString('id-ID')}</strong> batch (
            <span className="text-blue-600 font-medium">
              {sortOrder === 'desc' ? 'Periode Terbaru di Atas' : 'Periode Terlama di Atas'}
            </span>
            )
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safeCurrentPage <= 1}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs font-medium"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Sebelumnya</span>
            </button>

            {/* Quick page indicator */}
            <div className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-semibold text-xs">
              Halaman {safeCurrentPage} / {totalPages}
            </div>

            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safeCurrentPage >= totalPages}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs font-medium"
            >
              <span>Berikutnya</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Modal Add Batch */}
      {showAddModal && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6">
            <h3 className="text-base font-bold text-slate-800 mb-1">
              Input Batch Data Proses Tembakau
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Perhitungan Susut (Kg) dan Susut (%) akan dikalkulasikan secara otomatis.
            </p>

            <form onSubmit={handleSaveNew} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Jenis Tembakau
                </label>
                <input
                  type="text"
                  required
                  placeholder="mis. Madura 2023 (HL) R"
                  value={formTembakau}
                  onChange={(e) => setFormTembakau(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jalur Proses
                  </label>
                  <select
                    value={formJalur}
                    onChange={(e) => setFormJalur(e.target.value as any)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:outline-none"
                  >
                    <option value="SKT">SKT (Sigaret Kretek Tangan)</option>
                    <option value="SKM">SKM (Sigaret Kretek Mesin)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Netto Baku (Kg) (1 desimal)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    placeholder="mis. 3200.0"
                    value={formBaku}
                    onChange={(e) => setFormBaku(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Hasil Jadi (Kg) (1 desimal)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    placeholder="mis. 3000.5"
                    value={formHasil}
                    onChange={(e) => setFormHasil(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Gagang (Kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="mis. 80.0"
                    value={formGagang}
                    onChange={(e) => setFormGagang(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Air (Kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="mis. 75.0"
                    value={formAir}
                    onChange={(e) => setFormAir(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Debu (Kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="mis. 35.0"
                    value={formDebu}
                    onChange={(e) => setFormDebu(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan Operasional
                </label>
                <input
                  type="text"
                  placeholder="Kondisi cuaca, mesin, atau kadar air"
                  value={formCatatan}
                  onChange={(e) => setFormCatatan(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm"
                >
                  Simpan Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
