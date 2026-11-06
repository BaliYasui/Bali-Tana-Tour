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

const driverSlides = [...document.querySelectorAll('.driver-slide')];
const driverSlideButtons = [...document.querySelectorAll('.driver-slider-dots button')];
let activeDriverSlide = driverSlides.findIndex((slide) => slide.classList.contains('is-active'));

async function loadDriverPhotos() {
  if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY || !window.supabase) return;
  const client = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
  const { data, error } = await client.from('site_images').select('id, image_url');
  if (error) return;

  const images = new Map(data.map((item) => [item.id, item.image_url]));
  driverSlides.forEach((slide, index) => {
    const imageUrl = images.get(`driver-photo-${index + 1}`);
    if (imageUrl) slide.src = imageUrl;
  });
}

loadDriverPhotos();

function showDriverSlide(index) {
  activeDriverSlide = index;
  driverSlides.forEach((slide, slideIndex) => {
    const isActive = slideIndex === index;
    slide.classList.toggle('is-active', isActive);
    slide.setAttribute('aria-hidden', String(!isActive));
    driverSlideButtons[slideIndex].classList.toggle('is-active', isActive);
    driverSlideButtons[slideIndex].setAttribute('aria-pressed', String(isActive));
  });
}

driverSlideButtons.forEach((button, index) => {
  button.addEventListener('click', () => {
    showDriverSlide(index);
    startDriverSlideTimer();
  });
});

let driverSlideTimer;
function startDriverSlideTimer() {
  clearInterval(driverSlideTimer);
  if (driverSlides.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  driverSlideTimer = setInterval(() => {
    showDriverSlide((activeDriverSlide + 1) % driverSlides.length);
  }, 4000);
}
startDriverSlideTimer();

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
