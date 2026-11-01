import PDFDocument from 'pdfkit';

export interface PdfBulanItem {
  no: number;
  label: string;
  jumlahData: number;
  baku: number;
  hasil: number;
  susutKg: number;
  susutPct: number;
  gagangPct: number;
  debuAirPct: number;
  minPct: number;
  maxPct: number;
}

export interface GenerateRekapBulanPdfOptions {
  items: PdfBulanItem[];
  periodeLabel: string;
  jenisProsesLabel: string;
  totalBaku: number;
  totalHasil: number;
  totalSusutKg: number;
  weightedSusutPct: number;
  highestMonth?: string;
  highestLoss?: number;
  lowestMonth?: string;
  lowestLoss?: number;
  scope?: 'all' | 'table_only' | 'summary_only';
  orientation?: 'landscape' | 'portrait';
}

export function generateRekapBulanPdf(options: GenerateRekapBulanPdfOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const isLandscape = options.orientation !== 'portrait';
    const doc = new PDFDocument({
      size: 'A4',
      layout: isLandscape ? 'landscape' : 'portrait',
      bufferPages: true,
      margins: { top: 35, bottom: 40, left: 35, right: 35 },
      info: {
        Title: 'Rekapitulasi Kesusutan Bulanan - PT Batu Karang',
        Author: 'Divisi Produksi I PT Batu Karang',
        Subject: `Laporan Rekapitulasi Bulanan Periode ${options.periodeLabel}`,
        Keywords: 'Tembakau, Kesusutan Bulanan, PT Batu Karang, SKT, SKM',
        CreationDate: new Date()
      }
    });

    const buffers: Buffer[] = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      resolve(Buffer.concat(buffers));
    });
    doc.on('error', (err) => reject(err));

    // Color Palette
    const cPrimary = '#0f172a'; // slate-900
    const cAccent = '#2563eb'; // blue-600
    const cAmber = '#b45309'; // amber-700
    const cRose = '#e11d48'; // rose-600
    const cEmerald = '#059669'; // emerald-600
    const cMuted = '#64748b'; // slate-500
    const cBorder = '#cbd5e1'; // slate-300
    const cBgHeader = '#f8fafc'; // slate-50
    const cBgStripe = '#f1f5f9'; // slate-100

    const contentWidth = isLandscape ? 841.89 - 70 : 595.28 - 70;

    // Helper formatting
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

      // Kop Border / Badge
      doc.save();
      doc.rect(35, topY, contentWidth, isFirstPage ? 56 : 38).fillAndStroke('#f8fafc', '#e2e8f0');

      // Brand badge
      doc.rect(45, topY + (isFirstPage ? 10 : 7), isFirstPage ? 36 : 24, isFirstPage ? 36 : 24)
        .fill('#0f172a');
      doc.fillColor('#ffffff').fontSize(isFirstPage ? 12 : 9).font('Helvetica-Bold');
      doc.text('PP1', 45, topY + (isFirstPage ? 22 : 14), { width: isFirstPage ? 36 : 24, align: 'center' });

      // Title & Subtitle
      doc.fillColor(cPrimary).fontSize(isFirstPage ? 13 : 10).font('Helvetica-Bold');
      doc.text('PT BATU KARANG — DIVISI PRODUKSI I', 90, topY + (isFirstPage ? 11 : 7));

      doc.fillColor(cAccent).fontSize(isFirstPage ? 10 : 8).font('Helvetica-Bold');
      doc.text(
        'LAPORAN REKAPITULASI KESUSUTAN PROSES TEMBAKAU BULANAN',
        90,
        topY + (isFirstPage ? 27 : 19)
      );

      doc.fillColor(cMuted).fontSize(7.5).font('Helvetica');
      doc.text(
        `Periode: ${options.periodeLabel}  |  Jalur: ${options.jenisProsesLabel}  |  Dicetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`,
        90,
        topY + (isFirstPage ? 41 : 28)
      );

      // Status pill
      doc.rect(contentWidth - 75, topY + (isFirstPage ? 14 : 9), 90, 20).fill('#059669');
      doc.fillColor('#ffffff').fontSize(7.5).font('Helvetica-Bold');
      doc.text('DOKUMEN RESMI', contentWidth - 75, topY + (isFirstPage ? 20 : 15), { width: 90, align: 'center' });
      doc.restore();

      doc.y = topY + (isFirstPage ? 64 : 44);
    };

    // Render First Page Header
    renderHeader(true);

    // KPI Summary Section
    if (options.scope !== 'table_only') {
      const kpiY = doc.y;
      const kpiWidth = (contentWidth - 24) / 4;
      const kpiHeight = 44;

      const kpis = [
        {
          label: 'BAHAN BAKU MASUK',
          val: `${fmtKg(options.totalBaku)} Kg`,
          sub: `Hasil: ${fmtKg(options.totalHasil)} Kg`,
          color: cPrimary
        },
        {
          label: 'RERATA SUSUT BULANAN',
          val: fmtPct(options.weightedSusutPct),
          sub: `Total Susut: ${fmtKg(options.totalSusutKg)} Kg`,
          color: cAccent
        },
        {
          label: 'BULAN SUSUT TERTINGGI',
          val: options.highestMonth ? `${fmtPct(options.highestLoss || 0)}` : 'N/A',
          sub: options.highestMonth || 'Normal',
          color: cRose
        },
        {
          label: 'BULAN PALING EFISIEN',
          val: options.lowestMonth ? `${fmtPct(options.lowestLoss || 0)}` : 'N/A',
          sub: options.lowestMonth || 'Optimal',
          color: cEmerald
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
      // Summary only finished
      finalizeDocument();
      return;
    }

    // Table Headers
    const colDefs = isLandscape
      ? [
          { label: 'NO', width: 28, align: 'center' },
          { label: 'BULAN / PERIODE', width: 140, align: 'left' },
          { label: 'BATCH', width: 55, align: 'right' },
          { label: 'NETTO BAKU (KG)', width: 105, align: 'right' },
          { label: 'NETTO HASIL (KG)', width: 105, align: 'right' },
          { label: 'SUSUT (KG)', width: 90, align: 'right' },
          { label: 'SUSUT (%)', width: 75, align: 'right' },
          { label: 'GAGANG (%)', width: 70, align: 'right' },
          { label: 'DEBU+AIR (%)', width: 70, align: 'right' },
          { label: 'RENTANG MIN-MAX', width: 85, align: 'right' }
        ]
      : [
          { label: 'NO', width: 24, align: 'center' },
          { label: 'BULAN / PERIODE', width: 110, align: 'left' },
          { label: 'BATCH', width: 45, align: 'right' },
          { label: 'BAKU (KG)', width: 75, align: 'right' },
          { label: 'HASIL (KG)', width: 75, align: 'right' },
          { label: 'SUSUT (%)', width: 60, align: 'right' },
          { label: 'GAGANG', width: 55, align: 'right' },
          { label: 'DEBU+AIR', width: 55, align: 'right' },
          { label: 'STATUS', width: 55, align: 'center' }
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

    options.items.forEach((item, index) => {
      // Check if new page needed
      if (tableY + rowHeight > pageBottomLimit) {
        doc.addPage();
        renderHeader(false);
        tableY = renderTableHeader(doc.y);
      }

      const isEven = index % 2 === 1;
      const isHighLoss = item.susutPct >= 8.5;
      const isLowLoss = item.susutPct <= 5.5;

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

      // Col 2: Bulan
      doc.fillColor(cPrimary).fontSize(7.5).font('Helvetica-Bold');
      doc.text(item.label, currX + 4, tableY + 3.5, {
        width: colDefs[1].width - 8,
        align: 'left'
      });
      currX += colDefs[1].width;

      // Col 3: Batch
      doc.fillColor(cMuted).fontSize(7).font('Helvetica');
      doc.text(String(item.jumlahData || 0), currX + 2, tableY + 4, {
        width: colDefs[2].width - 4,
        align: 'right'
      });
      currX += colDefs[2].width;

      // Col 4: Baku
      doc.fillColor(cPrimary).fontSize(7).font('Helvetica');
      doc.text(fmtKg(item.baku), currX + 2, tableY + 4, {
        width: colDefs[3].width - 4,
        align: 'right'
      });
      currX += colDefs[3].width;

      // Col 5: Hasil
      doc.fillColor(cPrimary).fontSize(7).font('Helvetica');
      doc.text(fmtKg(item.hasil), currX + 2, tableY + 4, {
        width: colDefs[4].width - 4,
        align: 'right'
      });
      currX += colDefs[4].width;

      if (isLandscape) {
        // Col 6: Susut Kg
        doc.fillColor(cMuted).fontSize(7).font('Helvetica');
        doc.text(fmtKg(item.susutKg), currX + 2, tableY + 4, {
          width: colDefs[5].width - 4,
          align: 'right'
        });
        currX += colDefs[5].width;

        // Col 7: Susut Pct
        doc.fillColor(isHighLoss ? cRose : isLowLoss ? cEmerald : cAccent).fontSize(7.5).font('Helvetica-Bold');
        doc.text(fmtPct(item.susutPct), currX + 2, tableY + 3.5, {
          width: colDefs[6].width - 4,
          align: 'right'
        });
        currX += colDefs[6].width;

        // Col 8: Gagang
        doc.fillColor(cAmber).fontSize(7).font('Helvetica');
        doc.text(fmtPct(item.gagangPct), currX + 2, tableY + 4, {
          width: colDefs[7].width - 4,
          align: 'right'
        });
        currX += colDefs[7].width;

        // Col 9: Debu+Air
        doc.fillColor(cPrimary).fontSize(7).font('Helvetica');
        doc.text(fmtPct(item.debuAirPct), currX + 2, tableY + 4, {
          width: colDefs[8].width - 4,
          align: 'right'
        });
        currX += colDefs[8].width;

        // Col 10: Min-Max
        doc.fillColor(cMuted).fontSize(6.5).font('Helvetica');
        doc.text(`${fmtPct(item.minPct)} - ${fmtPct(item.maxPct)}`, currX + 2, tableY + 4, {
          width: colDefs[9].width - 4,
          align: 'right'
        });
      } else {
        // Portrait
        doc.fillColor(isHighLoss ? cRose : isLowLoss ? cEmerald : cAccent).fontSize(7.5).font('Helvetica-Bold');
        doc.text(fmtPct(item.susutPct), currX + 2, tableY + 3.5, {
          width: colDefs[5].width - 4,
          align: 'right'
        });
        currX += colDefs[5].width;

        doc.fillColor(cAmber).fontSize(7).font('Helvetica');
        doc.text(fmtPct(item.gagangPct), currX + 2, tableY + 4, {
          width: colDefs[6].width - 4,
          align: 'right'
        });
        currX += colDefs[6].width;

        doc.fillColor(cPrimary).fontSize(7).font('Helvetica');
        doc.text(fmtPct(item.debuAirPct), currX + 2, tableY + 4, {
          width: colDefs[7].width - 4,
          align: 'right'
        });
        currX += colDefs[7].width;

        const statusLabel = isHighLoss ? 'Waspada' : isLowLoss ? 'Efisiensi' : 'Normal';
        doc.fillColor(isHighLoss ? cRose : isLowLoss ? cEmerald : cMuted).fontSize(6.5).font('Helvetica-Bold');
        doc.text(statusLabel, currX + 2, tableY + 4, {
          width: colDefs[8].width - 4,
          align: 'center'
        });
      }

      doc.restore();
      tableY += rowHeight;
    });

    // Summary Totals Row (tfoot equivalent)
    if (tableY + 22 > pageBottomLimit) {
      doc.addPage();
      renderHeader(false);
      tableY = renderTableHeader(doc.y);
    }

    doc.save();
    doc.rect(35, tableY, contentWidth, 20).fillAndStroke('#f1f5f9', '#94a3b8');
    doc.fillColor(cPrimary).fontSize(7.5).font('Helvetica-Bold');
    doc.text('TOTAL / NERACA AKUMULASI PERIODE', 45, tableY + 6);

    const totalBatchCount = options.items.reduce((s, it) => s + (it.jumlahData || 0), 0);
    const avgGagang = options.items.length > 0 
      ? options.items.reduce((s, it) => s + it.gagangPct, 0) / options.items.length 
      : 0;
    const avgDebuAir = options.items.length > 0 
      ? options.items.reduce((s, it) => s + it.debuAirPct, 0) / options.items.length 
      : 0;

    let totX = 35 + colDefs[0].width + colDefs[1].width;
    // Batch total
    doc.text(String(totalBatchCount), totX + 2, tableY + 6, { width: colDefs[2].width - 4, align: 'right' });
    totX += colDefs[2].width;

    // Baku total
    doc.text(fmtKg(options.totalBaku), totX + 2, tableY + 6, { width: colDefs[3].width - 4, align: 'right' });
    totX += colDefs[3].width;

    // Hasil total
    doc.text(fmtKg(options.totalHasil), totX + 2, tableY + 6, { width: colDefs[4].width - 4, align: 'right' });
    totX += colDefs[4].width;

    if (isLandscape) {
      // Susut Kg total
      doc.text(fmtKg(options.totalSusutKg), totX + 2, tableY + 6, { width: colDefs[5].width - 4, align: 'right' });
      totX += colDefs[5].width;

      // Susut Pct weighted
      doc.fillColor(cAccent);
      doc.text(fmtPct(options.weightedSusutPct), totX + 2, tableY + 6, { width: colDefs[6].width - 4, align: 'right' });
      totX += colDefs[6].width;

      // Gagang avg
      doc.fillColor(cAmber);
      doc.text(fmtPct(avgGagang), totX + 2, tableY + 6, { width: colDefs[7].width - 4, align: 'right' });
      totX += colDefs[7].width;

      // Debu+Air avg
      doc.fillColor(cPrimary);
      doc.text(fmtPct(avgDebuAir), totX + 2, tableY + 6, { width: colDefs[8].width - 4, align: 'right' });
    } else {
      doc.fillColor(cAccent);
      doc.text(fmtPct(options.weightedSusutPct), totX + 2, tableY + 6, { width: colDefs[5].width - 4, align: 'right' });
    }
    doc.restore();

    finalizeDocument();

    function finalizeDocument() {
      // Add Footer with page numbers to all pages
      const pages = doc.bufferedPageRange();
      for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(i);
        doc.save();
        doc.rect(35, doc.page.height - 30, contentWidth, 0.5).fill('#cbd5e1');
        doc.fillColor(cMuted).fontSize(7).font('Helvetica');
        doc.text(
          'PT Batu Karang — Monitoring Board Rekapitulasi Data Proses Tembakau | Sistem Terverifikasi ISO-9001',
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
