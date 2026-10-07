const cfg = window.SOMNEA_CONFIG || {};
const qs = (s, root = document) => root.querySelector(s);
const qsa = (s, root = document) => [...root.querySelectorAll(s)];
const fmt = (n) => new Intl.NumberFormat('tr-TR').format(n);
function displayInitials(name = '') {
  return name.trim().split(/\s+/).filter(Boolean).map(part => `${part.charAt(0).toLocaleUpperCase('tr-TR')}.`).join(' ');
}

const packages = {
  single: { label: '1 Adet SOMNEA', short: '1’li paket', total: cfg.prices?.single || 699, old: 699, saving: 0, quantity: 1 },
  double: { label: '2 Adet SOMNEA', short: '2’li paket', total: cfg.prices?.double || 1299, old: 1398, saving: 99, quantity: 2 },
  triple: { label: '3 Adet SOMNEA', short: '3’lü paket', total: cfg.prices?.triple || 1799, old: 2097, saving: 298, quantity: 3 }
};

let selectedPackageKey = 'triple';
let locationTree = {};
let reviewData = [];

// reveal animation
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.08 });
qsa('.reveal').forEach((el) => observer.observe(el));

// social links
qsa('#instagramLink').forEach((link) => { link.href = cfg.instagramUrl || '#'; });
qsa('#facebookLink').forEach((link) => { link.href = cfg.facebookUrl || '#'; });

function syncPackage(key, scrollToOrder = false) {
  selectedPackageKey = key;
  const item = packages[key];
  qsa('.package-card').forEach((card) => {
    const active = card.dataset.package === key;
    card.classList.toggle('selected', active);
    const label = qs('.select-label', card);
    if (label) label.textContent = active ? 'Seçili Paket ✓' : 'Sipariş Ver';
  });

  const summaryPackage = qs('#summaryPackage');
  const summaryTotal = qs('#summaryTotal');
  const summarySaving = qs('#summarySaving');
  const stickyPackage = qs('#stickyPackage');
  const stickyPrice = qs('#stickyPrice');
  const formPackage = qs('#formPackage');
  const formTotal = qs('#formTotal');

  if (summaryPackage) summaryPackage.textContent = item.label;
  if (summaryTotal) summaryTotal.textContent = `${fmt(item.total)} TL`;
  if (summarySaving) summarySaving.textContent = item.saving > 0 ? `${fmt(item.saving)} TL indirim` : 'Başlangıç paketi';
  if (stickyPackage) stickyPackage.textContent = item.short;
  if (stickyPrice) stickyPrice.textContent = `${fmt(item.total)} TL`;
  if (formPackage) formPackage.value = item.label;
  if (formTotal) formTotal.value = `${item.total} TL`;

  if (scrollToOrder) {
    const order = qs('#order');
    if (order) setTimeout(() => order.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
  }
}
qsa('.package-card').forEach((card) => {
  card.addEventListener('click', () => syncPackage(card.dataset.package, true));
});
syncPackage('triple');

// countdown to end of day
function updateCountdown() {
  const target = qs('#dealCountdown');
  if (!target) return;
  const now = new Date();
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const diff = Math.max(0, end - now);
  const h = String(Math.floor(diff / 3600000)).padStart(2, '0');
  const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
  const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
  target.textContent = `${h}:${m}:${s}`;
}
updateCountdown();
setInterval(updateCountdown, 1000);

// reviews
async function loadReviews() {
  try {
    const res = await fetch('data/reviews.json');
    const data = await res.json();
    reviewData = (data.reviews || []).filter((r) => r.published !== false);
    renderReviews(reviewData);
  } catch (error) {
    console.warn('reviews load error', error);
  }
}

function renderReviews(reviews) {
  if (!reviews.length) return;
  const avg = reviews.reduce((sum, item) => sum + item.rating, 0) / reviews.length;
  const ratingNumber = qs('#ratingNumber');
  const heroRatingValue = qs('#heroRatingValue');
  const ratingCount = qs('#ratingCount');
  const ratingBars = qs('#ratingBars');
  const thumbStrip = qs('#reviewThumbStrip');
  const reviewGrid = qs('#reviewGrid');

  if (ratingNumber) ratingNumber.textContent = avg.toFixed(1).replace('.', ',');
  if (heroRatingValue) heroRatingValue.textContent = avg.toFixed(1).replace('.', ',');
  if (ratingCount) ratingCount.textContent = `${reviews.length} değerlendirme`;

  if (ratingBars) {
    ratingBars.innerHTML = [5, 4, 3, 2, 1].map((star) => {
      const count = reviews.filter((r) => r.rating === star).length;
      const pct = reviews.length ? (count / reviews.length) * 100 : 0;
      return `
        <div class="bar-row">
          <span>${star}★</span>
          <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
          <b>${count}</b>
        </div>
      `;
    }).join('');
  }

  const photoReviews = reviews.filter((r) => r.image).slice(0, 6);
  if (thumbStrip) {
    thumbStrip.innerHTML = photoReviews.map((r) => `
      <button class="review-thumb" type="button" data-image="${r.image}" aria-label="Yorum görselini aç">
        <img src="${r.image}" alt="Müşteri yorum görseli" />
      </button>
    `).join('');
    qsa('.review-thumb', thumbStrip).forEach((btn) => {
      btn.addEventListener('click', () => openLightbox(btn.dataset.image));
    });
  }

  if (reviewGrid) {
    reviewGrid.innerHTML = reviews.map((r) => `
      <article class="review-card reveal visible">
        <div class="review-head">
          <div class="review-meta">
            <strong>${displayInitials(r.name)}</strong>
            <span>${r.date || ''}${r.city ? ` · ${r.city}` : ''}</span>
          </div>
          <div class="stars">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</div>
        </div>
        <p class="review-text">${r.text}</p>
        ${r.image ? `<img class="review-image" src="${r.image}" alt="Müşteri yorum görseli" data-image="${r.image}" />` : ''}
        <div class="review-footer">
          <span>${r.date || 'Müşteri yorumu'}</span>
          <span>${r.helpful || 0} kişi faydalı buldu</span>
        </div>
      </article>
    `).join('');
    qsa('.review-image', reviewGrid).forEach((img) => {
      img.addEventListener('click', () => openLightbox(img.dataset.image));
    });
  }
}

// ugc
async function loadUGC() {
  try {
    const res = await fetch('data/ugc.json');
    const data = await res.json();
    const items = (data.items || []).filter((item) => item.published !== false);
    const track = qs('#ugcTrack');
    if (!track || !items.length) return;
    track.innerHTML = items.map((item) => `
      <article class="ugc-item">
        <img src="${item.image}" alt="SOMNEA gece ritüeli" />
        <div class="ugc-caption">${item.caption || item.name || 'Gece rutini'}</div>
      </article>
    `).join('');
  } catch (error) {
    console.warn('ugc load error', error);
  }
}

// lightbox
const lightbox = qs('#imageLightbox');
const lightboxImage = qs('#lightboxImage');
const lightboxClose = qs('#lightboxClose');

function openLightbox(src) {
  if (!lightbox || !lightboxImage || !src) return;
  lightboxImage.src = src;
  lightbox.hidden = false;
}
function closeLightbox() {
  if (!lightbox || !lightboxImage) return;
  lightbox.hidden = true;
  lightboxImage.src = '';
}
if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);

qsa('.mini-review-list img').forEach((img) => {
  img.style.cursor = 'zoom-in';
  img.addEventListener('click', () => openLightbox(img.getAttribute('src')));
});
if (lightbox) lightbox.addEventListener('click', (e) => {
  if (e.target === lightbox) closeLightbox();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeLightbox();
    closeSuccessModal();
  }
});

// location hierarchy - province/district only
const citySelect = qs('#citySelect');
const districtSelect = qs('#districtSelect');

function normalizeLocations(raw) {
  if (Array.isArray(raw)) {
    const out = {};
    raw.forEach((province) => {
      const provinceName = province.il_adi || province.name;
      if (!provinceName) return;
      out[provinceName] = {};
      (province.ilceler || []).forEach((district) => {
        const districtName = district.ilce_adi || district.name;
        if (districtName) out[provinceName][districtName] = [];
      });
    });
    return out;
  }
  const out = {};
  Object.entries(raw || {}).forEach(([provinceName, value]) => {
    if (provinceName.startsWith('_')) return;
    if (value?.ilceler) {
      out[provinceName] = {};
      Object.keys(value.ilceler).forEach((districtName) => {
        out[provinceName][districtName] = [];
      });
    } else if (value && typeof value === 'object') {
      out[provinceName] = {};
      Object.keys(value).forEach((districtName) => {
        out[provinceName][districtName] = [];
      });
    }
  });
  return out;
}

function populateCities() {
  if (!citySelect) return;
  const options = Object.keys(locationTree).sort((a, b) => a.localeCompare(b, 'tr'));
  citySelect.innerHTML = '<option value="">İl seçin</option>' + options.map((name) => `<option value="${name}">${name}</option>`).join('');
}

async function loadLocations() {
  try {
    const response = await fetch('data/turkey_locations.json');
    let raw = await response.json();
    locationTree = normalizeLocations(raw);

    if (Object.keys(locationTree).length < 20 && cfg.remoteLocationFallback) {
      try {
        const remote = await fetch(cfg.remoteLocationFallback);
        if (remote.ok) {
          const remoteRaw = await remote.json();
          const remoteTree = normalizeLocations(remoteRaw);
          if (Object.keys(remoteTree).length > 20) locationTree = remoteTree;
        }
      } catch (_) {}
    }
    populateCities();
  } catch (error) {
    console.warn('location load error', error);
  }
}

if (citySelect && districtSelect) {
  citySelect.addEventListener('change', () => {
    const districts = Object.keys(locationTree[citySelect.value] || {}).sort((a, b) => a.localeCompare(b, 'tr'));
    districtSelect.innerHTML = '<option value="">İlçe seçin</option>' + districts.map((name) => `<option value="${name}">${name}</option>`).join('');
    districtSelect.disabled = !districts.length;
  });
}

// phone cleanup
const phoneInput = qs('input[name="telefon"]');
if (phoneInput) {
  phoneInput.addEventListener('input', () => {
    phoneInput.value = phoneInput.value.replace(/[^0-9+ ]/g, '').slice(0, 16);
  });
}

// order submission
const ORDER_API_URL = cfg.orderApiUrl || 'https://somnea-order-api.webliodijital.workers.dev/';
const orderForm = qs('#orderForm');
const orderMessage = qs('#orderMessage');
const successModal = qs('#successModal');
const successTitle = qs('#successTitle');
const successText = qs('#successText');
const successClose = qs('#successClose');

function showOrderMessage(message, type = 'success') {
  if (!orderMessage) return;
  orderMessage.hidden = false;
  orderMessage.textContent = message;
  orderMessage.style.background = type === 'success' ? '#eef9f1' : '#fff1f1';
  orderMessage.style.border = type === 'success' ? '1px solid #b9e3c3' : '1px solid #efc2c2';
  orderMessage.style.color = type === 'success' ? '#17652e' : '#9a2727';
}

function openSuccessModal(firstName) {
  if (!successModal || !successTitle || !successText) return;
  successTitle.textContent = `Tebrikler ${firstName || ''}!`;
  successText.textContent = 'Siparişiniz alındı. En kısa sürede size ulaşılıp sipariş teyidiniz yapılacaktır.';
  successModal.hidden = false;
}

function closeSuccessModal() {
  if (successModal) successModal.hidden = true;
}
if (successClose) successClose.addEventListener('click', closeSuccessModal);
if (successModal) {
  successModal.addEventListener('click', (e) => {
    if (e.target === successModal) closeSuccessModal();
  });
}

if (orderForm) {
  orderForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const addressField = qs('#addressField');
    const paymentField = qs('#paymentMethod');
    const honeypot = orderForm.querySelector('[name="bot-field"]');

    if (honeypot && honeypot.value.trim()) return;
    if (!addressField?.value.trim()) {
      addressField.focus();
      addressField.setCustomValidity('Lütfen açık adresinizi girin.');
      orderForm.reportValidity();
      return;
    }
    addressField.setCustomValidity('');

    if (!paymentField?.value) {
      paymentField.focus();
      paymentField.setCustomValidity('Lütfen ödeme yöntemini seçin.');
      orderForm.reportValidity();
      return;
    }
    paymentField.setCustomValidity('');

    if (!orderForm.reportValidity()) return;

    const submitButton = orderForm.querySelector('button[type="submit"]');
    const originalText = submitButton ? submitButton.textContent : '';
    const formData = new FormData(orderForm);
    const selectedItem = packages[selectedPackageKey];

    const payload = {
      firstName: String(formData.get('ad') || '').trim(),
      lastName: String(formData.get('soyad') || '').trim(),
      phone: String(formData.get('telefon') || '').trim(),
      province: String(formData.get('il') || '').trim(),
      district: String(formData.get('ilce') || '').trim(),
      address: String(formData.get('adres') || '').trim(),
      paymentMethod: String(formData.get('odeme') || '').trim(),
      packageName: selectedItem.label,
      packagePrice: `${fmt(selectedItem.total)} TL`,
      quantity: selectedItem.quantity
    };

    try {
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Siparişiniz gönderiliyor...';
      }
      if (orderMessage) orderMessage.hidden = true;

      const response = await fetch(ORDER_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      let result = {};
      try { result = await response.json(); } catch (_) {}

      if (!response.ok || result.ok !== true) {
        throw new Error(result.error || 'Sipariş gönderilemedi.');
      }

      showOrderMessage('Sipariş kaydınız alındı. En kısa sürede sizinle iletişime geçeceğiz.', 'success');
      openSuccessModal(payload.firstName);

      if (typeof window.fbq === 'function') {
        window.fbq('track', 'Purchase', {
          value: Number(selectedItem.total),
          currency: 'TRY',
          content_name: selectedItem.label,
          content_type: 'product',
          num_items: selectedItem.quantity
        });
      }

      orderForm.reset();
      if (districtSelect) {
        districtSelect.innerHTML = '<option value="">İlçe seçin</option>';
        districtSelect.disabled = true;
      }
      syncPackage(selectedPackageKey);
      if (orderMessage) orderMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch (error) {
      console.error('Order submit error:', error);
      showOrderMessage('Sipariş şu anda gönderilemedi. Lütfen bilgilerinizi kontrol edip tekrar deneyin.', 'error');
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalText;
      }
    }
  });
}

const finalSubmitButton = qs('.submit-cta');
const stickyOrder = qs('.sticky-order');
if (finalSubmitButton && stickyOrder) {
  const stickyObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      stickyOrder.classList.toggle('is-hidden', entry.isIntersecting);
    });
  }, { threshold: 0.15 });
  stickyObserver.observe(finalSubmitButton);
}

loadLocations();
loadReviews();
loadUGC();
