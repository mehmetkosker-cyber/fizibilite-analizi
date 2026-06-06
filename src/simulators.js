// ── FİYAT ÖNERİ & SİMÜLATÖR ──────────────────────
function updateOneri() {
  const paraBirimi = document.getElementById('paraBirimi').value;
  const sym = paraBirimi === 'TL' ? '₺' : paraBirimi === 'USD' ? '$' : '€';
  const toplamMaliyetNet = maliyetRows.reduce((s, r) => s + rowTotalTL(r), 0);

  const marj = parseFloat(document.getElementById('oneriMarj').value) / 100 || 0;
  const markup = parseFloat(document.getElementById('oneriMarkup').value) / 100 || 0;

  const marjFiyat = marj < 1 ? toplamMaliyetNet / (1 - marj) : 0;
  const markupFiyat = toplamMaliyetNet * (1 + markup);

  const mEl = document.getElementById('oneriMarjFiyat');
  const kEl = document.getElementById('oneriMarkupFiyat');
  if (mEl) mEl.textContent = sym + fmt(marjFiyat);
  if (kEl) kEl.textContent = sym + fmt(markupFiyat);
}

function kullanFiyat(tip) {
  const toplamMaliyetNet = maliyetRows.reduce((s, r) => s + rowTotalTL(r), 0);
  let fiyat;
  if (tip === 'marj') {
    const marj = parseFloat(document.getElementById('oneriMarj').value) / 100 || 0;
    fiyat = marj < 1 ? toplamMaliyetNet / (1 - marj) : 0;
  } else {
    const markup = parseFloat(document.getElementById('oneriMarkup').value) / 100 || 0;
    fiyat = toplamMaliyetNet * (1 + markup);
  }
  document.getElementById('teklifFiyati').value = fiyat.toFixed(2);
  calculate();
}

function updateSimLimits(maliyet, sym) {
  _simMaliyet = maliyet;
  const slider = document.getElementById('simSlider');
  if (!slider) return;
  const min = Math.max(0, maliyet * 0.5);
  const max = maliyet * 2.5 || 1000000;
  slider.min = min.toFixed(0);
  slider.max = max.toFixed(0);
  slider.step = Math.max(1, (max - min) / 500).toFixed(0);
  const current = parseFloat(document.getElementById('teklifFiyati').value) || maliyet;
  slider.value = Math.min(max, Math.max(min, current));
  document.getElementById('simMin').textContent = sym + fmt(min);
  document.getElementById('simMax').textContent = sym + fmt(max);
  updateSim();
}

function updateSim() {
  const paraBirimi = document.getElementById('paraBirimi').value;
  const sym = paraBirimi === 'TL' ? '₺' : paraBirimi === 'USD' ? '$' : '€';
  const slider = document.getElementById('simSlider');
  if (!slider) return;
  const fiyat = parseFloat(slider.value) || 0;
  const maliyet = _simMaliyet;
  const kar = fiyat - maliyet;
  const marj = fiyat > 0 ? (kar / fiyat) * 100 : 0;
  document.getElementById('simLabel').textContent = sym + fmt(fiyat);
  const karEl = document.getElementById('simKar');
  const marjEl = document.getElementById('simMarj');
  const color = kar >= 0 ? 'var(--green)' : 'var(--red)';
  document.getElementById('simFiyat').textContent = sym + fmt(fiyat);
  karEl.textContent = sym + fmt(kar);
  karEl.style.color = color;
  marjEl.textContent = marj.toFixed(1) + '%';
  marjEl.style.color = color;
}

function updateIndirim() {
  const paraBirimi = document.getElementById('paraBirimi').value;
  const sym = paraBirimi === 'TL' ? '₺' : paraBirimi === 'USD' ? '$' : '€';
  const slider = document.getElementById('indSlider');
  const manuel = document.getElementById('indManuel');
  const oran = parseFloat(slider?.value || manuel?.value || 0);
  if (manuel) manuel.value = oran;
  if (slider) slider.value = oran;
  document.getElementById('indYuzde').textContent = '%' + oran.toFixed(1);

  const teklifFiyati = parseFloat(document.getElementById('teklifFiyati').value) || 0;
  const toplamMaliyet = maliyetRows.reduce((s, r) => s + rowTotalTL(r), 0);
  const indirimliF = teklifFiyati * (1 - oran / 100);
  const indirimliKar = indirimliF - toplamMaliyet;
  const indirimliMarj = indirimliF > 0 ? (indirimliKar / indirimliF) * 100 : 0;

  const sonucEl = document.getElementById('indSonuc');
  if (sonucEl) {
    const color = indirimliKar >= 0 ? 'var(--green)' : 'var(--red)';
    sonucEl.innerHTML = [
      { label: 'İndirimli Fiyat', val: sym + fmt(indirimliF), color: 'var(--accent)' },
      { label: 'Yeni Net Kar', val: sym + fmt(indirimliKar), color },
      { label: 'Yeni Kar Marjı', val: indirimliMarj.toFixed(1) + '%', color },
      { label: 'İndirim Tutarı', val: sym + fmt(teklifFiyati - indirimliF), color: 'var(--red)' },
    ].map(i => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:var(--surface2);border-radius:6px">
        <span style="font-size:12px;color:var(--muted)">${i.label}</span>
        <span class="font-mono font-bold" style="color:${i.color}">${i.val}</span>
      </div>`).join('');
  }

  const uyariEl = document.getElementById('indUyari');
  if (uyariEl) {
    if (indirimliKar < 0) {
      uyariEl.innerHTML = `<div style="background:rgba(239,68,68,.1);border:1px solid var(--red);border-radius:8px;padding:10px 14px;color:var(--red);font-size:13px">⛔ Bu indirim oranında zarar edilir. Minimum fiyat: ${sym}${fmt(toplamMaliyet)}</div>`;
    } else if (indirimliMarj < 10) {
      uyariEl.innerHTML = `<div style="background:rgba(245,158,11,.1);border:1px solid var(--yellow);border-radius:8px;padding:10px 14px;color:var(--yellow);font-size:13px">⚠️ Kar marjı kritik seviyede (%${indirimliMarj.toFixed(1)}). Dikkatli olunmalı.</div>`;
    } else {
      uyariEl.innerHTML = `<div style="background:rgba(34,197,94,.1);border:1px solid var(--green);border-radius:8px;padding:10px 14px;color:var(--green);font-size:13px">✅ Bu indirim oranı kabul edilebilir aralıkta (%${indirimliMarj.toFixed(1)} marj).</div>`;
    }
  }
}

// ── CSV / JSON EXPORT ─────────────────────────────
function exportCSV() {
  const paraBirimi = document.getElementById('paraBirimi').value;
  const projeAdi = document.getElementById('projeAdi').value || 'proje';
  const kdvOrani = parseFloat(document.getElementById('kdvOrani').value) / 100 || 0;

  let csv = 'sep=;\n';
  csv += `Proje;${projeAdi}\n`;
  csv += `Tarih;${document.getElementById('tarih').value}\n`;
  csv += `Para Birimi;${paraBirimi}\n\n`;
  csv += 'MALİYET KALEMLERİ\n';
  csv += 'Tip;Kalem Adı;Miktar;Birim;Birim Fiyat;Toplam;KDV Dahil Toplam\n';
  maliyetRows.forEach(r => {
    const net = rowTotalTL(r);
    const kdv = r.kdv ? net * kdvOrani : 0;
    csv += `${r.tip};${r.ad};${r.miktar};${r.birim};${r.birimFiyat.toFixed(2)};${net.toFixed(2)};${(net+kdv).toFixed(2)}\n`;
  });
  const toplamNet = maliyetRows.reduce((s, r) => s + rowTotalTL(r), 0);
  csv += `;;;;;;Toplam;${toplamNet.toFixed(2)}\n\n`;
  csv += 'GELİR KALEMLERİ\n';
  csv += 'Kalem Adı;Miktar;Birim;Birim Fiyat;Toplam\n';
  gelirRows.forEach(r => {
    csv += `${r.ad};${r.miktar};${r.birim};${r.birimFiyat.toFixed(2)};${(r.miktar*r.birimFiyat).toFixed(2)}\n`;
  });
  const teklifFiyati = parseFloat(document.getElementById('teklifFiyati').value) || 0;
  const toplamGelir = gelirRows.reduce((s,r) => s + r.miktar*r.birimFiyat, 0) || teklifFiyati;
  const netKar = toplamGelir - toplamNet;
  const karMarji = toplamGelir > 0 ? (netKar / toplamGelir) * 100 : 0;
  csv += `\nANALİZ SONUÇLARI\n`;
  csv += `Toplam Gelir;${toplamGelir.toFixed(2)}\n`;
  csv += `Toplam Maliyet;${toplamNet.toFixed(2)}\n`;
  csv += `Net Kar;${netKar.toFixed(2)}\n`;
  csv += `Kar Marjı (%);${karMarji.toFixed(2)}\n`;

  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'fizibilite_' + projeAdi.replace(/\s+/g,'_') + '_' + new Date().toISOString().split('T')[0] + '.csv';
  a.click();
  showToast('CSV dışa aktarıldı.', 'success');
}

function exportJSON() {
  saveLocal();
  const raw = localStorage.getItem('fizibilite_state') || '{}';
  const blob = new Blob([raw], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'fizibilite_' + (document.getElementById('projeAdi').value || 'proje').replace(/\s+/g,'_') + '_' + new Date().toISOString().split('T')[0] + '.json';
  a.click();
  showToast('JSON dışa aktarıldı.', 'success');
}

function importJSON() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.json')) {
      showToast('⚠️ Lütfen .json uzantılı dosya seçin.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const parsed = parseJSONSafe(ev.target.result);
        // Temel alan kontrolü
        if (!parsed.maliyetRows && !parsed.gelirRows && !parsed.projeAdi) {
          showToast('⚠️ Bu dosya fizibilite verisi içermiyor.', 'error');
          return;
        }
        localStorage.setItem('fizibilite_state', ev.target.result);
        maliyetRows = []; gelirRows = []; rowCounter = 0;
        loadLocal();
        renderMaliyetTable();
        renderGelirTable();
        calculate();
        showToast('JSON başarıyla yüklendi.', 'success');
      } catch(err) {
        showToast('⚠️ JSON yüklenemedi: ' + err.message, 'error');
      }
    };
    reader.onerror = () => showToast('⚠️ Dosya okunamadı.', 'error');
    reader.readAsText(file);
  };
  input.click();
}
