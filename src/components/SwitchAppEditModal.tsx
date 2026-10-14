import React, { useState, useEffect } from 'react';
import { X, Check, Globe, Link2, AlertCircle } from 'lucide-react';
import { SwitchAppItem } from '../services/switchAppsService';

interface SwitchAppEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialApp?: SwitchAppItem | null;
  onSave: (appData: {
    name: string;
    url: string;
    desc: string;
    category: 'komoditas' | 'persediaan' | 'lainnya';
    status: 'active' | 'external';
    badge?: string;
  }) => void;
  title: string;
}

export const SwitchAppEditModal: React.FC<SwitchAppEditModalProps> = ({
  isOpen,
  onClose,
  initialApp,
  onSave,
  title
}) => {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState<'komoditas' | 'persediaan' | 'lainnya'>('komoditas');
  const [badge, setBadge] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialApp) {
      setName(initialApp.name);
      setUrl(initialApp.url);
      setDesc(initialApp.desc || '');
      setCategory(initialApp.category);
      setBadge(initialApp.badge || '');
    } else {
      setName('');
      setUrl('https://');
      setDesc('');
      setCategory('komoditas');
      setBadge('Live App');
    }
    setError(null);
  }, [initialApp, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Nama Modul wajib diisi.');
      return;
    }
    if (!url.trim()) {
      setError('URL Link Modul wajib diisi.');
      return;
    }

    // Basic URL format validation if not '#'
    if (url.trim() !== '#' && !url.trim().startsWith('http://') && !url.trim().startsWith('https://')) {
      setError('URL harus diawali dengan http:// atau https://');
      return;
    }

    onSave({
      name: name.trim(),
      url: url.trim(),
      desc: desc.trim(),
      category,
      status: initialApp?.status || (url.trim() === '#' ? 'external' : 'external'),
      badge: badge.trim() || undefined
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">{title}</h3>
              <p className="text-xs text-slate-500">Kelola rincian modul dan alamat URL ekosistem</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Nama Modul */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Nama Modul <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Rekap Proses Blend"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* URL Modul */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              URL Link Modul <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Link2 className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://rekap-data-proses-blend.vercel.app/"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Gunakan tautan URL Vercel / Web App aktif (misal: https://...)
            </p>
          </div>

          {/* Deskripsi */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Deskripsi Singkat Modul
            </label>
            <input
              type="text"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Contoh: Monitoring Komposisi & Yield Formula Blend Pabrik"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Kategori */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Kategori Penempatan
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as 'komoditas' | 'persediaan' | 'lainnya')}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="komoditas">Komoditas Pengolahan (4 Komoditas)</option>
                <option value="persediaan">Monitoring Stock & Sistem PP1</option>
                <option value="lainnya">Modul Ekosistem Lainnya / HR</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Label Badge
              </label>
              <input
                type="text"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                placeholder="Live App / Vercel"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>Simpan Perubahan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
