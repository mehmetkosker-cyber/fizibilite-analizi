// ── GLOBAL STATE ──────────────────────────────────
let maliyetRows = [];
let gelirRows = [];
let rowCounter = 0;
let chartMaliyet = null, chartKarlilik = null, chartSenaryo = null, chartDuyarlilik = null;

const TIP_LABELS = { malzeme: '📦 Malzeme', iscilik: '👷 İşçilik', gider: '🏢 Genel Gider' };
const TIP_COLORS = { malzeme: '#4f7dff', iscilik: '#22c55e', gider: '#f59e0b' };

// Katalog state
let urunler = [];
let urunCounter = 0;
let katalogSiralaKey = 'ad';
let katalogSiralaDuz = true;

const TIP_RENKLER = { malzeme: 'var(--accent)', hizmet: 'var(--cyan)', urun: 'var(--green)', diger: 'var(--muted)' };
const TIP_ETIKET  = { malzeme: '📦 Malzeme', hizmet: '🛠 Hizmet', urun: '🏷 Ürün', diger: '📎 Diğer' };

// Rakip state
let rakipRows = [];
let rakipCounter = 0;

// Simülatör state
let _simMaliyet = 0;

// Waterfall & Nakit chart refs
let chartWaterfall = null;
let chartNakit = null;
