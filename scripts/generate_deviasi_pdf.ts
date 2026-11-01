import PDFDocument from 'pdfkit';

export interface PdfDeviasiItem {
  no: number;
  jenisTembakau: string;
  jenisProses: string;
  bakuKg: number;
  hasilKg: number;
  susutRiilKg: number;
  susutRiilPct: number;
  standarAcuanPct: number;
  toleransiPct: number;
  deviasiPct: number;
  statusDeviasi: 'aman' | 'toleransi' | 'kritis';
  gagangKg: number;
  airKg: number;
  debuKg: number;
}

export interface GenerateDeviasiPdfOptions {
  items: PdfDeviasiItem[];
  periodeLabel: string;
  totalBakuKg: number;
  totalHasilKg: number;
  totalSusutKg: number;
  susutRiilWeightedPct: number;
  acuanWeightedPct: number;
  deviasiAgregatPct: number;
  statusAgregat: 'aman' | 'toleransi' | 'kritis';
  totalGagangKg: number;
  totalAirKg: number;
  totalDebuKg: number;
  scope?: 'all' | 'table_only' | 'summary_only';
  statusFilter?: 'all' | 'kritis_only' | 'toleransi_aman';
  orientation?: 'landscape' | 'portrait';
}

export function generateDeviasiPdf(options: GenerateDeviasiPdfOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const isLandscape = options.orientation !== 'portrait';
    const doc = new PDFDocument({
      size: 'A4',
      layout: isLandscape ? 'landscape' : 'portrait',
      bufferPages: true,
      margins: { top: 35, bottom: 40, left: 35, right: 35 },
      info: {
        Title: 'Evaluasi Mutu & Analisis Deviasi Susut - PT Batu Karang',
        Author: 'Divisi Produksi I PT Batu Karang',
        Subject: `Laporan Evaluasi Deviasi Periode ${options.periodeLabel}`,
        Keywords: 'Tembakau, Analisis Deviasi, Standar Acuan, Mutu, PT Batu Karang',
        CreationDate: new Date()
      }
    });

    const buffers: Buffer[] = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      resolve(Buffer.concat(buffers));
    });
    doc.on('error', (err) => reject(err));

    const cPrimary = '#0f172a';
    const cAccent = '#2563eb';
    const cRose = '#e11d48';
    const cAmber = '#b45309';
    const cEmerald = '#059669';
    const cMuted = '#64748b';
    const cBgStripe = '#f8fafc';

    const contentWidth = isLandscape ? 841.89 - 70 : 595.28 - 70;

    const fmtKg = (val: number) => {
      return (val || 0).toLocaleString('id-ID', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
      });
    };

    const fmtPct = (val: number) => {
      return `${(val || 0).toFixed(2).replace('.', ',')}%`;
    };

    const renderHeader = (isFirstPage: boolean) => {
      const topY = doc.y;

      doc.save();
      doc.rect(35, topY, contentWidth, isFirstPage ? 56 : 38).fillAndStroke('#f8fafc', '#e2e8f0');

      // Badge
      doc.rect(45, topY + (isFirstPage ? 10 : 7), isFirstPage ? 36 : 24, isFirstPage ? 36 : 24).fill('#0f172a');
      doc.fillColor('#ffffff').fontSize(isFirstPage ? 12 : 9).font('Helvetica-Bold');
      doc.text('PP1', 45, topY + (isFirstPage ? 22 : 14), { width: isFirstPage ? 36 : 24, align: 'center' });

      // Title
      doc.fillColor(cPrimary).fontSize(isFirstPage ? 13 : 10).font('Helvetica-Bold');
      doc.text('PT BATU KARANG — DIVISI PRODUKSI I', 90, topY + (isFirstPage ? 11 : 7));

      doc.fillColor(cAccent).fontSize(isFirstPage ? 10 : 8).font('Helvetica-Bold');
      doc.text(
        'LAPORAN EVALUASI MUTU, DEVIASI SUSUT & STANDAR ACUAN',
        90,
        topY + (isFirstPage ? 27 : 19)
      );

      doc.fillColor(cMuted).fontSize(7.5).font('Helvetica');
      doc.text(
        `Periode Evaluasi: ${options.periodeLabel}  |  Dicetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`,
        90,
        topY + (isFirstPage ? 41 : 28)
      );

      // Status pill
      const statusPillColor = options.statusAgregat === 'kritis' ? '#e11d48' : options.statusAgregat === 'toleransi' ? '#b45309' : '#059669';
      const statusPillText = options.statusAgregat === 'kritis' ? 'PERHATIAN OOS' : options.statusAgregat === 'toleransi' ? 'TOLERANSI' : 'MUTU NORMAL';

      doc.rect(contentWidth - 75, topY + (isFirstPage ? 14 : 9), 90, 20).fill(statusPillColor);
      doc.fillColor('#ffffff').fontSize(7.5).font('Helvetica-Bold');
      doc.text(statusPillText, contentWidth - 75, topY + (isFirstPage ? 20 : 15), { width: 90, align: 'center' });
      doc.restore();

      doc.y = topY + (isFirstPage ? 64 : 44);
    };

    renderHeader(true);

    // KPI Cards
    if (options.scope !== 'table_only') {
      const kpiY = doc.y;
      const kpiWidth = (contentWidth - 24) / 4;
      const kpiHeight = 44;

      const kpis = [
        {
          label: 'TOTAL BAHAN MASUK',
          val: `${fmtKg(options.totalBakuKg)} Kg`,
          sub: `Hasil Jadi: ${fmtKg(options.totalHasilKg)} Kg`,
          color: cPrimary
        },
        {
          label: 'SUSUT RIIL TERTIMBANG',
          val: fmtPct(options.susutRiilWeightedPct),
          sub: `Total Susut: ${fmtKg(options.totalSusutKg)} Kg`,
          color: cAccent
        },
        {
          label: 'ACUAN STANDAR PERIODE',
          val: fmtPct(options.acuanWeightedPct),
          sub: 'Standar Tertimbang Varian',
          color: cAmber
        },
        {
          label: 'NET DEVIASI AGREGAT',
          val: `${options.deviasiAgregatPct >= 0 ? '+' : ''}${fmtPct(options.deviasiAgregatPct)}`,
          sub: options.statusAgregat === 'kritis' ? 'Melebihi Toleransi' : 'Dalam Batas Wajar',
          color: options.statusAgregat === 'kritis' ? cRose : cEmerald
        }
      ];

      kpis.forEach((kpi, idx) => {
        const x = 35 + idx * (kpiWidth + 8);
        doc.save();
        doc.rect(x, kpiY, kpiWidth, kpiHeight).fillAndStroke('#ffffff', '#e2e8f0');
        doc.fillColor(cMuted).fontSize(6.5).font('Helvetica-Bold').text(kpi.label, x + 8, kpiY + 6);
        doc.fillColor(kpi.color).fontSize(11).font('Helvetica-Bold').text(kpi.val, x + 8, kpiY + 17);
        doc.fillColor(cMuted).fontSize(6.5).font('Helvetica').text(kpi.sub, x + 8, kpiY + 31);
        doc.restore();
      });

      doc.y = kpiY + kpiHeight + 12;
    }

    if (options.scope === 'summary_only') {
      finalizeDocument();
      return;
    }

    // Filter items if needed
    let filteredItems = options.items;
    if (options.statusFilter === 'kritis_only') {
      filteredItems = options.items.filter(it => it.statusDeviasi === 'kritis');
    } else if (options.statusFilter === 'toleransi_aman') {
      filteredItems = options.items.filter(it => it.statusDeviasi !== 'kritis');
    }

    // Column definitions
    const colDefs = isLandscape
      ? [
          { label: 'NO', width: 28, align: 'center' },
          { label: 'JENIS TEMBAKAU', width: 155, align: 'left' },
          { label: 'JALUR', width: 45, align: 'center' },
          { label: 'BAKU (KG)', width: 85, align: 'right' },
          { label: 'HASIL (KG)', width: 85, align: 'right' },
          { label: 'SUSUT RIIL', width: 68, align: 'right' },
          { label: 'STANDAR', width: 60, align: 'right' },
          { label: 'TOLERANSI', width: 60, align: 'right' },
          { label: 'DEVIASI', width: 65, align: 'right' },
          { label: 'STATUS MUTU', width: 85, align: 'center' }
        ]
      : [
          { label: 'NO', width: 24, align: 'center' },
          { label: 'JENIS TEMBAKAU', width: 130, align: 'left' },
          { label: 'JALUR', width: 40, align: 'center' },
          { label: 'BAKU (KG)', width: 70, align: 'right' },
          { label: 'RIIL (%)', width: 55, align: 'right' },
          { label: 'STD (%)', width: 50, align: 'right' },
          { label: 'DEVIASI', width: 55, align: 'right' },
          { label: 'STATUS', width: 70, align: 'center' }
        ];

    const renderTableHeader = (y: number) => {
      doc.save();
      doc.rect(35, y, contentWidth, 18).fillAndStroke('#1e293b', '#0f172a');
      let currX = 35;
      colDefs.forEach((col) => {
        doc.fillColor('#ffffff').fontSize(6.5).font('Helvetica-Bold');
        doc.text(col.label, currX + 3, y + 5, {
          width: col.width - 6,
          align: col.align as any
        });
        currX += col.width;
      });
      doc.restore();
      return y + 18;
    };

    let tableY = renderTableHeader(doc.y);
    const rowHeight = 15;
    const pageBottomLimit = doc.page.height - 50;

    filteredItems.forEach((item, index) => {
      if (tableY + rowHeight > pageBottomLimit) {
        doc.addPage();
        renderHeader(false);
        tableY = renderTableHeader(doc.y);
      }

      const isEven = index % 2 === 1;
      const isKritis = item.statusDeviasi === 'kritis';
      const isToleransi = item.statusDeviasi === 'toleransi';

      doc.save();
      if (isEven) {
        doc.rect(35, tableY, contentWidth, rowHeight).fill(cBgStripe);
      }
      doc.rect(35, tableY, contentWidth, rowHeight).stroke('#e2e8f0');

      let currX = 35;

      // Col 1: No
      doc.fillColor(cMuted).fontSize(7).font('Helvetica');
      doc.text(String(item.no || index + 1), currX + 2, tableY + 4, {
        width: colDefs[0].width - 4,
        align: 'center'
      });
      currX += colDefs[0].width;

      // Col 2: Jenis Tembakau
      doc.fillColor(cPrimary).fontSize(7).font('Helvetica-Bold');
      doc.text(item.jenisTembakau, currX + 4, tableY + 3.5, {
        width: colDefs[1].width - 8,
        align: 'left'
      });
      currX += colDefs[1].width;

      // Col 3: Jalur
      doc.fillColor(item.jenisProses === 'SKT' ? cAmber : cAccent).fontSize(6.5).font('Helvetica-Bold');
      doc.text(item.jenisProses, currX + 2, tableY + 4, {
        width: colDefs[2].width - 4,
        align: 'center'
      });
      currX += colDefs[2].width;

      // Col 4: Baku
      doc.fillColor(cPrimary).fontSize(7).font('Helvetica');
      doc.text(fmtKg(item.bakuKg), currX + 2, tableY + 4, {
        width: colDefs[3].width - 4,
        align: 'right'
      });
      currX += colDefs[3].width;

      if (isLandscape) {
        // Col 5: Hasil
        doc.fillColor(cPrimary).fontSize(7).font('Helvetica');
        doc.text(fmtKg(item.hasilKg), currX + 2, tableY + 4, {
          width: colDefs[4].width - 4,
          align: 'right'
        });
        currX += colDefs[4].width;

        // Col 6: Susut Riil
        doc.fillColor(cPrimary).fontSize(7).font('Helvetica-Bold');
        doc.text(fmtPct(item.susutRiilPct), currX + 2, tableY + 4, {
          width: colDefs[5].width - 4,
          align: 'right'
        });
        currX += colDefs[5].width;

        // Col 7: Standar
        doc.fillColor(cMuted).fontSize(7).font('Helvetica');
        doc.text(fmtPct(item.standarAcuanPct), currX + 2, tableY + 4, {
          width: colDefs[6].width - 4,
          align: 'right'
        });
        currX += colDefs[6].width;

        // Col 8: Toleransi
        doc.fillColor(cMuted).fontSize(7).font('Helvetica');
        doc.text(`±${fmtPct(item.toleransiPct)}`, currX + 2, tableY + 4, {
          width: colDefs[7].width - 4,
          align: 'right'
        });
        currX += colDefs[7].width;

        // Col 9: Deviasi
        const devColor = isKritis ? cRose : isToleransi ? cAmber : cEmerald;
        doc.fillColor(devColor).fontSize(7.5).font('Helvetica-Bold');
        doc.text(`${item.deviasiPct >= 0 ? '+' : ''}${fmtPct(item.deviasiPct)}`, currX + 2, tableY + 3.5, {
          width: colDefs[8].width - 4,
          align: 'right'
        });
        currX += colDefs[8].width;

        // Col 10: Status
        const statusText = isKritis ? 'PERHATIAN OOS' : isToleransi ? 'Toleransi' : 'Normal';
        doc.fillColor(devColor).fontSize(6.5).font('Helvetica-Bold');
        doc.text(statusText, currX + 2, tableY + 4, {
          width: colDefs[9].width - 4,
          align: 'center'
        });
      } else {
        // Portrait
        doc.fillColor(cPrimary).fontSize(7).font('Helvetica-Bold');
        doc.text(fmtPct(item.susutRiilPct), currX + 2, tableY + 4, {
          width: colDefs[4].width - 4,
          align: 'right'
        });
        currX += colDefs[4].width;

        doc.fillColor(cMuted).fontSize(7).font('Helvetica');
        doc.text(fmtPct(item.standarAcuanPct), currX + 2, tableY + 4, {
          width: colDefs[5].width - 4,
          align: 'right'
        });
        currX += colDefs[5].width;

        const devColor = isKritis ? cRose : isToleransi ? cAmber : cEmerald;
        doc.fillColor(devColor).fontSize(7.5).font('Helvetica-Bold');
        doc.text(`${item.deviasiPct >= 0 ? '+' : ''}${fmtPct(item.deviasiPct)}`, currX + 2, tableY + 3.5, {
          width: colDefs[6].width - 4,
          align: 'right'
        });
        currX += colDefs[6].width;

        const statusText = isKritis ? 'OOS' : isToleransi ? 'Toleransi' : 'Normal';
        doc.fillColor(devColor).fontSize(6.5).font('Helvetica-Bold');
        doc.text(statusText, currX + 2, tableY + 4, {
          width: colDefs[7].width - 4,
          align: 'center'
        });
      }

      doc.restore();
      tableY += rowHeight;
    });

    finalizeDocument();

    function finalizeDocument() {
      const pages = doc.bufferedPageRange();
      for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(i);
        doc.save();
        doc.rect(35, doc.page.height - 30, contentWidth, 0.5).fill('#cbd5e1');
        doc.fillColor(cMuted).fontSize(7).font('Helvetica');
        doc.text(
          'PT Batu Karang — Monitoring Board Rekapitulasi Data Proses Tembakau | Quality Control',
          35,
          doc.page.height - 24
        );
        doc.text(
          `Halaman ${i + 1} dari ${pages.count}`,
          35,
          doc.page.height - 24,
          { width: contentWidth, align: 'right' }
        );
        doc.restore();
      }
      doc.end();
    }
  });
}
