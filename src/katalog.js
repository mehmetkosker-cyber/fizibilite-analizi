// ── ÜRÜN KATALOĞU ─────────────────────────────────

function saveKatalog() {
  try {
    localStorage.setItem('fizibilite_katalog', JSON.stringify(urunler));
  } catch(e) {}
}

async function loadKatalog() {
  try {
    const deviceId = getDeviceId();
    const { data, error } = await sb
      .from('katalog')
      .select('id, ad')
      .eq('device_id', deviceId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      urunler = data.map(r => ({ id: r.id, ad: r.ad || '' }));
      saveKatalog();
    } else {
      _loadKatalogFallback();
    }
  } catch(e) {
    _loadKatalogFallback();
  }
  renderKatalog();
}

function _loadKatalogFallback() {
  try {
    const raw = localStorage.getItem('fizibilite_katalog');
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      urunler = parsed;
    } else if (parsed?.urunler?.length) {
      urunler = parsed.urunler.map(u => ({ id: String(u.id), ad: u.ad || '' }));
    }
  } catch(e) {}
}

function _filterUrunler(q) {
  const lq = (q || '').toLowerCase();
  return urunler.filter(u => !lq || (u.ad || '').toLowerCase().includes(lq));
}

async function katalogEkle(ad) {
  const deviceId = getDeviceId();
  const tempId = 'temp-' + Date.now();
  urunler.push({ id: tempId, ad: ad || '' });
  renderKatalog();

  requestAnimationFrame(() => {
    document.querySelector(`#krow-${tempId} .ks-input`)?.focus();
  });

  try {
    const { data, error } = await sb
      .from('katalog')
      .insert({ device_id: deviceId, ad: ad || '' })
      .select('id, ad')
      .single();

    if (!error && data) {
      const item = urunler.find(u => u.id === tempId);
      if (item) {
        item.id = data.id;
        // Update row id in DOM so subsequent edits/deletes use the real UUID
        const oldRow = document.getElementById(`krow-${tempId}`);
        if (oldRow) {
          oldRow.id = `krow-${data.id}`;
          const inp = oldRow.querySelector('.ks-input');
          if (inp) {
            inp.setAttribute('onchange', `katalogGuncelle('${data.id}',this.value)`);
            inp.setAttribute('onkeydown', `katalogKeyNav(event,'${data.id}')`);
          }
          const delBtn = oldRow.querySelector('.notion-del-btn');
          if (delBtn) delBtn.setAttribute('onclick', `katalogSil('${data.id}')`);
        }
      }
      saveKatalog();
    }
  } catch(e) {}
}

async function katalogSil(id) {
  urunler = urunler.filter(u => u.id !== id);
  renderKatalog();
  saveKatalog();

  if (!String(id).startsWith('temp-')) {
    try {
      await sb.from('katalog').delete().eq('id', id);
    } catch(e) {}
  }
}

async function katalogGuncelle(id, val) {
  const u = urunler.find(u => u.id === id);
  if (!u) return;
  u.ad = val;
  saveKatalog();

  if (!String(id).startsWith('temp-')) {
    try {
      await sb.from('katalog').update({ ad: val, updated_at: new Date().toISOString() }).eq('id', id);
    } catch(e) {}
  }
}

function katalogGorunenler() {
  return _filterUrunler(document.getElementById('katalogArama')?.value);
}

async function katalogTemizle() {
  if (urunler.length === 0) return;
  if (!confirm(`Katalogdaki tüm ${urunler.length} ürün/hizmet silinecek. Emin misiniz?`)) return;
  const deviceId = getDeviceId();
  urunler = [];
  renderKatalog();
  saveKatalog();

  try {
    await sb.from('katalog').delete().eq('device_id', deviceId);
  } catch(e) {}
}

function renderKatalog() {
  const thead = document.getElementById('katalogHead');
  const tbody = document.getElementById('katalogBody');
  if (!tbody) return;

  const liste = katalogGorunenler();
  const isFiltered = !!document.getElementById('katalogArama')?.value;

  const sayacEl = document.getElementById('katalogSayac');
  if (sayacEl) {
    sayacEl.style.display = urunler.length === 0 ? 'none' : '';
    sayacEl.textContent = liste.length !== urunler.length
      ? `${liste.length} / ${urunler.length}`
      : `${urunler.length} ürün`;
  }

  if (thead && !thead.firstChild) {
    thead.innerHTML = `<tr style="background:var(--surface2);position:sticky;top:0;z-index:2">
      <th style="width:44px;padding:10px 8px;border-bottom:1px solid var(--border);color:var(--muted);font-size:11px;text-align:center">#</th>
      <th style="padding:10px 8px;border-bottom:1px solid var(--border)">Ürün / Hizmet Adı</th>
      <th style="width:44px;border-bottom:1px solid var(--border)"></th>
    </tr>`;
  }

  if (liste.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;padding:60px 20px;color:var(--muted)">
      ${isFiltered
        ? `<div style="font-size:26px;margin-bottom:10px">🔍</div>
           <div style="font-size:14px;font-weight:600;margin-bottom:4px">Sonuç bulunamadı</div>
           <div style="font-size:12px">Arama kriterini değiştirin</div>`
        : `<div style="font-size:40px;margin-bottom:14px">📦</div>
           <div style="font-size:15px;font-weight:600;color:var(--text);margin-bottom:8px">Katalog henüz boş</div>
           <div style="font-size:13px;margin-bottom:20px">Ürün ve hizmetlerinizi ekleyin.</div>
           <button class="btn btn-primary" onclick="katalogEkle()">+ İlk Ürünü Ekle</button>`
      }
    </td></tr>`;
    return;
  }

  tbody.innerHTML = liste.map((u, i) => `
    <tr class="kstr" id="krow-${u.id}">
      <td style="color:var(--muted);font-size:11px;text-align:center;padding:8px 6px">${i + 1}</td>
      <td style="padding:4px 8px">
        <input class="ks-input" value="${escHtml(u.ad)}" placeholder="Ürün veya hizmet adı..."
          onchange="katalogGuncelle('${u.id}',this.value)" style="width:100%"
          onkeydown="katalogKeyNav(event,'${u.id}')">
      </td>
      <td style="text-align:center;padding:4px 6px">
        <button class="notion-del-btn" onclick="katalogSil('${u.id}')" title="Sil">✕</button>
      </td>
    </tr>
  `).join('');
}

function katalogKeyNav(e, id) {
  if (e.key !== 'Enter') return;
  e.preventDefault();
  const tr = e.target.closest('tr');
  const nextTr = tr?.nextElementSibling;
  if (nextTr) {
    const inp = nextTr.querySelector('.ks-input');
    if (inp) { inp.focus(); return; }
  }
  katalogEkle();
}

// ── Katalogdan Seç Modal ──────────────────────────
function katalogSecAc() {
  if (urunler.length === 0) {
    showToast('Katalog boş. Önce Ürün Kataloğu sekmesinden ürün/hizmet ekleyin.', 'error');
    return;
  }
  const modal = document.getElementById('katalogSecModal');
  if (!modal) return;
  modal.style.display = 'flex';
  const arama = document.getElementById('katalogSecArama');
  if (arama) { arama.value = ''; arama.focus(); }
  katalogSecFiltrele();
}

function katalogSecKapat() {
  const modal = document.getElementById('katalogSecModal');
  if (modal) modal.style.display = 'none';
}

function katalogSecFiltrele() {
  const q = document.getElementById('katalogSecArama')?.value;
  const liste = _filterUrunler(q);
  const container = document.getElementById('katalogSecListe');
  if (!container) return;
  if (!liste.length) {
    container.innerHTML = '<div style="text-align:center;padding:20px;color:var(--muted);font-size:13px">Sonuç bulunamadı</div>';
    return;
  }
  container.innerHTML = liste.map(u => `
    <label class="katalog-sec-item">
      <input type="checkbox" value="${u.id}"
        style="width:15px;height:15px;accent-color:var(--accent);cursor:pointer;flex-shrink:0">
      <span style="font-size:13px;flex:1">${u.ad ? escHtml(u.ad) : '<em style="color:var(--muted)">İsimsiz</em>'}</span>
    </label>
  `).join('');
}

function _katalogSecSec() {
  return [...document.querySelectorAll('#katalogSecListe input[type="checkbox"]:checked')]
    .map(cb => urunler.find(u => u.id === cb.value))
    .filter(Boolean);
}

function katalogSecUygula(hedef) {
  const secilen = _katalogSecSec();
  if (!secilen.length) { showToast('Lütfen en az bir ürün seçin.', 'error'); return; }
  if (hedef === 'maliyet') {
    const tip = document.getElementById('katalogSecTip')?.value || 'malzeme';
    secilen.forEach(u => {
      maliyetRows.push({ id: ++rowCounter, tip, ad: u.ad, miktar: 1, birim: 'Adet', birimFiyat: 0, doviz: 'TL', kdv: true });
    });
    renderMaliyetTable();
  } else {
    secilen.forEach(u => {
      gelirRows.push({ id: ++rowCounter, ad: u.ad, miktar: 1, birim: 'Adet', birimFiyat: 0 });
    });
    renderGelirTable();
  }
  calculate();
  katalogSecKapat();
  const tablo = hedef === 'maliyet' ? 'maliyet' : 'gelir';
  showToast(`✓ ${secilen.length} kalem ${tablo} tablosuna eklendi`, 'success');
}

// ── Paste ─────────────────────────────────────────
function _pasteToKatalog(text) {
  const names = text.trim().split(/\r?\n/)
    .map(l => l.split('\t')[0].trim().replace(/^["']|["']$/g, ''))
    .filter(Boolean);
  if (!names.length) return;
  names.forEach(name => katalogEkle(name));
  showToast(`✓ ${names.length} ürün yapıştırıldı`, 'success');
}
