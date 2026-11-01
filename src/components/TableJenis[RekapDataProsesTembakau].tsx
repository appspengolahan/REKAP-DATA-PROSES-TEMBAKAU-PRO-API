import React, { useState } from 'react';
import { GroupSummary } from '../types[RekapDataProsesTembakau]';
import { formatKg, formatPct } from '../api[RekapDataProsesTembakau]';
import { Search, Layers, TrendingDown, ArrowUpDown } from 'lucide-react';

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

  const filtered = data.filter((d) =>
    d.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  filtered.sort((a, b) => {
    let diff = 0;
    if (sortBy === 'baku') diff = b.baku - a.baku;
    if (sortBy === 'susutPct') diff = b.susutPct - a.susutPct;
    if (sortBy === 'kapasitasPct') diff = b.kapasitasPct - a.kapasitasPct;
    return sortAsc ? -diff : diff;
  });

  const toggleSort = (col: 'baku' | 'susutPct' | 'kapasitasPct') => {
    if (sortBy === col) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(col);
      setSortAsc(false);
    }
  };

  // Compute table totals
  const totals = React.useMemo(() => {
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
      {/* Search Bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap no-print">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Cari varian tembakau (dari 54 varian)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="text-xs text-slate-500">
          Menampilkan <span className="font-bold text-slate-800">{filtered.length}</span> dari {data.length} varian
        </div>
      </div>

      {/* Mobile Swipe Hint */}
      <div className="sm:hidden text-[11px] text-slate-400 italic flex items-center gap-1.5 px-1">
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
            <p><strong>Dicetak:</strong> {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-sm">
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
            {filtered.map((row, idx) => {
              const rowNo = idx + 1;
              const isSelected = selectedJenisTrend === row.label;
              const isHigh = row.susutPct >= 8.5;
              const isLow = row.susutPct <= 5.5;

              // Check if row falls outside print range
              const isOutOfPrintRange = Boolean(
                printRange && (rowNo < printRange.start || rowNo > printRange.end)
              );

              return (
                <tr 
                  key={idx} 
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
                    <td className="py-2.5 px-3 text-center no-print">
                      <button
                        onClick={() => onSelectJenisTrend(row.label)}
                        className="px-2 py-1 text-[11px] rounded bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 transition-colors font-medium"
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
    </div>
  );
};
