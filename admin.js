const loginForm = document.getElementById('login-form');
const priceForm = document.getElementById('price-form');
const priceInput = document.getElementById('price-input');
const adminStatus = document.getElementById('admin-status');
const logoutButton = document.getElementById('logout-button');

let supabaseClient;

function showStatus(message) {
  adminStatus.textContent = message;
}

function setSignedIn(isSignedIn) {
  loginForm.classList.toggle('admin-hidden', isSignedIn);
  priceForm.classList.toggle('admin-hidden', !isSignedIn);
}

async function loadPrice() {
  const { data, error } = await supabaseClient
    .from('tour_prices')
    .select('amount_idr')
    .eq('id', 'ubud-cultural-tour')
    .single();

  if (error) throw error;
  priceInput.value = data.amount_idr;
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
      await loadPrice();
      showStatus('Anda sudah masuk.');
    } catch (error) {
      showStatus(`Tidak dapat memuat harga: ${error.message}`);
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
      await loadPrice();
      showStatus('Berhasil masuk. Harga dapat diperbarui.');
    } catch (loadError) {
      showStatus(`Tidak dapat memuat harga: ${loadError.message}`);
    }
  });

  priceForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const amount = Number(priceInput.value);
    if (!Number.isSafeInteger(amount) || amount < 0) {
      showStatus('Masukkan harga Rupiah yang valid.');
      return;
    }
    showStatus('Menyimpan harga…');
    const { error } = await supabaseClient
      .from('tour_prices')
      .update({ amount_idr: amount, updated_at: new Date().toISOString() })
      .eq('id', 'ubud-cultural-tour');
    showStatus(error ? `Gagal menyimpan harga: ${error.message}` : 'Harga berhasil diperbarui.');
  });

  logoutButton.addEventListener('click', async () => {
    const { error } = await supabaseClient.auth.signOut();
    setSignedIn(false);
    showStatus(error ? `Gagal keluar: ${error.message}` : 'Anda sudah keluar.');
  });

  restoreSession();
}
