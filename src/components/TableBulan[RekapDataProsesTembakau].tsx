import React, { useState, useMemo } from 'react';
import { GroupSummary } from '../types[RekapDataProsesTembakau]';
import { formatKg, formatPct, formatTanggalCetakIndo } from '../api[RekapDataProsesTembakau]';
import { MONTH_NAMES } from '../mockData[RekapDataProsesTembakau]';
import { ArrowDown, ArrowUp } from 'lucide-react';

interface TableBulanProps {
  data: GroupSummary[];
  periodeLabel?: string;
  jenisProses?: string;
}

export const TableBulanRekapDataProsesTembakau: React.FC<TableBulanProps> = React.memo(({ 
  data, 
  periodeLabel, 
  jenisProses 
}) => {
  // Default: 'desc' agar periode bulan & tahun terbaru berada paling atas dan paling lama paling bawah
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const sortedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    return [...data].sort((a, b) => {
      const aMonthIdx = MONTH_NAMES.indexOf(a.bulan || '');
      const aYear = parseInt(a.tahun || '0', 10);
      const aKey = aYear * 12 + (aMonthIdx >= 0 ? aMonthIdx : 0);

      const bMonthIdx = MONTH_NAMES.indexOf(b.bulan || '');
      const bYear = parseInt(b.tahun || '0', 10);
      const bKey = bYear * 12 + (bMonthIdx >= 0 ? bMonthIdx : 0);

      return sortOrder === 'desc' ? bKey - aKey : aKey - bKey;
    });
  }, [data, sortOrder]);

  // Compute neraca total for tfoot
  const totals = useMemo(() => {
    if (!sortedData || sortedData.length === 0) {
      return { totalBatch: 0, totalBaku: 0, totalHasil: 0, susutKg: 0, susutPct: 0, avgGagang: 0, avgDebuAir: 0 };
    }
    const totalBatch = sortedData.reduce((s, it) => s + (it.jumlahData || 0), 0);
    const totalBaku = sortedData.reduce((s, it) => s + (it.baku || 0), 0);
    const totalHasil = sortedData.reduce((s, it) => s + (it.hasil || 0), 0);
    const susutKg = Math.max(0, totalBaku - totalHasil);
    const susutPct = totalBaku > 0 ? (susutKg / totalBaku) * 100 : 0;
    const avgGagang = sortedData.reduce((s, it) => s + it.gagangPct, 0) / sortedData.length;
    const avgDebuAir = sortedData.reduce((s, it) => s + it.debuAirPct, 0) / sortedData.length;
    return { totalBatch, totalBaku, totalHasil, susutKg, susutPct, avgGagang, avgDebuAir };
  }, [sortedData]);

  if (!data || data.length === 0) {
    return (
      <div className="p-8 text-center text-xs text-slate-400">
        Belum ada data bulanan untuk filter ini.
      </div>
    );
  }

  return (
    <div className="space-y-1.5 print:space-y-0">
      {/* Official Document Print Kop */}
      <div className="print-only hidden p-4 mb-3 border-b-2 border-slate-800 bg-slate-50 rounded-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white font-bold flex items-center justify-center text-sm shadow-xs">
              PP1
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 tracking-wider">PT BATU KARANG — DIVISI PRODUKSI I</div>
              <div className="text-sm font-black text-blue-700">LAPORAN REKAPITULASI KESUSUTAN PROSES TEMBAKAU BULANAN</div>
              <div className="text-[10px] text-slate-500 font-medium">
                Sistem Terpadu Rekapitulasi Data Proses (DHP &amp; Sheet Rekap) | Dokumen Resmi Kontrol Mutu
              </div>
            </div>
          </div>
          <div className="text-right text-[10px] text-slate-600">
            <div><strong>Jalur Operasional:</strong> {jenisProses || 'Semua Jalur (SKT & SKM)'}</div>
            <div><strong>Periode Terdata:</strong> {periodeLabel || `${sortedData.length} Bulan Terpilih`}</div>
            <div><strong>Tanggal Cetak:</strong> {formatTanggalCetakIndo()}</div>
          </div>
        </div>
      </div>

      <div className="no-print sm:hidden text-[11px] text-slate-400 italic flex items-center gap-1.5 px-1">
        <span>👉</span>
        <span>Geser tabel ke samping untuk melihat kolom lengkap</span>
      </div>
      <div className="overflow-x-auto print:overflow-visible border border-slate-200 rounded-xl bg-white shadow-sm">
        <table className="w-full text-xs text-left border-collapse min-w-[660px]">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
            <th 
              className="py-3 px-3 cursor-pointer hover:bg-slate-100/90 transition-colors select-none"
              onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
              title={`Klik untuk membalik urutan (${sortOrder === 'desc' ? 'Terbaru di atas' : 'Terlama di atas'})`}
            >
              <div className="flex items-center gap-1.5 text-slate-700">
                <span>Bulan</span>
                <span className="p-0.5 rounded bg-slate-200/80 text-blue-600">
                  {sortOrder === 'desc' ? (
                    <ArrowDown className="w-3 h-3" />
                  ) : (
                    <ArrowUp className="w-3 h-3" />
                  )}
                </span>
                <span className="text-[9px] font-semibold text-blue-600 lowercase hidden sm:inline">
                  ({sortOrder === 'desc' ? 'terbaru di atas' : 'terlama di atas'})
                </span>
              </div>
            </th>
            <th className="py-3 px-3 text-right">Jumlah Data</th>
            <th className="py-3 px-3 text-right">Baku (Kg)</th>
            <th className="py-3 px-3 text-right">Hasil (Kg)</th>
            <th className="py-3 px-3 text-right">Susut (%)</th>
            <th className="py-3 px-3 text-right">Gagang (%)</th>
            <th className="py-3 px-3 text-right">Air+Debu (%)</th>
            <th className="py-3 px-3 text-right">Min (%)</th>
            <th className="py-3 px-3 text-right">Max (%)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {sortedData.map((row, idx) => {
            const isHigh = row.susutPct >= 8.5;
            const isLow = row.susutPct <= 5.5;

            return (
              <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-2.5 px-3 font-semibold text-slate-800">
                  {row.label}
                </td>
                <td className="py-2.5 px-3 text-right text-slate-600 font-mono">
                  {row.jumlahData}
                </td>
                <td className="py-2.5 px-3 text-right text-slate-700 font-mono font-medium">
                  {formatKg(row.baku)}
                </td>
                <td className="py-2.5 px-3 text-right text-slate-700 font-mono font-medium">
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
                <td className="py-2.5 px-3 text-right text-slate-500 font-mono">
                  {formatPct(row.minPct)}
                </td>
                <td className="py-2.5 px-3 text-right text-slate-500 font-mono">
                  {formatPct(row.maxPct)}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot className="border-t-2 border-slate-300 bg-slate-100 font-bold text-slate-800">
          <tr>
            <td className="py-2.5 px-3 uppercase text-[10px] tracking-wider text-slate-700">
              Total Neraca Akumulasi
            </td>
            <td className="py-2.5 px-3 text-right font-mono text-slate-700">
              {totals.totalBatch}
            </td>
            <td className="py-2.5 px-3 text-right font-mono text-slate-900">
              {formatKg(totals.totalBaku)}
            </td>
            <td className="py-2.5 px-3 text-right font-mono text-slate-900">
              {formatKg(totals.totalHasil)}
            </td>
            <td className="py-2.5 px-3 text-right font-mono text-blue-700">
              {formatPct(totals.susutPct)}
            </td>
            <td className="py-2.5 px-3 text-right font-mono text-amber-700">
              {formatPct(totals.avgGagang)}
            </td>
            <td className="py-2.5 px-3 text-right font-mono text-cyan-700">
              {formatPct(totals.avgDebuAir)}
            </td>
            <td colSpan={2} className="py-2.5 px-3 text-right font-mono text-[10px] text-slate-500">
              Susut: {formatKg(totals.susutKg)} Kg
            </td>
          </tr>
        </tfoot>
      </table>
      </div>
    </div>
  );
});
