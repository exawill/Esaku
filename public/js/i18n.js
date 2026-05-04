(function () {
  const DICT = {
    en: {
      "nav.product": "Product",
      "nav.pricing": "Pricing",
      "nav.feature": "Features",
      "nav.signin": "Sign in",
      "nav.signup": "Sign up free",
      "hero.eyebrow": "Built for Indonesia",
      "hero.title": "Accept QRIS payments at a flat 0.7% fee.",
      "hero.subtitle": "Esaku is the modern QRIS payment gateway for creators, shops, and businesses. One dashboard, transparent pricing, and fast withdrawals to your bank or e-wallet.",
      "hero.cta_primary": "Start free",
      "hero.cta_secondary": "See dashboard",
      "hero.badge": "0.7% Flat Fee",
      "feature.title": "Everything you need to get paid",
      "feature.subtitle": "Tools designed around how Indonesian businesses actually operate.",
      "feature.qris.title": "Universal QRIS",
      "feature.qris.body": "Generate QRIS codes that work with every major Indonesian wallet and bank app.",
      "feature.fees.title": "Transparent fees",
      "feature.fees.body": "0.7% flat per QRIS transaction. Withdraw to bank for IDR 6,500 or e-wallet for IDR 2,500.",
      "feature.dash.title": "Simple dashboard",
      "feature.dash.body": "See activity over 7, 30, or 90 days. Filter, export, and track every payment.",
      "pricing.title": "Pricing",
      "pricing.subtitle": "One simple price. No hidden fees, no monthly minimums.",
      "pricing.flat": "0.7% per QRIS transaction",
      "pricing.included_1": "Unlimited QRIS generation",
      "pricing.included_2": "7 / 30 / 90 day analytics",
      "pricing.included_3": "Bank & e-wallet withdrawals",
      "pricing.included_4": "English & Indonesian UI",
      "pricing.cta": "Sign up for free",
      "preview.title": "A dashboard you'll actually want to open",
      "preview.subtitle": "Activity at a glance. Generate a QRIS, withdraw, and view transactions — all from one place.",
      "footer.copyright": "© 2026 Esaku. All rights reserved.",
      "auth.signin_title": "Welcome back",
      "auth.signup_title": "Create your account",
      "auth.email": "Email",
      "auth.password": "Password",
      "auth.name": "Full name",
      "auth.signin_btn": "Sign in",
      "auth.signup_btn": "Create account",
      "auth.or": "or",
      "auth.hostinger": "Continue with Hostinger",
      "auth.toggle_signin": "Already have an account? Sign in",
      "auth.toggle_signup": "Don't have an account? Sign up",
      "side.dashboard": "Dashboard",
      "side.qris": "Generate QRIS",
      "side.withdrawal": "Withdrawal",
      "side.transactions": "Transactions",
      "side.cms": "Admin CMS",
      "side.signout": "Sign out",
      "common.loading": "Loading...",
      "common.balance": "Balance",
      "common.range_7": "7 days",
      "common.range_30": "30 days",
      "common.range_90": "90 days",
      "common.amount": "Amount",
      "common.status": "Status",
      "common.date": "Date",
      "common.type": "Type",
      "common.description": "Description",
      "common.cancel": "Cancel",
      "common.save": "Save",
      "common.copy": "Copy",
      "common.copied": "Copied",
      "qris.title": "Generate QRIS",
      "qris.amount_label": "Amount (IDR)",
      "qris.create": "Create QRIS",
      "qris.expires": "Expires in",
      "qris.fee_note": "A flat 0.7% fee is deducted on payment.",
      "wd.title": "Withdrawal",
      "wd.method": "Method",
      "wd.bank": "Bank Transfer",
      "wd.ewallet": "E-Wallet",
      "wd.dest": "Account / phone number",
      "wd.amount": "Amount (IDR)",
      "wd.submit": "Request withdrawal",
      "wd.fee_note_bank": "Bank transfer fee: IDR 6,500",
      "wd.fee_note_ewallet": "E-wallet fee: IDR 2,500",
      "wd.min_note": "Minimum withdrawal: IDR 50,000",
      "tx.title": "Transactions",
      "profile.title": "Profile",
      "profile.update": "Update profile",
      "profile.change_password": "Change password",
      "profile.current_password": "Current password",
      "profile.new_password": "New password",
      "admin.title": "Admin CMS",
      "admin.qris_provider": "QRIS Provider API",
      "admin.fees": "Fees",
      "admin.branding": "Branding",
      "admin.users": "Users",
      "admin.withdrawals": "Withdrawals queue"
    },
    id: {
      "nav.product": "Produk",
      "nav.pricing": "Harga",
      "nav.feature": "Fitur",
      "nav.signin": "Masuk",
      "nav.signup": "Daftar gratis",
      "hero.eyebrow": "Dibuat untuk Indonesia",
      "hero.title": "Terima pembayaran QRIS dengan biaya flat 0,7%.",
      "hero.subtitle": "Esaku adalah payment gateway QRIS modern untuk kreator, toko, dan bisnis. Satu dasbor, harga transparan, dan penarikan cepat ke bank atau e-wallet Anda.",
      "hero.cta_primary": "Mulai gratis",
      "hero.cta_secondary": "Lihat dasbor",
      "hero.badge": "Biaya Flat 0,7%",
      "feature.title": "Semua yang Anda butuhkan untuk menerima pembayaran",
      "feature.subtitle": "Alat yang dirancang sesuai cara bisnis Indonesia bekerja.",
      "feature.qris.title": "QRIS Universal",
      "feature.qris.body": "Buat kode QRIS yang bekerja di seluruh aplikasi dompet dan bank ternama di Indonesia.",
      "feature.fees.title": "Biaya transparan",
      "feature.fees.body": "0,7% flat per transaksi QRIS. Tarik ke bank IDR 6.500 atau e-wallet IDR 2.500.",
      "feature.dash.title": "Dasbor sederhana",
      "feature.dash.body": "Lihat aktivitas 7, 30, atau 90 hari. Filter, ekspor, dan pantau setiap pembayaran.",
      "pricing.title": "Harga",
      "pricing.subtitle": "Satu harga sederhana. Tanpa biaya tersembunyi, tanpa minimum bulanan.",
      "pricing.flat": "0,7% per transaksi QRIS",
      "pricing.included_1": "Pembuatan QRIS tanpa batas",
      "pricing.included_2": "Analitik 7 / 30 / 90 hari",
      "pricing.included_3": "Tarik ke bank & e-wallet",
      "pricing.included_4": "Antarmuka Bahasa Inggris & Indonesia",
      "pricing.cta": "Daftar gratis",
      "preview.title": "Dasbor yang menyenangkan untuk dibuka",
      "preview.subtitle": "Aktivitas dalam sekejap. Buat QRIS, tarik dana, dan lihat transaksi — semua di satu tempat.",
      "footer.copyright": "© 2026 Esaku. Hak cipta dilindungi.",
      "auth.signin_title": "Selamat datang kembali",
      "auth.signup_title": "Buat akun Anda",
      "auth.email": "Email",
      "auth.password": "Kata sandi",
      "auth.name": "Nama lengkap",
      "auth.signin_btn": "Masuk",
      "auth.signup_btn": "Buat akun",
      "auth.or": "atau",
      "auth.hostinger": "Lanjutkan dengan Hostinger",
      "auth.toggle_signin": "Sudah punya akun? Masuk",
      "auth.toggle_signup": "Belum punya akun? Daftar",
      "side.dashboard": "Dasbor",
      "side.qris": "Buat QRIS",
      "side.withdrawal": "Penarikan",
      "side.transactions": "Transaksi",
      "side.cms": "CMS Admin",
      "side.signout": "Keluar",
      "common.loading": "Memuat...",
      "common.balance": "Saldo",
      "common.range_7": "7 hari",
      "common.range_30": "30 hari",
      "common.range_90": "90 hari",
      "common.amount": "Jumlah",
      "common.status": "Status",
      "common.date": "Tanggal",
      "common.type": "Tipe",
      "common.description": "Deskripsi",
      "common.cancel": "Batal",
      "common.save": "Simpan",
      "common.copy": "Salin",
      "common.copied": "Tersalin",
      "qris.title": "Buat QRIS",
      "qris.amount_label": "Jumlah (IDR)",
      "qris.create": "Buat QRIS",
      "qris.expires": "Kedaluwarsa dalam",
      "qris.fee_note": "Biaya flat 0,7% dipotong saat pembayaran.",
      "wd.title": "Penarikan",
      "wd.method": "Metode",
      "wd.bank": "Transfer Bank",
      "wd.ewallet": "E-Wallet",
      "wd.dest": "Nomor rekening / HP",
      "wd.amount": "Jumlah (IDR)",
      "wd.submit": "Ajukan penarikan",
      "wd.fee_note_bank": "Biaya transfer bank: IDR 6.500",
      "wd.fee_note_ewallet": "Biaya e-wallet: IDR 2.500",
      "wd.min_note": "Penarikan minimum: IDR 50.000",
      "tx.title": "Transaksi",
      "profile.title": "Profil",
      "profile.update": "Perbarui profil",
      "profile.change_password": "Ubah kata sandi",
      "profile.current_password": "Kata sandi saat ini",
      "profile.new_password": "Kata sandi baru",
      "admin.title": "CMS Admin",
      "admin.qris_provider": "API Provider QRIS",
      "admin.fees": "Biaya",
      "admin.branding": "Branding",
      "admin.users": "Pengguna",
      "admin.withdrawals": "Antrian penarikan"
    }
  };

  const STORAGE_KEY = "esaku_lang";

  function getLang() {
    return localStorage.getItem(STORAGE_KEY) || "en";
  }

  function setLang(lang) {
    localStorage.setItem(STORAGE_KEY, lang);
    apply();
  }

  function t(key) {
    const lang = getLang();
    return (DICT[lang] && DICT[lang][key]) || (DICT.en[key] ?? key);
  }

  function apply() {
    document.documentElement.lang = getLang();
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      el.textContent = t(key);
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const key = el.getAttribute("data-i18n-placeholder");
      el.setAttribute("placeholder", t(key));
    });
    const btn = document.getElementById("lang-label");
    if (btn) btn.textContent = getLang() === "id" ? "ID" : "EN";
  }

  window.i18n = { t, getLang, setLang, apply };

  document.addEventListener("DOMContentLoaded", () => {
    apply();
    const toggle = document.getElementById("lang-toggle");
    if (toggle) {
      toggle.addEventListener("click", () => {
        setLang(getLang() === "en" ? "id" : "en");
      });
    }
  });
})();
