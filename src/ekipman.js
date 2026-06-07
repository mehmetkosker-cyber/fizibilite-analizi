// ── EKİPMAN / CİHAZ KURULUMU & AMORTİSMAN ────────

function addEkipman() {
  const id = ++ekipmanCounter;
  ekipmanRows.push({
    id,
    ad: '',
    adet: 1,
    birimFiyat: 0,
    doviz: 'TL',
    kurulumMaliyet: 0,
    omurAy: 36,
    hurdaDeger: 0,
    yontem: 'dogrusal',
    mod: 'kit',
    kdv: true
  });
  renderEkipmanTable();
  calculate();
}

function removeEkipman(id) {
  ekipmanRows = ekipmanRows.filter(e => e.id !== id);
  renderEkipmanTable();
  calculate();
}

function updateEkipman(id, field, val) {
  const e = ekipmanRows.find(e => e.id === id);
  if (!e) return;
  if (field === 'kdv') e.kdv = val;
  else if (['adet','birimFiyat','kurulumMaliyet','omurAy','hurdaDeger'].includes(field))
    e[field] = parseFloat(val) || 0;
  else e[field] = val;
  renderEkipmanSatirHesap(id);
  calculate();
}

// ── Hesaplama ──────────────────────────────────────
function ekipmanToplamSatis(e) {
  return e.adet * e.birimFiyat * getKur(e.doviz) + e.kurulumMaliyet;
}

function calcEkipmanProjeMaliyet(e, projeSureAy) {
  const toplam = ekipmanToplamSatis(e);
  if (e.mod === 'kit') return toplam;

  const amortisanBaz = Math.max(0, toplam - e.hurdaDeger);
  const proje = Math.min(projeSureAy, e.omurAy);

  if (e.yontem === 'dogrusal') {
    return e.omurAy > 0 ? (amortisanBaz / e.omurAy) * proje : 0;
  }
  // Azalan bakiyeler
  const rate = e.omurAy > 0 ? 2 / e.omurAy : 0;
  let deger = amortisanBaz;
  let toplam_amortisan = 0;
  for (let ay = 0; ay < proje; ay++) {
    const aylik = deger * rate;
    toplam_amortisan += aylik;
    deger -= aylik;
    if (deger <= 0) break;
  }
  return toplam_amortisan;
}

function totalEkipmanMaliyet() {
  const projeSureAy = parseInt(document.getElementById('nakitSure')?.value) || 6;
  return ekipmanRows.reduce((s, e) => s + calcEkipmanProjeMaliyet(e, projeSureAy), 0);
}

function calcAmortisanTablosu(e) {
  const toplam = ekipmanToplamSatis(e);
  const amortisanBaz = Math.max(0, toplam - e.hurdaDeger);
  const satirlar = [];

  if (e.yontem === 'dogrusal') {
    const aylik = e.omurAy > 0 ? amortisanBaz / e.omurAy : 0;
    let deger = toplam;
    for (let ay = 1; ay <= e.omurAy; ay++) {
      deger -= aylik;
      satirlar.push({ ay, amortisan: aylik, netDeger: Math.max(e.hurdaDeger, deger) });
    }
  } else {
    const rate = e.omurAy > 0 ? 2 / e.omurAy : 0;
    let deger = amortisanBaz;
    for (let ay = 1; ay <= e.omurAy; ay++) {
      const aylik = deger * rate;
      deger -= aylik;
      satirlar.push({ ay, amortisan: aylik, netDeger: Math.max(0, deger) + e.hurdaDeger });
      if (deger <= 0) break;
    }
  }
  return satirlar;
}

// ── Render ─────────────────────────────────────────
function renderEkipmanTable() {
  const tbody = document.getElementById('ekipmanBody');
  if (!tbody) return;

  if (ekipmanRows.length === 0) {
    tbody.innerHTML = `<tr><td colspan="12" style="text-align:center;padding:20px;color:var(--muted);font-size:13px">
      Henüz cihaz eklenmedi. "+ Cihaz / Kit Ekle" butonuna tıklayın.
    </td></tr>`;
    renderAmortisanPaneli();
    return;
  }

  const projeSureAy = parseInt(document.getElementById('nakitSure')?.value) || 6;

  tbody.innerHTML = ekipmanRows.map((e, i) => {
    const doviz = e.doviz || 'TL';
    const dovizColor = doviz === 'USD' ? 'var(--green)' : doviz === 'EUR' ? 'var(--cyan)' : 'var(--muted)';
    const dovizSym   = doviz === 'USD' ? '$' : doviz === 'EUR' ? '€' : '₺';
    const projeMaliyet = calcEkipmanProjeMaliyet(e, projeSureAy);
    const toplamSatis  = ekipmanToplamSatis(e);
    const isKit = e.mod === 'kit';

    return `<tr>
      <td style="color:var(--muted)">${i + 1}</td>
      <td><input type="text" value="${e.ad}" onchange="updateEkipman(${e.id},'ad',this.value)"
        placeholder="Cihaz / ekipman adı" style="min-width:140px"></td>
      <td><input type="number" value="${e.adet}" min="1" step="1"
        oninput="updateEkipman(${e.id},'adet',this.value)" style="width:55px"></td>
      <td>
        <div style="display:flex;align-items:center;gap:3px">
          <span style="color:${dovizColor};font-size:12px">${dovizSym}</span>
          <input type="number" value="${e.birimFiyat}" min="0" step="any"
            oninput="updateEkipman(${e.id},'birimFiyat',this.value)"
            placeholder="0.00" style="width:100px">
        </div>
      </td>
      <td>
        <select onchange="updateEkipman(${e.id},'doviz',this.value)"
          style="padding:5px 4px;font-size:12px;font-weight:600;color:${dovizColor}">
          <option value="TL"  ${doviz==='TL' ?'selected':''}>₺ TL</option>
          <option value="USD" ${doviz==='USD'?'selected':''}>$ USD</option>
          <option value="EUR" ${doviz==='EUR'?'selected':''}>€ EUR</option>
        </select>
      </td>
      <td><input type="number" value="${e.kurulumMaliyet}" min="0" step="any"
        oninput="updateEkipman(${e.id},'kurulumMaliyet',this.value)"
        placeholder="0.00" style="width:90px"></td>
      <td>
        <select onchange="updateEkipman(${e.id},'mod',this.value)"
          style="padding:5px 4px;font-size:12px">
          <option value="kit"       ${e.mod==='kit'      ?'selected':''}>📦 Kit (Tam)</option>
          <option value="amortisan" ${e.mod==='amortisan'?'selected':''}>📉 Amortisman</option>
        </select>
      </td>
      <td style="${isKit?'opacity:.35;pointer-events:none':''}">
        <input type="number" value="${e.omurAy}" min="1" max="240"
          oninput="updateEkipman(${e.id},'omurAy',this.value)"
          style="width:55px" title="Faydalı ömür (ay)">
      </td>
      <td style="${isKit?'opacity:.35;pointer-events:none':''}">
        <input type="number" value="${e.hurdaDeger}" min="0" step="any"
          oninput="updateEkipman(${e.id},'hurdaDeger',this.value)"
          placeholder="0" style="width:80px">
      </td>
      <td style="${isKit?'opacity:.35;pointer-events:none':''}">
        <select onchange="updateEkipman(${e.id},'yontem',this.value)"
          style="padding:5px 4px;font-size:12px">
          <option value="dogrusal" ${e.yontem==='dogrusal'?'selected':''}>Doğrusal</option>
          <option value="azalan"   ${e.yontem==='azalan'  ?'selected':''}>Azalan</option>
        </select>
      </td>
      <td style="text-align:center">
        <input type="checkbox" ${e.kdv?'checked':''} onchange="updateEkipman(${e.id},'kdv',this.checked)"
          title="KDV Dahil Et"></td>
      <td class="font-mono" id="ekprojeMaliyet-${e.id}"
        style="color:var(--accent);font-weight:700;white-space:nowrap">
        ${isKit
          ? `₺${fmt(toplamSatis)}<br><span style="font-size:10px;color:var(--muted)">tam maliyet</span>`
          : `₺${fmt(projeMaliyet)}<br><span style="font-size:10px;color:var(--muted)">${projeSureAy} ay payı</span>`}
      </td>
      <td><button class="btn btn-danger" onclick="removeEkipman(${e.id})">✕</button></td>
    </tr>`;
  }).join('');

  renderAmortisanPaneli();
}

function renderEkipmanSatirHesap(id) {
  const e = ekipmanRows.find(e => e.id === id);
  if (!e) return;
  const projeSureAy = parseInt(document.getElementById('nakitSure')?.value) || 6;
  const projeMaliyet = calcEkipmanProjeMaliyet(e, projeSureAy);
  const toplamSatis  = ekipmanToplamSatis(e);
  const el = document.getElementById(`ekprojeMaliyet-${id}`);
  if (el) {
    el.innerHTML = e.mod === 'kit'
      ? `₺${fmt(toplamSatis)}<br><span style="font-size:10px;color:var(--muted)">tam maliyet</span>`
      : `₺${fmt(projeMaliyet)}<br><span style="font-size:10px;color:var(--muted)">${projeSureAy} ay payı</span>`;
  }
}

// ── Amortisman Paneli (Karlılık Analizi sekmesi) ───
function renderAmortisanPaneli() {
  const el = document.getElementById('amortisanPaneli');
  if (!el) return;

  const sym = (() => { const p = document.getElementById('paraBirimi')?.value||'TL'; return p==='TL'?'₺':p==='USD'?'$':'€'; })();
  const projeSureAy = parseInt(document.getElementById('nakitSure')?.value) || 6;
  const kdvOrani = parseFloat(document.getElementById('kdvOrani')?.value) / 100 || 0;

  if (ekipmanRows.length === 0) {
    el.innerHTML = `<div style="text-align:center;padding:24px;color:var(--muted);font-size:13px">
      Cihaz eklenmemiş. Veri Girişi → Cihaz/Kit Kurulumu bölümünden ekleyin.</div>`;
    return;
  }

  // KPI: toplam ekipman maliyeti + amortisman özet
  const toplamEkipmanMaliyeti = totalEkipmanMaliyet();
  const toplamKitSatis = ekipmanRows.filter(e=>e.mod==='kit').reduce((s,e)=>s+ekipmanToplamSatis(e),0);
  const toplamAmortisan = ekipmanRows.filter(e=>e.mod==='amortisan').reduce((s,e)=>s+calcEkipmanProjeMaliyet(e,projeSureAy),0);

  let html = `
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px">
      <div class="kpi">
        <div class="kpi-label">Toplam Ekipman Maliyeti</div>
        <div class="kpi-value text-accent font-mono">₺${fmt(toplamEkipmanMaliyeti)}</div>
        <div class="kpi-sub">Projeye yüklenen tutar</div>
      </div>
      <div class="kpi">
        <div class="kpi-label">Kit (Tam Maliyet)</div>
        <div class="kpi-value text-red font-mono">₺${fmt(toplamKitSatis)}</div>
        <div class="kpi-sub">Müşteriye teslim edilen cihazlar</div>
      </div>
      <div class="kpi">
        <div class="kpi-label">Amortisman Payı (${projeSureAy} Ay)</div>
        <div class="kpi-value text-yellow font-mono">₺${fmt(toplamAmortisan)}</div>
        <div class="kpi-sub">Proje süresine düşen kullanım payı</div>
      </div>
    </div>`;

  // Her cihaz için özet satır
  html += `<table class="data-table" style="margin-bottom:16px">
    <thead><tr>
      <th>Cihaz / Ekipman</th>
      <th>Mod</th>
      <th class="text-right">Toplam Değer</th>
      <th class="text-right">Hurda Değer</th>
      <th class="text-right">Ömür</th>
      <th class="text-right">Aylık Amortisman</th>
      <th class="text-right">Proje Payı (${projeSureAy} ay)</th>
    </tr></thead><tbody>`;

  ekipmanRows.forEach(e => {
    const toplam = ekipmanToplamSatis(e);
    const projeMal = calcEkipmanProjeMaliyet(e, projeSureAy);
    const aylikAmort = e.mod==='amortisan' && e.omurAy>0
      ? (e.yontem==='dogrusal' ? (toplam-e.hurdaDeger)/e.omurAy : (toplam-e.hurdaDeger)*2/e.omurAy)
      : 0;
    const modLabel = e.mod==='kit'
      ? '<span class="badge badge-yellow">📦 Kit</span>'
      : '<span class="badge badge-green">📉 Amortisman</span>';

    html += `<tr>
      <td><strong>${e.ad||'(İsimsiz)'}</strong><br>
        <span style="font-size:11px;color:var(--muted)">${e.adet} adet × ₺${fmt(e.birimFiyat*getKur(e.doviz))}</span></td>
      <td>${modLabel}</td>
      <td class="text-right font-mono">₺${fmt(toplam)}</td>
      <td class="text-right font-mono" style="color:var(--muted)">₺${fmt(e.hurdaDeger)}</td>
      <td class="text-right">${e.mod==='amortisan'?e.omurAy+' ay':'—'}</td>
      <td class="text-right font-mono" style="color:var(--yellow)">${e.mod==='amortisan'?'₺'+fmt(aylikAmort):'—'}</td>
      <td class="text-right font-mono font-bold" style="color:var(--accent)">₺${fmt(projeMal)}</td>
    </tr>`;
  });

  html += '</tbody></table>';

  // Amortisman çizelgesi (sadece amortisan modundakiler)
  const amortisanList = ekipmanRows.filter(e => e.mod === 'amortisan');
  if (amortisanList.length > 0) {
    html += `<div style="font-size:12px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.4px;margin-bottom:10px">
      Detaylı Amortisman Çizelgesi</div>`;

    amortisanList.forEach(e => {
      const tablo = calcAmortisanTablosu(e);
      const toplam = ekipmanToplamSatis(e);
      html += `
        <div style="margin-bottom:16px;border:1px solid var(--border);border-radius:8px;overflow:hidden">
          <div style="background:var(--surface2);padding:10px 14px;display:flex;justify-content:space-between;align-items:center">
            <div style="font-weight:600">${e.ad||'(İsimsiz)'} — ${e.yontem==='dogrusal'?'Doğrusal':'Azalan Bakiyeler'}</div>
            <div style="font-size:12px;color:var(--muted)">Başlangıç: ₺${fmt(toplam)} · Hurda: ₺${fmt(e.hurdaDeger)}</div>
          </div>
          <div style="max-height:200px;overflow-y:auto">
            <table class="data-table">
              <thead><tr>
                <th>Ay</th>
                <th class="text-right">Amortisman</th>
                <th class="text-right">Net Defter Değeri</th>
                <th>Proje İçi</th>
              </tr></thead><tbody>
              ${tablo.map(s => {
                const isProje = s.ay <= projeSureAy;
                return `<tr style="${isProje?'background:rgba(79,125,255,.05)':''}">
                  <td style="font-weight:${isProje?'700':'400'}">${s.ay}. Ay${isProje?' ◀':''}</td>
                  <td class="text-right font-mono" style="color:var(--yellow)">₺${fmt(s.amortisan)}</td>
                  <td class="text-right font-mono">₺${fmt(s.netDeger)}</td>
                  <td>${isProje?'<span class="badge badge-green">Proje</span>':'<span style="color:var(--muted);font-size:11px">Sonrası</span>'}</td>
                </tr>`;
              }).join('')}
              </tbody>
            </table>
          </div>
        </div>`;
    });
  }

  el.innerHTML = html;
}

function ekipmanOzetSatiri(sym) {
  const projeSureAy = parseInt(document.getElementById('nakitSure')?.value) || 6;
  return ekipmanRows.map(e => {
    const net = calcEkipmanProjeMaliyet(e, projeSureAy);
    return `<tr style="background:rgba(124,92,252,.04)">
      <td>${e.ad||'(İsimsiz cihaz)'}</td>
      <td><span style="font-size:12px">🖥️ Ekipman</span></td>
      <td class="text-right font-mono">${sym}${fmt(net)}</td>
      <td class="text-right font-mono" style="color:var(--yellow)">${sym}${fmt(e.kdv?(net*(parseFloat(document.getElementById('kdvOrani').value)||0)/100):0)}</td>
      <td class="text-right font-mono">${sym}${fmt(net*(1+(e.kdv?(parseFloat(document.getElementById('kdvOrani').value)||0)/100:0)))}</td>
      <td class="text-right">—</td>
    </tr>`;
  }).join('');
}
