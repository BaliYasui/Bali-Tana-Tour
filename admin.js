
// ==========================================
// BALI TANA TOUR - MAIN SCRIPT
// ==========================================


// 1. HEADER & NAVIGATION
// ==========================================

const header = document.querySelector('.site-header');
const menuToggle = document.querySelector('.menu-toggle');
const mainNav = document.querySelector('.main-nav');
const tripToggle = document.querySelector('.nav-trip-toggle');
const tripOptions = document.querySelector('.nav-trip-options');

if (tripToggle && tripOptions) {
  tripToggle.addEventListener('click', () => {
    const isOpen = tripToggle.getAttribute('aria-expanded') === 'true';

    tripToggle.setAttribute('aria-expanded', String(!isOpen));
    tripOptions.classList.toggle('open', !isOpen);
  });
}

function updateHeader() {
  if (header) {
    header.classList.toggle('scrolled', window.scrollY > 28);
  }
}

updateHeader();
window.addEventListener('scroll', updateHeader, { passive: true });


// 2. DRIVER INTRO ANIMATION
// ==========================================

const driverIntro = document.querySelector('.driver-intro');

if (driverIntro) {
  const gallerySection = document.querySelector('.gallery');

  if (gallerySection) {
    driverIntro.after(gallerySection);
  }

  if ('IntersectionObserver' in window) {
    const driverObserver = new IntersectionObserver(
      (entries, observer) => {
        if (entries[0].isIntersecting) {
          driverIntro.classList.add('is-visible');
          observer.disconnect();
        }
      },
      {
        threshold: 0.15,
        rootMargin: '0px 0px -10% 0px'
      }
    );

    driverObserver.observe(driverIntro);
  } else {
    driverIntro.classList.add('is-visible');
  }
}


// 3. DRIVER SLIDER
// ==========================================

const driverSlides = [
  ...document.querySelectorAll('.driver-slide')
];

const driverSlideButtons = [
  ...document.querySelectorAll('.driver-slider-dots button')
];

let activeDriverSlide = Math.max(
  0,
  driverSlides.findIndex(slide =>
    slide.classList.contains('is-active')
  )
);


// 4. LOAD DRIVER IMAGES FROM SUPABASE
// ==========================================

async function loadDriverImages() {

  if (
    !window.supabase ||
    !window.SUPABASE_URL ||
    !window.SUPABASE_ANON_KEY
  ) {
    console.error('Supabase configuration is not available.');
    return;
  }

  try {

    const client = window.supabase.createClient(
      window.SUPABASE_URL,
      window.SUPABASE_ANON_KEY
    );

    const { data, error } = await client
      .from('site_images')
      .select('id, image_url');

    if (error) {
      console.error('Failed to load driver images:', error.message);
      return;
    }

    if (!data || data.length === 0) {
      console.warn('No driver images found in site_images.');
      return;
    }

    // Match database ID with HTML data-site-image-key
    const imageUrls = new Map(
      data.map(image => [
        image.id,
        image.image_url
      ])
    );

    driverSlides.forEach(slide => {

      const imageKey = slide.dataset.siteImageKey;
      const imageUrl = imageUrls.get(imageKey);

      if (imageUrl) {

        // Load the latest image from Supabase
        slide.src = imageUrl;

        slide.dataset.loadedFromSupabase = 'true';

        console.log(
          `Driver image loaded: ${imageKey}`
        );

      } else {

        console.warn(
          `Driver image not found: ${imageKey}`
        );

      }

    });

    console.log('Driver images successfully loaded from Supabase.');

  } catch (error) {

    console.error(
      'Error loading driver images:',
      error
    );

  }

}

loadDriverImages();


// 5. SHOW DRIVER SLIDE
// ==========================================

function showDriverSlide(index) {

  if (!driverSlides.length) return;

  activeDriverSlide =
    (index + driverSlides.length) % driverSlides.length;

  driverSlides.forEach((slide, slideIndex) => {

    const isActive = slideIndex === activeDriverSlide;

    slide.classList.toggle('is-active', isActive);

    slide.setAttribute(
      'aria-hidden',
      String(!isActive)
    );

  });

  driverSlideButtons.forEach((button, buttonIndex) => {

    const isActive = buttonIndex === activeDriverSlide;

    button.classList.toggle('is-active', isActive);

    button.setAttribute(
      'aria-pressed',
      String(isActive)
    );

  });

}


// 6. DRIVER SLIDER BUTTONS
// ==========================================

driverSlideButtons.forEach((button, index) => {

  button.addEventListener('click', () => {

    showDriverSlide(index);

    startDriverSlideTimer();

  });

});


// 7. AUTOMATIC DRIVER SLIDER
// ==========================================

let driverSlideTimer = null;

function startDriverSlideTimer() {

  clearInterval(driverSlideTimer);

  if (
    driverSlides.length < 2 ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    return;
  }

  driverSlideTimer = setInterval(() => {

    showDriverSlide(
      (activeDriverSlide + 1) % driverSlides.length
    );

  }, 4000);

}

startDriverSlideTimer();


// 8. MOBILE NAVIGATION
// ==========================================

if (menuToggle && mainNav && header) {

  menuToggle.addEventListener('click', () => {

    const isOpen =
      menuToggle.getAttribute('aria-expanded') === 'true';

    menuToggle.setAttribute(
      'aria-expanded',
      String(!isOpen)
    );

    menuToggle.setAttribute(
      'aria-label',
      isOpen ? 'Open navigation' : 'Close navigation'
    );

    mainNav.classList.toggle('open', !isOpen);

    header.classList.toggle('menu-open', !isOpen);

  });

}


// 9. CLOSE MOBILE MENU AFTER CLICKING A LINK
// ==========================================

if (mainNav) {

  mainNav.querySelectorAll('a').forEach(link => {

    link.addEventListener('click', () => {

      if (menuToggle) {

        menuToggle.setAttribute('aria-expanded', 'false');

        menuToggle.setAttribute(
          'aria-label',
          'Open navigation'
        );

      }

      mainNav.classList.remove('open');

      if (header) {
        header.classList.remove('menu-open');
      }

      if (tripToggle) {
        tripToggle.setAttribute('aria-expanded', 'false');
      }

      if (tripOptions) {
        tripOptions.classList.remove('open');
      }

    });

  });

}


// 10. AUTOMATIC COPYRIGHT YEAR
// ==========================================

const yearElement = document.getElementById('year');

if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}


// 11. GALLERY LIGHTBOX
// ==========================================

const galleryDialog = document.getElementById('lightbox');

const galleryImage = galleryDialog
  ? galleryDialog.querySelector('img')
  : null;

const galleryGrid = document.querySelector('.gallery-grid');

if (galleryDialog && galleryImage && galleryGrid) {

  galleryGrid.addEventListener('click', event => {

    const item = event.target.closest('.gallery-item');

    if (!item) return;

    galleryImage.src = item.dataset.full;

    const thumbnail = item.querySelector('img');

    galleryImage.alt = thumbnail
      ? thumbnail.alt
      : 'Bali gallery photograph';

    galleryDialog.showModal();

  });

  const closeButton = galleryDialog.querySelector(
    '.lightbox-close'
  );

  if (closeButton) {
    closeButton.addEventListener('click', () => {
      galleryDialog.close();
    });
  }

  galleryDialog.addEventListener('click', event => {

    if (event.target === galleryDialog) {
      galleryDialog.close();
    }

  });

}


// 12. LOAD GALLERY PHOTOS FROM SUPABASE
// ==========================================

async function loadManagedGallery() {

  if (
    !window.supabase ||
    !window.SUPABASE_URL ||
    !window.SUPABASE_ANON_KEY ||
    !galleryGrid
  ) {
    console.warn('Gallery or Supabase configuration is unavailable.');
    return;
  }

  try {

    const client = window.supabase.createClient(
      window.SUPABASE_URL,
      window.SUPABASE_ANON_KEY
    );

    const { data, error } = await client
      .from('gallery_photos')
      .select('image_url, caption, position')
      .order('position', {
        ascending: true
      });

    if (error) {
      console.error('Failed to load gallery:', error.message);
      return;
    }

    if (!data || data.length === 0) {
      console.warn('No managed gallery photos found.');
      return;
    }

    galleryGrid.replaceChildren();

    data.slice(0, 20).forEach((photo, index) => {

      const caption =
        photo.caption || `Bali moments ${index + 1}`;

      const item = document.createElement('button');

      item.type = 'button';
      item.className = 'gallery-item';

      if (index === 0) {
        item.classList.add('gallery-tall');
      }

      if (index === 2) {
        item.classList.add('gallery-wide');
      }

      item.dataset.full = photo.image_url;

      item.setAttribute(
        'aria-label',
        `View ${caption}`
      );

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

    console.log('Gallery successfully loaded from Supabase.');

  } catch (error) {

    console.error(
      'Error loading managed gallery:',
      error
    );

  }

}

loadManagedGallery();


// 13. INQUIRY FORM
// ==========================================

const inquiryForm = document.getElementById('inquiry-form');

const formStatus = document.getElementById('form-status');

if (inquiryForm && formStatus) {

  inquiryForm.addEventListener('submit', event => {

    event.preventDefault();

    if (!inquiryForm.reportValidity()) {
      return;
    }

    formStatus.textContent =
      'Thanks for sharing your plans. This preview is not connected to an inquiry inbox yet, so your message has not been sent or saved.';

    formStatus.setAttribute('role', 'status');

  });

}


// ==========================================
// END OF BALI TANA TOUR SCRIPT
// ==========================================
