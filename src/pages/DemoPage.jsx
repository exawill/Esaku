import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, QrCode, History, ArrowDownToLine, ArrowRight } from 'lucide-react';
import { cn, formatIDR, unFmt } from '@/lib/utils';

const EsakuLogo = () => (
  <svg width="26" height="26" viewBox="0 0 80 80" fill="none">
    <rect x="8" y="8" width="56" height="56" rx="10" transform="rotate(8 40 40)" fill="#141210" />
    <text x="14" y="58" fontFamily="Georgia,serif" fontSize="52" fontWeight="bold" fill="white" fontStyle="italic">e</text>
    <path d="M26 62 Q38 74 54 66 Q64 60 58 50" stroke="#4f46e5" strokeWidth="5" fill="none" strokeLinecap="round" />
    <path d="M33 68 Q44 78 58 70" stroke="#4f46e5" strokeWidth="3.5" fill="none" strokeLinecap="round" opacity="0.55" />
  </svg>
);

const fade = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } };

function BarChartDemo({ range }) {
  const CHART = {
    7: { data: [1.85, 2.30, 1.70, 3.10, 2.80, 3.90, 2.10], peak: 5, labels: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'], total: 17750000, count: 143, mdr: 124250 },
    30: { data: [8.5, 11.2, 9.8, 14.3, 10.1, 12.6, 8.9, 15.2, 13.4, 11.8, 16.5, 14.2, 12.1, 17.8, 9.6], peak: 13, labels: ['M1', 'M5', 'M10', 'M15'], total: 74300000, count: 612, mdr: 520100 },
    90: { data: [28, 32, 25, 38, 35, 41, 30, 44, 39, 52, 46, 58], peak: 11, labels: ['Jan', 'Feb', 'Mar', 'Apr'], total: 228000000, count: 1840, mdr: 1596000 },
  };
  const cfg = CHART[range];
  const max = Math.max(...cfg.data);

  return (
    <div>
      <div className="flex items-end gap-1 h-28 w-full mt-4">
        {cfg.data.map((v, i) => (
          <div
            key={i}
            className={`flex-1 rounded-t-sm transition-all duration-300 ${i === cfg.peak ? 'bg-indigo-500' : 'bg-muted-foreground/20 hover:opacity-80'}`}
            style={{ height: `${Math.max(6, (v / max) * 112)}px` }}
          />
        ))}
      </div>
      <div className="flex justify-between mt-2 text-xs text-muted-foreground font-semibold">
        <span>{cfg.labels[0]}</span>
        <span>{cfg.labels[cfg.labels.length - 1]}</span>
      </div>
      
      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground font-medium">Omset</p>
          <p className="text-lg font-bold mt-0.5">{formatIDR(cfg.total)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground font-medium">Transaksi</p>
          <p className="text-lg font-bold mt-0.5">{cfg.count.toLocaleString('id-ID')}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground font-medium">MDR Pembeli</p>
          <p className="text-lg font-bold mt-0.5">{formatIDR(cfg.mdr)}</p>
        </div>
      </div>
    </div>
  );
}

export default function DemoPage() {
  const [tab, setTab] = useState('dash');
  
  // Dashboard state
  const [range, setRange] = useState(7);
  
  // QRIS state
  const [qAmt, setQAmt] = useState(50000);
  const [qRaw, setQRaw] = useState('50.000');
  const [timer, setTimer] = useState(14 * 60 + 32);
  
  // History state
  const [histFilter, setHistFilter] = useState('all');
  const [search, setSearch] = useState('');
  
  // Withdrawal state
  const [wdMethod, setWdMethod] = useState('ewallet');
  const [wdDest, setWdDest] = useState('GoPay');
  const [wdAmt, setWdAmt] = useState(500000);
  const [wdRaw, setWdRaw] = useState('500.000');

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  function handleQInput(e) {
    const n = unFmt(e.target.value);
    setQAmt(n);
    setQRaw(n ? n.toLocaleString('id-ID') : '');
  }
  
  function handleWdInput(e) {
    const n = unFmt(e.target.value);
    setWdAmt(n);
    setWdRaw(n ? n.toLocaleString('id-ID') : '');
  }

  const TABS = [
    { id: 'dash', label: 'Dasbor', icon: LayoutDashboard },
    { id: 'qris', label: 'Buat QRIS', icon: QrCode },
    { id: 'hist', label: 'Riwayat', icon: History },
    { id: 'wd', label: 'Cairkan Dana', icon: ArrowDownToLine },
  ];

  const TX_DATA = [
    { date: '10/05/2026 09:14 AM', name: 'Warung Makan Sari', method: 'GoPay', amount: 45000, status: 'success' },
    { date: '10/05/2026 08:52 AM', name: 'Toko Baju Murah', method: 'OVO', amount: 215000, status: 'success' },
    { date: '10/05/2026 08:30 AM', name: 'Bakso Pak Joko', method: 'DANA', amount: 32000, status: 'success' },
    { date: '10/05/2026 07:11 AM', name: 'Apotek Sehat', method: 'BCA', amount: 125000, status: 'pending' },
    { date: '09/05/2026 04:44 PM', name: 'Kopi Kenangan', method: 'ShopeePay', amount: 78000, status: 'success' },
  ];

  const histFiltered = TX_DATA.filter((tx) => {
    if (histFilter !== 'all' && tx.status !== histFilter) return false;
    if (search && !tx.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const WD_DESTS = {
    ewallet: { label: 'Pilih E-Wallet', items: ['GoPay', 'OVO', 'DANA', 'ShopeePay', 'LinkAja'], fee: 2500 },
    bank: { label: 'Pilih Bank', items: ['BCA', 'Mandiri', 'BNI', 'BRI', 'BSI', 'CIMB'], fee: 6500 },
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-lg">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <EsakuLogo />
            <span className="font-bold text-xl">Esaku</span>
          </Link>
          <div className="flex gap-2">
            <Link to="/sign-in" className="px-4 py-2 rounded-xl text-sm font-medium hover:bg-muted">Masuk</Link>
            <Link to="/sign-up" className="px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90">Daftar Gratis</Link>
          </div>
        </div>
      </header>

      {/* Banner */}
      <div className="bg-indigo-50 border-b border-indigo-100 text-indigo-900 text-sm py-2 px-4 text-center">
        <strong>Demo Mode</strong> · Anda sedang melihat data contoh. <Link to="/sign-up" className="underline font-semibold">Daftar gratis</Link> untuk akun sebenarnya.
      </div>

      <main className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Demo Aplikasi</p>
          <h1 className="text-3xl font-bold mb-3">Coba dasbor Esaku, langsung dari sini.</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm">Empat layar utama yang akan Anda gunakan sehari-hari — Dasbor, Buat QRIS, Riwayat, dan Pencairan. Semua data di sini adalah contoh.</p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={cn('flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all',
                  tab === t.id ? 'bg-primary text-primary-foreground shadow-md' : 'bg-card border border-border hover:bg-muted')}>
                <Icon className="w-4 h-4" /> {t.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="bg-card border border-border rounded-2xl p-6 md:p-8 min-h-[500px]">
          {tab === 'dash' && (
            <motion.div {...fade} className="space-y-6">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-primary text-primary-foreground rounded-2xl p-6 flex flex-col justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-widest opacity-70">Saldo Tersedia</p>
                    <p className="text-3xl font-bold mt-2">Rp 4.287.500</p>
                    <p className="text-xs opacity-60 mt-1">Toko Budi Jaya</p>
                  </div>
                  <button onClick={() => setTab('wd')} className="mt-6 w-full py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-semibold transition">
                    Cairkan Dana
                  </button>
                </div>
                <div className="md:col-span-2 border border-border rounded-2xl p-6">
                  <div className="flex justify-between items-center">
                    <p className="font-semibold">Pendapatan</p>
                    <div className="flex gap-1 bg-muted rounded-lg p-1">
                      {[7, 30, 90].map((r) => (
                        <button key={r} onClick={() => setRange(r)}
                          className={cn('px-3 py-1 rounded-md text-xs font-semibold', range === r ? 'bg-card shadow-sm' : 'hover:bg-card/50')}>
                          {r} Hari
                        </button>
                      ))}
                    </div>
                  </div>
                  <BarChartDemo range={range} />
                </div>
              </div>
            </motion.div>
          )}

          {tab === 'qris' && (
            <motion.div {...fade} className="grid md:grid-cols-2 gap-8">
              <div className="space-y-5">
                <p className="font-semibold text-lg">Buat QRIS Pembayaran</p>
                <div>
                  <label className="block text-sm font-medium mb-2">Nominal</label>
                  <div className="flex border border-input rounded-xl focus-within:ring-2 focus-within:ring-ring">
                    <span className="px-4 py-3 bg-muted border-r text-sm font-medium">Rp</span>
                    <input className="flex-1 px-4 py-3 bg-transparent outline-none font-semibold text-lg" value={qRaw} onChange={handleQInput} />
                  </div>
                </div>
                <div>
                  <div className="flex flex-wrap gap-2">
                    {[10000, 25000, 50000, 75000, 100000, 250000].map(v => (
                      <button key={v} onClick={() => { setQAmt(v); setQRaw(v.toLocaleString('id-ID')) }}
                        className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold border', qAmt === v ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted border-transparent')}>
                        {v >= 1000 ? v/1000 + 'K' : v}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="bg-muted/50 rounded-xl p-4 text-sm space-y-2">
                  <div className="flex justify-between"><span className="text-muted-foreground">Pembeli Bayar</span><span className="font-medium">{formatIDR(qAmt + Math.round(qAmt * 0.007))}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">MDR 0,7%</span><span className="font-medium">{formatIDR(Math.round(qAmt * 0.007))}</span></div>
                  <div className="flex justify-between border-t border-border pt-2 font-bold"><span className="text-muted-foreground">Anda Terima</span><span>{formatIDR(qAmt)}</span></div>
                </div>
                <button className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90">Buat QRIS Pembayaran</button>
              </div>
              <div className="border border-border rounded-2xl p-6 flex flex-col items-center">
                <div className="w-full flex justify-between mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Merchant</p>
                    <p className="font-semibold">Toko Budi Jaya</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold text-green-600">{Math.floor(timer/60)}:{(timer%60).toString().padStart(2,'0')}</p>
                    <p className="text-[10px] tracking-widest text-muted-foreground uppercase">Tersisa</p>
                  </div>
                </div>
                <div className="text-center mb-6">
                  <p className="text-xs text-muted-foreground mb-1">Nominal Pembayaran</p>
                  <p className="text-3xl font-bold tracking-tight">{formatIDR(qAmt + Math.round(qAmt * 0.007))}</p>
                  <p className="text-xs text-green-600 font-semibold mt-1">(termasuk MDR {formatIDR(Math.round(qAmt * 0.007))})</p>
                </div>
                <div className="w-48 h-48 bg-muted rounded-xl border border-border flex items-center justify-center p-4">
                  <QrCode className="w-full h-full text-primary" />
                </div>
                <p className="text-xs font-bold tracking-widest text-primary/80 uppercase mt-8 bg-primary/5 px-4 py-2 rounded-lg">QRIS · MDR 0,7% DITANGGUNG PEMBELI</p>
              </div>
            </motion.div>
          )}

          {tab === 'hist' && (
            <motion.div {...fade} className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="flex gap-2">
                  {['all', 'success', 'pending', 'failed'].map((f) => (
                    <button key={f} onClick={() => setHistFilter(f)}
                      className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold border capitalize', histFilter === f ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted border-transparent')}>
                      {f === 'all' ? 'Semua' : f === 'success' ? 'Berhasil' : f}
                    </button>
                  ))}
                </div>
                <input placeholder="Cari nama pelanggan..." className="px-4 py-2 border border-input rounded-xl text-sm" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border text-left text-xs text-muted-foreground uppercase">
                    <tr><th className="py-3">Tanggal</th><th>Pelanggan</th><th>Metode</th><th>Status</th><th className="text-right">Nominal</th></tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {histFiltered.map((tx, i) => (
                      <tr key={i}>
                        <td className="py-3 text-xs">{tx.date}</td>
                        <td className="font-semibold">{tx.name}</td>
                        <td>QRIS · {tx.method}</td>
                        <td><span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold', tx.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700')}>{tx.status}</span></td>
                        <td className="text-right font-bold text-green-600">+{formatIDR(tx.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {tab === 'wd' && (
            <motion.div {...fade} className="space-y-6">
              <div className="bg-primary text-primary-foreground rounded-2xl p-6 flex justify-between">
                <div><p className="text-xs uppercase tracking-widest opacity-70">Saldo Tersedia</p><p className="text-3xl font-bold mt-1">Rp 4.287.500</p></div>
                <div className="text-right"><p className="text-xs uppercase tracking-widest opacity-70">Limit Mingguan</p><p className="text-xl font-bold mt-1">Rp 5.000.000</p></div>
              </div>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-5">
                  <p className="font-semibold">Metode Pencairan</p>
                  <div className="grid grid-cols-2 gap-3">
                    {['ewallet', 'bank'].map((m) => (
                      <button key={m} onClick={() => setWdMethod(m)}
                        className={cn('p-4 rounded-xl border text-left', wdMethod === m ? 'border-primary bg-primary/5' : 'border-border')}>
                        <p className="font-semibold text-sm">{m === 'ewallet' ? 'E-Wallet' : 'Transfer Bank'}</p>
                        <p className="text-xs text-muted-foreground mt-1">Biaya {formatIDR(WD_DESTS[m].fee)}</p>
                      </button>
                    ))}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">{WD_DESTS[wdMethod].label}</label>
                    <div className="flex flex-wrap gap-2">
                      {WD_DESTS[wdMethod].items.map(i => (
                        <button key={i} onClick={() => setWdDest(i)}
                          className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold border', wdDest === i ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted border-transparent')}>
                          {i}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Nomor Tujuan</label>
                    <input className="w-full px-4 py-2 border border-input rounded-xl text-sm" placeholder="08xx-xxxx-xxxx" />
                  </div>
                </div>
                <div className="space-y-5">
                  <p className="font-semibold">Nominal & Konfirmasi</p>
                  <div className="flex border border-input rounded-xl focus-within:ring-2 focus-within:ring-ring">
                    <span className="px-4 py-3 bg-muted border-r text-sm font-medium">Rp</span>
                    <input className="flex-1 px-4 py-3 bg-transparent outline-none font-semibold text-lg" value={wdRaw} onChange={handleWdInput} />
                  </div>
                  <div className="flex gap-2">
                    {[100000, 250000, 500000, 1000000].map(v => (
                      <button key={v} onClick={() => { setWdAmt(v); setWdRaw(v.toLocaleString('id-ID')) }}
                        className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold border', wdAmt === v ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted border-transparent')}>
                        {v >= 1000000 ? v/1000000 + 'Jt' : v/1000 + 'K'}
                      </button>
                    ))}
                  </div>
                  <div className="bg-muted/50 rounded-xl p-4 text-sm space-y-2">
                    <div className="flex justify-between"><span className="text-muted-foreground">Nominal Penarikan</span><span className="font-medium">{formatIDR(wdAmt)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Biaya Transfer</span><span className="font-medium">{formatIDR(WD_DESTS[wdMethod].fee)}</span></div>
                    <div className="flex justify-between border-t border-border pt-2 font-bold"><span className="text-muted-foreground">Total Diterima</span><span>{formatIDR(Math.max(0, wdAmt - WD_DESTS[wdMethod].fee))}</span></div>
                  </div>
                  <button className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90">Proses Pencairan</button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
        
        <div className="mt-12 text-center bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-8 border border-indigo-100">
          <h2 className="text-2xl font-bold mb-3">Suka demonya? Aktifkan akun nyata.</h2>
          <p className="text-muted-foreground mb-6">Tanpa KYC. Tanpa biaya bulanan. MDR 0,7% ditanggung pembeli.</p>
          <div className="flex justify-center gap-4">
            <Link to="/sign-up" className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center gap-2 hover:bg-primary/90">
              Daftar Gratis <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
