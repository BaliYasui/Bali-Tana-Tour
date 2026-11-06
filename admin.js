const loginForm = document.getElementById('login-form');
const priceForm = document.getElementById('price-form');
const adminStatus = document.getElementById('admin-status');
const logoutButton = document.getElementById('logout-button');
const photoManager = document.getElementById('photo-manager');
const photoItems = [...photoManager.querySelectorAll('[data-photo-id]')];
const priceInputs = [...priceForm.querySelectorAll('[data-tour-id]')];

let supabaseClient;

function showStatus(message) {
  adminStatus.textContent = message;
}

function setSignedIn(isSignedIn) {
  loginForm.classList.toggle('admin-hidden', isSignedIn);
  priceForm.classList.toggle('admin-hidden', !isSignedIn);
  photoManager.classList.toggle('admin-hidden', !isSignedIn);
}

async function loadPhotoPreviews() {
  const { data, error } = await supabaseClient
    .from('site_images')
    .select('id, image_url');

  if (error) throw error;

  const imageUrls = new Map(data.map((item) => [item.id, item.image_url]));
  photoItems.forEach((item) => {
    const imageUrl = imageUrls.get(item.dataset.photoId);
    const preview = item.querySelector('.admin-photo-preview');
    if (imageUrl) preview.src = imageUrl;
  });
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
      await Promise.all([loadPrices(), loadPhotoPreviews()]);
      showStatus('Anda sudah masuk. Harga dan foto slide berhasil dimuat.');
    } catch (error) {
      showStatus(`Tidak dapat memuat data admin: ${error.message}`);
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
      await Promise.all([loadPrices(), loadPhotoPreviews()]);
      showStatus('Berhasil masuk. Harga dan foto slide dapat diperbarui.');
    } catch (loadError) {
      showStatus(`Tidak dapat memuat harga: ${loadError.message}`);
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

  photoItems.forEach((item) => {
    const fileInput = item.querySelector('[data-photo-file]');
    const uploadButton = item.querySelector('[data-photo-upload]');

    fileInput.addEventListener('change', () => {
      const file = fileInput.files[0];
      if (file && file.type.startsWith('image/')) {
        item.querySelector('.admin-photo-preview').src = URL.createObjectURL(file);
      }
    });

    uploadButton.addEventListener('click', async () => {
      const file = fileInput.files[0];
      if (!file) {
        showStatus('Pilih foto terlebih dahulu dari ponsel Anda.');
        fileInput.focus();
        return;
      }
      if (!file.type.startsWith('image/')) {
        showStatus('File harus berupa gambar.');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        showStatus('Ukuran gambar maksimal 10 MB.');
        return;
      }

      const photoId = item.dataset.photoId;
      const extension = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
      const filePath = `${photoId}/${Date.now()}.${extension}`;
      uploadButton.disabled = true;
      showStatus(`Mengunggah foto ${photoId.replace('driver-photo-', '')}…`);

      try {
        const { error: uploadError } = await supabaseClient.storage
          .from('site-images')
          .upload(filePath, file, { cacheControl: '3600', contentType: file.type, upsert: false });
        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabaseClient.storage
          .from('site-images')
          .getPublicUrl(filePath);
        const { data, error: updateError } = await supabaseClient
          .from('site_images')
          .update({ image_url: publicUrlData.publicUrl })
          .eq('id', photoId)
          .select('id');
        if (updateError) throw updateError;
        if (!data.length) throw new Error(`Baris ${photoId} tidak ditemukan atau tidak diizinkan diperbarui.`);

        item.querySelector('.admin-photo-preview').src = publicUrlData.publicUrl;
        fileInput.value = '';
        showStatus(`Foto slide ${photoId.replace('driver-photo-', '')} berhasil diperbarui.`);
      } catch (error) {
        showStatus(`Gagal mengunggah foto: ${error.message}`);
      } finally {
        uploadButton.disabled = false;
      }
    });
  });

  logoutButton.addEventListener('click', async () => {
    const { error } = await supabaseClient.auth.signOut();
    setSignedIn(false);
    showStatus(error ? `Gagal keluar: ${error.message}` : 'Anda sudah keluar.');
  });

  restoreSession();
}
