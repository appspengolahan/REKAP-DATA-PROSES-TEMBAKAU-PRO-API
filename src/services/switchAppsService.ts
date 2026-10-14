export interface SwitchAppItem {
  id: string;
  name: string;
  desc: string;
  url: string;
  category: 'komoditas' | 'persediaan' | 'lainnya';
  status: 'active' | 'external';
  badge?: string;
  isDefault?: boolean;
  updatedAt?: string;
}

const STORAGE_KEY = 'PP1_SWITCH_APPS_REGISTRY_V1';
const EVENT_NAME = 'pp1_switch_apps_updated';

export const DEFAULT_SWITCH_APPS: SwitchAppItem[] = [
  {
    id: 'app-tembakau',
    name: 'Rekap Proses Tembakau',
    desc: 'Dashboard Kesusutan Proses Tembakau (SKT & SKM) 54 Varian',
    url: 'https://rekap-dataproses-tembakau-pro.vercel.app/',
    category: 'komoditas',
    status: 'active',
    badge: 'Aktif (Sedang Dibuka)',
    isDefault: true
  },
  {
    id: 'app-blend',
    name: 'Rekap Proses Blend',
    desc: 'Monitoring Komposisi & Yield Formula Blend Pabrik',
    url: 'https://rekap-data-proses-blend-pro-api-eng.vercel.app/',
    category: 'komoditas',
    status: 'external',
    badge: 'Live App',
    isDefault: true
  },
  {
    id: 'app-krosok',
    name: 'Rekap Proses Krosok',
    desc: 'Monitoring Grading & Destemming Bahan Baku Krosok',
    url: 'https://rekap-data-krosok-api-phi.vercel.app/',
    category: 'komoditas',
    status: 'external',
    badge: 'Live App',
    isDefault: true
  },
  {
    id: 'app-cengkeh',
    name: 'Rekap Proses Cengkeh',
    desc: 'Kesusutan Sortasi & Pemisahan Gagang Cengkeh',
    url: 'https://rekap-data-proses-cengkeh-pro-api-l.vercel.app/',
    category: 'komoditas',
    status: 'external',
    badge: 'Live App',
    isDefault: true
  },
  {
    id: 'app-stock-pp1',
    name: 'Monitoring Stock Persediaan PP1',
    desc: 'Stok Live 4 Komoditas: Cengkeh, Tembakau, Krosok, Blend',
    url: 'https://monitoring-stock-pp-1-pro-api.vercel.app/',
    category: 'persediaan',
    status: 'external',
    badge: 'Live App',
    isDefault: true
  },
  {
    id: 'app-oee-pabrik',
    name: 'General Monitoring & OEE Pabrik',
    desc: 'Telemetri 4 Lini Mesin Pengolahan, Suhu & Kelembaban (RH)',
    url: '#',
    category: 'persediaan',
    status: 'external',
    badge: 'Modul PP1',
    isDefault: true
  },
  {
    id: 'app-hr-phl',
    name: 'Modul HR Pekerja Harian Lepas (PHL)',
    desc: 'Master NIP PHL, Presensi Mandor, Output Tonase & Upah Borongan',
    url: '#',
    category: 'lainnya',
    status: 'external',
    badge: 'Roadmap PP1',
    isDefault: true
  },
  {
    id: 'app-hr-staff',
    name: 'Modul HR Staff & Karyawan Tetap',
    desc: 'Presensi Geofence GPS 150m, Shift 1-3 & Scoring KPI Bulanan',
    url: '#',
    category: 'lainnya',
    status: 'external',
    badge: 'Roadmap PP1',
    isDefault: true
  }
];

export class SwitchAppsService {
  public static getApps(): SwitchAppItem[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Gagal membaca switch apps dari storage:', e);
    }
    // Return default and save
    this.saveApps(DEFAULT_SWITCH_APPS, false);
    return DEFAULT_SWITCH_APPS;
  }

  public static saveApps(apps: SwitchAppItem[], triggerEvent = true): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
      if (triggerEvent && typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: apps }));
      }
    } catch (e) {
      console.error('Gagal menyimpan switch apps ke storage:', e);
    }
  }

  public static updateApp(id: string, updated: Partial<Omit<SwitchAppItem, 'id'>>): SwitchAppItem[] {
    const list = this.getApps();
    const index = list.findIndex(a => a.id === id);
    if (index !== -1) {
      list[index] = {
        ...list[index],
        ...updated,
        updatedAt: new Date().toISOString()
      };
      this.saveApps(list);
    }
    return list;
  }

  public static addApp(newApp: Omit<SwitchAppItem, 'id'>): SwitchAppItem[] {
    const list = this.getApps();
    const id = `app-custom-${Date.now()}`;
    const item: SwitchAppItem = {
      ...newApp,
      id,
      isDefault: false,
      updatedAt: new Date().toISOString()
    };
    const updatedList = [...list, item];
    this.saveApps(updatedList);
    return updatedList;
  }

  public static deleteApp(id: string): SwitchAppItem[] {
    const list = this.getApps();
    const filtered = list.filter(a => a.id !== id);
    this.saveApps(filtered);
    return filtered;
  }

  public static resetToDefaults(): SwitchAppItem[] {
    this.saveApps(DEFAULT_SWITCH_APPS);
    return DEFAULT_SWITCH_APPS;
  }

  public static subscribe(callback: (apps: SwitchAppItem[]) => void): () => void {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<SwitchAppItem[]>;
      if (customEvent.detail) {
        callback(customEvent.detail);
      } else {
        callback(SwitchAppsService.getApps());
      }
    };
    window.addEventListener(EVENT_NAME, handler);
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEY) {
        callback(SwitchAppsService.getApps());
      }
    });
    return () => {
      window.removeEventListener(EVENT_NAME, handler);
    };
  }
}
