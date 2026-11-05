const header = document.querySelector('.site-header');
const menuToggle = document.querySelector('.menu-toggle');
const mainNav = document.querySelector('.main-nav');

function updateHeader() {
  header.classList.toggle('scrolled', window.scrollY > 28);
}
updateHeader();
window.addEventListener('scroll', updateHeader, { passive: true });

const driverIntro = document.querySelector('.driver-intro');
const driverObserver = new IntersectionObserver((entries, observer) => {
  if (entries[0].isIntersecting) {
    driverIntro.classList.add('is-visible');
    observer.disconnect();
  }
}, { threshold: 0.15, rootMargin: '0px 0px -10% 0px' });
driverObserver.observe(driverIntro);

menuToggle.addEventListener('click', () => {
  const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
  menuToggle.setAttribute('aria-expanded', String(!isOpen));
  menuToggle.setAttribute('aria-label', isOpen ? 'Open navigation' : 'Close navigation');
  mainNav.classList.toggle('open', !isOpen);
  header.classList.toggle('menu-open', !isOpen);
});

mainNav.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open navigation');
    mainNav.classList.remove('open');
    header.classList.remove('menu-open');
  });
});

document.getElementById('year').textContent = new Date().getFullYear();

const galleryDialog = document.getElementById('lightbox');
const galleryImage = galleryDialog.querySelector('img');
document.querySelectorAll('.gallery-item').forEach((item) => {
  item.addEventListener('click', () => {
    galleryImage.src = item.dataset.full;
    galleryImage.alt = item.querySelector('img').alt;
    galleryDialog.showModal();
  });
});
galleryDialog.querySelector('.lightbox-close').addEventListener('click', () => galleryDialog.close());
galleryDialog.addEventListener('click', (event) => {
  if (event.target === galleryDialog) galleryDialog.close();
});

const inquiryForm = document.getElementById('inquiry-form');
const formStatus = document.getElementById('form-status');
inquiryForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!inquiryForm.reportValidity()) return;
  formStatus.textContent = 'Thanks for sharing your plans. This preview is not connected to an inquiry inbox yet, so your message has not been sent or saved.';
  formStatus.setAttribute('role', 'status');
});
