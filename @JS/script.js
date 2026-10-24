const overlay=document.getElementById('overlay'),infoBtn=document.getElementById('infoOpen');
const unavailable=document.getElementById('unavailableModal'),epilepsy=document.getElementById('epilepsyModal');
const stack=[],themeMeta=document.getElementById('themeColor');

// Calques : fermés = inert (hors Tab et lecteurs d'écran), focus rendu au déclencheur
[overlay,unavailable,epilepsy].forEach(el=>{el.inert=true;});
function openLayer(el,trigger){
  el.inert=false;el.classList.add('open');
  stack.push({el,trigger});
  if(el===overlay){document.body.style.overflow='hidden';infoBtn.setAttribute('aria-expanded','true');themeMeta.content='#FFF8F0';}
  el.querySelector('[data-close]').focus();
}
function closeLayer(){
  const top=stack.pop();if(!top)return;
  top.el.classList.remove('open');top.el.inert=true;
  if(top.el===overlay){document.body.style.overflow='';infoBtn.setAttribute('aria-expanded','false');themeMeta.content='#4B2E2B';}
  if(top.trigger)top.trigger.focus();
}
infoBtn.addEventListener('click',()=>openLayer(overlay,infoBtn));
[overlay,unavailable,epilepsy].forEach(el=>el.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',closeLayer)));
[unavailable,epilepsy].forEach(el=>el.addEventListener('click',e=>{if(e.target===el)closeLayer();}));
document.querySelectorAll('[data-unavailable]').forEach(b=>b.addEventListener('click',e=>openLayer(unavailable,e.currentTarget)));
document.querySelectorAll('[data-epilepsy-url]').forEach(b=>b.addEventListener('click',e=>{
  document.getElementById('epilepsyContinue').href=e.currentTarget.dataset.epilepsyUrl;
  openLayer(epilepsy,e.currentTarget);
}));
document.getElementById('epilepsyContinue').addEventListener('click',closeLayer);
document.getElementById('epilepsyCancel').addEventListener('click',closeLayer);

// Échap ferme le calque du dessus ; Tab reste prisonnier du calque ouvert
document.addEventListener('keydown',e=>{
  const top=stack[stack.length-1];if(!top)return;
  if(e.key==='Escape'){closeLayer();return;}
  if(e.key!=='Tab')return;
  const f=[...top.el.querySelectorAll('a[href],button')].filter(n=>n.getClientRects().length);
  const first=f[0],last=f[f.length-1];
  if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
  else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
});

// Marquee : répète le motif jusqu'à dépasser l'écran, puis le double (boucle à -50 % sans saut)
function buildRows(){
  document.querySelectorAll('.row-track').forEach(t=>{
    if(!t.dataset.seed)t.dataset.seed=t.innerHTML;
    t.innerHTML='';
    const g=document.createElement('span');g.className='group';g.innerHTML=t.dataset.seed;t.appendChild(g);
    while(g.getBoundingClientRect().width<window.innerWidth&&g.children.length<400)g.insertAdjacentHTML('beforeend',t.dataset.seed);
    t.appendChild(g.cloneNode(true));
  });
}
(document.fonts?document.fonts.ready:Promise.resolve()).then(buildRows);
let rt;window.addEventListener('resize',()=>{clearTimeout(rt);rt=setTimeout(buildRows,200);});

// Pause du défilement
const wall=document.querySelector('.wall'),pause=document.getElementById('pauseBtn');
pause.addEventListener('click',()=>{
  const p=wall.classList.toggle('paused');
  pause.setAttribute('aria-pressed',p);pause.textContent=p?'Lecture':'Pause';
});

// Icônes de compatibilité : data-devices="desktop mobile" sur chaque <li class="card">
const ICONS={
  desktop:['ordinateur','<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square" aria-hidden="true"><rect x="3" y="4" width="18" height="12"/><path d="M9 20h6M12 16v4"/></svg>'],
  mobile:['mobile','<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square" aria-hidden="true"><rect x="7" y="2" width="10" height="20"/><path d="M11 18.5h2"/></svg>']
};
document.querySelectorAll('.card[data-devices]').forEach(card=>{
  const list=card.dataset.devices.split(/\s+/).filter(d=>ICONS[d]);
  if(!list.length)return;
  const s=document.createElement('span');
  s.className='devices';s.setAttribute('role','img');
  s.setAttribute('aria-label','Compatible '+list.map(d=>ICONS[d][0]).join(' et '));
  s.innerHTML=list.map(d=>ICONS[d][1]).join('');
  card.querySelector('h3').appendChild(s);
});
