const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyyO307odi5jMtJtnJtG8qJd6QiOa1dXTnd79Q56XVT8pGOXexyCGCXksJqpxmZgIW4dA/exec";

/* =========================
   تحميل التقييمات من السيرفر
========================= */

async function getAllReviews() {

  try {

    const res = await fetch(SCRIPT_URL);

    return await res.json();

  } catch (e) {

    console.error(e);

    return [];

  }

}

/* =========================
   إرسال تقييم للسيرفر
========================= */

async function saveReview(review) {

  try {

    const res = await fetch(SCRIPT_URL, {

      method: "POST",

      body: JSON.stringify(review)

    });

    return await res.json();

  } catch (e) {

    console.error(e);

    return { success: false };

  }

}

/* =========================
   رسم النجوم
========================= */

function renderStars(val, size) {

  size = size || 14;

  let html = '';

  for (let i = 1; i <= 5; i++) {

    html += `
      <span style="
        color:${i <= val ? '#f5a623' : '#444'};
        font-size:${size}px;
        line-height:1;
      ">★</span>
    `;

  }

  return html;

}

/* =========================
   متوسط تقييم منتج
========================= */

async function getRating(pid) {

  const reviews = await getAllReviews();

  const productReviews = reviews.filter(r => r.productId === pid);

  if (!productReviews.length) {

    return { avg: 0, count: 0 };

  }

  const total = productReviews.reduce((s, r) => s + Number(r.rating), 0);

  return {

    avg: total / productReviews.length,

    count: productReviews.length

  };

}

/* =========================
   تقييم المنتجات
========================= */

async function initProductRatings() {

  const allReviews = await getAllReviews();

  document.querySelectorAll('.product-card').forEach(async function(card){

    var btn = card.querySelector('.btn-add');

    if(!btn) return;

    var match = (btn.getAttribute('onclick') || '').match(/addToCart\('([^']+)'/);

    if(!match) return;

    var pid = match[1];

    var body = card.querySelector('.product-body');

    var footer = card.querySelector('.product-footer');

    if(!body || !footer) return;

    const productReviews = allReviews.filter(r => r.productId === pid);

    const total = productReviews.reduce((s,r)=>s+Number(r.rating),0);

    const avg = productReviews.length ? total / productReviews.length : 0;

    var productName = ((card.querySelector('.product-name') || {}).textContent || pid)
      .trim()
      .replace(/'/g,"\\'");

    var starRow = document.createElement('div');

    starRow.style.cssText = `
      display:flex;
      align-items:center;
      justify-content:space-between;
      margin:6px 0 4px;
    `;

    starRow.innerHTML = `
      <div id="star-display-${pid}"
        style="display:flex;align-items:center;gap:4px;direction:ltr;">
        ${renderStars(Math.round(avg),14)}
        <span style="font-size:11px;color:#999;margin-right:2px;">
          (${productReviews.length})
        </span>
      </div>

      <button
        onclick="toggleRateForm('${pid}')"
        style="
          background:none;
          border:none;
          color:#999;
          font-size:.73rem;
          cursor:pointer;
          font-family:Cairo,sans-serif;
          text-decoration:underline;
          padding:0;
        "
        id="rate-toggle-${pid}">
        + قيّم
      </button>
    `;

    body.insertBefore(starRow, footer);

    var form = document.createElement('div');

    form.id = 'rate-form-' + pid;

    form.style.cssText = `
      display:none;
      flex-direction:column;
      gap:8px;
      padding:12px;
      background:#161616;
      border:1px solid #222;
      border-radius:8px;
      margin-bottom:8px;
    `;

    form.innerHTML = `
      <div id="stars-int-${pid}"
        style="display:flex;gap:2px;direction:ltr;cursor:pointer;"
        data-val="0">

        ${[1,2,3,4,5].map(function(s){

          return `
            <span
              data-v="${s}"
              onclick="pickStar('${pid}',${s})"
              onmouseenter="hoverStar('${pid}',${s})"
              onmouseleave="unhoverStar('${pid}')"
              style="
                font-size:24px;
                color:#444;
                line-height:1;
                transition:color .1s;
              ">
              ★
            </span>
          `;

        }).join('')}

      </div>

      <input
        type="text"
        id="ra-${pid}"
        placeholder="اسمك *"
        style="
          background:#000;
          border:1px solid #222;
          border-radius:6px;
          color:#fff;
          padding:8px 10px;
          font-family:Cairo,sans-serif;
          font-size:.82rem;
          outline:none;
          width:100%;
        "
      />

      <textarea
        id="rc-${pid}"
        rows="2"
        placeholder="تعليقك"
        style="
          background:#000;
          border:1px solid #222;
          border-radius:6px;
          color:#fff;
          padding:8px 10px;
          font-family:Cairo,sans-serif;
          font-size:.82rem;
          outline:none;
          width:100%;
          resize:none;
        "
      ></textarea>

      <div id="rmsg-${pid}"
        style="
          display:none;
          color:#4caf50;
          font-weight:700;
          font-size:.82rem;
          text-align:center;
        ">
        ✅ شكراً على تقييمك!
      </div>

      <button
        onclick="submitProductReview('${pid}','${productName}')"
        style="
          background:#e00000;
          color:#fff;
          border:none;
          border-radius:6px;
          padding:8px;
          font-family:Cairo,sans-serif;
          font-weight:700;
          font-size:.82rem;
          cursor:pointer;
        ">
        إرسال التقييم
      </button>
    `;

    body.insertBefore(form, footer);

  });

}

function toggleRateForm(pid){

  var form = document.getElementById('rate-form-'+pid);

  var toggle = document.getElementById('rate-toggle-'+pid);

  if(!form) return;

  var isOpen = form.style.display === 'flex';

  form.style.display = isOpen ? 'none' : 'flex';

  if(toggle) toggle.textContent = isOpen ? '+ قيّم' : 'إلغاء';

}

function pickStar(pid,val){

  var c=document.getElementById('stars-int-'+pid);

  if(!c)return;

  c.dataset.val=val;

  c.querySelectorAll('span').forEach(function(s){

    s.style.color=parseInt(s.dataset.v)<=val?'#f5a623':'#444';

  });

}

function hoverStar(pid,val){

  var c=document.getElementById('stars-int-'+pid);

  if(!c)return;

  c.querySelectorAll('span').forEach(function(s){

    s.style.color=parseInt(s.dataset.v)<=val?'#f5a623':'#444';

  });

}

function unhoverStar(pid){

  var c=document.getElementById('stars-int-'+pid);

  if(!c)return;

  var sel=parseInt(c.dataset.val)||0;

  c.querySelectorAll('span').forEach(function(s){

    s.style.color=parseInt(s.dataset.v)<=sel?'#f5a623':'#444';

  });

}

/* =========================
   إرسال تقييم المنتج
========================= */

async function submitProductReview(pid, productName){

  var c=document.getElementById('stars-int-'+pid);

  var authorEl=document.getElementById('ra-'+pid);

  var commentEl=document.getElementById('rc-'+pid);

  var msgEl=document.getElementById('rmsg-'+pid);

  if(!c||!authorEl)return;

  var rating=parseInt(c.dataset.val)||0;

  var author=authorEl.value.trim();

  if(!rating){

    alert('⭐ اختار عدد النجوم');

    return;

  }

  if(!author){

    alert('✏️ اكتب اسمك');

    return;

  }

  await saveReview({

    productId: pid,

    productName: productName,

    author: author,

    rating: rating,

    comment: commentEl ? commentEl.value.trim() : '',

    date: new Date().toLocaleDateString('ar-EG')

  });

  if(msgEl) msgEl.style.display='block';

  setTimeout(function(){

    location.reload();

  },1000);

}

/* =========================
   قائمة التقييمات
========================= */

async function renderReviewsList(){

  var container=document.getElementById('reviewsList');

  if(!container)return;

  var reviews=await getAllReviews();

  if(!reviews.length){

    container.innerHTML=`
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
        margin-bottom:14px;
      ">

        <div style="
          display:flex;
          justify-content:space-between;
          margin-bottom:8px;
          flex-wrap:wrap;
          gap:10px;
        ">

          <div>

            <div style="font-weight:800;">
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
            ${renderStars(r.rating,14)}
          </div>

        </div>

        <p style="
          color:var(--light);
          line-height:1.7;
        ">
          ${r.comment || 'بدون تعليق'}
        </p>

      </div>
    `;

  }).join('');

}

/* =========================
   صفحة التقييمات
========================= */

function initReviewForm(){

  var form=document.getElementById('reviewPageForm');

  if(!form)return;

  var starsContainer=document.getElementById('formStars');

  if(starsContainer){

    starsContainer.dataset.val='0';

    starsContainer.innerHTML=[1,2,3,4,5].map(function(s){

      return `
        <span
          data-v="${s}"
          style="
            font-size:32px;
            color:#444;
            cursor:pointer;
            line-height:1;
          ">
          ★
        </span>
      `;

    }).join('');

    starsContainer.querySelectorAll('span').forEach(function(star){

      star.addEventListener('mouseenter',function(){

        var v=parseInt(star.dataset.v);

        starsContainer.querySelectorAll('span').forEach(function(s){

          s.style.color=parseInt(s.dataset.v)<=v?'#f5a623':'#444';

        });

      });

      star.addEventListener('mouseleave',function(){

        var sel=parseInt(starsContainer.dataset.val)||0;

        starsContainer.querySelectorAll('span').forEach(function(s){

          s.style.color=parseInt(s.dataset.v)<=sel?'#f5a623':'#444';

        });

      });

      star.addEventListener('click',function(){

        starsContainer.dataset.val=star.dataset.v;

      });

    });

  }

  form.addEventListener('submit', async function(e){

    e.preventDefault();

    var pid=document.getElementById('fpid').value;

    var author=document.getElementById('fauthor').value.trim();

    var comment=document.getElementById('fcomment').value.trim();

    var rating=starsContainer?parseInt(starsContainer.dataset.val)||0:0;

    var productName=document.getElementById('fpid')
      .options[document.getElementById('fpid').selectedIndex].text;

    if(!pid||!author||!rating){

      alert('⭐ أكمل البيانات');

      return;

    }

    await saveReview({

      productId: pid,

      productName: productName,

      author: author,

      rating: rating,

      comment: comment,

      date: new Date().toLocaleDateString('ar-EG')

    });

    var msg=document.getElementById('formMsg');

    if(msg) msg.style.display='block';

    form.reset();

    setTimeout(function(){

      location.reload();

    },1000);

  });

}

/* =========================
   هامبرجر
========================= */

function initHamburger(){

  var btn=document.getElementById('hamburgerBtn');

  var menu=document.getElementById('mobileMenu');

  if(!btn||!menu)return;

  btn.addEventListener('click',function(){

    var isOpen=menu.classList.contains('open');

    if(isOpen){

      menu.classList.remove('open');

      btn.classList.remove('open');

      document.body.style.overflow='';

    } else {

      menu.classList.add('open');

      btn.classList.add('open');

      document.body.style.overflow='hidden';

    }

  });

}

/* =========================
   تشغيل
========================= */

document.addEventListener('DOMContentLoaded',function(){

  initProductRatings();

  initHamburger();

  if(document.getElementById('reviewsList')){

    renderReviewsList();

    initReviewForm();

  }

});