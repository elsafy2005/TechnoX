// ============================================================
//  TechnoX Ratings & Reviews
//  - النجوم تظهر فوراً على كل المنتجات (زي الكود القديم)
//  - الحفظ والقراءة من Google Sheets (بابليك لكل الزوار)
//  ضع رابط Web App بتاع Google Apps Script هنا:
// ============================================================

var SHEET_URL = 'https://script.google.com/macros/s/AKfycbyFJ5pcJwRiTtq_y-kaaOF3D59PUu0EDg1crINBKXBLTLftsICOnTONEghqiDYL_ixfXg/exec';

// ── Cache في الذاكرة ────────────────────────────────────────
var _ratingsCache = {};
var _reviewsCache = [];

// ── قراءة البيانات من الـ Cache ─────────────────────────────
function getAllRatings() { return _ratingsCache; }

function getRating(pid) {
  var r = _ratingsCache[pid];
  if (!r || r.count === 0) return { avg: 0, count: 0 };
  return { avg: r.total / r.count, count: r.count };
}

function getAllReviews() { return _reviewsCache; }

// ── حفظ تقييم (Cache + Sheets) ──────────────────────────────
function saveRating(pid, rating) {
  if (!_ratingsCache[pid]) _ratingsCache[pid] = { total: 0, count: 0 };
  _ratingsCache[pid].total += rating;
  _ratingsCache[pid].count += 1;
  var url = SHEET_URL + '?action=saveRating&pid=' + encodeURIComponent(pid) + '&rating=' + Number(rating);
  fetch(url).catch(function() {});
}

// ── حفظ تعليق (Cache + Sheets) ──────────────────────────────
function saveReview(review) {
  _reviewsCache.unshift(review);
  var url = SHEET_URL + '?action=saveReview&data=' + encodeURIComponent(JSON.stringify(review));
  fetch(url).catch(function() {});
}

// ── تحميل البيانات من Sheets في الخلفية ─────────────────────
function loadFromSheets() {
  fetch(SHEET_URL + '?action=getRatings')
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data && typeof data === 'object' && !data.error) {
        _ratingsCache = data;
        // حدّث نجوم المنتجات بالأرقام الحقيقية
        document.querySelectorAll('.product-card').forEach(function(card) {
          var btn = card.querySelector('.btn-add');
          if (!btn) return;
          var match = (btn.getAttribute('onclick') || '').match(/addToCart\('([^']+)'/);
          if (!match) return;
          var pid = match[1];
          var rData = getRating(pid);
          var displayEl = document.getElementById('star-display-' + pid);
          if (displayEl) {
            displayEl.innerHTML = renderStars(Math.round(rData.avg), 14) +
              '<span style="font-size:11px;color:#999;margin-right:2px;">(' + rData.count + ')</span>';
          }
        });
      }
    }).catch(function() {});

  fetch(SHEET_URL + '?action=getReviews')
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (Array.isArray(data)) {
        _reviewsCache = data;
        renderReviewsList();
      }
    }).catch(function() {});
}

// ── باقي الكود (نفس الكود القديم بالظبط) ────────────────────

function renderStars(val, size) {
  size = size || 14; var html = '';
  for (var i = 1; i <= 5; i++)
    html += '<span style="color:' + (i <= val ? '#f5a623' : '#444') + ';font-size:' + size + 'px;line-height:1;">★</span>';
  return html;
}

function initProductRatings() {
  document.querySelectorAll('.product-card').forEach(function(card) {
    var btn = card.querySelector('.btn-add');
    if (!btn) return;
    var match = (btn.getAttribute('onclick') || '').match(/addToCart\('([^']+)'/);
    if (!match) return;
    var pid = match[1];
    var body = card.querySelector('.product-body');
    var footer = card.querySelector('.product-footer');
    if (!body || !footer) return;
    var rData = getRating(pid);
    var productName = ((card.querySelector('.product-name') || {}).textContent || pid).trim().replace(/'/g, "\\'");
    var starRow = document.createElement('div');
    starRow.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin:6px 0 4px;';
    starRow.innerHTML = '<div id="star-display-' + pid + '" style="display:flex;align-items:center;gap:4px;direction:ltr;">' + renderStars(Math.round(rData.avg), 14) + '<span style="font-size:11px;color:#999;margin-right:2px;">(' + rData.count + ')</span></div><button onclick="toggleRateForm(\'' + pid + '\')" style="background:none;border:none;color:#999;font-size:.73rem;cursor:pointer;font-family:Cairo,sans-serif;text-decoration:underline;padding:0;" id="rate-toggle-' + pid + '">+ قيّم</button>';
    body.insertBefore(starRow, footer);
    var form = document.createElement('div');
    form.id = 'rate-form-' + pid;
    form.style.cssText = 'display:none;flex-direction:column;gap:8px;padding:12px;background:#161616;border:1px solid #222;border-radius:8px;margin-bottom:8px;';
    form.innerHTML = '<div id="stars-int-' + pid + '" style="display:flex;gap:2px;direction:ltr;cursor:pointer;" data-val="0">' + [1,2,3,4,5].map(function(s) { return '<span data-v="' + s + '" onclick="pickStar(\'' + pid + '\',' + s + ')" onmouseenter="hoverStar(\'' + pid + '\',' + s + ')" onmouseleave="unhoverStar(\'' + pid + '\')" style="font-size:24px;color:#444;line-height:1;transition:color .1s;">★</span>'; }).join('') + '</div><input type="text" id="ra-' + pid + '" placeholder="اسمك *" style="background:#000;border:1px solid #222;border-radius:6px;color:#fff;padding:8px 10px;font-family:Cairo,sans-serif;font-size:.82rem;outline:none;width:100%;"/><textarea id="rc-' + pid + '" rows="2" placeholder="تعليقك (اختياري)" style="background:#000;border:1px solid #222;border-radius:6px;color:#fff;padding:8px 10px;font-family:Cairo,sans-serif;font-size:.82rem;outline:none;width:100%;resize:none;"></textarea><div id="rmsg-' + pid + '" style="display:none;color:#4caf50;font-weight:700;font-size:.82rem;text-align:center;">✅ شكراً على تقييمك!</div><button onclick="submitProductReview(\'' + pid + '\',\'' + productName + '\')" style="background:#e00000;color:#fff;border:none;border-radius:6px;padding:8px;font-family:Cairo,sans-serif;font-weight:700;font-size:.82rem;cursor:pointer;">إرسال التقييم</button>';
    body.insertBefore(form, footer);
  });
}

function toggleRateForm(pid) { var form = document.getElementById('rate-form-' + pid); var toggle = document.getElementById('rate-toggle-' + pid); if (!form) return; var isOpen = form.style.display === 'flex'; form.style.display = isOpen ? 'none' : 'flex'; if (toggle) toggle.textContent = isOpen ? '+ قيّم' : 'إلغاء'; }
function pickStar(pid, val) { var c = document.getElementById('stars-int-' + pid); if (!c) return; c.dataset.val = val; c.querySelectorAll('span').forEach(function(s) { s.style.color = parseInt(s.dataset.v) <= val ? '#f5a623' : '#444'; }); }
function hoverStar(pid, val) { var c = document.getElementById('stars-int-' + pid); if (!c) return; c.querySelectorAll('span').forEach(function(s) { s.style.color = parseInt(s.dataset.v) <= val ? '#f5a623' : '#444'; }); }
function unhoverStar(pid) { var c = document.getElementById('stars-int-' + pid); if (!c) return; var sel = parseInt(c.dataset.val) || 0; c.querySelectorAll('span').forEach(function(s) { s.style.color = parseInt(s.dataset.v) <= sel ? '#f5a623' : '#444'; }); }

function submitProductReview(pid, productName) {
  var c = document.getElementById('stars-int-' + pid);
  var authorEl = document.getElementById('ra-' + pid);
  var commentEl = document.getElementById('rc-' + pid);
  var msgEl = document.getElementById('rmsg-' + pid);
  var submitBtn = document.querySelector('#rate-form-' + pid + ' button');
  if (!c || !authorEl) return;
  var rating = parseInt(c.dataset.val) || 0;
  var author = authorEl.value.trim();
  if (!rating) { showToast('⭐ اختار عدد النجوم أولاً'); return; }
  if (!author) { showToast('✏️ اكتب اسمك'); return; }
  saveRating(pid, rating);
  saveReview({ id: Date.now().toString(), productId: pid, productName: productName, author: author, rating: rating, comment: commentEl ? commentEl.value.trim() : '', date: new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }) });
  var rData = getRating(pid);
  var displayEl = document.getElementById('star-display-' + pid);
  if (displayEl) displayEl.innerHTML = renderStars(Math.round(rData.avg), 14) + '<span style="font-size:11px;color:#999;margin-right:2px;">(' + rData.count + ')</span>';
  if (msgEl) msgEl.style.display = 'block';
  if (submitBtn) submitBtn.style.display = 'none';
  if (authorEl) authorEl.style.display = 'none';
  if (commentEl) commentEl.style.display = 'none';
  c.style.pointerEvents = 'none';
  setTimeout(function() {
    toggleRateForm(pid);
    if (msgEl) msgEl.style.display = 'none';
    if (submitBtn) submitBtn.style.display = 'block';
    if (authorEl) { authorEl.style.display = ''; authorEl.value = ''; }
    if (commentEl) { commentEl.style.display = ''; commentEl.value = ''; }
    c.dataset.val = '0'; c.querySelectorAll('span').forEach(function(s) { s.style.color = '#444'; });
    c.style.pointerEvents = '';
  }, 1800);
}

function initHamburger() {
  var btn = document.getElementById('hamburgerBtn');
  var menu = document.getElementById('mobileMenu');
  if (!btn || !menu) return;
  btn.addEventListener('click', function() {
    var isOpen = menu.classList.contains('open');
    if (isOpen) { menu.classList.remove('open'); btn.classList.remove('open'); document.body.style.overflow = ''; }
    else { menu.classList.add('open'); btn.classList.add('open'); document.body.style.overflow = 'hidden'; }
  });
  menu.querySelectorAll('a').forEach(function(link) {
    link.addEventListener('click', function() { menu.classList.remove('open'); btn.classList.remove('open'); document.body.style.overflow = ''; });
  });
}

function initReviewsPage() { renderReviewsList(); initReviewForm(); }

function renderReviewsList() {
  var container = document.getElementById('reviewsList'); if (!container) return;
  var reviews = getAllReviews();
  if (reviews.length === 0) { container.innerHTML = '<div style="text-align:center;padding:60px 20px;background:var(--card);border:1px solid var(--border);border-radius:12px;"><div style="font-size:3rem;margin-bottom:12px;">💬</div><p style="color:var(--gray);">لا توجد تقييمات بعد. كن أول من يقيّم!</p></div>'; return; }
  var total = reviews.reduce(function(s, r) { return s + r.rating; }, 0);
  var avg = total / reviews.length;
  var statsHtml = '<div style="display:flex;align-items:center;gap:24px;flex-wrap:wrap;margin-bottom:40px;padding:28px;background:var(--card);border:1px solid var(--border);border-radius:14px;"><div style="text-align:center;"><div style="font-size:3.5rem;font-weight:900;color:#f5a623;line-height:1;">' + avg.toFixed(1) + '</div><div style="display:flex;gap:2px;direction:ltr;justify-content:center;margin:4px 0;">' + renderStars(Math.round(avg), 22) + '</div><div style="font-size:.8rem;color:var(--gray);">' + reviews.length + ' تقييم</div></div><div style="flex:1;min-width:200px;">';
  [5,4,3,2,1].forEach(function(star) { var count = reviews.filter(function(r) { return r.rating === star; }).length; var pct = (count / reviews.length * 100).toFixed(0); statsHtml += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;"><span style="color:#f5a623;font-size:13px;width:14px;text-align:center;">' + star + '</span><span style="color:#f5a623;font-size:13px;">★</span><div style="flex:1;height:8px;background:#222;border-radius:4px;overflow:hidden;"><div style="width:' + pct + '%;height:100%;background:#f5a623;border-radius:4px;"></div></div><span style="font-size:.75rem;color:var(--gray);width:24px;">' + count + '</span></div>'; });
  statsHtml += '</div></div>';
  var listHtml = reviews.map(function(r) { return '<div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:20px;margin-bottom:14px;"><div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px;margin-bottom:8px;"><div><div style="font-weight:800;margin-bottom:4px;">' + r.author + '</div><div style="display:flex;gap:2px;direction:ltr;">' + renderStars(r.rating, 14) + '</div></div><div style="text-align:left;"><div style="color:var(--red);font-weight:700;font-size:.82rem;margin-bottom:2px;">' + r.productName + '</div><div style="font-size:.75rem;color:var(--gray);">' + r.date + '</div></div></div>' + (r.comment ? '<p style="font-size:.9rem;color:var(--light);margin-top:8px;line-height:1.7;">' + r.comment + '</p>' : '') + '</div>'; }).join('');
  container.innerHTML = statsHtml + listHtml;
}

function initReviewForm() {
  var form = document.getElementById('reviewPageForm'); if (!form) return;
  var starsContainer = document.getElementById('formStars');
  if (starsContainer) {
    starsContainer.dataset.val = '0';
    starsContainer.innerHTML = [1,2,3,4,5].map(function(s) { return '<span data-v="' + s + '" style="font-size:32px;color:#444;cursor:pointer;line-height:1;transition:color .1s;">★</span>'; }).join('');
    starsContainer.querySelectorAll('span').forEach(function(star) {
      star.addEventListener('mouseenter', function() { var v = parseInt(star.dataset.v); starsContainer.querySelectorAll('span').forEach(function(s) { s.style.color = parseInt(s.dataset.v) <= v ? '#f5a623' : '#444'; }); });
      star.addEventListener('mouseleave', function() { var sel = parseInt(starsContainer.dataset.val) || 0; starsContainer.querySelectorAll('span').forEach(function(s) { s.style.color = parseInt(s.dataset.v) <= sel ? '#f5a623' : '#444'; }); });
      star.addEventListener('click', function() { starsContainer.dataset.val = star.dataset.v; starsContainer.querySelectorAll('span').forEach(function(s) { s.style.color = parseInt(s.dataset.v) <= parseInt(star.dataset.v) ? '#f5a623' : '#444'; }); });
    });
  }
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    var pid = document.getElementById('fpid').value;
    var author = document.getElementById('fauthor').value.trim();
    var comment = document.getElementById('fcomment').value.trim();
    var rating = starsContainer ? parseInt(starsContainer.dataset.val) || 0 : 0;
    var productName = document.getElementById('fpid').options[document.getElementById('fpid').selectedIndex].text;
    if (!pid || !author || !rating) { showToast('⭐ أكمل البيانات المطلوبة'); return; }
    saveRating(pid, rating);
    saveReview({ id: Date.now().toString(), productId: pid, productName: productName, author: author, rating: rating, comment: comment, date: new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }) });
    var msg = document.getElementById('formMsg');
    if (msg) msg.style.display = 'block';
    form.reset();
    if (starsContainer) { starsContainer.dataset.val = '0'; starsContainer.querySelectorAll('span').forEach(function(s) { s.style.color = '#444'; }); }
    setTimeout(function() { if (msg) msg.style.display = 'none'; renderReviewsList(); }, 2000);
  });
}

// ── نقطة البداية ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  // 1. شغّل كل حاجة فوراً (زي الكود القديم بالظبط)
  initProductRatings();
  initHamburger();
  if (document.getElementById('reviewsList')) initReviewsPage();

  // 2. حمّل من Sheets في الخلفية وحدّث النجوم والتقييمات
  loadFromSheets();
});
