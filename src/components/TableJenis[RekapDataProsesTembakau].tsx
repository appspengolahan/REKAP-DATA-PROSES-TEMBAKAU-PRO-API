import React, { useState, useMemo, useEffect } from 'react';
import { GroupSummary } from '../types[RekapDataProsesTembakau]';
import { formatKg, formatPct, formatTanggalCetakIndo } from '../api[RekapDataProsesTembakau]';
import { Search, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';

interface TableJenisProps {
  data: GroupSummary[];
  onSelectJenisTrend?: (jenis: string) => void;
  selectedJenisTrend?: string;
  printRange?: { start: number; end: number } | null;
  periodeLabel?: string;
  jenisProses?: string;
}

export const TableJenisRekapDataProsesTembakau: React.FC<TableJenisProps> = ({
  data,
  onSelectJenisTrend,
  selectedJenisTrend,
  printRange,
  periodeLabel,
  jenisProses
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'baku' | 'susutPct' | 'kapasitasPct'>('baku');
  const [sortAsc, setSortAsc] = useState(false);
  const [pageSize, setPageSize] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState<number>(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortBy, sortAsc, pageSize]);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const list = q
      ? data.filter((d) => d.label.toLowerCase().includes(q))
      : [...data];

    list.sort((a, b) => {
      let diff = 0;
      if (sortBy === 'baku') diff = b.baku - a.baku;
      if (sortBy === 'susutPct') diff = b.susutPct - a.susutPct;
      if (sortBy === 'kapasitasPct') diff = b.kapasitasPct - a.kapasitasPct;
      return sortAsc ? -diff : diff;
    });
    return list;
  }, [data, searchTerm, sortBy, sortAsc]);

  const toggleSort = (col: 'baku' | 'susutPct' | 'kapasitasPct') => {
    if (sortBy === col) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(col);
      setSortAsc(false);
    }
  };

  // Pagination calculation (otomatis non-aktif saat printRange sedang diterapkan untuk cetak)
  const isAll = pageSize === -1 || Boolean(printRange);
  const totalPages = isAll ? 1 : Math.max(1, Math.ceil(filtered.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageOffset = isAll ? 0 : (safeCurrentPage - 1) * pageSize;

  const displayedRows = useMemo(() => {
    if (isAll) return filtered;
    return filtered.slice(pageOffset, pageOffset + pageSize);
  }, [filtered, isAll, pageOffset, pageSize]);

  // Compute table totals
  const totals = useMemo(() => {
    const totalData = filtered.reduce((acc, r) => acc + (r.jumlahData || 0), 0);
    const totalBaku = filtered.reduce((acc, r) => acc + (r.baku || 0), 0);
    const totalHasil = filtered.reduce((acc, r) => acc + (r.hasil || 0), 0);
    const totalSusutKg = Math.round((totalBaku - totalHasil) * 10) / 10;
    const avgSusutPct = totalBaku > 0 ? (totalSusutKg / totalBaku) * 100 : 0;
    return {
      totalData,
      totalBaku,
      totalHasil,
      totalSusutKg,
      avgSusutPct
    };
  }, [filtered]);

  return (
    <div className="space-y-3">
      {/* Search Bar & Page Size */}
      <div className="flex items-center justify-between gap-2.5 flex-wrap no-print">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari varian tembakau (dari 54 varian)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-2 sm:py-1.5 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2.5 text-xs text-slate-500 ml-auto">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px]">Baris:</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(parseInt(e.target.value, 10))}
              className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 sm:py-1 bg-white text-slate-700 font-medium focus:outline-none"
            >
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="-1">Semua</option>
            </select>
          </div>
          <span>
            Menampilkan <span className="font-bold text-slate-800">{displayedRows.length}</span> dari {filtered.length} varian
          </span>
        </div>
      </div>

      {/* Mobile Swipe Hint */}
      <div className="no-print sm:hidden text-[11px] text-slate-400 italic flex items-center gap-1.5 px-1">
        <span>👉</span>
        <span>Geser tabel ke samping untuk melihat kolom lengkap</span>
      </div>

      {/* Print-Only Header Kop Dokumen Resmi */}
      <div className="print-only mb-4 border-b-2 border-slate-900 pb-2">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-sm font-bold text-slate-900 tracking-tight">PT BATU KARANG — DIVISI PRODUKSI I</h1>
            <p className="text-[10px] text-slate-600">Sistem Monitoring Board — Rekapitulasi Data Proses Kesusutan Tembakau</p>
            <p className="text-xs font-bold text-slate-900 mt-1">Laporan Rekapitulasi per Jenis Tembakau</p>
          </div>
          <div className="text-right text-[9px] text-slate-600 space-y-0.5">
            <p><strong>Periode:</strong> {periodeLabel || 'Semua Periode'}</p>
            <p><strong>Jalur:</strong> {jenisProses || 'Semua Jalur'}</p>
            <p><strong>Dicetak:</strong> {formatTanggalCetakIndo()}</p>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto print:overflow-visible border border-slate-200 rounded-xl bg-white shadow-sm">
        <table className="w-full text-xs text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <th className="py-3 px-3">No</th>
              <th className="py-3 px-3">Jenis Tembakau</th>
              <th className="py-3 px-3 text-right">Data</th>
              <th 
                className="py-3 px-3 text-right cursor-pointer hover:bg-slate-100"
                onClick={() => toggleSort('baku')}
              >
                <span className="inline-flex items-center gap-1">
                  Baku (Kg)
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </span>
              </th>
              <th className="py-3 px-3 text-right">Hasil (Kg)</th>
              <th 
                className="py-3 px-3 text-right cursor-pointer hover:bg-slate-100"
                onClick={() => toggleSort('susutPct')}
              >
                <span className="inline-flex items-center gap-1">
                  Susut (%)
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </span>
              </th>
              <th className="py-3 px-3 text-right">Gagang (%)</th>
              <th className="py-3 px-3 text-right">Air+Debu (%)</th>
              <th 
                className="py-3 px-3 text-right cursor-pointer hover:bg-slate-100"
                onClick={() => toggleSort('kapasitasPct')}
              >
                <span className="inline-flex items-center gap-1">
                  Kapasitas (%)
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </span>
              </th>
              {onSelectJenisTrend && <th className="py-3 px-3 text-center no-print">Aksi</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {displayedRows.map((row, idx) => {
              const rowNo = pageOffset + idx + 1;
              const isSelected = selectedJenisTrend === row.label;
              const isHigh = row.susutPct >= 8.5;
              const isLow = row.susutPct <= 5.5;

              // Check if row falls outside print range
              const isOutOfPrintRange = Boolean(
                printRange && (rowNo < printRange.start || rowNo > printRange.end)
              );

              return (
                <tr 
                  key={row.label} 
                  className={`hover:bg-slate-50/80 transition-colors ${
                    isSelected ? 'bg-amber-50/70' : ''
                  } ${isOutOfPrintRange ? 'print-hidden-row' : ''}`}
                >
                  <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">
                    {rowNo}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-slate-800">
                    <div className="flex items-center gap-1.5">
                      <span>{row.label}</span>
                      {isSelected && (
                        <span className="text-[9px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded-full font-bold no-print">
                          Trend Aktif
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-600 font-mono">
                    {row.jumlahData}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-800 font-mono font-medium">
                    {formatKg(row.baku)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-700 font-mono">
                    {formatKg(row.hasil)}
                  </td>
                  <td className={`py-2.5 px-3 text-right font-mono font-bold ${
                    isHigh ? 'text-rose-600' : isLow ? 'text-emerald-600' : 'text-slate-800'
                  }`}>
                    {formatPct(row.susutPct)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-amber-700 font-mono">
                    {formatPct(row.gagangPct)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-cyan-700 font-mono">
                    {formatPct(row.debuAirPct)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-600 font-mono">
                    {formatPct(row.kapasitasPct)}
                  </td>
                  {onSelectJenisTrend && (
                    <td className="py-2 px-3 text-center no-print">
                      <button
                        onClick={() => onSelectJenisTrend(row.label)}
                        className="px-3 py-2 min-h-[44px] sm:min-h-0 sm:py-1 text-[11px] rounded-lg bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 transition-colors font-medium whitespace-nowrap"
                      >
                        Pilih Trend
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900">
            <tr>
              <td colSpan={2} className="py-3 px-3 text-slate-800 uppercase text-[11px]">
                TOTAL NERACA ({filtered.length} VARIAN)
              </td>
              <td className="py-3 px-3 text-right font-mono text-slate-800">
                {totals.totalData}
              </td>
              <td className="py-3 px-3 text-right font-mono text-slate-900">
                {formatKg(totals.totalBaku)}
              </td>
              <td className="py-3 px-3 text-right font-mono text-slate-900">
                {formatKg(totals.totalHasil)}
              </td>
              <td className="py-3 px-3 text-right font-mono text-blue-700">
                {formatPct(totals.avgSusutPct)}
              </td>
              <td colSpan={2} className="py-3 px-3 text-slate-500 text-[10px] text-center font-normal">
                (Susut: {formatKg(totals.totalSusutKg)})
              </td>
              <td className="py-3 px-3 text-right font-mono text-slate-800">
                100,00%
              </td>
              {onSelectJenisTrend && <td className="no-print"></td>}
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && !isAll && (
        <div className="no-print flex flex-col sm:flex-row items-center justify-between gap-2.5 bg-white p-3 rounded-xl border border-slate-200 text-xs">
          <span className="text-slate-500">
            Varian <strong className="text-slate-800">{pageOffset + 1}</strong> - <strong className="text-slate-800">{Math.min(pageOffset + pageSize, filtered.length)}</strong> dari <strong className="text-slate-800">{filtered.length}</strong>
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safeCurrentPage <= 1}
              className="flex items-center gap-1 px-3 py-2 min-h-[44px] sm:min-h-0 sm:py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Sebelumnya</span>
            </button>
            <div className="px-3 py-2 sm:py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-semibold">
              {safeCurrentPage} / {totalPages}
            </div>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safeCurrentPage >= totalPages}
              className="flex items-center gap-1 px-3 py-2 min-h-[44px] sm:min-h-0 sm:py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
            >
              <span>Berikutnya</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
