(() => {
  const listing = document.getElementById('listing');
  const bCopyFile = listing.querySelector(':scope > .controls .fa-copy');

  bCopyFile.addEventListener('click', (e) => {
    const text = listing.querySelector('#list-view').textContent;
    console.log('copy-file');
    if (navigator.clipboard?.writeText) {
      console.log('writeText', text);
      navigator.clipboard.writeText(text);

      e.target.classList.add('fa-check');
      e.target.classList.remove('fa-copy');
      setTimeout(() => {
        console.log('remove check');
        e.target.classList.remove('fa-check');
        e.target.classList.add('fa-copy');
      }, 300);
    }
  });
})();
