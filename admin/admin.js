'use strict';
const $=id=>document.getElementById(id);
const api='https://api.github.com';
let data,loadedSha,cfg,current='colors',dirty=false;
const pending=new Map(); // projet -> image WebP en base64

// ---------- Schéma des formulaires ----------
const DATES=[['title','Titre','text'],['desc','Description','textarea'],['dates','Dates','text']];
const SECTIONS=[
 {id:'colors',title:'Couleurs',fields:[['colors.dark','Sombre : fond de l\'accueil, texte du panneau','color'],['colors.light','Clair : texte de l\'accueil, fond du panneau','color'],['colors.mid','Brun secondaire : descriptions','color'],['colors.accent','Accent : tuiles sans image','color']]},
 {id:'home',title:'Accueil',fields:[['hero.rows','Bandes du mur de texte','strlist'],['hero.hint','Indication en bas de page','text'],['hero.h1','Titre masqué (lecteurs d\'écran, Google)','text'],['meta.title','Titre de l\'onglet et du partage','text'],['meta.description','Description pour Google','textarea'],['meta.jobTitle','Métier (données structurées)','text']]},
 {id:'bio',title:'Bio',fields:[['bio.paragraphs','Paragraphes','strlist-area'],['bio.skills','Compétences','strlist'],['bio.languages','Langues','text'],['bio.cv','Fichier du CV','text']]},
 {id:'formations',title:'Formations',fields:[['formations','Formations','objlist',DATES]]},
 {id:'experiences',title:'Expériences',fields:[['experiences','Expériences','objlist',DATES]]},
 {id:'projects',title:'Travaux',fields:[['projects','Projets','objlist',[
   ['slug','Identifiant (minuscules, chiffres, tirets)','text'],['title','Nom du projet','text'],['desc','Description','textarea'],['status','Statut et année','text'],
   ['devices','Compatibilité','devices'],['action.type','Action','select',[['link','Lien externe'],['epilepsy','Lien avec avertissement épilepsie'],['unavailable','Indisponible']]],
   ['action.label','Texte du bouton','text'],['action.url','Adresse (https://)','text'],['alt','Texte alternatif de l\'image','text'],['image','Visuel (1200 x 900, converti en WebP)','image']]],
   ['behance','Page Behance : tuile « Plus de projets » et bouton Portfolio (https://)','text']]},
 {id:'contact',title:'Contact',fields:[['contact.email_user','Email : partie avant @','text'],['contact.email_domain','Email : domaine','text'],['contact.phone_a','Téléphone : début','text'],['contact.phone_b','Téléphone : fin','text'],['socials','Réseaux','objlist',[['label','Sigle (2 lettres)','text'],['name','Nom complet','text'],['url','Adresse (https://)','text']]]]}
];
const DEFAULTS={projects:{slug:'nouveau-projet',title:'Nouveau projet',desc:'',status:'',devices:[],action:{type:'unavailable',url:'',label:'Indisponible'},alt:'Aperçu du projet'},formations:{title:'',desc:'',dates:''},experiences:{title:'',desc:'',dates:''},socials:{label:'',name:'',url:''}};

// ---------- Outils ----------
const get=(o,p)=>p.split('.').reduce((a,k)=>a&&a[k],o);
function set(o,p,v){const k=p.split('.');const last=k.pop();k.reduce((a,x)=>a[x],o)[last]=v;mark();}
function mark(){dirty=true;setStatus('Modifications non enregistrées');}
function setStatus(t,err){const s=$('status');s.textContent=t;s.className=err?'err':'';}
const el=(tag,props={},kids=[])=>{const n=Object.assign(document.createElement(tag),props);kids.forEach(k=>n.append(k));return n;};
const utf8b64=s=>btoa(unescape(encodeURIComponent(s)));
const b64utf8=b=>decodeURIComponent(escape(atob(b.replace(/\s/g,''))));
const hdr=()=>({Authorization:'Bearer '+sessionStorage.getItem('tk'),Accept:'application/vnd.github+json','Content-Type':'application/json'});
const url=p=>`${api}/repos/${encodeURIComponent(cfg.owner)}/${encodeURIComponent(cfg.repo)}/contents/${p.split('/').map(encodeURIComponent).join('/')}`;
async function gh(path,opts={}){const r=await fetch(url(path)+(opts.method==='PUT'?'':'?ref='+encodeURIComponent(cfg.branch)),{headers:hdr(),...opts});
  if(r.status===404)return null;if(!r.ok)throw new Error('GitHub a répondu '+r.status);return r.json();}

// ---------- Champs ----------
function field(obj,path,label,type,extra,item){
  const v=get(obj,path);
  if(type==='color'){const i=el('input',{type:'color',value:v});i.oninput=()=>{set(obj,path,i.value);previewColors();};return el('label',{},[label,i]);}
  if(type==='textarea'){const i=el('textarea',{value:v||''});i.oninput=()=>set(obj,path,i.value);return el('label',{},[label,i]);}
  if(type==='select'){const s=el('select');extra.forEach(([val,l])=>s.append(el('option',{value:val,textContent:l,selected:val===v})));s.onchange=()=>set(obj,path,s.value);return el('label',{},[label,s]);}
  if(type==='devices'){const box=el('div',{className:'checks'});[['desktop','Ordinateur'],['mobile','Mobile']].forEach(([k,l])=>{const c=el('input',{type:'checkbox',checked:v.includes(k)});
    c.onchange=()=>{obj[path]=['desktop','mobile'].filter(x=>x===k?c.checked:obj[path].includes(x));mark();};box.append(el('label',{},[c,l]));});return el('fieldset',{},[el('legend',{textContent:label}),box]);}
  if(type==='image'){const img=el('img',{className:'thumb',alt:'Visuel actuel',src:`../@RESSOURCES/travaux/${obj.slug}.webp`});img.onerror=()=>{img.removeAttribute('src');};
    const f=el('input',{type:'file',accept:'image/*'});f.onchange=async()=>{if(!f.files[0])return;try{const{b64,blobUrl}=await toWebp(f.files[0]);pending.set(obj,b64);img.src=blobUrl;mark();}catch(e){setStatus(e.message,true);}};
    return el('label',{},[label,f,img]);}
  if(type==='strlist'||type==='strlist-area')return strlist(obj,path,label,type==='strlist-area');
  if(type==='objlist')return objlist(obj,path,label,extra);
  const i=el('input',{type:'text',value:v||''});i.oninput=()=>set(obj,path,i.value);return el('label',{},[label,i]);
}
function strlist(obj,path,label,area){
  const arr=get(obj,path),box=el('fieldset',{},[el('legend',{textContent:label})]);
  const draw=()=>{box.querySelectorAll('.list-row').forEach(n=>n.remove());addBtn.before(...arr.map((s,i)=>{
    const inp=area?el('textarea',{value:s}):el('input',{type:'text',value:s});inp.oninput=()=>{arr[i]=inp.value;mark();};
    const rm=el('button',{type:'button',textContent:'Retirer'});rm.onclick=()=>{arr.splice(i,1);mark();draw();};
    return el('div',{className:'list-row'},[el('label',{},[inp]),rm]);}));};
  const addBtn=el('button',{type:'button',textContent:'Ajouter'});addBtn.onclick=()=>{arr.push('');mark();draw();};
  box.append(addBtn);draw();return box;
}
function objlist(obj,path,label,fields){
  const arr=get(obj,path),box=el('div',{});const key=path.split('.').pop();
  const draw=()=>{box.replaceChildren(...arr.map((it,i)=>{
    const fs=el('fieldset',{},[el('legend',{textContent:it.title||it.name||`Élément ${i+1}`})]);
    fields.forEach(([p,l,t,x])=>fs.append(field(it,p,l,t,x,it)));
    const bar=el('div',{className:'row-actions'});
    [['Monter',-1],['Descendre',1]].forEach(([n,d])=>{const b=el('button',{type:'button',textContent:n,disabled:i+d<0||i+d>=arr.length});b.onclick=()=>{arr.splice(i+d,0,arr.splice(i,1)[0]);mark();draw();};bar.append(b);});
    const rm=el('button',{type:'button',textContent:'Supprimer'});rm.onclick=()=>{if(confirm('Supprimer cet élément ?')){arr.splice(i,1);mark();draw();}};bar.append(rm);
    fs.append(bar);return fs;}),addBtn);};
  const addBtn=el('button',{type:'button',textContent:'Ajouter : '+label,className:'primary'});
  addBtn.onclick=()=>{arr.push(structuredClone(DEFAULTS[key]));mark();draw();};
  draw();return box;
}

// ---------- Image : recadrage 4:3, WebP 1200 x 900 ----------
async function toWebp(file){
  if(!file.type.startsWith('image/'))throw new Error('Ce fichier n\'est pas une image');
  const bmp=await createImageBitmap(file),W=1200,H=900,c=el('canvas',{width:W,height:H}),g=c.getContext('2d');
  const s=Math.max(W/bmp.width,H/bmp.height),w=bmp.width*s,h=bmp.height*s;g.drawImage(bmp,(W-w)/2,(H-h)/2,w,h);
  let q=0.85,blob;do{blob=await new Promise(r=>c.toBlob(r,'image/webp',q));q-=0.08;}while(blob.size>150*1024&&q>0.3);
  const b64=await new Promise(r=>{const f=new FileReader();f.onload=()=>r(f.result.split(',')[1]);f.readAsDataURL(blob);});
  return{b64,blobUrl:URL.createObjectURL(blob)};
}

// ---------- Aperçu ----------
function previewColors(){try{const r=$('frame').contentDocument.documentElement;for(const[k,v]of Object.entries(data.colors))r.style.setProperty('--c-'+k,v);}catch(e){/* aperçu hors du site publié */}}
$('frame').addEventListener('load',previewColors);
$('pvReload').onclick=()=>$('frame').contentWindow.location.reload();
$('pvInfo').onclick=()=>{try{$('frame').contentDocument.getElementById('infoOpen').click();}catch(e){}};

// ---------- Navigation ----------
function show(id){current=id;const s=SECTIONS.find(x=>x.id===id);
  $('tabs').querySelectorAll('button').forEach(b=>b.setAttribute('aria-current',b.dataset.id===id));
  $('form').replaceChildren(el('h2',{textContent:s.title}),...s.fields.map(([p,l,t,x])=>field(data,p,l,t,x)));}
function buildTabs(){$('tabs').replaceChildren(...SECTIONS.map(s=>{const b=el('button',{type:'button',textContent:s.title});b.dataset.id=s.id;b.onclick=()=>show(s.id);return b;}));}

// ---------- Validation ----------
const HEX=/^#[0-9a-fA-F]{6}$/,HTTPS=/^https:\/\/[^\s"<>\\]+$/,SLUG=/^[a-z0-9-]{1,60}$/;
function validate(){const e=[];
  for(const[k,v]of Object.entries(data.colors))if(!HEX.test(v))e.push('couleur '+k);
  if(!HTTPS.test(data.behance))e.push('adresse Behance (https://)');
  const seen=new Set();
  data.projects.forEach(p=>{if(!SLUG.test(p.slug))e.push('identifiant « '+p.slug+' »');if(seen.has(p.slug))e.push('identifiant en double « '+p.slug+' »');seen.add(p.slug);
    if(p.action.type!=='unavailable'&&!HTTPS.test(p.action.url))e.push('adresse de « '+p.title+' » (https://)');});
  data.socials.forEach(s=>{if(!HTTPS.test(s.url)||!/^\w{1,4}$/.test(s.label))e.push('réseau « '+s.name+' »');});
  return e;}

// ---------- Enregistrement ----------
async function put(path,b64,msg){const cur=await gh(path);
  const r=await fetch(url(path),{method:'PUT',headers:hdr(),body:JSON.stringify({message:msg,content:b64,branch:cfg.branch,...(cur?{sha:cur.sha}:{})})});
  if(!r.ok)throw new Error('Échec de l\'enregistrement de '+path+' ('+r.status+')');}
$('save').onclick=async()=>{
  const errs=validate();if(errs.length){setStatus('À corriger : '+errs.join(', '),true);return;}
  $('save').disabled=true;setStatus('Enregistrement…');
  try{
    const cur=await gh('data/site.json');
    if(cur&&cur.sha!==loadedSha&&!confirm('Le site a été modifié ailleurs depuis le chargement. Écraser quand même ?')){setStatus('Annulé');return;}
    for(const[p,b64]of pending)await put(`@RESSOURCES/travaux/${p.slug}.webp`,b64,'Back office : visuel '+p.slug);
    await put('data/site.json',utf8b64(JSON.stringify(data,null,2)+'\n'),'Back office : mise à jour du contenu');
    pending.clear();dirty=false;loadedSha=(await gh('data/site.json')).sha;
    setStatus('Enregistré. Le site se met à jour dans une à deux minutes.');
  }catch(e){setStatus(e.message,true);}finally{$('save').disabled=false;}};

// ---------- Connexion ----------
async function load(){const f=await gh('data/site.json');if(!f)throw new Error('data/site.json introuvable : vérifiez le dépôt et la branche');
  data=JSON.parse(b64utf8(f.content));loadedSha=f.sha;}
$('connect').onclick=async()=>{
  cfg={owner:$('owner').value.trim(),repo:$('repo').value.trim(),branch:$('branch').value.trim()};
  const tk=$('token').value.trim();if(!tk){$('loginMsg').textContent='Collez votre jeton.';return;}
  sessionStorage.setItem('tk',tk);sessionStorage.setItem('cfg',JSON.stringify(cfg));$('token').value='';
  try{await load();$('login').hidden=true;$('app').hidden=false;$('logout').hidden=false;$('who').textContent=cfg.owner+'/'+cfg.repo;buildTabs();show('colors');}
  catch(e){sessionStorage.removeItem('tk');$('loginMsg').textContent=e.message;}};
$('logout').onclick=()=>{sessionStorage.clear();location.reload();};
window.addEventListener('beforeunload',e=>{if(dirty)e.preventDefault();});
