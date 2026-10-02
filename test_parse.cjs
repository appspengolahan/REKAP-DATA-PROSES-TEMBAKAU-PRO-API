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
  // Replace " Kg" or "%" and remove thousand separator (dot or comma)
  let clean = String(val).replace(/Kg/gi, '').replace(/%/gi, '').trim();
  // Indonesian locale: 1.493.938,5 or 1493,9 or 1,493.5
  if (clean.includes(',') && clean.includes('.')) {
    // 1.493.938,5 -> remove dot, replace comma with dot
    clean = clean.replace(/\./g, '').replace(',', '.');
  } else if (clean.includes(',')) {
    clean = clean.replace(',', '.');
  }
  const n = parseFloat(clean);
  return isNaN(n) ? 0 : n;
}

https.get("https://docs.google.com/spreadsheets/d/1LnixFRQXFjDaR_LYoOUvsj84Y_Lb5W8samFOPWrDSC0/gviz/tq?tqx=out:csv&sheet=REKAP%20SUSUT%20TEMBAKAU", (res) => {
  let data = "";
  res.on("data", chunk => data += chunk);
  res.on("end", () => {
    const rows = parseCSV(data);
    console.log("Total raw rows in sheet:", rows.length);

    const validRows = [];
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const tgl = r[1] ? r[1].trim() : '';
      const bln = r[2] ? r[2].trim() : '';
      const thn = r[3] ? r[3].trim() : '';
      const varian = r[5] ? r[5].trim() : '';
      const jenis = r[6] ? r[6].trim() : '';
      const baku = parseNum(r[7]);
      const hasil = parseNum(r[8]);
      const susutKg = parseNum(r[9]) || (baku - hasil);
      const susutPct = parseNum(r[10]) || (baku > 0 ? (susutKg/baku)*100 : 0);
      const gagangKg = parseNum(r[11]);
      const airKg = parseNum(r[12]);
      const debuKg = parseNum(r[13]);

      if (thn && (thn === '2025' || thn === '2026') && baku > 0) {
        validRows.push({
          rowIdx: i + 1,
          tgl, bln, thn, varian, jenis, baku, hasil, susutKg, susutPct, gagangKg, airKg, debuKg
        });
      }
    }
    console.log("Valid data rows parsed:", validRows.length);
    console.log("Sample 3 rows:", JSON.stringify(validRows.slice(0, 3), null, 2));

    // Summary of months in 2026
    const m2026 = {};
    validRows.filter(r => r.thn === '2026').forEach(r => {
      m2026[r.bln] = (m2026[r.bln] || 0) + 1;
    });
    console.log("2026 months count:", m2026);
  });
});
