// ── INIT & NAVIGATION ─────────────────────────────
function showTab(id) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  const panel = document.getElementById('tab-' + id);
  if (panel) panel.classList.add('active');
  // Find matching tab button via onclick attribute
  document.querySelectorAll('.tab-btn').forEach(b => {
    const oc = b.getAttribute('onclick') || '';
    if (oc.includes("'" + id + "'") || oc.includes('"' + id + '"')) b.classList.add('active');
  });
  if (id === 'katalog') renderKatalog();
  else if (id !== 'veri') calculate();
}

function toggleTema() {
  const isLight = document.body.classList.toggle('light-mode');
  const btn = document.getElementById('temaBtn');
  if (btn) btn.textContent = isLight ? '☀️' : '🌙';
  localStorage.setItem('fizibilite_tema', isLight ? 'light' : 'dark');
}

window.addEventListener('load', () => {
  document.getElementById('tarih').value = new Date().toISOString().split('T')[0];
  addRow('malzeme');
  addRow('iscilik');
  addRow('gider');
  addGelirRow();
  addRakip();
  const savedTema = localStorage.getItem('fizibilite_tema');
  if (savedTema === 'light') {
    document.body.classList.add('light-mode');
    const tBtn = document.getElementById('temaBtn');
    if (tBtn) tBtn.textContent = '☀️';
  }
  loadLocal();
  calculate();
  setupSpreadsheetBehavior();
});

window.addEventListener('beforeunload', saveLocalImmediate);
