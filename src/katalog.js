// ── ÜRÜN KATALOĞU ─────────────────────────────────

// Column config: widths, sort keys, hideable flag
const _KOLS = {
  ad:         { w: 'min-width:160px', sortKey: 'ad',         hideable: false },
  tip:        { w: 'width:100px',     sortKey: 'tip',        hideable: false },
  birim:      { w: 'width:70px',      sortKey: null,         hideable: true  },
  doviz:      { w: 'width:70px',      sortKey: 'alisDoviz',  hideable: true  },
  alisFiyat:  { w: 'width:110px',     sortKey: 'alisFiyat',  hideable: true  },
  satisFiyat: { w: 'width:110px',     sortKey: 'satisFiyat', hideable: true  },
  kdv:        { w: 'width:55px',      sortKey: null,         hideable: true  },
  alisTL:     { w: 'width:110px',     sortKey: 'alisTL',     hideable: true  },
  kar:        { w: 'width:90px',      sortKey: 'kar',        hideable: true  },
  marj:       { w: 'width:75px',      sortKey: 'marj',       hideable: true  },
  notlar:     { w: 'width:80px',      sortKey: null,         hideable: true  },
};

// Sütun sırası (taşınabilir)
let katalogKolOrder = ['ad','tip','birim','doviz','alisFiyat','satisFiyat','kdv','alisTL','kar','marj','notlar'];

// Özel sütun isimleri
let katalogKolNames = {
  ad:'Ürün / Hizmet Adı', tip:'Tip', birim:'Birim', doviz:'Döviz',
  alisFiyat:'Alış Fiyatı', satisFiyat:'Satış Fiyatı', kdv:'KDV %',
  alisTL:'Alış TL', kar:'Kâr', marj:'Marj %', notlar:'Notlar',
};

// Görünür sütunlar (hideable olanlar için false = gizli)
let katalogKolVis = {
  birim: true, doviz: true, alisFiyat: true, satisFiyat: true,
  kdv: true, alisTL: true, kar: true, marj: true, notlar: true
};

let _katalogMenuKey = null;

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

// ── Sütun hücresi renderlayıcı ────────────────────────
function _renderKatalogCell(k, u, alisTL, kar, marj, marjCls, dovizColor, dovizSym) {
  switch (k) {
    case 'ad': return `<td style="padding:3px 6px"><input class="ks-input" value="${escHtml(u.ad)}" placeholder="Ürün / Hizmet adı"
      onchange="katalogGuncelle(${u.id},'ad',this.value)"
      onkeydown="katalogKeyNav(event,${u.id},'ad')"></td>`;
    case 'tip': return `<td style="padding:3px 6px">
      <select class="ks-select" onchange="katalogGuncelle(${u.id},'tip',this.value)">
        ${['malzeme','hizmet','urun','diger'].map(t=>`<option value="${t}" ${u.tip===t?'selected':''}>${TIP_ETIKET[t]}</option>`).join('')}
      </select></td>`;
    case 'birim': return `<td style="padding:3px 4px"><input class="ks-input" value="${escHtml(u.birim)}" placeholder="Adet"
      onchange="katalogGuncelle(${u.id},'birim',this.value)" style="width:60px"></td>`;
    case 'doviz': return `<td style="padding:3px 4px">
      <select class="ks-select" onchange="katalogGuncelle(${u.id},'alisDoviz',this.value);renderKatalog()"
        style="color:${dovizColor};font-weight:600">
        <option value="TL"  ${u.alisDoviz==='TL' ?'selected':''}>₺ TL</option>
        <option value="USD" ${u.alisDoviz==='USD'?'selected':''}>$ USD</option>
        <option value="EUR" ${u.alisDoviz==='EUR'?'selected':''}>€ EUR</option>
      </select></td>`;
    case 'alisFiyat': return `<td style="padding:3px 4px">
      <div style="display:flex;align-items:center;gap:3px">
        <span style="color:${dovizColor};font-size:12px">${dovizSym}</span>
        <input class="ks-input" type="number" value="${u.alisFiyat}" min="0" step="any" placeholder="0.00"
          oninput="katalogGuncelle(${u.id},'alisFiyat',this.value)"
          onkeydown="katalogKeyNav(event,${u.id},'alisFiyat')" style="width:80px">
      </div></td>`;
    case 'satisFiyat': return `<td style="padding:3px 4px">
      <div style="display:flex;align-items:center;gap:3px">
        <span style="color:var(--muted);font-size:12px">₺</span>
        <input class="ks-input" type="number" value="${u.satisFiyat}" min="0" step="any" placeholder="0.00"
          oninput="katalogGuncelle(${u.id},'satisFiyat',this.value)"
          onkeydown="katalogKeyNav(event,${u.id},'satisFiyat')" style="width:80px">
      </div></td>`;
    case 'kdv': return `<td style="padding:3px 4px"><input class="ks-input" type="number" value="${u.kdv}" min="0" max="100"
      oninput="katalogGuncelle(${u.id},'kdv',this.value)" style="width:48px"></td>`;
    case 'alisTL': return `<td class="font-mono" id="kalisTL-${u.id}" style="color:var(--muted);text-align:right;padding:6px 8px">₺${fmt(alisTL)}</td>`;
    case 'kar': return `<td class="font-mono" id="kkar-${u.id}" style="color:${kar>=0?'var(--green)':'var(--red)'};font-weight:600;text-align:right;padding:6px 8px">₺${fmt(kar)}</td>`;
    case 'marj': return `<td id="kmarj-${u.id}" style="text-align:center;padding:6px 4px"><span class="marj-chip ${marjCls}">${marj.toFixed(1)}%</span></td>`;
    case 'notlar': return `<td style="padding:3px 4px"><input class="ks-input" value="${escHtml(u.notlar||'')}" placeholder="Not..."
      onchange="katalogGuncelle(${u.id},'notlar',this.value)"></td>`;
    default: return '';
  }
}

function renderKatalog() {
  const thead = document.getElementById('katalogHead');
  const tbody = document.getElementById('katalogBody');
  if (!tbody) return;

  const visOrder = katalogKolOrder.filter(k => katalogKolVis[k] !== false);

  // Dinamik thead — her başlık tıklanınca Notion dropdown açılır
  if (thead) {
    thead.innerHTML = `<tr style="background:var(--surface2);position:sticky;top:0;z-index:2">
      <th style="width:36px;padding:9px 8px;border-bottom:1px solid var(--border)">
        <input type="checkbox" id="katalogHepsiniSec" onchange="katalogHepsiniSec(this.checked)"
          style="width:14px;height:14px;cursor:pointer">
      </th>
      ${visOrder.map(k => {
        const cfg = _KOLS[k];
        const label = katalogKolNames[k] || k;
        const isSorted = katalogSiralaKey === cfg.sortKey;
        const sortInd = cfg.sortKey ? (isSorted ? (katalogSiralaDuz ? ' ↑' : ' ↓') : '') : '';
        return `<th class="ksth ksth-notion" style="${cfg.w}" data-kol="${k}">
          <div class="ksth-inner">
            ${cfg.sortKey
              ? `<span class="ksth-label" onclick="katalogSirala('${cfg.sortKey}')" ondblclick="katalogKolYenidenInline('${k}',this)" title="Tıkla: sırala · Çift tıkla: yeniden adlandır">${escHtml(label)}${sortInd}</span>`
              : `<span class="ksth-label" ondblclick="katalogKolYenidenInline('${k}',this)" title="Çift tıkla: yeniden adlandır" style="cursor:default">${escHtml(label)}</span>`
            }
            <button class="ksth-menu-btn" onclick="katalogKolMenuShow('${k}',this,event)" title="Sütun ayarları">⋯</button>
          </div>
        </th>`;
      }).join('')}
      <th style="width:110px;padding:9px 8px;border-bottom:1px solid var(--border);color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:.4px">İşlemler</th>
    </tr>`;
  }

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

  if (liste.length === 0) {
    const isFiltered = !!(document.getElementById('katalogArama')?.value || document.getElementById('katalogFiltreTip')?.value);
    tbody.innerHTML = `<tr><td colspan="${visOrder.length + 2}" style="text-align:center;padding:52px 20px;color:var(--muted)">
      ${isFiltered
        ? `<div style="font-size:28px;margin-bottom:10px">🔍</div>
           <div style="font-size:14px;font-weight:600;margin-bottom:4px">Sonuç bulunamadı</div>
           <div style="font-size:12px">Arama kriterini değiştirin</div>`
        : `<div style="font-size:36px;margin-bottom:12px">📦</div>
           <div style="font-size:15px;font-weight:600;color:var(--text);margin-bottom:6px">Katalog boş</div>
           <div style="font-size:13px;margin-bottom:18px">Ürün veya hizmet eklemek için aşağıdaki butonu kullanın</div>
           <button class="btn btn-primary" onclick="katalogEkle()">+ İlk Ürünü Ekle</button>`
      }
    </td></tr>`;
  } else {
    tbody.innerHTML = liste.map(u => {
      const alisTL  = urunAlisTL(u);
      const kar     = urunKar(u);
      const marj    = urunMarj(u);
      const marjCls = marj < 0 ? 'badge-red' : marj < 10 ? 'badge-yellow' : 'badge-green';
      const dovizColor = u.alisDoviz === 'USD' ? 'var(--green)' : u.alisDoviz === 'EUR' ? 'var(--cyan)' : 'var(--muted)';
      const dovizSym   = u.alisDoviz === 'USD' ? '$' : u.alisDoviz === 'EUR' ? '€' : '₺';
      return `
      <tr class="kstr${u.secili?' selected':''}" id="krow-${u.id}">
        <td style="text-align:center;padding:6px 8px">
          <input type="checkbox" ${u.secili?'checked':''} style="width:14px;height:14px;cursor:pointer"
            onchange="katalogSecToggle(${u.id},this.checked)">
        </td>
        ${visOrder.map(k => _renderKatalogCell(k, u, alisTL, kar, marj, marjCls, dovizColor, dovizSym)).join('')}
        <td style="white-space:nowrap;padding:4px 6px">
          <button class="btn btn-ghost" style="padding:3px 7px;font-size:11px;margin-right:2px"
            onclick="katalogAnalizEkle(${u.id},'maliyet')" title="Maliyet'e Ekle">↓ M</button>
          <button class="btn btn-ghost" style="padding:3px 7px;font-size:11px;margin-right:2px"
            onclick="katalogAnalizEkle(${u.id},'gelir')" title="Gelir'e Ekle">↑ G</button>
          <button class="btn btn-danger" onclick="katalogSil(${u.id})">✕</button>
        </td>
      </tr>`;
    }).join('');
  }

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
  if (e.key === 'Enter') {
    const tr = e.target.closest('tr');
    const nextTr = tr?.nextElementSibling;
    if (nextTr) {
      const first = nextTr.querySelector('.ks-input');
      if (first) { e.preventDefault(); first.focus(); return; }
    }
    e.preventDefault();
    katalogEkle();
  }
}

// ── Notion sütun başlık dropdown ──────────────────────

function katalogKolMenuShow(key, btn, ev) {
  ev.stopPropagation();
  const existing = document.getElementById('ks-kol-menu');
  if (existing) { existing.remove(); if (_katalogMenuKey === key) { _katalogMenuKey = null; return; } }
  _katalogMenuKey = key;

  const cfg = _KOLS[key];
  const label = katalogKolNames[key] || key;
  const rect = btn.getBoundingClientRect();

  // Determine move eligibility based on visible order
  const visOrder = katalogKolOrder.filter(k => katalogKolVis[k] !== false);
  const visIdx = visOrder.indexOf(key);
  const canLeft  = visIdx > 0;
  const canRight = visIdx < visOrder.length - 1;

  const menu = document.createElement('div');
  menu.id = 'ks-kol-menu';
  menu.style.cssText = `position:fixed;top:${rect.bottom + 4}px;left:${rect.left - 130}px;
    min-width:190px;background:var(--surface2);border:1px solid var(--border);
    border-radius:10px;padding:4px;z-index:9999;
    box-shadow:0 8px 28px rgba(0,0,0,.5);font-size:13px`;

  menu.innerHTML = `
    <div style="padding:6px 12px 5px;font-size:11px;color:var(--muted);font-weight:700;
      text-transform:uppercase;letter-spacing:.5px;border-bottom:1px solid var(--border);margin-bottom:4px">
      ${escHtml(label)}
    </div>
    ${cfg.sortKey ? `
      <div class="ks-menu-item" onclick="katalogSirala('${cfg.sortKey}');document.getElementById('ks-kol-menu')?.remove()">
        ↑ &nbsp;Artan Sırala
      </div>
      <div class="ks-menu-item" onclick="katalogSiralaAzalan('${cfg.sortKey}')">
        ↓ &nbsp;Azalan Sırala
      </div>
      <div class="ks-menu-sep"></div>
    ` : ''}
    <div class="ks-menu-item" onclick="katalogKolYenidenViaMenu('${key}')">
      ✏ &nbsp;Yeniden Adlandır
    </div>
    ${canLeft  ? `<div class="ks-menu-item" onclick="katalogKolTasi('${key}',-1)">← &nbsp;Sola Taşı</div>` : ''}
    ${canRight ? `<div class="ks-menu-item" onclick="katalogKolTasi('${key}',1)">→ &nbsp;Sağa Taşı</div>` : ''}
    <div class="ks-menu-sep"></div>
    ${cfg.hideable
      ? `<div class="ks-menu-item ks-menu-danger" onclick="katalogKolGizle('${key}')">
           <span style="opacity:.7">👁</span> &nbsp;Gizle
         </div>`
      : `<div class="ks-menu-item" style="opacity:.35;cursor:default">
           <span style="opacity:.7">🔒</span> &nbsp;Gizlenemez
         </div>`
    }
  `;

  document.body.appendChild(menu);

  // Keep within viewport horizontally
  const mr = menu.getBoundingClientRect();
  if (mr.right > window.innerWidth - 8) menu.style.left = (window.innerWidth - mr.width - 8) + 'px';
  if (mr.left < 8) menu.style.left = '8px';

  setTimeout(() => {
    const close = e => {
      if (!menu.contains(e.target) && e.target !== btn) {
        menu.remove();
        _katalogMenuKey = null;
        document.removeEventListener('click', close);
      }
    };
    document.addEventListener('click', close);
  }, 10);
}

function katalogSiralaAzalan(sortKey) {
  katalogSiralaKey = sortKey;
  katalogSiralaDuz = false;
  document.getElementById('ks-kol-menu')?.remove();
  _katalogMenuKey = null;
  renderKatalog();
}

function katalogKolGizle(key) {
  katalogKolVis[key] = false;
  document.getElementById('ks-kol-menu')?.remove();
  _katalogMenuKey = null;
  renderKatalog();
}

function katalogKolTasi(key, dir) {
  const visOrder = katalogKolOrder.filter(k => katalogKolVis[k] !== false);
  const visIdx = visOrder.indexOf(key);
  const targetKey = visOrder[visIdx + dir];
  if (!targetKey) return;
  const i1 = katalogKolOrder.indexOf(key);
  const i2 = katalogKolOrder.indexOf(targetKey);
  [katalogKolOrder[i1], katalogKolOrder[i2]] = [katalogKolOrder[i2], katalogKolOrder[i1]];
  document.getElementById('ks-kol-menu')?.remove();
  _katalogMenuKey = null;
  renderKatalog();
}

function katalogKolYenidenViaMenu(key) {
  const menu = document.getElementById('ks-kol-menu');
  if (!menu) { return; }
  menu.remove();
  _katalogMenuKey = null;
  // Trigger inline rename on the actual header cell
  const th = document.querySelector(`th[data-kol="${key}"]`);
  const labelEl = th?.querySelector('.ksth-label');
  if (labelEl) { katalogKolYenidenInline(key, labelEl); return; }
}

function katalogKolYeniden(key) {
  const menu = document.getElementById('ks-kol-menu');
  if (!menu) return;
  const current = katalogKolNames[key] || key;
  menu.innerHTML = `
    <div style="padding:10px 12px">
      <div style="font-size:11px;color:var(--muted);margin-bottom:8px;font-weight:600;text-transform:uppercase;letter-spacing:.4px">Sütun Adını Değiştir</div>
      <input id="ksKolRenameInp" class="ks-input" value="${escHtml(current)}" style="width:100%;margin-bottom:8px"
        onkeydown="if(event.key==='Enter')katalogKolRenameConfirm('${key}');else if(event.key==='Escape')document.getElementById('ks-kol-menu')?.remove()">
      <div style="display:flex;gap:6px">
        <button class="btn btn-primary" style="flex:1;padding:5px 8px;font-size:12px"
          onclick="katalogKolRenameConfirm('${key}')">Kaydet</button>
        <button class="btn btn-ghost" style="padding:5px 8px;font-size:12px"
          onclick="document.getElementById('ks-kol-menu')?.remove()">İptal</button>
      </div>
    </div>
  `;
  requestAnimationFrame(() => {
    const inp = document.getElementById('ksKolRenameInp');
    if (inp) { inp.focus(); inp.select(); }
  });
}

function katalogKolRenameConfirm(key) {
  const inp = document.getElementById('ksKolRenameInp');
  if (!inp) return;
  const name = inp.value.trim();
  if (name) katalogKolNames[key] = name;
  document.getElementById('ks-kol-menu')?.remove();
  _katalogMenuKey = null;
  renderKatalog();
}

// Çift tıkla başlık inline düzenleme
function katalogKolYenidenInline(key, labelEl) {
  if (document.getElementById('ks-kol-inline-' + key)) return;
  const current = katalogKolNames[key] || key;
  const inp = document.createElement('input');
  inp.id = 'ks-kol-inline-' + key;
  inp.className = 'ks-input';
  inp.value = current;
  inp.style.cssText = 'width:100%;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.4px;padding:1px 4px;background:var(--surface2)';
  labelEl.replaceWith(inp);
  inp.focus(); inp.select();
  const confirm = () => {
    const name = inp.value.trim();
    if (name) katalogKolNames[key] = name;
    renderKatalog();
  };
  inp.addEventListener('blur', confirm);
  inp.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); confirm(); }
    if (e.key === 'Escape') renderKatalog();
    e.stopPropagation();
  });
}

// ── "⚙ Sütunlar" panel (dinamik) ──────────────────────
function katalogKolToggle() {
  const panel = document.getElementById('katalogKolPanel');
  if (!panel) return;
  const open = panel.style.display !== 'none';
  if (open) { panel.style.display = 'none'; return; }

  // Render dinamik içerik
  const hideableKeys = katalogKolOrder.filter(k => _KOLS[k]?.hideable);
  panel.innerHTML = `
    <div style="font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;
      letter-spacing:.5px;margin-bottom:8px">Görünür Sütunlar</div>
    ${hideableKeys.map(k => `
      <label style="display:flex;align-items:center;gap:8px;padding:4px 0;cursor:pointer;font-size:13px">
        <input type="checkbox" ${katalogKolVis[k] !== false ? 'checked' : ''}
          onchange="katalogKolVis['${k}']=this.checked;renderKatalog()"
          style="accent-color:var(--accent)">
        ${escHtml(katalogKolNames[k] || k)}
      </label>`).join('')}
  `;
  panel.style.display = 'block';

  const close = ev => {
    const btn = document.getElementById('katalogKolBtn');
    if (!panel.contains(ev.target) && ev.target !== btn && !btn?.contains(ev.target)) {
      panel.style.display = 'none';
      document.removeEventListener('click', close);
    }
  };
  setTimeout(() => document.addEventListener('click', close), 50);
}

// ── E-Tablo: Hücre bazlı range paste ─────────────────
function _getKatalogEditableFieldOrder() {
  const fieldMap = { ad:'ad', tip:'tip', birim:'birim', doviz:'alisDoviz', alisFiyat:'alisFiyat', satisFiyat:'satisFiyat', kdv:'kdv', notlar:'notlar' };
  return katalogKolOrder
    .filter(k => katalogKolVis[k] !== false && fieldMap[k])
    .map(k => fieldMap[k]);
}

function _pasteRangeToKatalog(text, rowIdx, colIdx) {
  const grid = text.trim().split(/\r?\n/)
    .filter(l => l.trim())
    .map(l => l.split('\t').map(c => c.trim().replace(/^["']|["']$/g, '')));
  if (!grid.length) return;

  const fieldOrder = _getKatalogEditableFieldOrder();
  const tbody = document.getElementById('katalogBody');
  const existingRows = [...(tbody?.querySelectorAll('tr') || [])];

  const needed = rowIdx + grid.length - existingRows.length;
  for (let i = 0; i < needed; i++) {
    urunler.push({ id: ++urunCounter, secili: false, ad: '', tip: 'urun', birim: 'Adet', alisDoviz: 'TL', alisFiyat: 0, satisFiyat: 0, kdv: 20, notlar: '' });
  }
  if (needed > 0) renderKatalog();

  const rows = [...(document.getElementById('katalogBody')?.querySelectorAll('tr') || [])];
  const tipMap = { malzeme:'malzeme', material:'malzeme', hizmet:'hizmet', service:'hizmet', ürün:'urun', urun:'urun', product:'urun', diğer:'diger', diger:'diger', other:'diger' };

  let filled = 0;
  grid.forEach((rowData, ri) => {
    const tr = rows[rowIdx + ri];
    if (!tr) return;
    const urunId = parseInt(tr.id.replace('krow-', ''));
    const u = urunler.find(u => u.id === urunId);
    if (!u) return;

    rowData.forEach((val, ci) => {
      const field = fieldOrder[colIdx + ci];
      if (!field || val === '') return;
      if (['alisFiyat', 'satisFiyat', 'kdv'].includes(field)) {
        u[field] = _parseNum(val) || 0;
      } else if (field === 'tip') {
        const mapped = tipMap[val.toLowerCase().trim()];
        if (mapped) u[field] = mapped;
      } else if (field === 'alisDoviz') {
        const d = val.toUpperCase().trim();
        if (['TL','USD','EUR'].includes(d)) u[field] = d;
      } else {
        u[field] = val;
      }
      filled++;
    });
  });

  renderKatalog();
  saveLocal();
  const r = grid.length, c = Math.max(...grid.map(row => row.length));
  if (filled > 0) showToast(`✓ ${r} satır × ${c} sütun yapıştırıldı`, 'success');
  else showToast('Yapıştırılacak uygun alan bulunamadı.', 'error');
}

function _pasteToKatalog(text) {
  _pasteRangeToKatalog(text, urunler.length, 0);
}

// ── E-Tablo: Toplu satır ekleme ───────────────────────
function addMultipleKatalogRows() {
  const n = Math.max(1, Math.min(100, parseInt(document.getElementById('katalogSatirSayisi')?.value) || 5));
  const startIdx = urunler.length;
  for (let i = 0; i < n; i++) {
    urunler.push({ id: ++urunCounter, secili: false, ad: '', tip: 'urun', birim: 'Adet', alisDoviz: 'TL', alisFiyat: 0, satisFiyat: 0, kdv: 20, notlar: '' });
  }
  renderKatalog();
  saveLocal();
  showToast(`${n} boş satır eklendi.`, 'success');
  requestAnimationFrame(() => {
    const rows = document.querySelectorAll('#katalogBody tr');
    const targetRow = rows[startIdx];
    if (targetRow) {
      const first = targetRow.querySelector('.ks-input');
      if (first) first.focus();
    }
  });
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
