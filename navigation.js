const menuToggle = document.querySelector('.menu-toggle');
const mainNav = document.querySelector('.main-nav');
const tripToggle = document.querySelector('.nav-trip-toggle');
const tripOptions = document.querySelector('.nav-trip-options');
const siteHeader = document.querySelector('.site-header');

if (menuToggle && mainNav) {
  menuToggle.addEventListener('click', () => {
    const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', String(!isOpen));
    menuToggle.setAttribute('aria-label', isOpen ? 'Open navigation' : 'Close navigation');
    mainNav.classList.toggle('open', !isOpen);
    siteHeader?.classList.toggle('menu-open', !isOpen);
  });

  mainNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.setAttribute('aria-label', 'Open navigation');
      mainNav.classList.remove('open');
      siteHeader?.classList.remove('menu-open');
      tripToggle?.setAttribute('aria-expanded', 'false');
      tripOptions?.classList.remove('open');
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.setAttribute('aria-label', 'Open navigation');
      mainNav.classList.remove('open');
      siteHeader?.classList.remove('menu-open');
      tripToggle?.setAttribute('aria-expanded', 'false');
      tripOptions?.classList.remove('open');
    }
  });
}

if (tripToggle && tripOptions) {
  tripToggle.addEventListener('click', () => {
    const isOpen = tripToggle.getAttribute('aria-expanded') === 'true';
    tripToggle.setAttribute('aria-expanded', String(!isOpen));
    tripOptions.classList.toggle('open', !isOpen);
  });
}
