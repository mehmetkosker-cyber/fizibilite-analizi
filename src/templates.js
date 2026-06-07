// ── ŞABLONLAR ─────────────────────────────────────
const TEMPLATES = {
  insaat: {
    ad: 'İnşaat / İhale Projesi',
    rows: [
      { tip: 'malzeme', ad: 'Çimento / Beton', miktar: 100, birim: 'Ton', birimFiyat: 3500 },
      { tip: 'malzeme', ad: 'Demir / Donatı', miktar: 50, birim: 'Ton', birimFiyat: 28000 },
      { tip: 'malzeme', ad: 'Kum / Mıcır', miktar: 200, birim: 'Ton', birimFiyat: 450 },
      { tip: 'iscilik', ad: 'Ustabaşı', miktar: 200, birim: 'Saat', birimFiyat: 350 },
      { tip: 'iscilik', ad: 'İşçi', miktar: 800, birim: 'Saat', birimFiyat: 180 },
      { tip: 'gider', ad: 'İş Makinesi Kirası', miktar: 30, birim: 'Gün', birimFiyat: 5000 },
      { tip: 'gider', ad: 'Nakliye', miktar: 1, birim: 'Götürü', birimFiyat: 25000 },
    ]
  },
  it: {
    ad: 'IT / Yazılım Projesi',
    rows: [
      { tip: 'iscilik', ad: 'Kıdemli Geliştirici', miktar: 320, birim: 'Saat', birimFiyat: 1200 },
      { tip: 'iscilik', ad: 'Orta Seviye Geliştirici', miktar: 480, birim: 'Saat', birimFiyat: 700 },
      { tip: 'iscilik', ad: 'UI/UX Tasarımcı', miktar: 120, birim: 'Saat', birimFiyat: 800 },
      { tip: 'iscilik', ad: 'Test Mühendisi', miktar: 160, birim: 'Saat', birimFiyat: 500 },
      { tip: 'malzeme', ad: 'Yazılım Lisansları', miktar: 1, birim: 'Paket', birimFiyat: 50000 },
      { tip: 'gider', ad: 'Sunucu / Hosting (1 yıl)', miktar: 12, birim: 'Ay', birimFiyat: 8000 },
      { tip: 'gider', ad: 'Proje Yönetimi', miktar: 1, birim: 'Götürü', birimFiyat: 40000 },
    ]
  },
  danismanlik: {
    ad: 'Danışmanlık / Hizmet',
    rows: [
      { tip: 'iscilik', ad: 'Kıdemli Danışman', miktar: 160, birim: 'Saat', birimFiyat: 2500 },
      { tip: 'iscilik', ad: 'Uzman', miktar: 240, birim: 'Saat', birimFiyat: 1500 },
      { tip: 'iscilik', ad: 'Analist', miktar: 200, birim: 'Saat', birimFiyat: 800 },
      { tip: 'gider', ad: 'Seyahat / Konaklama', miktar: 1, birim: 'Götürü', birimFiyat: 20000 },
      { tip: 'gider', ad: 'Rapor / Doküman Hazırlama', miktar: 1, birim: 'Götürü', birimFiyat: 15000 },
    ]
  },
  nakliye: {
    ad: 'Nakliye / Lojistik',
    rows: [
      { tip: 'malzeme', ad: 'Yakıt', miktar: 2000, birim: 'Litre', birimFiyat: 52 },
      { tip: 'iscilik', ad: 'Şoför', miktar: 20, birim: 'Gün', birimFiyat: 2000 },
      { tip: 'iscilik', ad: 'Yardımcı Personel', miktar: 20, birim: 'Gün', birimFiyat: 1200 },
      { tip: 'gider', ad: 'Araç Amortismanı', miktar: 20, birim: 'Gün', birimFiyat: 3000 },
      { tip: 'gider', ad: 'Sigorta / Ruhsat', miktar: 1, birim: 'Götürü', birimFiyat: 8000 },
      { tip: 'gider', ad: 'Yükleme / Boşaltma', miktar: 1, birim: 'Götürü', birimFiyat: 5000 },
    ]
  },
  temizlik: {
    ad: 'Temizlik / Bakım Hizmeti',
    rows: [
      { tip: 'iscilik', ad: 'Temizlik Personeli', miktar: 22, birim: 'Gün', birimFiyat: 800 },
      { tip: 'malzeme', ad: 'Temizlik Malzemesi', miktar: 1, birim: 'Ay', birimFiyat: 3000 },
      { tip: 'malzeme', ad: 'Ekipman / Makine', miktar: 1, birim: 'Ay', birimFiyat: 2000 },
      { tip: 'gider', ad: 'Ulaşım', miktar: 22, birim: 'Gün', birimFiyat: 200 },
      { tip: 'gider', ad: 'Yönetim Gideri', miktar: 1, birim: 'Ay', birimFiyat: 2500 },
    ]
  },
  imalat: {
    ad: 'İmalat / Üretim',
    rows: [
      { tip: 'malzeme', ad: 'Hammadde A', miktar: 500, birim: 'kg', birimFiyat: 150 },
      { tip: 'malzeme', ad: 'Hammadde B', miktar: 200, birim: 'kg', birimFiyat: 380 },
      { tip: 'malzeme', ad: 'Ambalaj Malzemesi', miktar: 1000, birim: 'Adet', birimFiyat: 12 },
      { tip: 'iscilik', ad: 'Üretim İşçisi', miktar: 480, birim: 'Saat', birimFiyat: 200 },
      { tip: 'iscilik', ad: 'Kalite Kontrol', miktar: 80, birim: 'Saat', birimFiyat: 350 },
      { tip: 'gider', ad: 'Enerji / Elektrik', miktar: 1, birim: 'Dönem', birimFiyat: 20000 },
      { tip: 'gider', ad: 'Makine Bakım', miktar: 1, birim: 'Dönem', birimFiyat: 8000 },
    ]
  }
};

function loadTemplate(key) {
  const tpl = TEMPLATES[key];
  if (!tpl) return;
  if (!confirm(`"${tpl.ad}" şablonu yüklensin mi? Mevcut maliyet kalemleri silinecek.`)) return;
  maliyetRows = tpl.rows.map(r => ({ ...r, id: ++rowCounter, kdv: true, doviz: r.doviz || 'TL' }));
  document.getElementById('projeAdi').value = tpl.ad;
  renderMaliyetTable();
  calculate();
}
