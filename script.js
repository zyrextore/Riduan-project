const $=s=>document.querySelector(s), $$=s=>document.querySelectorAll(s);
window.addEventListener('load',()=>setTimeout(()=>$('#boot')?.classList.add('hide'),1400));

// theme
$('#themeBtn')?.addEventListener('click',()=>{document.body.classList.toggle('light');localStorage.setItem('zyrex-theme',document.body.classList.contains('light')?'light':'dark')});

// mobile nav dropdown (nav is hidden by CSS on narrow screens; this toggles it)
const navToggleBtn=$('#navToggle');
if(navToggleBtn){
  navToggleBtn.addEventListener('click',()=>{
    const open=document.body.classList.toggle('zx-nav-open');
    navToggleBtn.setAttribute('aria-expanded',open?'true':'false');
    navToggleBtn.textContent=open?'✕':'☰';
  });
  $$('#nav a').forEach(a=>a.addEventListener('click',()=>{
    document.body.classList.remove('zx-nav-open');
    navToggleBtn.setAttribute('aria-expanded','false');
    navToggleBtn.textContent='☰';
  }));
}
if(localStorage.getItem('zyrex-theme')==='light')document.body.classList.add('light');

// cursor (desktop only)
const cursor=$('#cursor'),dot=$('#cursorDot');
if(matchMedia('(pointer:coarse)').matches){document.body.classList.add('touch-device')}
if(cursor&&dot&&!document.body.classList.contains('touch-device')){
  document.addEventListener('mousemove',e=>{cursor.style.transform=`translate(${e.clientX-16}px,${e.clientY-16}px)`;dot.style.transform=`translate(${e.clientX-3}px,${e.clientY-3}px)`});
  $$('a,button,.work-card').forEach(el=>{el.addEventListener('mouseenter',()=>cursor.classList.add('active'));el.addEventListener('mouseleave',()=>cursor.classList.remove('active'))});
}

// filters
$$('.filters button').forEach(btn=>btn.addEventListener('click',()=>{$$('.filters button').forEach(x=>x.classList.remove('active'));btn.classList.add('active');const f=btn.dataset.filter;$$('.work-card').forEach(c=>c.style.display=f==='all'||c.dataset.cat===f?'':'none')}));

// project modal
const modal=$('#projectModal');
$$('.work-card').forEach(card=>card.addEventListener('click',()=>{const d=card.dataset;$('#modalTag').textContent=d.cat.toUpperCase()+' // PROJECT';$('#modalTitle').textContent=d.title;$('#modalDesc').textContent=d.desc;$('#modalTags').innerHTML=d.tags.split(',').map(x=>`<i>${x}</i>`).join('');modal.classList.add('open')}));
$('#modalClose')?.addEventListener('click',()=>modal.classList.remove('open'));
modal?.addEventListener('click',e=>{if(e.target===modal)modal.classList.remove('open')});
$('#modalStart')?.addEventListener('click',()=>modal.classList.remove('open'));

// command palette
const command=$('#command'),openCmd=()=>{command.classList.add('open');$('#commandInput').focus()};
$('#cmdBtn')?.addEventListener('click',openCmd);
document.addEventListener('keydown',e=>{
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openCmd()}
  if(e.key==='Escape'){command.classList.remove('open');modal.classList.remove('open')}
  if(e.key==='/' && !['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)){e.preventDefault();openCmd()}
});
$('#commandInput')?.addEventListener('input',e=>{const q=e.target.value.toLowerCase();$$('#commandList button').forEach(b=>b.style.display=b.textContent.toLowerCase().includes(q)?'block':'none')});
$$('#commandList button').forEach(b=>b.addEventListener('click',()=>{command.classList.remove('open');$(b.dataset.go)?.scrollIntoView({behavior:'smooth'})}));
command?.addEventListener('click',e=>{if(e.target===command)command.classList.remove('open')});

// terminal
const term=$('#termInput');
term?.addEventListener('keydown',e=>{
  if(e.key!=='Enter')return;
  const v=term.value.trim().toLowerCase(),out=$('#terminal');
  const lines={help:'commands: help, about, status, projects, clear, matrix',about:'ZYREX // independent digital lab.',status:'SYSTEM: ONLINE | MODE: BUILD LOUD',projects:'24+ builds indexed.',matrix:'01011010 01011000 // ZX'};
  if(v==='clear'){out.innerHTML='<p class="prompt"><b>zyrex@lab</b>:~$ <input id="termInput" autocomplete="off"></p>'}
  else{const p=document.createElement('p');p.innerHTML=`<b>zyrex@lab</b>:~$ ${v}<br><span>${lines[v]||'command not found — try help'}</span>`;out.insertBefore(p,out.querySelector('.prompt'));term.value='';}
  $('#termInput')?.focus()
});

// lab tabs
$$('.lab-tab').forEach(b=>b.addEventListener('click',()=>{$$('.lab-tab').forEach(x=>x.classList.remove('active'));$$('.lab-panel').forEach(x=>x.classList.remove('active'));b.classList.add('active');$('#panel-'+b.dataset.panel).classList.add('active')}));

// tools
$$('.tools button').forEach(b=>b.addEventListener('click',()=>{
  const t=b.dataset.tool,o=$('#toolOutput');
  if(t==='palette')o.textContent='ZX PALETTE → #FF7A45 / #3FD9AC / #0A0C10 / #8890A0';
  if(t==='clock')o.textContent='LOCAL TIME → '+new Date().toLocaleTimeString('id-ID');
  if(t==='count')o.textContent='PROJECT INDEX → 24+ builds / 6 showcased';
  if(t==='random'){o.textContent='RANDOM MODE → not available in this build.'}
}));

// cart + order engine — V517 cloud checkout
let cart=JSON.parse(localStorage.getItem('zyrex-cart')||'[]');
let orders=JSON.parse(localStorage.getItem('zyrex-orders')||'[]');
const money=n=>'Rp'+Number(n||0).toLocaleString('id-ID');
const waNumber='6287757131994';
const totalCart=()=>cart.reduce((a,x)=>a+x.price*x.qty,0);
function renderCart(){
  const count=$('#cartCount'),items=$('#cartItems'),total=$('#cartTotal');
  if(count)count.textContent=cart.reduce((a,x)=>a+x.qty,0);
  if(items)items.innerHTML=cart.length?cart.map((x,i)=>`<div class="cart-item"><span>${x.name} ×${x.qty}</span><span>${money(x.price*x.qty)} <button data-remove="${i}" aria-label="Remove ${x.name}">×</button></span></div>`).join(''):'<p class="empty">Cart masih kosong.</p>';
  if(total)total.textContent=money(totalCart());
  $$('[data-remove]').forEach(b=>b.onclick=()=>{cart.splice(+b.dataset.remove,1);saveCart()});
  renderOrderSummary();
}
function saveCart(){localStorage.setItem('zyrex-cart',JSON.stringify(cart));renderCart()}
$$('[data-add]').forEach(b=>b.addEventListener('click',()=>{const p=b.closest('.product'),name=p.dataset.name,price=+p.dataset.price,found=cart.find(x=>x.name===name);found?found.qty++:cart.push({name,price,qty:1});saveCart();toast(name+' ADDED TO CART')}));
$('#clearCart')?.addEventListener('click',()=>{cart=[];saveCart();toast('CART CLEARED')});
function renderOrderSummary(){const box=$('#orderSummary');if(!box)return;box.innerHTML=cart.length?cart.map(x=>`<div class="order-line"><span>${x.name} ×${x.qty}</span><span>${money(x.price*x.qty)}</span></div>`).join('')+`<div class="order-total"><span>TOTAL</span><strong>${money(totalCart())}</strong></div>`:'<p class="empty">Belum ada order. Tambahkan produk dari Store.</p>'}
function saveOrders(){window.orders=orders;localStorage.setItem('zyrex-orders',JSON.stringify(orders))}
async function createCloudOrder(){
  if(!cart.length)return null;
  try{
    const r=await fetch('/.netlify/functions/create-order',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items:cart,total:totalCart()})});
    const data=await r.json().catch(()=>({}));
    if(r.ok && data.order?.orderId && data.order?.accessCode){
      const o=data.order;
      sessionStorage.setItem('zyrex-access-'+o.orderId,o.accessCode);
      orders.unshift(o);orders=orders.slice(0,10);saveOrders();return o;
    }
  }catch(e){}
  // Safe local mode: the storefront remains usable when the API/database is not configured.
  const stamp=Date.now().toString(36).toUpperCase();
  const o={orderId:`ZX-${stamp}`,invoiceId:`INV-${stamp}`,accessCode:Math.random().toString(36).slice(2,12).toUpperCase(),items:JSON.parse(JSON.stringify(cart)),total:totalCart(),paymentMethod:'QRIS',paymentStatus:'PENDING',orderStatus:'ORDER CREATED',status:'PENDING PAYMENT',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),local:true};
  sessionStorage.setItem('zyrex-access-'+o.orderId,o.accessCode);
  orders.unshift(o);orders=orders.slice(0,10);saveOrders();return o;
}
$('#createOrder')?.addEventListener('click',async()=>{
  if(!cart.length)return toast('ADD PRODUCT FIRST');
  const btn=$('#createOrder');
  try{
    btn.disabled=true;btn.textContent='CREATING ORDER...';
    const o=await createCloudOrder();
    toast((o.orderId||o.id)+' CREATED');
    window.ZYREXAppRouter?.openPage('checkout');
    setTimeout(()=>startCheckoutForOrder(o.orderId||o.id),200);
  }catch(e){toast(e.message||'ORDER CREATION FAILED')}
  finally{btn.disabled=false;btn.textContent='CREATE ORDER ID ↗'}
});
window.orders=orders;renderCart();

// contact form
$('#projectForm')?.addEventListener('submit',e=>{
  e.preventDefault();
  const d=new FormData(e.target);
  const text=`Halo ZYREX!%0A%0ANama: ${d.get('name')}%0AProject: ${d.get('type')}%0ABudget: ${d.get('budget')}%0A%0ABrief:%0A${d.get('brief')}`;
  window.open('https://wa.me/6287757131994?text='+encodeURIComponent(text),'_blank');
});

function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1800)}

// ---- one reveal-on-scroll system ----
const revealTargets=$$('.section,.work-card,.service-grid article,.app-card,.product');
revealTargets.forEach((el,i)=>{el.classList.add('reveal');el.style.transitionDelay=(Math.min(i%5,4)*55)+'ms'});
if('IntersectionObserver' in window){
  const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.08});
  revealTargets.forEach(e=>io.observe(e));
}else revealTargets.forEach(e=>e.classList.add('in'));

// ---- one active-nav-on-scroll system ----
const navLinks=[...$$('#nav a')];
const navSections=navLinks.map(a=>{const href=a.getAttribute('href');if(!href||!href.startsWith('#'))return null;return {a,s:document.querySelector(href)}}).filter(x=>x&&x.s);
if('IntersectionObserver' in window){
  const navObs=new IntersectionObserver(es=>es.forEach(e=>{
    if(e.isIntersecting){navLinks.forEach(a=>a.classList.remove('nav-active'));const x=navSections.find(x=>x.s===e.target);x?.a.classList.add('nav-active')}
  }),{rootMargin:'-35% 0px -55% 0px'});
  navSections.forEach(x=>navObs.observe(x.s));
}

// magnetic hover on primary CTAs (desktop only, cheap)
if(matchMedia('(pointer:fine)').matches){
  $$('.btn.hot,.contact-links a').forEach(el=>{
    el.addEventListener('mousemove',e=>{const r=el.getBoundingClientRect();const x=(e.clientX-r.left-r.width/2)*.08,y=(e.clientY-r.top-r.height/2)*.08;el.style.transform=`translate(${x}px,${y}px)`});
    el.addEventListener('mouseleave',()=>el.style.transform='');
  });
}

// live clock + rotating status signal (hero)
const clock=$('#liveClock'),status=$('#liveStatus');
const signals=['ALL SYSTEMS NOMINAL','BUILD PIPELINE READY','ZX LAB ONLINE','WAITING FOR NEXT IDEA'];
let si=0;
const tick=()=>{if(clock)clock.textContent=new Date().toLocaleTimeString('id-ID',{hour12:false})};
tick();setInterval(tick,1000);
setInterval(()=>{si=(si+1)%signals.length;if(status){status.style.opacity='0';setTimeout(()=>{status.textContent=signals[si];status.style.opacity='1'},180)}},4200);

/* ===== DASHBOARD / FEATURE NAVIGATION =====
   Navigation is handled by the dedicated app router below.
   The old anchor-scrolling router is intentionally disabled so feature
   views never become sections underneath each other. */

/* ===== EARTHQUAKE RADAR DEDICATED VIEW — robust mount/unmount ===== */
(()=>{
  const view=document.getElementById('radarView');
  const card=document.querySelector('.app-hub .radar-card');
  if(!view||!card)return;
  const shell=view.querySelector('.radar-view-shell');
  const placeholder=document.createComment('ZYREX-RADAR-CARD-ANCHOR');
  card.parentNode.insertBefore(placeholder,card);

  const syncMap=()=>setTimeout(()=>{
    window.dispatchEvent(new Event('resize'));
    window.ZYREXRadarMap?.invalidateSize(true);
  },180);

  const open=()=>{
    if(!card.parentNode || card.parentNode===shell)return;
    shell.appendChild(card);
    view.classList.add('open');
    view.setAttribute('aria-hidden','false');
    document.body.classList.add('radar-open');
    syncMap();
  };
  const close=()=>{
    if(placeholder.parentNode && card.parentNode===shell){
      placeholder.parentNode.insertBefore(card,placeholder);
    }
    view.classList.remove('open');
    view.setAttribute('aria-hidden','true');
    document.body.classList.remove('radar-open');
    syncMap();
  };
  document.addEventListener('click',e=>{
    const trigger=e.target.closest('[data-radar-open]');
    if(trigger){e.preventDefault();e.stopPropagation();open();return;}
    if(e.target.closest('[data-radar-close]')){e.preventDefault();close();}
  },true);
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&view.classList.contains('open'))close();
  });
  window.ZYREXRadarView={open,close};
})();

/* ===== AI DEDICATED VIEW — mirrors the Radar mount/unmount pattern =====
   Fixes the bug where the AI menu opened an empty workspace: the AI
   app-card now actually moves into its own full view, same as Radar. */
(()=>{
  const view=document.getElementById('aiView');
  const card=document.querySelector('.app-hub .app-card:not(.radar-card)');
  if(!view||!card)return;
  const shell=view.querySelector('.workspace-shell');
  const placeholder=document.createComment('ZYREX-AI-CARD-ANCHOR');
  card.parentNode.insertBefore(placeholder,card);

  const open=()=>{
    if(!card.parentNode || card.parentNode===shell)return;
    shell.appendChild(card);
    view.classList.add('open');
    view.setAttribute('aria-hidden','false');
  };
  const close=()=>{
    if(placeholder.parentNode && card.parentNode===shell){
      placeholder.parentNode.insertBefore(card,placeholder);
    }
    view.classList.remove('open');
    view.setAttribute('aria-hidden','true');
  };
  document.addEventListener('click',e=>{
    if(e.target.closest('[data-ai-open]')){e.preventDefault();e.stopPropagation();window.ZYREXAppRouter?.openPage('ai');return;}
  },true);
  window.ZYREXAIView={open,close};
})();

// keep the tapped nav pill scrolled into view on the horizontal mobile bar
$('#nav')?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{
  a.scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'});
}));

/* V533 — TRUE APP VIEW NAVIGATION. Dashboard is portfolio-only and fixed.
   Every other feature gets its own viewport; scrolling is local to that feature. */
(()=>{
  const q=s=>document.querySelector(s), qa=s=>[...document.querySelectorAll(s)];
  const pages={home:q('#home'),work:q('#work'),services:q('#services'),lab:q('#lab'),store:q('#store'),checkout:q('#payment-checkout'),portal:q('#customer-portal'),about:q('#about'),contact:q('#contact'),account:q('#account')};
  const aiView=q('#aiView');

  const pageKeys=Object.keys(pages).concat(['ai','radar','gesture']);
  const closeSpecial=()=>{
    try{window.ZYREXAIView?.close?.();}catch(e){}
    try{window.ZYREXRadarView?.close?.();}catch(e){}
    try{window.ZYREXGestureView?.close?.();}catch(e){}
  };
  const setNav=page=>qa('[data-zx-page]').forEach(a=>a.classList.toggle('zx-active',a.dataset.zxPage===page));
  const hidePages=()=>qa('.zx-page-active').forEach(x=>x.classList.remove('zx-page-active'));

  const open=raw=>{
    let page=pageKeys.includes(raw)?raw:'home';
    closeSpecial(); hidePages(); setNav(page);
    if(page==='ai'){
      try{window.ZYREXAIView?.open?.();}catch(e){}
    }else if(page==='radar'){
      try{window.ZYREXRadarView?.open?.();}catch(e){}
    }else if(page==='gesture'){
      try{window.ZYREXGestureView?.open?.();}catch(e){}
    }else{
      pages[page]?.classList.add('zx-page-active');
    }
    document.body.dataset.zxView=page;
    document.body.classList.toggle('zx-dashboard',page==='home');
    document.body.classList.toggle('zx-feature',page!=='home');
    if(location.hash!==`#${page}`) history.pushState({page},'',`#${page}`);
    if(page!=='home') q('.zx-page-active')?.scrollTo?.(0,0);
  };

  // Lock the dashboard/feature-view mode FIRST, before anything else below
  // that could possibly throw — this is the one thing that must always run.
  document.body.classList.add('zx-app-mode');
  open((location.hash||'#home').slice(1).toLowerCase());
  window.ZYREXAppRouter={openPage:open};

  try{
    qa('[data-zx-page]').forEach(a=>a.addEventListener('click',e=>{
      e.preventDefault(); e.stopPropagation(); open(a.dataset.zxPage);
    }));
    qa('[data-zx-goto]').forEach(a=>a.addEventListener('click',e=>{
      e.preventDefault(); e.stopPropagation(); open(a.dataset.zxGoto);
    }));
    qa('#home a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{
      const target=a.getAttribute('href')?.slice(1);
      if(pageKeys.includes(target)){e.preventDefault(); open(target);}
    }));
    aiView?.querySelectorAll('[data-ai-close]').forEach(x=>x.addEventListener('click',()=>open('home')));
    document.addEventListener('keydown',e=>{
      if(e.key==='Escape' && document.body.dataset.zxView!=='home') open('home');
    });
    addEventListener('popstate',()=>open((location.hash||'#home').slice(1).toLowerCase()));

    // Persistent Back/Dashboard control — always available on every feature view.
    const fab=document.createElement('button');
    fab.type='button'; fab.id='zxBackFab'; fab.className='zx-back-fab';
    fab.innerHTML='<span aria-hidden="true">←</span> <b>DASHBOARD</b>';
    fab.addEventListener('click',()=>open('home'));
    document.body.appendChild(fab);
  }catch(e){ console.error('ZYREX router: non-critical init error',e); }
})();


// ============================================================
// AKUN — login / register panel.
// Coba pakai API server (/.netlify/functions/register, /.netlify/functions/login, dst — akun
// tersimpan di Redis, bisa login dari HP manapun) kalau sudah
// di-deploy ke Vercel. Kalau API belum aktif (contoh: masih dibuka
// langsung dari file lokal / server belum dikonfigurasi), otomatis
// fallback ke localStorage supaya tetap bisa dites di perangkat ini.
// ============================================================
(function(){
  const USERS_KEY='zx-users';
  const SESSION_KEY='zx-session';
  let useApi=true; // diturunkan otomatis ke false kalau API tidak bisa dihubungi

  const getUsers=()=>{ try{ return JSON.parse(localStorage.getItem(USERS_KEY))||[] }catch(e){ return [] } };
  const saveUsers=(u)=>localStorage.setItem(USERS_KEY,JSON.stringify(u));
  const getSession=()=>{ try{ return JSON.parse(localStorage.getItem(SESSION_KEY)) }catch(e){ return null } };
  const hash=(str)=>{ let h=0; for(let i=0;i<str.length;i++){ h=(Math.imul(31,h)+str.charCodeAt(i))|0 } return String(h); };

  async function callApi(path,opts){
    try{
      const r=await fetch(path,{credentials:'include',headers:{'Content-Type':'application/json'},...opts});
      if(r.status===404) { useApi=false; return null; } // route not deployed
      return await r.json();
    }catch(e){ useApi=false; return null; }
  }

  const gate=$('#zx-authgate');
  const userView=$('#zx-auth-user');
  const loginForm=$('#zx-login-form');
  const registerForm=$('#zx-register-form');
  const loginErr=$('#zx-login-error');
  const registerErr=$('#zx-register-error');
  const accountBtnEl=$('#accountBtn');

  function showUser(user){
    gate?.classList.add('zx-gate-hidden');
    document.body.classList.remove('zx-gate-locked');
    userView?.classList.remove('hidden');
    $('#zx-user-name').textContent=user.name;
    $('#zx-user-email').textContent=user.email;
    if(accountBtnEl) accountBtnEl.textContent='🟢';
  }
  function showGuest(){
    gate?.classList.remove('zx-gate-hidden');
    document.body.classList.add('zx-gate-locked');
    userView?.classList.add('hidden');
    if(accountBtnEl) accountBtnEl.textContent='👤';
  }

  async function renderAuthState(){
    if(useApi){
      const res=await callApi('/.netlify/functions/session',{method:'GET'});
      if(res && res.ok){ showUser(res.user); return; }
      if(res && !res.ok){ showGuest(); return; } // API reachable, just no session
    }
    // fallback: local session
    const session=getSession();
    session ? showUser(session) : showGuest();
  }

  $$('.zx-auth-tab').forEach(tab=>{
    tab.addEventListener('click',()=>{
      $$('.zx-auth-tab').forEach(t=>t.classList.remove('active'));
      tab.classList.add('active');
      const which=tab.dataset.authTab;
      loginForm.classList.toggle('hidden',which!=='login');
      registerForm.classList.toggle('hidden',which!=='register');
      loginErr.textContent='';registerErr.textContent='';
    });
  });

  loginForm?.addEventListener('submit',async(e)=>{
    e.preventDefault();
    loginErr.textContent='';
    const email=$('#zx-login-email').value.trim().toLowerCase();
    const pass=$('#zx-login-pass').value;

    if(useApi){
      const res=await callApi('/.netlify/functions/login',{method:'POST',body:JSON.stringify({email,password:pass})});
      if(res){
        if(!res.ok){ loginErr.textContent=res.error||'Email atau password salah.'; return; }
        loginForm.reset(); showUser(res.user); return;
      }
      // res===null → API unreachable, useApi now false, fall through to local
    }
    const users=getUsers();
    const found=users.find(u=>u.email===email);
    if(!found || found.pass!==hash(pass)){ loginErr.textContent='Email atau password salah.'; return; }
    localStorage.setItem(SESSION_KEY,JSON.stringify({name:found.name,email:found.email}));
    loginForm.reset();
    showUser({name:found.name,email:found.email});
  });

  registerForm?.addEventListener('submit',async(e)=>{
    e.preventDefault();
    registerErr.textContent='';
    const name=$('#zx-reg-name').value.trim();
    const email=$('#zx-reg-email').value.trim().toLowerCase();
    const pass=$('#zx-reg-pass').value;
    const pass2=$('#zx-reg-pass2').value;
    if(pass.length<6){ registerErr.textContent='Password minimal 6 karakter.'; return; }
    if(pass!==pass2){ registerErr.textContent='Konfirmasi password tidak cocok.'; return; }

    if(useApi){
      const res=await callApi('/.netlify/functions/register',{method:'POST',body:JSON.stringify({name,email,password:pass})});
      if(res){
        if(!res.ok){ registerErr.textContent=res.error||'Gagal mendaftar.'; return; }
        registerForm.reset(); showUser(res.user); return;
      }
    }
    const users=getUsers();
    if(users.some(u=>u.email===email)){ registerErr.textContent='Email sudah terdaftar. Coba login.'; return; }
    users.push({name,email,pass:hash(pass)});
    saveUsers(users);
    localStorage.setItem(SESSION_KEY,JSON.stringify({name,email}));
    registerForm.reset();
    showUser({name,email});
  });

  $('#zx-logout-btn')?.addEventListener('click',async()=>{
    if(useApi) await callApi('/.netlify/functions/logout',{method:'POST'});
    localStorage.removeItem(SESSION_KEY);
    showGuest();
  });

  renderAuthState();
})();

// ============================================================
// RIWAYAT ORDER (halaman Akun) — hanya jalan kalau API server aktif,
// karena order & akun sama-sama tersimpan di Redis, bukan localStorage.
// ============================================================
(function(){
  const list=$('#zx-orders-list');
  if(!list) return;

  function money(n){ return 'Rp'+Number(n||0).toLocaleString('id-ID'); }
  function fmtDate(iso){ try{ return new Date(iso).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'}); }catch(e){ return iso||''; } }

  async function loadOrders(){
    try{
      const r=await fetch('/.netlify/functions/my-orders',{credentials:'include'});
      if(r.status===404){ list.innerHTML='<p class="zx-customer-muted">Riwayat order butuh server (belum aktif di mode lokal ini).</p>'; return; }
      const data=await r.json();
      if(!data.ok){ list.innerHTML=`<p class="zx-customer-muted">${data.error||'Belum ada riwayat.'}</p>`; return; }
      if(!data.orders.length){ list.innerHTML='<p class="zx-customer-muted">Belum ada order dari akun ini.</p>'; return; }
      list.innerHTML=data.orders.map(o=>`
        <div class="zx-order-row">
          <div><b>${o.orderId}</b><span>${fmtDate(o.createdAt)} · ${o.itemCount} item</span></div>
          <div style="text-align:right"><span class="zx-order-status" data-s="${o.status}">${o.status}</span><span>${money(o.total)}</span></div>
        </div>`).join('');
    }catch(e){
      list.innerHTML='<p class="zx-customer-muted">Riwayat order butuh server (belum aktif di mode lokal ini).</p>';
    }
  }

  // reload orders whenever the account page becomes visible
  const accountLink=$('#accountBtn');
  accountLink?.addEventListener('click',()=>setTimeout(loadOrders,300));
  $$('a[data-zx-page="account"]').forEach(a=>a.addEventListener('click',()=>setTimeout(loadOrders,300)));
})();

// ============================================================
// RATING & REVIEW PRODUK (Store)
// ============================================================
(function(){
  const toggles=$$('[data-review-toggle]');
  if(!toggles.length) return;

  function stars(n){ const full='★'.repeat(Math.round(n)); const empty='☆'.repeat(5-Math.round(n)); return full+empty; }

  async function loadSummary(pid){
    const sumEl=document.querySelector(`[data-review-summary="${pid}"]`);
    try{
      const r=await fetch(`/.netlify/functions/reviews?product=${encodeURIComponent(pid)}`);
      const data=await r.json();
      if(data.ok && data.count){ sumEl.innerHTML=`<b>${stars(data.avg)}</b> ${data.avg} (${data.count} ulasan)`; }
      else{ sumEl.textContent='Belum ada ulasan'; }
    }catch(e){ sumEl.textContent=''; }
  }

  async function renderPanel(pid){
    const panel=document.querySelector(`[data-review-panel="${pid}"]`);
    panel.innerHTML='<p class="zx-review-msg">Memuat ulasan…</p>';
    let data;
    try{
      const r=await fetch(`/.netlify/functions/reviews?product=${encodeURIComponent(pid)}`);
      data=await r.json();
    }catch(e){
      panel.innerHTML='<p class="zx-review-msg">Ulasan butuh server (belum aktif di mode lokal ini).</p>';
      return;
    }
    if(!data.ok){ panel.innerHTML=`<p class="zx-review-msg">${data.error||'Gagal memuat ulasan.'}</p>`; return; }

    const list=(data.reviews||[]).slice(0,6).map(rv=>`
      <div class="zx-review-item"><b>${rv.name}</b><div class="stars">${stars(rv.rating)}</div>${rv.comment?`<p>${rv.comment.replace(/</g,'&lt;')}</p>`:''}</div>
    `).join('') || '<p class="zx-review-msg">Belum ada ulasan. Jadi yang pertama!</p>';

    panel.innerHTML=list+`
      <form class="zx-review-form" data-review-form="${pid}">
        <div class="zx-review-stars" data-stars="0">
          ${[1,2,3,4,5].map(n=>`<button type="button" data-star="${n}">★</button>`).join('')}
        </div>
        <textarea placeholder="Ceritain pengalaman kamu (opsional)" maxlength="400"></textarea>
        <div class="zx-review-msg" data-review-err></div>
        <button type="submit">KIRIM ULASAN</button>
      </form>`;

    const form=panel.querySelector('[data-review-form]');
    const starWrap=panel.querySelector('.zx-review-stars');
    const starBtns=[...panel.querySelectorAll('[data-star]')];
    starBtns.forEach(b=>b.addEventListener('click',()=>{
      const val=Number(b.dataset.star);
      starWrap.dataset.stars=val;
      starBtns.forEach(x=>x.classList.toggle('on',Number(x.dataset.star)<=val));
    }));

    form.addEventListener('submit',async(e)=>{
      e.preventDefault();
      const errEl=form.querySelector('[data-review-err]');
      const rating=Number(starWrap.dataset.stars||0);
      const comment=form.querySelector('textarea').value.trim();
      if(!rating){ errEl.textContent='Pilih rating bintang dulu.'; return; }
      try{
        const r=await fetch('/.netlify/functions/reviews',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({product:pid,rating,comment})});
        const data=await r.json();
        if(!data.ok){ errEl.textContent=data.error||'Gagal mengirim ulasan.'; return; }
        renderPanel(pid);
        loadSummary(pid);
      }catch(e){ errEl.textContent='Ulasan butuh server (belum aktif di mode lokal ini).'; }
    });
  }

  toggles.forEach(btn=>{
    const pid=btn.dataset.reviewToggle;
    loadSummary(pid);
    btn.addEventListener('click',()=>{
      const panel=document.querySelector(`[data-review-panel="${pid}"]`);
      const willOpen=panel.classList.contains('hidden');
      panel.classList.toggle('hidden');
      if(willOpen) renderPanel(pid);
    });
  });
})();
