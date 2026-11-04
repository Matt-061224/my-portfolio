(() => {
 const current = location.pathname.split('/').pop() || 'index.html';
 const links = [['index.html','Home'],['work.html','Work'],['about.html','About'],['contact.html','Contact']];
 document.getElementById('header').innerHTML = `<nav class="wrap nav" aria-label="Main navigation"><a class="logo" href="index.html">Matt<span>↗</span></a><div class="nav-links">${links.map(([url,label])=>`<a href="${url}"${(current===url||(current==='project-learning.html'&&url==='work.html'))?' aria-current="page"':''}>${label}</a>`).join('')}</div><span class="nav-note">A PERSONAL EXPLORATION</span></nav>`;
 document.getElementById('footer').innerHTML = `<div class="wrap footer-inner"><a class="logo" href="index.html">Matt<span>↗</span></a><p>Built with curiosity. Refined with care.</p><a href="https://github.com/Matt-061224" target="_blank" rel="noopener noreferrer">GitHub ↗</a><span>© ${new Date().getFullYear()} Matt</span></div>`;
 document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{
  document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  let visible = 0;
  document.querySelectorAll('[data-category]').forEach(card=>{card.hidden=button.dataset.filter!=='all'&&card.dataset.category!==button.dataset.filter;if(!card.hidden)visible++;});
  document.getElementById('filter-status').textContent = `${visible} project${visible===1?'':'s'} shown`;
 }));
})();