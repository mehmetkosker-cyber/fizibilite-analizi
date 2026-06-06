// ── VALİDASYON (#1 & #2) ──────────────────────────
function validateForm() {
  const errors = [];

  // Zorunlu alan: proje adı (uyarı, hata değil)
  if (!document.getElementById('projeAdi').value.trim()) {
    errors.push({ field: 'projeAdi', msg: 'Proje adı boş bırakıldı.' });
  }

  // Teklif fiyatı
  const teklifVal = document.getElementById('teklifFiyati').value;
  if (teklifVal !== '' && parseFloat(teklifVal) < 0) {
    errors.push({ field: 'teklifFiyati', msg: 'Teklif fiyatı negatif olamaz.' });
  }

  // Döviz kurları
  const kurUSD = parseFloat(document.getElementById('kurUSD').value);
  const kurEUR = parseFloat(document.getElementById('kurEUR').value);
  if (kurUSD <= 0 || isNaN(kurUSD)) {
    errors.push({ field: 'kurUSD', msg: 'USD kuru geçersiz.' });
  }
  if (kurEUR <= 0 || isNaN(kurEUR)) {
    errors.push({ field: 'kurEUR', msg: 'EUR kuru geçersiz.' });
  }

  // KDV oranı
  const kdv = parseFloat(document.getElementById('kdvOrani').value);
  if (kdv < 0 || kdv > 100 || isNaN(kdv)) {
    errors.push({ field: 'kdvOrani', msg: 'KDV oranı 0-100 arasında olmalı.' });
  }

  // Maliyet satırları
  maliyetRows.forEach((r, i) => {
    const no = i + 1;
    if (r.miktar < 0) {
      errors.push({ msg: `Maliyet ${no}. satır: Miktar negatif olamaz.` });
    }
    if (r.birimFiyat < 0) {
      errors.push({ msg: `Maliyet ${no}. satır: Birim fiyat negatif olamaz.` });
    }
  });

  // Gelir satırları
  gelirRows.forEach((r, i) => {
    const no = i + 1;
    if (r.miktar < 0) {
      errors.push({ msg: `Gelir ${no}. satır: Miktar negatif olamaz.` });
    }
    if (r.birimFiyat < 0) {
      errors.push({ msg: `Gelir ${no}. satır: Birim fiyat negatif olamaz.` });
    }
  });

  return errors;
}

function applyValidationUI(errors) {
  // Önce tüm error state'lerini temizle
  document.querySelectorAll('.field-error').forEach(el => el.classList.remove('field-error'));

  if (errors.length === 0) return true;

  const criticals = errors.filter(e => e.field && e.field !== 'projeAdi');
  const warnings  = errors.filter(e => !e.field || e.field === 'projeAdi');

  // Field highlight
  errors.filter(e => e.field).forEach(e => {
    const el = document.getElementById(e.field);
    if (el) el.classList.add('field-error');
  });

  // Sadece uyarılar varsa devam et ama bildir
  if (criticals.length === 0 && warnings.length > 0) {
    showToast('⚠️ ' + warnings.map(e => e.msg).join(' | '), 'info');
    return true; // uyarı — hesaplamayı durdurma
  }

  // Kritik hatalar varsa hesaplamayı durdur
  const allMsgs = errors.map(e => e.msg).join('\n• ');
  showToast('⛔ Hata:\n• ' + allMsgs, 'error');
  return false;
}

function parseCSVSafe(text) {
  if (!text || !text.trim()) {
    throw new Error('Dosya boş.');
  }
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length < 2) {
    throw new Error('CSV en az başlık + 1 veri satırı içermeli.');
  }
  return lines;
}

function parseJSONSafe(text) {
  if (!text || !text.trim()) {
    throw new Error('Dosya boş.');
  }
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    throw new Error('JSON formatı geçersiz: ' + e.message);
  }
  if (typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Beklenmedik JSON yapısı.');
  }
  return parsed;
}
