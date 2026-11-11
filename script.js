const header = document.querySelector('.site-header');
const menuToggle = document.querySelector('.menu-toggle');
const mainNav = document.querySelector('.main-nav');
const tripToggle = document.querySelector('.nav-trip-toggle');
const tripOptions = document.querySelector('.nav-trip-options');

tripToggle.addEventListener('click', () => {
  const isOpen = tripToggle.getAttribute('aria-expanded') === 'true';
  tripToggle.setAttribute('aria-expanded', String(!isOpen));
  tripOptions.classList.toggle('open', !isOpen);
});

function updateHeader() {
  header.classList.toggle('scrolled', window.scrollY > 28);
}
updateHeader();
window.addEventListener('scroll', updateHeader, { passive: true });

const driverIntro = document.querySelector('.driver-intro');
driverIntro.after(document.querySelector('.gallery'));
const driverObserver = new IntersectionObserver((entries, observer) => {
  if (entries[0].isIntersecting) {
    driverIntro.classList.add('is-visible');
    observer.disconnect();
  }
}, { threshold: 0.15, rootMargin: '0px 0px -10% 0px' });
driverObserver.observe(driverIntro);

const driverSlides = [...document.querySelectorAll('.driver-slide')];
const driverSlideButtons = [...document.querySelectorAll('.driver-slider-dots button')];

async function loadDriverImages() {
  if (!window.supabase || !window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) return;
  try {
    const client = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
    const { data, error } = await client.from('site_images').select('image_key, image_url');
    if (error || !data) return;

    const imageUrls = new Map(data.map((image) => [image.image_key, image.image_url]));
    driverSlides.forEach((slide) => {
      const imageUrl = imageUrls.get(slide.dataset.siteImageKey);
      if (imageUrl) slide.src = imageUrl;
    });
  } catch (error) {
    // Keep the default photos if managed images cannot be loaded.
  }
}

loadDriverImages();

let activeDriverSlide = driverSlides.findIndex((slide) => slide.classList.contains('is-active'));

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
    tripToggle.setAttribute('aria-expanded', 'false');
    tripOptions.classList.remove('open');
  });
});

document.getElementById('year').textContent = new Date().getFullYear();

const galleryDialog = document.getElementById('lightbox');
const galleryImage = galleryDialog.querySelector('img');
const galleryGrid = document.querySelector('.gallery-grid');
galleryGrid.addEventListener('click', (event) => {
  const item = event.target.closest('.gallery-item');
  if (!item) return;
  galleryImage.src = item.dataset.full;
  galleryImage.alt = item.querySelector('img').alt;
  galleryDialog.showModal();
});

async function loadManagedGallery() {
  if (!window.supabase || !window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) return;
  const client = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
  const { data, error } = await client
    .from('gallery_photos')
    .select('image_url, caption, position')
    .order('position', { ascending: true });
  if (error || !data?.length) return;

  galleryGrid.replaceChildren();
  data.slice(0, 20).forEach((photo, index) => {
    const caption = photo.caption || `Bali moments ${index + 1}`;
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'gallery-item';
    if (index === 0) item.classList.add('gallery-tall');
    if (index === 2) item.classList.add('gallery-wide');
    item.dataset.full = photo.image_url;
    item.setAttribute('aria-label', `View ${caption}`);

    const image = document.createElement('img');
    image.src = photo.image_url;
    image.alt = caption;
    image.loading = 'lazy';
    const label = document.createElement('span');
    label.textContent = caption;
    const arrow = document.createElement('i');
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = '↗';
    label.append(' ', arrow);
    item.append(image, label);
    galleryGrid.append(item);
  });
}

loadManagedGallery();
galleryDialog.querySelector('.lightbox-close').addEventListener('click', () => galleryDialog.close());
galleryDialog.addEventListener('click', (event) => {
  if (event.target === galleryDialog) galleryDialog.close();
});

const inquiryForm = document.getElementById('inquiry-form');
const formStatus = document.getElementById('form-status');
if (inquiryForm && formStatus) {
  inquiryForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!inquiryForm.reportValidity()) return;
    formStatus.textContent = 'Thanks for sharing your plans. This preview is not connected to an inquiry inbox yet, so your message has not been sent or saved.';
    formStatus.setAttribute('role', 'status');
  });
}
