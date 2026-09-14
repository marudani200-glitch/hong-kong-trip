const app = document.querySelector('#app');
const toast = document.querySelector('#toast');
let trip;
let deferredInstall;

const esc = s => String(s ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const mapUrl = q => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
const jpDate = date => new Intl.DateTimeFormat('ja-JP',{month:'long',day:'numeric',weekday:'short'}).format(new Date(`${date}T12:00:00`));
const showToast = message => { toast.textContent=message; toast.classList.add('show'); setTimeout(()=>toast.classList.remove('show'),2200); };
const svgPaths={home:'<path d="M3 11.5 12 4l9 7.5V21h-6v-6H9v6H3z"/>',info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v.01"/>',settings:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1v.1h-4v-.1a1.7 1.7 0 0 0-1.1-1.6 1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1-.4h-.1v-4H3A1.7 1.7 0 0 0 4.6 8.5a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1v-.1h4V3A1.7 1.7 0 0 0 15.5 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.15.37.36.7.6 1 .28.25.63.39 1 .4h.1v4H21a1.7 1.7 0 0 0-1.6.6Z"/>',food:'<path d="M7 3v8m-3-8v5c0 2 1.3 3 3 3s3-1 3-3V3m-3 8v10M16 3c3 2 3 7 0 10v8m0-18v10h3"/>',plane:'<path d="m2 16 20-8-2-2-8 3-5-5-2 1 3 6-4 2zM13 14l-1 6 2-1 4-7"/>',train:'<rect x="5" y="3" width="14" height="16" rx="3"/><path d="M8 7h8M8 13h.01M16 13h.01M8 19l-2 3m10-3 2 3"/>',car:'<path d="m5 17-1 2m15-2 1 2M3 13l2-6h14l2 6v5H3zM6 14h.01M18 14h.01"/>',bed:'<path d="M3 20v-9m18 9v-7a3 3 0 0 0-3-3H9v7m-6 0h18M6 10V7h3a3 3 0 0 1 3 3"/>',shop:'<path d="M3 4h2l2.5 11h10L20 7H6m3 12h.01M17 19h.01"/>',star:'<path d="m12 3 2.7 5.6 6.3.9-4.5 4.4 1 6.2-5.5-3-5.5 3 1-6.2L3 9.5l6.3-.9z"/>',landmark:'<path d="m3 10 9-7 9 7M5 10h14M7 10v8m5-8v8m5-8v8M4 21h16"/>'};
svgPaths.bus='<rect x="4" y="3" width="16" height="16" rx="3"/><path d="M7 7h10M7 13h.01M17 13h.01M7 19l-2 3m12-3 2 3"/>';
svgPaths.walk='<circle cx="13" cy="4" r="2"/><path d="m10 22 2-7-3-3 2-5 4 3 3 1m-6 4 4 3 1 4M9 12l-4 3"/>';
svgPaths.pin='<path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>';
const iconSvg=name=>`<svg viewBox="0 0 24 24" aria-hidden="true">${svgPaths[name]||svgPaths.star}</svg>`;
const transitIcon=mode=>mode==='タクシー'?'car':mode==='徒歩'?'walk':mode==='シャトルバス'?'bus':'train';
function eventIcon(e){if(e.category==='食事')return'food';if(e.category==='宿泊')return'bed';if(e.category==='買い物')return'shop';if(/離陸|空港|到着/.test(e.title))return'plane';if(/トラム/.test(e.title))return'train';if(/文武廟/.test(e.title))return'landmark';return'star';}
const mobileMotion=()=>matchMedia('(max-width: 768px), (pointer: coarse)').matches;
const smoothRender=fn=>{
  if(document.startViewTransition&&!mobileMotion())return document.startViewTransition(fn);
  fn();
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches)app.animate([
    {opacity:.72,transform:'translate3d(0,7px,0)'},
    {opacity:1,transform:'translate3d(0,0,0)'}
  ],{duration:240,easing:'cubic-bezier(.2,.8,.2,1)'});
};

function countdown() {
  const now = new Date(); const start = new Date(`${trip.startDate}T00:00:00+09:00`); const end = new Date(`${trip.endDate}T23:59:59+09:00`);
  if (now < start) return `香港旅行まで あと${Math.ceil((start-now)/86400000)}日`;
  if (now <= end) return `香港旅行 ${Math.floor((now-start)/86400000)+1}日目`;
  return '香港旅行の思い出';
}

function shell(content, back=false) {
  const hash=location.hash.slice(1), active=hash==='info'?'info':hash==='spots'?'spots':hash==='settings'?'settings':'home';
  return `<header class="topbar">${back?'<button class="icon-btn" data-home aria-label="日付一覧へ戻る">‹</button>':'<span class="header-spacer"></span>'}<div class="brand-wrap"><span class="brand">香港旅行</span><small>2026年11月7日 − 2026年11月10日</small></div><span class="top-spacer"></span></header><main>${content}</main><nav class="bottom-tabs" aria-label="メインメニュー"><button data-home class="${active==='home'?'selected':''}" aria-label="ホーム">${iconSvg('home')}</button><button data-info class="${active==='info'?'selected':''}" aria-label="基本情報">${iconSvg('info')}</button><button data-spots class="${active==='spots'?'selected':''}" aria-label="候補スポット">${iconSvg('pin')}</button><button data-settings class="${active==='settings'?'selected':''}" aria-label="設定">${iconSvg('settings')}</button></nav>`;
}

function renderHome() {
  if(location.hash)history.pushState(null,'',location.pathname+location.search);
  app.innerHTML=shell(`<section class="hero home-hero"><div class="countdown"><span class="pulse"></span>${countdown()}</div></section>
  <section class="home-grid">${trip.days.map(d=>`<button class="day-card" data-date="${d.date}"><span class="date"><small>${jpDate(d.date).split('(')[0]}</small><strong>${esc(d.theme)}</strong></span><span class="arrow">↗</span></button>`).join('')}</section>
  <footer>2026.11.07 — 11.10 · HONG KONG</footer>`);
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
  if(location.hash!==`#day=${date}`)history.pushState(null,'',`#day=${date}`);
  app.innerHTML=shell(`<section class="page-heading"><div class="day-label">${index+1}日目</div><div><h1>${jpDate(date)}</h1><p>${esc(day.theme)}</p></div><strong class="timezone">UTC+${index===0||index===3?'9':'8'}</strong></section>
  <section class="timeline">${day.events.map((e,i)=>{const status=eventStatus(day,i), transit=e.transitAfter; return `<article class="event${status}" data-event><div class="time">${e.time}${status===' active'?'<small>いま</small>':status===' next'?'<small>次</small>':''}</div><div class="rail"><span class="cat-${e.category}">${iconSvg(eventIcon(e))}</span></div><div class="event-card"><button class="event-summary" aria-expanded="false"><span class="category cat-${e.category}">${e.category}</span><strong>${esc(e.title)}</strong><span class="place">${esc(e.place)}</span><span class="chevron">⌄</span></button><div class="event-detail"><div class="detail-inner">${e.note?`<p>${esc(e.note)}</p>`:''}<div class="actions"><a href="${mapUrl(e.mapQuery||e.place)}" target="_blank" rel="noopener">地図を開く ↗</a><button data-copy="${esc(e.place)}">場所をコピー</button></div></div></div></div></article>${i<day.events.length-1&&transit!==false?`<article class="transit-gap" data-transit><button class="transit-summary" aria-expanded="false"><span class="transit-icon">${iconSvg(transitIcon(transit?.mode))}</span><strong>移動</strong><span class="transit-chevron">⌄</span></button><div class="transit-detail"><div><small>移動方法</small><strong>${esc(transit?.mode||'詳細未登録')}</strong>${transit?.note?`<p>${esc(transit.note)}</p>`:''}</div></div></article>`:''}`}).join('')}</section>
  <nav class="day-nav">${index>0?`<button data-date="${trip.days[index-1].date}">← 前日</button>`:'<span></span>'}<button data-home>日付一覧</button>${index<trip.days.length-1?`<button data-date="${trip.days[index+1].date}">翌日 →</button>`:'<span></span>'}</nav>`,true);
}

function renderInfo() {
  const info=trip.travelInfo; if(location.hash!=='#info')history.pushState(null,'','#info');
  app.innerHTML=shell(`<section class="info-section info-first"><h2>フライト</h2>${info.flights.map(f=>`<article class="detail-card"><div class="detail-label">${f.label}</div><h3>${f.number}</h3><strong class="route">${f.route}</strong><p>出発　${f.depart}</p><p>到着　${f.arrive}</p><a class="primary-action" href="${info.flightStatusUrl}" target="_blank" rel="noopener">運航状況を確認 ↗</a></article>`).join('')}</section>
  <section class="info-section"><h2>宿泊先</h2><article class="detail-card"><div class="detail-label">HOTEL</div><h3>${info.hotel.name}</h3><p>${info.hotel.address}</p><p>${info.hotel.phone}</p><div class="actions"><a href="${mapUrl(info.hotel.mapQuery)}" target="_blank" rel="noopener">地図を開く ↗</a><button data-copy="${info.hotel.address}">住所をコピー</button><button data-copy="${info.hotel.phone}">電話をコピー</button></div></article></section>
  <section class="info-section emergency"><h2>緊急連絡先</h2>${info.emergency.map(e=>`<article class="detail-card"><div><h3>${e.name}</h3><p>${e.note}</p>${e.address?`<p>${e.address}</p>`:''}</div><div class="actions"><a href="tel:${e.phone.replace(/\s/g,'')}">${e.phone} に電話</a><button data-copy="${e.phone}">番号をコピー</button></div></article>`).join('')}<p class="source-note">連絡先は香港政府・在香港日本国総領事館の公式情報を参照（2026年9月確認）</p></section>`);
}

function renderSpots(){
  if(location.hash!=='#spots')history.pushState(null,'','#spots');
  const spots=trip.candidateSpots||[];
  app.innerHTML=shell(`<section class="spots-intro"><h1>その他候補スポット</h1></section><div class="spot-filters" role="group" aria-label="カテゴリーで絞り込み"><button class="selected" data-filter="すべて">すべて</button><button data-filter="観光">観光</button><button data-filter="グルメ">グルメ</button></div><section class="spot-grid">${spots.map(s=>`<article class="spot-card" data-spot data-spot-category="${s.category}"><button class="spot-summary" aria-expanded="false"><div class="spot-copy"><span class="spot-category cat-${s.category}">${s.category==='観光'?iconSvg('star'):iconSvg('food')} ${s.category}</span><h2>${esc(s.name)}</h2><p>${iconSvg('pin')} ${esc(s.area)}</p></div><span class="spot-chevron">⌄</span></button><div class="spot-detail"><div><p>${esc(s.description)}</p><a href="${s.url}" target="_blank" rel="noopener">Googleマップを開く ↗</a></div></div></article>`).join('')}</section>`);
}

function renderSettings(){
  if(location.hash!=='#settings')history.pushState(null,'','#settings');
  app.innerHTML=shell(`<section class="page-heading settings-heading"><div><h1>設定</h1><p>アプリとオフライン利用について</p></div></section><section class="settings-list"><article class="detail-card"><div class="detail-label">INSTALL</div><h3>ホーム画面に追加</h3><p>ホーム画面からすぐに開けます。追加後は旅程をオフラインでも確認できます。</p><div id="install-area"></div></article><article class="detail-card status-card"><div><div class="detail-label">OFFLINE</div><h3>オフライン対応</h3><p>旅程と基本情報は端末に保存されます。地図と運航状況の確認には通信が必要です。</p></div><span class="status-dot">対応済み</span></article><article class="detail-card"><div class="detail-label">VERSION</div><h3>香港旅行 PWA</h3><p>バージョン 1.8<br>旅程更新日：2026年9月14日</p></article></section>`);
  renderInstall();
}

function renderInstall(){
  const area=document.querySelector('#install-area'); if(!area)return;
  if(matchMedia('(display-mode: standalone)').matches){area.innerHTML='<div class="installed-state">✓ ホーム画面に追加済みです</div>';return;}
  const ios=/iphone|ipad|ipod/i.test(navigator.userAgent);
  area.innerHTML=`<div class="install-card"><div><p>${ios?'Safariの共有ボタンから「ホーム画面に追加」を選びます。':'アプリとして追加すると、オフラインでもすぐに開けます。'}</p></div>${deferredInstall?'<button data-install>追加</button>':''}</div>`;
}

function showInstallModal(){
  if(matchMedia('(display-mode: standalone)').matches||sessionStorage.installModalSeen)return;
  sessionStorage.installModalSeen='1';
  const ios=/iphone|ipad|ipod/i.test(navigator.userAgent);
  const modal=document.createElement('div');modal.className='install-modal';modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-labelledby','install-title');
  modal.innerHTML=`<div class="install-backdrop" data-close-install></div><section class="install-dialog"><button class="modal-close" data-close-install aria-label="閉じる">×</button><div class="modal-app-icon"><img src="assets/icons/icon-192.png" alt=""></div><p class="modal-kicker">香港旅行をすぐ開く</p><h2 id="install-title">ホーム画面に追加</h2><p class="modal-lead">旅程をオフラインでも、アプリのようにすぐ確認できます。</p><ol class="install-steps">${ios?'<li><b>1</b><span>Safari下部の共有ボタン <strong>□↑</strong> をタップ</span></li><li><b>2</b><span>「ホーム画面に追加」を選択</span></li>':'<li><b>1</b><span>ブラウザのメニュー <strong>︙</strong> を開く</span></li><li><b>2</b><span>「アプリをインストール」または「ホーム画面に追加」を選択</span></li>'}</ol>${deferredInstall?'<button class="modal-install-button" data-install>ホーム画面に追加</button>':''}<button class="modal-later" data-close-install>あとで</button></section>`;
  document.body.append(modal);
  requestAnimationFrame(()=>modal.classList.add('visible'));
}

document.addEventListener('click',async e=>{
  const t=e.target.closest('[data-home],[data-date],[data-info],[data-spots],[data-settings],[data-filter],[data-spot],[data-event],[data-transit],[data-copy],[data-install],[data-dismiss],[data-close-install]'); if(!t)return;
  if(t.matches('[data-home]')) smoothRender(renderHome);
  else if(t.dataset.date) smoothRender(()=>renderDay(t.dataset.date));
  else if(t.matches('[data-info]')) smoothRender(renderInfo);
  else if(t.matches('[data-spots]')) smoothRender(renderSpots);
  else if(t.matches('[data-settings]')) smoothRender(renderSettings);
  else if(t.matches('[data-filter]')){document.querySelectorAll('[data-filter]').forEach(b=>b.classList.toggle('selected',b===t));document.querySelectorAll('[data-spot-category]').forEach(card=>card.hidden=t.dataset.filter!=='すべて'&&card.dataset.spotCategory!==t.dataset.filter);}
  else if(t.matches('[data-spot]')){if(e.target.closest('a'))return;const b=t.querySelector('.spot-summary');t.classList.toggle('open');b.setAttribute('aria-expanded',t.classList.contains('open'));}
  else if(t.matches('[data-event]')) {const b=t.querySelector('.event-summary'); if(e.target.closest('a,[data-copy]'))return; t.classList.toggle('open'); b.setAttribute('aria-expanded',t.classList.contains('open'));}
  else if(t.matches('[data-transit]')) {const b=t.querySelector('.transit-summary');t.classList.toggle('open');b.setAttribute('aria-expanded',t.classList.contains('open'));}
  else if(t.dataset.copy!==undefined){await navigator.clipboard.writeText(t.dataset.copy);showToast('コピーしました');}
  else if(t.matches('[data-install]')){deferredInstall.prompt(); await deferredInstall.userChoice; deferredInstall=null;document.querySelector('.install-modal')?.remove();renderInstall();}
  else if(t.matches('[data-close-install]')){const modal=t.closest('.install-modal');modal?.classList.remove('visible');setTimeout(()=>modal?.remove(),220);}
  else {localStorage.installDismissed='1';document.querySelector('#install-area').innerHTML='';}
});

window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstall=e;renderInstall();const dialog=document.querySelector('.install-dialog');if(dialog&&!dialog.querySelector('[data-install]')){const button=document.createElement('button');button.className='modal-install-button';button.dataset.install='';button.textContent='ホーム画面に追加';dialog.querySelector('.modal-later').before(button);}});
window.addEventListener('popstate',route);
function route(){const h=location.hash.slice(1);if(h==='info')renderInfo();else if(h==='spots')renderSpots();else if(h==='settings')renderSettings();else if(h.startsWith('day='))renderDay(h.slice(4));else renderHome();}

async function init(){try{trip=await fetch('trip-data.json').then(r=>{if(!r.ok)throw Error();return r.json()});route();setTimeout(showInstallModal,420);setInterval(()=>{if(location.hash.startsWith('#day='))renderDay(location.hash.slice(5));},60000);}catch{app.innerHTML='<main class="error"><h1>旅程を読み込めませんでした</h1><p>通信状態を確認して、もう一度開いてください。</p></main>';}}

if('serviceWorker' in navigator){navigator.serviceWorker.register('sw.js').then(reg=>{reg.addEventListener('updatefound',()=>{const worker=reg.installing;worker.addEventListener('statechange',()=>{if(worker.state==='installed'&&navigator.serviceWorker.controller){const bar=document.createElement('div');bar.className='update-bar';bar.innerHTML='<span>旅程が更新されました</span><button>更新する</button>';bar.querySelector('button').onclick=()=>worker.postMessage({type:'SKIP_WAITING'});document.body.append(bar);}});});});let refreshing=false;navigator.serviceWorker.addEventListener('controllerchange',()=>{if(!refreshing){refreshing=true;location.reload();}});}
init();
