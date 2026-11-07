(() => {
  const current = location.pathname.split('/').pop() || 'index.html';
  const activePage = current === 'project-learning.html' ? 'work.html' : current;
  const links = [
    ['index.html', 'Home'], ['lab.html', 'Field'], ['work.html', 'Barn'],
    ['about.html', 'Journal'], ['contact.html', 'Mailbox']
  ];
  const header = document.getElementById('site-header');
  const footer = document.getElementById('site-footer');

  if (header) {
    header.innerHTML = `<nav class="site-nav" aria-label="Main navigation">
      <a class="brand" href="index.html" aria-label="Matt's Pocket Farm home"><span class="brand-mark" aria-hidden="true"><i></i></span><span>Matt's Pocket Farm</span></a>
      <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="nav-links" aria-label="Open menu"><span></span></button>
      <div class="nav-links" id="nav-links" data-open="false">${links.map(([url, label]) => `<a href="${url}"${activePage === url ? ' aria-current="page"' : ''}>${label}</a>`).join('')}</div>
      <span class="nav-tag">FARM ONLINE</span></nav>`;
    const toggle = header.querySelector('.menu-toggle');
    const nav = header.querySelector('.nav-links');
    toggle.addEventListener('click', () => {
      const open = nav.dataset.open !== 'true';
      nav.dataset.open = String(open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    nav.addEventListener('click', event => {
      if (event.target.closest('a')) {
        nav.dataset.open = 'false';
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  if (footer) {
    footer.className = 'site-footer';
    footer.innerHTML = `<div><p class="section-number">MATT'S POCKET FARM</p><p class="footer-title">A small digital place where ideas are given room to grow.</p><p class="footer-note">Designed and built by Matt with HTML, CSS, JavaScript and a healthy amount of curiosity.</p></div>
      <nav class="footer-nav" aria-label="Footer navigation">${links.map(([url, label]) => `<a href="${url}">${label} <span>↗</span></a>`).join('')}<a href="https://github.com/Matt-061224" target="_blank" rel="noopener noreferrer">GitHub <span>↗</span></a></nav>
      <div class="footer-bottom"><span>© ${new Date().getFullYear()} MATT</span><span>PLANTED ON THE WEB · GROWN WITH CODE</span></div>`;
  }

  const filterButtons = document.querySelectorAll('[data-filter]');
  const cards = document.querySelectorAll('[data-category]');
  if (filterButtons.length && cards.length) {
    filterButtons.forEach(button => button.addEventListener('click', () => {
      const filter = button.dataset.filter;
      let visible = 0;
      filterButtons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      cards.forEach(card => {
        card.hidden = filter !== 'all' && card.dataset.category !== filter;
        if (!card.hidden) visible += 1;
      });
      const status = document.getElementById('filter-status');
      if (status) status.textContent = `${visible} project${visible === 1 ? '' : 's'} shown.`;
    }));
  }
})();
