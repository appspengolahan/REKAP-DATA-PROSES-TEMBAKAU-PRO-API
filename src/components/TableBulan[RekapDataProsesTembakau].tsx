import React from 'react';
import { GroupSummary } from '../types[RekapDataProsesTembakau]';
import { formatKg, formatPct } from '../api[RekapDataProsesTembakau]';
import { FileSpreadsheet, ArrowUpDown } from 'lucide-react';

interface TableBulanProps {
  data: GroupSummary[];
}

export const TableBulanRekapDataProsesTembakau: React.FC<TableBulanProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="p-8 text-center text-xs text-slate-400">
        Belum ada data bulanan untuk filter ini.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
            <th className="py-3 px-3">Bulan</th>
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
          {data.map((row, idx) => {
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
      </table>
    </div>
  );
};
