export interface FactoryLocationPreset {
  id: string;
  name: string;
  region: string;
  address?: string;
  lat: number;
  lon: number;
  isDefault?: boolean;
}

export const FACTORY_LOCATIONS: FactoryLocationPreset[] = [
  {
    id: 'batu-karang-malang',
    name: 'PT BATU KARANG (Pabrik Sentral Wagir)',
    region: 'Kab. Malang, Jawa Timur',
    address: 'Jl. Parangargo No.153, Genengan, Parangargo, Kec. Wagir, Kabupaten Malang, Jawa Timur 65158',
    lat: -8.0175,
    lon: 112.5939,
    isDefault: true
  },
  { id: 'bojonegoro', name: 'Unit Bojonegoro (BKR)', region: 'Jawa Timur', lat: -7.15, lon: 111.88 },
  { id: 'weleri', name: 'Unit Kendal / Weleri (HK)', region: 'Jawa Tengah', lat: -6.97, lon: 110.06 },
  { id: 'ploso', name: 'Unit Jombang / Ploso (MYN)', region: 'Jawa Timur', lat: -7.45, lon: 112.23 },
  { id: 'paiton', name: 'Unit Probolinggo / Paiton (BWN)', region: 'Jawa Timur', lat: -7.71, lon: 113.50 },
  { id: 'madura', name: 'Unit Madura / Pamekasan (BAT)', region: 'Jawa Timur', lat: -7.16, lon: 113.48 },
  { id: 'semarang', name: 'Unit Semarang / PP1 Sentral', region: 'Jawa Tengah', lat: -6.99, lon: 110.42 },
  { id: 'kudus', name: 'Unit Kudus / Pantura', region: 'Jawa Tengah', lat: -6.80, lon: 110.84 },
  { id: 'temanggung', name: 'Unit Temanggung / Sindoro', region: 'Jawa Tengah', lat: -7.31, lon: 110.17 },
  { id: 'boyolali', name: 'Unit Boyolali / Merapi', region: 'Jawa Tengah', lat: -7.53, lon: 110.59 }
];

export interface HygroIndex {
  status: 'Kering & Panas' | 'Optimal' | 'Lembab / Hujan' | 'Panas Ekstrem';
  badgeColor: string;
  badgeBg: string;
  badgeBorder: string;
  potensiPenguapan: 'Tinggi' | 'Normal' | 'Rendah';
  resikoDebu: 'Tinggi' | 'Normal' | 'Rendah';
  analisisKorelasi: string;
  rekomendasiOperasional: string;
}

export interface RealtimeWeatherData {
  location: FactoryLocationPreset;
  temperature: number; // °C
  humidity: number;    // % RH
  weatherCode: number;
  weatherDesc: string;
  windSpeed: number;   // km/h
  isDay: boolean;
  fetchedAt: string;
  hygroIndex: HygroIndex;
}

const STORAGE_KEY_LOCATION = 'PP1_ACTIVE_FACTORY_LOCATION_ID';
const STORAGE_KEY_WEATHER_CACHE = 'PP1_WEATHER_CACHE_DATA_V1';

export class WeatherService {
  public static getSelectedLocation(): FactoryLocationPreset {
    try {
      const savedId = localStorage.getItem(STORAGE_KEY_LOCATION);
      // Jika belum diset atau masih menggunakan default lama, prioritaskan PT BATU KARANG Wagir Malang
      if (savedId && savedId !== 'weleri') {
        const found = FACTORY_LOCATIONS.find(loc => loc.id === savedId);
        if (found) return found;
      }
    } catch (e) {
      // fallback
    }
    return FACTORY_LOCATIONS[0]; // default: PT BATU KARANG (Wagir, Malang)
  }

  public static setSelectedLocation(id: string): void {
    try {
      localStorage.setItem(STORAGE_KEY_LOCATION, id);
    } catch (e) {
      console.warn('Gagal menyimpan lokasi pabrik:', e);
    }
  }

  public static decodeWeatherCode(code: number): string {
    switch (code) {
      case 0: return 'Cerah Terang';
      case 1: return 'Sebagian Besar Cerah';
      case 2: return 'Cerah Berawan';
      case 3: return 'Mendung / Berawan Tebal';
      case 45: case 48: return 'Berkabut';
      case 51: case 53: case 55: return 'Gerimis Ringan';
      case 61: case 63: return 'Hujan Sedang';
      case 65: return 'Hujan Deras';
      case 80: case 81: case 82: return 'Hujan Lokal Singkat';
      case 95: case 96: case 99: return 'Hujan Disertai Petir';
      default: return 'Cerah Berawan';
    }
  }

  public static computeHygroIndex(temp: number, rh: number, weatherCode: number): HygroIndex {
    const isRaining = [51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99].includes(weatherCode);

    if (temp >= 33 || (temp >= 31 && rh <= 52)) {
      return {
        status: 'Panas Ekstrem',
        badgeColor: 'text-rose-300',
        badgeBg: 'bg-rose-950/70',
        badgeBorder: 'border-rose-600/60',
        potensiPenguapan: 'Tinggi',
        resikoDebu: 'Tinggi',
        analisisKorelasi: `Suhu sangat tinggi (${temp.toFixed(1)}°C) dengan RH rendah (${rh}%) memicu tarikan evaporasi uap air agresif dan membuat daun tembakau rapuh sehingga fraksi debu cyclone berpotensi naik +0.4% s.d +0.8%.`,
        rekomendasiOperasional: 'Kurangi hisapan damper siklon pengering sebesar 5-10% dan percepat siklus transfer bahan di ban berjalan.'
      };
    }

    if (temp >= 30.5 || rh <= 58) {
      return {
        status: 'Kering & Panas',
        badgeColor: 'text-amber-300',
        badgeBg: 'bg-amber-950/70',
        badgeBorder: 'border-amber-600/60',
        potensiPenguapan: 'Tinggi',
        resikoDebu: 'Tinggi',
        analisisKorelasi: `Kondisi udara kering (${rh}% RH) mempercepat pelepasan kadar air alami ke lingkungan. Susut fraksi air berpotensi naik di atas acuan rata-rata.`,
        rekomendasiOperasional: 'Pantau suhu tabung drying silinder agar tidak melebihi setpoint target untuk mencegah over-drying.'
      };
    }

    if (isRaining || rh >= 78) {
      return {
        status: 'Lembab / Hujan',
        badgeColor: 'text-cyan-300',
        badgeBg: 'bg-cyan-950/70',
        badgeBorder: 'border-cyan-600/60',
        potensiPenguapan: 'Rendah',
        resikoDebu: 'Rendah',
        analisisKorelasi: `Tingkat kelembaban udara tinggi (${rh}% RH) menahan penguapan air alami. Daun lebih liat sehingga fraksi debu minimal, namun proses pengeringan membutuhkan retensi sedikit lebih lama.`,
        rekomendasiOperasional: 'Pastikan pemisahan fraksi gagang berjalan optimal karena kelembaban tinggi membuat gagang lebih elastis.'
      };
    }

    return {
      status: 'Optimal',
      badgeColor: 'text-emerald-300',
      badgeBg: 'bg-emerald-950/70',
      badgeBorder: 'border-emerald-600/60',
      potensiPenguapan: 'Normal',
      resikoDebu: 'Normal',
      analisisKorelasi: `Suhu pabrik (${temp.toFixed(1)}°C) dan kelembaban udara (${rh}% RH) berada pada rentang ideal pengolahan primer tembakau. Karakteristik susut murni mencerminkan kondisi bahan baku.`,
      rekomendasiOperasional: 'Pertahankan parameter mesin reguler tanpa intervensi kompensasi cuaca.'
    };
  }

  public static async fetchCurrentWeather(locationPreset?: FactoryLocationPreset, forceRefresh: boolean = false): Promise<RealtimeWeatherData> {
    const loc = locationPreset || this.getSelectedLocation();

    // Cek cache lokal jika valid (< 15 menit)
    if (!forceRefresh) {
      try {
        const cachedRaw = localStorage.getItem(`${STORAGE_KEY_WEATHER_CACHE}_${loc.id}`);
        if (cachedRaw) {
          const cached = JSON.parse(cachedRaw);
          const diffMinutes = (Date.now() - new Date(cached.fetchedAt).getTime()) / (1000 * 60);
          if (diffMinutes < 15) {
            return cached;
          }
        }
      } catch (e) {
        // ignore cache parse error
      }
    }

    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,is_day&timezone=Asia%2FJakarta`;
      const resp = await fetch(url);
      if (!resp.ok) {
        throw new Error(`Open-Meteo response status: ${resp.status}`);
      }
      const data = await resp.json();
      const current = data.current || {};
      const temp = current.temperature_2m ?? 30.0;
      const rh = current.relative_humidity_2m ?? 65;
      const code = current.weather_code ?? 1;
      const wind = current.wind_speed_10m ?? 6.0;
      const isDay = current.is_day === 1;

      const hygro = this.computeHygroIndex(temp, rh, code);

      const result: RealtimeWeatherData = {
        location: loc,
        temperature: temp,
        humidity: rh,
        weatherCode: code,
        weatherDesc: this.decodeWeatherCode(code),
        windSpeed: wind,
        isDay: isDay,
        fetchedAt: new Date().toISOString(),
        hygroIndex: hygro
      };

      try {
        localStorage.setItem(`${STORAGE_KEY_WEATHER_CACHE}_${loc.id}`, JSON.stringify(result));
      } catch (e) {
        // storage quota fallback
      }

      return result;
    } catch (err) {
      console.warn('Gagal mengambil data cuaca realtime Open-Meteo, menggunakan fallback iklim:', err);
      // Fallback data iklim rata-rata pantura Jawa Tengah/Jawa Timur
      const fallbackTemp = 30.5;
      const fallbackRh = 64;
      const fallbackCode = 2;
      return {
        location: loc,
        temperature: fallbackTemp,
        humidity: fallbackRh,
        weatherCode: fallbackCode,
        weatherDesc: 'Cerah Berawan (Estimasi Iklim Pantura)',
        windSpeed: 7.2,
        isDay: true,
        fetchedAt: new Date().toISOString(),
        hygroIndex: this.computeHygroIndex(fallbackTemp, fallbackRh, fallbackCode)
      };
    }
  }
}
