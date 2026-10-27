import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { generatePanduanPdf } from './scripts/generate_pdf.ts';
import { generateIncidentPdf } from './scripts/generate_incident_pdf.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  // API Route: Proxy pull data Google Sheet via CSV
  app.get('/api/pull-sheet', async (req, res) => {
    try {
      const spreadsheetId = (req.query.spreadsheetId as string) || '1LnixFRQXFjDaR_LYoOUvsj84Y_Lb5W8samFOPWrDSC0';
      const sheet = (req.query.sheet as string) || '_CACHE_REKAP_TBK';
      const range = (req.query.range as string) || '';
      const rangeQuery = range ? `&range=${encodeURIComponent(range)}` : '';
      const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheet)}${rangeQuery}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const resp = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!resp.ok) {
        return res.status(resp.status).json({ success: false, error: `Google Sheets HTTP ${resp.status}` });
      }

      const text = await resp.text();
      return res.json({ success: true, csv: text, tab: sheet });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || 'Server error proxying sheet' });
    }
  });

  // API Route: Proxy Google Apps Script
  app.get('/api/sync-gas', async (req, res) => {
    try {
      const targetUrl = (req.query.url as string) || 'https://script.google.com/macros/s/AKfycbw34wezcB4YC4N-n2nL0ll9jofM3i9s5OHYxLZJ4Xu32_AmCEDcIAYi9V1AdPg2iACM/exec?action=getDashboardData';
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const resp = await fetch(targetUrl, {
        method: 'GET',
        redirect: 'follow',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!resp.ok) {
        return res.status(resp.status).json({ success: false, error: `GAS HTTP ${resp.status}` });
      }

      const data = await resp.json();
      return res.json(data);
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || 'Server error proxying GAS' });
    }
  });

  // API Route: Proxy POST to Google Apps Script
  app.post('/api/sync-gas', async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    try {
      const targetUrl = (req.query.url as string) || 'https://script.google.com/macros/s/AKfycbw34wezcB4YC4N-n2nL0ll9jofM3i9s5OHYxLZJ4Xu32_AmCEDcIAYi9V1AdPg2iACM/exec';
      const controller = new AbortController();
      // Tingkatkan batas waktu hingga 60 detik agar operasi deleteRow bertahap di GAS selesai dengan tuntas
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      const resp = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        body: JSON.stringify(req.body),
        redirect: 'follow',
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const text = await resp.text();
      if (!text || text.trim() === '') {
        return res.json({ success: true, message: 'Instruksi berhasil dikirim dan dieksekusi di Google Sheets.' });
      }

      try {
        const json = JSON.parse(text);
        return res.json(json);
      } catch {
        return res.json({ success: true, message: text });
      }
    } catch (err: any) {
      console.error('Error posting to GAS:', err?.message);
      return res.status(200).json({ 
        success: false, 
        error: err?.message || 'Server error posting to GAS (timeout atau koneksi terputus)' 
      });
    }
  });

  // API Route: Download PDF Panduan Teknis (dengan auto-generate jika belum ada)
  app.get('/api/download-panduan-pdf', async (_req, res) => {
    try {
      const filePath = path.resolve(__dirname, 'public', 'PANDUAN_TEKNIS_AUTO_PUSH_GAS.pdf');
      if (!fs.existsSync(filePath)) {
        await generatePanduanPdf();
      }
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="PANDUAN_TEKNIS_AUTO_PUSH_GAS.pdf"');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } catch (err: any) {
      console.error('Error serving PDF download:', err);
      res.status(500).json({ success: false, error: 'Gagal mengunduh file PDF' });
    }
  });

  // API Route: View PDF Panduan Teknis di Browser
  app.get('/api/view-panduan-pdf', async (_req, res) => {
    try {
      const filePath = path.resolve(__dirname, 'public', 'PANDUAN_TEKNIS_AUTO_PUSH_GAS.pdf');
      if (!fs.existsSync(filePath)) {
        await generatePanduanPdf();
      }
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename="PANDUAN_TEKNIS_AUTO_PUSH_GAS.pdf"');
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } catch (err: any) {
      res.status(500).json({ success: false, error: 'Gagal membuka file PDF' });
    }
  });

  // API Route: Download PDF Early Warning Celah Sistem
  app.get('/api/download-early-warning-pdf', async (_req, res) => {
    try {
      const filePath = path.resolve(__dirname, 'public', 'EARLY_WARNING_CELAH_SISTEM_DHP_REKAP.pdf');
      if (!fs.existsSync(filePath)) {
        await generateIncidentPdf();
      }
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="EARLY_WARNING_CELAH_SISTEM_DHP_REKAP.pdf"');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } catch (err: any) {
      console.error('Error serving early warning PDF download:', err);
      res.status(500).json({ success: false, error: 'Gagal mengunduh file PDF Early Warning' });
    }
  });

  // API Route: View PDF Early Warning Celah Sistem di Browser
  app.get('/api/view-early-warning-pdf', async (_req, res) => {
    try {
      const filePath = path.resolve(__dirname, 'public', 'EARLY_WARNING_CELAH_SISTEM_DHP_REKAP.pdf');
      if (!fs.existsSync(filePath)) {
        await generateIncidentPdf();
      }
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename="EARLY_WARNING_CELAH_SISTEM_DHP_REKAP.pdf"');
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } catch (err: any) {
      res.status(500).json({ success: false, error: 'Gagal membuka file PDF Early Warning' });
    }
  });

  // API Route: Download Template Excel DHP Tembakau Admin Proses
  app.get('/api/download-template-dhp-excel', (_req, res) => {
    try {
      const filePath = path.resolve(__dirname, 'public', 'TEMPLATE_DHP_TEMBAKAU_ADMIN_PROSES.xlsx');
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ success: false, error: 'File template Excel belum tersedia' });
      }
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="TEMPLATE_DHP_TEMBAKAU_ADMIN_PROSES.xlsx"');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } catch (err: any) {
      console.error('Error serving Excel template download:', err);
      res.status(500).json({ success: false, error: 'Gagal mengunduh file Excel template' });
    }
  });

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Serve public folder statically (for generated PDFs, assets, etc.)
  app.use(express.static(path.resolve(__dirname, 'public')));

  // Vite middleware in dev or static serve in prod
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
