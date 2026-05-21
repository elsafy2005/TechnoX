const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwqCR9hDBrJ_5JYeTaGuxLry_QLTTHIOVfC0USEbnovHt1KXF7h4BB1mUdHXFS0AkqfqQ/exec";

/* =========================
   تحميل التقييمات
========================= */

async function getAllReviews() {

  try {

    const res = await fetch(SCRIPT_URL);

    const data = await res.json();

    return Array.isArray(data) ? data : [];

  } catch (err) {

    console.error("GET ERROR:", err);

    return [];

  }

}

/* =========================
   إرسال تقييم
========================= */

async function saveReview(review) {

  try {

    await fetch(SCRIPT_URL, {

      method: "POST",

      mode: "no-cors",

      body: JSON.stringify(review)

    });

    return { success: true };

  } catch (err) {

    console.error(err);

    return { success: false };

  }

}

/* =========================
   رسم النجوم
========================= */

function renderStars(val, size = 14) {

  let html = '';

  for (let i = 1; i <= 5; i++) {

    html += `
      <span style="
        color:${i <= val ? '#f5a623' : '#444'};
        font-size:${size}px;
        line-height:1;
      ">
        ★
      </span>
    `;

  }

  return html;

}

/* =========================
   إشعار بسيط
========================= */

function showToast(msg) {

  let toast = document.createElement("div");

  toast.innerText = msg;

  toast.style.cssText = `
    position:fixed;
    bottom:20px;
    left:50%;
    transform:translateX(-50%);
    background:#111;
    color:#fff;
    padding:12px 18px;
    border-radius:8px;
    z-index:999999;
    font-family:Cairo,sans-serif;
    border:1px solid #333;
  `;

  document.body.appendChild(toast);

  setTimeout(() => {

    toast.remove();

  }, 2500);

}

/* =========================
   حساب متوسط منتج
========================= */

function calculateRating(reviews, pid) {

  const productReviews = reviews.filter(r => r.productId === pid);

  if (!productReviews.length) {

    return {
      avg: 0,
      count: 0
    };

  }

  const total = productReviews.reduce((s, r) => {

    return s + Number(r.rating);

  }, 0);

  return {

    avg: total / productReviews.length,

    count: productReviews.length

  };

}

/* =========================
   تقييم المنتجات
========================= */

async function initProductRatings() {

  const reviews = await getAllReviews();

  document.querySelectorAll('.product-card').forEach(function(card){

    const btn = card.querySelector('.btn-add');

    if (!btn) return;

    const match = (btn.getAttribute('onclick') || '')
      .match(/addToCart\('([^']+)'/);

    if (!match) return;

    const pid = match[1];

    const body = card.querySelector('.product-body');

    const footer = card.querySelector('.product-footer');

    if (!body || !footer) return;

    const productName = (
      (card.querySelector('.product-name') || {}).textContent || pid
    ).trim();

    const ratingData = calculateRating(reviews, pid);

    const ratingBox = document.createElement('div');

    ratingBox.style.cssText = `
      display:flex;
      justify-content:space-between;
      align-items:center;
      margin:8px 0;
      gap:10px;
    `;

    ratingBox.innerHTML = `

      <div id="star-display-${pid}"
        style="
          display:flex;
          align-items:center;
          gap:5px;
          direction:ltr;
        ">

        ${renderStars(Math.round(ratingData.avg), 15)}

        <span style="
          color:#999;
          font-size:12px;
        ">
          (${ratingData.count})
        </span>

      </div>

      <button
        id="rate-toggle-${pid}"
        onclick="toggleRateForm('${pid}')"
        style="
          background:none;
          border:none;
          color:#aaa;
          cursor:pointer;
          font-size:.8rem;
          text-decoration:underline;
          font-family:Cairo,sans-serif;
        ">
        + قيّم
      </button>

    `;

    body.insertBefore(ratingBox, footer);

    const form = document.createElement('div');

    form.id = `rate-form-${pid}`;

    form.style.cssText = `
      display:none;
      flex-direction:column;
      gap:8px;
      margin-bottom:10px;
      padding:12px;
      border:1px solid #222;
      background:#161616;
      border-radius:10px;
    `;

    form.innerHTML = `

      <div
        id="stars-int-${pid}"
        data-val="5"
        style="
          display:flex;
          gap:4px;
          direction:ltr;
        ">
      </div>

      <input
        type="text"
        id="ra-${pid}"
        placeholder="اسمك *"
        style="
          background:#000;
          border:1px solid #222;
          color:#fff;
          border-radius:6px;
          padding:10px;
          font-family:Cairo,sans-serif;
        "
      />

      <textarea
        id="rc-${pid}"
        rows="2"
        placeholder="تعليقك"
        style="
          background:#000;
          border:1px solid #222;
          color:#fff;
          border-radius:6px;
          padding:10px;
          resize:none;
          font-family:Cairo,sans-serif;
        "
      ></textarea>

      <button
        onclick="submitProductReview('${pid}', '${productName.replace(/'/g,"\\'")}')"
        style="
          background:#e00000;
          color:#fff;
          border:none;
          border-radius:6px;
          padding:10px;
          font-family:Cairo,sans-serif;
          font-weight:700;
          cursor:pointer;
        ">
        إرسال التقييم
      </button>

      <div
        id="rmsg-${pid}"
        style="
          display:none;
          color:#4caf50;
          text-align:center;
          font-weight:700;
        ">
        ✅ تم إرسال التقييم
      </div>

    `;

    body.insertBefore(form, footer);

    const starsWrap = form.querySelector(`#stars-int-${pid}`);

    for (let i = 1; i <= 5; i++) {

      const star = document.createElement('span');

      star.innerHTML = '★';

      star.dataset.v = i;

      star.style.cssText = `
        font-size:28px;
        cursor:pointer;
        color:${i <= 5 ? '#f5a623' : '#444'};
      `;

      star.addEventListener('click', function(){

        starsWrap.dataset.val = i;

        starsWrap.querySelectorAll('span').forEach(function(s){

          s.style.color =
            parseInt(s.dataset.v) <= i
            ? '#f5a623'
            : '#444';

        });

      });

      starsWrap.appendChild(star);

    }

  });

}

/* =========================
   فتح وغلق الفورم
========================= */

function toggleRateForm(pid) {

  const form = document.getElementById(`rate-form-${pid}`);

  const btn = document.getElementById(`rate-toggle-${pid}`);

  if (!form) return;

  const open = form.style.display === 'flex';

  form.style.display = open ? 'none' : 'flex';

  if (btn) {

    btn.textContent = open ? '+ قيّم' : 'إلغاء';

  }

}

/* =========================
   إرسال تقييم منتج
========================= */

async function submitProductReview(pid, productName) {

  const starsWrap = document.getElementById(`stars-int-${pid}`);

  const authorEl = document.getElementById(`ra-${pid}`);

  const commentEl = document.getElementById(`rc-${pid}`);

  const msgEl = document.getElementById(`rmsg-${pid}`);

  const rating = parseInt(starsWrap.dataset.val) || 5;

  const author = authorEl.value.trim();

  const comment = commentEl.value.trim();

  if (!author) {

    showToast("✏️ اكتب اسمك");

    return;

  }

  const result = await saveReview({

    productId: pid,

    productName: productName,

    author: author,

    rating: rating,

    comment: comment,

    date: new Date().toLocaleDateString('ar-EG')

  });

  if (result.success) {

    msgEl.style.display = 'block';

    showToast("✅ تم إرسال التقييم");

    setTimeout(() => {

      location.reload();

    }, 1200);

  } else {

    showToast("❌ فشل الإرسال");

  }

}

/* =========================
   صفحة التقييمات
========================= */

async function renderReviewsList() {

  const container = document.getElementById('reviewsList');

  if (!container) return;

  const reviews = await getAllReviews();

  if (!reviews.length) {

    container.innerHTML = `
      <div style="
        text-align:center;
        padding:60px 20px;
        background:var(--card);
        border:1px solid var(--border);
        border-radius:12px;
      ">
        <div style="font-size:3rem;margin-bottom:12px;">💬</div>
        <p style="color:var(--gray);">
          لا توجد تقييمات بعد
        </p>
      </div>
    `;

    return;

  }

  container.innerHTML = reviews.map(function(r){

    return `

      <div style="
        background:var(--card);
        border:1px solid var(--border);
        border-radius:12px;
        padding:20px;
        margin-bottom:15px;
      ">

        <div style="
          display:flex;
          justify-content:space-between;
          gap:10px;
          margin-bottom:10px;
          flex-wrap:wrap;
        ">

          <div>

            <div style="
              font-weight:800;
              margin-bottom:5px;
            ">
              ${r.author}
            </div>

            <div style="
              color:var(--red);
              font-size:.82rem;
            ">
              ${r.productName}
            </div>

          </div>

          <div>
            ${renderStars(Number(r.rating), 15)}
          </div>

        </div>

        <div style="
          color:#ddd;
          line-height:1.8;
        ">
          ${r.comment || 'بدون تعليق'}
        </div>

      </div>

    `;

  }).join('');

}

/* =========================
   فورم صفحة التقييمات
========================= */

function initReviewForm() {

  const form = document.getElementById('reviewPageForm');

  if (!form) return;

  const starsContainer = document.getElementById('formStars');

  if (starsContainer) {

    starsContainer.dataset.val = "5";

    for (let i = 1; i <= 5; i++) {

      const star = document.createElement('span');

      star.innerHTML = '★';

      star.dataset.v = i;

      star.style.cssText = `
        font-size:32px;
        color:#f5a623;
        cursor:pointer;
      `;

      star.addEventListener('click', function(){

        starsContainer.dataset.val = i;

        starsContainer.querySelectorAll('span').forEach(function(s){

          s.style.color =
            parseInt(s.dataset.v) <= i
            ? '#f5a623'
            : '#444';

        });

      });

      starsContainer.appendChild(star);

    }

  }

  form.addEventListener('submit', async function(e){

    e.preventDefault();

    const pid = document.getElementById('fpid').value;

    const author = document.getElementById('fauthor').value.trim();

    const comment = document.getElementById('fcomment').value.trim();

    const rating =
      parseInt(starsContainer.dataset.val) || 5;

    const productName =
      document.getElementById('fpid')
      .options[
        document.getElementById('fpid').selectedIndex
      ].text;

    if (!pid || !author) {

      showToast("⭐ أكمل البيانات");

      return;

    }

    const result = await saveReview({

      productId: pid,

      productName: productName,

      author: author,

      rating: rating,

      comment: comment,

      date: new Date().toLocaleDateString('ar-EG')

    });

    if (result.success) {

      document.getElementById('formMsg').style.display = 'block';

      showToast("✅ تم إرسال التقييم");

      setTimeout(() => {

        location.reload();

      }, 1200);

    } else {

      showToast("❌ فشل إرسال التقييم");

    }

  });

}

/* =========================
   القائمة الجانبية
========================= */

function initHamburger() {

  const btn = document.getElementById('hamburgerBtn');

  const menu = document.getElementById('mobileMenu');

  if (!btn || !menu) return;

  btn.addEventListener('click', function(){

    const open = menu.classList.contains('open');

    if (open) {

      menu.classList.remove('open');

      btn.classList.remove('open');

      document.body.style.overflow = '';

    } else {

      menu.classList.add('open');

      btn.classList.add('open');

      document.body.style.overflow = 'hidden';

    }

  });

}

/* =========================
   تشغيل
========================= */

document.addEventListener('DOMContentLoaded', async function(){

  initHamburger();

  await initProductRatings();

  if (document.getElementById('reviewsList')) {

    await renderReviewsList();

    initReviewForm();

  }

});