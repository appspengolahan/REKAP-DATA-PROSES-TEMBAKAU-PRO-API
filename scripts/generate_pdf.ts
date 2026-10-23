import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';

export function generatePanduanPdf(): Promise<string> {
  return new Promise((resolve, reject) => {
    const outputPath = path.join(process.cwd(), 'public', 'PANDUAN_TEKNIS_AUTO_PUSH_GAS.pdf');

    // Pastikan direktori public ada
    if (!fs.existsSync(path.dirname(outputPath))) {
      fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    }

    const doc = new PDFDocument({
      size: 'A4',
      bufferPages: true,
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      info: {
        Title: 'Panduan Teknis Arsitektur Auto-Push Google Apps Script',
        Author: 'Divisi Produksi I PT Batu Karang',
        Subject: 'Arsitektur Integrasi Spreadsheet & Batasan Kuota Google',
        Keywords: 'Google Apps Script, Auto Push, Google Sheets, Quota, Architecture',
        CreationDate: new Date()
      }
    });

    const writeStream = fs.createWriteStream(outputPath);
    doc.pipe(writeStream);

    writeStream.on('finish', () => {
      resolve(outputPath);
    });

    writeStream.on('error', (err) => {
      reject(err);
    });

    // Helper styles
    const primaryColor = '#1E3A8A';   // Dark Blue
    const secondaryColor = '#0F766E'; // Teal
    const darkText = '#1F2937';       // Charcoal
    const grayText = '#4B5563';       // Muted
    const borderColor = '#E5E7EB';

    function drawHeader(pageTitle: string) {
      doc.rect(50, 40, 495, 2).fill(primaryColor);
      doc.fontSize(8).fillColor(grayText).text(pageTitle, 50, 26, { align: 'right' });
      doc.moveDown(0.5);
    }

    function drawSectionTitle(num: string, title: string) {
      doc.moveDown(0.8);
      doc.fontSize(13).font('Helvetica-Bold').fillColor(primaryColor).text(`${num}. ${title}`);
      doc.rect(50, doc.y + 2, 495, 1).fill(secondaryColor);
      doc.moveDown(0.5);
    }

    function drawSubTitle(title: string) {
      doc.moveDown(0.4);
      doc.fontSize(10.5).font('Helvetica-Bold').fillColor(secondaryColor).text(title);
      doc.moveDown(0.2);
    }

    function drawParagraph(text: string) {
      doc.fontSize(9).font('Helvetica').fillColor(darkText).text(text, {
        align: 'justify',
        lineGap: 3
      });
      doc.moveDown(0.4);
    }

    function drawBullet(title: string, desc: string) {
      const startY = doc.y;
      doc.circle(55, startY + 5, 2.5).fill(secondaryColor);
      doc.fontSize(9).font('Helvetica-Bold').fillColor(darkText).text(`${title}: `, 64, startY, { continued: true });
      doc.font('Helvetica').fillColor(grayText).text(desc, {
        align: 'justify',
        lineGap: 2
      });
      doc.moveDown(0.2);
    }

    function drawCallout(title: string, body: string, isWarning = false) {
      const y = doc.y;
      const boxColor = isWarning ? '#FEF3C7' : '#EFF6FF';
      const borderCol = isWarning ? '#D97706' : '#3B82F6';
      const titleCol = isWarning ? '#92400E' : '#1D4ED8';

      doc.rect(50, y, 495, 45).fill(boxColor);
      doc.rect(50, y, 4, 45).fill(borderCol);

      doc.fontSize(9.5).font('Helvetica-Bold').fillColor(titleCol).text(title, 62, y + 8);
      doc.fontSize(8.5).font('Helvetica').fillColor(darkText).text(body, 62, y + 22, { width: 470, lineGap: 2 });
      doc.y = y + 52;
    }

    // ================= PAGE 1 =================
    // Cover & Header Title
    doc.rect(50, 50, 495, 110).fill('#1E293B');
    doc.fontSize(17).font('Helvetica-Bold').fillColor('#FFFFFF').text('PANDUAN TEKNIS ARSITEKTUR & OPTIMASI', 70, 70, { align: 'center' });
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#38BDF8').text('AUTO-PUSH GOOGLE APPS SCRIPT (GAS)', 70, 95, { align: 'center' });
    doc.fontSize(9).font('Helvetica').fillColor('#94A3B8').text('Pedoman Desain Integrasi Data Spreadsheet Tanpa Risiko Pelanggaran Kuota Akun Google', 70, 120, { align: 'center' });
    doc.fontSize(8).font('Helvetica-Oblique').fillColor('#CBD5E1').text('Divisi Produksi I PT Batu Karang | Standar Rekapitulasi Proses Tembakau 2026', 70, 138, { align: 'center' });

    doc.y = 180;

    drawSectionTitle('1', 'Latar Belakang & Paradigma Auto-Push');
    drawParagraph(
      'Dalam sistem manufaktur dan operasional lapangan, kebutuhan sinkronisasi data antar spreadsheet (seperti data timbangan DHP ke sheet Rekap Proses Tembakau) sering kali menuntut pembaruan otomatis tanpa intervensi manual. Namun, kesalahan memilih metode sinkronisasi dapat menyebabkan penonaktifan script oleh Google akibat pelanggaran batas kuota eksekusi harian.'
    );

    drawSubTitle('Perbandingan Dua Model Arsitektur Sinkronisasi:');
    drawBullet('Model A - Client-Side Auto-Push (Browser)', 'Web browser mengirimkan permintaan POST (Webhook) setiap beberapa detik. Kelemahan fatal: sinkronisasi mati seketika saat laptop atau tab ditutup, serta membebani server Google dengan ribuan request HTTP harian yang rawan terkena rate limit (HTTP 429).');
    drawBullet('Model B - Server-Side Cloud Trigger (GAS Standalone)', 'Pemicu waktu (Time-driven Trigger) dipasang langsung di infrastruktur Google Cloud. Skrip berjalan mandiri 24 jam non-stop di jaringan internal Google tanpa ketergantungan pada browser, serta menggunakan kuota resmi Google secara terukur.');

    drawCallout(
      'Prinsip Utama Arsitektur:',
      'Gunakan Auto-Tarik (GET) di Web Apps untuk pemantauan live operator, dan gunakan Cloud Time-driven Trigger di GAS untuk pembukuan data mandiri 24 jam.'
    );

    drawSectionTitle('2', 'Membedah Batasan Kuota Resmi Google Apps Script');
    drawParagraph(
      'Google memberlakukan pembatasan kuota harian (Daily Quotas) yang di-reset setiap 24 jam. Kegagalan memahami batasan ini adalah penyebab utama script otomasi mengalami error atau dinonaktifkan:'
    );

    // Table Quota
    const tY = doc.y + 5;
    doc.rect(50, tY, 495, 20).fill('#0F172A');
    doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#FFFFFF');
    doc.text('Parameter Kuota Google', 60, tY + 6);
    doc.text('Akun Konsumen (@gmail.com)', 220, tY + 6);
    doc.text('Google Workspace (Bisnis)', 380, tY + 6);

    const quotaRows = [
      ['Total Waktu Pemicu (Triggers Runtime)', '90 Menit / Hari (KRUSIAL)', '360 Menit (6 Jam) / Hari'],
      ['Batas Waktu per 1 Kali Eksekusi', 'Maksimal 6 Menit / run', 'Maksimal 6 Menit / run'],
      ['Eksekusi Simultan (Concurrent)', 'Maksimal 30 proses', 'Maksimal 30 proses'],
      ['Pemicu Terjadwal per Proyek', 'Maksimal 20 pemicu', 'Maksimal 20 pemicu']
    ];

    let currY = tY + 20;
    quotaRows.forEach((r, idx) => {
      const bg = idx % 2 === 0 ? '#F8FAFC' : '#FFFFFF';
      doc.rect(50, currY, 495, 18).fill(bg);
      doc.rect(50, currY, 495, 18).stroke(borderColor);
      doc.fontSize(8).font('Helvetica').fillColor(darkText).text(r[0], 60, currY + 5);
      doc.font('Helvetica-Bold').fillColor(idx === 0 ? '#DC2626' : darkText).text(r[1], 220, currY + 5);
      doc.font('Helvetica').fillColor(darkText).text(r[2], 380, currY + 5);
      currY += 18;
    });

    doc.y = currY + 12;
    drawCallout(
      'Peringatan Kritis Batasan Waktu (90 Menit/Hari):',
      'Total Waktu Pemicu adalah akumulasi detik yang dihabiskan oleh trigger dalam 24 jam. Jika dalam 1 hari akumulasi waktu melebihi 90 menit, Google otomatis membekukan pemicu hingga siklus reset kuota berikutnya.',
      true
    );

    // ================= PAGE 2 =================
    doc.addPage();
    drawHeader('PANDUAN TEKNIS: ARSITEKTUR AUTO-PUSH GOOGLE APPS SCRIPT');

    drawSectionTitle('3', 'Pemodelan Matematis: Interval 5 Menit Sebagai Standar Emas');
    drawParagraph(
      'Banyak pengembang tergoda memasang pemicu setiap 1 menit (everyMinutes(1)). Mari kita buktikan secara matematis mengapa interval 1 menit membunuh akun, sedangkan 5 menit memberikan keamanan mutlak:'
    );

    drawSubTitle('Simulasi Matematis Konsumsi Kuota Akun @gmail.com:');

    // Comparison Box
    const simY = doc.y + 4;
    doc.rect(50, simY, 240, 95).fill('#FEF2F2');
    doc.rect(50, simY, 240, 95).stroke('#F87171');
    doc.fontSize(9.5).font('Helvetica-Bold').fillColor('#991B1B').text('SKENARIO A: Pemicu Tiap 1 Menit [BAHAYA]', 60, simY + 8);
    
    doc.circle(63, simY + 28, 2).fill('#DC2626');
    doc.fontSize(8).font('Helvetica').fillColor(darkText).text('Frekuensi: 60 run/jam x 24 jam = 1.440 run/hari', 70, simY + 25);
    
    doc.circle(63, simY + 41, 2).fill('#DC2626');
    doc.text('Estimasi durasi per eksekusi: 4 detik', 70, simY + 38);
    
    doc.circle(63, simY + 54, 2).fill('#DC2626');
    doc.text('Total waktu = 1.440 x 4s = 5.760 detik (96 Menit)', 70, simY + 51);
    
    doc.circle(63, simY + 67, 2).fill('#DC2626');
    doc.text('Batas Kuota: 90 Menit / Hari', 70, simY + 64);
    
    doc.font('Helvetica-Bold').fillColor('#DC2626').text('HASIL: 106% Kuota Terpakai (OVERLIMIT & DIBLOKIR)', 60, simY + 78);

    doc.rect(300, simY, 245, 95).fill('#F0FDF4');
    doc.rect(300, simY, 245, 95).stroke('#4ADE80');
    doc.fontSize(9.5).font('Helvetica-Bold').fillColor('#166534').text('SKENARIO B: Pemicu Tiap 5 Menit [AMAN - STANDAR]', 310, simY + 8);
    
    doc.circle(313, simY + 28, 2).fill('#16A34A');
    doc.fontSize(8).font('Helvetica').fillColor(darkText).text('Frekuensi: 12 run/jam x 24 jam = 288 run/hari', 320, simY + 25);
    
    doc.circle(313, simY + 41, 2).fill('#16A34A');
    doc.text('Estimasi durasi (dengan Smart Diff): ~1 detik', 320, simY + 38);
    
    doc.circle(313, simY + 54, 2).fill('#16A34A');
    doc.text('Total waktu = 288 x 1s = 288 detik (4,8 Menit)', 320, simY + 51);
    
    doc.circle(313, simY + 67, 2).fill('#16A34A');
    doc.text('Batas Kuota: 90 Menit / Hari', 320, simY + 64);
    
    doc.font('Helvetica-Bold').fillColor('#15803D').text('HASIL: Hanya Terpakai 5,3% (AMAN TOTAL 94,7% SISA)', 310, simY + 78);

    doc.y = simY + 110;

    drawSectionTitle('4', 'Tiga Pilar Rekayasa Kode untuk Efisiensi Ekstrem');
    drawParagraph(
      'Agar script mampu menyelesaikan sinkronisasi dalam waktu di bawah 1 detik, kode GAS harus menerapkan 3 pilar optimasi mutlak:'
    );

    drawBullet('Pilar 1 - Bulk Array Processing', 'Hindari pemanggilan getValue() atau setValue() di dalam loop baris. Ambil seluruh data tabel sekaligus ke variabel array memori menggunakan getValues(). Pemrosesan di RAM server Google berlangsung dalam beberapa milidetik.');
    drawBullet('Pilar 2 - Smart Diff & Early Exit', 'Saat tidak ada timbangan baru di DHP atau data hasil belum berubah, script langsung keluar (return) tanpa melakukan penulisan. Operasi baca murni hanya memakan waktu ~0,3 detik, sehingga kuota server hampir tidak terpakai.');
    drawBullet('Pilar 3 - Silent Execution & UI Independence', 'Pemicu latar belakang tidak memiliki UI aktif. Pemanggilan getUi().alert() pada trigger background akan menyebabkan fatal error. Selalu pisahkan alur background dan manual UI.');

    drawSectionTitle('5', 'Karakteristik Google Apps Script Standalone');
    drawParagraph(
      'Script Standalone (dibuat di script.google.com atau Google Drive) tidak terikat pada satu spreadsheet fisik. Karakteristik penting yang harus diterapkan:'
    );
    drawBullet('Akses Berbasis ID Dokumen', 'Gunakan SpreadsheetApp.openById(SPREADSHEET_ID) untuk menghubungkan spreadsheet sumber (DHP) dan spreadsheet tujuan (Rekap) secara independen.');
    drawBullet('Proteksi Formula Kolom Otomatis', 'Pada spreadsheet rekap tembakau kita, kolom C (Bulan), D (Tahun), E (JOIN), J (Susut Kg), dan K (Susut %) memuat formula aktif. Script dilarang keras menimpa kolom ini dengan nilai mentah.');

    // ================= PAGE 3 =================
    doc.addPage();
    drawHeader('PANDUAN TEKNIS: ARSITEKTUR AUTO-PUSH GOOGLE APPS SCRIPT');

    drawSectionTitle('6', 'Standar Template Kode Produksi GAS (IntegrasiDHP.gs)');
    drawParagraph(
      'Berikut adalah template standar fungsi kontrol pemicu mandiri yang telah teruji dan diterapkan di sistem produksi kita:'
    );

    const codeBoxY = doc.y + 4;
    doc.rect(50, codeBoxY, 495, 230).fill('#0F172A');
    doc.rect(50, codeBoxY, 495, 230).stroke('#334155');

    const codeLines = [
      '// 1. Mengaktifkan Pemicu 5 Menit di Server Google Cloud',
      'function AKTIFKAN_AUTO_PUSH_5_MENIT() {',
      '  matikanAutoPushSilent(); // Bersihkan pemicu lama agar tidak duplikat',
      "  ScriptApp.newTrigger('sinkronkanDhpKeRekapOtomatis')",
      '    .timeBased()',
      '    .everyMinutes(5)',
      '    .create();',
      "  Logger.log('[SUKSES] Auto-Push 5 Menit Aktif (Pemakaian Kuota ~5%).');",
      '}',
      '',
      '// 2. Pembersihan Pemicu Aman Tanpa Duplikasi',
      'function matikanAutoPushSilent() {',
      '  var triggers = ScriptApp.getProjectTriggers();',
      '  for (var i = 0; i < triggers.length; i++) {',
      '    var fn = triggers[i].getHandlerFunction();',
      "    if (fn === 'sinkronkanDhpKeRekap' || fn === 'sinkronkanDhpKeRekapOtomatis') {",
      '      ScriptApp.deleteTrigger(triggers[i]);',
      '    }',
      '  }',
      '}',
      '',
      '// 3. Eksekusi Hening (Silent Background Execution)',
      'function sinkronkanDhpKeRekapOtomatis() {',
      '  return sinkronkanDhpKeRekap(false); // isManual = false (Tanpa Popup UI)',
      '}'
    ];

    doc.fontSize(7.5).font('Courier').fillColor('#38BDF8');
    let cY = codeBoxY + 12;
    codeLines.forEach((cl) => {
      if (cl.startsWith('//')) {
        doc.fillColor('#94A3B8').text(cl, 62, cY);
      } else if (cl.includes('function') || cl.includes('var') || cl.includes('return')) {
        doc.fillColor('#F472B6').text(cl, 62, cY);
      } else {
        doc.fillColor('#F1F5F9').text(cl, 62, cY);
      }
      cY += 9.5;
    });

    doc.y = codeBoxY + 245;

    drawSectionTitle('7', 'Checklist Audit Sebelum Meluncurkan Web Apps Sejenis');
    drawBullet('1. Interval Waktu', 'Pastikan interval trigger adalah 5 atau 10 menit (jangan pernah 1 menit pada akun konsumen @gmail.com).');
    drawBullet('2. Proteksi Loop Trigger', 'Selalu panggil pembersih pemicu lama sebelum membuat pemicu baru agar tidak terjadi penumpukan trigger ganda.');
    drawBullet('3. Uji Beban Kuota', 'Cek menu Log Eksekusi di Apps Script untuk memastikan rata-rata waktu eksekusi berada di bawah 2 detik.');
    drawBullet('4. Penanganan Formula', 'Periksa apakah skrip menyalin formula kolom komputasi saat menambahkan baris baru, bukan menimpanya dengan teks mati.');

    // Sign off box
    doc.moveDown(0.8);
    const signY = doc.y;
    doc.rect(50, signY, 495, 45).fill('#F1F5F9');
    doc.rect(50, signY, 495, 45).stroke(borderColor);
    doc.fontSize(8.5).font('Helvetica-Bold').fillColor(primaryColor).text('STATUS DOKUMEN: RESMI & TERVERIFIKASI PRODUKSI', 65, signY + 10);
    doc.fontSize(8).font('Helvetica').fillColor(grayText)
      .text('Dokumen ini disusun sebagai acuan teknis arsitektur integrasi spreadsheet real-time di lingkungan Google Workspace Divisi Produksi I.', 65, signY + 24);

    // Page numbering
    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(i);
      doc.fontSize(8).font('Helvetica').fillColor(grayText)
        .text(`Halaman ${i + 1} dari ${range.count}`, 50, 790, { align: 'center', width: 495 });
    }

    doc.end();
  });
}

// Support CLI direct run
if (process.argv[1] && process.argv[1].endsWith('generate_pdf.ts')) {
  generatePanduanPdf()
    .then((out) => console.log('PDF berhasil digenerate di:', out))
    .catch((err) => {
      console.error('Gagal generate PDF:', err);
      process.exit(1);
    });
}
