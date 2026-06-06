// ── DÖVİZ KUR RİSKİ ANALİZİ ─────────────────────
// TL teklifli projede dövizli maliyet kur artışının etkisi

let _dovizRiskChart = null;

// Her maliyetin döviz bazlı ham tutarlarını çıkarır
function getDovizPozisyon() {
  const projeSureAy = parseInt(document.getElementById('nakitSure')?.value) || 6;
  let usdRaw = 0, eurRaw = 0, tlSabit = 0;

  maliyetRows.forEach(r => {
    if      (r.doviz === 'USD') usdRaw  += r.miktar * r.birimFiyat;
    else if (r.doviz === 'EUR') eurRaw  += r.miktar * r.birimFiyat;
    else                        tlSabit += r.miktar * r.birimFiyat;
  });

  ekipmanRows.forEach(e => {
    const proje = Math.min(projeSureAy, e.omurAy || projeSureAy);
    const amortFaktor = e.mod === 'kit' ? 1 : (e.omurAy > 0 ? proje / e.omurAy : 1);
    const tlPart = ((e.kurulumMaliyet || 0) - (e.mod !== 'kit' ? (e.hurdaDeger || 0) : 0)) * amortFaktor;

    if (e.doviz === 'USD') {
      usdRaw  += e.adet * e.birimFiyat * amortFaktor;
      tlSabit += tlPart;
    } else if (e.doviz === 'EUR') {
      eurRaw  += e.adet * e.birimFiyat * amortFaktor;
      tlSabit += tlPart;
    } else {
      tlSabit += calcEkipmanProjeMaliyet(e, projeSureAy);
    }
  });

  return { usdRaw, eurRaw, tlSabit };
}

function renderDovizRiski(toplamGelir, sym, dovizPoz) {
  const el = document.getElementById('dovizRiskiPaneli');
  if (!el) return;

  const kurUSD = parseFloat(document.getElementById('kurUSD')?.value) || 38;
  const kurEUR = parseFloat(document.getElementById('kurEUR')?.value) || 41;
  const { usdRaw, eurRaw, tlSabit } = dovizPoz || getDovizPozisyon();

  const usdTL   = usdRaw * kurUSD;
  const eurTL   = eurRaw * kurEUR;
  const bazMal  = tlSabit + usdTL + eurTL;
  const dovizTL = usdTL + eurTL;

  // Dövizli kalem yoksa kartı gizle
  const kart = document.getElementById('dovizRiskiKart');
  if (kart) kart.style.display = dovizTL > 0 ? '' : 'none';
  if (dovizTL === 0) { if (_dovizRiskChart) { _dovizRiskChart.destroy(); _dovizRiskChart = null; } return; }

  const dovizPay = bazMal > 0 ? (dovizTL / bazMal) * 100 : 0;
  const bazKar   = toplamGelir - bazMal;
  const bazMarj  = toplamGelir > 0 ? (bazKar / toplamGelir) * 100 : 0;

  // Kritik kur artışı: kar = 0 noktası
  // toplamGelir = tlSabit + usdRaw * kurUSD*(1+k) + eurRaw * kurEUR*(1+k)
  // toplamGelir - tlSabit = dovizTL * (1+k)  → k = (toplamGelir - tlSabit) / dovizTL - 1
  const kritikK = dovizTL > 0
    ? ((toplamGelir - tlSabit) / dovizTL - 1) * 100
    : Infinity;

  // Artış senaryoları: 0% → 100%
  const artislar = [0, 5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 100];
  const hesapla  = pct => {
    const f      = 1 + pct / 100;
    const yeniMal  = tlSabit + usdRaw * kurUSD * f + eurRaw * kurEUR * f;
    const yeniKar  = toplamGelir - yeniMal;
    const yeniMarj = toplamGelir > 0 ? (yeniKar / toplamGelir) * 100 : 0;
    const dMal     = yeniMal - bazMal;
    return { pct, yeniUSD: kurUSD * f, yeniEUR: kurEUR * f, yeniMal, yeniKar, yeniMarj, dMal };
  };
  const satirlar = artislar.map(hesapla);

  // ── Render ────────────────────────────────────────
  el.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px">
      <div class="kpi">
        <div class="kpi-label">Döviz Maruziyeti</div>
        <div class="kpi-value text-yellow font-mono">${dovizPay.toFixed(1)}%</div>
        <div class="kpi-sub">Toplam maliyetin döviz payı</div>
      </div>
      <div class="kpi">
        <div class="kpi-label">USD Bazlı Maliyet</div>
        <div class="kpi-value text-green font-mono">${sym}${fmt(usdTL)}</div>
        <div class="kpi-sub">$${fmt(usdRaw)} × ₺${fmt(kurUSD)}</div>
      </div>
      <div class="kpi">
        <div class="kpi-label">EUR Bazlı Maliyet</div>
        <div class="kpi-value text-cyan font-mono">${sym}${fmt(eurTL)}</div>
        <div class="kpi-sub">€${fmt(eurRaw)} × ₺${fmt(kurEUR)}</div>
      </div>
      <div class="kpi" style="border-color:${kritikK <= 0 ? 'var(--red)' : kritikK < 20 ? 'var(--yellow)' : 'var(--green)'}">
        <div class="kpi-label">⚡ Kritik Kur Artışı</div>
        <div class="kpi-value font-mono ${kritikK <= 0 ? 'text-red' : kritikK < 20 ? 'text-yellow' : 'text-green'}">
          ${kritikK <= 0 ? 'Zararda' : kritikK === Infinity ? '∞' : '+' + kritikK.toFixed(1) + '%'}
        </div>
        <div class="kpi-sub">Bu artışta kâr = 0</div>
      </div>
    </div>

    ${kritikK > 0 && kritikK < 150 ? `
    <div style="margin-bottom:14px;padding:11px 16px;border-radius:8px;font-size:13px;
      background:${kritikK < 20 ? 'rgba(239,68,68,.08)' : 'rgba(245,158,11,.08)'};
      border:1px solid ${kritikK < 20 ? 'rgba(239,68,68,.3)' : 'rgba(245,158,11,.3)'}">
      ${kritikK < 20 ? '🚨' : '⚠️'}
      <strong>Kritik Kur Eşiği:</strong> Kurlar <strong>+${kritikK.toFixed(1)}%</strong> artarsa proje başa baş giriyor.
      &nbsp;→&nbsp; USD: ₺${fmt(kurUSD * (1 + kritikK/100))} &nbsp;|&nbsp; EUR: ₺${fmt(kurEUR * (1 + kritikK/100))}
    </div>` : kritikK <= 0 ? `
    <div style="margin-bottom:14px;padding:11px 16px;border-radius:8px;font-size:13px;
      background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.3)">
      🚨 <strong>Uyarı:</strong> Mevcut kurlarla bile proje zararda veya başa baş seviyesinde. Teklif fiyatını gözden geçirin.
    </div>` : ''}

    <div class="chart-container" style="height:220px;margin-bottom:16px"><canvas id="chartDovizRisk"></canvas></div>

    <div style="overflow-x:auto">
      <table class="data-table">
        <thead><tr>
          <th>Kur Artışı</th>
          <th class="text-right">USD/₺</th>
          <th class="text-right">EUR/₺</th>
          <th class="text-right">Ek Maliyet</th>
          <th class="text-right">Net Kâr</th>
          <th class="text-right">Kar Marjı</th>
          <th class="text-right">Marj Kaybı</th>
          <th>Durum</th>
        </tr></thead>
        <tbody>
          ${satirlar.map(s => {
            const isBaz = s.pct === 0;
            const isKritik = kritikK > 0 && s.pct > 0 && Math.abs(s.pct - kritikK) < 6;
            const c = s.yeniKar >= 0 ? 'var(--green)' : 'var(--red)';
            const marjKayip = bazMarj - s.yeniMarj;
            const badge = s.yeniMarj < 0 ? 'badge-red' : s.yeniMarj < 10 ? 'badge-yellow' : 'badge-green';
            const durum  = s.yeniMarj < 0 ? 'Zarar' : s.yeniMarj < 10 ? 'Düşük' : 'İyi';
            return `<tr style="${isBaz ? 'background:rgba(79,125,255,.08)' : isKritik ? 'background:rgba(245,158,11,.06)' : ''}">
              <td style="font-weight:${isBaz?'700':'400'}">${isBaz ? 'Mevcut ◀' : '+' + s.pct + '%'}</td>
              <td class="text-right font-mono">₺${fmt(s.yeniUSD)}</td>
              <td class="text-right font-mono">₺${fmt(s.yeniEUR)}</td>
              <td class="text-right font-mono" style="color:var(--red)">${isBaz ? '—' : '+' + sym + fmt(s.dMal)}</td>
              <td class="text-right font-mono font-bold" style="color:${c}">${sym}${fmt(s.yeniKar)}</td>
              <td class="text-right font-mono font-bold" style="color:${c}">${s.yeniMarj.toFixed(1)}%</td>
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
      💡 Teklif fiyatı TL cinsinden sabit tutulmuştur. Hesaplama tüm USD/EUR maliyetlerin aynı oranda
      değiştiğini varsayar. Ekipman amortismanı için orantılı pay hesaplanmıştır.
    </div>`;

  // ── Grafik ────────────────────────────────────────
  if (_dovizRiskChart) { _dovizRiskChart.destroy(); _dovizRiskChart = null; }
  const ctx = document.getElementById('chartDovizRisk');
  if (!ctx) return;

  const gPoints = Array.from({ length: 21 }, (_, i) => i * 5);
  const marjlar = gPoints.map(pct => {
    const f   = 1 + pct / 100;
    const mal = tlSabit + usdRaw * kurUSD * f + eurRaw * kurEUR * f;
    return toplamGelir > 0 ? ((toplamGelir - mal) / toplamGelir) * 100 : 0;
  });

  _dovizRiskChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: gPoints.map(p => '+' + p + '%'),
      datasets: [{
        label: 'Kar Marjı',
        data: marjlar,
        borderColor: '#4f7dff',
        backgroundColor: 'rgba(79,125,255,.08)',
        fill: true, tension: 0.3, borderWidth: 2,
        pointRadius: 3,
        pointBackgroundColor: marjlar.map(m => m >= 0 ? '#22c55e' : '#ef4444')
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: {
          title: c => `Kur artışı: ${c[0].label}`,
          label: c => `Kar Marjı: ${c.parsed.y.toFixed(2)}%`
        }}
      },
      scales: {
        x: { grid: { color: 'rgba(46,51,82,.4)' }, ticks: { color: '#8892a4' },
          title: { display: true, text: 'Kur Artışı (%)', color: '#8892a4' } },
        y: { grid: { color: 'rgba(46,51,82,.4)' },
          ticks: { color: '#8892a4', callback: v => v.toFixed(1) + '%' },
          title: { display: true, text: 'Kar Marjı', color: '#8892a4' } }
      }
    },
    plugins: [{
      id: 'bep-line',
      afterDraw(chart) {
        const { ctx: c, scales: { y }, chartArea } = chart;
        const zeroY = y.getPixelForValue(0);
        if (zeroY < chartArea.top || zeroY > chartArea.bottom) return;
        c.save();
        c.beginPath(); c.setLineDash([6, 4]);
        c.strokeStyle = 'rgba(239,68,68,.7)'; c.lineWidth = 1.5;
        c.moveTo(chartArea.left, zeroY); c.lineTo(chartArea.right, zeroY);
        c.stroke();
        c.fillStyle = 'rgba(239,68,68,.85)';
        c.font = 'bold 10px sans-serif'; c.textAlign = 'right';
        c.fillText('Başa Baş', chartArea.right - 4, zeroY - 4);
        c.setLineDash([]); c.restore();
      }
    }]
  });
}

