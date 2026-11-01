import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';

export interface PdfJenisItem {
  no: number;
  label: string;
  jumlahData: number;
  baku: number;
  hasil: number;
  susutKg: number;
  susutPct: number;
  gagangPct: number;
  debuAirPct: number;
  kapasitasPct: number;
}

export interface GenerateRekapJenisPdfOptions {
  items: PdfJenisItem[];
  periodeLabel: string;
  jenisProsesLabel: string;
  totalVolume: number;
  topVolumeLabel?: string;
  topVolumeBaku?: number;
  efficientLabel?: string;
  efficientLoss?: number;
  highestLossLabel?: string;
  highestLoss?: number;
  scope?: 'all' | 'table_only' | 'summary_only';
  startRow?: number;
  endRow?: number;
  orientation?: 'landscape' | 'portrait';
}

export function generateRekapJenisPdf(options: GenerateRekapJenisPdfOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const isLandscape = options.orientation !== 'portrait'; // default landscape
    const doc = new PDFDocument({
      size: 'A4',
      layout: isLandscape ? 'landscape' : 'portrait',
      bufferPages: true,
      margins: { top: 35, bottom: 40, left: 35, right: 35 },
      info: {
        Title: `Rekapitulasi Jenis Tembakau - PT Batu Karang`,
        Author: 'Divisi Produksi I PT Batu Karang',
        Subject: `Laporan Rekapitulasi Varian Tembakau Periode ${options.periodeLabel}`,
        Keywords: 'Tembakau, Kesusutan, Rekapitulasi, PT Batu Karang, SKT, SKM',
        CreationDate: new Date()
      }
    });

    const buffers: Buffer[] = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      const pdfData = Buffer.concat(buffers);
      resolve(pdfData);
    });
    doc.on('error', (err) => reject(err));

    // Colors
    const primaryNavy = '#0F172A';
    const accentBlue = '#1D4ED8';
    const accentAmber = '#D97706';
    const accentGreen = '#15803D';
    const accentRose = '#DC2626';
    const textDark = '#1E293B';
    const textMuted = '#475569';
    const borderGray = '#CBD5E1';
    const bgHeader = '#F1F5F9';

    const pageWidth = isLandscape ? 841.89 : 595.28;
    const pageHeight = isLandscape ? 595.28 : 841.89;
    const contentWidth = pageWidth - 70;

    function formatNumberKg(val: number) {
      return (val || 0).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' Kg';
    }

    function formatNumberPct(val: number) {
      return (val || 0).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';
    }

    function drawKop() {
      // Top decorative bar
      doc.rect(35, 20, contentWidth, 3).fill(accentBlue);

      // Company & Department Header
      doc.fontSize(12).font('Helvetica-Bold').fillColor(primaryNavy)
        .text('PT BATU KARANG — DIVISI PRODUKSI I', 35, 28);
      doc.fontSize(8.5).font('Helvetica').fillColor(textMuted)
        .text('Sistem Monitoring Board Rekap Data Proses Kesusutan Tembakau', 35, 42);

      const printDateStr = new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      doc.fontSize(8).font('Helvetica').fillColor(textMuted)
        .text(`Dicetak: ${printDateStr}`, 35, 42, { align: 'right', width: contentWidth });

      doc.moveTo(35, 56).lineTo(35 + contentWidth, 56).lineWidth(0.8).strokeColor(borderGray).stroke();
    }

    // Filter items based on startRow & endRow
    let filteredItems = [...options.items];
    const start = options.startRow && options.startRow > 0 ? options.startRow : 1;
    const end = options.endRow && options.endRow >= start ? options.endRow : filteredItems.length;
    filteredItems = filteredItems.filter(it => it.no >= start && it.no <= end);

    const includeSummary = options.scope !== 'table_only';
    const includeTable = options.scope !== 'summary_only';

    // 1. First Page Header
    drawKop();

    let curY = 66;

    // Title Section
    doc.fontSize(14).font('Helvetica-Bold').fillColor(primaryNavy)
      .text('LAPORAN REKAPITULASI PER JENIS TEMBAKAU', 35, curY);
    curY += 18;

    doc.fontSize(9).font('Helvetica').fillColor(textMuted)
      .text(`Periode: ${options.periodeLabel}   |   Jalur Proses: ${options.jenisProsesLabel}   |   Cakupan: ${filteredItems.length} Varian Terdata (No. ${start} s/d ${end})`, 35, curY);
    curY += 18;

    // 2. Summary KPI Cards (If included)
    if (includeSummary) {
      const cardWidth = (contentWidth - 30) / 4;
      const cardHeight = 48;

      // Card 1: Total Varian
      doc.roundedRect(35, curY, cardWidth, cardHeight, 4).fillAndStroke('#F8FAFC', '#E2E8F0');
      doc.fontSize(7.5).font('Helvetica-Bold').fillColor(textMuted).text('TOTAL VARIAN AKTIF', 42, curY + 6);
      doc.fontSize(13).font('Helvetica-Bold').fillColor(primaryNavy).text(`${options.items.length} Varian`, 42, curY + 18);
      doc.fontSize(7).font('Helvetica').fillColor(textMuted).text(`Vol: ${formatNumberKg(options.totalVolume)}`, 42, curY + 34);

      // Card 2: Volume Terbesar
      const x2 = 35 + cardWidth + 10;
      doc.roundedRect(x2, curY, cardWidth, cardHeight, 4).fillAndStroke('#FFFBEB', '#FDE68A');
      doc.fontSize(7.5).font('Helvetica-Bold').fillColor(accentAmber).text('VOLUME TERBESAR (TOP 1)', x2 + 7, curY + 6);
      doc.fontSize(9.5).font('Helvetica-Bold').fillColor(primaryNavy).text(options.topVolumeLabel || '-', x2 + 7, curY + 18, { width: cardWidth - 14, lineBreak: false });
      doc.fontSize(7).font('Helvetica').fillColor(accentAmber).text(options.topVolumeBaku ? formatNumberKg(options.topVolumeBaku) : '-', x2 + 7, curY + 34);

      // Card 3: Paling Efisien
      const x3 = x2 + cardWidth + 10;
      doc.roundedRect(x3, curY, cardWidth, cardHeight, 4).fillAndStroke('#F0FDF4', '#BBF7D0');
      doc.fontSize(7.5).font('Helvetica-Bold').fillColor(accentGreen).text('SUSUT TERENDAH (OPTIMAL)', x3 + 7, curY + 6);
      doc.fontSize(9.5).font('Helvetica-Bold').fillColor(primaryNavy).text(options.efficientLabel || '-', x3 + 7, curY + 18, { width: cardWidth - 14, lineBreak: false });
      doc.fontSize(7).font('Helvetica').fillColor(accentGreen).text(options.efficientLoss !== undefined ? `Susut: ${formatNumberPct(options.efficientLoss)}` : '-', x3 + 7, curY + 34);

      // Card 4: Susut Tertinggi
      const x4 = x3 + cardWidth + 10;
      doc.roundedRect(x4, curY, cardWidth, cardHeight, 4).fillAndStroke('#FEF2F2', '#FECACA');
      doc.fontSize(7.5).font('Helvetica-Bold').fillColor(accentRose).text('SUSUT TERTINGGI (EVALUASI)', x4 + 7, curY + 6);
      doc.fontSize(9.5).font('Helvetica-Bold').fillColor(primaryNavy).text(options.highestLossLabel || '-', x4 + 7, curY + 18, { width: cardWidth - 14, lineBreak: false });
      doc.fontSize(7).font('Helvetica').fillColor(accentRose).text(options.highestLoss !== undefined ? `Susut: ${formatNumberPct(options.highestLoss)}` : '-', x4 + 7, curY + 34);

      curY += cardHeight + 14;
    }

    // 3. Table Rendering (If included)
    if (includeTable && filteredItems.length > 0) {
      const colWidths = isLandscape
        ? [30, 180, 45, 80, 80, 75, 70, 70, 70, 70]
        : [25, 125, 35, 55, 55, 50, 45, 45, 45, 45];

      const colAligns: ('left' | 'right' | 'center')[] = [
        'center', 'left', 'center', 'right', 'right', 'right', 'right', 'right', 'right', 'right'
      ];

      const colTitles = [
        'NO', 'JENIS TEMBAKAU', 'DATA', 'BAKU (KG)', 'HASIL (KG)', 'SUSUT (KG)', 'SUSUT (%)', 'GAGANG (%)', 'AIR+DEBU (%)', 'KAPASITAS'
      ];

      function drawTableHeader(yPos: number) {
        doc.rect(35, yPos, contentWidth, 20).fillAndStroke(bgHeader, borderGray);
        let x = 35;
        for (let c = 0; c < colTitles.length; c++) {
          const w = colWidths[c];
          doc.fontSize(7.5).font('Helvetica-Bold').fillColor(primaryNavy)
            .text(colTitles[c], x + 3, yPos + 6, { width: w - 6, align: colAligns[c] });
          x += w;
        }
        return yPos + 20;
      }

      curY = drawTableHeader(curY);

      const rowHeight = 17;
      const maxY = pageHeight - 50;

      for (let i = 0; i < filteredItems.length; i++) {
        const item = filteredItems[i];

        // Check if page overflow
        if (curY + rowHeight > maxY) {
          doc.addPage();
          drawKop();
          curY = 70;
          doc.fontSize(10).font('Helvetica-Bold').fillColor(primaryNavy)
            .text(`LAPORAN REKAPITULASI JENIS TEMBAKAU (Lanjutan) — Periode: ${options.periodeLabel}`, 35, curY);
          curY += 16;
          curY = drawTableHeader(curY);
        }

        // Zebra striping
        const isEven = i % 2 === 0;
        const rowBg = isEven ? '#FFFFFF' : '#F8FAFC';
        doc.rect(35, curY, contentWidth, rowHeight).fillAndStroke(rowBg, '#E2E8F0');

        const rowValues = [
          String(item.no),
          item.label,
          String(item.jumlahData),
          formatNumberKg(item.baku),
          formatNumberKg(item.hasil),
          formatNumberKg(item.susutKg),
          formatNumberPct(item.susutPct),
          formatNumberPct(item.gagangPct),
          formatNumberPct(item.debuAirPct),
          formatNumberPct(item.kapasitasPct)
        ];

        let x = 35;
        for (let c = 0; c < rowValues.length; c++) {
          const w = colWidths[c];
          const val = rowValues[c];

          // Font color highlight for susut
          let valColor = textDark;
          if (c === 6) { // Susut %
            if (item.susutPct >= 8.5) valColor = accentRose;
            else if (item.susutPct <= 5.5) valColor = accentGreen;
          }

          doc.fontSize(7.5).font(c === 1 || c === 6 ? 'Helvetica-Bold' : 'Helvetica').fillColor(valColor)
            .text(val, x + 3, curY + 4.5, { width: w - 6, align: colAligns[c], lineBreak: false });
          x += w;
        }

        curY += rowHeight;
      }
    }

    // 4. Page Numbering across all pages
    const range = doc.bufferedPageRange();
    for (let p = 0; p < range.count; p++) {
      doc.switchToPage(p);
      doc.fontSize(7.5).font('Helvetica').fillColor(textMuted)
        .text(`Dokumen Resmi Divisi Produksi I — PT Batu Karang   |   Halaman ${p + 1} dari ${range.count}`, 35, pageHeight - 25, {
          align: 'center',
          width: contentWidth
        });
    }

    doc.end();
  });
}
