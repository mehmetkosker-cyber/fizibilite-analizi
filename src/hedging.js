// ── DÖVİZ KORUNMA (HEDGING) HESAPLAYICISI ─────────

let _hedgingChart = null;

function renderHedging(toplamGelir, toplamMaliyet, sym) {
  const el = document.getElementById('hedgingPaneli');
  if (!el) return;

  const aktif = document.getElementById('hedgingAktif')?.checked;
  const girdi = document.getElementById('hedgingGirdiler');
  if (girdi) girdi.style.display = aktif ? '' : 'none';

  // Show/hide card based on FX exposure
  const { usdRaw, eurRaw } = getDovizPozisyon();
  const kurUSD = parseFloat(document.getElementById('kurUSD')?.value) || 38;
  const kurEUR = parseFloat(document.getElementById('kurEUR')?.value) || 41;
  const dovizTL = usdRaw * kurUSD + eurRaw * kurEUR;

  const kart = document.getElementById('hedgingKart');
  if (kart) kart.style.display = dovizTL > 0 ? '' : 'none';

  if (!aktif || dovizTL <= 0) {
    el.innerHTML = '';
    if (_hedgingChart) { _hedgingChart.destroy(); _hedgingChart = null; }
    return;
  }

  const vadeAy      = Math.max(1, Math.min(parseInt(document.getElementById('hedgingVade')?.value) || 3, 12));
  const primYillik  = parseFloat(document.getElementById('hedgingPrim')?.value) || 25;

  // Forward prim (simplified): spot × prim_yıllık% × (vade_ay/12)
  const primOrani  = (primYillik / 100) * (vadeAy / 12);
  const usdForward = kurUSD * (1 + primOrani);
  const eurForward = kurEUR * (1 + primOrani);
  const hedgeMaliyeti = (usdRaw * (usdForward - kurUSD)) + (eurRaw * (eurForward - kurEUR));
  const hedgePrimPct  = dovizTL > 0 ? (hedgeMaliyeti / dovizTL) * 100 : 0;

  // Break-even: kur artışı = hedge prim oranı
  const breakEvenPct = hedgePrimPct;

  // Sensitivity table
  const senaryolar = [0, 5, 10, 15, 20, 25, 30, 40, 50];

  el.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px">
      <div class="kpi">
        <div class="kpi-label">Döviz Maruziyeti</div>
        <div class="kpi-value text-yellow font-mono">${sym}${fmt(dovizTL)}</div>
        <div class="kpi-sub">$${fmt(usdRaw)} + €${fmt(eurRaw)} toplam TL</div>
      </div>
      <div class="kpi">
        <div class="kpi-label">Forward Kur (USD)</div>
        <div class="kpi-value text-accent font-mono">₺${fmt(usdForward)}</div>
        <div class="kpi-sub">Spot ₺${fmt(kurUSD)} + %${primYillik}/yıl prim</div>
      </div>
      <div class="kpi">
        <div class="kpi-label">Hedge Maliyeti</div>
        <div class="kpi-value text-red font-mono">${sym}${fmt(hedgeMaliyeti)}</div>
        <div class="kpi-sub">${vadeAy} aylık forward prim: %${hedgePrimPct.toFixed(2)}</div>
      </div>
      <div class="kpi" style="border-color:${breakEvenPct < 10 ? 'var(--red)' : breakEvenPct < 20 ? 'var(--yellow)' : 'var(--green)'}">
        <div class="kpi-label">⚡ Başa Baş Kur Artışı</div>
        <div class="kpi-value font-mono ${breakEvenPct < 10 ? 'text-red' : breakEvenPct < 20 ? 'text-yellow' : 'text-green'}">
          +${breakEvenPct.toFixed(1)}%
        </div>
        <div class="kpi-sub">Bu noktada hedge = korumasız</div>
      </div>
    </div>

    <div style="margin-bottom:14px;padding:11px 16px;border-radius:8px;font-size:13px;
      background:rgba(79,125,255,.06);border:1px solid rgba(79,125,255,.2)">
      🛡️ <strong>Hedging mantığı:</strong>
      Forward sözleşme, dövizi bugün <strong>₺${fmt(usdForward)}</strong>/$ sabit fiyatla ${vadeAy} ay sonraya kilitler.
      Kurlar <strong>%${breakEvenPct.toFixed(1)}'den</strong> fazla artarsa hedge kârlı olur;
      az artarsa hedge maliyeti avantajı tersine çevirir.
    </div>

    <div class="chart-container" style="height:200px;margin-bottom:16px"><canvas id="chartHedging"></canvas></div>

    <div style="overflow-x:auto">
      <table class="data-table">
        <thead><tr>
          <th>Kur Artışı</th>
          <th class="text-right">USD/₺</th>
          <th class="text-right">Kur Zararı</th>
          <th class="text-right">Hedge Maliyeti</th>
          <th class="text-right">Net Avantaj</th>
          <th>Karar</th>
        </tr></thead>
        <tbody>
          ${senaryolar.map(pct => {
            const f          = 1 + pct / 100;
            const kurZarari  = dovizTL * (f - 1);
            const netAvantaj = kurZarari - hedgeMaliyeti;
            const isProfit   = netAvantaj >= 0;
            const c          = isProfit ? 'var(--green)' : 'var(--red)';
            const badge      = isProfit ? 'badge-green' : 'badge-red';
            const karar      = pct === 0 ? 'Baz' : isProfit ? '✓ Hedge Kazandı' : '✗ Hedge Pahalı';
            const isBep      = Math.abs(pct - breakEvenPct) < 3.5;
            return `<tr style="${isBep ? 'background:rgba(245,158,11,.06)' : ''}">
              <td style="font-weight:${pct===0?'700':'400'}">${pct === 0 ? 'Değişmez' : '+' + pct + '%'}</td>
              <td class="text-right font-mono">₺${fmt(kurUSD * f)}</td>
              <td class="text-right font-mono" style="color:var(--red)">${pct === 0 ? '—' : sym + fmt(kurZarari)}</td>
              <td class="text-right font-mono" style="color:var(--yellow)">${sym}${fmt(hedgeMaliyeti)}</td>
              <td class="text-right font-mono font-bold" style="color:${c}">
                ${pct === 0 ? '—' : (netAvantaj >= 0 ? '+' : '') + sym + fmt(netAvantaj)}
              </td>
              <td><span class="badge ${badge}">${karar}</span></td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
    <div style="font-size:11px;color:var(--muted);margin-top:10px;line-height:1.6">
      💡 Forward prim TL/USD faiz farkını basitleştirilmiş biçimde yansıtır. Gerçek forward kur için bankadan teklif alınız.
      Opsiyonel koruma araçları (opsiyon, swap) bu hesabın kapsamı dışındadır.
    </div>`;

  // Chart
  if (_hedgingChart) { _hedgingChart.destroy(); _hedgingChart = null; }
  const ctx = document.getElementById('chartHedging');
  if (!ctx) return;

  const gPoints = Array.from({ length: 51 }, (_, i) => i);
  _hedgingChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: gPoints.map(p => '+' + p + '%'),
      datasets: [
        {
          label: 'Kur Zararı (korumasız)',
          data: gPoints.map(pct => dovizTL * pct / 100),
          borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,.07)',
          fill: true, tension: 0, borderWidth: 2, pointRadius: 0
        },
        {
          label: 'Hedge Maliyeti (sabit)',
          data: gPoints.map(() => hedgeMaliyeti),
          borderColor: '#22c55e', backgroundColor: 'transparent',
          borderDash: [7, 4], borderWidth: 2, pointRadius: 0
        }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: '#8892a4', font: { size: 11 } } },
        tooltip: {
          callbacks: {
            title: c => `Kur artışı: ${c[0].label}`,
            label: c => `${c.dataset.label}: ${sym}${fmt(c.parsed.y)}`
          }
        }
      },
      scales: {
        x: { grid: { color: 'rgba(46,51,82,.4)' }, ticks: { color: '#8892a4', maxTicksLimit: 11 },
          title: { display: true, text: 'Kur Artışı (%)', color: '#8892a4' } },
        y: { grid: { color: 'rgba(46,51,82,.4)' }, ticks: { color: '#8892a4', callback: v => sym + fmt(v) },
          title: { display: true, text: 'Tutar', color: '#8892a4' } }
      }
    },
    plugins: [{
      id: 'bep-mark',
      afterDraw(chart) {
        const { ctx: c, scales: { x }, chartArea } = chart;
        const bepX = x.getPixelForValue(breakEvenPct);
        if (bepX < chartArea.left || bepX > chartArea.right) return;
        c.save();
        c.beginPath(); c.setLineDash([5, 4]);
        c.strokeStyle = 'rgba(245,158,11,.85)'; c.lineWidth = 1.5;
        c.moveTo(bepX, chartArea.top); c.lineTo(bepX, chartArea.bottom);
        c.stroke();
        c.fillStyle = '#f59e0b'; c.font = 'bold 10px sans-serif';
        c.textAlign = bepX > chartArea.right - 90 ? 'right' : 'center';
        c.fillText(`BEP: +${breakEvenPct.toFixed(1)}%`, bepX + (bepX > chartArea.right - 90 ? -6 : 0), chartArea.top + 14);
        c.setLineDash([]); c.restore();
      }
    }]
  });
}
