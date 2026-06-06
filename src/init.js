// ── INIT & NAVIGATION ─────────────────────────────
function showTab(id, btnEl) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + id).classList.add('active');
  const btn = btnEl || (event && event.target);
  if (btn) btn.classList.add('active');
  if (id === 'katalog') renderKatalog();
  else if (id !== 'veri') calculate();
}

window.addEventListener('load', () => {
  document.getElementById('tarih').value = new Date().toISOString().split('T')[0];
  addRow('malzeme');
  addRow('iscilik');
  addRow('gider');
  addGelirRow();
  addRakip();
  loadLocal();
  calculate();
});

window.addEventListener('beforeunload', saveLocalImmediate);
