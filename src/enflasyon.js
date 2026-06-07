// ── ENFLASYON MALİYET PROJEKSİYONU ───────────────

let _enflasyonChart = null;

function renderEnflasyon(toplamGelir, toplamMaliyet, sym) {
  const el = document.getElementById('enflasyonPaneli');
  if (!el) return;

  const aktif = document.getElementById('enflasyonAktif')?.checked;
  const girdi = document.getElementById('enflasyonGirdiler');
  if (girdi) girdi.style.display = aktif ? '' : 'none';

  if (!aktif) {
    el.innerHTML = '';
    if (_enflasyonChart) { _enflasyonChart.destroy(); _enflasyonChart = null; }
    return;
  }

  if (toplamMaliyet <= 0) {
    el.innerHTML = '<p style="color:var(--muted);text-align:center;padding:20px">Önce maliyet kalemi giriniz.</p>';
    return;
  }

  const tufe        = parseFloat(document.getElementById('enflasyonOrani')?.value) || 40;
  const yil         = Math.min(parseInt(document.getElementById('enflasyonYil')?.value) || 3, 5);
  const duyarlilik  = Math.min(Math.max(parseFloat(document.getElementById('enflasyonDuyarlilik')?.value) || 100, 0), 100);

  const bazMaliyet = toplamMaliyet;
  const bazGelir   = toplamGelir;

  const satirlar = Array.from({ length: yil + 1 }, (_, n) => {
    const f        = Math.pow(1 + tufe / 100, n);
    const maliyet  = bazMaliyet * (1 + (duyarlilik / 100) * (f - 1));
    const kar      = bazGelir - maliyet;
    const marj     = bazGelir > 0 ? (kar / bazGelir) * 100 : 0;
    const malArtis = bazMaliyet > 0 ? ((maliyet / bazMaliyet) - 1) * 100 : 0;
    return { n, maliyet, kar, marj, malArtis };
  });

  const sonYil    = satirlar[yil];
  const bazKar    = bazGelir - bazMaliyet;
  const bazMarj   = bazGelir > 0 ? (bazKar / bazGelir) * 100 : 0;

  // Kritik yıl: ilk yıl marj < 0
  const kritikYil = satirlar.find(s => s.n > 0 && s.marj < 0);

  el.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px">
      <div class="kpi">
        <div class="kpi-label">Baz Maliyet (Yıl 0)</div>
        <div class="kpi-value text-accent font-mono">${sym}${fmt(bazMaliyet)}</div>
        <div class="kpi-sub">Başlangıç referans değeri</div>
      </div>
      <div class="kpi">
        <div class="kpi-label">Yıl ${yil} Tahmini Maliyet</div>
        <div class="kpi-value text-red font-mono">${sym}${fmt(sonYil.maliyet)}</div>
        <div class="kpi-sub">+${sonYil.malArtis.toFixed(1)}% artış — %${duyarlilik} duyarlı</div>
      </div>
      <div class="kpi" style="border-color:${sonYil.marj < 0 ? 'var(--red)' : sonYil.marj < 10 ? 'var(--yellow)' : 'var(--green)'}">
        <div class="kpi-label">Yıl ${yil} Kar Marjı</div>
        <div class="kpi-value font-mono ${sonYil.marj < 0 ? 'text-red' : sonYil.marj < 10 ? 'text-yellow' : 'text-green'}">
          ${sonYil.marj.toFixed(1)}%
        </div>
        <div class="kpi-sub">Gelir sabit, maliyet artan senaryoda</div>
      </div>
    </div>

    ${kritikYil ? `
    <div style="margin-bottom:14px;padding:11px 16px;border-radius:8px;font-size:13px;
      background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.3)">
      🚨 <strong>Uyarı:</strong> Mevcut fiyat seviyesi korunursa <strong>Yıl ${kritikYil.n}</strong>'de
      proje zarara giriyor. Enflasyon fiyatlara yansıtılmalı veya maliyet optimizasyonu yapılmalı.
    </div>` : ''}

    <div class="chart-container" style="height:220px;margin-bottom:16px"><canvas id="chartEnflasyon"></canvas></div>

    <div style="overflow-x:auto">
      <table class="data-table">
        <thead><tr>
          <th>Dönem</th>
          <th class="text-right">Tahmini Maliyet</th>
          <th class="text-right">Maliyet Artışı</th>
          <th class="text-right">Net Kâr</th>
          <th class="text-right">Kar Marjı</th>
          <th class="text-right">Marj Kaybı</th>
          <th>Durum</th>
        </tr></thead>
        <tbody>
          ${satirlar.map(s => {
            const isBaz    = s.n === 0;
            const c        = s.kar >= 0 ? 'var(--green)' : 'var(--red)';
            const badge    = s.marj < 0 ? 'badge-red' : s.marj < 10 ? 'badge-yellow' : 'badge-green';
            const durum    = s.marj < 0 ? 'Zarar' : s.marj < 10 ? 'Düşük' : 'İyi';
            const marjKayip = bazMarj - s.marj;
            return `<tr style="${isBaz ? 'background:rgba(79,125,255,.08)' : ''}">
              <td style="font-weight:${isBaz ? '700' : '400'}">${isBaz ? 'Yıl 0 (Baz) ◀' : 'Yıl ' + s.n}</td>
              <td class="text-right font-mono">${sym}${fmt(s.maliyet)}</td>
              <td class="text-right font-mono" style="color:var(--red)">${isBaz ? '—' : '+' + s.malArtis.toFixed(1) + '%'}</td>
              <td class="text-right font-mono font-bold" style="color:${c}">${sym}${fmt(s.kar)}</td>
              <td class="text-right font-mono font-bold" style="color:${c}">${s.marj.toFixed(1)}%</td>
              <td class="text-right font-mono" style="color:${marjKayip > 0 ? 'var(--red)' : 'var(--green)'}">
                ${isBaz ? '—' : (marjKayip > 0 ? '-' : '+') + marjKayip.toFixed(1) + ' puan'}
              </td>
              <td><span class="badge ${badge}">${durum}</span></td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
    <div style="font-size:11px;color:var(--muted);margin-top:10px;line-height:1.6">
      💡 Gelir (teklif) sabit TL olarak varsayılmıştır. TÜFE etkisinin %${duyarlilik}'i maliyetlere yansımaktadır.
      Sözleşme enflasyon klozu veya periyodik fiyat güncellemesi yoksa bu senaryolar gerçekleşebilir.
    </div>`;

  if (_enflasyonChart) { _enflasyonChart.destroy(); _enflasyonChart = null; }
  const ctx = document.getElementById('chartEnflasyon');
  if (!ctx) return;

  _enflasyonChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: satirlar.map(s => s.n === 0 ? 'Yıl 0 (Baz)' : 'Yıl ' + s.n),
      datasets: [
        {
          label: 'Tahmini Maliyet',
          data: satirlar.map(s => s.maliyet),
          backgroundColor: satirlar.map(s => s.kar >= 0 ? 'rgba(79,125,255,.6)' : 'rgba(239,68,68,.6)'),
          borderRadius: 5, order: 2
        },
        {
          label: 'Kar Marjı (%)',
          data: satirlar.map(s => s.marj),
          type: 'line',
          borderColor: '#f59e0b',
          backgroundColor: 'transparent',
          pointBackgroundColor: satirlar.map(s => s.marj >= 0 ? '#22c55e' : '#ef4444'),
          borderWidth: 2, pointRadius: 5, tension: 0.3,
          yAxisID: 'y2', order: 1
        }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: '#8892a4', font: { size: 11 } } },
        tooltip: {
          callbacks: {
            label: c => c.dataset.yAxisID === 'y2'
              ? `Kar Marjı: ${c.parsed.y.toFixed(1)}%`
              : `Maliyet: ${sym}${fmt(c.parsed.y)}`
          }
        }
      },
      scales: {
        x: { grid: { color: 'rgba(46,51,82,.4)' }, ticks: { color: '#8892a4' } },
        y: {
          grid: { color: 'rgba(46,51,82,.4)' },
          ticks: { color: '#8892a4', callback: v => sym + fmt(v) },
          title: { display: true, text: 'Maliyet', color: '#8892a4' }
        },
        y2: {
          position: 'right',
          grid: { drawOnChartArea: false },
          ticks: { color: '#8892a4', callback: v => v.toFixed(1) + '%' },
          title: { display: true, text: 'Kar Marjı', color: '#8892a4' }
        }
      }
    },
    plugins: [{
      id: 'zero-line',
      afterDraw(chart) {
        const { ctx: c, scales: { y2 }, chartArea } = chart;
        const zeroY = y2.getPixelForValue(0);
        if (zeroY < chartArea.top || zeroY > chartArea.bottom) return;
        c.save();
        c.beginPath(); c.setLineDash([5, 4]);
        c.strokeStyle = 'rgba(239,68,68,.6)'; c.lineWidth = 1.2;
        c.moveTo(chartArea.left, zeroY); c.lineTo(chartArea.right, zeroY);
        c.stroke();
        c.fillStyle = 'rgba(239,68,68,.85)'; c.font = 'bold 10px sans-serif';
        c.textAlign = 'right';
        c.fillText('Başa Baş', chartArea.right - 4, zeroY - 4);
        c.setLineDash([]); c.restore();
      }
    }]
  });
}
