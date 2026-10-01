const cfg = window.SOMNEA_CONFIG || {};
const fmt = n => new Intl.NumberFormat('tr-TR').format(n);
const qs = s => document.querySelector(s);
const qsa = s => [...document.querySelectorAll(s)];

const io = new IntersectionObserver(entries => entries.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
}), { threshold: .08 });
qsa('.reveal').forEach(el => io.observe(el));

if (qs('#instagramLink')) qs('#instagramLink').href = cfg.instagramUrl || '#';
if (qs('#facebookLink')) qs('#facebookLink').href = cfg.facebookUrl || '#';

const packages = {
  single: { label: '1 Adet SOMNEA', short: '1’li paket', total: 699, saving: 0, quantity: 1 },
  duo: { label: '2 Adet SOMNEA', short: '2’li paket', total: 1298, saving: (699 * 2) - 1298, quantity: 2 },
  bundle: { label: '3 Adet SOMNEA', short: '3’lü paket', total: 1799, saving: (699 * 3) - 1799, quantity: 3 }
};
let selected = 'bundle';

function syncPackage(key) {
  if (!packages[key]) return;
  selected = key;
  const p = packages[key];
  qsa('.package-card').forEach(card => {
    const active = card.dataset.package === key;
    card.classList.toggle('selected', active);
    card.setAttribute('aria-checked', active ? 'true' : 'false');
    const label = card.querySelector('.select-label');
    if (label) label.textContent = active ? 'Seçili' : 'Seç';
  });
  if (qs('#summaryPackage')) qs('#summaryPackage').textContent = p.label;
  if (qs('#summaryTotal')) qs('#summaryTotal').textContent = `${fmt(p.total)} TL`;
  if (qs('#summarySaving')) qs('#summarySaving').textContent = p.saving ? `Tekli alıma göre ${fmt(p.saving)} TL avantaj` : 'Tekli deneme paketi';
  if (qs('#formPackage')) qs('#formPackage').value = p.label;
  if (qs('#formTotal')) qs('#formTotal').value = `${p.total} TL`;
  if (qs('#stickyPackage')) qs('#stickyPackage').textContent = p.short;
  if (qs('#stickyPrice')) qs('#stickyPrice').textContent = `${fmt(p.total)} TL`;
  if (qs('#packageActionLabel')) qs('#packageActionLabel').textContent = `${p.label} · ${fmt(p.total)} TL`;
}
qsa('.package-card').forEach(card => card.addEventListener('click', () => syncPackage(card.dataset.package)));
syncPackage('bundle');

qsa('.js-package-link').forEach(link => link.addEventListener('click', () => setTimeout(() => qs('#packages')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 10)));
qs('#continueToOrder')?.addEventListener('click', () => qs('#order')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));

function updateTimer() {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  let diff = Math.max(0, end - now);
  const h = Math.floor(diff / 3600000);
  diff %= 3600000;
  const m = Math.floor(diff / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  if (qs('#dealTimer')) qs('#dealTimer').textContent = [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
}
updateTimer();
setInterval(updateTimer, 1000);

let allReviews = [];
let reviewsExpanded = false;
function renderReviews() {
  const grid = qs('#reviewGrid');
  if (!grid) return;
  const visible = reviewsExpanded ? allReviews : allReviews.slice(0, 3);
  grid.innerHTML = visible.map(r => `
    <article class="review-card">
      <div class="review-head"><strong>${r.name}</strong><span class="stars">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</span></div>
      <p>${r.text}</p>
      ${r.image ? `<img class="review-photo" src="${r.image}" alt="${r.name} müşteri değerlendirmesi" onerror="this.remove()">` : ''}
    </article>`).join('');
  const btn = qs('#toggleReviews');
  if (btn) {
    btn.hidden = allReviews.length <= 3;
    btn.textContent = reviewsExpanded ? 'Daha az göster' : `Tüm ${allReviews.length} yorumu gör`;
  }
}

async function loadReviews() {
  try {
    const res = await fetch('data/reviews.json');
    const data = await res.json();
    allReviews = (data.reviews || []).filter(x => x.published === true);
    if (!allReviews.length) { qs('#reviews')?.remove(); return; }
    const avg = allReviews.reduce((a, b) => a + b.rating, 0) / allReviews.length;
    if (qs('#ratingNumber')) qs('#ratingNumber').textContent = avg.toFixed(1).replace('.', ',');
    if (qs('#ratingCount')) qs('#ratingCount').textContent = `${allReviews.length} müşteri değerlendirmesi`;
    const chip = qs('#heroReviewChip');
    if (chip) { chip.hidden = false; chip.querySelector('strong').textContent = `${avg.toFixed(1).replace('.', ',')}/5 · ${allReviews.length} değerlendirme`; }
    renderReviews();
  } catch (e) { console.warn('reviews', e); }
}
qs('#toggleReviews')?.addEventListener('click', () => { reviewsExpanded = !reviewsExpanded; renderReviews(); });
loadReviews();

async function loadUGC() {
  try {
    const res = await fetch('data/ugc.json');
    const data = await res.json();
    const items = (data.items || []).filter(x => x.published === true);
    if (!items.length) { qs('#ugc')?.remove(); return; }
    qs('#ugcGrid').innerHTML = items.map(i => `<article class="ugc-card"><img src="${i.image}" alt="SOMNEA gece ritüeli"><div class="ugc-overlay"><strong>${i.caption || ''}</strong></div></article>`).join('');
  } catch (e) { console.warn('ugc', e); }
}
loadUGC();

qsa('[data-carousel="ugc"]').forEach(btn => btn.addEventListener('click', () => {
  const track = qs('#ugcGrid');
  if (!track) return;
  track.scrollBy({ left: (btn.classList.contains('next') ? 1 : -1) * Math.min(320, track.clientWidth * .82), behavior: 'smooth' });
}));

const city = qs('#citySelect'), district = qs('#districtSelect'), neighborhood = qs('#neighborhoodSelect');
let locationTree = {};
function normalizeLocations(raw) {
  if (Array.isArray(raw)) {
    const out = {};
    raw.forEach(p => {
      const pn = p.il_adi || p.name; if (!pn) return; out[pn] = {};
      (p.ilceler || []).forEach(d => { out[pn][d.ilce_adi || d.name] = (d.mahalleler || []).map(m => typeof m === 'string' ? m : (m.mahalle_adi || m.name)).filter(Boolean); });
    });
    return out;
  }
  const out = {};
  Object.entries(raw || {}).forEach(([p, v]) => {
    if (p.startsWith('_')) return;
    if (v?.ilceler) { out[p] = {}; Object.entries(v.ilceler).forEach(([d, ms]) => out[p][d] = Array.isArray(ms) ? ms : []); }
    else if (v && typeof v === 'object') out[p] = v;
  });
  return out;
}
function populateCities() {
  if (!city) return;
  city.innerHTML = '<option value="">İl seçin</option>' + Object.keys(locationTree).sort((a,b) => a.localeCompare(b,'tr')).map(x => `<option>${x}</option>`).join('');
}
async function loadLocations() {
  try {
    const r = await fetch('data/turkey_locations.json');
    locationTree = normalizeLocations(await r.json());
    if (Object.keys(locationTree).length < 20 && cfg.remoteLocationFallback) {
      try { const rr = await fetch(cfg.remoteLocationFallback); if (rr.ok) { const full = normalizeLocations(await rr.json()); if (Object.keys(full).length > 20) locationTree = full; } } catch (_) {}
    }
    populateCities();
  } catch (e) { console.warn('locations', e); }
}
city?.addEventListener('change', () => {
  const ds = Object.keys(locationTree[city.value] || {}).sort((a,b) => a.localeCompare(b,'tr'));
  district.innerHTML = '<option value="">İlçe seçin</option>' + ds.map(x => `<option>${x}</option>`).join('');
  district.disabled = !ds.length;
  neighborhood.innerHTML = '<option value="">Mahalle seçin</option>';
  neighborhood.disabled = true;
});
district?.addEventListener('change', () => {
  const ns = (locationTree[city.value]?.[district.value] || []).sort((a,b) => a.localeCompare(b,'tr'));
  neighborhood.innerHTML = '<option value="">Mahalle seçin</option>' + ns.map(x => `<option>${x}</option>`).join('');
  neighborhood.disabled = !ns.length;
});
loadLocations();

const phone = qs('input[name="telefon"]');
phone?.addEventListener('input', () => phone.value = phone.value.replace(/[^0-9+ ]/g, '').slice(0, 16));

const ORDER_API_URL = 'https://somnea-order-api.webliodijital.workers.dev/';
const orderForm = qs('#orderForm');
const orderMessage = qs('#orderMessage');
function showOrderMessage(message, type = 'success') {
  if (!orderMessage) return;
  orderMessage.hidden = false;
  orderMessage.textContent = message;
  orderMessage.style.cssText = `margin-top:6px;padding:13px 14px;border-radius:12px;font-weight:700;line-height:1.45;background:${type === 'success' ? '#eef9f1' : '#fff1f1'};border:1px solid ${type === 'success' ? '#b9e3c3' : '#efc2c2'};color:${type === 'success' ? '#17652e' : '#9a2727'}`;
}
function splitName(fullName) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { firstName: parts[0] || '', lastName: '-' };
  return { firstName: parts.slice(0, -1).join(' '), lastName: parts.at(-1) };
}
if (orderForm) {
  orderForm.addEventListener('submit', async event => {
    event.preventDefault();
    if (!orderForm.reportValidity()) return;
    const honeypot = orderForm.querySelector('[name="bot-field"]');
    if (honeypot?.value.trim()) return;
    const submitButton = orderForm.querySelector('button[type="submit"]');
    const originalText = submitButton?.textContent || '';
    const fd = new FormData(orderForm);
    const p = packages[selected];
    const names = splitName(String(fd.get('adsoyad') || ''));
    const payload = {
      firstName: names.firstName,
      lastName: names.lastName,
      phone: String(fd.get('telefon') || '').trim(),
      province: String(fd.get('il') || '').trim(),
      district: String(fd.get('ilce') || '').trim(),
      neighborhood: String(fd.get('mahalle') || '').trim(),
      address: String(fd.get('adres') || '').trim(),
      paymentMethod: String(fd.get('odeme') || '').trim(),
      packageName: p.label,
      packagePrice: `${fmt(p.total)} TL`,
      quantity: p.quantity
    };
    try {
      if (submitButton) { submitButton.disabled = true; submitButton.textContent = 'Siparişiniz gönderiliyor...'; }
      if (orderMessage) orderMessage.hidden = true;
      const response = await fetch(ORDER_API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      let result = {};
      try { result = await response.json(); } catch (_) {}
      if (!response.ok || result.ok !== true) throw new Error(result.error || 'Sipariş gönderilemedi.');
      showOrderMessage('✅ Sipariş kaydınız alındı. En kısa sürede sizinle iletişime geçeceğiz.', 'success');
      if (typeof window.fbq === 'function') {
        window.fbq('track', 'Lead', { value: Number(p.total), currency: 'TRY', content_name: p.label, content_type: 'product', num_items: p.quantity });
      }
      orderForm.reset();
      if (district) { district.innerHTML = '<option value="">İlçe seçin</option>'; district.disabled = true; }
      if (neighborhood) { neighborhood.innerHTML = '<option value="">Mahalle seçin</option>'; neighborhood.disabled = true; }
      orderMessage?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch (error) {
      console.error('Order submit error:', error);
      showOrderMessage('Sipariş şu anda gönderilemedi. Lütfen bilgilerinizi kontrol edip tekrar deneyin.', 'error');
    } finally {
      if (submitButton) { submitButton.disabled = false; submitButton.textContent = originalText; }
    }
  });
}
