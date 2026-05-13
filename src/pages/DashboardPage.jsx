import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { api, formatIDR, formatDate } from '@/lib/utils';
import { QrCode, ArrowDownToLine, TrendingUp, CheckCircle, ArrowRight } from 'lucide-react';

const fade = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } };

function BarChart({ series }) {
  if (!series || !series.length) return null;
  const max = Math.max(1, ...series.map((p) => p.inflow));
  return (
    <div className="flex items-end gap-1 h-28 w-full">
      {series.map((p, i) => (
        <div
          key={i}
          title={`${p.day} — ${formatIDR(p.inflow)}`}
          className={`flex-1 rounded-t-sm transition-all duration-300 cursor-pointer hover:opacity-80 ${
            i === series.length - 1 ? 'bg-indigo-500' : 'bg-muted-foreground/20'
          }`}
          style={{ height: `${Math.max(6, (p.inflow / max) * 112)}px` }}
        />
      ))}
    </div>
  );
}

function TxRow({ tx }) {
  const positive = Number(tx.amount) >= 0;
  return (
    <div className="flex items-center gap-3 py-3 border-b border-border last:border-0">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
        positive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
      }`}>
        {positive
          ? <CheckCircle className="w-4 h-4" />
          : <ArrowDownToLine className="w-4 h-4" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{tx.description || tx.type}</div>
        <div className="text-xs text-muted-foreground">{formatDate(tx.created_at)}{tx.reference ? ` · ${tx.reference}` : ''}</div>
      </div>
      <div className={`text-sm font-semibold ${positive ? 'text-green-600' : 'text-destructive'}`}>
        {positive ? '+' : ''}{formatIDR(tx.amount)}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [range, setRange] = useState(7);
  const [data, setData] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  async function load(r) {
    setRange(r);
    setLoadingData(true);
    try {
      const res = await api(`/api/dashboard/summary?days=${r}`);
      setData(res);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoadingData(false);
    }
  }

  useEffect(() => {
    load(7);
    api('/api/transactions?limit=10')
      .then((res) => setRecent(res.transactions || []))
      .catch(() => {});
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Page header */}
      <motion.div {...fade} transition={{ duration: 0.4 }}>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Dasbor</p>
        <h1 className="text-3xl font-bold mt-1">
          Halo, {user?.name || user?.email?.split('@')[0]} 👋
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">Pantau saldo, omset, dan transaksi terkini Anda.</p>
      </motion.div>

      {/* Balance + Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Balance card */}
        <motion.div {...fade} transition={{ duration: 0.4, delay: 0.05 }}
          className="lg:col-span-2 rounded-2xl bg-primary text-primary-foreground p-6 flex flex-col gap-4">
          <div>
            <p className="text-xs font-semibold opacity-70 uppercase tracking-widest">Saldo Tersedia</p>
            <p className="text-3xl font-bold mt-2 tracking-tight">
              {data ? formatIDR(data.balance) : '—'}
            </p>
            <p className="text-xs opacity-60 mt-1">Diperbarui baru saja</p>
          </div>
          <div className="flex gap-2 mt-auto">
            <Link to="/withdrawal"
              className="flex-1 text-center text-xs font-semibold py-2 rounded-xl bg-white/20 hover:bg-white/30 transition-colors">
              Cairkan Dana
            </Link>
            <Link to="/generate-qris"
              className="flex-1 text-center text-xs font-semibold py-2 rounded-xl border border-white/30 hover:bg-white/10 transition-colors">
              Buat QRIS
            </Link>
          </div>
        </motion.div>

        {/* Revenue chart */}
        <motion.div {...fade} transition={{ duration: 0.4, delay: 0.1 }}
          className="lg:col-span-3 bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold">Pendapatan</p>
            <div className="flex gap-1 bg-muted rounded-lg p-1">
              {[7, 30, 90].map((r) => (
                <button key={r} onClick={() => load(r)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-200 ${
                    range === r ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}>
                  {r} Hari
                </button>
              ))}
            </div>
          </div>
          {loadingData ? (
            <div className="h-28 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <BarChart series={data?.series || []} />
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>{data?.series?.[0]?.day || '—'}</span>
                <span>{data?.series?.at(-1)?.day || '—'}</span>
              </div>
            </>
          )}
        </motion.div>
      </div>

      {/* KPI row */}
      <motion.div {...fade} transition={{ duration: 0.4, delay: 0.15 }}
        className="grid grid-cols-3 gap-4">
        {[
          { label: 'Omset', value: data ? formatIDR(data.totals?.inflow) : '—', icon: TrendingUp, color: 'text-green-600' },
          { label: 'Pencairan', value: data ? formatIDR(data.totals?.outflow) : '—', icon: ArrowDownToLine, color: 'text-destructive' },
          { label: 'QRIS Berhasil', value: data ? (data.totals?.qris_count || 0).toLocaleString('id-ID') : '—', icon: QrCode, color: 'text-indigo-500' },
        ].map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i} className="bg-card border border-border rounded-2xl p-5 hover-lift">
              <div className={`w-9 h-9 rounded-xl bg-muted flex items-center justify-center mb-3 ${kpi.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <p className="text-xs text-muted-foreground font-medium">{kpi.label}</p>
              <p className="text-xl font-bold mt-0.5 tracking-tight">{kpi.value}</p>
            </div>
          );
        })}
      </motion.div>

      {/* Recent transactions */}
      <motion.div {...fade} transition={{ duration: 0.4, delay: 0.2 }}
        className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold">Transaksi Terkini</p>
          <Link to="/transactions" className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
            Lihat Semua <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Belum ada transaksi.</p>
        ) : (
          recent.slice(0, 5).map((tx) => <TxRow key={tx.id} tx={tx} />)
        )}
      </motion.div>

      {/* Quick actions */}
      <motion.div {...fade} transition={{ duration: 0.4, delay: 0.25 }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-6">
        <Link to="/generate-qris"
          className="bg-card border border-border rounded-2xl p-6 hover:border-indigo-400 hover:shadow-md hover:shadow-indigo-500/5 transition-all duration-300 group">
          <span className="inline-block text-xs font-bold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 mb-3">QRIS</span>
          <p className="font-semibold text-sm">Buat QRIS Pembayaran</p>
          <p className="text-xs text-muted-foreground mt-1">MDR 0,7% ditanggung pembeli — Anda menerima nominal penuh.</p>
        </Link>
        <Link to="/withdrawal"
          className="bg-card border border-border rounded-2xl p-6 hover:border-green-400 hover:shadow-md hover:shadow-green-500/5 transition-all duration-300 group">
          <span className="inline-block text-xs font-bold px-2 py-0.5 rounded-md bg-green-100 text-green-700 mb-3">Pencairan</span>
          <p className="font-semibold text-sm">Cairkan ke E-Wallet / Bank</p>
          <p className="text-xs text-muted-foreground mt-1">Min. IDR 50.000 · Maks. IDR 5 jt/minggu · Estimasi 1×24 jam kerja.</p>
        </Link>
      </motion.div>
    </div>
  );
}
