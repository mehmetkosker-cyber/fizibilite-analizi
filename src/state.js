// ── GLOBAL STATE ──────────────────────────────────
let maliyetRows = [];
let gelirRows = [];
let rowCounter = 0;
let chartMaliyet = null, chartKarlilik = null, chartSenaryo = null, chartDuyarlilik = null;

const TIP_LABELS = { malzeme: '📦 Malzeme', iscilik: '👷 İşçilik', gider: '🏢 Genel Gider', ekipman: '🖥️ Ekipman' };
const TIP_COLORS = { malzeme: '#4f7dff', iscilik: '#22c55e', gider: '#f59e0b', ekipman: '#7c5cfc' };

// Katalog state
let urunler = [];
let urunCounter = 0;

// Rakip state
let rakipRows = [];
let rakipCounter = 0;

// Simülatör state
let _simMaliyet = 0;

// Waterfall & Nakit chart refs
let chartWaterfall = null;
let chartNakit = null;

// Ekipman / Cihaz state
let ekipmanRows = [];
let ekipmanCounter = 0;

// Dashboard chart
let dashChartMaliyet = null;

// Monte Carlo & BEP için son hesaplama değerleri
let _lastGelir   = 0;
let _lastMaliyet = 0;
let _lastSym     = '₺';
