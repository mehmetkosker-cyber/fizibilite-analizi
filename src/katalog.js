// ── ÜRÜN KATALOĞU ─────────────────────────────────

function katalogEkle(ad) {
  const id = ++urunCounter;
  urunler.push({ id, ad: ad || '' });
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

function katalogGuncelle(id, val) {
  const u = urunler.find(u => u.id === id);
  if (!u) return;
  u.ad = val;
  saveLocal();
}

function katalogGorunenler() {
  const arama = (document.getElementById('katalogArama')?.value || '').toLowerCase();
  return urunler.filter(u => !arama || (u.ad || '').toLowerCase().includes(arama));
}

function katalogTemizle() {
  if (urunler.length === 0) return;
  if (!confirm(`Katalogdaki tüm ${urunler.length} ürün/hizmet silinecek. Emin misiniz?`)) return;
  urunler = [];
  urunCounter = 0;
  renderKatalog();
  saveLocal();
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

  if (thead) {
    thead.innerHTML = `<tr style="background:var(--surface2);position:sticky;top:0;z-index:2">
      <th style="width:50px;padding:10px 8px;border-bottom:1px solid var(--border);color:var(--muted);font-size:11px;text-align:center">#</th>
      <th style="padding:10px 8px;border-bottom:1px solid var(--border)">Ürün / Hizmet Adı</th>
      <th style="width:50px;border-bottom:1px solid var(--border)"></th>
    </tr>`;
  }

  if (liste.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;padding:52px 20px;color:var(--muted)">
      ${isFiltered
        ? `<div style="font-size:28px;margin-bottom:10px">🔍</div>
           <div style="font-size:14px;font-weight:600;margin-bottom:4px">Sonuç bulunamadı</div>
           <div style="font-size:12px">Arama kriterini değiştirin</div>`
        : `<div style="font-size:36px;margin-bottom:12px">📦</div>
           <div style="font-size:15px;font-weight:600;color:var(--text);margin-bottom:6px">Katalog boş</div>
           <div style="font-size:13px;margin-bottom:18px">Ürün ve hizmetleri buraya ekleyin,<br>ardından Veri Girişi bölümünde maliyet veya gelire ekleyin</div>
           <button class="btn btn-primary" onclick="katalogEkle()">+ İlk Ürünü Ekle</button>`
      }
    </td></tr>`;
    return;
  }

  tbody.innerHTML = liste.map((u, i) => `
    <tr class="kstr" id="krow-${u.id}">
      <td style="color:var(--muted);font-size:11px;text-align:center;padding:8px 6px">${i + 1}</td>
      <td style="padding:4px 8px">
        <input class="ks-input" value="${escHtml(u.ad)}" placeholder="Ürün / Hizmet adı..."
          onchange="katalogGuncelle(${u.id},this.value)" style="width:100%"
          onkeydown="katalogKeyNav(event,${u.id})">
      </td>
      <td style="text-align:center;padding:4px 6px">
        <button class="notion-del-btn" onclick="katalogSil(${u.id})" title="Sil">✕</button>
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

// ── Toplu satır ekleme ────────────────────────────
function addMultipleKatalogRows() {
  const n = Math.max(1, Math.min(100, parseInt(document.getElementById('katalogSatirSayisi')?.value) || 5));
  const startIdx = urunler.length;
  for (let i = 0; i < n; i++) {
    urunler.push({ id: ++urunCounter, ad: '' });
  }
  renderKatalog();
  saveLocal();
  requestAnimationFrame(() => {
    const rows = document.querySelectorAll('#katalogBody tr');
    const targetRow = rows[startIdx];
    if (targetRow) {
      const first = targetRow.querySelector('.ks-input');
      if (first) first.focus();
    }
  });
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
  const q = (document.getElementById('katalogSecArama')?.value || '').toLowerCase();
  const liste = urunler.filter(u => !q || (u.ad || '').toLowerCase().includes(q));
  const container = document.getElementById('katalogSecListe');
  if (!container) return;
  if (!liste.length) {
    container.innerHTML = '<div style="text-align:center;padding:20px;color:var(--muted);font-size:13px">Sonuç bulunamadı</div>';
    return;
  }
  container.innerHTML = liste.map(u => `
    <label style="display:flex;align-items:center;gap:10px;padding:9px 12px;cursor:pointer;
      border-radius:6px;transition:background .12s"
      onmouseover="this.style.background='rgba(79,125,255,.1)'"
      onmouseout="this.style.background=''">
      <input type="checkbox" value="${u.id}"
        style="width:15px;height:15px;accent-color:var(--accent);cursor:pointer;flex-shrink:0">
      <span style="font-size:13px;flex:1">${u.ad ? escHtml(u.ad) : '<em style="color:var(--muted)">İsimsiz</em>'}</span>
    </label>
  `).join('');
}

function _katalogSecSec() {
  return [...document.querySelectorAll('#katalogSecListe input[type="checkbox"]:checked')]
    .map(cb => urunler.find(u => u.id === parseInt(cb.value)))
    .filter(Boolean);
}

function katalogSecUygulaMaliyet() {
  const secilen = _katalogSecSec();
  if (!secilen.length) { showToast('Lütfen en az bir ürün seçin.', 'error'); return; }
  const tip = document.getElementById('katalogSecTip')?.value || 'malzeme';
  secilen.forEach(u => {
    maliyetRows.push({ id: ++rowCounter, tip, ad: u.ad, miktar: 1, birim: 'Adet', birimFiyat: 0, doviz: 'TL', kdv: true });
  });
  renderMaliyetTable();
  calculate();
  katalogSecKapat();
  showToast(`✓ ${secilen.length} kalem maliyet tablosuna eklendi`, 'success');
}

function katalogSecUygulaGelir() {
  const secilen = _katalogSecSec();
  if (!secilen.length) { showToast('Lütfen en az bir ürün seçin.', 'error'); return; }
  secilen.forEach(u => {
    gelirRows.push({ id: ++rowCounter, ad: u.ad, miktar: 1, birim: 'Adet', birimFiyat: 0 });
  });
  renderGelirTable();
  calculate();
  katalogSecKapat();
  showToast(`✓ ${secilen.length} kalem gelir tablosuna eklendi`, 'success');
}

// ── Paste ─────────────────────────────────────────
function _pasteToKatalog(text) {
  const names = text.trim().split(/\r?\n/)
    .map(l => l.split('\t')[0].trim().replace(/^["']|["']$/g, ''))
    .filter(Boolean);
  if (!names.length) return;
  names.forEach(name => urunler.push({ id: ++urunCounter, ad: name }));
  renderKatalog();
  saveLocal();
  showToast(`✓ ${names.length} ürün yapıştırıldı`, 'success');
}

function _pasteSingleColToKatalog(text) {
  _pasteToKatalog(text);
}

function _pasteRangeToKatalog(text) {
  _pasteToKatalog(text);
}
