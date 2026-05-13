import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useToast } from '@/context/ToastContext';
import { api, formatIDR, formatDate } from '@/lib/utils';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

const fade = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } };

const TYPE_LABEL = { qris_in: 'Pemasukan QRIS', withdrawal_out: 'Pencairan', fee: 'Biaya', adjustment: 'Penyesuaian' };
const TYPE_STYLE = {
  qris_in: 'bg-green-100 text-green-700',
  withdrawal_out: 'bg-red-100 text-red-700',
  fee: 'bg-amber-100 text-amber-700',
  adjustment: 'bg-muted text-muted-foreground',
};
const FILTERS = [
  { key: 'all', label: 'Semua' },
  { key: 'qris_in', label: 'Pemasukan QRIS' },
  { key: 'withdrawal_out', label: 'Pencairan' },
  { key: 'fee', label: 'Biaya' },
];

export default function TransactionsPage() {
  const { showToast } = useToast();
  const [all, setAll] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    api('/api/transactions?limit=200')
      .then((data) => setAll(data.transactions || []))
      .catch((err) => showToast(err.message, 'error'));
  }, []);

  const visible = all.filter((t) => {
    if (filter !== 'all' && t.type !== filter) return false;
    if (search) {
      const blob = `${t.description || ''} ${t.reference || ''}`.toLowerCase();
      if (!blob.includes(search.toLowerCase())) return false;
    }
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <motion.div {...fade} transition={{ duration: 0.4 }}>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Riwayat</p>
        <h1 className="text-3xl font-bold mt-1">Riwayat Transaksi</h1>
        <p className="text-muted-foreground mt-1 text-sm">Semua transaksi tercatat — masuk dari QRIS, biaya MDR, dan pencairan dana.</p>
      </motion.div>

      <motion.div {...fade} transition={{ duration: 0.4, delay: 0.05 }}
        className="bg-card border border-border rounded-2xl p-6 space-y-4 overflow-x-auto">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map(({ key, label }) => (
              <button key={key} onClick={() => setFilter(key)}
                className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all',
                  filter === key ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted border-transparent hover:border-border')}>
                {label}
              </button>
            ))}
          </div>
          <div className="relative min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input placeholder="Cari deskripsi atau referensi..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow" />
          </div>
        </div>

        {visible.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12">Tidak ada transaksi yang cocok.</p>
        ) : (
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground uppercase tracking-wider">
                {['Tanggal', 'Tipe', 'Deskripsi', 'Referensi', 'Nominal', 'Saldo'].map((h, i) => (
                  <th key={i} className={cn('pb-2 font-semibold', i >= 4 ? 'text-right' : '')}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {visible.map((t, i) => {
                const positive = Number(t.amount) >= 0;
                return (
                  <tr key={i} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 text-xs">{formatDate(t.created_at)}</td>
                    <td className="py-3">
                      <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold', TYPE_STYLE[t.type] || TYPE_STYLE.adjustment)}>
                        {TYPE_LABEL[t.type] || t.type}
                      </span>
                    </td>
                    <td className="py-3 max-w-[160px] truncate">{t.description || '—'}</td>
                    <td className="py-3 font-mono text-xs text-muted-foreground max-w-[120px] truncate">{t.reference || '—'}</td>
                    <td className={cn('py-3 text-right font-semibold', positive ? 'text-green-600' : 'text-destructive')}>
                      {positive ? '+' : ''}{formatIDR(t.amount)}
                    </td>
                    <td className="py-3 text-right text-muted-foreground">{formatIDR(t.balance_after)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </motion.div>
    </div>
  );
}
