// Assemble l'email et le téléphone côté navigateur, hors du HTML source (anti-collecte)
document.querySelectorAll('[data-mail]').forEach(a=>{
  const m=a.dataset.u+'@'+a.dataset.d;a.href='mailto:'+m;
  if(!('keep' in a.dataset))a.textContent=m;
});
document.querySelectorAll('[data-tel]').forEach(a=>{
  const t=a.dataset.a+' '+a.dataset.b;a.href='tel:'+t.replace(/\s/g,'');a.textContent=t;
});
