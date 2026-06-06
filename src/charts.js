// ── GRAFİKLER ─────────────────────────────────────
function updateCharts(tipTotals, gelir, maliyet, kar, sc, totalMal, sym) {
  const labels = Object.keys(tipTotals).filter(k => tipTotals[k] > 0).map(k => TIP_LABELS[k]);
  const data = Object.keys(tipTotals).filter(k => tipTotals[k] > 0).map(k => tipTotals[k]);
  const colors = Object.keys(tipTotals).filter(k => tipTotals[k] > 0).map(k => TIP_COLORS[k]);

  if (chartMaliyet) chartMaliyet.destroy();
  const ctx1 = document.getElementById('chartMaliyet');
  if (ctx1) {
    chartMaliyet = new Chart(ctx1, {
      type: 'doughnut',
      data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 0, hoverOffset: 6 }] },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'right', labels: { color: '#8892a4', font: { size: 12 } } } }
      }
    });
  }

  if (chartKarlilik) chartKarlilik.destroy();
  const ctx2 = document.getElementById('chartKarlilik');
  if (ctx2) {
    chartKarlilik = new Chart(ctx2, {
      type: 'bar',
      data: {
        labels: ['Gelir', 'Maliyet', 'Net Kar'],
        datasets: [{
          data: [gelir, maliyet, kar],
          backgroundColor: [
            'rgba(34,197,94,.7)', 'rgba(239,68,68,.7)',
            kar >= 0 ? 'rgba(79,125,255,.7)' : 'rgba(239,68,68,.7)'
          ],
          borderRadius: 6, borderSkipped: false
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: 'rgba(46,51,82,.5)' }, ticks: { color: '#8892a4' } },
          y: { grid: { color: 'rgba(46,51,82,.5)' }, ticks: { color: '#8892a4', callback: v => sym + fmt(v) } }
        }
      }
    });
  }

  if (chartSenaryo) chartSenaryo.destroy();
  const ctx3 = document.getElementById('chartSenaryo');
  if (ctx3) {
    chartSenaryo = new Chart(ctx3, {
      type: 'bar',
      data: {
        labels: ['Kötümser', 'Gerçekçi', 'İyimser'],
        datasets: [
          { label: 'Gelir', data: [sc.kotumser.gelir, sc.gercekci.gelir, sc.iyimser.gelir], backgroundColor: 'rgba(34,197,94,.6)', borderRadius: 4 },
          { label: 'Maliyet', data: [sc.kotumser.maliyet, sc.gercekci.maliyet, sc.iyimser.maliyet], backgroundColor: 'rgba(239,68,68,.6)', borderRadius: 4 },
          { label: 'Kar', data: [sc.kotumser.kar, sc.gercekci.kar, sc.iyimser.kar], backgroundColor: 'rgba(79,125,255,.8)', borderRadius: 4 }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#8892a4', font: { size: 12 } } } },
        scales: {
          x: { grid: { color: 'rgba(46,51,82,.5)' }, ticks: { color: '#8892a4' } },
          y: { grid: { color: 'rgba(46,51,82,.5)' }, ticks: { color: '#8892a4', callback: v => sym + fmt(v) } }
        }
      }
    });
  }

  if (chartDuyarlilik) chartDuyarlilik.destroy();
  const ctx4 = document.getElementById('chartDuyarlilik');
  const artislar = [-30, -20, -10, 0, 10, 20, 30, 40, 50];
  const marjlar = artislar.map(a => {
    const yeniMaliyet = totalMal * (1 + a / 100);
    return gelir > 0 ? ((gelir - yeniMaliyet) / gelir) * 100 : 0;
  });
  if (ctx4) {
    chartDuyarlilik = new Chart(ctx4, {
      type: 'line',
      data: {
        labels: artislar.map(a => (a >= 0 ? '+' : '') + a + '%'),
        datasets: [{
          label: 'Kar Marjı (%)',
          data: marjlar,
          borderColor: '#4f7dff',
          backgroundColor: 'rgba(79,125,255,.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: marjlar.map(m => m >= 0 ? '#22c55e' : '#ef4444'),
          pointRadius: 5
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#8892a4' } } },
        scales: {
          x: { grid: { color: 'rgba(46,51,82,.5)' }, ticks: { color: '#8892a4' }, title: { display: true, text: 'Maliyet Değişimi', color: '#8892a4' } },
          y: { grid: { color: 'rgba(46,51,82,.5)' }, ticks: { color: '#8892a4', callback: v => v.toFixed(1) + '%' }, title: { display: true, text: 'Kar Marjı', color: '#8892a4' } }
        }
      }
    });
  }

  updateOneri();
  updateSimLimits(totalMal, sym);
}

function updateWaterfall(gelir, tipTotals, netKar, sym) {
  const ctx = document.getElementById('chartWaterfall');
  if (!ctx) return;
  if (chartWaterfall) { chartWaterfall.destroy(); chartWaterfall = null; }

  const malzeme = tipTotals.malzeme || 0;
  const iscilik = tipTotals.iscilik || 0;
  const gider   = tipTotals.gider   || 0;

  const bars = [];
  let seviye = gelir;

  const push = (label, val, color) => {
    bars.push({ label, bottom: seviye - val, top: seviye, color, val });
    seviye -= val;
  };

  bars.push({ label: 'Gelir', bottom: 0, top: gelir, color: 'rgba(34,197,94,.85)', val: gelir, isStart: true });
  if (malzeme > 0) push('Malzeme', malzeme, 'rgba(239,68,68,.75)');
  if (iscilik > 0) push('İşçilik', iscilik, 'rgba(251,113,133,.75)');
  if (gider   > 0) push('Genel Gider', gider, 'rgba(245,158,11,.75)');
  const netColor = netKar >= 0 ? 'rgba(79,125,255,.85)' : 'rgba(239,68,68,.85)';
  bars.push({ label: 'Net Kâr', bottom: 0, top: netKar, color: netColor, val: netKar, isEnd: true });

  chartWaterfall = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: bars.map(b => b.label),
      datasets: [{
        label: 'Tutar',
        data: bars.map(b => [b.bottom, b.top]),
        backgroundColor: bars.map(b => b.color),
        borderRadius: 5,
        borderSkipped: false,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => {
              const b = bars[ctx.dataIndex];
              const sign = b.isStart ? '' : b.isEnd ? '' : '- ';
              return `  ${sign}${sym}${fmt(Math.abs(b.val))}`;
            }
          }
        },
        datalabels: false
      },
      scales: {
        x: { grid: { color: 'rgba(46,51,82,.4)' }, ticks: { color: '#8892a4' } },
        y: {
          grid: { color: 'rgba(46,51,82,.4)' },
          ticks: { color: '#8892a4', callback: v => sym + fmt(v) }
        }
      }
    },
    plugins: [{
      id: 'waterfall-labels',
      afterDatasetsDraw(chart) {
        const { ctx: c, scales: { y } } = chart;
        c.save();
        bars.forEach((b, i) => {
          const bar = chart.getDatasetMeta(0).data[i];
          const midX = bar.x;
          const midY = (y.getPixelForValue(b.top) + y.getPixelForValue(b.bottom)) / 2;
          const label = `${sym}${fmt(Math.abs(b.val))}`;
          c.font = 'bold 11px -apple-system, sans-serif';
          c.textAlign = 'center';
          c.textBaseline = 'middle';
          c.fillStyle = '#fff';
          const barHeight = Math.abs(y.getPixelForValue(b.bottom) - y.getPixelForValue(b.top));
          if (barHeight > 20) c.fillText(label, midX, midY);
        });
        c.restore();
      }
    }]
  });
}
