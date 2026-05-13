import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { api, formatIDR, formatDate } from '@/lib/utils';
import { Users, Wallet, QrCode, Clock, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const fade = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } };
const WD_FILTERS = ['all', 'pending', 'completed', 'failed'];
const STATUS_STYLE = {
  completed: 'bg-green-100 text-green-700',
  pending: 'bg-amber-100 text-amber-700',
  processing: 'bg-amber-100 text-amber-700',
  failed: 'bg-red-100 text-red-700',
};

function BarChart({ series }) {
  if (!series?.length) return <p className="text-sm text-muted-foreground text-center py-6">Data belum tersedia.</p>;
  const max = Math.max(1, ...series.map((p) => Math.abs(p.value)));
  return (
    <div className="flex items-end gap-0.5 h-36 w-full">
      {series.map((p, i) => (
        <div key={i} title={`${p.day} — ${formatIDR(p.value)}`}
          className={`flex-1 rounded-t-sm transition-all duration-300 hover:opacity-70 cursor-pointer ${i === series.length - 1 ? 'bg-indigo-500' : 'bg-muted-foreground/20'}`}
          style={{ height: `${Math.max(4, (Math.abs(p.value) / max) * 144)}px` }} />
      ))}
    </div>
  );
}

export default function AdminPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [stats, setStats] = useState(null);
  const [revSeries, setRevSeries] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [wdFilter, setWdFilter] = useState('all');
  const [users, setUsers] = useState([]);
  const [settings, setSettings] = useState({ qris_provider: {}, fees: {}, branding: {} });
  const [provForm, setProvForm] = useState({});
  const [feesForm, setFeesForm] = useState({});
  const [brandForm, setBrandForm] = useState({});

  async function loadAll() {
    try {
      const data = await api('/api/admin/stats?days=30');
      setStats(data.stats);
      setRevSeries(data.revenue_series || []);
    } catch (err) { showToast(err.message, 'error'); }

    try {
      const { settings: s } = await api('/api/admin/settings');
      setProvForm(s.qris_provider || {});
      setFeesForm(s.fees || {});
      setBrandForm(s.branding || {});
    } catch (_e) {}

    try {
      const { users: u } = await api('/api/admin/users');
      setUsers(u || []);
    } catch (_e) {}

    try {
      const { withdrawals: w } = await api('/api/admin/withdrawals');
      setWithdrawals(w || []);
    } catch (_e) {}
  }

  useEffect(() => { loadAll(); }, []);

  async function handleWdAction(id, act) {
    try {
      await api(`/api/admin/withdrawals/${id}/${act}`, { method: 'POST' });
      showToast('Diperbarui', 'success');
      loadAll();
    } catch (err) { showToast(err.message, 'error'); }
  }

  async function handleDeleteUser(u) {
    if (!window.confirm(`Hapus pengguna ${u.email}? Seluruh riwayat transaksi dan saldo akan ikut terhapus.`)) return;
    try {
      await api(`/api/admin/users/${u.id}`, { method: 'DELETE' });
      showToast('Pengguna dihapus', 'success');
      loadAll();
    } catch (err) { showToast(err.message, 'error'); }
  }

  async function saveSetting(key, body) {
    try {
      await api(`/api/admin/settings/${key}`, { method: 'PUT', body });
      showToast('Tersimpan', 'success');
    } catch (err) { showToast(err.message, 'error'); }
  }

  const visibleWd = withdrawals.filter((w) => {
    if (wdFilter === 'all') return true;
    if (wdFilter === 'pending') return w.status === 'pending' || w.status === 'processing';
    return w.status === wdFilter;
  });

  function SettingField({ label, name, type = 'text', value, onChange, step, min, max }) {
    return (
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">{label}</label>
        <input type={type} step={step} min={min} max={max} value={value ?? ''} onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <motion.div {...fade} transition={{ duration: 0.4 }}>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">CMS Admin</p>
        <h1 className="text-3xl font-bold mt-1">Dasbor Admin</h1>
        <p className="text-muted-foreground mt-1 text-sm">Ringkasan platform, antrian pencairan, dan pengaturan operasional Esaku.</p>
      </motion.div>

      {/* Stats */}
      <motion.div {...fade} transition={{ duration: 0.4, delay: 0.05 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Pengguna', value: stats ? stats.total_users.toLocaleString('id-ID') : '—', icon: Users, sub: stats ? `${stats.total_admins} admin` : '—' },
          { label: 'Aggregate Saldo', value: stats ? formatIDR(stats.total_balance) : '—', icon: Wallet, sub: 'Semua pengguna' },
          { label: 'QRIS Berhasil', value: stats ? stats.paid_qris.count.toLocaleString('id-ID') : '—', icon: QrCode, sub: stats ? formatIDR(stats.paid_qris.gross) : '—' },
          { label: 'MDR Terkumpul', value: stats ? formatIDR(stats.paid_qris.fee_collected) : '—', icon: Wallet, sub: '30 hari terakhir' },
        ].map((k, i) => {
          const Icon = k.icon;
          return (
            <div key={i} className="bg-card border border-border rounded-2xl p-5 hover-lift">
              <Icon className="w-4 h-4 text-muted-foreground mb-2" />
              <p className="text-xs text-muted-foreground">{k.label}</p>
              <p className="text-xl font-bold mt-0.5">{k.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{k.sub}</p>
            </div>
          );
        })}
      </motion.div>

      {/* Chart */}
      <motion.div {...fade} transition={{ duration: 0.4, delay: 0.1 }}
        className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold">Statistik Pendapatan Platform (30 Hari)</p>
          <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700">Omset</span>
        </div>
        <BarChart series={revSeries} />
        {revSeries.length > 0 && (
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>{revSeries[0]?.day}</span><span>{revSeries.at(-1)?.day}</span>
          </div>
        )}
      </motion.div>

      {/* Pending withdrawals */}
      <motion.div {...fade} transition={{ duration: 0.4, delay: 0.15 }}
        className="bg-card border border-border rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
          <div>
            <p className="text-sm font-semibold">Permintaan Pencairan</p>
            <p className="text-xs text-muted-foreground mt-0.5">Tandai selesai setelah dana ditransfer, atau gagalkan untuk mengembalikan saldo otomatis.</p>
          </div>
          {stats?.pending_withdrawals && (
            <div className="flex gap-3 text-sm">
              <div className="text-center"><p className="font-bold">{stats.pending_withdrawals.count}</p><p className="text-xs text-muted-foreground">Tertunda</p></div>
              <div className="text-center"><p className="font-bold">{formatIDR(stats.pending_withdrawals.amount)}</p><p className="text-xs text-muted-foreground">Nominal</p></div>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {WD_FILTERS.map((f) => (
            <button key={f} onClick={() => setWdFilter(f)}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all capitalize',
                wdFilter === f ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted border-transparent hover:border-border')}>
              {f === 'all' ? 'Semua' : f === 'pending' ? 'Tertunda' : f === 'completed' ? 'Selesai' : 'Gagal'}
            </button>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[680px]">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground uppercase tracking-wider">
                {['Tanggal', 'Email', 'Metode', 'Tujuan', 'Nominal', 'Biaya', 'Status', ''].map((h, i) => (
                  <th key={i} className={cn('pb-2 font-semibold', i >= 4 && i <= 5 ? 'text-right' : '')}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {visibleWd.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-8 text-sm text-muted-foreground">Tidak ada permintaan dengan status ini.</td></tr>
              ) : visibleWd.map((w, i) => (
                <tr key={i} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3 text-xs">{formatDate(w.created_at)}</td>
                  <td className="py-3 text-xs">{w.email}</td>
                  <td className="py-3">{w.method === 'bank' ? 'Bank' : 'E-Wallet'}</td>
                  <td className="py-3 font-mono text-xs max-w-[120px] truncate">{w.destination}</td>
                  <td className="py-3 text-right font-semibold">{formatIDR(w.amount)}</td>
                  <td className="py-3 text-right text-muted-foreground">{formatIDR(w.fee)}</td>
                  <td className="py-3">
                    <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold capitalize', STATUS_STYLE[w.status] || 'bg-muted text-muted-foreground')}>{w.status}</span>
                  </td>
                  <td className="py-3">
                    {(w.status === 'pending' || w.status === 'processing') && (
                      <div className="flex gap-1">
                        <button onClick={() => handleWdAction(w.id, 'complete')} title="Tandai Selesai"
                          className="p-1.5 rounded-lg hover:bg-green-100 text-green-600 transition-colors"><CheckCircle className="w-4 h-4" /></button>
                        <button onClick={() => handleWdAction(w.id, 'fail')} title="Gagalkan"
                          className="p-1.5 rounded-lg hover:bg-red-100 text-destructive transition-colors"><XCircle className="w-4 h-4" /></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Provider */}
        <motion.div {...fade} transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <p className="text-sm font-semibold">API Provider QRIS</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Provider</label>
              <select value={provForm.provider || 'internal'} onChange={(e) => setProvForm((p) => ({ ...p, provider: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                {['internal', 'midtrans', 'xendit', 'ipaymu', 'custom'].map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">API Type</label>
              <select value={provForm.api_type || 'snap'} onChange={(e) => setProvForm((p) => ({ ...p, api_type: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="snap">SNAP API</option>
                <option value="non-snap">Non-SNAP API</option>
              </select>
            </div>
            <SettingField label="Merchant ID (Opsional)" name="merchant_id" value={provForm.merchant_id} onChange={(v) => setProvForm((p) => ({ ...p, merchant_id: v }))} />
            <SettingField label="Masa Berlaku QRIS (menit)" name="expiry_minutes" type="number" min={1} max={1440} value={provForm.expiry_minutes} onChange={(v) => setProvForm((p) => ({ ...p, expiry_minutes: Number(v) }))} />
            <div className="col-span-2">
              <SettingField label="API Base URL" name="api_base_url" type="url" value={provForm.api_base_url} onChange={(v) => setProvForm((p) => ({ ...p, api_base_url: v }))} />
            </div>
            <div className="col-span-2">
              <SettingField label="API Key / Secret" name="api_key" value={provForm.api_key} onChange={(v) => setProvForm((p) => ({ ...p, api_key: v }))} />
            </div>
          </div>
          <div className="flex justify-end">
            <button onClick={() => saveSetting('qris_provider', provForm)}
              className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors">
              Simpan
            </button>
          </div>
        </motion.div>

        {/* Fees */}
        <motion.div {...fade} transition={{ duration: 0.4, delay: 0.25 }}
          className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <p className="text-sm font-semibold">MDR & Biaya Pencairan</p>
          <div className="grid grid-cols-2 gap-3">
            <SettingField label="MDR QRIS Flat (%)" type="number" step="0.01" value={feesForm.qris_flat_percent} onChange={(v) => setFeesForm((p) => ({ ...p, qris_flat_percent: Number(v) }))} />
            <SettingField label="Pencairan Minimum (IDR)" type="number" step="500" value={feesForm.withdrawal_min_idr} onChange={(v) => setFeesForm((p) => ({ ...p, withdrawal_min_idr: Number(v) }))} />
            <SettingField label="Biaya Bank (IDR)" type="number" step="500" value={feesForm.withdrawal_bank_fee_idr} onChange={(v) => setFeesForm((p) => ({ ...p, withdrawal_bank_fee_idr: Number(v) }))} />
            <SettingField label="Biaya E-Wallet (IDR)" type="number" step="500" value={feesForm.withdrawal_ewallet_fee_idr} onChange={(v) => setFeesForm((p) => ({ ...p, withdrawal_ewallet_fee_idr: Number(v) }))} />
          </div>
          <div className="flex justify-end">
            <button onClick={() => saveSetting('fees', feesForm)}
              className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors">
              Simpan
            </button>
          </div>
        </motion.div>
      </div>

      {/* Users */}
      <motion.div {...fade} transition={{ duration: 0.4, delay: 0.3 }}
        className="bg-card border border-border rounded-2xl p-6 overflow-x-auto pb-6">
        <p className="text-sm font-semibold mb-4">Pengguna</p>
        <table className="w-full text-sm min-w-[560px]">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground uppercase tracking-wider">
              {['Email', 'Nama', 'Peran', 'Saldo', 'Bergabung', ''].map((h, i) => (
                <th key={i} className={cn('pb-2 font-semibold', i === 3 ? 'text-right' : '')}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-sm text-muted-foreground">Belum ada pengguna.</td></tr>
            ) : users.map((u, i) => (
              <tr key={i} className="hover:bg-muted/30 transition-colors">
                <td className="py-3 text-xs font-mono">{u.email}</td>
                <td className="py-3">{u.name || '—'}</td>
                <td className="py-3">
                  <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold',
                    u.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-green-100 text-green-700')}>
                    {u.role}
                  </span>
                </td>
                <td className="py-3 text-right">{formatIDR(u.balance)}</td>
                <td className="py-3 text-xs">{formatDate(u.created_at)}</td>
                <td className="py-3">
                  {u.id !== user?.id && (
                    <button onClick={() => handleDeleteUser(u)}
                      className="p-1.5 rounded-lg hover:bg-red-100 text-destructive transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
}
