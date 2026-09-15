// KEY BYPASS - DES - NEW BUILD - OWN API via bypass-links.com
// Source: https://github.com/bypasslinks5-del/bypass-linkvertise-lootlabs-lockr
// CONFIG
const CONFIG = {
  API_BASE: 'https://bypass-links.com',
  LOADING_DURATION: 16000,
  PARTICLE_COUNT: 70,
  PARTICLE_DISTANCE: 140
};

// DOM
const DOM = {
  loadingScreen: document.getElementById('loading-screen'),
  loadingBar: document.getElementById('loading-bar'),
  loadingText: document.getElementById('loading-text'),
  animeCanvas: document.getElementById('anime-bg'),
  mainVideo: document.getElementById('main'),
  loadingVideo: document.getElementById('loading'),
  nav: document.getElementById('nav'),
  navMenu: document.getElementById('nav-menu'),
  menuBtn: document.getElementById('menu-btn'),
  themeBtn: document.getElementById('theme-btn'),
  scrollProgress: document.getElementById('scroll-progress'),
  dynamicText: document.getElementById('dynamic-text'),
  bypassForm: document.getElementById('bypass-form'),
  urlInput: document.getElementById('url-input'),
  bypassBtn: document.getElementById('bypass-btn'),
  errorMessage: document.getElementById('error-message'),
  resultCard: document.getElementById('result-card'),
  resultUrl: document.getElementById('result-url'),
  copyBtn: document.getElementById('copy-btn'),
  openBtn: document.getElementById('open-btn')
};

// INIT
function init(){
  initVideos();
  initParticles();
  initTheme();
  initNavigation();
  initDynamicText();
  initBypass();
  initStats();
  initLoadingScreen();
  initFAQ();
  initScrollProgress();
}

// VIDEOS
function initVideos(){
  const main = DOM.mainVideo || document.getElementById('main');
  const loading = DOM.loadingVideo || document.getElementById('loading');
  if(loading){
    loading.addEventListener('loadeddata', ()=> loading.style.opacity='0.58');
    loading.addEventListener('error', ()=> { loading.style.display='none'; });
    loading.play().catch(()=>{});
  }
  if(main){
    main.addEventListener('loadeddata', ()=> main.classList.add('loaded'));
    main.addEventListener('error', ()=> { if(DOM.animeCanvas) DOM.animeCanvas.style.zIndex='2'; });
    main.play().catch(()=>{});
  }
}

// LOADING 16s - EXACT SPEC
function initLoadingScreen(){
  const screen = DOM.loadingScreen, bar = DOM.loadingBar, text = DOM.loadingText;
  if(!screen || !bar || !text) return;
  const messages = [
    'BOOTING NEO-ENGINE',
    'CONNECTING CYBER GRID',
    'INITIALIZING BYPASS CORE',
    'SYNCHRONIZING LINK MATRIX',
    'CALIBRATING ANIME SYSTEM',
    'SYSTEM READY'
  ];
  document.body.style.overflow = 'hidden';
  bar.style.width='0%';
  let start=null, raf=null;
  const tick = (ts)=>{
    if(!start) start=ts;
    const elapsed = ts - start;
    const progress = Math.min((elapsed / CONFIG.LOADING_DURATION)*100,100);
    bar.style.width = progress + '%';
    bar.parentElement.setAttribute('aria-valuenow', Math.floor(progress));
    const idx = Math.min(Math.floor((elapsed / CONFIG.LOADING_DURATION)*messages.length), messages.length-1);
    text.textContent = messages[idx] + ' ' + Math.floor(progress) + '%';
    if(progress < 100){
      raf = requestAnimationFrame(tick);
    } else {
      text.textContent = 'SYSTEM READY 100%';
      screen.classList.add('dismissed');
      setTimeout(()=>{
        screen.style.display='none';
        document.body.style.overflow='';
        document.body.classList.add('loaded');
      },800);
    }
  };
  raf = requestAnimationFrame(tick);
}

// PARTICLES 70 - EXACT SPEC
function initParticles(){
  const canvas = DOM.animeCanvas, ctx = canvas?.getContext('2d');
  if(!canvas || !ctx) return;
  let w, h, particles=[], anim, mx=0,my=0;
  const resize=()=>{ w=canvas.width=window.innerWidth; h=canvas.height=window.innerHeight; };
  resize();
  window.addEventListener('resize', resize);
  document.addEventListener('mousemove', e=>{ mx=e.clientX; my=e.clientY; });
  for(let i=0;i<CONFIG.PARTICLE_COUNT;i++){
    particles.push({x:Math.random()*w, y:Math.random()*h, vx:(Math.random()-0.5)*0.4, vy:(Math.random()-0.5)*0.4, s:Math.random()*1.4+0.6, o:Math.random()*0.4+0.2});
  }
  const fp=document.getElementById('floating-particles');
  if(fp){
    fp.innerHTML='';
    for(let i=0;i<12;i++){
      const s=document.createElement('span');
      s.style.left=Math.random()*100+'%';
      s.style.animationDuration=(Math.random()*12+8)+'s';
      s.style.animationDelay=Math.random()*5+'s';
      fp.appendChild(s);
    }
  }
  function draw(){
    ctx.clearRect(0,0,w,h);
    ctx.fillStyle=document.body.classList.contains('light-mode')?'rgba(248,250,252,0.04)':'rgba(8,10,18,0.06)';
    ctx.fillRect(0,0,w,h);
    for(let i=0;i<particles.length;i++) for(let j=i+1;j<particles.length;j++){
      const dx=particles[i].x-particles[j].x, dy=particles[i].y-particles[j].y, d=Math.sqrt(dx*dx+dy*dy);
      if(d < CONFIG.PARTICLE_DISTANCE){
        ctx.beginPath(); ctx.moveTo(particles[i].x,particles[i].y); ctx.lineTo(particles[j].x,particles[j].y);
        ctx.strokeStyle=`rgba(168,85,247,${0.05*(1-d/CONFIG.PARTICLE_DISTANCE)})`; ctx.lineWidth=0.5; ctx.stroke();
      }
    }
    particles.forEach(p=>{
      p.x+=p.vx; p.y+=p.vy;
      const dx=mx-p.x, dy=my-p.y, d=Math.sqrt(dx*dx+dy*dy);
      if(d<180){ p.x-=dx*0.0012; p.y-=dy*0.0012; }
      if(p.x<0||p.x>w||p.y<0||p.y>h){ p.x=Math.random()*w; p.y=Math.random()*h; }
      ctx.beginPath(); ctx.arc(p.x,p.y,p.s,0,Math.PI*2); ctx.fillStyle=`rgba(168,85,247,${p.o})`; ctx.fill();
      if(p.s>1){ ctx.beginPath(); ctx.arc(p.x,p.y,p.s*2.2,0,Math.PI*2); ctx.fillStyle=`rgba(6,182,212,${p.o*0.12})`; ctx.fill(); }
    });
    anim=requestAnimationFrame(draw);
  }
  draw();
}

// DYNAMIC TEXT - 6 phrases every 2s
function initDynamicText(){
  const el=DOM.dynamicText;
  if(!el) return;
  const words=["ANY LINK","LINKVERTISE","LOOTLABS","SHORT LINKS","REDIRECTS","URL GATES"];
  let i=0; el.textContent=words[0];
  setInterval(()=>{
    el.style.opacity='0'; el.style.transform='translateY(-6px)';
    setTimeout(()=>{ i=(i+1)%words.length; el.textContent=words[i]; el.style.opacity='1'; el.style.transform='translateY(0)'; },250);
  },2000);
}

// THEME
function initTheme(){
  const btn=DOM.themeBtn, saved=localStorage.getItem('theme');
  if(saved==='light') document.body.classList.add('light-mode');
  if(btn) btn.addEventListener('click',()=>{
    document.body.classList.toggle('light-mode');
    localStorage.setItem('theme', document.body.classList.contains('light-mode')?'light':'dark');
  });
}

// NAVIGATION
function initNavigation(){
  const btn=DOM.menuBtn, menu=DOM.navMenu, nav=DOM.nav;
  if(btn && menu){
    btn.addEventListener('click',()=>{
      const open=nav.classList.toggle('menu-open');
      btn.setAttribute('aria-expanded', open?'true':'false');
      document.body.style.overflow=open?'hidden':(DOM.loadingScreen && DOM.loadingScreen.style.display!=='none' ? 'hidden':'');
    });
    menu.querySelectorAll('a').forEach(a=> a.addEventListener('click',()=>{ nav.classList.remove('menu-open'); btn.setAttribute('aria-expanded','false'); if(DOM.loadingScreen.style.display==='none') document.body.style.overflow=''; }));
  }
}

// SCROLL PROGRESS
function initScrollProgress(){
  const bar=DOM.scrollProgress;
  if(!bar) return;
  window.addEventListener('scroll',()=>{
    const pct=(window.scrollY/(document.documentElement.scrollHeight-window.innerHeight))*100;
    bar.style.width=pct+'%';
  });
}

// URL VALIDATION
function validateUrl(s){
  try{ const u=new URL(s); return u.protocol==='http:'||u.protocol==='https:'; }catch{ return false; }
}
function showError(msg){
  if(!DOM.errorMessage) return;
  DOM.errorMessage.textContent=msg;
  DOM.errorMessage.classList.add('show');
}
function showResult(url){
  if(!DOM.resultCard || !DOM.resultUrl) return;
  DOM.resultUrl.textContent=url;
  DOM.resultCard.classList.add('show');
  DOM.resultCard.scrollIntoView({behavior:'smooth', block:'nearest'});
}
function hideError(){ DOM.errorMessage?.classList.remove('show'); }

// OWN API - bypass-links.com (from https://github.com/bypasslinks5-del/bypass-linkvertise-lootlabs-lockr)
// Uses https://bypass-links.com/api/token + POST https://bypass-links.com/api/bypass {url, bypass_token} -> direct link
let bypassToken = null;
async function fetchBypassToken(){
  try{
    const r = await fetch(`${CONFIG.API_BASE}/api/token`);
    const d = await r.json();
    bypassToken = d && d.token ? d.token : null;
  }catch(e){ bypassToken = null; }
}
fetchBypassToken();

function initBypass(){
  const form=DOM.bypassForm, input=DOM.urlInput, btn=DOM.bypassBtn;
  if(!form || !input || !btn) return;
  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const url=input.value.trim();
    if(!url) return showError('Please enter a URL.');
    if(!validateUrl(url)) return showError('Please enter a valid URL.');
    if(!bypassToken) await fetchBypassToken();
    btn.disabled=true; btn.innerHTML='<span>BYPASSING...</span>'; hideError(); DOM.resultCard.classList.remove('show');
    try{
      const response = await fetch(`${CONFIG.API_BASE}/api/bypass`,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({url, bypass_token: bypassToken})
      });
      const text = await response.text();
      if(text.trim().startsWith('<')) throw new Error('API returned HTML - check bypass-links.com');
      const data = JSON.parse(text);
      if(!response.ok) throw new Error(data.error||data.message||`API error ${response.status}`);
      const direct = data.direct || data.result || data.destination;
      if(direct) showResult(direct);
      else throw new Error('No destination URL was returned by the API.');
    }catch(err){
      console.error('Bypass error:',err);
      if(err.message.includes('Failed to fetch')) showError('API connection failed. The bypass-links.com API may be unavailable or blocked by CORS.');
      else showError(err.message);
    }finally{
      btn.disabled=false; btn.innerHTML='<span>BYPASS LINK</span> <i>→</i>';
      fetchBypassToken();
    }
  });
  // Copy - copies DIRECT link from bypass-links, not the intermediate ?url=
  DOM.copyBtn?.addEventListener('click',()=>{
    const t=DOM.resultUrl.textContent;
    if(!t) return showError('No URL to copy.');
    if(!validateUrl(t)) return showError('No valid direct link to copy.');
    navigator.clipboard.writeText(t).then(()=>{
      const orig=DOM.copyBtn.textContent; DOM.copyBtn.textContent='Copied!'; setTimeout(()=> DOM.copyBtn.textContent=orig,1500);
    }).catch(()=> showError('Clipboard unavailable.'));
  });
  // Open - opens DIRECT link
  DOM.openBtn?.addEventListener('click',()=>{
    const t=DOM.resultUrl.textContent;
    if(!t) return showError('No URL to open.');
    if(!validateUrl(t)) return showError('Invalid URL.');
    window.open(t,'_blank','noopener,noreferrer');
  });
}

// STATS
function initStats(){
  loadStats();
}
async function loadStats(){
  try{
    const r=await fetch(`${CONFIG.API_BASE}/api/stats`).catch(()=>{ throw new Error('no api'); });
    const t=await r.text();
    if(t.trim().startsWith('<')) throw new Error('html');
    const d=JSON.parse(t);
    if(d.success && d.stats){
      animateCounter('hero-total', d.stats.totalLinks);
      animateCounter('hero-today', d.stats.todayRequests);
      animateCounter('hero-services', d.stats.supportedServices);
      animateCounter('total-links', d.stats.totalLinks);
      animateCounter('today-requests', d.stats.todayRequests);
      animateCounter('supported-services', d.stats.supportedServices);
      return;
    }
    throw new Error('no stats');
  }catch(e){
    const f={totalLinks:1284736,todayRequests:3421,supportedServices:47};
    animateCounter('hero-total', f.totalLinks);
    animateCounter('hero-today', f.todayRequests);
    animateCounter('hero-services', f.supportedServices);
    animateCounter('total-links', f.totalLinks);
    animateCounter('today-requests', f.todayRequests);
    animateCounter('supported-services', f.supportedServices);
  }
}
function animateCounter(id,target){
  const el=document.getElementById(id);
  if(!el) return;
  let cur=0; const inc=target/(2000/16);
  const t=setInterval(()=>{
    cur+=inc;
    if(cur>=target){ el.textContent=target.toLocaleString(); clearInterval(t); }
    else el.textContent=Math.floor(cur).toLocaleString();
  },16);
}

// FAQ
function initFAQ(){
  document.querySelectorAll('.faq-item').forEach(item=>{
    const q=item.querySelector('.faq-q');
    if(!q) return;
    q.addEventListener('click',()=>{
      const active=item.classList.contains('active');
      document.querySelectorAll('.faq-item').forEach(i=>{ i.classList.remove('active'); i.querySelector('.faq-q').setAttribute('aria-expanded','false'); });
      if(!active){ item.classList.add('active'); q.setAttribute('aria-expanded','true'); }
    });
    q.addEventListener('keydown', e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); q.click(); } });
  });
}

// START
if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
