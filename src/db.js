// ── SUPABASE CLIENT ───────────────────────────────
const SUPABASE_URL = 'https://qsflehlfhqblkgofffoe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFzZmxlaGxmaHFibGtnb2ZmZm9lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyNDU1MDMsImV4cCI6MjA5MTgyMTUwM30.yU7wlIiGkfXX8iDyUBjknkzuTUBrrC75Zwcaez9VgiU';

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function getDeviceId() {
  let id = localStorage.getItem('fiz_device_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('fiz_device_id', id);
  }
  return id;
}
