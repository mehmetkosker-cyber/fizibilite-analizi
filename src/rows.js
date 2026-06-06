// ── ROW MANAGEMENT ────────────────────────────────
function addRow(tip) {
  const id = ++rowCounter;
  maliyetRows.push({ id, tip, ad: '', miktar: 1, birim: 'Adet', birimFiyat: 0, doviz: 'TL', kdv: true });
  renderMaliyetTable();
  calculate();
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
  if (el) {
    const tl = rowTotalTL(r);
    const doviz = r.doviz || 'TL';
    const orijinal = r.miktar * r.birimFiyat;
    el.innerHTML = doviz !== 'TL'
      ? `<span style="color:var(--text)">₺${fmt(tl)}</span><br><span style="font-size:10px;color:var(--muted)">${doviz === 'USD' ? '$' : '€'}${fmt(orijinal)}</span>`
      : `₺${fmt(tl)}`;
  }
}

function renderMaliyetTable() {
  const tbody = document.getElementById('maliyetBody');
  if (!tbody) return;
  tbody.innerHTML = maliyetRows.map((r, i) => {
    const doviz = r.doviz || 'TL';
    const dovizColor = doviz === 'USD' ? 'var(--green)' : doviz === 'EUR' ? 'var(--cyan)' : 'var(--muted)';
    const dovizSym = doviz === 'USD' ? '$' : doviz === 'EUR' ? '€' : '₺';
    const tl = rowTotalTL(r);
    const orijinal = r.miktar * r.birimFiyat;
    const totalHTML = doviz !== 'TL'
      ? `<span style="color:var(--text);font-weight:600">₺${fmt(tl)}</span><br><span style="font-size:10px;color:${dovizColor}">${dovizSym}${fmt(orijinal)}</span>`
      : `₺${fmt(tl)}`;
    return `
    <tr style="${doviz !== 'TL' ? 'background:rgba(34,197,94,.03)' : ''}">
      <td style="color:var(--muted)">${i + 1}</td>
      <td><span style="font-size:11px">${TIP_LABELS[r.tip] || r.tip}</span></td>
      <td><input type="text" value="${r.ad}" onchange="updateRow(${r.id},'ad',this.value)" placeholder="Kalem adı"></td>
      <td><input type="number" value="${r.miktar}" min="0" step="any" oninput="updateRow(${r.id},'miktar',this.value)"></td>
      <td><input type="text" value="${r.birim}" onchange="updateRow(${r.id},'birim',this.value)" placeholder="Adet"></td>
      <td>
        <select onchange="updateRow(${r.id},'doviz',this.value);calculate()"
          style="padding:5px 4px;font-size:12px;font-weight:600;color:${dovizColor};border-color:${doviz!=='TL'?dovizColor:'var(--border)'}">
          <option value="TL"  ${doviz==='TL' ?'selected':''}>₺ TL</option>
          <option value="USD" ${doviz==='USD'?'selected':''}>$ USD</option>
          <option value="EUR" ${doviz==='EUR'?'selected':''}>€ EUR</option>
        </select>
      </td>
      <td><input type="number" value="${r.birimFiyat}" min="0" step="any" oninput="updateRow(${r.id},'birimFiyat',this.value)"
        placeholder="${dovizSym}0.00"></td>
      <td class="font-mono" id="rowTotal-${r.id}" style="line-height:1.4">${totalHTML}</td>
      <td style="text-align:center"><input type="checkbox" ${r.kdv ? 'checked' : ''} onchange="updateRow(${r.id},'kdv',this.checked)" title="KDV Dahil Et"></td>
      <td><button class="btn btn-danger" onclick="removeRow(${r.id})">✕</button></td>
    </tr>`;
  }).join('');
}

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
    <tr>
      <td style="color:var(--muted)">${i + 1}</td>
      <td><input type="text" value="${r.ad}" onchange="updateGelirRow(${r.id},'ad',this.value)" placeholder="Gelir kalemi adı"></td>
      <td><input type="number" value="${r.miktar}" min="0" step="any" oninput="updateGelirRow(${r.id},'miktar',this.value)"></td>
      <td><input type="text" value="${r.birim}" onchange="updateGelirRow(${r.id},'birim',this.value)" placeholder="Adet"></td>
      <td><input type="number" value="${r.birimFiyat}" min="0" step="any" oninput="updateGelirRow(${r.id},'birimFiyat',this.value)"></td>
      <td class="font-mono" id="gelirRowTotal-${r.id}">${fmt(r.miktar * r.birimFiyat)}</td>
      <td><button class="btn btn-danger" onclick="removeGelirRow(${r.id})">✕</button></td>
    </tr>
  `).join('');
}
