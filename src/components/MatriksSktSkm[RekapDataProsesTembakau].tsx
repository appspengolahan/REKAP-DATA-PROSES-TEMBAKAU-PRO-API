import React from 'react';
import { RawRowData } from '../types[RekapDataProsesTembakau]';
import { formatKg, formatPct } from '../api[RekapDataProsesTembakau]';
import { GitCompare, Scale, Droplet, Wind, ArrowRight, ShieldCheck, CheckCircle2, Printer, Download } from 'lucide-react';

interface MatriksSktSkmProps {
  rows: RawRowData[];
  selectedTahun: string;
}

export const MatriksSktSkmRekapDataProsesTembakau: React.FC<MatriksSktSkmProps> = ({
  rows,
  selectedTahun
}) => {
  const filtered = rows.filter(r => selectedTahun === 'Semua' || r.tahun === selectedTahun);

  const sktRows = filtered.filter(r => r.jenisProses === 'SKT');
  const skmRows = filtered.filter(r => r.jenisProses === 'SKM');

  const computeMetrics = (data: RawRowData[]) => {
    let baku = 0;
    let hasil = 0;
    let susut = 0;
    let gagang = 0;
    let air = 0;
    let debu = 0;

    for (const r of data) {
      baku += r.baku;
      hasil += r.hasil;
      susut += r.susutKg;
      gagang += r.gagangKg;
      air += r.airKg;
      debu += r.debuKg;
    }

    const susutPct = baku > 0 ? (susut / baku) * 100 : 0;
    const gagangPct = baku > 0 ? (gagang / baku) * 100 : 0;
    const airPct = baku > 0 ? (air / baku) * 100 : 0;
    const debuPct = baku > 0 ? (debu / baku) * 100 : 0;

    return {
      count: data.length,
      baku,
      hasil,
      susut,
      susutPct,
      gagang,
      gagangPct,
      air,
      airPct,
      debu,
      debuPct
    };
  };

  const skt = computeMetrics(sktRows);
  const skm = computeMetrics(skmRows);

  const handleExportPdf = () => {
    const origTitle = document.title;
    document.title = `Matriks_Komparasi_SKT_vs_SKM_Tahun_${selectedTahun}`;
    window.print();
    setTimeout(() => {
      document.title = origTitle;
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* Official Print Header Kop */}
      <div className="print-only hidden p-4 mb-3 border-b-2 border-slate-800 bg-slate-50 rounded-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white font-bold flex items-center justify-center text-sm shadow-xs">
              PP1
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 tracking-wider">PT BATU KARANG — DIVISI PRODUKSI I</div>
              <div className="text-sm font-black text-blue-700">MATRIKS KOMPARASI PROSES DUAL JALUR: SKT VS SKM</div>
              <div className="text-[10px] text-slate-500 font-medium">
                Komparasi Efisiensi Sortasi Tangan vs Rotary Mesin | Terverifikasi ISO-9001
              </div>
            </div>
          </div>
          <div className="text-right text-[10px] text-slate-600">
            <div><strong>Tahun:</strong> {selectedTahun === 'Semua' ? 'Semua Tahun (2025–2026)' : selectedTahun}</div>
            <div><strong>Tanggal Cetak:</strong> {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
          </div>
        </div>
      </div>

      {/* Intro Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/30">
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">
                Matriks Komparasi Dual Jalur: SKT vs SKM
              </h3>
              <p className="text-xs text-slate-400">
                Analisis diferensiasi susut proses &amp; dekomposisi 3 komponen (Gagang, Air, Debu)
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
            Jalur <strong>SKT (Tangan)</strong> memprioritaskan pemisahan sortasi manual dengan toleransi susut rendah (rata-rata 5–6%), sedangkan jalur <strong>SKM (Mesin)</strong> menggunakan rotary berkecepatan tinggi dengan intensitas destemming lebih masif sehingga susut lebih tinggi (rata-rata 7–9%).
          </p>
        </div>

        {/* Dual Actions */}
        <div className="no-print flex items-center gap-2 shrink-0 self-start md:self-center">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            title="Cetak langsung matriks ke printer fisik"
          >
            <Printer className="w-3.5 h-3.5 text-slate-300" />
            <span>Cetak Matriks</span>
          </button>
          <button
            onClick={handleExportPdf}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            title="Export matriks komparasi ke dokumen PDF"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Comparative Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* SKT Card */}
        <div className="bg-white rounded-2xl border-2 border-amber-200/80 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500"></span>
              <h4 className="font-bold text-sm text-slate-900">SKT (Sigaret Kretek Tangan)</h4>
            </div>
            <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2.5 py-0.5 rounded-full">
              {skt.count} Batch
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 font-semibold uppercase">Netto Baku</span>
              <div className="text-sm font-bold text-slate-800 font-mono mt-0.5">{formatKg(skt.baku)}</div>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 font-semibold uppercase">Hasil Jadi</span>
              <div className="text-sm font-bold text-emerald-700 font-mono mt-0.5">{formatKg(skt.hasil)}</div>
            </div>
            <div className="bg-amber-50/80 p-2.5 rounded-xl border border-amber-200">
              <span className="text-[10px] text-amber-700 font-semibold uppercase">Susut (%)</span>
              <div className="text-sm font-bold text-amber-800 font-mono mt-0.5">{formatPct(skt.susutPct)}</div>
            </div>
          </div>

          {/* Breakdown 3 Komponen SKT */}
          <div className="space-y-2.5 pt-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Dekomposisi Kesusutan SKT:
            </span>

            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <Scale className="w-3.5 h-3.5 text-amber-600" />
                  Gagang ({formatKg(skt.gagang)})
                </span>
                <span className="font-mono font-bold text-slate-800">{formatPct(skt.gagangPct)}</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.min(100, skt.gagangPct * 10)}%` }} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <Droplet className="w-3.5 h-3.5 text-cyan-600" />
                  Air Evaporasi ({formatKg(skt.air)})
                </span>
                <span className="font-mono font-bold text-slate-800">{formatPct(skt.airPct)}</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${Math.min(100, skt.airPct * 10)}%` }} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <Wind className="w-3.5 h-3.5 text-purple-600" />
                  Debu ({formatKg(skt.debu)})
                </span>
                <span className="font-mono font-bold text-slate-800">{formatPct(skt.debuPct)}</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full" style={{ width: `${Math.min(100, skt.debuPct * 10)}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* SKM Card */}
        <div className="bg-white rounded-2xl border-2 border-blue-200/80 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-600"></span>
              <h4 className="font-bold text-sm text-slate-900">SKM (Sigaret Kretek Mesin)</h4>
            </div>
            <span className="text-xs bg-blue-100 text-blue-800 font-bold px-2.5 py-0.5 rounded-full">
              {skm.count} Batch
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 font-semibold uppercase">Netto Baku</span>
              <div className="text-sm font-bold text-slate-800 font-mono mt-0.5">{formatKg(skm.baku)}</div>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 font-semibold uppercase">Hasil Jadi</span>
              <div className="text-sm font-bold text-emerald-700 font-mono mt-0.5">{formatKg(skm.hasil)}</div>
            </div>
            <div className="bg-blue-50/80 p-2.5 rounded-xl border border-blue-200">
              <span className="text-[10px] text-blue-700 font-semibold uppercase">Susut (%)</span>
              <div className="text-sm font-bold text-blue-800 font-mono mt-0.5">{formatPct(skm.susutPct)}</div>
            </div>
          </div>

          {/* Breakdown 3 Komponen SKM */}
          <div className="space-y-2.5 pt-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Dekomposisi Kesusutan SKM:
            </span>

            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <Scale className="w-3.5 h-3.5 text-blue-600" />
                  Gagang ({formatKg(skm.gagang)})
                </span>
                <span className="font-mono font-bold text-slate-800">{formatPct(skm.gagangPct)}</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full" style={{ width: `${Math.min(100, skm.gagangPct * 10)}%` }} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <Droplet className="w-3.5 h-3.5 text-cyan-600" />
                  Air Evaporasi ({formatKg(skm.air)})
                </span>
                <span className="font-mono font-bold text-slate-800">{formatPct(skm.airPct)}</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-600 rounded-full" style={{ width: `${Math.min(100, skm.airPct * 10)}%` }} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <Wind className="w-3.5 h-3.5 text-indigo-600" />
                  Debu ({formatKg(skm.debu)})
                </span>
                <span className="font-mono font-bold text-slate-800">{formatPct(skm.debuPct)}</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${Math.min(100, skm.debuPct * 10)}%` }} />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
