// ── ROW MANAGEMENT ────────────────────────────────

function addRow(tip) {
  const id = ++rowCounter;
  maliyetRows.push({ id, tip, ad: '', miktar: 1, birim: 'Adet', birimFiyat: 0, doviz: 'TL', kdv: true });
  renderMaliyetTable();
  calculate();
  requestAnimationFrame(() => {
    const inputs = document.querySelectorAll('#maliyetBody tr:last-child .notion-inp[type="text"]');
    if (inputs[0]) inputs[0].focus();
  });
}

function removeRow(id) {
  maliyetRows = maliyetRows.filter(r => r.id !== id);
  renderMaliyetTable();
  calculate();
}

function updateRow(id, field, val) {
  const r = maliyetRows.find(r => r.id === id);
  if (!r) return;
  if (field === 'kdv') r.kdv = val;
  else if (['miktar', 'birimFiyat'].includes(field)) r[field] = parseFloat(val) || 0;
  else r[field] = val;
  if (field === 'doviz') { renderRowTotal(id); return; }
  if (field !== 'ad' && field !== 'birim') calculate();
  renderRowTotal(id);
}

function rowTotalTL(r) {
  return r.miktar * r.birimFiyat * getKur(r.doviz || 'TL');
}

function renderRowTotal(id) {
  const r = maliyetRows.find(r => r.id === id);
  if (!r) return;
  const el = document.getElementById('rowTotal-' + id);
  if (!el) return;
  const tl = rowTotalTL(r);
  const doviz = r.doviz || 'TL';
  const orijinal = r.miktar * r.birimFiyat;
  const dovizColor = doviz === 'USD' ? 'var(--green)' : doviz === 'EUR' ? 'var(--cyan)' : '';
  const dovizSym   = doviz === 'USD' ? '$' : doviz === 'EUR' ? '€' : '₺';
  el.innerHTML = doviz !== 'TL'
    ? `<span style="font-weight:600">₺${fmt(tl)}</span><br><span style="font-size:10px;color:${dovizColor}">${dovizSym}${fmt(orijinal)}</span>`
    : `<span style="font-weight:600">₺${fmt(tl)}</span>`;
}

// ── Notion-like maliyet tablosu ───────────────────
function renderMaliyetTable() {
  const tbody = document.getElementById('maliyetBody');
  const thead = document.getElementById('maliyetHead');
  if (!tbody) return;

  const filtreAd    = (document.getElementById('maliyetFiltreAd')?.value  || '').toLowerCase();
  const filtreTip   =  document.getElementById('maliyetFiltreTip')?.value  || '';
  const filtreDoviz =  document.getElementById('maliyetFiltreDoviz')?.value || '';

  const kol = {
    tip:   document.getElementById('kol-tip')?.checked   ?? true,
    birim: document.getElementById('kol-birim')?.checked ?? true,
    doviz: document.getElementById('kol-doviz')?.checked ?? true,
    kdv:   document.getElementById('kol-kdv')?.checked   ?? true,
  };

  const visible = maliyetRows.filter(r => {
    if (filtreAd    && !r.ad.toLowerCase().includes(filtreAd)) return false;
    if (filtreTip   && r.tip !== filtreTip)                    return false;
    if (filtreDoviz && (r.doviz || 'TL') !== filtreDoviz)     return false;
    return true;
  });

  // Row count badge
  const sayacEl = document.getElementById('maliyetSayac');
  if (sayacEl) {
    if (maliyetRows.length === 0) {
      sayacEl.style.display = 'none';
    } else {
      sayacEl.style.display = '';
      sayacEl.textContent = visible.length !== maliyetRows.length
        ? `${visible.length} / ${maliyetRows.length}`
        : `${maliyetRows.length} kalem`;
    }
  }

  // Column counts for colspan calculation
  // Col order: # | [tip] | Ad | Miktar | [birim] | [doviz] | BirimFiyat | Toplam | [kdv] | Sil
  const labelColspan = 1 + (kol.tip?1:0) + 1 + 1 + (kol.birim?1:0) + (kol.doviz?1:0) + 1;
  const afterColspan = 1 + (kol.kdv?1:0);
  const totalCols    = labelColspan + 1 + afterColspan;

  if (thead) {
    thead.innerHTML = `<tr>
      <th style="width:28px"></th>
      ${kol.tip   ? '<th style="width:110px">Tip</th>' : ''}
      <th>Kalem Adı</th>
      <th style="width:82px">Miktar</th>
      ${kol.birim ? '<th style="width:62px">Birim</th>' : ''}
      ${kol.doviz ? '<th style="width:70px">Döviz</th>' : ''}
      <th style="width:115px">Birim Fiyat</th>
      <th style="width:120px;text-align:right">Toplam (TL)</th>
      ${kol.kdv   ? '<th style="width:40px;text-align:center" title="KDV dahil">KDV</th>' : ''}
      <th style="width:30px"></th>
    </tr>`;
  }

  const tfootSep   = document.getElementById('maliyetTotalSep');
  const tfootAfter = document.getElementById('maliyetTotalAfter');
  if (tfootSep)   tfootSep.colSpan   = labelColspan;
  if (tfootAfter) tfootAfter.colSpan = afterColspan;

  if (visible.length === 0) {
    const msg = maliyetRows.length === 0
      ? `<div style="text-align:center;padding:28px 16px;color:var(--muted)">
           <div style="font-size:32px;margin-bottom:10px">📋</div>
           <div style="font-size:13px;margin-bottom:6px">Henüz kalem eklenmedi.</div>
           <div style="font-size:12px">Aşağıdaki butonlarla ekleyin veya <strong>Excel&rsquo;den Yapıştır</strong>&rsquo;ı kullanın.</div>
         </div>`
      : `<div style="text-align:center;padding:20px;color:var(--muted);font-size:13px">
           🔍 Filtreyle eşleşen kalem bulunamadı.
         </div>`;
    tbody.innerHTML = `<tr><td colspan="${totalCols}" style="padding:0">${msg}</td></tr>`;
    return;
  }

  tbody.innerHTML = visible.map((r, idx) => {
    const doviz      = r.doviz || 'TL';
    const dovizColor = doviz === 'USD' ? 'var(--green)' : doviz === 'EUR' ? 'var(--cyan)' : 'var(--muted)';
    const dovizSym   = doviz === 'USD' ? '$' : doviz === 'EUR' ? '€' : '₺';
    const tl         = rowTotalTL(r);
    const orijinal   = r.miktar * r.birimFiyat;
    const tipColor   = TIP_COLORS[r.tip] || 'var(--accent)';
    const totalHTML  = doviz !== 'TL'
      ? `<span style="font-weight:600">₺${fmt(tl)}</span><br><span style="font-size:10px;color:${dovizColor}">${dovizSym}${fmt(orijinal)}</span>`
      : `<span style="font-weight:600">₺${fmt(tl)}</span>`;
    return `
    <tr class="notion-row" style="border-left:3px solid ${tipColor}">
      <td style="color:var(--muted);font-size:11px;text-align:center;padding-left:6px">${idx + 1}</td>
      ${kol.tip ? `<td>
        <select class="notion-sel" style="color:${tipColor}"
          onchange="updateRow(${r.id},'tip',this.value);renderMaliyetTable();calculate()">
          <option value="malzeme" ${r.tip==='malzeme'?'selected':''}>📦 Malzeme</option>
          <option value="iscilik" ${r.tip==='iscilik'?'selected':''}>👷 İşçilik</option>
          <option value="gider"   ${r.tip==='gider'  ?'selected':''}>🏢 Gider</option>
        </select>
      </td>` : ''}
      <td>
        <input type="text" class="notion-inp" value="${escHtml(r.ad)}"
          onchange="updateRow(${r.id},'ad',this.value)"
          placeholder="Kalem adı..."
  >
      </td>
      <td>
        <input type="number" class="notion-inp notion-num" value="${r.miktar}" min="0" step="any"
          oninput="updateRow(${r.id},'miktar',this.value)">
      </td>
      ${kol.birim ? `<td>
        <input type="text" class="notion-inp" value="${escHtml(r.birim)}"
          onchange="updateRow(${r.id},'birim',this.value)" placeholder="Adet">
      </td>` : ''}
      ${kol.doviz ? `<td>
        <select class="notion-sel" style="color:${dovizColor};font-weight:700"
          onchange="updateRow(${r.id},'doviz',this.value);calculate()">
          <option value="TL"  ${doviz==='TL' ?'selected':''}>₺ TL</option>
          <option value="USD" ${doviz==='USD'?'selected':''}>$ USD</option>
          <option value="EUR" ${doviz==='EUR'?'selected':''}>€ EUR</option>
        </select>
      </td>` : ''}
      <td>
        <input type="number" class="notion-inp notion-num" value="${r.birimFiyat}" min="0" step="any"
          oninput="updateRow(${r.id},'birimFiyat',this.value)" placeholder="${dovizSym}0.00">
      </td>
      <td class="font-mono" id="rowTotal-${r.id}" style="text-align:right;line-height:1.5;padding-right:10px">${totalHTML}</td>
      ${kol.kdv ? `<td style="text-align:center">
        <input type="checkbox" ${r.kdv?'checked':''} style="accent-color:var(--accent);cursor:pointer"
          onchange="updateRow(${r.id},'kdv',this.checked)" title="KDV Dahil Et">
      </td>` : ''}
      <td><button class="notion-del-btn" onclick="removeRow(${r.id})" title="Sil">✕</button></td>
    </tr>`;
  }).join('');
}

// ── Sütun menüsü ─────────────────────────────────
function kolonMenuToggle() {
  const panel = document.getElementById('kolonMenuPanel');
  if (!panel) return;
  const open = panel.style.display !== 'none';
  panel.style.display = open ? 'none' : 'block';
  if (!open) {
    const close = e => {
      const btn = document.getElementById('kolonMenuBtn');
      if (!panel.contains(e.target) && e.target !== btn && !btn?.contains(e.target)) {
        panel.style.display = 'none';
        document.removeEventListener('click', close);
      }
    };
    setTimeout(() => document.addEventListener('click', close), 50);
  }
}

// ── Excel / TSV Yapıştır ──────────────────────────
let _excelParsedRows = [];

function excelPasteAc() {
  const modal = document.getElementById('excelPasteModal');
  if (modal) modal.style.display = 'flex';
  const ta = document.getElementById('excelPasteArea');
  if (ta) { ta.value = ''; ta.focus(); }
  const preview = document.getElementById('excelOnizlePanel');
  if (preview) preview.innerHTML = '';
  const btn = document.getElementById('excelPasteUygulaBtn');
  if (btn) { btn.disabled = true; btn.textContent = 'İçe Aktar'; }
  _excelParsedRows = [];
}

function excelPasteKapat() {
  const modal = document.getElementById('excelPasteModal');
  if (modal) modal.style.display = 'none';
}

function _parseNum(str) {
  const s = String(str || '').replace(/\s/g, '');
  if (!s) return 0;
  // Detect decimal separator: last comma vs last dot
  const ci = s.lastIndexOf(','), di = s.lastIndexOf('.');
  const normalized = ci > di
    ? s.replace(/\./g, '').replace(',', '.')  // "1.234,56" → TR format
    : s.replace(/,/g, '');                     // "1,234.56" → EN format
  const n = parseFloat(normalized);
  return isNaN(n) ? 0 : n;
}

function _parseTSV(text) {
  const lines = text.trim().split(/\r?\n/)
    .map(l => l.split('\t').map(c => c.trim().replace(/^["']|["']$/g, '')));
  if (!lines.length) return [];

  const first = lines[0].map(c => c.toLowerCase());
  const isHeader = first.some(c =>
    /^(ad|kalem|item|name|desc|malzeme|aç|miktar|qty|quant|fiyat|price|birim|unit|tip|type)/.test(c)
  );

  // Default col positions (no header)
  let colAd=0, colMiktar=1, colBirim=2, colFiyat=3, colTip=-1, colDoviz=-1;

  if (isHeader) {
    first.forEach((h, i) => {
      if (/kalem\s*ad|^ad$|^item$|^name$|malzeme|açıklama|desc/.test(h)) colAd = i;
      else if (/miktar|qty|quantity|adet/.test(h))                         colMiktar = i;
      else if (/birim\s*fiyat|unit\s*price|^price$|^fiyat$/.test(h))      colFiyat = i;
      else if (/birim|unit/.test(h))                                        colBirim = i;
      else if (/tip|tür|type|kategori/.test(h))                             colTip = i;
      else if (/döviz|para|currency/.test(h))                               colDoviz = i;
    });
  }

  const dataLines = isHeader ? lines.slice(1) : lines;
  return dataLines.map(c => {
    const ad         = c[colAd] || '';
    const miktar     = _parseNum(c[colMiktar] || '1') || 1;
    const birim      = (colBirim >= 0 && c[colBirim]) ? c[colBirim] : 'Adet';
    const birimFiyat = _parseNum(c[colFiyat]);
    const tipRaw     = colTip >= 0 ? (c[colTip] || '').toLowerCase() : '';
    const tip        = /işçi|labor|iş\s*ç/.test(tipRaw) ? 'iscilik'
                     : /gider|overhead|genel/.test(tipRaw) ? 'gider'
                     : 'malzeme';
    const dovizRaw   = colDoviz >= 0 ? (c[colDoviz] || '').toUpperCase().trim() : 'TL';
    const doviz      = ['USD', 'EUR'].includes(dovizRaw) ? dovizRaw : 'TL';
    return { ad, miktar, birim, birimFiyat, tip, doviz, kdv: true };
  }).filter(r => r.ad || r.birimFiyat > 0);
}

function excelPasteOnizle(text) {
  _excelParsedRows = _parseTSV(text);
  const el  = document.getElementById('excelOnizlePanel');
  const btn = document.getElementById('excelPasteUygulaBtn');
  if (!el) return;

  if (!_excelParsedRows.length) {
    el.innerHTML = text.trim()
      ? '<p style="color:var(--yellow);font-size:13px;margin-top:8px">⚠️ Geçerli satır algılanamadı. Excel\'den Tab ile ayrılmış veri beklenir.</p>'
      : '';
    if (btn) { btn.disabled = true; btn.textContent = 'İçe Aktar'; }
    return;
  }

  if (btn) { btn.disabled = false; btn.textContent = `İçe Aktar (${_excelParsedRows.length} satır)`; }

  el.innerHTML = `
    <div style="font-size:12px;color:var(--green);font-weight:600;margin-bottom:8px">
      ✓ ${_excelParsedRows.length} satır algılandı — önizleme:
    </div>
    <div style="overflow:auto;max-height:200px;border-radius:6px;border:1px solid var(--border)">
      <table class="data-table" style="font-size:12px">
        <thead><tr>
          <th>Kalem Adı</th><th>Tip</th><th>Miktar</th><th>Birim</th>
          <th class="text-right">Birim Fiyat</th><th>Döviz</th>
        </tr></thead>
        <tbody>
          ${_excelParsedRows.slice(0, 15).map(r => `<tr>
            <td>${escHtml(r.ad) || '<em style="color:var(--muted)">—</em>'}</td>
            <td><span class="badge badge-green" style="font-size:10px">${TIP_LABELS[r.tip] || r.tip}</span></td>
            <td>${r.miktar}</td>
            <td>${escHtml(r.birim)}</td>
            <td class="text-right font-mono">₺${fmt(r.birimFiyat)}</td>
            <td style="color:${r.doviz!=='TL'?'var(--green)':'var(--muted)'}">${r.doviz}</td>
          </tr>`).join('')}
          ${_excelParsedRows.length > 15
            ? `<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:8px;font-size:12px">… ve ${_excelParsedRows.length - 15} satır daha</td></tr>`
            : ''}
        </tbody>
      </table>
    </div>`;
}

function excelPasteUygula() {
  if (!_excelParsedRows.length) return;
  const n = _excelParsedRows.length;
  _excelParsedRows.forEach(r => {
    maliyetRows.push({ ...r, id: ++rowCounter });
  });
  _excelParsedRows = [];
  renderMaliyetTable();
  calculate();
  excelPasteKapat();
  showToast(`${n} kalem başarıyla eklendi.`, 'success');
}

// ── Spreadsheet: Toplu satır ekleme ─────────────────
function addMultipleMaliyetRows() {
  const n = Math.max(1, Math.min(100, parseInt(document.getElementById('maliyetSatirSayisi')?.value) || 5));
  const tip = document.getElementById('maliyetFiltreTip')?.value || 'malzeme';
  const startIdx = maliyetRows.length;
  for (let i = 0; i < n; i++) {
    maliyetRows.push({ id: ++rowCounter, tip, ad: '', miktar: 1, birim: 'Adet', birimFiyat: 0, doviz: 'TL', kdv: true });
  }
  renderMaliyetTable();
  calculate();
  requestAnimationFrame(() => {
    const rows = document.querySelectorAll('#maliyetBody tr');
    const targetRow = rows[startIdx];
    if (targetRow) {
      const first = targetRow.querySelector('.notion-inp');
      if (first) first.focus();
    }
  });
}

function addMultipleGelirRows() {
  const n = Math.max(1, Math.min(100, parseInt(document.getElementById('gelirSatirSayisi')?.value) || 3));
  const startIdx = gelirRows.length;
  for (let i = 0; i < n; i++) {
    gelirRows.push({ id: ++rowCounter, ad: '', miktar: 1, birim: 'Adet', birimFiyat: 0 });
  }
  renderGelirTable();
  calculate();
  requestAnimationFrame(() => {
    const rows = document.querySelectorAll('#gelirBody tr');
    const targetRow = rows[startIdx];
    if (targetRow) {
      const first = targetRow.querySelector('.notion-inp');
      if (first) first.focus();
    }
  });
}

// ── Direkt TSV Yapıştır ─────────────────────────────
function _pasteToMaliyet(text) {
  const rows = _parseTSV(text);
  if (!rows.length) {
    showToast('Yapıştırılacak veri bulunamadı. Excel\'den sekme (Tab) ile ayrılmış veri bekleniyor.', 'error');
    return;
  }
  rows.forEach(r => maliyetRows.push({ ...r, id: ++rowCounter }));
  renderMaliyetTable();
  calculate();
  showToast(`✓ ${rows.length} kalem yapıştırıldı.`, 'success');
}

function _pasteToGelir(text) {
  const lines = text.trim().split(/\r?\n/).filter(l => l.trim());
  const first = lines[0].split('\t').map(c => c.toLowerCase().trim());
  const isHeader = first.some(c => /^(ad|item|name|fiyat|price|miktar|qty|kalem)/.test(c));
  const dataLines = isHeader ? lines.slice(1) : lines;
  let colAd=0, colMiktar=1, colBirim=2, colFiyat=3;
  if (isHeader) {
    first.forEach((h, i) => {
      if (/^(ad|item|name|kalem|açıklama)/.test(h)) colAd = i;
      else if (/miktar|qty|adet/.test(h)) colMiktar = i;
      else if (/birim\s*fiyat|^fiyat$|^price$/.test(h)) colFiyat = i;
      else if (/birim|unit/.test(h)) colBirim = i;
    });
  }
  const rows = dataLines.map(l => {
    const c = l.split('\t').map(x => x.trim().replace(/^["']|["']$/g, ''));
    return { id: ++rowCounter, ad: c[colAd] || '', miktar: _parseNum(c[colMiktar] || '1') || 1, birim: c[colBirim] || 'Adet', birimFiyat: _parseNum(c[colFiyat] || '0') };
  }).filter(r => r.ad || r.birimFiyat > 0);
  if (!rows.length) { showToast('Geçerli satır bulunamadı.', 'error'); return; }
  rows.forEach(r => gelirRows.push(r));
  renderGelirTable();
  calculate();
  showToast(`✓ ${rows.length} gelir kalemi yapıştırıldı.`, 'success');
}

// ── E-Tablo Davranışı Kurulumu ───────────────────────
function setupSpreadsheetBehavior() {
  // ① Ctrl+V: veriyi doğrudan tabloya yapıştır
  document.addEventListener('paste', function(e) {
    const target = e.target;
    if (target.tagName === 'TEXTAREA') return;
    const text = (e.clipboardData || window.clipboardData).getData('text');
    if (!text || !text.trim()) return;

    const hasTab  = text.includes('\t');
    const lines   = text.trim().split(/\r?\n/).filter(l => l.trim());
    const inMaliyet = target.closest && target.closest('#maliyetBody');
    const inGelir   = target.closest && target.closest('#gelirBody');
    const inKatalog = target.closest && target.closest('#katalogBody');
    const katalogAktif = document.getElementById('tab-katalog')?.classList.contains('active');

    // Maliyet / Gelir: yalnızca çok satırlı TSV
    if (inMaliyet || inGelir) {
      if (!hasTab || lines.length <= 1) return;
      e.preventDefault();
      if (inGelir) _pasteToGelir(text); else _pasteToMaliyet(text);
      return;
    }

    // Katalog: TSV veya tek sütun liste
    if (inKatalog || katalogAktif) {
      if (lines.length <= 1 && !hasTab) return; // tek hücre — tarayıcıya bırak
      e.preventDefault();
      if (inKatalog && hasTab) {
        // Hücre bazlı range paste: odaklanan hücreden başla
        const tr = target.closest('tr');
        if (tr) {
          const rows = [...document.querySelectorAll('#katalogBody tr')];
          const rowIdx = rows.indexOf(tr);
          const inputs = [...tr.querySelectorAll('.ks-input, .ks-select')];
          const colIdx = inputs.indexOf(target);
          if (rowIdx >= 0 && colIdx >= 0) { _pasteRangeToKatalog(text, rowIdx, colIdx); return; }
        }
      }
      if (hasTab) _pasteToKatalog(text);
      else        _pasteSingleColToKatalog(text); // tek sütun liste → ürün adı
      return;
    }

    // Diğer INPUT'lar: dokunma
    if (target.tagName === 'INPUT') return;
    if (!hasTab) return;
    e.preventDefault();
    _pasteToMaliyet(text);
  });

  // ② Klavye navigasyonu: Enter / Arrow tuşları (maliyet, gelir, katalog)
  document.addEventListener('keydown', function(e) {
    const target = e.target;
    const isNotionCell = target.classList.contains('notion-inp') || target.classList.contains('notion-sel');
    const isKsCell     = target.classList.contains('ks-input')  || target.classList.contains('ks-select');
    if (!isNotionCell && !isKsCell) return;
    const inMaliyet = target.closest('#maliyetBody');
    const inGelir   = target.closest('#gelirBody');
    const inKatalog = target.closest('#katalogBody');
    if (!inMaliyet && !inGelir && !inKatalog) return;
    const tr = target.closest('tr');
    if (!tr) return;
    const cellSel = isKsCell ? '.ks-input, .ks-select' : '.notion-inp, .notion-sel';

    if (e.key === 'Enter' && !inKatalog) {
      // Katalog Enter'ı kendi katalogKeyNav içinde yönetiliyor
      e.preventDefault();
      const nextTr = tr.nextElementSibling;
      if (nextTr) {
        const first = nextTr.querySelector(cellSel);
        if (first) { first.focus(); return; }
      }
      if (inMaliyet) {
        const sel = tr.querySelector('.notion-sel');
        addRow(sel ? sel.value : 'malzeme');
      } else {
        addGelirRow();
      }
    } else if (e.key === 'ArrowDown' && !e.altKey && !e.ctrlKey) {
      const nextTr = tr.nextElementSibling;
      if (nextTr) {
        const inputs = [...tr.querySelectorAll(cellSel)];
        const ci = inputs.indexOf(target);
        const nextInputs = [...nextTr.querySelectorAll(cellSel)];
        const nx = nextInputs[Math.min(ci, nextInputs.length - 1)];
        if (nx) { e.preventDefault(); nx.focus(); }
      }
    } else if (e.key === 'ArrowUp' && !e.altKey && !e.ctrlKey) {
      const prevTr = tr.previousElementSibling;
      if (prevTr) {
        const inputs = [...tr.querySelectorAll(cellSel)];
        const ci = inputs.indexOf(target);
        const prevInputs = [...prevTr.querySelectorAll(cellSel)];
        const px = prevInputs[Math.min(ci, prevInputs.length - 1)];
        if (px) { e.preventDefault(); px.focus(); }
      }
    }
  });
}

// ── Gelir Kalemleri ───────────────────────────────
function addGelirRow() {
  const id = ++rowCounter;
  gelirRows.push({ id, ad: '', miktar: 1, birim: 'Adet', birimFiyat: 0 });
  renderGelirTable();
  calculate();
}

function removeGelirRow(id) {
  gelirRows = gelirRows.filter(r => r.id !== id);
  renderGelirTable();
  calculate();
}

function updateGelirRow(id, field, val) {
  const r = gelirRows.find(r => r.id === id);
  if (!r) return;
  if (['miktar', 'birimFiyat'].includes(field)) r[field] = parseFloat(val) || 0;
  else r[field] = val;
  if (field !== 'ad' && field !== 'birim') {
    calculate();
    const el = document.getElementById('gelirRowTotal-' + id);
    if (el) el.textContent = fmt(r.miktar * r.birimFiyat);
  }
}

function renderGelirTable() {
  const tbody = document.getElementById('gelirBody');
  if (!tbody) return;
  tbody.innerHTML = gelirRows.map((r, i) => `
    <tr class="notion-row">
      <td style="color:var(--muted);font-size:11px;text-align:center">${i + 1}</td>
      <td><input type="text" class="notion-inp" value="${escHtml(r.ad)}"
        onchange="updateGelirRow(${r.id},'ad',this.value)" placeholder="Gelir kalemi adı..."></td>
      <td><input type="number" class="notion-inp notion-num" value="${r.miktar}" min="0" step="any"
        oninput="updateGelirRow(${r.id},'miktar',this.value)"></td>
      <td><input type="text" class="notion-inp" value="${escHtml(r.birim)}"
        onchange="updateGelirRow(${r.id},'birim',this.value)" placeholder="Adet"></td>
      <td><input type="number" class="notion-inp notion-num" value="${r.birimFiyat}" min="0" step="any"
        oninput="updateGelirRow(${r.id},'birimFiyat',this.value)"></td>
      <td class="font-mono text-right" id="gelirRowTotal-${r.id}">${fmt(r.miktar * r.birimFiyat)}</td>
      <td><button class="notion-del-btn" onclick="removeGelirRow(${r.id})" title="Sil">✕</button></td>
    </tr>
  `).join('');
}
