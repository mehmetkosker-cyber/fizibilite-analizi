// ── NAKİT AKIŞI ───────────────────────────────────
function calcNakit() {
  const paraBirimi = document.getElementById('paraBirimi').value;
  const sym = paraBirimi === 'TL' ? '₺' : paraBirimi === 'USD' ? '$' : '€';
  const sure = parseInt(document.getElementById('nakitSure').value) || 6;
  const toplamGelir = (() => {
    const g = gelirRows.reduce((s, r) => s + r.miktar * r.birimFiyat, 0);
    return g > 0 ? g : parseFloat(document.getElementById('teklifFiyati').value) || 0;
  })();
  const toplamMaliyet = maliyetRows.reduce((s, r) => s + rowTotalTL(r), 0);

  const avansOran   = (parseFloat(document.getElementById('nkAvans').value)      || 0) / 100;
  const araOran     = (parseFloat(document.getElementById('nkAraOran').value)     || 0) / 100;
  const araAy       = parseInt(document.getElementById('nkAraAy').value)          || Math.ceil(sure / 2);
  const kabulOran   = (parseFloat(document.getElementById('nkKabulOran').value)   || 0) / 100;
  const kabulAy     = parseInt(document.getElementById('nkKabulAy').value)        || sure;
  const malBaslOran = (parseFloat(document.getElementById('nkMalBaslangic').value)|| 0) / 100;

  const gelirAkis = Array(sure + 1).fill(0);
  gelirAkis[1] = toplamGelir * avansOran;
  if (araAy >= 1 && araAy <= sure) gelirAkis[araAy] += toplamGelir * araOran;
  const kAy = Math.min(kabulAy, sure);
  gelirAkis[kAy] += toplamGelir * kabulOran;
  const dagitilan = avansOran + araOran + kabulOran;
  const kalan = Math.max(0, 1 - dagitilan);
  if (kalan > 0 && sure > 1) {
    const aylik = (toplamGelir * kalan) / (sure - 1);
    for (let i = 2; i <= sure; i++) gelirAkis[i] += aylik;
  }

  const maliyetAkis = Array(sure + 1).fill(0);
  maliyetAkis[1] = toplamMaliyet * malBaslOran;
  const kalanMal = toplamMaliyet * (1 - malBaslOran);
  if (sure > 1) {
    const aylikMal = kalanMal / (sure - 1);
    for (let i = 2; i <= sure; i++) maliyetAkis[i] = aylikMal;
  }

  let kumulatif = 0;
  let maxAcik = 0;
  let breakEvenAy = null;
  const rows = [];
  for (let i = 1; i <= sure; i++) {
    const net = gelirAkis[i] - maliyetAkis[i];
    kumulatif += net;
    if (kumulatif < maxAcik) maxAcik = kumulatif;
    if (breakEvenAy === null && kumulatif >= 0) breakEvenAy = i;
    rows.push({ ay: i, gelir: gelirAkis[i], maliyet: maliyetAkis[i], net, kumulatif });
  }

  const kpiEl = document.getElementById('nakitKpi');
  if (kpiEl) {
    const items = [
      { label: 'Maks. Nakit Açığı', val: sym + fmt(maxAcik), color: maxAcik < 0 ? 'var(--red)' : 'var(--green)', sub: 'En kötü kümülatif nakit pozisyonu' },
      { label: 'Nakit Denge Noktası', val: breakEvenAy ? breakEvenAy + '. Ay' : 'Ulaşılamıyor', color: breakEvenAy ? 'var(--green)' : 'var(--red)', sub: 'Kümülatifin sıfırı geçtiği ay' },
      { label: 'Son Kümülatif', val: sym + fmt(kumulatif), color: kumulatif >= 0 ? 'var(--green)' : 'var(--red)', sub: 'Proje bitişindeki nakit durumu' },
      { label: 'Gerekli Finansman', val: sym + fmt(Math.abs(Math.min(0, maxAcik))), color: 'var(--yellow)', sub: 'Negatif dip için gereken öz/kredi kaynak' }
    ];
    kpiEl.innerHTML = items.map(it => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:10px;background:var(--surface2);border-radius:8px">
        <div>
          <div style="font-size:12px;color:var(--muted)">${it.label}</div>
          <div style="font-size:11px;color:var(--muted);margin-top:2px">${it.sub}</div>
        </div>
        <div style="font-size:18px;font-weight:700;font-family:Menlo,monospace;color:${it.color}">${it.val}</div>
      </div>`).join('');
  }

  const tbody = document.getElementById('nakitBody');
  if (tbody) {
    tbody.innerHTML = rows.map(r => {
      const kColor = r.kumulatif >= 0 ? 'var(--green)' : 'var(--red)';
      const nColor = r.net >= 0 ? 'var(--green)' : 'var(--red)';
      const durum = r.kumulatif >= 0
        ? '<span class="badge badge-green">Pozitif</span>'
        : '<span class="badge badge-red">Negatif</span>';
      return `<tr>
        <td style="font-weight:600">${r.ay}. Ay</td>
        <td class="text-right font-mono text-green">${sym}${fmt(r.gelir)}</td>
        <td class="text-right font-mono text-red">${sym}${fmt(r.maliyet)}</td>
        <td class="text-right font-mono" style="color:${nColor};font-weight:600">${sym}${fmt(r.net)}</td>
        <td class="text-right font-mono" style="color:${kColor};font-weight:700">${sym}${fmt(r.kumulatif)}</td>
        <td>${durum}</td>
      </tr>`;
    }).join('');
  }

  if (chartNakit) { chartNakit.destroy(); chartNakit = null; }
  const ctx = document.getElementById('chartNakit');
  if (!ctx) return;
  const labels = rows.map(r => r.ay + '. Ay');
  chartNakit = new Chart(ctx, {
    data: {
      labels,
      datasets: [
        { type: 'bar', label: 'Gelen Nakit', data: rows.map(r => r.gelir), backgroundColor: 'rgba(34,197,94,.6)', borderRadius: 4, yAxisID: 'y' },
        { type: 'bar', label: 'Giden Nakit', data: rows.map(r => -r.maliyet), backgroundColor: 'rgba(239,68,68,.6)', borderRadius: 4, yAxisID: 'y' },
        { type: 'line', label: 'Kümülatif Nakit', data: rows.map(r => r.kumulatif), borderColor: '#4f7dff', backgroundColor: 'rgba(79,125,255,.1)', fill: true, tension: 0.4, pointRadius: 4, pointBackgroundColor: rows.map(r => r.kumulatif >= 0 ? '#22c55e' : '#ef4444'), yAxisID: 'y2', borderWidth: 2.5 }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { labels: { color: '#8892a4', font: { size: 12 } } },
        tooltip: { callbacks: { label: ctx => `  ${ctx.dataset.label}: ${sym}${fmt(ctx.raw)}` } }
      },
      scales: {
        x: { grid: { color: 'rgba(46,51,82,.4)' }, ticks: { color: '#8892a4' } },
        y: { type: 'linear', position: 'left', grid: { color: 'rgba(46,51,82,.4)' }, ticks: { color: '#8892a4', callback: v => sym + fmt(v) } },
        y2: { type: 'linear', position: 'right', grid: { drawOnChartArea: false }, ticks: { color: '#4f7dff', callback: v => sym + fmt(v) } }
      }
    }
  });
}
