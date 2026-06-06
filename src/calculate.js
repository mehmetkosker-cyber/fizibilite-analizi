// ── CORE CALCULATION ──────────────────────────────
function calculate() {
  // Validasyon — sadece uyarı, hesaplamayı bloklamaz
  const errors = validateForm();
  const canProceed = applyValidationUI(errors);
  if (!canProceed) return;

  const kdvOrani = parseFloat(document.getElementById('kdvOrani').value) / 100 || 0;
  const paraBirimi = document.getElementById('paraBirimi').value;
  const hedefMarj = parseFloat(document.getElementById('hedefMarj').value) || 20;
  const sym = paraBirimi === 'TL' ? '₺' : paraBirimi === 'USD' ? '$' : '€';

  let toplamMaliyetNet = 0;
  let toplamKdv = 0;
  const tipTotals = { malzeme: 0, iscilik: 0, gider: 0 };

  maliyetRows.forEach(r => {
    const net = rowTotalTL(r);
    const kdv = r.kdv ? net * kdvOrani : 0;
    toplamMaliyetNet += net;
    toplamKdv += kdv;
    tipTotals[r.tip] = (tipTotals[r.tip] || 0) + net;
  });
  const toplamMaliyetKDV = toplamMaliyetNet + toplamKdv;

  const gelirKalemToplam = gelirRows.reduce((s, r) => s + r.miktar * r.birimFiyat, 0);
  const teklifFiyati = parseFloat(document.getElementById('teklifFiyati').value) || 0;
  const toplamGelir = gelirKalemToplam > 0 ? gelirKalemToplam : teklifFiyati;

  const netKar = toplamGelir - toplamMaliyetNet;
  const karMarji = toplamGelir > 0 ? (netKar / toplamGelir) * 100 : 0;
  const roi = toplamMaliyetNet > 0 ? (netKar / toplamMaliyetNet) * 100 : 0;

  document.getElementById('toplamMaliyet').textContent = sym + fmt(toplamMaliyetNet);
  document.getElementById('toplamGelir').textContent = sym + fmt(toplamGelir);

  setKPI('k-gelir', sym + fmt(toplamGelir), toplamGelir >= 0 ? 'text-green' : 'text-red');
  setKPI('k-maliyet', sym + fmt(toplamMaliyetNet), 'text-red');
  setKPI('k-kar', sym + fmt(netKar), netKar >= 0 ? 'text-green' : 'text-red');
  setKPI('k-kdv', sym + fmt(toplamMaliyetKDV), 'text-yellow');
  const vergi = calcVergi(netKar);
  setKPI('k-netkar', sym + fmt(vergi.gercekNet), vergi.gercekNet >= 0 ? 'text-green' : 'text-red');
  const kvO = parseFloat(document.getElementById('kvOrani').value) || 0;
  document.getElementById('k-netkar-sub').textContent = 'KV %' + kvO + ' düşüldükten sonra';

  const marjEl = document.getElementById('k-marj');
  marjEl.textContent = karMarji.toFixed(1) + '%';
  marjEl.className = 'kpi-value ' + marjColor(karMarji);
  document.getElementById('k-marj-sub').textContent = 'Hedef: %' + hedefMarj + ' | ' + (karMarji >= hedefMarj ? 'Hedef aşıldı ✓' : 'Hedefe ' + (hedefMarj - karMarji).toFixed(1) + '% kaldı');

  const roiEl = document.getElementById('k-roi');
  roiEl.textContent = roi.toFixed(1) + '%';
  roiEl.className = 'kpi-value ' + marjColor(roi);

  const kurUSD = parseFloat(document.getElementById('kurUSD').value) || 38;
  const kurEUR = parseFloat(document.getElementById('kurEUR').value) || 41;
  const dovizToplam = { USD: 0, EUR: 0, TL: 0 };
  maliyetRows.forEach(r => { dovizToplam[r.doviz || 'TL'] += r.miktar * r.birimFiyat; });
  const dovizEl = document.getElementById('dovizOzet');
  const hasDoviz = dovizToplam.USD > 0 || dovizToplam.EUR > 0;
  const dovizKart = document.getElementById('dovizKart');
  if (dovizKart) dovizKart.style.display = hasDoviz ? 'block' : 'none';
  if (dovizEl && hasDoviz) {
    const parts = [];
    if (dovizToplam.USD > 0) parts.push(
      `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 10px;background:rgba(34,197,94,.07);border-radius:6px;margin-bottom:6px">
        <span><span style="color:var(--green);font-weight:700">$ USD</span> — $${fmt(dovizToplam.USD)} × ₺${fmt(kurUSD)}</span>
        <span class="font-mono font-bold">₺${fmt(dovizToplam.USD * kurUSD)}</span>
      </div>`);
    if (dovizToplam.EUR > 0) parts.push(
      `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 10px;background:rgba(6,182,212,.07);border-radius:6px;margin-bottom:6px">
        <span><span style="color:var(--cyan);font-weight:700">€ EUR</span> — €${fmt(dovizToplam.EUR)} × ₺${fmt(kurEUR)}</span>
        <span class="font-mono font-bold">₺${fmt(dovizToplam.EUR * kurEUR)}</span>
      </div>`);
    if (dovizToplam.TL > 0) parts.push(
      `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 10px;background:var(--surface2);border-radius:6px;margin-bottom:6px">
        <span><span style="color:var(--muted)">₺ TL kalemleri</span></span>
        <span class="font-mono">₺${fmt(dovizToplam.TL)}</span>
      </div>`);
    parts.push(
      `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 10px;border-top:1px solid var(--border);margin-top:4px">
        <span style="font-weight:700">Toplam Maliyet (TL)</span>
        <span class="font-mono font-bold text-red">₺${fmt(toplamMaliyetNet)}</span>
      </div>`);
    dovizEl.innerHTML = parts.join('');
  }

  const riskLevel = karMarji < 0 ? 'Zarar' : karMarji < 10 ? 'Düşük' : karMarji < 20 ? 'Orta' : 'İyi';
  const riskBadge = karMarji < 0 ? 'badge-red' : karMarji < 10 ? 'badge-red' : karMarji < 20 ? 'badge-yellow' : 'badge-green';
  document.getElementById('hizliOzet').innerHTML = `
    <div style="display:flex;flex-direction:column;gap:8px">
      <div class="flex justify-between"><span style="color:var(--muted)">Gelir</span><span class="text-green font-mono">${sym}${fmt(toplamGelir)}</span></div>
      <div class="flex justify-between"><span style="color:var(--muted)">Maliyet</span><span class="text-red font-mono">${sym}${fmt(toplamMaliyetNet)}</span></div>
      <div class="flex justify-between"><span style="color:var(--muted)">Net Kar</span><span class="${netKar>=0?'text-green':'text-red'} font-mono font-bold">${sym}${fmt(netKar)}</span></div>
      <div class="flex justify-between"><span style="color:var(--muted)">Kar Marjı</span><span class="font-bold ${marjColor(karMarji)}">${karMarji.toFixed(1)}%</span></div>
      <div class="flex justify-between"><span style="color:var(--muted)">Risk Seviyesi</span><span class="badge ${riskBadge}">${riskLevel}</span></div>
    </div>`;

  renderDetayTable(sym, kdvOrani, toplamMaliyetNet);

  const basaBasFiyat = toplamMaliyetNet;
  _simMaliyet = toplamMaliyetNet;
  const hedefFiyat = toplamMaliyetNet / (1 - hedefMarj / 100);
  document.getElementById('basabas').innerHTML = `
    <div class="kpi"><div class="kpi-label">Başa Baş Noktası</div><div class="kpi-value text-yellow font-mono">${sym}${fmt(basaBasFiyat)}</div><div class="kpi-sub">Bu fiyatın altında zarar</div></div>
    <div class="kpi"><div class="kpi-label">Hedef Marj İçin Min. Fiyat</div><div class="kpi-value text-accent font-mono">${sym}${fmt(hedefFiyat)}</div><div class="kpi-sub">%${hedefMarj} kar için gerekli</div></div>
    <div class="kpi"><div class="kpi-label">Mevcut Güvenlik Payı</div><div class="kpi-value ${netKar>=0?'text-green':'text-red'} font-mono">${sym}${fmt(netKar)}</div><div class="kpi-sub">Başa başın ${netKar>=0?'üzerinde':'altında'}</div></div>
  `;

  const kotGelir = parseFloat(document.getElementById('kotumserGelir').value) / 100 || -0.2;
  const kotMal = parseFloat(document.getElementById('kotumserMaliyet').value) / 100 || 0.2;
  const iyiGelir = parseFloat(document.getElementById('iyimserGelir').value) / 100 || 0.1;
  const iyiMal = parseFloat(document.getElementById('iyimserMaliyet').value) / 100 || -0.1;

  const sc = {
    kotumser: calc_scenario(toplamGelir, toplamMaliyetNet, kotGelir, kotMal, sym),
    gercekci: calc_scenario(toplamGelir, toplamMaliyetNet, 0, 0, sym),
    iyimser: calc_scenario(toplamGelir, toplamMaliyetNet, iyiGelir, iyiMal, sym)
  };

  renderScenario('sc-kotumser', sc.kotumser, sym);
  renderScenario('sc-gercekci', sc.gercekci, sym);
  renderScenario('sc-iyimser', sc.iyimser, sym);

  renderRiskGosterge(karMarji, netKar, toplamGelir, sym);

  const duyTbody = document.getElementById('duyarlilikBody');
  if (duyTbody) {
    const duyArtislar = [-30, -20, -10, 0, 10, 20, 30, 40, 50];
    duyTbody.innerHTML = duyArtislar.map(a => {
      const ym = toplamMaliyetNet * (1 + a / 100);
      const duyKar = toplamGelir - ym;
      const duyMarj = toplamGelir > 0 ? (duyKar / toplamGelir) * 100 : 0;
      const duyRoi = ym > 0 ? (duyKar / ym) * 100 : 0;
      const durum = duyMarj < 0 ? '<span class="badge badge-red">Zarar</span>' : duyMarj < 10 ? '<span class="badge badge-yellow">Düşük</span>' : '<span class="badge badge-green">İyi</span>';
      const color = duyMarj < 0 ? 'var(--red)' : duyMarj < 10 ? 'var(--yellow)' : 'var(--green)';
      const isBase = a === 0;
      return `<tr style="${isBase ? 'background:rgba(79,125,255,.06)' : ''}">
        <td style="font-weight:${isBase?'700':'400'}">${isBase ? '0% (Baz)' : (a > 0 ? '+' : '') + a + '%'}</td>
        <td class="text-right font-mono">${sym}${fmt(ym)}</td>
        <td class="text-right font-mono">${sym}${fmt(toplamGelir)}</td>
        <td class="text-right font-mono" style="color:${color};font-weight:700">${sym}${fmt(duyKar)}</td>
        <td class="text-right font-mono" style="color:${color};font-weight:700">${duyMarj.toFixed(1)}%</td>
        <td class="text-right font-mono">${duyRoi.toFixed(1)}%</td>
        <td>${durum}</td>
      </tr>`;
    }).join('');
  }

  renderRapor(sym, toplamGelir, toplamMaliyetNet, toplamMaliyetKDV, netKar, karMarji, roi, sc, hedefMarj, basaBasFiyat);
  updateCharts(tipTotals, toplamGelir, toplamMaliyetNet, netKar, sc, toplamMaliyetNet, sym);
  updateWaterfall(toplamGelir, tipTotals, netKar, sym);
  calcNakit();
  renderVergiTablosu(netKar, sym);
  updateGuvenSkoru(karMarji, roi, netKar, toplamMaliyetNet, sc);
  generateYorum(toplamGelir, toplamMaliyetNet, netKar, karMarji, roi, sc, tipTotals);
  updateRakipChart();
  saveLocal();
}

function calc_scenario(gelir, maliyet, gelirDelta, maliyetDelta, sym) {
  const g = gelir * (1 + gelirDelta);
  const m = maliyet * (1 + maliyetDelta);
  const kar = g - m;
  const marj = g > 0 ? (kar / g) * 100 : 0;
  return { gelir: g, maliyet: m, kar, marj };
}

function renderScenario(id, sc, sym) {
  const color = sc.kar >= 0 ? 'var(--green)' : 'var(--red)';
  document.getElementById(id).innerHTML = `
    <div style="display:flex;flex-direction:column;gap:6px;font-size:13px">
      <div class="flex justify-between"><span style="color:var(--muted)">Gelir</span><span class="font-mono">${sym}${fmt(sc.gelir)}</span></div>
      <div class="flex justify-between"><span style="color:var(--muted)">Maliyet</span><span class="font-mono">${sym}${fmt(sc.maliyet)}</span></div>
      <div class="flex justify-between" style="border-top:1px solid var(--border);padding-top:6px;margin-top:2px">
        <span style="font-weight:700">Net Kar</span>
        <span class="font-mono font-bold" style="color:${color}">${sym}${fmt(sc.kar)}</span>
      </div>
      <div class="flex justify-between"><span style="color:var(--muted)">Kar Marjı</span><span style="font-weight:700;color:${color}">${sc.marj.toFixed(1)}%</span></div>
    </div>`;
}

function renderRiskGosterge(marj, kar, gelir, sym) {
  const items = [
    { label: 'Karlılık Riski', val: Math.min(100, Math.max(0, marj + 50)), color: marjColor(marj), desc: marj < 0 ? 'Zarar var' : marj < 10 ? 'Düşük marj' : marj < 25 ? 'Kabul edilebilir' : 'İyi marj' },
    { label: 'Güvenlik Payı', val: gelir > 0 ? Math.min(100, (kar / gelir + 0.5) * 100) : 50, color: kar >= 0 ? 'var(--green)' : 'var(--red)', desc: sym + fmt(kar) },
  ];
  document.getElementById('riskGosterge').innerHTML = items.map(i => `
    <div style="margin-bottom:16px">
      <div class="flex justify-between" style="margin-bottom:4px">
        <span style="font-size:13px">${i.label}</span>
        <span style="font-size:12px;color:var(--muted)">${i.desc}</span>
      </div>
      <div class="progress-bar"><div class="progress-fill" style="width:${i.val}%;background:${i.color}"></div></div>
    </div>
  `).join('');
}

function renderDetayTable(sym, kdvOrani, totalNet) {
  document.getElementById('detayBody').innerHTML = maliyetRows.map(r => {
    const net = rowTotalTL(r);
    const kdv = r.kdv ? net * kdvOrani : 0;
    const pay = totalNet > 0 ? (net / totalNet * 100).toFixed(1) : '0.0';
    const doviz = r.doviz || 'TL';
    return `<tr>
      <td>${r.ad || '(İsimsiz)'}</td>
      <td><span style="font-size:12px">${TIP_LABELS[r.tip] || r.tip}</span></td>
      <td class="text-right font-mono">${sym}${fmt(net)}</td>
      <td class="text-right font-mono" style="color:var(--yellow)">${sym}${fmt(kdv)}</td>
      <td class="text-right font-mono">${sym}${fmt(net + kdv)}</td>
      <td class="text-right"><div style="display:flex;align-items:center;gap:8px;justify-content:flex-end">
        ${pay}%
        <div style="width:40px;height:5px;background:var(--surface2);border-radius:3px;overflow:hidden">
          <div style="width:${pay}%;height:100%;background:var(--accent);border-radius:3px"></div>
        </div>
      </div></td>
    </tr>`;
  }).join('');
}

function renderRapor(sym, gelir, maliyet, maliyetKDV, kar, marj, roi, sc, hedefMarj, basabas) {
  const projeAdi = document.getElementById('projeAdi').value || 'Belirtilmemiş';
  const musteri = document.getElementById('musteri').value || '-';
  const tarih = document.getElementById('tarih').value || '-';
  const notlar = document.getElementById('notlar').value || '-';
  const riskSev = marj < 0 ? 'Yüksek Risk (Zarar)' : marj < 10 ? 'Yüksek Risk' : marj < 20 ? 'Orta Risk' : 'Düşük Risk';
  const riskBadge = marj < 0 ? 'badge-red' : marj < 10 ? 'badge-red' : marj < 20 ? 'badge-yellow' : 'badge-green';

  document.getElementById('raporIcerik').innerHTML = `
    <div style="max-width:800px;margin:0 auto">
      <div style="text-align:center;margin-bottom:28px;padding-bottom:20px;border-bottom:1px solid var(--border)">
        <h2 style="font-size:22px;margin-bottom:4px">FİZİBİLİTE ANALİZ RAPORU</h2>
        <p style="color:var(--muted)">${projeAdi}</p>
      </div>
      <div class="grid2" style="margin-bottom:20px">
        <div><span style="color:var(--muted);font-size:12px">Proje</span><p>${projeAdi}</p></div>
        <div><span style="color:var(--muted);font-size:12px">Müşteri</span><p>${musteri}</p></div>
        <div><span style="color:var(--muted);font-size:12px">Tarih</span><p>${tarih}</p></div>
        <div><span style="color:var(--muted);font-size:12px">Risk Seviyesi</span><p><span class="badge ${riskBadge}">${riskSev}</span></p></div>
      </div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;font-size:14px">
        <tr style="background:var(--surface2)"><th style="padding:10px;text-align:left;font-size:12px;color:var(--muted)">KALEM</th><th style="padding:10px;text-align:right;font-size:12px;color:var(--muted)">TUTAR</th></tr>
        <tr><td style="padding:10px;border-bottom:1px solid var(--border)">Toplam Gelir (Teklif Fiyatı)</td><td style="padding:10px;text-align:right;border-bottom:1px solid var(--border);color:var(--green);font-weight:700">${sym}${fmt(gelir)}</td></tr>
        <tr><td style="padding:10px;border-bottom:1px solid var(--border)">Toplam Maliyet (KDV Hariç)</td><td style="padding:10px;text-align:right;border-bottom:1px solid var(--border);color:var(--red)">${sym}${fmt(maliyet)}</td></tr>
        <tr><td style="padding:10px;border-bottom:1px solid var(--border)">KDV Tutarı</td><td style="padding:10px;text-align:right;border-bottom:1px solid var(--border);color:var(--yellow)">${sym}${fmt(maliyetKDV - maliyet)}</td></tr>
        <tr><td style="padding:10px;border-bottom:1px solid var(--border)">Toplam Maliyet (KDV Dahil)</td><td style="padding:10px;text-align:right;border-bottom:1px solid var(--border);color:var(--yellow)">${sym}${fmt(maliyetKDV)}</td></tr>
        <tr style="background:var(--surface2)"><td style="padding:10px;font-weight:700">Net Kar</td><td style="padding:10px;text-align:right;font-weight:700;color:${kar>=0?'var(--green)':'var(--red)'}">${sym}${fmt(kar)}</td></tr>
        <tr><td style="padding:10px;border-bottom:1px solid var(--border)">Kar Marjı</td><td style="padding:10px;text-align:right;border-bottom:1px solid var(--border);font-weight:700;color:${marjColor(marj)}">${marj.toFixed(2)}%</td></tr>
        <tr><td style="padding:10px;border-bottom:1px solid var(--border)">ROI</td><td style="padding:10px;text-align:right;border-bottom:1px solid var(--border);font-weight:700;color:${marjColor(roi)}">${roi.toFixed(2)}%</td></tr>
        <tr><td style="padding:10px">Başa Baş Fiyatı</td><td style="padding:10px;text-align:right;color:var(--yellow)">${sym}${fmt(basabas)}</td></tr>
      </table>
      <div class="scenario-grid" style="margin-bottom:20px">
        <div style="border:1px solid var(--red);border-radius:8px;padding:14px">
          <div style="font-size:11px;font-weight:700;color:var(--red);margin-bottom:8px">KÖTÜMSER</div>
          <div style="font-size:13px">Gelir: ${sym}${fmt(sc.kotumser.gelir)}</div>
          <div style="font-size:13px">Maliyet: ${sym}${fmt(sc.kotumser.maliyet)}</div>
          <div style="font-size:14px;font-weight:700;color:${sc.kotumser.kar>=0?'var(--green)':'var(--red)'};margin-top:6px">Kar: ${sym}${fmt(sc.kotumser.kar)} (${sc.kotumser.marj.toFixed(1)}%)</div>
        </div>
        <div style="border:1px solid var(--accent);border-radius:8px;padding:14px">
          <div style="font-size:11px;font-weight:700;color:var(--accent);margin-bottom:8px">GERÇEKÇI (BAZ)</div>
          <div style="font-size:13px">Gelir: ${sym}${fmt(sc.gercekci.gelir)}</div>
          <div style="font-size:13px">Maliyet: ${sym}${fmt(sc.gercekci.maliyet)}</div>
          <div style="font-size:14px;font-weight:700;color:${sc.gercekci.kar>=0?'var(--green)':'var(--red)'};margin-top:6px">Kar: ${sym}${fmt(sc.gercekci.kar)} (${sc.gercekci.marj.toFixed(1)}%)</div>
        </div>
        <div style="border:1px solid var(--green);border-radius:8px;padding:14px">
          <div style="font-size:11px;font-weight:700;color:var(--green);margin-bottom:8px">İYİMSER</div>
          <div style="font-size:13px">Gelir: ${sym}${fmt(sc.iyimser.gelir)}</div>
          <div style="font-size:13px">Maliyet: ${sym}${fmt(sc.iyimser.maliyet)}</div>
          <div style="font-size:14px;font-weight:700;color:${sc.iyimser.kar>=0?'var(--green)':'var(--red)'};margin-top:6px">Kar: ${sym}${fmt(sc.iyimser.kar)} (${sc.iyimser.marj.toFixed(1)}%)</div>
        </div>
      </div>
      ${notlar !== '-' ? `<div style="border:1px solid var(--border);border-radius:8px;padding:16px;background:var(--surface2)"><div style="font-size:11px;color:var(--muted);margin-bottom:6px">NOTLAR</div><p style="font-size:13px">${notlar}</p></div>` : ''}
    </div>`;
}

// ── VERGİ ─────────────────────────────────────────
function calcVergi(netKar) {
  const kvOrani = parseFloat(document.getElementById('kvOrani').value) / 100 || 0;
  const stopajOrani = parseFloat(document.getElementById('stopajOrani').value) / 100 || 0;
  const kvTutar = netKar > 0 ? netKar * kvOrani : 0;
  const karSonrasiKV = netKar - kvTutar;
  const stopajTutar = karSonrasiKV > 0 ? karSonrasiKV * stopajOrani : 0;
  const gercekNet = karSonrasiKV - stopajTutar;
  return { kvTutar, stopajTutar, gercekNet, karSonrasiKV };
}

function renderVergiTablosu(netKar, sym) {
  const v = calcVergi(netKar);
  const el = document.getElementById('vergiTablosu');
  if (!el) return;
  const kvOrani = parseFloat(document.getElementById('kvOrani').value) || 0;
  const stopajOrani = parseFloat(document.getElementById('stopajOrani').value) || 0;
  el.innerHTML = `
    <div class="vergi-satir">
      <span style="color:var(--muted)">Brüt Kâr (KDV hariç)</span>
      <span class="font-mono">${sym}${fmt(netKar)}</span>
    </div>
    <div class="vergi-satir">
      <span style="color:var(--yellow)">— Kurumlar Vergisi (%${kvOrani})</span>
      <span class="font-mono text-yellow">- ${sym}${fmt(v.kvTutar)}</span>
    </div>
    ${stopajOrani > 0 ? `
    <div class="vergi-satir">
      <span style="color:var(--yellow)">— Stopaj (%${stopajOrani})</span>
      <span class="font-mono text-yellow">- ${sym}${fmt(v.stopajTutar)}</span>
    </div>` : ''}
    <div class="vergi-satir toplam">
      <span>Vergi Sonrası Gerçek Net Kâr</span>
      <span class="font-mono ${v.gercekNet >= 0 ? 'text-green' : 'text-red'}">${sym}${fmt(v.gercekNet)}</span>
    </div>
    <div style="margin-top:10px;font-size:12px;color:var(--muted)">
      Efektif vergi yükü: %${netKar > 0 ? (((v.kvTutar + v.stopajTutar) / netKar) * 100).toFixed(1) : '0'}
    </div>`;
}

// ── GÜVEN SKORU ───────────────────────────────────
function calcGuvenSkoru(marj, roi, netKar, toplamMaliyet, sc) {
  const marjPuan = Math.min(40, Math.max(0, marj * 1.5));
  const roiPuan = Math.min(25, Math.max(0, roi * 0.6));
  const tamponPuan = toplamMaliyet > 0 ? Math.min(20, Math.max(0, (netKar / toplamMaliyet) * 40)) : 0;
  const senaryoPuan = sc.kotumser.kar >= 0 ? 15 : sc.kotumser.marj > -5 ? 8 : 0;
  const toplam = Math.round(marjPuan + roiPuan + tamponPuan + senaryoPuan);
  return {
    toplam: Math.min(100, toplam),
    parcalar: [
      { ad: 'Kar Marjı', puan: Math.round(marjPuan), maks: 40 },
      { ad: 'ROI', puan: Math.round(roiPuan), maks: 25 },
      { ad: 'Güvenlik Tamponu', puan: Math.round(tamponPuan), maks: 20 },
      { ad: 'Senaryo Dayanıklılığı', puan: Math.round(senaryoPuan), maks: 15 },
    ]
  };
}

function updateGuvenSkoru(marj, roi, netKar, toplamMaliyet, sc) {
  const skor = calcGuvenSkoru(marj, roi, netKar, toplamMaliyet, sc);
  const pct = skor.toplam / 100;
  const dashLen = 314;
  const offset = dashLen - dashLen * pct;
  const arc = document.getElementById('skorArc');
  const numEl = document.getElementById('skorNum');
  const etiket = document.getElementById('skorEtiket');
  const detay = document.getElementById('skorDetay');
  if (!arc) return;

  const color = skor.toplam < 30 ? '#ef4444' : skor.toplam < 55 ? '#f59e0b' : skor.toplam < 75 ? '#4f7dff' : '#22c55e';
  arc.setAttribute('stroke', color);
  arc.setAttribute('stroke-dashoffset', offset.toFixed(1));
  numEl.textContent = skor.toplam;
  numEl.style.color = color;

  const etiketler = [
    [0, 'Yüksek Risk'], [30, 'Riskli'], [55, 'Kabul Edilebilir'], [75, 'İyi'], [85, 'Mükemmel']
  ];
  const e = etiketler.reduce((a, b) => skor.toplam >= b[0] ? b : a);
  etiket.textContent = e[1];
  etiket.style.color = color;

  detay.innerHTML = skor.parcalar.map(p => `
    <div>
      <div class="flex justify-between" style="margin-bottom:3px">
        <span style="font-size:12px;color:var(--muted)">${p.ad}</span>
        <span style="font-size:12px;font-weight:600">${p.puan}/${p.maks}</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width:${(p.puan/p.maks*100).toFixed(0)}%;background:${color}"></div>
      </div>
    </div>
  `).join('');
}
