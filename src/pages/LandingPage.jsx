import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { QrCode, ArrowDownToLine, ShieldCheck, ArrowRight, Zap, Lock, Percent } from 'lucide-react';

const EsakuLogo = () => (
  <svg width="32" height="32" viewBox="0 0 80 80" fill="none">
    <rect x="8" y="8" width="56" height="56" rx="10" transform="rotate(8 40 40)" fill="#141210" />
    <text x="14" y="58" fontFamily="Georgia,serif" fontSize="52" fontWeight="bold" fill="white" fontStyle="italic">e</text>
    <path d="M26 62 Q38 74 54 66 Q64 60 58 50" stroke="#4f46e5" strokeWidth="5" fill="none" strokeLinecap="round" />
    <path d="M33 68 Q44 78 58 70" stroke="#4f46e5" strokeWidth="3.5" fill="none" strokeLinecap="round" opacity="0.55" />
  </svg>
);

const features = [
  { icon: Percent, title: 'MDR 0,7% Flat', description: 'Biaya MDR ditanggung pembeli. Anda selalu menerima nominal penuh.' },
  { icon: Lock, title: 'Tanpa KYC', description: 'Daftar dan langsung pakai. Tidak perlu upload dokumen apapun.' },
  { icon: Zap, title: 'Instan & Real-time', description: 'QRIS dibuat dalam hitungan detik. Notifikasi pembayaran langsung masuk.' },
  { icon: ArrowDownToLine, title: 'Cairkan Kapan Saja', description: 'Transfer ke e-wallet atau bank dengan biaya flat rendah. Min. Rp 50.000.' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2.5">
              <EsakuLogo />
              <span className="font-bold text-xl tracking-tight">Esaku</span>
            </Link>
            <div className="flex items-center gap-2">
              <Link to="/sign-in" className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200">
                Masuk
              </Link>
              <Link to="/sign-up" className="px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all duration-200">
                Daftar Gratis
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative min-h-[80dvh] flex items-center justify-center overflow-hidden py-20">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-background to-background z-0" />
          <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />

          <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
              <span className="inline-block text-xs font-bold px-3 py-1.5 rounded-full bg-indigo-100 text-indigo-700 mb-6 tracking-widest uppercase">
                QRIS Merchant Perorangan
              </span>
              <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
                Terima Pembayaran<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">QRIS Instant</span>
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
                Generate QRIS, terima pembayaran, cairkan ke rekening — tanpa KYC, tanpa ribet. MDR 0,7% flat ditanggung pembeli.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/sign-up"
                  className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-primary text-primary-foreground text-lg font-semibold hover:bg-primary/90 active:scale-[0.98] transition-all duration-200 shadow-lg shadow-primary/20">
                  Mulai Sekarang <ArrowRight className="w-5 h-5" />
                </Link>
                <Link to="/demo"
                  className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl border-2 border-border text-lg font-semibold hover:bg-muted transition-all duration-200">
                  Coba Demo
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features */}
        <section className="py-24 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
              className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">Semua yang Anda butuhkan</h2>
              <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                Platform QRIS lengkap untuk merchant perorangan, dengan fitur yang biasanya hanya ada di enterprise.
              </p>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {features.map((f, i) => {
                const Icon = f.icon;
                return (
                  <motion.div key={i}
                    initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }}
                    className="bg-card rounded-2xl p-8 border border-border hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-primary/10 rounded-xl flex-shrink-0">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                        <p className="text-muted-foreground leading-relaxed">{f.description}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-3xl p-12 border border-primary/20">
                <h2 className="text-4xl font-bold mb-4">Siap mulai menerima pembayaran?</h2>
                <p className="text-muted-foreground text-lg mb-8">Daftar gratis dalam 30 detik. Tidak ada biaya setup, tidak ada kontrak.</p>
                <Link to="/sign-up"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-primary text-primary-foreground text-lg font-semibold hover:bg-primary/90 active:scale-[0.98] transition-all duration-200">
                  Buat Akun Gratis <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <EsakuLogo />
              <span className="font-bold text-lg">Esaku</span>
            </div>
            <p className="text-sm text-muted-foreground">© 2026 Esaku · QRIS Merchant Perorangan</p>
            <Link to="/sign-in" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Masuk</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
