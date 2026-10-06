import React, { useState } from 'react';
import { RawRowData, UserRole } from '../types[RekapDataProsesTembakau]';
import { formatKg, formatPct } from '../api[RekapDataProsesTembakau]';
import { Search, Plus, CheckCircle2, Clock, Filter, AlertCircle } from 'lucide-react';

interface DataExplorerProps {
  rows: RawRowData[];
  onAddNewBatch?: (data: any) => void;
  userRole: UserRole;
}

export const DataExplorerRekapDataProsesTembakau: React.FC<DataExplorerProps> = ({
  rows,
  onAddNewBatch,
  userRole
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterJalur, setFilterJalur] = useState<string>('Semua');
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

  const filtered = rows.filter((r) => {
    const matchSearch =
      r.jenisTembakau.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.batchNo && r.batchNo.toLowerCase().includes(searchTerm.toLowerCase())) ||
      r.tanggal.includes(searchTerm);
    const matchJalur = filterJalur === 'Semua' || r.jenisProses === filterJalur;
    return matchSearch && matchJalur;
  });

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
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nomor batch, varian, atau tanggal..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <select
            value={filterJalur}
            onChange={(e) => setFilterJalur(e.target.value)}
            className="text-xs border border-slate-200 rounded-xl px-2.5 py-1.5 bg-white text-slate-700 font-medium focus:outline-none"
          >
            <option value="Semua">Semua Jalur</option>
            <option value="SKT">SKT (Tangan)</option>
            <option value="SKM">SKM (Mesin)</option>
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

      {/* Mobile Swipe Hint */}
      <div className="sm:hidden text-[11px] text-slate-400 italic flex items-center gap-1.5 px-1">
        <span>👉</span>
        <span>Geser tabel ke samping untuk melihat detail batch lengkap</span>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-white shadow-sm">
        <table className="w-full text-xs text-left border-collapse min-w-[760px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <th className="py-3 px-3">Batch & Tanggal</th>
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
            {filtered.map((r, idx) => {
              const isHigh = r.susutPct >= 8.5;
              const isLow = r.susutPct <= 5.5;

              return (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-3">
                    <div className="font-semibold text-slate-800 font-mono text-[11px]">
                      {r.batchNo || `SRC-ROW-${r.srcRow}`}
                    </div>
                    <div className="text-[10px] text-slate-400">{r.tanggal}</div>
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
            })}
          </tbody>
        </table>
      </div>

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
