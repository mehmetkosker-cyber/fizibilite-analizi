// ── UTILS ─────────────────────────────────────────
function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;').replace(/"/g, '&quot;')
    .replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function fmt(n) {
  return (parseFloat(n) || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function marjColor(m) {
  return m < 0 ? 'text-red' : m < 10 ? 'text-red' : m < 20 ? 'text-yellow' : 'text-green';
}

function setKPI(id, val, cls) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = val;
  el.className = 'kpi-value ' + cls;
}

function getKur(doviz) {
  if (doviz === 'USD') return parseFloat(document.getElementById('kurUSD').value) || 1;
  if (doviz === 'EUR') return parseFloat(document.getElementById('kurEUR').value) || 1;
  return 1;
}

function showToast(msg, type = 'info') {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    t.style.cssText = 'position:fixed;bottom:24px;right:24px;padding:10px 18px;border-radius:8px;font-size:13px;font-weight:500;z-index:2000;opacity:0;transition:opacity .3s;pointer-events:none;max-width:420px;line-height:1.5';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.color = '#fff';
  t.style.background = type === 'error' ? 'var(--red)' : type === 'success' ? 'var(--green)' : 'var(--accent)';
  t.style.opacity = '1';
  clearTimeout(t._timer);
  const duration = type === 'error' ? 4000 : 2200;
  t._timer = setTimeout(() => { t.style.opacity = '0'; }, duration);
}
