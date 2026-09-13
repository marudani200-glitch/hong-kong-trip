const app = document.querySelector('#app');
const toast = document.querySelector('#toast');
const icons = { '観光':'✦', '食事':'♨', '移動':'➜', '宿泊':'▰', '買い物':'◇', 'その他':'•' };
let trip;
let deferredInstall;

const esc = s => String(s ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const mapUrl = q => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
const jpDate = date => new Intl.DateTimeFormat('ja-JP',{month:'long',day:'numeric',weekday:'short'}).format(new Date(`${date}T12:00:00`));
const showToast = message => { toast.textContent=message; toast.classList.add('show'); setTimeout(()=>toast.classList.remove('show'),2200); };

function countdown() {
  const now = new Date(); const start = new Date(`${trip.startDate}T00:00:00+09:00`); const end = new Date(`${trip.endDate}T23:59:59+09:00`);
  if (now < start) return `香港旅行まで あと${Math.ceil((start-now)/86400000)}日`;
  if (now <= end) return `香港旅行 ${Math.floor((now-start)/86400000)+1}日目`;
  return '香港旅行の思い出';
}

function shell(content, back=false) {
  return `<header class="topbar">${back?'<button class="icon-btn" data-home aria-label="日付一覧へ戻る">‹</button>':'<span class="bao-mini">♨</span>'}<span class="brand">香港旅行</span><span class="top-spacer"></span></header><main>${content}</main>`;
}

function renderHome() {
  location.hash='';
  app.innerHTML=shell(`<section class="hero"><p class="eyebrow">HONG KONG · 2026</p><h1>夜景と美食を<br><em>めぐる4日間。</em></h1><div class="countdown"><span class="pulse"></span>${countdown()}</div></section>
  <section class="home-grid"><button class="info-card" data-info><span class="card-icon">i</span><span><small>旅の基本情報</small><strong>フライト・ホテル・緊急連絡先</strong></span><b>›</b></button>
  ${trip.days.map((d,i)=>`<button class="day-card" data-date="${d.date}"><span class="day-number">0${i+1}</span><span class="date"><small>${jpDate(d.date).split('(')[0]}</small><strong>${esc(d.theme)}</strong></span><span class="arrow">↗</span></button>`).join('')}</section>
  <section id="install-area"></section><footer>2026.11.07 — 11.10 · HONG KONG</footer>`);
  renderInstall();
}

function eventStatus(day, index) {
  const now=new Date(); const current=new Date(`${day.date}T${day.events[index].time}:00`); const next=day.events[index+1]&&new Date(`${day.date}T${day.events[index+1].time}:00`);
  if(now.toDateString()!==current.toDateString()) return '';
  if(now>=current && (!next||now<next)) return ' active';
  const firstFuture=day.events.findIndex(e=>now<new Date(`${day.date}T${e.time}:00`));
  if(now<current && index===firstFuture) return ' next';
  return now>=current?' done':'';
}

function renderDay(date) {
  const index=trip.days.findIndex(d=>d.date===date), day=trip.days[index]; if(!day) return renderHome();
  location.hash=`day=${date}`;
  app.innerHTML=shell(`<section class="page-heading"><p class="eyebrow">DAY 0${index+1}</p><h1>${jpDate(date)}</h1><p>${esc(day.theme)}</p></section>
  <section class="timeline">${day.events.map((e,i)=>{const status=eventStatus(day,i); return `<article class="event${status}" data-event><div class="time">${e.time}${status===' active'?'<small>いま</small>':status===' next'?'<small>次</small>':''}</div><div class="rail"><span></span></div><div class="event-card"><button class="event-summary" aria-expanded="false"><span class="category cat-${e.category}">${icons[e.category]||'•'} ${e.category}</span><strong>${esc(e.title)}</strong><span class="place">⌖ ${esc(e.place)}</span><span class="chevron">⌄</span></button><div class="event-detail">${e.note?`<p>${esc(e.note)}</p>`:''}<div class="actions"><a href="${mapUrl(e.mapQuery||e.place)}" target="_blank" rel="noopener">地図を開く ↗</a><button data-copy="${esc(e.place)}">場所をコピー</button></div></div></div></article>`}).join('')}</section>
  <nav class="day-nav">${index>0?`<button data-date="${trip.days[index-1].date}">← 前日</button>`:'<span></span>'}<button data-home>日付一覧</button>${index<trip.days.length-1?`<button data-date="${trip.days[index+1].date}">翌日 →</button>`:'<span></span>'}</nav>`,true);
}

function renderInfo() {
  const info=trip.travelInfo; location.hash='info';
  app.innerHTML=shell(`<section class="page-heading"><p class="eyebrow">TRIP ESSENTIALS</p><h1>旅行情報</h1><p>必要な情報を、ひとつの場所に。</p></section>
  <section class="info-section"><h2>フライト</h2>${info.flights.map(f=>`<article class="detail-card"><div class="detail-label">${f.label}</div><h3>${f.number}</h3><strong class="route">${f.route}</strong><p>出発　${f.depart}</p><p>到着　${f.arrive}</p><a class="primary-action" href="${info.flightStatusUrl}" target="_blank" rel="noopener">運航状況を確認 ↗</a></article>`).join('')}</section>
  <section class="info-section"><h2>宿泊先</h2><article class="detail-card"><div class="detail-label">HOTEL</div><h3>${info.hotel.name}</h3><p>${info.hotel.address}</p><p>${info.hotel.phone}</p><div class="actions"><a href="${mapUrl(info.hotel.mapQuery)}" target="_blank" rel="noopener">地図を開く ↗</a><button data-copy="${info.hotel.address}">住所をコピー</button><button data-copy="${info.hotel.phone}">電話をコピー</button></div></article></section>
  <section class="info-section emergency"><h2>緊急連絡先</h2>${info.emergency.map(e=>`<article class="detail-card"><div><h3>${e.name}</h3><p>${e.note}</p>${e.address?`<p>${e.address}</p>`:''}</div><div class="actions"><a href="tel:${e.phone.replace(/\s/g,'')}">${e.phone} に電話</a><button data-copy="${e.phone}">番号をコピー</button></div></article>`).join('')}<p class="source-note">連絡先は香港政府・在香港日本国総領事館の公式情報を参照（2026年9月確認）</p></section>`,true);
}

function renderInstall(){
  if(matchMedia('(display-mode: standalone)').matches||localStorage.installDismissed) return;
  const ios=/iphone|ipad|ipod/i.test(navigator.userAgent);
  document.querySelector('#install-area').innerHTML=`<div class="install-card"><div><strong>ホーム画面に追加</strong><p>${ios?'Safariの共有ボタンから「ホーム画面に追加」を選びます。':'アプリとして追加すると、オフラインでもすぐに開けます。'}</p></div>${deferredInstall?'<button data-install>追加</button>':''}<button class="dismiss" data-dismiss aria-label="閉じる">×</button></div>`;
}

document.addEventListener('click',async e=>{
  const t=e.target.closest('[data-home],[data-date],[data-info],[data-event],[data-copy],[data-install],[data-dismiss]'); if(!t)return;
  if(t.matches('[data-home]')) renderHome();
  else if(t.dataset.date) renderDay(t.dataset.date);
  else if(t.matches('[data-info]')) renderInfo();
  else if(t.matches('[data-event]')) {const b=t.querySelector('.event-summary'); if(e.target.closest('a,[data-copy]'))return; t.classList.toggle('open'); b.setAttribute('aria-expanded',t.classList.contains('open'));}
  else if(t.dataset.copy!==undefined){await navigator.clipboard.writeText(t.dataset.copy);showToast('コピーしました');}
  else if(t.matches('[data-install]')){deferredInstall.prompt(); await deferredInstall.userChoice; deferredInstall=null;renderInstall();}
  else {localStorage.installDismissed='1';document.querySelector('#install-area').innerHTML='';}
});

window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstall=e;renderInstall();});
window.addEventListener('hashchange',route);
function route(){const h=location.hash.slice(1);if(h==='info')renderInfo();else if(h.startsWith('day='))renderDay(h.slice(4));else renderHome();}

async function init(){try{trip=await fetch('trip-data.json').then(r=>{if(!r.ok)throw Error();return r.json()});route();setInterval(()=>{if(location.hash.startsWith('#day='))renderDay(location.hash.slice(5));},60000);}catch{app.innerHTML='<main class="error"><h1>旅程を読み込めませんでした</h1><p>通信状態を確認して、もう一度開いてください。</p></main>';}}

if('serviceWorker' in navigator){navigator.serviceWorker.register('sw.js').then(reg=>{reg.addEventListener('updatefound',()=>{const worker=reg.installing;worker.addEventListener('statechange',()=>{if(worker.state==='installed'&&navigator.serviceWorker.controller){const bar=document.createElement('div');bar.className='update-bar';bar.innerHTML='<span>旅程が更新されました</span><button>更新する</button>';bar.querySelector('button').onclick=()=>worker.postMessage({type:'SKIP_WAITING'});document.body.append(bar);}});});});let refreshing=false;navigator.serviceWorker.addEventListener('controllerchange',()=>{if(!refreshing){refreshing=true;location.reload();}});}
init();
