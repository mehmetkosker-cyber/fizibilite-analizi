// ── ÜRÜN KATALOĞU ─────────────────────────────────
function katalogEkle(veri) {
  const id = ++urunCounter;
  urunler.push({
    id, secili: false,
    ad: veri?.ad || '',
    tip: veri?.tip || 'urun',
    birim: veri?.birim || 'Adet',
    alisDoviz: veri?.alisDoviz || 'TL',
    alisFiyat: veri?.alisFiyat || 0,
    satisFiyat: veri?.satisFiyat || 0,
    kdv: veri?.kdv ?? 20,
    notlar: veri?.notlar || '',
  });
  renderKatalog();
  saveLocal();
  setTimeout(() => {
    const inp = document.querySelector(`#krow-${id} .ks-input`);
    if (inp) inp.focus();
  }, 50);
}

function katalogSil(id) {
  urunler = urunler.filter(u => u.id !== id);
  renderKatalog();
  saveLocal();
}

function katalogGuncelle(id, field, val) {
  const u = urunler.find(u => u.id === id);
  if (!u) return;
  if (['alisFiyat','satisFiyat','kdv'].includes(field)) u[field] = parseFloat(val) || 0;
  else u[field] = val;
  renderKatalogSatirHesap(id);
  katalogStatsGuncelle();
  saveLocal();
}

function katalogSecToggle(id, checked) {
  const u = urunler.find(u => u.id === id);
  if (u) u.secili = checked;
  katalogButonGuncelle();
}

function katalogHepsiniSec(checked) {
  const gorunen = katalogGorunenler();
  gorunen.forEach(u => { u.secili = checked; });
  renderKatalog();
  katalogButonGuncelle();
}

function katalogButonGuncelle() {
  const secSayi = urunler.filter(u => u.secili).length;
  const mb = document.getElementById('btnCokluMaliyet');
  const gb = document.getElementById('btnCokluGelir');
  if (mb) { mb.disabled = secSayi === 0; mb.textContent = secSayi > 0 ? `↓ ${secSayi} Kalemi Maliyet'e Ekle` : '↓ Seçilenleri Maliyet\'e Ekle'; }
  if (gb) { gb.disabled = secSayi === 0; gb.textContent = secSayi > 0 ? `↑ ${secSayi} Kalemi Gelir'e Ekle`   : '↑ Seçilenleri Gelir\'e Ekle'; }
}

function katalogGorunenler() {
  const arama = (document.getElementById('katalogArama')?.value || '').toLowerCase();
  const filtre = document.getElementById('katalogFiltreTip')?.value || '';
  return urunler.filter(u =>
    (!arama  || u.ad.toLowerCase().includes(arama) || (u.notlar||'').toLowerCase().includes(arama)) &&
    (!filtre || u.tip === filtre)
  );
}

function katalogSirala(key) {
  if (katalogSiralaKey === key) katalogSiralaDuz = !katalogSiralaDuz;
  else { katalogSiralaKey = key; katalogSiralaDuz = true; }
  renderKatalog();
}

function urunAlisTL(u) {
  const kur = u.alisDoviz === 'USD' ? (parseFloat(document.getElementById('kurUSD')?.value) || 38)
            : u.alisDoviz === 'EUR' ? (parseFloat(document.getElementById('kurEUR')?.value) || 41) : 1;
  return u.alisFiyat * kur;
}

function urunKar(u)  { return u.satisFiyat - urunAlisTL(u); }
function urunMarj(u) { return u.satisFiyat > 0 ? (urunKar(u) / u.satisFiyat * 100) : 0; }

function renderKatalogSatirHesap(id) {
  const u = urunler.find(u => u.id === id);
  if (!u) return;
  const alisTL = urunAlisTL(u);
  const kar = urunKar(u);
  const marj = urunMarj(u);
  const alisTLEl = document.getElementById(`kalisTL-${id}`);
  const karEl    = document.getElementById(`kkar-${id}`);
  const marjEl   = document.getElementById(`kmarj-${id}`);
  if (alisTLEl) alisTLEl.textContent = '₺' + fmt(alisTL);
  if (karEl) { karEl.textContent = '₺' + fmt(kar); karEl.style.color = kar >= 0 ? 'var(--green)' : 'var(--red)'; }
  if (marjEl) {
    const cls = marj < 0 ? 'badge-red' : marj < 10 ? 'badge-yellow' : 'badge-green';
    marjEl.innerHTML = `<span class="marj-chip ${cls}">${marj.toFixed(1)}%</span>`;
  }
}

function renderKatalog() {
  const tbody = document.getElementById('katalogBody');
  if (!tbody) return;
  let liste = katalogGorunenler();

  const key = katalogSiralaKey;
  liste = liste.sort((a, b) => {
    let va, vb;
    if (key === 'alisTL') { va = urunAlisTL(a); vb = urunAlisTL(b); }
    else if (key === 'kar')  { va = urunKar(a);  vb = urunKar(b);  }
    else if (key === 'marj') { va = urunMarj(a); vb = urunMarj(b); }
    else { va = a[key] ?? ''; vb = b[key] ?? ''; }
    if (typeof va === 'string') return katalogSiralaDuz ? va.localeCompare(vb,'tr') : vb.localeCompare(va,'tr');
    return katalogSiralaDuz ? va - vb : vb - va;
  });

  tbody.innerHTML = liste.map(u => {
    const alisTL = urunAlisTL(u);
    const kar = urunKar(u);
    const marj = urunMarj(u);
    const marjCls = marj < 0 ? 'badge-red' : marj < 10 ? 'badge-yellow' : 'badge-green';
    const dovizColor = u.alisDoviz === 'USD' ? 'var(--green)' : u.alisDoviz === 'EUR' ? 'var(--cyan)' : 'var(--muted)';
    const dovizSym   = u.alisDoviz === 'USD' ? '$' : u.alisDoviz === 'EUR' ? '€' : '₺';
    return `
    <tr class="kstr${u.secili?' selected':''}" id="krow-${u.id}">
      <td style="text-align:center">
        <input type="checkbox" ${u.secili?'checked':''} style="width:14px;height:14px;cursor:pointer"
          onchange="katalogSecToggle(${u.id},this.checked)">
      </td>
      <td><input class="ks-input" value="${u.ad}" placeholder="Ürün / Hizmet adı"
        onchange="katalogGuncelle(${u.id},'ad',this.value)"
        onkeydown="katalogKeyNav(event,${u.id},'ad')"></td>
      <td>
        <select class="ks-select" onchange="katalogGuncelle(${u.id},'tip',this.value)">
          ${['malzeme','hizmet','urun','diger'].map(t=>`<option value="${t}" ${u.tip===t?'selected':''}>${TIP_ETIKET[t]}</option>`).join('')}
        </select>
      </td>
      <td><input class="ks-input" value="${u.birim}" placeholder="Adet"
        onchange="katalogGuncelle(${u.id},'birim',this.value)" style="width:60px"></td>
      <td>
        <select class="ks-select" onchange="katalogGuncelle(${u.id},'alisDoviz',this.value);renderKatalog()"
          style="color:${dovizColor};font-weight:600">
          <option value="TL"  ${u.alisDoviz==='TL' ?'selected':''}>₺ TL</option>
          <option value="USD" ${u.alisDoviz==='USD'?'selected':''}>$ USD</option>
          <option value="EUR" ${u.alisDoviz==='EUR'?'selected':''}>€ EUR</option>
        </select>
      </td>
      <td>
        <div style="display:flex;align-items:center;gap:3px">
          <span style="color:${dovizColor};font-size:12px">${dovizSym}</span>
          <input class="ks-input" type="number" value="${u.alisFiyat}" min="0" step="any" placeholder="0.00"
            oninput="katalogGuncelle(${u.id},'alisFiyat',this.value)"
            onkeydown="katalogKeyNav(event,${u.id},'alisFiyat')" style="width:85px">
        </div>
      </td>
      <td>
        <div style="display:flex;align-items:center;gap:3px">
          <span style="color:var(--muted);font-size:12px">₺</span>
          <input class="ks-input" type="number" value="${u.satisFiyat}" min="0" step="any" placeholder="0.00"
            oninput="katalogGuncelle(${u.id},'satisFiyat',this.value)"
            onkeydown="katalogKeyNav(event,${u.id},'satisFiyat')" style="width:85px">
        </div>
      </td>
      <td><input class="ks-input" type="number" value="${u.kdv}" min="0" max="100"
        oninput="katalogGuncelle(${u.id},'kdv',this.value)" style="width:48px"></td>
      <td class="font-mono" id="kalisTL-${u.id}" style="color:var(--muted)">₺${fmt(alisTL)}</td>
      <td class="font-mono" id="kkar-${u.id}"  style="color:${kar>=0?'var(--green)':'var(--red)'};font-weight:600">₺${fmt(kar)}</td>
      <td id="kmarj-${u.id}"><span class="marj-chip ${marjCls}">${marj.toFixed(1)}%</span></td>
      <td><input class="ks-input" value="${u.notlar||''}" placeholder="Not..."
        onchange="katalogGuncelle(${u.id},'notlar',this.value)"></td>
      <td style="white-space:nowrap">
        <button class="btn btn-ghost" style="padding:3px 7px;font-size:11px;margin-right:2px"
          onclick="katalogAnalizEkle(${u.id},'maliyet')" title="Maliyet'e Ekle">↓ M</button>
        <button class="btn btn-ghost" style="padding:3px 7px;font-size:11px;margin-right:2px"
          onclick="katalogAnalizEkle(${u.id},'gelir')" title="Gelir'e Ekle">↑ G</button>
        <button class="btn btn-danger" onclick="katalogSil(${u.id})">✕</button>
      </td>
    </tr>`;
  }).join('');

  katalogStatsGuncelle();
  katalogButonGuncelle();

  const altEl = document.getElementById('katalogAltBilgi');
  if (altEl) altEl.textContent = `${liste.length} kayıt gösteriliyor · ${urunler.length} toplam`;
  const hepsi = document.getElementById('katalogHepsiniSec');
  if (hepsi) hepsi.checked = liste.length > 0 && liste.every(u => u.secili);
}

function katalogStatsGuncelle() {
  const el = document.getElementById('katalogStats');
  if (!el || urunler.length === 0) { if(el) el.innerHTML=''; return; }
  const ortalamMarj = urunler.reduce((s,u) => s + urunMarj(u), 0) / urunler.length;
  const enYuksekMarj = urunler.reduce((m,u) => urunMarj(u) > urunMarj(m) ? u : m, urunler[0]);
  const enDusukMarj  = urunler.reduce((m,u) => urunMarj(u) < urunMarj(m) ? u : m, urunler[0]);
  const zararliSayi  = urunler.filter(u => urunKar(u) < 0).length;
  const stats = [
    { label: 'Toplam Ürün', val: urunler.length, color: 'var(--accent)' },
    { label: 'Ort. Kâr Marjı', val: '%' + ortalamMarj.toFixed(1), color: ortalamMarj >= 20 ? 'var(--green)' : ortalamMarj >= 10 ? 'var(--yellow)' : 'var(--red)' },
    { label: 'En Yüksek Marj', val: enYuksekMarj.ad ? enYuksekMarj.ad.substring(0,14) + ' %' + urunMarj(enYuksekMarj).toFixed(1) : '—', color: 'var(--green)' },
    { label: 'En Düşük Marj',  val: enDusukMarj.ad  ? enDusukMarj.ad.substring(0,14)  + ' %' + urunMarj(enDusukMarj).toFixed(1)  : '—', color: 'var(--yellow)' },
    { label: 'Zararlı Kalem',  val: zararliSayi + ' kalem', color: zararliSayi > 0 ? 'var(--red)' : 'var(--green)' },
  ];
  el.innerHTML = stats.map(s => `
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:10px 14px">
      <div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.4px;margin-bottom:3px">${s.label}</div>
      <div style="font-size:15px;font-weight:700;color:${s.color}">${s.val}</div>
    </div>`).join('');
}

function katalogAnalizEkle(id, hedef) {
  const u = urunler.find(u => u.id === id);
  if (!u) return;
  if (hedef === 'maliyet') {
    maliyetRows.push({ id: ++rowCounter, tip: u.tip === 'hizmet' ? 'iscilik' : 'malzeme',
      ad: u.ad, miktar: 1, birim: u.birim, birimFiyat: u.alisFiyat,
      doviz: u.alisDoviz, kdv: u.kdv > 0 });
    renderMaliyetTable();
  } else {
    gelirRows.push({ id: ++rowCounter, ad: u.ad, miktar: 1, birim: u.birim, birimFiyat: u.satisFiyat });
    renderGelirTable();
  }
  calculate();
  showTab('veri', document.querySelector('.tab-btn[onclick*="veri"]'));
  showToast(`"${u.ad}" → ${hedef === 'maliyet' ? 'Maliyet' : 'Gelir'} kalemine eklendi`, 'success');
}

function katalogCokluEkle(hedef) {
  const secili = urunler.filter(u => u.secili);
  secili.forEach(u => katalogAnalizEkle(u.id, hedef));
  if (secili.length) showToast(`${secili.length} kalem ${hedef === 'maliyet' ? 'Maliyet' : 'Gelir'}'e eklendi`, 'success');
}

function katalogKeyNav(e, id, field) {
  if (e.key === 'Enter' || e.key === 'Tab') {
    const idx = urunler.findIndex(u => u.id === id);
    if (e.key === 'Enter' && idx === urunler.length - 1) katalogEkle();
  }
}

function katalogCSVIndir() {
  let csv = '﻿sep=;\n';
  csv += 'Ad;Tip;Birim;Alış Dövizi;Alış Fiyatı;Satış Fiyatı (TL);KDV %;Alış TL;Kâr;Marj %;Notlar\n';
  urunler.forEach(u => {
    csv += `${u.ad};${u.tip};${u.birim};${u.alisDoviz};${u.alisFiyat};${u.satisFiyat};${u.kdv};${fmt(urunAlisTL(u))};${fmt(urunKar(u))};${urunMarj(u).toFixed(2)};${u.notlar||''}\n`;
  });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  a.download = 'urun_katalogu_' + new Date().toISOString().split('T')[0] + '.csv';
  a.click();
}

function katalogCSVYukle() {
  const input = document.createElement('input');
  input.type = 'file'; input.accept = '.csv';
  input.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.csv')) {
      showToast('⚠️ Lütfen .csv uzantılı dosya seçin.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const lines = parseCSVSafe(ev.target.result);
        const start = lines[0].startsWith('sep') ? 2 : 1;
        if (start >= lines.length) {
          showToast('⚠️ CSV başlık satırından sonra veri bulunamadı.', 'error');
          return;
        }
        let eklenen = 0;
        let hatali = 0;
        for (let i = start; i < lines.length; i++) {
          const parts = lines[i].split(/[;,]/);
          const [ad,tip,birim,alisDoviz,alisFiyat,satisFiyat,kdv,,,,notlar] = parts;
          if (!ad || ad.trim() === 'Ad') continue;
          const alisFiyatNum = parseFloat(alisFiyat);
          const satisFiyatNum = parseFloat(satisFiyat);
          if (alisFiyatNum < 0 || satisFiyatNum < 0) { hatali++; continue; }
          katalogEkle({
            ad: ad.trim(),
            tip: tip?.trim() || 'urun',
            birim: birim?.trim() || 'Adet',
            alisDoviz: ['TL','USD','EUR'].includes(alisDoviz?.trim()) ? alisDoviz.trim() : 'TL',
            alisFiyat: alisFiyatNum || 0,
            satisFiyat: satisFiyatNum || 0,
            kdv: parseFloat(kdv) || 20,
            notlar: notlar?.trim() || ''
          });
          eklenen++;
        }
        let msg = `${eklenen} ürün CSV'den yüklendi.`;
        if (hatali > 0) msg += ` ${hatali} satır geçersiz değer içerdiği için atlandı.`;
        showToast(msg, eklenen > 0 ? 'success' : 'error');
      } catch (err) {
        showToast('⚠️ CSV yüklenemedi: ' + err.message, 'error');
      }
    };
    reader.onerror = () => showToast('⚠️ Dosya okunamadı.', 'error');
    reader.readAsText(file, 'UTF-8');
  };
  input.click();
}
