const https = require("https");

function parseCSV(text) {
  const rows = [];
  let currentRow = [];
  let currentVal = "";
  let insideQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (insideQuotes && text[i+1] === '"') {
        currentVal += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (c === ',' && !insideQuotes) {
      currentRow.push(currentVal);
      currentVal = "";
    } else if ((c === '\r' || c === '\n') && !insideQuotes) {
      if (c === '\r' && text[i+1] === '\n') i++;
      currentRow.push(currentVal);
      rows.push(currentRow);
      currentRow = [];
      currentVal = "";
    } else {
      currentVal += c;
    }
  }
  if (currentRow.length) {
    currentRow.push(currentVal);
    rows.push(currentRow);
  }
  return rows;
}

function parseNum(val) {
  if (!val) return 0;
  let clean = String(val).replace(/Kg/gi, '').replace(/%/gi, '').trim();
  if (clean.includes(',') && clean.includes('.')) {
    clean = clean.replace(/\./g, '').replace(',', '.');
  } else if (clean.includes(',')) {
    clean = clean.replace(',', '.');
  }
  const n = parseFloat(clean);
  return isNaN(n) ? 0 : n;
}

https.get("https://docs.google.com/spreadsheets/d/1LnixFRQXFjDaR_LYoOUvsj84Y_Lb5W8samFOPWrDSC0/gviz/tq?tqx=out:csv&sheet=_CACHE_REKAP_TBK", (res) => {
  let data = "";
  res.on("data", chunk => data += chunk);
  res.on("end", () => {
    const rows = parseCSV(data);
    console.log("Raw lines:", rows.length);
    const header = rows[0];
    console.log("Header:", header);

    const parsed = [];
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      if (!r[1]) continue;
      const srcRow = parseInt(r[0], 10);
      const tanggal = r[1];
      const bulan = r[2];
      const tahun = r[3];
      const jenisTembakau = r[4];
      const jenisProses = r[5];
      const baku = parseNum(r[6]);
      const hasil = parseNum(r[7]);
      const susutKg = parseNum(r[8]);
      const susutPct = parseNum(r[9]);
      const gagangKg = parseNum(r[10]);
      const debuAirKg = parseNum(r[11]);

      parsed.push({
        srcRow, tanggal, bulan, tahun, jenisTembakau, jenisProses,
        baku, hasil, susutKg, susutPct, gagangKg, debuAirKg
      });
    }

    console.log("Total parsed rows:", parsed.length);

    // Test 1: Januari 2026
    const jan2026 = parsed.filter(r => r.tahun === '2026' && r.bulan === 'Januari');
    const bJan = jan2026.reduce((acc, r) => acc + r.baku, 0);
    const hJan = jan2026.reduce((acc, r) => acc + r.hasil, 0);
    const sJan = jan2026.reduce((acc, r) => acc + r.susutKg, 0);
    const gJan = jan2026.reduce((acc, r) => acc + r.gagangKg, 0);
    const daJan = jan2026.reduce((acc, r) => acc + r.debuAirKg, 0);
    console.log("\n=== TEST 1: Januari 2026 ===");
    console.log("Count:", jan2026.length, "(Expected: 86)");
    console.log("Baku:", bJan.toFixed(1), "(Expected: 80815.7)");
    console.log("Hasil:", hJan.toFixed(1), "(Expected: 71591.7)");
    console.log("Susut %:", ((sJan / bJan) * 100).toFixed(2), "(Expected: 11.41)");
    console.log("Gagang %:", ((gJan / bJan) * 100).toFixed(2), "(Expected: 8.22)");
    console.log("Air+Debu %:", ((daJan / bJan) * 100).toFixed(2), "(Expected: 3.20)");

    // Test 2: Januari 2026 - Oktober 2026
    const monthsOrder = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
    const p2026 = parsed.filter(r => {
      if (r.tahun !== '2026') return false;
      const idx = monthsOrder.indexOf(r.bulan);
      return idx >= 0 && idx <= 9; // Jan to Okt
    });
    const b2026 = p2026.reduce((acc, r) => acc + r.baku, 0);
    const h2026 = p2026.reduce((acc, r) => acc + r.hasil, 0);
    const s2026 = p2026.reduce((acc, r) => acc + r.susutKg, 0);
    const g2026 = p2026.reduce((acc, r) => acc + r.gagangKg, 0);
    const da2026 = p2026.reduce((acc, r) => acc + r.debuAirKg, 0);
    console.log("\n=== TEST 2: Jan 2026 - Okt 2026 ===");
    console.log("Count:", p2026.length, "(Expected: 729)");
    console.log("Baku:", b2026.toFixed(1), "(Expected: 764612.0)");
    console.log("Hasil:", h2026.toFixed(1), "(Expected: 684380.2)");
    console.log("Susut %:", ((s2026 / b2026) * 100).toFixed(2), "(Expected: 10.49)");
    console.log("Gagang %:", ((g2026 / b2026) * 100).toFixed(2), "(Expected: 7.47)");
    console.log("Air+Debu %:", ((da2026 / b2026) * 100).toFixed(2), "(Expected: 3.03)");
  });
});
