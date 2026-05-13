import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useToast } from '@/context/ToastContext';
import { api, formatIDR, formatDate, unFmt } from '@/lib/utils';
import { Wallet, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const fade = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } };

const DESTS = {
  ewallet: { items: ['GoPay', 'OVO', 'DANA', 'ShopeePay', 'LinkAja'], placeholder: '08xx-xxxx-xxxx', numLabel: 'Nomor HP Terdaftar', fee: 2500 },
  bank: { items: ['BCA', 'Mandiri', 'BNI', 'BRI', 'BSI', 'CIMB'], placeholder: 'Masukkan nomor rekening', numLabel: 'Nomor Rekening', fee: 6500 },
};

const STATUS_STYLE = {
  completed: 'bg-green-100 text-green-700',
  pending: 'bg-amber-100 text-amber-700',
  processing: 'bg-amber-100 text-amber-700',
  failed: 'bg-red-100 text-red-700',
};

export default function WithdrawalPage() {
  const { showToast } = useToast();
  const [balance, setBalance] = useState(0);
  const [fees, setFees] = useState({ bank: 6500, ewallet: 2500, min: 50000 });
  const [method, setMethod] = useState('ewallet');
  const [dest, setDest] = useState('GoPay');
  const [destNum, setDestNum] = useState('');
  const [rawAmt, setRawAmt] = useState('');
  const [amt, setAmt] = useState(0);
  const [history, setHistory] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const weeklyMax = 5000000;

  async function loadHistory() {
    try {
      const data = await api('/api/withdrawal');
      setHistory(data.withdrawals || []);
    } catch (_e) {}
  }

  useEffect(() => {
    api('/api/profile').then((me) => setBalance(Number(me.profile?.balance || 0))).catch(() => {});
    api('/api/withdrawal/quote').then((q) => setFees(q.fees)).catch(() => {});
    loadHistory();
  }, []);

  const fee = method === 'ewallet' ? fees.ewallet : fees.bank;
  const net = Math.max(0, amt - fee);
  const valid = amt >= fees.min && amt <= weeklyMax && amt <= balance;
  const cfg = DESTS[method];

  function onAmtInput(e) {
    const n = unFmt(e.target.value);
    setAmt(n);
    setRawAmt(n ? n.toLocaleString('id-ID') : '');
  }

  function setQuick(n) { setAmt(n); setRawAmt(n.toLocaleString('id-ID')); }
  function setMax() { const cap = Math.min(weeklyMax, balance); setAmt(cap); setRawAmt(cap ? cap.toLocaleString('id-ID') : ''); }

  function hintText() {
    if (amt === 0) return `Min. ${formatIDR(fees.min)}`;
    if (amt < fees.min) return `Min. ${formatIDR(fees.min)}`;
    if (amt > weeklyMax) return `Maks. ${formatIDR(weeklyMax)}/minggu`;
    if (amt > balance) return 'Saldo tidak cukup';
    return 'Nominal valid';
  }

  async function handleSubmit() {
    if (!destNum.trim()) { showToast('Isi nomor tujuan', 'error'); return; }
    if (!valid) return;
    setSubmitting(true);
    try {
      const res = await api('/api/withdrawal', {
        method: 'POST',
        body: { method, destination: `${dest} ${destNum.trim()}`, amount: amt },
      });
      setBalance(Number(res.balance));
      setRawAmt(''); setAmt(0);
      showToast('Pencairan diajukan', 'success');
      loadHistory();
    } catch (err) { showToast(err.message, 'error'); }
    finally { setSubmitting(false); }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <motion.div {...fade} transition={{ duration: 0.4 }}>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Cairkan</p>
        <h1 className="text-3xl font-bold mt-1">Cairkan Dana</h1>
        <p className="text-muted-foreground mt-1 text-sm">Transfer ke e-wallet (Rp 2.500) atau bank (Rp 6.500). Min. Rp 50.000 · Maks. Rp 5 juta/minggu.</p>
      </motion.div>

      {/* Balance banner */}
      <motion.div {...fade} transition={{ duration: 0.4, delay: 0.05 }}
        className="rounded-2xl bg-primary text-primary-foreground p-6 flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold opacity-70 uppercase tracking-widest">Saldo Tersedia</p>
          <p className="text-3xl font-bold mt-1 tracking-tight">{formatIDR(balance)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs opacity-70 uppercase tracking-widest">Limit / Minggu</p>
          <p className="text-xl font-bold mt-1 opacity-80">{formatIDR(weeklyMax)}</p>
          <p className="text-xs opacity-50 mt-0.5">Min. Rp 50.000</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Method + Destination */}
        <motion.div {...fade} transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-card border border-border rounded-2xl p-6 space-y-5">
          <div>
            <p className="text-sm font-medium mb-3">Metode Pencairan</p>
            <div className="grid grid-cols-2 gap-2">
              {[{ key: 'ewallet', label: 'E-Wallet', sub: 'Rp 2.500', Icon: Wallet }, { key: 'bank', label: 'Transfer Bank', sub: 'Rp 6.500', Icon: Building2 }].map(({ key, label, sub, Icon }) => (
                <button key={key} onClick={() => { setMethod(key); setDest(DESTS[key].items[0]); }}
                  className={cn('flex flex-col gap-1 p-4 rounded-xl border-2 text-left transition-all duration-200',
                    method === key ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/50')}>
                  <Icon className="w-5 h-5 mb-1" />
                  <p className="text-sm font-semibold">{label}</p>
                  <p className="text-xs text-muted-foreground">Biaya {sub}</p>
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium mb-2">{method === 'ewallet' ? 'Pilih E-Wallet' : 'Pilih Bank'}</p>
            <div className="flex flex-wrap gap-2">
              {cfg.items.map((d) => (
                <button key={d} onClick={() => setDest(d)}
                  className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all',
                    dest === d ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted border-transparent hover:border-border')}>
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">{cfg.numLabel}</label>
            <input type="text" placeholder={cfg.placeholder} value={destNum}
              onChange={(e) => setDestNum(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow" />
          </div>
        </motion.div>

        {/* Amount + Submit */}
        <motion.div {...fade} transition={{ duration: 0.4, delay: 0.15 }}
          className="bg-card border border-border rounded-2xl p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2">Nominal Pencairan</label>
            <div className="flex items-center border border-input rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-ring transition-shadow">
              <span className="px-3.5 py-3 text-sm font-medium text-muted-foreground bg-muted border-r border-input">Rp</span>
              <input type="text" inputMode="numeric" placeholder="0" value={rawAmt} onChange={onAmtInput}
                className="flex-1 px-3.5 py-3 text-lg font-semibold bg-background focus:outline-none" />
            </div>
            <p className={cn('text-xs mt-1.5', amt > 0 && !valid ? 'text-destructive' : 'text-muted-foreground')}>
              {hintText()}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {[100000, 250000, 500000, 1000000].map((q) => (
              <button key={q} onClick={() => setQuick(q)}
                className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all',
                  amt === q ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted border-transparent hover:border-border')}>
                {q >= 1000000 ? `${q / 1000000} Jt` : `${q / 1000}K`}
              </button>
            ))}
            <button onClick={setMax} className="px-3 py-1.5 rounded-lg text-xs font-semibold border bg-muted border-transparent hover:border-border">Maks.</button>
          </div>
          <div className="bg-muted/60 rounded-xl p-4 space-y-2 text-sm">
            {[['Nominal Penarikan', formatIDR(amt)], ['Biaya Transfer', formatIDR(fee)], ['Total Diterima', formatIDR(net)], ['Estimasi Proses', '1×24 jam kerja']].map(([l, v], i) => (
              <div key={i} className={cn('flex justify-between', i === 2 && 'font-semibold border-t border-border pt-2')}>
                <span className="text-muted-foreground">{l}</span><span>{v}</span>
              </div>
            ))}
          </div>
          <button onClick={handleSubmit} disabled={!valid || submitting}
            className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
            {submitting ? 'Memproses...' : 'Proses Pencairan'}
          </button>
        </motion.div>
      </div>

      {/* History */}
      <motion.div {...fade} transition={{ duration: 0.4, delay: 0.2 }}
        className="bg-card border border-border rounded-2xl p-6 overflow-x-auto pb-6">
        <p className="text-sm font-semibold mb-4">Riwayat Pencairan</p>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Belum ada pencairan.</p>
        ) : (
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground uppercase tracking-wider">
                {['Tanggal', 'Metode', 'Tujuan', 'Nominal', 'Biaya', 'Status'].map((h, i) => (
                  <th key={i} className={cn('pb-2 font-semibold', i >= 3 && i <= 4 ? 'text-right' : '')}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {history.map((w, i) => (
                <tr key={i} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3 text-xs">{formatDate(w.created_at)}</td>
                  <td className="py-3">{w.method === 'bank' ? 'Bank' : 'E-Wallet'}</td>
                  <td className="py-3 font-mono text-xs max-w-[140px] truncate">{w.destination}</td>
                  <td className="py-3 text-right font-semibold">{formatIDR(w.amount)}</td>
                  <td className="py-3 text-right text-muted-foreground">{formatIDR(w.fee)}</td>
                  <td className="py-3">
                    <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold capitalize', STATUS_STYLE[w.status] || 'bg-muted text-muted-foreground')}>
                      {w.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </motion.div>
    </div>
  );
}
