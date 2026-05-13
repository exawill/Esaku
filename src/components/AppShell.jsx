import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { api, initials } from '@/lib/utils';
import {
  LayoutDashboard, QrCode, ArrowDownToLine, History,
  User, Bell, LogOut, ShieldCheck, Menu, X, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const EsakuLogo = () => (
  <svg width="26" height="26" viewBox="0 0 80 80" fill="none">
    <rect x="8" y="8" width="56" height="56" rx="10" transform="rotate(8 40 40)" fill="#141210" />
    <text x="14" y="58" fontFamily="Georgia,serif" fontSize="52" fontWeight="bold" fill="white" fontStyle="italic">e</text>
    <path d="M26 62 Q38 74 54 66 Q64 60 58 50" stroke="#4f46e5" strokeWidth="5" fill="none" strokeLinecap="round" />
    <path d="M33 68 Q44 78 58 70" stroke="#4f46e5" strokeWidth="3.5" fill="none" strokeLinecap="round" opacity="0.55" />
  </svg>
);

function navItems(role) {
  const base = [
    { href: '/dashboard', label: 'Dasbor', icon: LayoutDashboard },
    { href: '/generate-qris', label: 'Buat QRIS', icon: QrCode },
    { href: '/transactions', label: 'Riwayat', icon: History },
    { href: '/withdrawal', label: 'Cairkan', icon: ArrowDownToLine },
  ];
  if (role === 'admin') base.push({ href: '/admin', label: 'Admin', icon: ShieldCheck });
  return base;
}

function NotifPanel({ open, onClose }) {
  const [notifs, setNotifs] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const lastIdRef = useRef(null);

  async function fetchNotifs() {
    try {
      const data = await api('/api/transactions?limit=10');
      const txs = data.transactions || [];
      if (!txs.length) return;
      const latestId = txs[0].id;
      if (lastIdRef.current !== null && latestId !== lastIdRef.current) {
        const newOnes = txs.filter((t) => t.id > lastIdRef.current);
        setNotifs((prev) => {
          const updated = [...newOnes.map((t) => ({ ...t, unread: true })), ...prev].slice(0, 20);
          setUnreadCount(updated.filter((n) => n.unread).length);
          return updated;
        });
      } else if (lastIdRef.current === null) {
        const initial = txs.map((t) => ({ ...t, unread: false }));
        setNotifs(initial);
        setUnreadCount(0);
      }
      lastIdRef.current = latestId;
    } catch (_e) {}
  }

  useEffect(() => {
    fetchNotifs();
    const h = setInterval(fetchNotifs, 15000);
    return () => clearInterval(h);
  }, []);

  function markRead() {
    setNotifs((prev) => prev.map((n) => ({ ...n, unread: false })));
    setUnreadCount(0);
  }

  const TYPE_LABEL = { qris_in: 'Pembayaran QRIS', withdrawal_out: 'Pencairan Dana', fee: 'Biaya MDR', adjustment: 'Penyesuaian' };
  function timeAgo(d) {
    const diff = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
    if (diff < 60) return 'Baru saja';
    if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
    return `${Math.floor(diff / 86400)} hari lalu`;
  }

  return { unreadCount, panel: (
    <div className={cn(
      'absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-2xl shadow-xl z-50 transition-all duration-200 origin-top-right',
      open ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'
    )}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="font-semibold text-sm">Notifikasi</span>
        <button onClick={markRead} className="text-xs text-muted-foreground hover:text-foreground transition-colors">Tandai Dibaca</button>
      </div>
      <div className="max-h-72 overflow-y-auto divide-y divide-border">
        {notifs.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">Belum ada notifikasi.</div>
        ) : notifs.map((n, i) => {
          const positive = Number(n.amount) >= 0;
          return (
            <div key={i} className={cn('px-4 py-3 flex gap-3', n.unread && 'bg-primary/5')}>
              <div className={cn('w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold',
                n.type === 'qris_in' ? 'bg-green-100 text-green-600' :
                n.type === 'withdrawal_out' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
              )}>
                {positive ? '+' : '-'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium truncate">{TYPE_LABEL[n.type] || n.type}</span>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">{timeAgo(n.created_at)}</span>
                </div>
                <div className="text-xs text-muted-foreground truncate">{n.description || '—'}</div>
                <div className={cn('text-xs font-semibold', positive ? 'text-green-600' : 'text-destructive')}>
                  {positive ? '+' : ''}{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n.amount)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  )};
}

export default function AppShell({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { showToast } = useToast();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifWrapRef = useRef(null);
  const { unreadCount, panel: notifPanel } = NotifPanel({ open: notifOpen, onClose: () => setNotifOpen(false) });

  useEffect(() => {
    function onClick(e) {
      if (notifWrapRef.current && !notifWrapRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  if (!user) return null;

  const items = navItems(user.role);
  const avatar = initials(user);

  const NavLinks = ({ onClick: navClick }) => (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const Icon = item.icon;
        const active = location.pathname === item.href;
        return (
          <Link
            key={item.href}
            to={item.href}
            onClick={navClick}
            className={cn(
              'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
              active
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-secondary hover:text-secondary-foreground'
            )}
          >
            <Icon className="w-4 h-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex flex-col fixed top-0 left-0 h-screen w-60 border-r bg-card px-5 py-8 z-40">
        <Link to="/dashboard" className="flex items-center gap-2.5 mb-10 group">
          <EsakuLogo />
          <span className="font-bold text-xl tracking-tight">Esaku</span>
        </Link>
        <div className="flex-1 flex flex-col justify-between">
          <NavLinks />
          <div className="pt-4 border-t border-border">
            <Link
              to="/profile"
              className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-secondary transition-colors group"
            >
              <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                {avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{user.name || user.email.split('@')[0]}</div>
                <div className="text-xs text-muted-foreground truncate">{user.email}</div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          </div>
        </div>
      </aside>

      {/* ── Main Area ── */}
      <div className="flex-1 md:ml-60 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg">
          <div className="flex items-center justify-between h-14 px-4 md:px-6">
            {/* Mobile: hamburger + logo */}
            <div className="flex items-center gap-3 md:hidden">
              <button
                onClick={() => setMobileOpen(true)}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
                aria-label="Menu"
              >
                <Menu className="w-5 h-5" />
              </button>
              <Link to="/dashboard" className="flex items-center gap-2">
                <EsakuLogo />
                <span className="font-bold text-lg">Esaku</span>
              </Link>
            </div>

            {/* Desktop: page breadcrumb placeholder */}
            <div className="hidden md:block" />

            {/* Right actions */}
            <div className="flex items-center gap-2">
              {/* Notification bell */}
              <div ref={notifWrapRef} className="relative">
                <button
                  onClick={() => setNotifOpen((o) => !o)}
                  className="relative p-2 rounded-lg hover:bg-muted transition-colors"
                  aria-label="Notifikasi"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-destructive text-destructive-foreground rounded-full text-[9px] font-bold flex items-center justify-center animate-ping-once">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                {notifPanel}
              </div>

              {/* Sign out */}
              <button
                onClick={signOut}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground"
              >
                <LogOut className="w-4 h-4" />
                Keluar
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>

        <footer className="border-t border-border px-6 py-4 text-center text-xs text-muted-foreground">
          © 2026 Esaku · QRIS Merchant Perorangan ·{' '}
          <Link to="/" className="hover:text-foreground transition-colors">Beranda</Link>
        </footer>
      </div>

      {/* ── Mobile Drawer ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[100] md:hidden">
          <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute top-0 left-0 h-full w-72 bg-card flex flex-col px-5 py-8 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <Link to="/dashboard" className="flex items-center gap-2.5">
                <EsakuLogo />
                <span className="font-bold text-xl">Esaku</span>
              </Link>
              <button onClick={() => setMobileOpen(false)} className="p-2 rounded-lg hover:bg-muted transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <NavLinks onClick={() => setMobileOpen(false)} />
            <div className="mt-auto pt-4 border-t border-border space-y-2">
              <Link
                to="/profile"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-secondary transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                  {avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{user.name || user.email.split('@')[0]}</div>
                  <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                </div>
              </Link>
              <button
                onClick={signOut}
                className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-muted-foreground hover:bg-secondary transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Keluar dari Akun
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
