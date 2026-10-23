import { 
  RawRowData, 
  DhpBatchItem, 
  StandarSusutItem, 
  AnalisisDeviasiItem, 
  AnalisisHarianSummary, 
  AnalisisBulananSummary 
} from '../types[RekapDataProsesTembakau]';

const STORAGE_KEY = 'PP1_STANDAR_SUSUT_REGISTRY_V1';

export class StandarSusutService {
  /**
   * Daftar standar acuan default jika belum pernah diset secara manual
   */
  private static readonly PRESET_STANDAR: Omit<StandarSusutItem, 'id' | 'updatedAt'>[] = [
    {
      jenisTembakau: 'Madura 2024 (BAT) R',
      jenisProses: 'SKT',
      standarSusutPct: 5.20,
      toleransiPct: 1.00,
      periodeAcuan: 'Agustus - September 2026',
      keterangan: 'Rata-rata tertimbang historis Q3 (Kondisi Kering Normal)'
    },
    {
      jenisTembakau: 'Weleri 2024 (HK)',
      jenisProses: 'SKT',
      standarSusutPct: 12.50,
      toleransiPct: 1.50,
      periodeAcuan: 'Agustus - September 2026',
      keterangan: 'Rata-rata tertimbang historis Q3 (Kadar Air Baku Cenderung Tinggi)'
    },
    {
      jenisTembakau: 'Beringin 2024 (HS)',
      jenisProses: 'SKT',
      standarSusutPct: 2.80,
      toleransiPct: 0.80,
      periodeAcuan: 'Agustus - September 2026',
      keterangan: 'Rata-rata tertimbang historis Q3 (Krosok Rajang Kering)'
    },
    {
      jenisTembakau: 'Madura 2024 (BAT) R',
      jenisProses: 'SKM',
      standarSusutPct: 6.10,
      toleransiPct: 1.20,
      periodeAcuan: 'Agustus - September 2026',
      keterangan: 'Standar Jalur Mesin Berkecepatan Tinggi'
    },
    {
      jenisTembakau: 'Bojonegoro 2024',
      jenisProses: 'SKT',
      standarSusutPct: 4.80,
      toleransiPct: 1.00,
      periodeAcuan: 'Agustus - September 2026',
      keterangan: 'Standar Historis Tembakau Bojonegoro'
    },
    {
      jenisTembakau: 'Temanggung 2024',
      jenisProses: 'SKT',
      standarSusutPct: 6.50,
      toleransiPct: 1.20,
      periodeAcuan: 'Agustus - September 2026',
      keterangan: 'Standar Historis Tembakau Temanggung'
    },
    {
      jenisTembakau: 'Semua / Umum',
      jenisProses: 'Semua',
      standarSusutPct: 5.50,
      toleransiPct: 1.50,
      periodeAcuan: 'Agustus - September 2026',
      keterangan: 'Acuan Default Pabrik (Fallback)'
    }
  ];

  /**
   * Mengambil daftar standar acuan yang tersimpan di LocalStorage atau default
   */
  public static getStandarList(rows?: RawRowData[]): StandarSusutItem[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Gagal membaca standar susut dari localStorage:', e);
    }

    // Buat dari preset default
    const defaults: StandarSusutItem[] = this.PRESET_STANDAR.map((item, idx) => ({
      ...item,
      id: `std-${idx + 1}-${Date.now()}`,
      updatedAt: '2026-10-01'
    }));

    // Simpan inisial default
    this.saveStandarList(defaults);
    return defaults;
  }

  /**
   * Menyimpan daftar standar acuan ke LocalStorage
   */
  public static saveStandarList(items: StandarSusutItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Gagal menyimpan standar susut ke localStorage:', e);
    }
  }

  /**
   * Reset standar ke hitungan otomatis atau preset pabrik
   */
  public static resetToDefault(): StandarSusutItem[] {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
    return this.getStandarList();
  }

  /**
   * Mencari standar acuan yang paling cocok untuk suatu jenis tembakau dan jalur
   */
  public static getStandarFor(jenis: string, jalur: string, list?: StandarSusutItem[]): StandarSusutItem {
    const standars = list || this.getStandarList();
    const cleanJenis = (jenis || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanJalur = (jalur || '').toUpperCase();

    // 1. Cocokkan Jenis + Jalur persis
    const exact = standars.find(s => {
      const sJenis = s.jenisTembakau.toLowerCase().replace(/[^a-z0-9]/g, '');
      const sJalur = s.jenisProses.toUpperCase();
      return cleanJenis.includes(sJenis) || sJenis.includes(cleanJenis) && (sJalur === cleanJalur || sJalur === 'SEMUA');
    });
    if (exact) return exact;

    // 2. Cocokkan Jenis saja
    const matchJenis = standars.find(s => {
      const sJenis = s.jenisTembakau.toLowerCase().replace(/[^a-z0-9]/g, '');
      return cleanJenis.includes(sJenis) || sJenis.includes(cleanJenis);
    });
    if (matchJenis) return matchJenis;

    // 3. Fallback: Cari acuan Umum / Default
    const general = standars.find(s => s.jenisTembakau.toLowerCase().includes('umum') || s.jenisTembakau.toLowerCase().includes('semua'));
    if (general) return general;

    return {
      id: 'default-fallback',
      jenisTembakau: jenis || 'Umum',
      jenisProses: (jalur as any) || 'SKT',
      standarSusutPct: 5.50,
      toleransiPct: 1.50,
      periodeAcuan: 'Standar Pabrik',
      keterangan: 'Acuan toleransi umum'
    };
  }

  /**
   * Menghitung standar acuan otomatis berdasarkan rata-rata tertimbang periode tertentu (misal Agustus - September)
   */
  public static calculateBaselineFromPeriod(
    rows: RawRowData[], 
    bulanList: string[], 
    tahun: string,
    namaPeriodeLabel: string
  ): StandarSusutItem[] {
    const filtered = rows.filter(r => {
      const matchTahun = tahun === 'Semua' || String(r.tahun) === String(tahun);
      const matchBulan = bulanList.includes(r.bulan);
      return matchTahun && matchBulan && r.baku > 0 && r.hasil > 0;
    });

    if (filtered.length === 0) {
      return this.getStandarList();
    }

    // Kelompokkan per jenis tembakau + jenis proses
    const groupMap = new Map<string, {
      jenis: string;
      jalur: 'SKT' | 'SKM' | 'Semua';
      totalBaku: number;
      totalHasil: number;
      totalSusut: number;
    }>();

    filtered.forEach(r => {
      const jalur = (r.jenisProses === 'SKM' ? 'SKM' : 'SKT') as 'SKT' | 'SKM';
      const key = `${r.jenisTembakau}|${jalur}`;
      if (!groupMap.has(key)) {
        groupMap.set(key, {
          jenis: r.jenisTembakau,
          jalur: jalur,
          totalBaku: 0,
          totalHasil: 0,
          totalSusut: 0
        });
      }
      const g = groupMap.get(key)!;
      g.totalBaku += r.baku;
      g.totalHasil += r.hasil;
      g.totalSusut += r.susutKg;
    });

    // Hitung rata-rata susut tertimbang
    const newItems: StandarSusutItem[] = [];
    let idx = 1;

    groupMap.forEach(g => {
      if (g.totalBaku > 0) {
        const susutPct = (g.totalSusut / g.totalBaku) * 100;
        newItems.push({
          id: `baseline-${idx++}-${Date.now()}`,
          jenisTembakau: g.jenis,
          jenisProses: g.jalur,
          standarSusutPct: Math.round(susutPct * 100) / 100,
          toleransiPct: Math.round(Math.max(0.8, susutPct * 0.15) * 100) / 100, // toleransi wajar ~15% dari nilai susut
          periodeAcuan: namaPeriodeLabel,
          keterangan: `Dihitung otomatis dari total olah ${Math.round(g.totalBaku).toLocaleString('id-ID')} Kg periode ${namaPeriodeLabel}`,
          updatedAt: new Date().toISOString().split('T')[0]
        });
      }
    });

    // Tambahkan default umum jika ada
    const totalAllBaku = filtered.reduce((acc, r) => acc + r.baku, 0);
    const totalAllSusut = filtered.reduce((acc, r) => acc + r.susutKg, 0);
    if (totalAllBaku > 0) {
      const generalPct = (totalAllSusut / totalAllBaku) * 100;
      newItems.push({
        id: `baseline-general-${Date.now()}`,
        jenisTembakau: 'Semua / Umum',
        jenisProses: 'Semua',
        standarSusutPct: Math.round(generalPct * 100) / 100,
        toleransiPct: 1.20,
        periodeAcuan: namaPeriodeLabel,
        keterangan: `Rata-rata agregat seluruh jenis periode ${namaPeriodeLabel}`,
        updatedAt: new Date().toISOString().split('T')[0]
      });
    }

    this.saveStandarList(newItems);
    return newItems;
  }

  /**
   * Menentukan faktor dominan dan narasi diagnosa teknis berdasarkan parameter produksi
   */
  public static diagnoseFactor(
    susutPct: number,
    acuanPct: number,
    airPct: number,
    gagangPct: number,
    debuPct: number,
    bakuKg: number,
    jalur: string
  ): { faktor: string; penjelasan: string; status: 'normal' | 'toleransi' | 'kritis' } {
    const deviasi = susutPct - acuanPct;
    
    // Penentuan Status Mutu
    let status: 'normal' | 'toleransi' | 'kritis' = 'normal';
    if (Math.abs(deviasi) <= 0.6) {
      status = 'normal';
    } else if (Math.abs(deviasi) <= 1.5) {
      status = 'toleransi';
    } else {
      status = 'kritis';
    }

    // Jika dalam batas normal
    if (status === 'normal') {
      return {
        faktor: 'Terkendali / Sesuai Acuan',
        penjelasan: 'Kesusutan berada dalam batas toleransi wajar terhadap acuan standar.',
        status
      };
    }

    // Jika deviasi negatif signifikan (susut lebih rendah dari standar / hasil lebih banyak)
    if (deviasi < -0.6) {
      return {
        faktor: 'Efisiensi Tinggi / Rendemen Positif',
        penjelasan: `Kesusutan lebih rendah ${Math.abs(deviasi).toFixed(2)}% dari acuan standar, mengindikasikan rendemen bahan baku sangat baik dan limbah minimal.`,
        status: status === 'kritis' ? 'toleransi' : 'normal'
      };
    }

    // Dekomposisi faktor kenaikan susut
    if (airPct > 3.5 || (susutPct > 0 && (airPct / susutPct) > 0.45)) {
      return {
        faktor: 'Penguapan Kadar Air Ekstrem',
        penjelasan: `Dominasi susut air (${airPct.toFixed(2)}%) dipicu kadar air bahan baku tinggi atau cuaca lembab/hujan saat penyimpanan.`,
        status
      };
    }

    if (gagangPct > 2.5 || (susutPct > 0 && (gagangPct / susutPct) > 0.35)) {
      return {
        faktor: 'Fraksi Gagang / Tulang Daun Tebal',
        penjelasan: `Limbah gagang tinggi (${gagangPct.toFixed(2)}%) mengindikasikan karakteristik anatomi bahan baku dengan rasio gagang lebih kasar.`,
        status
      };
    }

    if (debuPct > 1.8 || (susutPct > 0 && (debuPct / susutPct) > 0.25)) {
      return {
        faktor: 'Pemisahan Fraksi Debu Tinggi',
        penjelasan: `Debu tembakau (${debuPct.toFixed(2)}%) terhisap lebih banyak akibat tembakau rapuh atau hisapan siklon/dryer intensif.`,
        status
      };
    }

    if (bakuKg > 0 && bakuKg < 500) {
      return {
        faktor: 'Kapasitas Batch Kecil (< 500 Kg)',
        penjelasan: 'Volume batch kecil rentan terhadap edge loss mekanis di tabung pengering dan dinding konveyor.',
        status
      };
    }

    if (jalur === 'SKM') {
      return {
        faktor: 'Kecepatan & Tekanan Uap Mesin SKM',
        penjelasan: 'Dinamika suhu pengeringan dan tarikan mekanis mesin jalur SKM mempengaruhi laju evaporasi.',
        status
      };
    }

    return {
      faktor: 'Variasi Kondisi Bahan Baku',
      penjelasan: `Deviasi susut +${deviasi.toFixed(2)}% melampaui batas toleransi acuan standar ${acuanPct.toFixed(2)}%.`,
      status
    };
  }

  /**
   * Menghitung Laporan Analisis Harian dari batch DHP
   */
  public static computeAnalisisHarian(
    dhpBatches: DhpBatchItem[],
    selectedTanggal?: string,
    rows?: RawRowData[]
  ): AnalisisHarianSummary | null {
    if (!dhpBatches || dhpBatches.length === 0) return null;

    const standars = this.getStandarList(rows);

    // Kumpulkan tanggal yang tersedia
    const uniqueDates = Array.from(new Set(dhpBatches.map(b => b.tanggalFormatted || b.tanggalRaw))).filter(Boolean);
    if (uniqueDates.length === 0) return null;

    // Tentukan tanggal target (pilihan pengguna atau tanggal terkini)
    const targetDate = selectedTanggal && uniqueDates.includes(selectedTanggal) 
      ? selectedTanggal 
      : uniqueDates[uniqueDates.length - 1];

    const dayBatches = dhpBatches.filter(b => (b.tanggalFormatted || b.tanggalRaw) === targetDate);
    if (dayBatches.length === 0) return null;

    // Kelompokkan per varian tembakau + jalur
    const varietyMap = new Map<string, {
      jenis: string;
      jalur: string;
      baku: number;
      hasil: number;
      susutKg: number;
      gagangKg: number;
      airKg: number;
      debuKg: number;
    }>();

    dayBatches.forEach(b => {
      const key = `${b.jenisTembakau}|${b.jalur}`;
      if (!varietyMap.has(key)) {
        varietyMap.set(key, {
          jenis: b.jenisTembakau,
          jalur: b.jalur,
          baku: 0,
          hasil: 0,
          susutKg: 0,
          gagangKg: 0,
          airKg: 0,
          debuKg: 0
        });
      }
      const v = varietyMap.get(key)!;
      v.baku += b.nettoBaku;
      v.hasil += b.hasil;
      v.susutKg += b.susutKg;
      v.gagangKg += (b.gagangKg || 0);
      v.airKg += (b.airKg || 0);
      v.debuKg += (b.debuKg || 0);
    });

    const items: AnalisisDeviasiItem[] = [];
    let totalBaku = 0;
    let totalHasil = 0;
    let totalSusut = 0;
    let totalGagang = 0;
    let totalAir = 0;
    let totalDebu = 0;
    let totalWeightedAcuan = 0;

    varietyMap.forEach(v => {
      if (v.baku > 0) {
        const susutPct = (v.susutKg / v.baku) * 100;
        const airPct = (v.airKg / v.baku) * 100;
        const gagangPct = (v.gagangKg / v.baku) * 100;
        const debuPct = (v.debuKg / v.baku) * 100;

        const std = this.getStandarFor(v.jenis, v.jalur, standars);
        const acuanPct = std.standarSusutPct;
        const deviasiPct = susutPct - acuanPct;

        const diag = this.diagnoseFactor(susutPct, acuanPct, airPct, gagangPct, debuPct, v.baku, v.jalur);

        items.push({
          jenisTembakau: v.jenis,
          jenisProses: v.jalur,
          bakuKg: Math.round(v.baku * 10) / 10,
          hasilKg: Math.round(v.hasil * 10) / 10,
          susutKg: Math.round(v.susutKg * 10) / 10,
          susutPct: Math.round(susutPct * 100) / 100,
          standarAcuanPct: acuanPct,
          deviasiPct: Math.round(deviasiPct * 100) / 100,
          status: diag.status,
          gagangKg: Math.round(v.gagangKg * 10) / 10,
          gagangPct: Math.round(gagangPct * 100) / 100,
          airKg: Math.round(v.airKg * 10) / 10,
          airPct: Math.round(airPct * 100) / 100,
          debuKg: Math.round(v.debuKg * 10) / 10,
          debuPct: Math.round(debuPct * 100) / 100,
          faktorDominan: diag.faktor,
          penjelasan: diag.penjelasan
        });

        totalBaku += v.baku;
        totalHasil += v.hasil;
        totalSusut += v.susutKg;
        totalGagang += v.gagangKg;
        totalAir += v.airKg;
        totalDebu += v.debuKg;
        totalWeightedAcuan += (acuanPct * v.baku);
      }
    });

    const susutRiilWeightedPct = totalBaku > 0 ? (totalSusut / totalBaku) * 100 : 0;
    const acuanWeightedPct = totalBaku > 0 ? (totalWeightedAcuan / totalBaku) : 0;
    const deviasiAgregatPct = susutRiilWeightedPct - acuanWeightedPct;

    let statusAgregat: 'normal' | 'toleransi' | 'kritis' = 'normal';
    if (Math.abs(deviasiAgregatPct) <= 0.6) {
      statusAgregat = 'normal';
    } else if (Math.abs(deviasiAgregatPct) <= 1.5) {
      statusAgregat = 'toleransi';
    } else {
      statusAgregat = 'kritis';
    }

    // Susun kesimpulan otomatis
    const criticalItems = items.filter(it => it.status === 'kritis');
    const warningItems = items.filter(it => it.status === 'toleransi');
    let kesimpulanOtomatis = '';

    if (criticalItems.length > 0) {
      const names = criticalItems.map(c => `${c.jenisTembakau} (${c.susutPct.toFixed(2)}%)`).join(', ');
      kesimpulanOtomatis = `Perhatian Operasional: Kenaikan deviasi total hari ini (+${deviasiAgregatPct.toFixed(2)}%) dipicu terutama oleh proses ${names}. Faktor pemicu utama: ${criticalItems[0].faktorDominan}.`;
    } else if (warningItems.length > 0) {
      kesimpulanOtomatis = `Operasi Terkendali Dalam Batas Wajar: Rata-rata susut hari ini (${susutRiilWeightedPct.toFixed(2)}%) memiliki deviasi ${deviasiAgregatPct >= 0 ? '+' : ''}${deviasiAgregatPct.toFixed(2)}% dari acuan standar. Tidak ada varian dalam kondisi kritis.`;
    } else {
      kesimpulanOtomatis = `Performa Prima: Seluruh ${items.length} varian yang diproses hari ini berjalan stabil memenuhi acuan standar susut dengan deviasi sangat minim.`;
    }

    return {
      tanggal: targetDate,
      tanggalFormatted: targetDate,
      totalBakuKg: Math.round(totalBaku * 10) / 10,
      totalHasilKg: Math.round(totalHasil * 10) / 10,
      totalSusutKg: Math.round(totalSusut * 10) / 10,
      susutRiilWeightedPct: Math.round(susutRiilWeightedPct * 100) / 100,
      acuanWeightedPct: Math.round(acuanWeightedPct * 100) / 100,
      deviasiAgregatPct: Math.round(deviasiAgregatPct * 100) / 100,
      statusAgregat,
      totalGagangKg: Math.round(totalGagang * 10) / 10,
      totalAirKg: Math.round(totalAir * 10) / 10,
      totalDebuKg: Math.round(totalDebu * 10) / 10,
      items,
      kesimpulanOtomatis
    };
  }

  /**
   * Menghitung Laporan Analisis Bulanan dari data rekap tahunan/bulanan
   */
  public static computeAnalisisBulanan(
    rows: RawRowData[],
    bulan: string,
    tahun: string
  ): AnalisisBulananSummary {
    const standars = this.getStandarList(rows);

    // Filter baris sesuai bulan dan tahun
    const filtered = rows.filter(r => {
      const matchTahun = tahun === 'Semua' || String(r.tahun) === String(tahun);
      const matchBulan = bulan === 'Semua' || String(r.bulan).toLowerCase() === String(bulan).toLowerCase();
      return matchTahun && matchBulan && r.baku > 0;
    });

    if (filtered.length === 0) {
      return {
        bulan,
        tahun,
        totalBatch: 0,
        totalBakuKg: 0,
        totalHasilKg: 0,
        totalSusutKg: 0,
        susutRiilWeightedPct: 0,
        acuanWeightedPct: 0,
        deviasiAgregatPct: 0,
        statusAgregat: 'normal',
        totalGagangKg: 0,
        totalAirKg: 0,
        totalDebuKg: 0,
        items: [],
        kesimpulanOtomatis: `Tidak ada catatan transaksi untuk periode ${bulan} ${tahun}.`,
        rekomendasiManajerial: ['Pastikan data penimbangan untuk periode ini sudah ditarik dan disinkronkan.']
      };
    }

    // Kelompokkan per jenis tembakau + jenis proses
    const map = new Map<string, {
      jenis: string;
      jalur: string;
      baku: number;
      hasil: number;
      susutKg: number;
      gagangKg: number;
      airKg: number;
      debuKg: number;
      batchCount: number;
    }>();

    filtered.forEach(r => {
      const jalur = r.jenisProses || 'SKT';
      const key = `${r.jenisTembakau}|${jalur}`;
      if (!map.has(key)) {
        map.set(key, {
          jenis: r.jenisTembakau,
          jalur,
          baku: 0,
          hasil: 0,
          susutKg: 0,
          gagangKg: 0,
          airKg: 0,
          debuKg: 0,
          batchCount: 0
        });
      }
      const item = map.get(key)!;
      item.baku += r.baku;
      item.hasil += r.hasil;
      item.susutKg += r.susutKg;
      item.gagangKg += (r.gagangKg || 0);
      item.airKg += (r.airKg || 0);
      item.debuKg += (r.debuKg || 0);
      item.batchCount++;
    });

    const items: AnalisisDeviasiItem[] = [];
    let totalBaku = 0;
    let totalHasil = 0;
    let totalSusut = 0;
    let totalGagang = 0;
    let totalAir = 0;
    let totalDebu = 0;
    let totalWeightedAcuan = 0;

    map.forEach(v => {
      if (v.baku > 0) {
        const susutPct = (v.susutKg / v.baku) * 100;
        const airPct = (v.airKg / v.baku) * 100;
        const gagangPct = (v.gagangKg / v.baku) * 100;
        const debuPct = (v.debuKg / v.baku) * 100;

        const std = this.getStandarFor(v.jenis, v.jalur, standars);
        const acuanPct = std.standarSusutPct;
        const deviasiPct = susutPct - acuanPct;

        const diag = this.diagnoseFactor(susutPct, acuanPct, airPct, gagangPct, debuPct, v.baku, v.jalur);

        items.push({
          jenisTembakau: v.jenis,
          jenisProses: v.jalur,
          bakuKg: Math.round(v.baku * 10) / 10,
          hasilKg: Math.round(v.hasil * 10) / 10,
          susutKg: Math.round(v.susutKg * 10) / 10,
          susutPct: Math.round(susutPct * 100) / 100,
          standarAcuanPct: acuanPct,
          deviasiPct: Math.round(deviasiPct * 100) / 100,
          status: diag.status,
          gagangKg: Math.round(v.gagangKg * 10) / 10,
          gagangPct: Math.round(gagangPct * 100) / 100,
          airKg: Math.round(v.airKg * 10) / 10,
          airPct: Math.round(airPct * 100) / 100,
          debuKg: Math.round(v.debuKg * 10) / 10,
          debuPct: Math.round(debuPct * 100) / 100,
          faktorDominan: diag.faktor,
          penjelasan: diag.penjelasan
        });

        totalBaku += v.baku;
        totalHasil += v.hasil;
        totalSusut += v.susutKg;
        totalGagang += v.gagangKg;
        totalAir += v.airKg;
        totalDebu += v.debuKg;
        totalWeightedAcuan += (acuanPct * v.baku);
      }
    });

    // Urutkan item berdasarkan deviasi terbesar (yang butuh perhatian teratas)
    items.sort((a, b) => b.deviasiPct - a.deviasiPct);

    const susutRiilWeightedPct = totalBaku > 0 ? (totalSusut / totalBaku) * 100 : 0;
    const acuanWeightedPct = totalBaku > 0 ? (totalWeightedAcuan / totalBaku) : 0;
    const deviasiAgregatPct = susutRiilWeightedPct - acuanWeightedPct;

    let statusAgregat: 'normal' | 'toleransi' | 'kritis' = 'normal';
    if (Math.abs(deviasiAgregatPct) <= 0.6) {
      statusAgregat = 'normal';
    } else if (Math.abs(deviasiAgregatPct) <= 1.5) {
      statusAgregat = 'toleransi';
    } else {
      statusAgregat = 'kritis';
    }

    // Kesimpulan dan rekomendasi
    const overLossItems = items.filter(it => it.deviasiPct > 0.8);
    const efficientItems = items.filter(it => it.deviasiPct <= 0);

    let kesimpulanOtomatis = `Pada periode ${bulan} ${tahun}, total pengolahan tembakau mencapai ${Math.round(totalBaku).toLocaleString('id-ID')} Kg dengan susut riil rata-rata ${susutRiilWeightedPct.toFixed(2)}% terhadap acuan standar ${acuanWeightedPct.toFixed(2)}% (Deviasi ${deviasiAgregatPct >= 0 ? '+' : ''}${deviasiAgregatPct.toFixed(2)}%). `;
    
    if (overLossItems.length > 0) {
      kesimpulanOtomatis += `Terdapat ${overLossItems.length} varian dengan lonjakan susut di atas standar toleransi (${overLossItems.map(o => o.jenisTembakau).slice(0, 2).join(', ')}). `;
    } else {
      kesimpulanOtomatis += `Seluruh varian tembakau berjalan stabil dan efisien dalam batas toleransi standar acuan. `;
    }

    const rekomendasiManajerial: string[] = [];
    if (totalAir > totalGagang && totalAir > totalDebu) {
      rekomendasiManajerial.push('Evaluasi Kadar Air Baku: Lakukan audit kelembapan pada gudang penyimpanan tembakau dan sesuaikan parameter pengeringan burner dryer agar tidak over-drying.');
    }
    if (overLossItems.some(o => o.gagangPct > 2.5)) {
      rekomendasiManajerial.push('Pemeriksaan Grade Daun: Varian dengan susut gagang tinggi disarankan diaudit mutu penerimaan bahan baku dari vendor pemasok.');
    }
    if (items.some(o => o.bakuKg < 500 && o.deviasiPct > 1.0)) {
      rekomendasiManajerial.push('Optimalisasi Ukuran Batch: Konsolidasikan batch-batch kecil di bawah 500 Kg untuk meminimalkan residual loss di dinding mesin.');
    }
    if (rekomendasiManajerial.length === 0) {
      rekomendasiManajerial.push('Pertahankan parameter operasional saat ini. Jadwalkan review berkala acuan susut untuk kuartal berikutnya.');
    }

    return {
      bulan,
      tahun,
      totalBatch: filtered.length,
      totalBakuKg: Math.round(totalBaku * 10) / 10,
      totalHasilKg: Math.round(totalHasil * 10) / 10,
      totalSusutKg: Math.round(totalSusut * 10) / 10,
      susutRiilWeightedPct: Math.round(susutRiilWeightedPct * 100) / 100,
      acuanWeightedPct: Math.round(acuanWeightedPct * 100) / 100,
      deviasiAgregatPct: Math.round(deviasiAgregatPct * 100) / 100,
      statusAgregat,
      totalGagangKg: Math.round(totalGagang * 10) / 10,
      totalAirKg: Math.round(totalAir * 10) / 10,
      totalDebuKg: Math.round(totalDebu * 10) / 10,
      items,
      kesimpulanOtomatis,
      rekomendasiManajerial
    };
  }
}
