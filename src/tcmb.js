// ── DÖVİZ KURU OTOMATİK ÇEKME ────────────────────
// Free API: @fawazahmed0/currency-api via jsDelivr CDN

async function kurGuncelle() {
  const btn = document.getElementById('kurGuncelleBtn');
  const lbl = document.getElementById('kurGuncelleTarih');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Yükleniyor...'; }
  if (lbl) lbl.textContent = '';

  try {
    const [usdRes, eurRes] = await Promise.all([
      fetch('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json'),
      fetch('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/eur.json')
    ]);

    if (!usdRes.ok || !eurRes.ok) throw new Error('API yanıt vermedi');

    const usdData = await usdRes.json();
    const eurData = await eurRes.json();

    const usdTry = usdData?.usd?.try;
    const eurTry = eurData?.eur?.try;

    if (!usdTry || !eurTry) throw new Error('Kur verisi alınamadı');

    const inpUSD = document.getElementById('kurUSD');
    const inpEUR = document.getElementById('kurEUR');
    if (inpUSD) inpUSD.value = usdTry.toFixed(2);
    if (inpEUR) inpEUR.value = eurTry.toFixed(2);

    const tarih = usdData.date
      ? new Date(usdData.date).toLocaleDateString('tr-TR')
      : new Date().toLocaleDateString('tr-TR');

    if (lbl) lbl.textContent = `Son güncelleme: ${tarih}  •  $1 = ₺${usdTry.toFixed(2)}  |  €1 = ₺${eurTry.toFixed(2)}`;

    calculate();

    if (btn) {
      btn.disabled = false;
      btn.textContent = '✅ Güncellendi';
      setTimeout(() => { if (btn) btn.textContent = '🔄 Kuru Güncelle'; }, 2500);
    }
  } catch (e) {
    if (btn) {
      btn.disabled = false;
      btn.textContent = '❌ Hata — Tekrar Dene';
      setTimeout(() => { if (btn) btn.textContent = '🔄 Kuru Güncelle'; }, 3500);
    }
    if (lbl) lbl.textContent = 'Kur çekme başarısız: ' + e.message;
  }
}
