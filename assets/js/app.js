const cfg = window.SOMNEA_CONFIG || {};
const fmt = n => new Intl.NumberFormat('tr-TR').format(n);
const qs = s => document.querySelector(s);
const qsa = s => [...document.querySelectorAll(s)];

// Reveal animation
const io = new IntersectionObserver(entries => entries.forEach(e => { if(e.isIntersecting){e.target.classList.add('visible');io.unobserve(e.target)}}),{threshold:.08});
qsa('.reveal').forEach(el=>io.observe(el));

// Social links
if(qs('#instagramLink')) qs('#instagramLink').href = cfg.instagramUrl || '#';
if(qs('#facebookLink')) qs('#facebookLink').href = cfg.facebookUrl || '#';

// Package selector
const packages = {
  single:{label:'1 Adet SOMNEA',short:'1’li paket',total:699,saving:0},
  bundle:{label:'3 Adet SOMNEA',short:'3’lü paket',total:1799,saving:(699*3)-1799}
};
let selected = 'bundle';
function syncPackage(key,scroll=false){
  selected=key; const p=packages[key];
  qsa('.package-card').forEach(x=>{x.classList.toggle('selected',x.dataset.package===key);const l=x.querySelector('.select-label');if(l) l.textContent=x.dataset.package===key?'Seçili paket ✓':'Bu paketi seç'});
  qs('#summaryPackage').textContent=p.label; qs('#summaryTotal').textContent=`${fmt(p.total)} TL`; qs('#formPackage').value=p.label; qs('#formTotal').value=`${p.total} TL`;
  qs('#summarySaving').textContent=p.saving?`Tekli alıma göre ${fmt(p.saving)} TL avantaj`:'Tekli deneme paketi';
  qs('#stickyPackage').textContent=p.short; qs('#stickyPrice').textContent=`${fmt(p.total)} TL`;
  if(scroll) setTimeout(()=>qs('#order').scrollIntoView({behavior:'smooth',block:'start'}),120);
}
qsa('.package-card').forEach(b=>b.addEventListener('click',()=>syncPackage(b.dataset.package,true))); syncPackage('bundle');

// Reviews
async function loadReviews(){
 try{
  const res=await fetch('data/reviews.json'); const data=await res.json();
  let reviews=(data.reviews||[]).filter(x=>x.published===true);
  if(!reviews.length){const sec=qs('#reviews'); if(sec) sec.style.display='none'; const chip=qs('#heroReviewChip'); if(chip) chip.hidden=true; return;}
  if(qs('#reviewsEmpty')) qs('#reviewsEmpty').style.display='none';
  const avg=reviews.reduce((a,b)=>a+b.rating,0)/reviews.length;
  qs('#ratingNumber').textContent=avg.toFixed(1).replace('.',','); qs('#ratingStars').textContent='★★★★★'; qs('#ratingCount').textContent=`${reviews.length} değerlendirme`; const chip=qs('#heroReviewChip'); if(chip){chip.hidden=false;}
  qs('#heroReviewChip strong').textContent=`${avg.toFixed(1).replace('.',',')}/5 · ${reviews.length} değerlendirme`;
  qs('#ratingBars').innerHTML=[5,4,3,2,1].map(st=>{const c=reviews.filter(r=>r.rating===st).length;const pct=reviews.length?c/reviews.length*100:0;return `<div class="bar-row"><span>${st}★</span><div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div><b>${c}</b></div>`}).join('');
  const tags=['Hepsi',...new Set(reviews.flatMap(r=>r.tags||[]))]; qs('#reviewFilters').innerHTML=tags.map((t,i)=>`<button class="filter ${i===0?'active':''}" data-filter="${t}">${t}</button>`).join('');
  function render(filter='Hepsi'){
    const rows=filter==='Hepsi'?reviews:reviews.filter(r=>(r.tags||[]).includes(filter));
    qs('#reviewGrid').innerHTML=rows.map(r=>`<article class="review-card"><div class="review-head"><div><strong>${r.name}</strong><div style="font-size:11px;color:#7b8493">${r.city||''}</div></div><div class="stars">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</div></div><p>${r.text}</p>${r.image?`<img class="review-photo" src="${r.image}" alt="Müşteri yorumu" onerror="this.remove()">`:''}</article>`).join('');
  }
  render();
  qsa('.filter').forEach(btn=>btn.addEventListener('click',()=>{qsa('.filter').forEach(x=>x.classList.remove('active'));btn.classList.add('active');render(btn.dataset.filter)}));
 }catch(e){console.warn('reviews',e)}
}
loadReviews();

// UGC
async function loadUGC(){
 try{const res=await fetch('data/ugc.json');const d=await res.json();let items=(d.items||[]).filter(x=>x.published===true);if(!items.length){const sec=qs('#ugc'); if(sec) sec.style.display='none'; return;} if(qs('#ugcEmpty')) qs('#ugcEmpty').style.display='none';qs('#ugcGrid').innerHTML=items.map(i=>`<article class="ugc-card"><img src="${i.image}" alt="SOMNEA gece ritüeli"><div class="ugc-overlay"><strong>${i.caption||''}</strong>${i.name?`<small>${i.name}</small>`:''}</div></article>`).join('')}catch(e){console.warn('ugc',e)}}
loadUGC();

// Location hierarchy. Supports user's {province:{district:[neighborhood]}} format and PTT array format.
const city=qs('#citySelect'), district=qs('#districtSelect'), neighborhood=qs('#neighborhoodSelect'); let locationTree={};
function normalizeLocations(raw){
 if(Array.isArray(raw)){
  const out={}; raw.forEach(p=>{const pn=p.il_adi||p.name;if(!pn)return;out[pn]={};(p.ilceler||[]).forEach(d=>{out[pn][d.ilce_adi||d.name]=(d.mahalleler||[]).map(m=>typeof m==='string'?m:(m.mahalle_adi||m.name)).filter(Boolean)})});return out;
 }
 const out={}; Object.entries(raw||{}).forEach(([p,v])=>{if(p.startsWith('_'))return;if(v?.ilceler){out[p]={};Object.entries(v.ilceler).forEach(([d,ms])=>out[p][d]=Array.isArray(ms)?ms:[])}else if(v&&typeof v==='object'){out[p]=v}}); return out;
}
function populateCities(){city.innerHTML='<option value="">İl seçin</option>'+Object.keys(locationTree).sort((a,b)=>a.localeCompare(b,'tr')).map(x=>`<option>${x}</option>`).join('')}
async function loadLocations(){
 try{let r=await fetch('data/turkey_locations.json');let raw=await r.json();locationTree=normalizeLocations(raw);if(Object.keys(locationTree).length<20 && cfg.remoteLocationFallback){try{const rr=await fetch(cfg.remoteLocationFallback);if(rr.ok){const full=normalizeLocations(await rr.json());if(Object.keys(full).length>20)locationTree=full}}catch(_){} }populateCities()}catch(e){console.warn(e)}
}
city.addEventListener('change',()=>{const ds=Object.keys(locationTree[city.value]||{}).sort((a,b)=>a.localeCompare(b,'tr'));district.innerHTML='<option value="">İlçe seçin</option>'+ds.map(x=>`<option>${x}</option>`).join('');district.disabled=!ds.length;neighborhood.innerHTML='<option value="">Mahalle seçin</option>';neighborhood.disabled=true});
district.addEventListener('change',()=>{const ns=(locationTree[city.value]?.[district.value]||[]).sort((a,b)=>a.localeCompare(b,'tr'));neighborhood.innerHTML='<option value="">Mahalle seçin</option>'+ns.map(x=>`<option>${x}</option>`).join('');neighborhood.disabled=!ns.length});
loadLocations();

// Phone cleanup
const phone=qs('input[name="telefon"]'); if(phone) phone.addEventListener('input',()=>phone.value=phone.value.replace(/[^0-9+ ]/g,'').slice(0,16));

// Secure order submission -> Cloudflare Worker -> Telegram
const ORDER_API_URL = 'https://somnea-order-api.webliodijital.workers.dev/';
const orderForm = qs('#orderForm');
const orderMessage = qs('#orderMessage');

function showOrderMessage(message, type = 'success') {
  if (!orderMessage) return;
  orderMessage.hidden = false;
  orderMessage.textContent = message;
  orderMessage.style.marginTop = '14px';
  orderMessage.style.padding = '14px 16px';
  orderMessage.style.borderRadius = '12px';
  orderMessage.style.fontWeight = '700';
  orderMessage.style.lineHeight = '1.45';
  orderMessage.style.background = type === 'success' ? '#eef9f1' : '#fff1f1';
  orderMessage.style.border = type === 'success' ? '1px solid #b9e3c3' : '1px solid #efc2c2';
  orderMessage.style.color = type === 'success' ? '#17652e' : '#9a2727';
}

if (orderForm) {
  orderForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!orderForm.reportValidity()) return;

    const honeypot = orderForm.querySelector('[name="bot-field"]');
    if (honeypot && honeypot.value.trim()) return;

    const submitButton = orderForm.querySelector('button[type="submit"]');
    const originalButtonText = submitButton ? submitButton.textContent : '';
    const formData = new FormData(orderForm);
    const selectedPackage = packages[selected];

    const payload = {
      firstName: String(formData.get('ad') || '').trim(),
      lastName: String(formData.get('soyad') || '').trim(),
      phone: String(formData.get('telefon') || '').trim(),
      province: String(formData.get('il') || '').trim(),
      district: String(formData.get('ilce') || '').trim(),
      neighborhood: String(formData.get('mahalle') || '').trim(),
      address: String(formData.get('adres') || '').trim(),
      paymentMethod: String(formData.get('odeme') || '').trim(),
      packageName: selectedPackage.label,
      packagePrice: `${fmt(selectedPackage.total)} TL`,
      quantity: selected === 'bundle' ? 3 : 1
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
      try {
        result = await response.json();
      } catch (_) {}

      if (!response.ok || result.ok !== true) {
        throw new Error(result.error || 'Sipariş gönderilemedi.');
      }

      showOrderMessage('✅ Sipariş kaydınız alındı. En kısa sürede sizinle iletişime geçeceğiz.', 'success');

      // Formu temizle; seçilen paket bilgisi ekranda korunur.
      orderForm.reset();
      district.innerHTML = '<option value="">İlçe seçin</option>';
      district.disabled = true;
      neighborhood.innerHTML = '<option value="">Mahalle seçin</option>';
      neighborhood.disabled = true;
      syncPackage(selected, false);

      orderMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch (error) {
      console.error('Order submit error:', error);
      showOrderMessage('Sipariş şu anda gönderilemedi. Lütfen bilgilerinizi kontrol edip tekrar deneyin.', 'error');
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
      }
    }
  });
}
