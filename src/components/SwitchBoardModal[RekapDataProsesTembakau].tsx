import React, { useState, useEffect } from 'react';
import { 
  X, 
  ExternalLink, 
  CheckCircle2, 
  Layers, 
  Plus, 
  Edit3, 
  Trash2, 
  RotateCcw, 
  Copy, 
  Check, 
  Globe
} from 'lucide-react';
import { SwitchAppItem, SwitchAppsService } from '../services/switchAppsService';
import { SwitchAppEditModal } from './SwitchAppEditModal';

interface SwitchBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTab?: () => void;
}

export const SwitchBoardModalRekapDataProsesTembakau: React.FC<SwitchBoardModalProps> = ({
  isOpen,
  onClose,
  onNavigateToTab
}) => {
  const [apps, setApps] = useState<SwitchAppItem[]>(() => SwitchAppsService.getApps());
  const [editingApp, setEditingApp] = useState<SwitchAppItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setApps(SwitchAppsService.getApps());
    const unsubscribe = SwitchAppsService.subscribe((updatedApps) => {
      setApps(updatedApps);
    });
    return unsubscribe;
  }, [isOpen]);

  if (!isOpen) return null;

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

  const komoditasApps = apps.filter(a => a.category === 'komoditas');
  const persediaanApps = apps.filter(a => a.category === 'persediaan');
  const lainnyaApps = apps.filter(a => a.category === 'lainnya');

  return (
    <div className="no-print fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-800">
                  Pabrik PP1 — Master Switch Board
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold border border-blue-200">
                  Sinkron Otomatis
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Akses cepat ekosistem aplikasi operasional Divisi Produksi I
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold shadow-sm transition-colors cursor-pointer"
              title="Tambah Modul Baru"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tambah Modul</span>
            </button>
            <button
              onClick={handleResetDefaults}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
              title="Reset ke URL Default"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          {/* Komoditas Pengolahan Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Monitoring Rekap 4 Komoditas
              </h3>
              <span className="text-[11px] text-slate-400">
                {komoditasApps.length} Modul
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {komoditasApps.map((app) => (
                <ModalAppItem
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

          {/* Sistem Sentral Pabrik PP1 & Stock */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Monitoring Stock Persediaan & Sistem Sentral PP1
              </h3>
              <span className="text-[11px] text-slate-400">
                {persediaanApps.length} Modul
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {persediaanApps.map((app) => (
                <ModalAppItem
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

          {/* Ekosistem Lainnya / HR / Kustom */}
          {lainnyaApps.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Modul Terintegrasi Lainnya
                </h3>
                <span className="text-[11px] text-slate-400">
                  {lainnyaApps.length} Modul
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {lainnyaApps.map((app) => (
                  <ModalAppItem
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
        </div>

        {/* Modal Footer */}
        <div className="px-5 sm:px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Identik & Terhubung dengan Tab Sidebar</span>
          </div>
          {onNavigateToTab && (
            <button
              onClick={() => {
                onClose();
                onNavigateToTab();
              }}
              className="text-blue-600 hover:text-blue-800 font-semibold"
            >
              Buka Layar Penuh →
            </button>
          )}
        </div>
      </div>

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

interface ModalAppItemProps {
  app: SwitchAppItem;
  copiedId: string | null;
  onCopyUrl: (id: string, url: string, e: React.MouseEvent) => void;
  onEdit: () => void;
  onDelete: () => void;
}

const ModalAppItem: React.FC<ModalAppItemProps> = ({
  app,
  copiedId,
  onCopyUrl,
  onEdit,
  onDelete
}) => {
  const isActive = app.status === 'active';

  return (
    <div
      className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
        isActive
          ? 'bg-blue-50/70 border-blue-200 ring-2 ring-blue-500/20'
          : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-sm'
      }`}
    >
      <div>
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="min-w-0">
            <h4 className="font-semibold text-xs sm:text-sm text-slate-800 truncate" title={app.name}>
              {app.name}
            </h4>
            <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
              {app.desc || 'Tautan modul operasional'}
            </p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={onEdit}
              className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              title="Edit Nama & URL"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            {!app.isDefault && (
              <button
                onClick={onDelete}
                className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                title="Hapus Modul"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* URL Line */}
        <div className="flex items-center justify-between gap-1.5 py-1 px-2 rounded-lg bg-slate-50 border border-slate-100 text-[10px] font-mono text-slate-500 my-2">
          <span className="truncate" title={app.url}>
            {app.url === '#' ? 'Modul Internal' : app.url}
          </span>
          {app.url !== '#' && (
            <button
              onClick={(e) => onCopyUrl(app.id, app.url, e)}
              className="text-slate-400 hover:text-slate-700 flex-shrink-0"
              title="Salin URL"
            >
              {copiedId === app.id ? (
                <Check className="w-3 h-3 text-emerald-600" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
          )}
        </div>
      </div>

      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
        {isActive ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
            <CheckCircle2 className="w-3 h-3 text-blue-600" />
            Aktif (Sedang Dibuka)
          </span>
        ) : app.url !== '#' ? (
          <a
            href={app.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800"
          >
            <span>Buka</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        ) : (
          <span className="text-[10px] text-slate-400 font-medium italic">
            Roadmap
          </span>
        )}
        <span className="text-[10px] text-slate-400 font-medium">
          {app.badge || 'Live App'}
        </span>
      </div>
    </div>
  );
};
