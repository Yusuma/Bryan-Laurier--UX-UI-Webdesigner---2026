  const overlay = document.getElementById('overlay');
  const openBtn = document.getElementById('infoOpen');
  const closeBtn = document.getElementById('infoClose');

  function openOverlay(){
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeOverlay(){
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }
  openBtn.addEventListener('click', openOverlay);
  closeBtn.addEventListener('click', closeOverlay);

  // Modale "projet indisponible"
  const unavailableModal = document.getElementById('unavailableModal');
  const unavailableClose = document.getElementById('unavailableClose');

  function openUnavailable(e){
    e.preventDefault();
    unavailableModal.classList.add('open');
  }
  function closeUnavailable(){
    unavailableModal.classList.remove('open');
  }

  document.querySelectorAll('[data-unavailable]').forEach(link => {
    link.addEventListener('click', openUnavailable);
  });
  unavailableClose.addEventListener('click', closeUnavailable);
  unavailableModal.addEventListener('click', (e) => {
    if (e.target === unavailableModal) closeUnavailable();
  });

  // Modale "avertissement épilepsie"
  const epilepsyModal = document.getElementById('epilepsyModal');
  const epilepsyClose = document.getElementById('epilepsyClose');
  const epilepsyCancel = document.getElementById('epilepsyCancel');
  const epilepsyContinue = document.getElementById('epilepsyContinue');

  function openEpilepsy(e){
    e.preventDefault();
    epilepsyContinue.setAttribute('href', e.currentTarget.dataset.epilepsyUrl);
    epilepsyModal.classList.add('open');
  }
  function closeEpilepsy(){
    epilepsyModal.classList.remove('open');
  }

  document.querySelectorAll('[data-epilepsy-url]').forEach(link => {
    link.addEventListener('click', openEpilepsy);
  });
  epilepsyClose.addEventListener('click', closeEpilepsy);
  epilepsyCancel.addEventListener('click', closeEpilepsy);
  epilepsyContinue.addEventListener('click', closeEpilepsy);
  epilepsyModal.addEventListener('click', (e) => {
    if (e.target === epilepsyModal) closeEpilepsy();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape'){
      closeOverlay();
      closeUnavailable();
      closeEpilepsy();
    }
  });
