// ── BAŞA BAŞ NOKTA GRAFİĞİ — ADET BAZLI ──────────

let _bepChart = null;

function bepMaliyetiOtoDoldur() {
  const el = document.getElementById('bepSabitMaliyet');
  if (el) { el.value = Math.round(_lastMaliyet); }
  renderBasaBasGrafik();
}

function renderBasaBasGrafik() {
  const satisFiyati     = parseFloat(document.getElementById('bepSatisFiyati')?.value)     || 0;
  const degiskenMaliyet = parseFloat(document.getElementById('bepDegiskenMaliyet')?.value)  || 0;
  const sabitMaliyet    = parseFloat(document.getElementById('bepSabitMaliyet')?.value)     || 0;
  const kpiEl           = document.getElementById('bepKpiGrid');
  const sym             = _lastSym || '₺';

  if (_bepChart) { _bepChart.destroy(); _bepChart = null; }

  if (satisFiyati <= 0 || sabitMaliyet <= 0) {
    if (kpiEl) kpiEl.style.display = 'none';
    return;
  }

  const birimKar = satisFiyati - degiskenMaliyet;

  if (birimKar <= 0) {
    if (kpiEl) {
      kpiEl.style.display = 'block';
      kpiEl.innerHTML = `<div class="kpi" style="border-color:var(--red);grid-column:1/-1">
        <div class="kpi-value text-red" style="font-size:14px">
          ⚠️ Satış fiyatı (${sym}${fmt(satisFiyati)}) değişken maliyetin (${sym}${fmt(degiskenMaliyet)}) üzerinde olmalı
        </div>
      </div>`;
    }
    return;
  }

  const bepAdet      = sabitMaliyet / birimKar;
  const bepCiro      = bepAdet * satisFiyati;
  const katkiliyMarj = (birimKar / satisFiyati) * 100;

  // ── KPI kartları ─────────────────────────────────
  if (kpiEl) {
    kpiEl.style.display = 'grid';
    kpiEl.style.gridTemplateColumns = 'repeat(4,1fr)';
    kpiEl.style.gap = '12px';
    kpiEl.innerHTML = `
      <div class="kpi">
        <div class="kpi-label">Başa Baş Adeti</div>
        <div class="kpi-value text-yellow font-mono">${bepAdet % 1 === 0 ? bepAdet : bepAdet.toFixed(1)}</div>
        <div class="kpi-sub">bu adette kâr = 0</div>
      </div>
      <div class="kpi">
        <div class="kpi-label">Başa Baş Ciro</div>
        <div class="kpi-value text-accent font-mono">${sym}${fmt(bepCiro)}</div>
        <div class="kpi-sub">minimum satış cirosu</div>
      </div>
      <div class="kpi">
        <div class="kpi-label">Birim Katkı Payı</div>
        <div class="kpi-value text-green font-mono">${sym}${fmt(birimKar)}</div>
        <div class="kpi-sub">her birimin sabit mal. katkısı</div>
      </div>
      <div class="kpi">
        <div class="kpi-label">Katkı Marjı</div>
        <div class="kpi-value text-cyan font-mono">${katkiliyMarj.toFixed(1)}%</div>
        <div class="kpi-sub">satışın sabit maliyete ayrılan payı</div>
      </div>`;
  }

  // ── Grafik ────────────────────────────────────────
  const maxAdet = Math.ceil(bepAdet * 2.5);
  const N       = 30;
  const step    = maxAdet / N;
  const xVals   = Array.from({ length: N + 1 }, (_, i) => i * step);

  const gelirData    = xVals.map(a => a * satisFiyati);
  const toplamMalData = xVals.map(a => sabitMaliyet + a * degiskenMaliyet);
  const xLabels      = xVals.map(a => a % 1 === 0 ? a : a.toFixed(1));

  const ctx = document.getElementById('chartBep');
  if (!ctx) return;

  _bepChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: xLabels,
      datasets: [
        {
          label: 'Gelir (Ciro)',
          data: gelirData,
          borderColor: '#22c55e',
          backgroundColor: 'rgba(34,197,94,.07)',
          borderWidth: 2,
          fill: true,
          tension: 0,
          pointRadius: 0
        },
        {
          label: 'Toplam Maliyet',
          data: toplamMalData,
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239,68,68,.07)',
          borderWidth: 2,
          fill: true,
          tension: 0,
          pointRadius: 0
        }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: '#8892a4', font: { size: 12 } } },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.dataset.label}: ${sym}${fmt(ctx.parsed.y)}`
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(46,51,82,.4)' },
          ticks: { color: '#8892a4', maxTicksLimit: 10 },
          title: { display: true, text: 'Adet / Miktar', color: '#8892a4' }
        },
        y: {
          grid: { color: 'rgba(46,51,82,.4)' },
          ticks: { color: '#8892a4', callback: v => sym + fmt(v) },
          title: { display: true, text: 'Tutar', color: '#8892a4' }
        }
      }
    },
    plugins: [{
      id: 'bep-annotation',
      afterDraw(chart) {
        const { ctx: c, scales: { x, y }, chartArea } = chart;
        // Find closest data point to bepAdet
        const bepXPx = x.getPixelForValue(bepAdet);
        const bepYPx = y.getPixelForValue(bepCiro);
        c.save();
        // Vertical dashed line
        c.beginPath();
        c.setLineDash([5, 4]);
        c.strokeStyle = 'rgba(245,158,11,.8)';
        c.lineWidth = 1.5;
        c.moveTo(bepXPx, chartArea.top);
        c.lineTo(bepXPx, chartArea.bottom);
        c.stroke();
        // BEP dot
        c.beginPath();
        c.arc(bepXPx, bepYPx, 7, 0, Math.PI * 2);
        c.fillStyle = '#f59e0b';
        c.fill();
        c.strokeStyle = '#fff';
        c.lineWidth = 2;
        c.setLineDash([]);
        c.stroke();
        // Label
        const lbl = `BEP: ${bepAdet.toFixed(1)} adet`;
        c.font = 'bold 11px -apple-system, sans-serif';
        c.fillStyle = '#f59e0b';
        c.textAlign = bepXPx > chartArea.right - 80 ? 'right' : 'center';
        c.fillText(lbl, bepXPx + (bepXPx > chartArea.right - 80 ? -8 : 0), chartArea.top + 16);
        c.restore();
      }
    }]
  });
}
