// ── PROJE YÖNETİMİ (#6: REVİZYON GEÇMİŞİ) ────────
const MAX_REVISIONS = 10;

// ── Proje listesi ──────────────────────────────────
function getAllProjects() {
  try { return JSON.parse(localStorage.getItem('fizibilite_projeler') || '[]'); }
  catch(e) { return []; }
}
function saveAllProjects(list) {
  localStorage.setItem('fizibilite_projeler', JSON.stringify(list));
}

// ── Revizyon geçmişi ───────────────────────────────
function saveRevision(state) {
  try {
    let revisions = JSON.parse(localStorage.getItem('fizibilite_revisions') || '[]');
    const projeAdi = state.projeAdi || 'Belirtilmemiş';
    revisions.unshift({
      ts: new Date().toISOString(),
      label: new Date().toLocaleString('tr-TR'),
      projeAdi,
      marj: (() => {
        const maliyetNet = (state.maliyetRows || []).reduce((s, r) => s + r.miktar * r.birimFiyat, 0);
        const gelirKalem = (state.gelirRows || []).reduce((s, r) => s + r.miktar * r.birimFiyat, 0);
        const gelir = gelirKalem > 0 ? gelirKalem : parseFloat(state.teklifFiyati) || 0;
        return gelir > 0 ? ((gelir - maliyetNet) / gelir * 100).toFixed(1) : '0';
      })(),
      state
    });
    if (revisions.length > MAX_REVISIONS) revisions = revisions.slice(0, MAX_REVISIONS);
    localStorage.setItem('fizibilite_revisions', JSON.stringify(revisions));
  } catch(e) {}
}

function getRevisions() {
  try { return JSON.parse(localStorage.getItem('fizibilite_revisions') || '[]'); }
  catch(e) { return []; }
}

function revizyonYukle(idx) {
  const revisions = getRevisions();
  const rev = revisions[idx];
  if (!rev) return;
  if (!confirm(`"${rev.label}" revizyonunu yüklemek istiyor musunuz? Kaydedilmemiş değişiklikler kaybolur.`)) return;
  const s = rev.state;
  Object.keys(s).forEach(k => {
    const el = document.getElementById(k);
    if (el && typeof s[k] === 'string') el.value = s[k];
  });
  maliyetRows = s.maliyetRows || [];
  gelirRows = s.gelirRows || [];
  rakipRows = s.rakipRows || [];
  rowCounter = s.rowCounter || 0;
  rakipCounter = s.rakipCounter || 0;
  if (s.urunler) { urunler = s.urunler; urunCounter = s.urunCounter || 0; }
  ekipmanRows = s.ekipmanRows || [];
  ekipmanCounter = s.ekipmanCounter || 0;
  renderMaliyetTable();
  renderGelirTable();
  renderRakipRows();
  renderEkipmanTable();
  calculate();
  renderRevList();
  showToast(`Revizyon yüklendi: ${rev.label}`, 'success');
}

function renderRevList() {
  const el = document.getElementById('revisionListesi');
  if (!el) return;
  const revisions = getRevisions();
  if (revisions.length === 0) {
    el.innerHTML = '<div style="text-align:center;padding:20px;color:var(--muted);font-size:13px">Henüz revizyon kaydı yok.<br>Her hesaplama otomatik kaydedilir.</div>';
    return;
  }
  el.innerHTML = revisions.map((rev, i) => {
    const marjColor = rev.marj < 0 ? 'var(--red)' : rev.marj < 10 ? 'var(--yellow)' : 'var(--green)';
    return `
    <div style="display:flex;align-items:center;gap:12px;padding:10px 14px;border:1px solid var(--border);border-radius:8px;margin-bottom:6px;cursor:pointer;transition:border-color .15s"
      onclick="revizyonYukle(${i})" onmouseover="this.style.borderColor='var(--accent)'" onmouseout="this.style.borderColor='var(--border)'">
      <div style="font-size:22px">🕐</div>
      <div style="flex:1">
        <div style="font-size:13px;font-weight:600">${rev.projeAdi || 'İsimsiz'}</div>
        <div style="font-size:11px;color:var(--muted);margin-top:2px">${rev.label}</div>
      </div>
      <div style="text-align:right">
        <div style="font-size:15px;font-weight:700;color:${marjColor}">%${rev.marj}</div>
        <div style="font-size:10px;color:var(--muted)">marj</div>
      </div>
      ${i === 0 ? '<span style="font-size:10px;background:rgba(79,125,255,.15);color:var(--accent);padding:2px 6px;border-radius:10px">SON</span>' : ''}
    </div>`;
  }).join('');
}

// ── Proje kaydet / yükle / sil ─────────────────────
function projeKaydet() {
  const ad = document.getElementById('projeAdi').value.trim() || 'İsimsiz Proje';
  const list = getAllProjects();
  const state = buildState();
  const toplamMaliyet = maliyetRows.reduce((s, r) => s + rowTotalTL(r), 0);
  const gelirKalem = gelirRows.reduce((s, r) => s + r.miktar * r.birimFiyat, 0);
  const gelir = gelirKalem > 0 ? gelirKalem : parseFloat(document.getElementById('teklifFiyati').value) || 0;
  const kar = gelir - toplamMaliyet;
  const marj = gelir > 0 ? (kar / gelir * 100).toFixed(1) : 0;

  const mevcutIdx = list.findIndex(p => p.ad === ad);
  const id = mevcutIdx >= 0 ? list[mevcutIdx].id : Date.now().toString();
  const kayit = { id, ad, tarih: new Date().toLocaleDateString('tr-TR'), marj, gelir, maliyet: toplamMaliyet, state };
  if (mevcutIdx >= 0) list[mevcutIdx] = kayit;
  else list.unshift(kayit);

  saveAllProjects(list);
  renderProjeListesi();
  showToast(`"${ad}" kaydedildi.`, 'success');
}

function projeSil(id, e) {
  e.stopPropagation();
  const list = getAllProjects().filter(p => p.id !== id);
  saveAllProjects(list);
  renderProjeListesi();
}

function projeYukle(id) {
  const p = getAllProjects().find(p => p.id === id);
  if (!p) return;
  if (!confirm(`"${p.ad}" projesini yüklemek istiyor musunuz? Kaydedilmemiş değişiklikler kaybolur.`)) return;
  const s = p.state;
  Object.keys(s).forEach(k => {
    const el = document.getElementById(k);
    if (el && typeof s[k] === 'string') el.value = s[k];
  });
  maliyetRows = s.maliyetRows || [];
  gelirRows = s.gelirRows || [];
  rakipRows = s.rakipRows || [];
  rowCounter = s.rowCounter || 0;
  rakipCounter = s.rakipCounter || 0;
  if (s.urunler) { urunler = s.urunler; urunCounter = s.urunCounter || 0; renderKatalog(); }
  ekipmanRows = s.ekipmanRows || [];
  ekipmanCounter = s.ekipmanCounter || 0;
  renderMaliyetTable();
  renderGelirTable();
  renderRakipRows();
  renderEkipmanTable();
  calculate();
  closeProjeModal();
  showToast(`"${p.ad}" yüklendi.`, 'success');
}

function projeCopla(id, e) {
  e.stopPropagation();
  const list = getAllProjects();
  const p = list.find(p => p.id === id);
  if (!p) return;
  const kopya = { ...p, id: Date.now().toString(), ad: p.ad + ' (Kopya)', tarih: new Date().toLocaleDateString('tr-TR') };
  list.unshift(kopya);
  saveAllProjects(list);
  renderProjeListesi();
  showToast('Proje kopyalandı.', 'success');
}

function renderProjeListesi() {
  const arama = (document.getElementById('projeArama')?.value || '').toLowerCase();
  const list = getAllProjects().filter(p => p.ad.toLowerCase().includes(arama));
  const el = document.getElementById('projeListesi');
  if (!el) return;
  if (list.length === 0) {
    el.innerHTML = '<div style="text-align:center;padding:32px;color:var(--muted);font-size:13px">Henüz kayıtlı proje yok.<br>Mevcut projeyi "Kaydet" ile saklayın.</div>';
    return;
  }
  const paraBirimi = document.getElementById('paraBirimi')?.value || 'TL';
  const sym = paraBirimi === 'TL' ? '₺' : paraBirimi === 'USD' ? '$' : '€';
  el.innerHTML = list.map(p => {
    const marjC = p.marj < 0 ? 'var(--red)' : p.marj < 10 ? 'var(--yellow)' : 'var(--green)';
    return `
    <div class="proje-item" onclick="projeYukle('${p.id}')">
      <div style="font-size:28px">📋</div>
      <div class="proje-item-info">
        <div class="proje-item-name">${p.ad}</div>
        <div class="proje-item-meta">${p.tarih} · Gelir: ${sym}${fmt(p.gelir)} · Maliyet: ${sym}${fmt(p.maliyet)}</div>
      </div>
      <div style="text-align:right;min-width:70px">
        <div style="font-size:16px;font-weight:700;color:${marjC}">%${p.marj}</div>
        <div style="font-size:11px;color:var(--muted)">kar marjı</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:4px">
        <button class="btn btn-ghost btn-sm" onclick="projeCopla('${p.id}',event)" title="Kopyala">⎘</button>
        <button class="btn btn-danger" onclick="projeSil('${p.id}',event)" title="Sil">✕</button>
      </div>
    </div>`;
  }).join('');
}

function openProjeModal() {
  renderProjeListesi();
  renderRevList();
  document.getElementById('projeModal').classList.add('open');
}
function closeProjeModal() {
  document.getElementById('projeModal').classList.remove('open');
}

function switchModalTab(tab) {
  ['liste','karsilastir','revisions'].forEach(t => {
    const btn = document.getElementById('mTab-' + t);
    const panel = document.getElementById('modalTab-' + t);
    if (btn) btn.classList.toggle('active', t === tab);
    if (panel) panel.style.display = t === tab ? '' : 'none';
  });
  if (tab === 'revisions') renderRevList();
  if (tab === 'karsilastir') renderKarsilastir();
}

function renderKarsilastir() {
  const list = getAllProjects().slice(0, 5);
  const el = document.getElementById('karsilastirIcerik');
  if (!el || list.length === 0) {
    if (el) el.innerHTML = '<p style="color:var(--muted);font-size:13px">Karşılaştırma için en az 1 kayıtlı proje gerekli.</p>';
    return;
  }
  const paraBirimi = document.getElementById('paraBirimi')?.value || 'TL';
  const sym = paraBirimi === 'TL' ? '₺' : '$';
  el.innerHTML = `<table class="data-table" style="margin-bottom:12px"><thead><tr>
    <th>Proje</th><th class="text-right">Gelir</th><th class="text-right">Maliyet</th><th class="text-right">Kar Marjı</th>
  </tr></thead><tbody>${list.map(p => {
    const marjC = p.marj < 0 ? 'var(--red)' : p.marj < 10 ? 'var(--yellow)' : 'var(--green)';
    return `<tr><td>${p.ad}</td><td class="text-right font-mono">${sym}${fmt(p.gelir)}</td><td class="text-right font-mono">${sym}${fmt(p.maliyet)}</td><td class="text-right font-bold" style="color:${marjC}">%${p.marj}</td></tr>`;
  }).join('')}</tbody></table>`;

  // Karşılaştırma grafiği
  const ctx = document.getElementById('chartKarsilastir');
  if (ctx) {
    if (window._chartKarsilastir) window._chartKarsilastir.destroy();
    window._chartKarsilastir = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: list.map(p => p.ad.substring(0, 15)),
        datasets: [
          { label: 'Gelir', data: list.map(p => p.gelir), backgroundColor: 'rgba(34,197,94,.6)', borderRadius: 4 },
          { label: 'Maliyet', data: list.map(p => p.maliyet), backgroundColor: 'rgba(239,68,68,.6)', borderRadius: 4 },
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#8892a4' } } },
        scales: {
          x: { grid: { color: 'rgba(46,51,82,.4)' }, ticks: { color: '#8892a4' } },
          y: { grid: { color: 'rgba(46,51,82,.4)' }, ticks: { color: '#8892a4', callback: v => sym + fmt(v) } }
        }
      }
    });
  }
}

// ── Persist ────────────────────────────────────────
function buildState() {
  return {
    projeAdi: document.getElementById('projeAdi').value,
    musteri: document.getElementById('musteri').value,
    tarih: document.getElementById('tarih').value,
    paraBirimi: document.getElementById('paraBirimi').value,
    kdvOrani: document.getElementById('kdvOrani').value,
    teklifFiyati: document.getElementById('teklifFiyati').value,
    notlar: document.getElementById('notlar').value,
    hedefMarj: document.getElementById('hedefMarj').value,
    kotumserGelir: document.getElementById('kotumserGelir').value,
    kotumserMaliyet: document.getElementById('kotumserMaliyet').value,
    iyimserGelir: document.getElementById('iyimserGelir').value,
    iyimserMaliyet: document.getElementById('iyimserMaliyet').value,
    kvOrani: document.getElementById('kvOrani').value,
    stopajOrani: document.getElementById('stopajOrani').value,
    kurUSD: document.getElementById('kurUSD').value,
    kurEUR: document.getElementById('kurEUR').value,
    nakitSure: document.getElementById('nakitSure').value,
    nkAvans: document.getElementById('nkAvans').value,
    nkAraOran: document.getElementById('nkAraOran').value,
    nkAraAy: document.getElementById('nkAraAy').value,
    nkKabulOran: document.getElementById('nkKabulOran').value,
    nkKabulAy: document.getElementById('nkKabulAy').value,
    nkMalBaslangic: document.getElementById('nkMalBaslangic').value,
    // Vade analizi
    vadeAktif: document.getElementById('vadeAktif')?.checked ? '1' : '0',
    tahsilatVadeAy: document.getElementById('tahsilatVadeAy')?.value || '3',
    odemeVadeAy: document.getElementById('odemeVadeAy')?.value || '0',
    vadeFinansmanOrani: document.getElementById('vadeFinansmanOrani')?.value || '30',
    vadeKurArtis: document.getElementById('vadeKurArtis')?.value || '20',
    kdvBeyanDonem: document.getElementById('kdvBeyanDonem')?.value || 'aylik',
    ilkYatirim: document.getElementById('ilkYatirim')?.value || '0',
    degSure: document.getElementById('degSure')?.value || '12',
    // Enflasyon & Hedging
    enflasyonAktif: document.getElementById('enflasyonAktif')?.checked ? '1' : '0',
    enflasyonOrani: document.getElementById('enflasyonOrani')?.value || '40',
    enflasyonYil: document.getElementById('enflasyonYil')?.value || '3',
    enflasyonDuyarlilik: document.getElementById('enflasyonDuyarlilik')?.value || '100',
    hedgingAktif: document.getElementById('hedgingAktif')?.checked ? '1' : '0',
    hedgingVade: document.getElementById('hedgingVade')?.value || '3',
    hedgingPrim: document.getElementById('hedgingPrim')?.value || '25',
    maliyetRows, gelirRows, rowCounter, rakipRows, rakipCounter,
    urunler, urunCounter,
    ekipmanRows, ekipmanCounter,
  };
}

let _saveRevisionPending = false;
function saveLocal() {
  try {
    const state = buildState();
    localStorage.setItem('fizibilite_state', JSON.stringify(state));
    // Revizyon: debounce — en fazla her 30 saniyede 1 kayıt
    if (!_saveRevisionPending) {
      _saveRevisionPending = true;
      setTimeout(() => {
        saveRevision(buildState());
        _saveRevisionPending = false;
      }, 30000);
    }
  } catch(e) {}
}

function saveLocalImmediate() {
  try {
    const state = buildState();
    localStorage.setItem('fizibilite_state', JSON.stringify(state));
    saveRevision(state);
  } catch(e) {}
}

function loadLocal() {
  try {
    const raw = localStorage.getItem('fizibilite_state');
    if (!raw) return;
    const s = JSON.parse(raw);
    ['projeAdi','musteri','tarih','paraBirimi','kdvOrani','teklifFiyati','notlar','hedefMarj',
     'kotumserGelir','kotumserMaliyet','iyimserGelir','iyimserMaliyet','kvOrani','stopajOrani',
     'kurUSD','kurEUR','nakitSure','nkAvans','nkAraOran','nkAraAy','nkKabulOran','nkKabulAy','nkMalBaslangic',
     'tahsilatVadeAy','odemeVadeAy','vadeFinansmanOrani','vadeKurArtis','ilkYatirim','degSure',
     'enflasyonOrani','enflasyonYil','enflasyonDuyarlilik','hedgingVade','hedgingPrim'].forEach(k => {
      const el = document.getElementById(k);
      if (el && s[k] !== undefined) el.value = s[k];
    });
    if (s.vadeAktif !== undefined) {
      const cb = document.getElementById('vadeAktif');
      if (cb) cb.checked = s.vadeAktif === '1';
    }
    if (s.enflasyonAktif !== undefined) {
      const cb = document.getElementById('enflasyonAktif');
      if (cb) cb.checked = s.enflasyonAktif === '1';
    }
    if (s.hedgingAktif !== undefined) {
      const cb = document.getElementById('hedgingAktif');
      if (cb) cb.checked = s.hedgingAktif === '1';
    }
    if (s.kdvBeyanDonem) {
      const sel = document.getElementById('kdvBeyanDonem');
      if (sel) sel.value = s.kdvBeyanDonem;
    }
    if (s.maliyetRows && s.maliyetRows.length) { maliyetRows = s.maliyetRows; renderMaliyetTable(); }
    if (s.gelirRows && s.gelirRows.length) { gelirRows = s.gelirRows; renderGelirTable(); }
    if (s.rowCounter) rowCounter = s.rowCounter;
    if (s.rakipRows && s.rakipRows.length) { rakipRows = s.rakipRows; renderRakipRows(); }
    if (s.rakipCounter) rakipCounter = s.rakipCounter;
    if (s.urunler && s.urunler.length) {
      urunler = s.urunler.map(u => ({ id: u.id, ad: u.ad || '' }));
    }
    if (s.urunCounter) urunCounter = s.urunCounter;
    renderKatalog();
    if (s.ekipmanRows && s.ekipmanRows.length) { ekipmanRows = s.ekipmanRows; renderEkipmanTable(); }
    if (s.ekipmanCounter) ekipmanCounter = s.ekipmanCounter;
  } catch(e) {}
}

function clearAll() {
  if (!confirm('Tüm verileri temizlemek istiyor musunuz?')) return;
  localStorage.removeItem('fizibilite_state');
  maliyetRows = []; gelirRows = []; rakipRows = []; rowCounter = 0; rakipCounter = 0;
  ekipmanRows = []; ekipmanCounter = 0; renderEkipmanTable();
  ['projeAdi','musteri','notlar','teklifFiyati'].forEach(k => document.getElementById(k).value = '');
  document.getElementById('kdvOrani').value = 20;
  document.getElementById('hedefMarj').value = 20;
  document.getElementById('kvOrani').value = 25;
  document.getElementById('stopajOrani').value = 0;
  document.getElementById('tarih').value = new Date().toISOString().split('T')[0];
  addRow('malzeme'); addRow('iscilik'); addRow('gider');
  addGelirRow(); addRakip();
  calculate();
  showToast('Yeni proje oluşturuldu.', 'success');
}
