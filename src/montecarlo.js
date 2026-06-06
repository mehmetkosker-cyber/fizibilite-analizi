// ── MONTE CARLO SİMÜLASYONU ───────────────────────

let _mcChart = null;

function normalRandom() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function runMonteCarlo() {
  const el = document.getElementById('mcSonuclar');
  if (!el) return;

  const aktif   = document.getElementById('mcAktif')?.checked;
  const girdiEl = document.getElementById('mcGirdiler');
  if (girdiEl) girdiEl.style.display = aktif ? '' : 'none';

  if (!aktif) {
    el.innerHTML = `<p style="color:var(--muted);font-size:13px;text-align:center;padding:20px">
      Simülasyonu aktif etmek için kutucuğu işaretleyin.</p>`;
    if (_mcChart) { _mcChart.destroy(); _mcChart = null; }
    return;
  }

  const bazGelir   = _lastGelir;
  const bazMaliyet = _lastMaliyet;
  const sym        = _lastSym || '₺';

  if (bazGelir === 0 && bazMaliyet === 0) {
    el.innerHTML = `<p style="color:var(--muted);font-size:13px;text-align:center;padding:20px">
      Önce veri girip "Hesapla &amp; Güncelle" butonuna basın.</p>`;
    return;
  }

  const gelirSigma   = parseFloat(document.getElementById('mcGelirSigma')?.value)   || 15;
  const maliyetSigma = parseFloat(document.getElementById('mcMaliyetSigma')?.value) || 10;
  const iterasyon    = Math.max(1, parseInt(document.getElementById('mcIterasyon')?.value) || 1000);

  // ── Simülasyon ─────────────────────────────────────
  const results = [];
  for (let i = 0; i < iterasyon; i++) {
    const g = bazGelir   * (1 + normalRandom() * gelirSigma   / 100);
    const m = bazMaliyet * (1 + normalRandom() * maliyetSigma / 100);
    results.push(g - m);
  }
  results.sort((a, b) => a - b);

  const karSayisi    = results.filter(r => r > 0).length;
  const karOlasiligi = (karSayisi / iterasyon) * 100;
  const mean         = results.reduce((s, v) => s + v, 0) / iterasyon;
  const variance     = results.reduce((s, v) => s + (v - mean) ** 2, 0) / iterasyon;
  const stdDev       = Math.sqrt(variance);
  const pct = q => results[Math.min(results.length - 1, Math.floor(results.length * q))];
  const p10 = pct(0.10);
  const p50 = pct(0.50);
  const p90 = pct(0.90);

  // ── Histogram (30 bucket) ─────────────────────────
  const N      = 30;
  const minVal = results[0];
  const maxVal = results[results.length - 1];
  const bSize  = (maxVal - minVal) / N || 1;
  const buckets = Array(N).fill(0);
  const labels  = [];
  results.forEach(v => {
    const idx = Math.min(N - 1, Math.floor((v - minVal) / bSize));
    buckets[idx]++;
  });
  for (let i = 0; i < N; i++) {
    labels.push(sym + fmt(minVal + i * bSize));
  }
  const colors = Array.from({ length: N }, (_, i) => {
    const mid = minVal + (i + 0.5) * bSize;
    return mid < 0 ? 'rgba(239,68,68,.75)' : 'rgba(79,125,255,.75)';
  });

  // ── Render ─────────────────────────────────────────
  el.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:14px">
      <div class="kpi" style="border-color:${karOlasiligi>=50?'var(--green)':'var(--red)'}">
        <div class="kpi-label">Kâr Etme Olasılığı</div>
        <div class="kpi-value font-mono ${karOlasiligi>=50?'text-green':'text-red'}">${karOlasiligi.toFixed(1)}%</div>
        <div class="kpi-sub">${karSayisi.toLocaleString('tr-TR')} / ${iterasyon.toLocaleString('tr-TR')} senaryo</div>
      </div>
      <div class="kpi">
        <div class="kpi-label">Beklenen Kâr (Ort.)</div>
        <div class="kpi-value font-mono ${mean>=0?'text-green':'text-red'}">${sym}${fmt(mean)}</div>
        <div class="kpi-sub">±${sym}${fmt(stdDev)} std. sapma</div>
      </div>
      <div class="kpi">
        <div class="kpi-label">En Kötü %10 — P10</div>
        <div class="kpi-value font-mono text-red">${sym}${fmt(p10)}</div>
        <div class="kpi-sub">Kötümser eşik</div>
      </div>
      <div class="kpi">
        <div class="kpi-label">En İyi %10 — P90</div>
        <div class="kpi-value font-mono text-green">${sym}${fmt(p90)}</div>
        <div class="kpi-sub">İyimser eşik</div>
      </div>
    </div>
    <div style="font-size:12px;color:var(--muted);margin-bottom:10px">
      <strong style="color:var(--text)">Medyan P50:</strong> ${sym}${fmt(p50)} &nbsp;·&nbsp;
      <strong style="color:var(--text)">Gelir sapması:</strong> ±%${gelirSigma} &nbsp;·&nbsp;
      <strong style="color:var(--text)">Maliyet sapması:</strong> ±%${maliyetSigma} &nbsp;·&nbsp;
      <span style="color:var(--accent);font-weight:600">${iterasyon.toLocaleString('tr-TR')} simülasyon</span>
    </div>
    <div class="chart-container" style="height:260px"><canvas id="chartMC"></canvas></div>`;

  if (_mcChart) { _mcChart.destroy(); _mcChart = null; }
  const ctx = document.getElementById('chartMC');
  if (!ctx) return;

  _mcChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Senaryo Sayısı',
        data: buckets,
        backgroundColor: colors,
        borderRadius: 2,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: ctx => `Kâr aralığı: ${labels[ctx[0].dataIndex]}`,
            label: ctx => `${ctx.parsed.y} senaryo`
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(46,51,82,.4)' },
          ticks: { color: '#8892a4', maxTicksLimit: 8,
            callback: (_, i) => i % 4 === 0 ? labels[i] : ''
          }
        },
        y: {
          grid: { color: 'rgba(46,51,82,.4)' },
          ticks: { color: '#8892a4' },
          title: { display: true, text: 'Senaryo Sayısı', color: '#8892a4' }
        }
      }
    }
  });
}
