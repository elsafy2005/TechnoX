/* TechnoX — Ratings & Reviews (localStorage) v4 */
(function(){
  'use strict';
  var RATINGS_KEY = 'technox_ratings_v2';
  var REVIEWS_KEY = 'technox_reviews_v2';

  function safeParse(key, fallback) {
    try { var v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
    catch(e) { return fallback; }
  }
  function getAllRatings(){ return safeParse(RATINGS_KEY, {}); }
  function getRating(pid){
    var all = getAllRatings();
    var r = all[pid];
    if (!r || !r.count) return {avg:0, count:0};
    return {avg: r.total / r.count, count: r.count};
  }
  function saveRating(pid, rating){
    var all = getAllRatings();
    if (!all[pid]) all[pid] = {total:0, count:0};
    all[pid].total += rating;
    all[pid].count += 1;
    localStorage.setItem(RATINGS_KEY, JSON.stringify(all));
  }
  function getAllReviews(){ return safeParse(REVIEWS_KEY, []); }
  function saveReview(review){
    var reviews = getAllReviews();
    reviews.unshift(review);
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews));
  }

  function renderStars(val, size){
    size = size || 14;
    var html = '';
    for (var i = 1; i <= 5; i++) {
      html += '<span style="color:' + (i <= val ? '#f5a623' : '#444') + ';font-size:' + size + 'px;line-height:1;">&#9733;</span>';
    }
    return html;
  }

  window.initProductRatings = function() {
    var cards = document.querySelectorAll('.product-card');
    for (var i = 0; i < cards.length; i++) {
      var card = cards[i];
      var btn = card.querySelector('.btn-add');
      if (!btn) continue;
      var onclick = btn.getAttribute('onclick') || '';
      var match = onclick.match(/addToCart\s*\(\s*['"]([^'"]+)/);
      if (!match) continue;
      var pid = match[1];
      var body = card.querySelector('.product-body');
      var footer = card.querySelector('.product-footer');
      if (!body || !footer) continue;

      var rData = getRating(pid);
      var nameEl = card.querySelector('.product-name');
      var productName = nameEl ? nameEl.textContent.trim() : pid;

      var starRow = document.createElement('div');
      starRow.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin:6px 0 4px;';
      starRow.innerHTML = '<div id="star-display-' + pid + '" style="display:flex;align-items:center;gap:4px;direction:ltr;">' + renderStars(Math.round(rData.avg), 14) + '<span style="font-size:11px;color:#999;margin-right:2px;">(' + rData.count + ')</span></div><button onclick="toggleRateForm(\'' + pid + '\')" style="background:none;border:none;color:#999;font-size:.73rem;cursor:pointer;font-family:Cairo,sans-serif;text-decoration:underline;padding:0;" id="rate-toggle-' + pid + '">+ قيّم</button>';
      body.insertBefore(starRow, footer);

      var form = document.createElement('div');
      form.id = 'rate-form-' + pid;
      form.style.cssText = 'display:none;flex-direction:column;gap:8px;padding:12px;background:#161616;border:1px solid #222;border-radius:8px;margin-bottom:8px;';
      var starsHtml = '';
      for (var s = 1; s <= 5; s++) {
        starsHtml += '<span data-v="' + s + '" style="font-size:24px;color:#444;line-height:1;transition:color .1s;cursor:pointer;">&#9733;</span>';
      }
      form.innerHTML = '<div id="stars-int-' + pid + '" style="display:flex;gap:2px;direction:ltr;cursor:pointer;" data-val="0">' + starsHtml + '</div><input type="text" id="ra-' + pid + '" placeholder="اسمك *" style="background:#000;border:1px solid #222;border-radius:6px;color:#fff;padding:8px 10px;font-family:Cairo,sans-serif;font-size:.82rem;outline:none;width:100%;"/><textarea id="rc-' + pid + '" rows="2" placeholder="تعليقك (اختياري)" style="background:#000;border:1px solid #222;border-radius:6px;color:#fff;padding:8px 10px;font-family:Cairo,sans-serif;font-size:.82rem;outline:none;width:100%;resize:none;"></textarea><div id="rmsg-' + pid + '" style="display:none;color:#4caf50;font-weight:700;font-size:.82rem;text-align:center;">&#9989; شكراً على تقييمك!</div><button onclick="submitProductReview(\'' + pid + '\',\'' + productName.replace(/'/g, "\\'") + '\')" style="background:#e00000;color:#fff;border:none;border-radius:6px;padding:8px;font-family:Cairo,sans-serif;font-weight:700;font-size:.82rem;cursor:pointer;">إرسال التقييم</button>';
      body.insertBefore(form, footer);

      (function(thisPid){
        var starContainer = document.getElementById('stars-int-' + thisPid);
        if (!starContainer) return;
        var spans = starContainer.querySelectorAll('span');
        for (var j = 0; j < spans.length; j++) {
          (function(spanVal){
            spans[j].addEventListener('mouseenter', function(){ setStarColor(thisPid, spanVal); });
            spans[j].addEventListener('mouseleave', function(){ resetStarColor(thisPid); });
            spans[j].addEventListener('click', function(){ pickStar(thisPid, spanVal); });
          })(parseInt(spans[j].getAttribute('data-v')));
        }
      })(pid);
    }
  };

  window.toggleRateForm = function(pid) {
    var form = document.getElementById('rate-form-' + pid);
    var toggle = document.getElementById('rate-toggle-' + pid);
    if (!form) return;
    var isOpen = form.style.display === 'flex';
    form.style.display = isOpen ? 'none' : 'flex';
    if (toggle) toggle.textContent = isOpen ? '+ قيّم' : 'إلغاء';
  };

  function setStarColor(pid, val) {
    var c = document.getElementById('stars-int-' + pid);
    if (!c) return;
    var spans = c.querySelectorAll('span');
    for (var i = 0; i < spans.length; i++) {
      spans[i].style.color = parseInt(spans[i].getAttribute('data-v')) <= val ? '#f5a623' : '#444';
    }
  }
  window.resetStarColor = function(pid) {
    var c = document.getElementById('stars-int-' + pid);
    if (!c) return;
    var sel = parseInt(c.getAttribute('data-val')) || 0;
    var spans = c.querySelectorAll('span');
    for (var i = 0; i < spans.length; i++) {
      spans[i].style.color = parseInt(spans[i].getAttribute('data-v')) <= sel ? '#f5a623' : '#444';
    }
  };
  window.pickStar = function(pid, val) {
    var c = document.getElementById('stars-int-' + pid);
    if (!c) return;
    c.setAttribute('data-val', val);
    var spans = c.querySelectorAll('span');
    for (var i = 0; i < spans.length; i++) {
      spans[i].style.color = parseInt(spans[i].getAttribute('data-v')) <= val ? '#f5a623' : '#444';
    }
  };

  window.submitProductReview = function(pid, productName) {
    var c = document.getElementById('stars-int-' + pid);
    var authorEl = document.getElementById('ra-' + pid);
    var commentEl = document.getElementById('rc-' + pid);
    var msgEl = document.getElementById('rmsg-' + pid);
    var submitBtn = document.querySelector('#rate-form-' + pid + ' button');
    if (!c || !authorEl) return;
    var rating = parseInt(c.getAttribute('data-val')) || 0;
    var author = authorEl.value.trim();
    if (!rating) { if(window.showToast) showToast('⭐ اختر عدد النجوم أولاً'); return; }
    if (!author) { if(window.showToast) showToast('✏️ اكتب اسمك'); return; }
    saveRating(pid, rating);
    saveReview({id: Date.now().toString(), productId: pid, productName: productName, author: author, rating: rating, comment: commentEl ? commentEl.value.trim() : '', date: new Date().toLocaleDateString('ar-EG', {year:'numeric', month:'long', day:'numeric'})});
    var rData = getRating(pid);
    var displayEl = document.getElementById('star-display-' + pid);
    if (displayEl) displayEl.innerHTML = renderStars(Math.round(rData.avg), 14) + '<span style="font-size:11px;color:#999;margin-right:2px;">(' + rData.count + ')</span>';
    if (msgEl) msgEl.style.display = 'block';
    if (submitBtn) submitBtn.style.display = 'none';
    if (authorEl) authorEl.style.display = 'none';
    if (commentEl) commentEl.style.display = 'none';
    c.style.pointerEvents = 'none';
    setTimeout(function(){
      toggleRateForm(pid);
      if (msgEl) msgEl.style.display = 'none';
      if (submitBtn) submitBtn.style.display = 'block';
      if (authorEl) { authorEl.style.display = ''; authorEl.value = ''; }
      if (commentEl) { commentEl.style.display = ''; commentEl.value = ''; }
      c.setAttribute('data-val', '0');
      var spans2 = c.querySelectorAll('span');
      for (var i = 0; i < spans2.length; i++) spans2[i].style.color = '#444';
      c.style.pointerEvents = '';
    }, 1800);
  };

  window.initHamburger = function() {
    var btn = document.getElementById('hamburgerBtn');
    var menu = document.getElementById('mobileMenu');
    if (!btn || !menu) return;
    btn.addEventListener('click', function(){
      var isOpen = menu.classList.contains('open');
      if (isOpen) { menu.classList.remove('open'); btn.classList.remove('open'); document.body.style.overflow = ''; }
      else { menu.classList.add('open'); btn.classList.add('open'); document.body.style.overflow = 'hidden'; }
    });
    var links = menu.querySelectorAll('a');
    for (var i = 0; i < links.length; i++) {
      links[i].addEventListener('click', function(){
        menu.classList.remove('open'); btn.classList.remove('open'); document.body.style.overflow = '';
      });
    }
  };

  window.initReviewsPage = function() { renderReviewsList(); initReviewForm(); };

  window.renderReviewsList = function() {
    var container = document.getElementById('reviewsList');
    if (!container) return;
    var reviews = getAllReviews();
    if (reviews.length === 0) {
      container.innerHTML = '<div style="text-align:center;padding:60px 20px;background:var(--card);border:1px solid var(--border);border-radius:12px;"><div style="font-size:3rem;margin-bottom:12px;">&#128172;</div><p style="color:var(--gray);">لا توجد تقييمات بعد. كن أول من يقيّم!</p></div>';
      return;
    }
    var total = 0;
    for (var i = 0; i < reviews.length; i++) total += reviews[i].rating;
    var avg = total / reviews.length;
    var statsHtml = '<div style="display:flex;align-items:center;gap:24px;flex-wrap:wrap;margin-bottom:40px;padding:28px;background:var(--card);border:1px solid var(--border);border-radius:14px;"><div style="text-align:center;"><div style="font-size:3.5rem;font-weight:900;color:#f5a623;line-height:1;">' + avg.toFixed(1) + '</div><div style="display:flex;gap:2px;direction:ltr;justify-content:center;margin:4px 0;">' + renderStars(Math.round(avg), 22) + '</div><div style="font-size:.8rem;color:var(--gray);">' + reviews.length + ' تقييم</div></div><div style="flex:1;min-width:200px;">';
    for (var star = 5; star >= 1; star--) {
      var count = 0;
      for (var j = 0; j < reviews.length; j++) if (reviews[j].rating === star) count++;
      var pct = (count / reviews.length * 100).toFixed(0);
      statsHtml += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;"><span style="color:#f5a623;font-size:13px;width:14px;text-align:center;">' + star + '</span><span style="color:#f5a623;font-size:13px;">&#9733;</span><div style="flex:1;height:8px;background:#222;border-radius:4px;overflow:hidden;"><div style="width:' + pct + '%;height:100%;background:#f5a623;border-radius:4px;"></div></div><span style="font-size:.75rem;color:var(--gray);width:24px;">' + count + '</span></div>';
    }
    statsHtml += '</div></div>';
    var listHtml = '';
    for (var k = 0; k < reviews.length; k++) {
      var r = reviews[k];
      listHtml += '<div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:20px;margin-bottom:14px;"><div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px;margin-bottom:8px;"><div><div style="font-weight:800;margin-bottom:4px;">' + r.author + '</div><div style="display:flex;gap:2px;direction:ltr;">' + renderStars(r.rating, 14) + '</div></div><div style="text-align:left;"><div style="color:var(--red);font-weight:700;font-size:.82rem;margin-bottom:2px;">' + r.productName + '</div><div style="font-size:.75rem;color:var(--gray);">' + r.date + '</div></div></div>' + (r.comment ? '<p style="font-size:.9rem;color:var(--light);margin-top:8px;line-height:1.7;">' + r.comment + '</p>' : '') + '</div>';
    }
    container.innerHTML = statsHtml + listHtml;
  };

  window.initReviewForm = function() {
    var form = document.getElementById('reviewPageForm');
    if (!form) return;
    var starsContainer = document.getElementById('formStars');
    if (starsContainer) {
      starsContainer.setAttribute('data-val', '0');
      starsContainer.innerHTML = '';
      for (var s = 1; s <= 5; s++) {
        var span = document.createElement('span');
        span.setAttribute('data-v', s);
        span.style.cssText = 'font-size:32px;color:#444;cursor:pointer;line-height:1;transition:color .1s;';
        span.innerHTML = '&#9733;';
        (function(v){
          span.addEventListener('mouseenter', function(){
            var children = starsContainer.children;
            for (var i = 0; i < children.length; i++) {
              children[i].style.color = parseInt(children[i].getAttribute('data-v')) <= v ? '#f5a623' : '#444';
            }
          });
          span.addEventListener('mouseleave', function(){
            var sel = parseInt(starsContainer.getAttribute('data-val')) || 0;
            var children = starsContainer.children;
            for (var i = 0; i < children.length; i++) {
              children[i].style.color = parseInt(children[i].getAttribute('data-v')) <= sel ? '#f5a623' : '#444';
            }
          });
          span.addEventListener('click', function(){
            starsContainer.setAttribute('data-val', v);
            var children = starsContainer.children;
            for (var i = 0; i < children.length; i++) {
              children[i].style.color = parseInt(children[i].getAttribute('data-v')) <= v ? '#f5a623' : '#444';
            }
          });
        })(s);
        starsContainer.appendChild(span);
      }
    }
    form.addEventListener('submit', function(e){
      e.preventDefault();
      var pid = document.getElementById('fpid').value;
      var author = document.getElementById('fauthor').value.trim();
      var comment = document.getElementById('fcomment').value.trim();
      var rating = starsContainer ? (parseInt(starsContainer.getAttribute('data-val')) || 0) : 0;
      var fpid = document.getElementById('fpid');
      var productName = fpid.options[fpid.selectedIndex].text;
      if (!pid || !author || !rating) { if(window.showToast) showToast('⭐ أكمل البيانات المطلوبة'); return; }
      saveRating(pid, rating);
      saveReview({id: Date.now().toString(), productId: pid, productName: productName, author: author, rating: rating, comment: comment, date: new Date().toLocaleDateString('ar-EG', {year:'numeric', month:'long', day:'numeric'})});
      var msg = document.getElementById('formMsg');
      if (msg) msg.style.display = 'block';
      form.reset();
      if (starsContainer) { starsContainer.setAttribute('data-val', '0'); var children = starsContainer.children; for (var i = 0; i < children.length; i++) children[i].style.color = '#444'; }
      setTimeout(function(){ if (msg) msg.style.display = 'none'; renderReviewsList(); }, 2000);
    });
  };

  document.addEventListener('DOMContentLoaded', function(){
    initProductRatings();
    initHamburger();
    if (document.getElementById('reviewsList')) initReviewsPage();
  });
})();
