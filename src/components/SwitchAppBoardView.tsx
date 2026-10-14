import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  ExternalLink, 
  CheckCircle2, 
  Plus, 
  Edit3, 
  Trash2, 
  RotateCcw, 
  Search, 
  Globe, 
  Package, 
  Activity, 
  Users, 
  ShieldAlert, 
  Copy, 
  Check
} from 'lucide-react';
import { SwitchAppItem, SwitchAppsService } from '../services/switchAppsService';
import { SwitchAppEditModal } from './SwitchAppEditModal';

interface SwitchAppBoardViewProps {
  onOpenApp?: (url: string) => void;
}

export const SwitchAppBoardView: React.FC<SwitchAppBoardViewProps> = () => {
  const [apps, setApps] = useState<SwitchAppItem[]>(() => SwitchAppsService.getApps());
  const [searchQuery, setSearchQuery] = useState('');
  const [editingApp, setEditingApp] = useState<SwitchAppItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    // Subscribe to changes triggered from modal or other tabs
    const unsubscribe = SwitchAppsService.subscribe((updatedApps) => {
      setApps(updatedApps);
    });
    return unsubscribe;
  }, []);

  const handleCopyUrl = (id: string, url: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveEdit = (data: {
    name: string;
    url: string;
    desc: string;
    category: 'komoditas' | 'persediaan' | 'lainnya';
    status: 'active' | 'external';
    badge?: string;
  }) => {
    if (editingApp) {
      const updated = SwitchAppsService.updateApp(editingApp.id, data);
      setApps(updated);
      setEditingApp(null);
    }
  };

  const handleSaveAdd = (data: {
    name: string;
    url: string;
    desc: string;
    category: 'komoditas' | 'persediaan' | 'lainnya';
    status: 'active' | 'external';
    badge?: string;
  }) => {
    const updated = SwitchAppsService.addApp(data);
    setApps(updated);
    setIsAddModalOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Hapus modul "${name}" dari Switch App Board?`)) {
      const updated = SwitchAppsService.deleteApp(id);
      setApps(updated);
    }
  };

  const handleResetDefaults = () => {
    if (window.confirm('Kembalikan semua tautan modul ke posisi URL default pabrik?')) {
      const reset = SwitchAppsService.resetToDefaults();
      setApps(reset);
    }
  };

  const filteredApps = apps.filter(app => {
    const matchSearch = 
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.url.toLowerCase().includes(searchQuery.toLowerCase());
    return matchSearch;
  });

  const komoditasApps = filteredApps.filter(a => a.category === 'komoditas');
  const persediaanApps = filteredApps.filter(a => a.category === 'persediaan');
  const lainnyaApps = filteredApps.filter(a => a.category === 'lainnya');

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'komoditas': return Layers;
      case 'persediaan': return Package;
      default: return Activity;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Center */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-2xl shadow-md shadow-amber-500/20 flex-shrink-0">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-slate-800">
                  Switch App Board — Ekosistem PP1
                </h2>
                <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  Sinkron Otomatis
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Pusat navigasi & integrasi 4 komoditas pengolahan tembakau, stok persediaan, dan modul operasional pabrik
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Modul / URL Baru</span>
            </button>
            <button
              onClick={handleResetDefaults}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-semibold transition-colors cursor-pointer"
              title="Kembalikan daftar ke URL default"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Reset Default</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari modul atau URL..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50/50"
            />
          </div>
          <div className="text-xs text-slate-500 flex items-center gap-2 self-start sm:self-auto">
            <span>Total Modul Terdaftar:</span>
            <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-lg">
              {apps.length} Aplikasi
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 1: 4 Komoditas Pengolahan (Utama) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Rekap Proses 4 Komoditas Pengolahan
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            {komoditasApps.length} Modul
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {komoditasApps.map((app) => (
            <AppCard
              key={app.id}
              app={app}
              copiedId={copiedId}
              onCopyUrl={handleCopyUrl}
              onEdit={() => setEditingApp(app)}
              onDelete={() => handleDelete(app.id, app.name)}
            />
          ))}
        </div>
      </div>

      {/* SECTION 2: Monitoring Stock Persediaan & Sistem Sentral Pabrik PP1 */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Monitoring Stock Persediaan & Sistem Sentral Pabrik PP1
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            {persediaanApps.length} Modul
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {persediaanApps.map((app) => (
            <AppCard
              key={app.id}
              app={app}
              copiedId={copiedId}
              onCopyUrl={handleCopyUrl}
              onEdit={() => setEditingApp(app)}
              onDelete={() => handleDelete(app.id, app.name)}
            />
          ))}
        </div>
      </div>

      {/* SECTION 3: Modul Ekosistem Tambahan (HR / Roadmap / Kustom) */}
      {lainnyaApps.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-500"></div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Modul Ekosistem & Roadmap Terintegrasi
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-medium">
              {lainnyaApps.length} Modul
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lainnyaApps.map((app) => (
              <AppCard
                key={app.id}
                app={app}
                copiedId={copiedId}
                onCopyUrl={handleCopyUrl}
                onEdit={() => setEditingApp(app)}
                onDelete={() => handleDelete(app.id, app.name)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingApp && (
        <SwitchAppEditModal
          isOpen={true}
          onClose={() => setEditingApp(null)}
          initialApp={editingApp}
          onSave={handleSaveEdit}
          title={`Edit Modul: ${editingApp.name}`}
        />
      )}

      {/* Add New Modal */}
      {isAddModalOpen && (
        <SwitchAppEditModal
          isOpen={true}
          onClose={() => setIsAddModalOpen(false)}
          initialApp={null}
          onSave={handleSaveAdd}
          title="Tambah Link URL & Modul Baru"
        />
      )}
    </div>
  );
};

interface AppCardProps {
  app: SwitchAppItem;
  copiedId: string | null;
  onCopyUrl: (id: string, url: string, e: React.MouseEvent) => void;
  onEdit: () => void;
  onDelete: () => void;
}

const AppCard: React.FC<AppCardProps> = ({
  app,
  copiedId,
  onCopyUrl,
  onEdit,
  onDelete
}) => {
  const isActive = app.status === 'active';

  return (
    <div
      className={`rounded-2xl border p-4 sm:p-5 transition-all relative flex flex-col justify-between ${
        isActive
          ? 'bg-gradient-to-br from-blue-50/90 to-indigo-50/50 border-blue-300 ring-2 ring-blue-500/20 shadow-sm'
          : 'bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-md'
      }`}
    >
      <div>
        {/* Card Header */}
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-bold text-sm sm:text-base text-slate-800">
                {app.name}
              </h4>
              {isActive ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200">
                  <CheckCircle2 className="w-3 h-3 text-blue-600" />
                  Aktif (Sedang Dibuka)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                  {app.badge || 'Live App'}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
              {app.desc || 'Tautan modul sistem operasional'}
            </p>
          </div>

          {/* Action Icons */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={onEdit}
              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              title="Edit Nama Modul & URL"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            {!app.isDefault && (
              <button
                onClick={onDelete}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                title="Hapus Modul Kustom"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* URL Display Bar */}
        <div className="mt-3 py-1.5 px-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2 text-xs font-mono text-slate-600">
          <span className="truncate text-[11px] text-slate-500" title={app.url}>
            {app.url === '#' ? 'Tersedia di Jaringan Lokal Pabrik' : app.url}
          </span>
          {app.url !== '#' && (
            <button
              onClick={(e) => onCopyUrl(app.id, app.url, e)}
              className="p-1 text-slate-400 hover:text-slate-700 transition-colors flex-shrink-0"
              title="Salin URL"
            >
              {copiedId === app.id ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Card Footer Button */}
      <div className="mt-4 pt-3 border-t border-slate-100/80 flex items-center justify-between">
        <span className="text-[11px] text-slate-400">
          {app.category === 'komoditas' ? 'Divisi Produksi I' : 'Ekosistem Pabrik PP1'}
        </span>
        {isActive ? (
          <div className="inline-flex items-center gap-1 text-xs font-bold text-blue-600">
            <span>Aplikasi Saat Ini</span>
          </div>
        ) : app.url !== '#' ? (
          <a
            href={app.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all hover:gap-2"
          >
            <span>Buka Modul</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        ) : (
          <span className="text-xs text-slate-400 font-semibold italic">
            Dalam Pengembangan
          </span>
        )}
      </div>
    </div>
  );
};
