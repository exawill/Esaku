import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, Globe } from 'lucide-react';

const EsakuLogo = () => (
  <svg width="32" height="32" viewBox="0 0 80 80" fill="none">
    <rect x="8" y="8" width="56" height="56" rx="10" transform="rotate(8 40 40)" fill="#141210" />
    <text x="14" y="58" fontFamily="Georgia,serif" fontSize="52" fontWeight="bold" fill="white" fontStyle="italic">e</text>
    <path d="M26 62 Q38 74 54 66 Q64 60 58 50" stroke="#4f46e5" strokeWidth="5" fill="none" strokeLinecap="round" />
    <path d="M33 68 Q44 78 58 70" stroke="#4f46e5" strokeWidth="3.5" fill="none" strokeLinecap="round" opacity="0.55" />
  </svg>
);

export default function AuthPage({ mode }) {
  const isSignUp = mode === 'sign-up';
  const { showToast } = useToast();
  const { refetch } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', website: '' });

  const from = location.state?.from?.pathname || '/dashboard';

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.website) return; // honeypot
    setLoading(true);
    try {
      const body = { email: form.email, password: form.password, website: '' };
      if (isSignUp) body.name = form.name.trim() || null;
      const res = await api(isSignUp ? '/api/auth/sign-up' : '/api/auth/sign-in', {
        method: 'POST',
        body,
      });
      await refetch();
      navigate(res.user?.role === 'admin' ? '/admin' : from);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  // Surface OAuth error
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('err') === 'device_used') {
      showToast('Akun sudah pernah dibuat dari peramban ini. Silakan masuk.', 'error');
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
        <Link to="/" className="flex items-center gap-2.5 group">
          <EsakuLogo />
          <span className="font-bold text-xl tracking-tight">Esaku</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-muted">
            <ArrowLeft className="w-4 h-4" /> Beranda
          </Link>
          <Link to="/demo" className="text-sm font-medium px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
            Coba Demo
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mode tabs */}
          <div className="flex rounded-xl bg-muted p-1 mb-8">
            <Link
              to="/sign-in"
              className={`flex-1 text-center py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                !isSignUp ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Masuk
            </Link>
            <Link
              to="/sign-up"
              className={`flex-1 text-center py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isSignUp ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Daftar
            </Link>
          </div>

          <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
            <h1 className="text-2xl font-bold mb-1">
              {isSignUp ? 'Buat akun Esaku' : 'Masuk ke akun Anda'}
            </h1>
            <p className="text-sm text-muted-foreground mb-6">
              QRIS Merchant perorangan · MDR 0,7% flat · Tanpa KYC
            </p>

            <form onSubmit={handleSubmit} className="space-y-4" autoComplete="on">
              {/* Honeypot */}
              <div aria-hidden="true" className="absolute -left-[9999px] w-px h-px overflow-hidden">
                <input name="website" value={form.website} onChange={handleChange} tabIndex={-1} autoComplete="off" />
              </div>

              {isSignUp && (
                <div>
                  <label className="block text-sm font-medium mb-1.5" htmlFor="name">Nama Lengkap</label>
                  <input
                    id="name" name="name" type="text" autoComplete="name"
                    value={form.name} onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1.5" htmlFor="email">Email</label>
                <input
                  id="email" name="email" type="email" required autoComplete="email"
                  placeholder="email@bisnisanda.com"
                  value={form.email} onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" htmlFor="password">Kata Sandi</label>
                <input
                  id="password" name="password" type="password" required minLength={8}
                  placeholder="Min. 8 karakter"
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  value={form.password} onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                />
              </div>

              <button
                type="submit" disabled={loading}
                className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? 'Memproses...' : isSignUp ? 'Buat Akun' : 'Masuk'}
              </button>
            </form>

            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">atau</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <a
              href="/api/auth/hostinger"
              className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-xl border border-border hover:bg-muted transition-colors text-sm font-medium"
            >
              <Globe className="w-4 h-4" />
              Lanjutkan dengan Hostinger
            </a>

            <p className="text-center text-xs text-muted-foreground mt-6">
              {isSignUp ? 'Sudah punya akun? ' : 'Belum punya akun? '}
              <Link
                to={isSignUp ? '/sign-in' : '/sign-up'}
                className="font-semibold text-foreground hover:underline"
              >
                {isSignUp ? 'Masuk di sini' : 'Daftar di sini'}
              </Link>
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
