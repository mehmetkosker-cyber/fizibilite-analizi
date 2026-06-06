// ── RAKİP ANALİZİ ─────────────────────────────────
function addRakip() {
  if (rakipRows.length >= 4) return;
  const id = ++rakipCounter;
  rakipRows.push({ id, ad: 'Rakip ' + id, fiyat: 0 });
  renderRakipRows();
}

function removeRakip(id) {
  rakipRows = rakipRows.filter(r => r.id !== id);
  renderRakipRows();
  updateRakipChart();
}

function updateRakipRow(id, field, val) {
  const r = rakipRows.find(r => r.id === id);
  if (!r) return;
  r[field] = field === 'fiyat' ? parseFloat(val) || 0 : val;
  updateRakipChart();
}

function renderRakipRows() {
  document.getElementById('rakipRows').innerHTML = rakipRows.map(r => `
    <div class="flex items-center gap8">
      <input type="text" value="${r.ad}" onchange="updateRakipRow(${r.id},'ad',this.value)"
        style="flex:1" placeholder="Rakip adı">
      <input type="number" value="${r.fiyat}" oninput="updateRakipRow(${r.id},'fiyat',this.value)"
        style="width:140px" placeholder="Fiyat">
      <button class="btn btn-danger" onclick="removeRakip(${r.id})">✕</button>
    </div>
  `).join('');
}

function updateRakipChart() {
  const paraBirimi = document.getElementById('paraBirimi').value;
  const sym = paraBirimi === 'TL' ? '₺' : paraBirimi === 'USD' ? '$' : '€';
  const bizimFiyat = parseFloat(document.getElementById('teklifFiyati').value) || 0;

  document.getElementById('bizimFiyatDisplay').textContent = sym + fmt(bizimFiyat);

  const tumFiyatlar = [...rakipRows.map(r => r.fiyat), bizimFiyat].filter(f => f > 0);
  if (tumFiyatlar.length === 0) {
    document.getElementById('rakipChart').innerHTML = '<p style="color:var(--muted);font-size:13px">Fiyat girisi bekleniyor...</p>';
    return;
  }
  const maks = Math.max(...tumFiyatlar) * 1.1;
  const sirali = [...rakipRows.map(r => ({ ad: r.ad, fiyat: r.fiyat, bizim: false })),
    { ad: '⭐ Sizin Teklifiniz', fiyat: bizimFiyat, bizim: true }]
    .filter(r => r.fiyat > 0)
    .sort((a, b) => a.fiyat - b.fiyat);

  const html = sirali.map((r, i) => {
    const pct = (r.fiyat / maks * 100).toFixed(1);
    const color = r.bizim ? 'var(--accent)' : 'var(--muted)';
    const rank = i + 1;
    return `
      <div class="rakip-card" style="border:1px solid ${r.bizim ? 'var(--accent)' : 'var(--border)'}">
        <div class="flex justify-between items-center">
          <span style="font-size:12px;font-weight:${r.bizim?'700':'400'};color:${color}">${rank}. ${r.ad}</span>
          <span class="font-mono" style="color:${color};font-weight:700">${sym}${fmt(r.fiyat)}</span>
        </div>
        <div class="rakip-bar"><div class="rakip-fill" style="width:${pct}%;background:${color}"></div></div>
      </div>`;
  }).join('');

  document.getElementById('rakipChart').innerHTML = html;

  const bizimSira = sirali.findIndex(r => r.bizim) + 1;
  const toplam = sirali.length;
  const pozisyon = bizimSira === 1 ? 'en düşük teklif' : bizimSira === toplam ? 'en yüksek teklif' : `${bizimSira}. sıra`;
  const ucuzRakip = sirali.filter(r => !r.bizim && r.fiyat < bizimFiyat);
  const pahalıRakip = sirali.filter(r => !r.bizim && r.fiyat > bizimFiyat);

  let yorumHtml = `<div style="font-size:13px;line-height:1.7">
    Teklifiniz <strong style="color:var(--accent)">${toplam} aday arasında ${pozisyon}</strong> konumunda.`;
  if (ucuzRakip.length > 0) yorumHtml += ` ${ucuzRakip.length} rakip daha düşük fiyat veriyor.`;
  if (pahalıRakip.length > 0) yorumHtml += ` ${pahalıRakip.length} rakip daha yüksek fiyat veriyor.`;
  yorumHtml += '</div>';
  document.getElementById('rakipYorum').innerHTML = yorumHtml;
}

// ── OTOMATİK YORUM ────────────────────────────────
function generateYorum(gelir, maliyet, netKar, marj, roi, sc, tipTotals) {
  const sym = document.getElementById('paraBirimi').value === 'TL' ? '₺' : '$';
  const items = [];

  if (gelir === 0) {
    items.push('⚠️ Henüz teklif fiyatı girilmemiş. Analiz için Veri Girişi sekmesinden teklif fiyatı belirleyin.');
    document.getElementById('otomatikYorum').innerHTML = `<div class="yorum-box">${items.join('<br>')}</div>`;
    return;
  }

  if (marj < 0) items.push(`🔴 <strong>Zarar uyarısı:</strong> Mevcut fiyatlamada ${sym}${fmt(Math.abs(netKar))} zarar edilecek. Teklif fiyatını en az ${sym}${fmt(maliyet)} üzerine çekmeniz gerekiyor.`);
  else if (marj < 8) items.push(`🟡 Kar marjı oldukça düşük (%${marj.toFixed(1)}). Beklenmedik bir maliyet artışı bu projeyi zarara sokabilir.`);
  else if (marj > 30) items.push(`🟢 Güçlü kar marjı (%${marj.toFixed(1)}). Rekabetçi fiyatlama açısından teklifin biraz düşürülmesi ihale kazanma şansını artırabilir.`);
  else items.push(`🟢 Kar marjı (%${marj.toFixed(1)}) makul aralıkta.`);

  const totalM = Object.values(tipTotals).reduce((a,b) => a+b, 0);
  if (totalM > 0) {
    const iscilikPct = ((tipTotals.iscilik || 0) / totalM * 100).toFixed(0);
    const malzemePct = ((tipTotals.malzeme || 0) / totalM * 100).toFixed(0);
    if (tipTotals.iscilik > tipTotals.malzeme && tipTotals.iscilik > (tipTotals.gider || 0))
      items.push(`👷 Maliyet yapısının %${iscilikPct}'i işçilikten oluşuyor. İşçilik kaynaklı projelerde verimlilik ve devamsızlık riski gözetilmeli.`);
    else if (tipTotals.malzeme > tipTotals.iscilik)
      items.push(`📦 Malzeme maliyetleri toplam maliyetin %${malzemePct}'ini oluşturuyor. Tedarik fiyatlarındaki dalgalanmalar projeyi etkiler — sabit fiyatlı tedarikçi anlaşması yapılması önerilir.`);
  }

  if (sc.kotumser.kar < 0)
    items.push(`⚠️ Kötümser senaryoda proje zarar ediyor (${sym}${fmt(sc.kotumser.kar)}). Acil durum bütçesi veya esnek fiyat maddesi eklenebilir.`);
  else
    items.push(`✅ Kötümser senaryoda bile proje karlı kalıyor (${sym}${fmt(sc.kotumser.kar)}). Risk tamponu yeterli.`);

  if (roi > 25) items.push(`📈 ROI %${roi.toFixed(1)} ile yüksek — bu projeye sermaye tahsis etmek verimli.`);
  else if (roi < 10) items.push(`📉 ROI %${roi.toFixed(1)} ile düşük. Alternatif projelerin getirisiyle karşılaştırılması önerilir.`);

  const bizimFiyat = parseFloat(document.getElementById('teklifFiyati').value) || 0;
  if (rakipRows.length > 0 && bizimFiyat > 0) {
    const daha_ucuz = rakipRows.filter(r => r.fiyat > 0 && r.fiyat < bizimFiyat).length;
    if (daha_ucuz > 0) items.push(`🏁 ${daha_ucuz} rakip daha düşük fiyat veriyor. Fiyat düşürmek yerine değer önerinizi (garanti, süre, deneyim) ön plana çıkarın.`);
    else if (rakipRows.filter(r => r.fiyat > 0).length > 0) items.push(`🏆 Tüm rakiplerden düşük fiyat veriyorsunuz. Kazanma olasılığınız yüksek, ancak bıraktığınız marjı tekrar değerlendirin.`);
  }

  const html = `<ul>${items.map(i => `<li>${i}</li>`).join('')}</ul>`;
  const el = document.getElementById('otomatikYorum');
  if (el) el.innerHTML = html;
}
