const loginForm = document.getElementById('login-form');
const priceForm = document.getElementById('price-form');
const adminStatus = document.getElementById('admin-status');
const logoutButton = document.getElementById('logout-button');
const galleryAdmin = document.getElementById('gallery-admin');
const galleryForm = document.getElementById('gallery-form');
const galleryList = document.getElementById('gallery-list');
const galleryCount = document.getElementById('gallery-count');
const priceInputs = [...priceForm.querySelectorAll('[data-tour-id]')];

let supabaseClient;

function showStatus(message) {
  adminStatus.textContent = message;
}

function setSignedIn(isSignedIn) {
  loginForm.classList.toggle('admin-hidden', isSignedIn);
  priceForm.classList.toggle('admin-hidden', !isSignedIn);
  galleryAdmin.classList.toggle('admin-hidden', !isSignedIn);
}

async function loadGallery() {
  const { data, error } = await supabaseClient
    .from('gallery_photos')
    .select('id, image_url, caption, position')
    .order('position', { ascending: true });
  if (error) throw error;

  galleryList.replaceChildren();
  data.forEach((photo) => {
    const item = document.createElement('li');
    const image = document.createElement('img');
    image.src = photo.image_url;
    image.alt = '';
    image.loading = 'lazy';
    const details = document.createElement('span');
    details.textContent = `${photo.position}. ${photo.caption}`;
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.dataset.photoId = photo.id;
    remove.textContent = 'Hapus';
    remove.setAttribute('aria-label', `Hapus foto ${photo.caption}`);
    item.append(image, details, remove);
    galleryList.append(item);
  });
  galleryCount.textContent = `${data.length} / 20 foto`;
  galleryForm.querySelector('button[type="submit"]').disabled = data.length >= 20;
}

async function loadPrices() {
  const { data, error } = await supabaseClient
    .from('tour_prices')
    .select('id, amount_idr');

  if (error) throw error;

  const prices = new Map(data.map((item) => [item.id, item.amount_idr]));
  const missingTours = [];
  priceInputs.forEach((input) => {
    const amount = prices.get(input.dataset.tourId);
    if (amount === undefined) {
      input.value = '';
      missingTours.push(input.dataset.tourId);
    } else {
      input.value = amount;
    }
  });

  if (missingTours.length) {
    throw new Error(`Data harga belum tersedia untuk: ${missingTours.join(', ')}. Periksa setup SQL Supabase.`);
  }
}

if (!window.SUPABASE_URL || window.SUPABASE_URL.includes('YOUR_') || !window.SUPABASE_ANON_KEY || window.SUPABASE_ANON_KEY.includes('YOUR_')) {
  showStatus('Tambahkan Project URL dan anon/public key Supabase di supabase-config.js terlebih dahulu.');
  loginForm.querySelector('button').disabled = true;
} else {
  supabaseClient = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

  async function restoreSession() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) return;
    setSignedIn(true);
    try {
      await loadPrices();
      showStatus('Anda sudah masuk. Harga tur berhasil dimuat.');
    } catch (error) {
      showStatus(`Tidak dapat memuat harga: ${error.message}`);
    }
    try {
      await loadGallery();
    } catch (error) {
      showStatus(`Tidak dapat memuat galeri: ${error.message}. Jalankan setup SQL galeri.`);
    }
  }

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(loginForm);
    showStatus('Memeriksa akun…');
    const { error } = await supabaseClient.auth.signInWithPassword({
      email: formData.get('email'),
      password: formData.get('password')
    });
    if (error) {
      showStatus(`Gagal masuk: ${error.message}`);
      return;
    }
    setSignedIn(true);
    try {
      await loadPrices();
      showStatus('Berhasil masuk. Harga tur dapat diperbarui.');
    } catch (loadError) {
      showStatus(`Tidak dapat memuat harga: ${loadError.message}`);
    }
    try {
      await loadGallery();
    } catch (galleryError) {
      showStatus(`Tidak dapat memuat galeri: ${galleryError.message}. Jalankan setup SQL galeri.`);
    }
  });

  priceForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const prices = priceInputs.map((input) => ({
      id: input.dataset.tourId,
      amount: Number(input.value)
    }));

    if (prices.some(({ amount }) => !Number.isSafeInteger(amount) || amount < 0)) {
      showStatus('Pastikan semua harga Rupiah terisi dengan angka yang valid.');
      return;
    }

    showStatus('Menyimpan semua harga…');
    const results = await Promise.all(prices.map(({ id, amount }) =>
      supabaseClient
        .from('tour_prices')
        .update({ amount_idr: amount, updated_at: new Date().toISOString() })
        .eq('id', id)
    ));
    const errors = results.map((result) => result.error).filter(Boolean);
    showStatus(errors.length
      ? `Gagal menyimpan sebagian harga: ${errors.map((error) => error.message).join('; ')}`
      : 'Semua harga berhasil diperbarui.');
  });

  galleryForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const imageUrl = document.getElementById('gallery-url').value.trim();
    const caption = document.getElementById('gallery-caption').value.trim();
    if (!imageUrl.startsWith('https://')) {
      showStatus('Gunakan tautan foto yang diawali https://.');
      return;
    }

    try {
      const { data, error } = await supabaseClient
        .from('gallery_photos')
        .select('position');
      if (error) throw error;
      if (data.length >= 20) {
        showStatus('Galeri sudah mencapai batas 20 foto. Hapus foto terlebih dahulu.');
        return;
      }
      const usedPositions = new Set(data.map((photo) => photo.position));
      const position = Array.from({ length: 20 }, (_, index) => index + 1)
        .find((number) => !usedPositions.has(number));
      const { error: insertError } = await supabaseClient
        .from('gallery_photos')
        .insert({ image_url: imageUrl, caption, position });
      if (insertError) throw insertError;
      galleryForm.reset();
      await loadGallery();
      showStatus('Foto berhasil ditambahkan ke galeri.');
    } catch (error) {
      showStatus(`Gagal menambahkan foto: ${error.message}`);
    }
  });

  galleryList.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-photo-id]');
    if (!button) return;
    button.disabled = true;
    const { error } = await supabaseClient
      .from('gallery_photos')
      .delete()
      .eq('id', button.dataset.photoId);
    if (error) {
      button.disabled = false;
      showStatus(`Gagal menghapus foto: ${error.message}`);
      return;
    }
    try {
      await loadGallery();
      showStatus('Foto berhasil dihapus.');
    } catch (loadError) {
      showStatus(`Foto terhapus, tetapi daftar gagal dimuat: ${loadError.message}`);
    }
  });

  logoutButton.addEventListener('click', async () => {
    const { error } = await supabaseClient.auth.signOut();
    setSignedIn(false);
    showStatus(error ? `Gagal keluar: ${error.message}` : 'Anda sudah keluar.');
  });

  restoreSession();
}
