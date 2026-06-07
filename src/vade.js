// ── VADE & NAKİT YÜK ANALİZİ ─────────────────────
// Tahsilat vadesi, ödeme vadesi, finansman maliyeti, kur riski ve vergi yükleri

function renderVadeAnalizi(toplamGelir, toplamMaliyet, toplamKdv, netKar, sym) {
  const el = document.getElementById('vadeSonuclar');
  if (!el) return;

  const aktif = document.getElementById('vadeAktif')?.checked;
  const girdiEl = document.getElementById('vadeGirdiler');
  if (girdiEl) girdiEl.style.display = aktif ? '' : 'none';

  if (!aktif) {
    el.innerHTML = `<p style="color:var(--muted);font-size:13px;text-align:center;padding:20px">
      Analizi aktif etmek için yukarıdaki kutucuğu işaretleyin.</p>`;
    return;
  }

  const tahsilatVadeAy = parseInt(document.getElementById('tahsilatVadeAy')?.value) || 3;
  const odemeVadeAy    = parseInt(document.getElementById('odemeVadeAy')?.value)    || 0;
  const finansmanOrani = parseFloat(document.getElementById('vadeFinansmanOrani')?.value) || 30;
  const kurArtisOrani  = parseFloat(document.getElementById('vadeKurArtis')?.value)  || 20;
  const kdvBeyanDonem  = document.getElementById('kdvBeyanDonem')?.value || 'aylik';
  const kvOrani        = parseFloat(document.getElementById('kvOrani')?.value) || 25;
  const kdvBeyanGun    = kdvBeyanDonem === 'ucaylik' ? 90 : 30;

  // Dövizli maliyet toplam TL değeri (kur riskine konu olan tutar)
  const kurUSD = parseFloat(document.getElementById('kurUSD')?.value) || 38;
  const kurEUR = parseFloat(document.getElementById('kurEUR')?.value) || 41;
  let dovizTL = 0;
  maliyetRows.forEach(r => {
    if (r.doviz === 'USD') dovizTL += r.miktar * r.birimFiyat * kurUSD;
    else if (r.doviz === 'EUR') dovizTL += r.miktar * r.birimFiyat * kurEUR;
  });
  ekipmanRows.forEach(e => {
    if (e.doviz === 'USD') dovizTL += e.adet * e.birimFiyat * kurUSD;
    else if (e.doviz === 'EUR') dovizTL += e.adet * e.birimFiyat * kurEUR;
  });

  // Vergi tabanı
  const vergi = netKar > 0 ? netKar * (kvOrani / 100) : 0;

  // Her ay için hesap satırı
  const calcRow = (ay) => {
    const tahsilatGun = ay * 30;
    const odemeGun    = odemeVadeAy * 30;
    const netVadeGun  = Math.max(0, tahsilatGun - odemeGun);

    // Finansman maliyeti: peşin ödenen maliyet × yıllık faiz × vade
    const fm = toplamMaliyet * (finansmanOrani / 100) * (netVadeGun / 365);

    // KDV finansman etkisi: KDV beyan gününden tahsilata kadar geçen süre
    const kdvVadeGun = Math.max(0, tahsilatGun - kdvBeyanGun);
    const kdvFm = toplamKdv * (finansmanOrani / 100) * (kdvVadeGun / 365);

    // Kur kaybı: dövizli maliyet kalemleri vade boyunca kur artışına maruz
    const kurKayip = dovizTL * (kurArtisOrani / 100) * (netVadeGun / 365);

    // Vergi finansman etkisi: Geçici vergi ~120 gün sonra ödenir varsayımı
    const vergiVadeGun = Math.max(0, tahsilatGun - 120);
    const vergiFm = vergi * (finansmanOrani / 100) * (vergiVadeGun / 365);

    const toplam = fm + kdvFm + kurKayip + vergiFm;
    const duzKar = netKar - toplam;
    const duzMarj = toplamGelir > 0 ? (duzKar / toplamGelir) * 100 : 0;

    return { ay, fm, kdvFm, kurKayip, vergiFm, toplam, duzKar, duzMarj, netVadeGun };
  };

  const satirlar = Array.from({ length: 12 }, (_, i) => calcRow(i + 1));
  const secili   = satirlar[tahsilatVadeAy - 1];
  const bazMarj  = toplamGelir > 0 ? ((netKar / toplamGelir) * 100).toFixed(1) : '0.0';

  el.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:18px">
      <div class="kpi">
        <div class="kpi-label">Finansman Yükü</div>
        <div class="kpi-value text-red font-mono">${sym}${fmt(secili.fm)}</div>
        <div class="kpi-sub">%${finansmanOrani}/yıl × ${secili.netVadeGun} gün</div>
      </div>
      <div class="kpi">
        <div class="kpi-label">KDV Finansman Etkisi</div>
        <div class="kpi-value text-yellow font-mono">${sym}${fmt(secili.kdvFm)}</div>
        <div class="kpi-sub">${kdvBeyanDonem === 'aylik' ? 'Aylık' : '3 Aylık'} beyan — tahsilat farkı</div>
      </div>
      <div class="kpi">
        <div class="kpi-label">Kur Riski Kaybı</div>
        <div class="kpi-value text-red font-mono">${sym}${fmt(secili.kurKayip)}</div>
        <div class="kpi-sub">%${kurArtisOrani}/yıl × ${sym}${fmt(dovizTL)} dövizli</div>
      </div>
      <div class="kpi" style="border-color:${secili.duzKar >= 0 ? 'var(--green)' : 'var(--red)'}">
        <div class="kpi-label">Düzeltilmiş Net Kâr</div>
        <div class="kpi-value font-mono ${secili.duzKar >= 0 ? 'text-green' : 'text-red'}">${sym}${fmt(secili.duzKar)}</div>
        <div class="kpi-sub">Marj: ${secili.duzMarj.toFixed(1)}% → baz: ${bazMarj}%</div>
      </div>
    </div>

    <div style="overflow-x:auto">
      <table class="data-table">
        <thead>
          <tr>
            <th>Tahsilat Vadesi</th>
            <th>Net Vade</th>
            <th class="text-right">Fin. Yükü</th>
            <th class="text-right">KDV Etkisi</th>
            <th class="text-right">Kur Kaybı</th>
            <th class="text-right">Vergi Etkisi</th>
            <th class="text-right">Toplam Yük</th>
            <th class="text-right">Düz. Kâr</th>
            <th class="text-right">Düz. Marj</th>
          </tr>
        </thead>
        <tbody>
          ${satirlar.map(s => {
            const isSelected = s.ay === tahsilatVadeAy;
            const c = s.duzKar >= 0 ? 'var(--green)' : 'var(--red)';
            return `<tr style="${isSelected ? 'background:rgba(79,125,255,.08)' : ''}">
              <td style="font-weight:${isSelected ? '700' : '400'}">${s.ay} Ay${isSelected ? ' ◀' : ''}</td>
              <td style="color:var(--muted)">${s.netVadeGun} gün</td>
              <td class="text-right font-mono" style="color:var(--red)">${sym}${fmt(s.fm)}</td>
              <td class="text-right font-mono" style="color:var(--yellow)">${sym}${fmt(s.kdvFm)}</td>
              <td class="text-right font-mono" style="color:var(--red)">${sym}${fmt(s.kurKayip)}</td>
              <td class="text-right font-mono" style="color:var(--yellow)">${sym}${fmt(s.vergiFm)}</td>
              <td class="text-right font-mono font-bold" style="color:var(--red)">${sym}${fmt(s.toplam)}</td>
              <td class="text-right font-mono font-bold" style="color:${c}">${sym}${fmt(s.duzKar)}</td>
              <td class="text-right font-mono" style="color:${c}">${s.duzMarj.toFixed(1)}%</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>

    <div style="font-size:11px;color:var(--muted);margin-top:10px;line-height:1.7;background:var(--surface2);padding:10px 14px;border-radius:6px">
      <strong>Finansman yükü:</strong> Maliyet peşin ödenir, tahsilat gecikirse aradaki süre kredi/fırsat maliyeti doğurur. &nbsp;
      <strong>KDV etkisi:</strong> KDV beyan günü ile tahsilat arasındaki vade farkının finansman maliyeti. &nbsp;
      <strong>Kur kaybı:</strong> ${dovizTL > 0 ? `${sym}${fmt(dovizTL)} dövizli maliyet` : 'Dövizli maliyet yok'} — vade boyunca kur artışından kaynaklanan ek yük. &nbsp;
      <strong>Vergi etkisi:</strong> Geçici vergi ödeme zamanı (varsayılan: 4. ay) ile tahsilat farkının finansman maliyeti.
    </div>`;
}
