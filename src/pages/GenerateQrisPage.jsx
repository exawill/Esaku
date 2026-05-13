import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { api, formatIDR, unFmt } from '@/lib/utils';
import { RotateCcw, Copy, FlaskConical, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const fade = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } };
const QUICK = [10000, 25000, 50000, 100000, 250000];
const QUICK_LABELS = ['10K', '25K', '50K', '100K', '250K'];

function useTimer(expiresAt, onExpire) {
  const [remain, setRemain] = useState(null);
  const handle = useRef(null);
  useEffect(() => {
    if (!expiresAt) { setRemain(null); return; }
    function tick() {
      const r = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
      setRemain(r);
      if (r <= 0) { clearInterval(handle.current); onExpire?.(); }
    }
    tick();
    handle.current = setInterval(tick, 1000);
    return () => clearInterval(handle.current);
  }, [expiresAt]);
  if (remain === null) return '--:--';
  return `${String(Math.floor(remain / 60)).padStart(2, '0')}:${String(remain % 60).padStart(2, '0')}`;
}

export default function GenerateQrisPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [rawAmt, setRawAmt] = useState('');
  const [amt, setAmt] = useState(0);
  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState('idle');
  const [generating, setGenerating] = useState(false);
  const pollRef = useRef(null);

  function stopPoll() { if (pollRef.current) { clearTimeout(pollRef.current); pollRef.current = null; } }

  async function pollStatus(currentOrder) {
    if (!currentOrder) return;
    try {
      const res = await api(`/api/qris/${currentOrder.id}/status`);
      if (res.status === 'paid') { setStatus('paid'); stopPoll(); return; }
      if (res.status === 'expired') { setStatus('expired'); stopPoll(); return; }
      pollRef.current = setTimeout(() => pollStatus(currentOrder), 3000);
    } catch (_e) { pollRef.current = setTimeout(() => pollStatus(currentOrder), 5000); }
  }

  useEffect(() => () => stopPoll(), []);

  function handleExpire() { setStatus('expired'); stopPoll(); }
  const timer = useTimer(order?.expires_at && status === 'active' ? order.expires_at : null, handleExpire);

  function onAmtInput(e) {
    const n = unFmt(e.target.value);
    setAmt(n);
    setRawAmt(n ? n.toLocaleString('id-ID') : '');
  }

  async function handleGenerate() {
    if (amt < 1000) return;
    setGenerating(true);
    try {
      const res = await api('/api/qris', { method: 'POST', body: { amount: amt } });
      setOrder(res.order);
      setStatus('active');
      stopPoll();
      pollRef.current = setTimeout(() => pollStatus(res.order), 3000);
      showToast('QRIS dibuat', 'success');
    } catch (err) { showToast(err.message, 'error'); }
    finally { setGenerating(false); }
  }

  function handleReset() {
    stopPoll(); setOrder(null); setStatus('idle'); setAmt(0); setRawAmt('');
  }

  async function handleCopy() {
    if (!order) return;
    try { await navigator.clipboard.writeText(order.qr_payload); showToast('Payload disalin', 'success'); }
    catch (_e) { showToast('Gagal menyalin', 'error'); }
  }

  async function handleMockPay() {
    if (!order) return;
    try { await api(`/api/qris/${order.id}/mock-pay`, { method: 'POST' }); setStatus('paid'); stopPoll(); }
    catch (err) { showToast(err.message, 'error'); }
  }

  const fee = Math.round(amt * 0.007);
  const buyerPays = amt + fee;
  const valid = amt >= 1000;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <motion.div {...fade} transition={{ duration: 0.4 }}>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Buat QRIS</p>
        <h1 className="text-3xl font-bold mt-1">Generate QRIS Pembayaran</h1>
        <p className="text-muted-foreground mt-1 text-sm">Masukkan nominal, klik buat, lalu tampilkan QR ke pelanggan. Berlaku 15 menit.</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <motion.div {...fade} transition={{ duration: 0.4, delay: 0.05 }}
          className="bg-card border border-border rounded-2xl p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2">Nominal Pembayaran</label>
            <div className="flex items-center border border-input rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-ring transition-shadow">
              <span className="px-3.5 py-3 text-sm font-medium text-muted-foreground bg-muted border-r border-input">Rp</span>
              <input type="text" inputMode="numeric" placeholder="0"
                value={rawAmt} onChange={onAmtInput}
                className="flex-1 px-3.5 py-3 text-lg font-semibold bg-background focus:outline-none" />
            </div>
            <p className={cn('text-xs mt-1.5', amt > 0 && amt < 1000 ? 'text-destructive' : 'text-muted-foreground')}>
              {amt === 0 ? 'Min. Rp 1.000' : amt < 1000 ? 'Min. Rp 1.000' : 'Siap dibuat'}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-2">Nominal Cepat</p>
            <div className="flex flex-wrap gap-2">
              {QUICK.map((q, i) => (
                <button key={q} onClick={() => { setAmt(q); setRawAmt(q.toLocaleString('id-ID')); }}
                  className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all',
                    amt === q ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted border-transparent hover:border-border')}>
                  {QUICK_LABELS[i]}
                </button>
              ))}
            </div>
          </div>
          {valid && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="bg-muted/60 rounded-xl p-4 space-y-2 text-sm">
              {[['Pembeli Bayar', formatIDR(buyerPays)], ['MDR 0,7%', formatIDR(fee)], ['Anda Terima', formatIDR(amt)]].map(([l, v], i) => (
                <div key={i} className={cn('flex justify-between', i === 2 && 'font-semibold border-t border-border pt-2')}>
                  <span className="text-muted-foreground">{l}</span><span>{v}</span>
                </div>
              ))}
            </motion.div>
          )}
          <div className="flex gap-2">
            <button onClick={handleGenerate} disabled={!valid || generating}
              className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50">
              {generating ? 'Memproses...' : 'Buat QRIS Pembayaran →'}
            </button>
            <button onClick={handleReset} className="px-4 py-2.5 rounded-xl border border-border hover:bg-muted transition-colors">
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </motion.div>

        {/* QRIS Display */}
        <motion.div {...fade} transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-card border border-border rounded-2xl p-6 flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Merchant</p>
              <p className="font-semibold">{user?.name || user?.email}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
            {status === 'active' && (
              <div className="text-right">
                <p className={cn('text-lg font-mono font-bold', parseInt(timer) < 5 ? 'text-destructive' : 'text-green-500')}>{timer}</p>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Tersisa</p>
              </div>
            )}
          </div>
          {order && status !== 'idle' && (
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Nominal</p>
              <p className="text-2xl font-bold tracking-tight">{formatIDR(order.amount)}</p>
              {order.fee && <p className="text-xs text-green-600 mt-0.5">(termasuk MDR {formatIDR(order.fee)})</p>}
            </div>
          )}
          <div className="relative flex-1 min-h-[200px] flex items-center justify-center bg-muted/40 rounded-xl overflow-hidden">
            {!order && <p className="text-sm text-muted-foreground">Belum ada QRIS aktif.</p>}
            {order && status === 'active' && (
              <img src={order.qr_image} alt="QRIS" className="w-full max-w-[220px] aspect-square rounded-lg" />
            )}
            {status === 'expired' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
                <AlertCircle className="w-10 h-10 text-destructive mb-2" />
                <p className="font-bold text-destructive">QRIS Kedaluwarsa</p>
              </div>
            )}
            {status === 'paid' && (
              <div className="flex flex-col items-center gap-3 py-8">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="w-9 h-9 text-green-600" />
                </div>
                <p className="font-bold text-green-600 text-lg">Pembayaran Berhasil!</p>
                <p className="text-xs text-muted-foreground">Saldo telah ditambahkan ke akun Anda.</p>
                <button onClick={handleReset}
                  className="mt-2 text-xs font-semibold px-4 py-2 rounded-xl border border-border hover:bg-muted transition-colors">
                  Buat QRIS Baru
                </button>
              </div>
            )}
          </div>
          {order && <p className="text-center text-[11px] text-muted-foreground">{order.reference}</p>}
          <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-xl px-4 py-2.5">
            <span className="text-xs font-bold tracking-widest text-primary/80 uppercase">
              {status === 'paid' ? 'PEMBAYARAN DITERIMA' : status === 'expired' ? 'QRIS KEDALUWARSA' : 'QRIS · MDR 0,7% DITANGGUNG PEMBELI'}
            </span>
            <span className="text-xs font-bold text-primary/60">Esaku</span>
          </div>
        </motion.div>
      </div>

      {order && status === 'active' && (user?.role === 'admin' || user?.role === 'test') && (
        <motion.div {...fade} transition={{ duration: 0.4 }}
          className="bg-card border border-border rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-sm">Aksi (Dev)</p>
            <p className="text-xs text-muted-foreground">Tandai QRIS sebagai dibayar untuk menambah saldo dummy.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border hover:bg-muted text-xs font-medium transition-colors">
              <Copy className="w-3.5 h-3.5" /> Salin Payload
            </button>
            <button onClick={handleMockPay}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors">
              <FlaskConical className="w-3.5 h-3.5" /> Tandai Dibayar (dev)
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
