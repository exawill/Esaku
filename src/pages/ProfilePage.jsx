import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useToast } from '@/context/ToastContext';
import { api, formatIDR, formatDate, initials } from '@/lib/utils';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const fade = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } };

export default function ProfilePage() {
  const { showToast } = useToast();
  const { signOut } = useAuth();
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState('');
  const [curPass, setCurPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPass, setSavingPass] = useState(false);

  useEffect(() => {
    api('/api/profile').then((me) => {
      setProfile(me.profile);
      setName(me.profile.name || '');
    }).catch((err) => showToast(err.message, 'error'));
  }, []);

  async function handleProfileSave(e) {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await api('/api/profile', { method: 'PATCH', body: { name: name.trim() || null } });
      setProfile((p) => ({ ...p, name: name.trim() || null }));
      showToast('Profil tersimpan', 'success');
    } catch (err) { showToast(err.message, 'error'); }
    finally { setSavingProfile(false); }
  }

  async function handlePassSave(e) {
    e.preventDefault();
    setSavingPass(true);
    try {
      await api('/api/profile/password', {
        method: 'POST',
        body: { current_password: curPass || '', new_password: newPass },
      });
      showToast('Kata sandi diperbarui', 'success');
      setCurPass(''); setNewPass('');
    } catch (err) { showToast(err.message, 'error'); }
    finally { setSavingPass(false); }
  }

  if (!profile) return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const avatar = initials(profile);
  const roleStyle = profile.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-green-100 text-green-700';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div {...fade} transition={{ duration: 0.4 }}>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Profil</p>
        <h1 className="text-3xl font-bold mt-1">Akun Anda</h1>
        <p className="text-muted-foreground mt-1 text-sm">Perbarui nama dan kata sandi Anda di sini.</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Identity + edit name */}
        <motion.div {...fade} transition={{ duration: 0.4, delay: 0.05 }}
          className="bg-card border border-border rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold flex-shrink-0">
              {avatar}
            </div>
            <div>
              <p className="font-bold text-lg">{profile.name || profile.email.split('@')[0]}</p>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
              <div className="flex gap-1.5 mt-1.5">
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${roleStyle}`}>{profile.role}</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">Tanpa KYC</span>
              </div>
            </div>
          </div>

          <div className="bg-muted/60 rounded-xl p-4 space-y-2 text-sm">
            {[['Saldo', formatIDR(profile.balance)], ['Bergabung', formatDate(profile.created_at)], ['Login OAuth', profile.oauth_provider || '—']].map(([l, v]) => (
              <div key={l} className="flex justify-between">
                <span className="text-muted-foreground">{l}</span>
                <span className="font-medium">{v}</span>
              </div>
            ))}
          </div>

          <form onSubmit={handleProfileSave} className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">Nama Lengkap</label>
              <input value={name} onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow" />
            </div>
            <button type="submit" disabled={savingProfile}
              className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-60">
              {savingProfile ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </form>
        </motion.div>

        {/* Password */}
        <motion.div {...fade} transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-card border border-border rounded-2xl p-6 space-y-5">
          <div>
            <p className="font-semibold">Ubah Kata Sandi</p>
            <p className="text-xs text-muted-foreground mt-1">Minimal 8 karakter. Kosongkan kata sandi saat ini jika akun Anda hanya melalui Hostinger OAuth.</p>
          </div>
          <form onSubmit={handlePassSave} className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">Kata Sandi Saat Ini</label>
              <input type="password" autoComplete="current-password" value={curPass} onChange={(e) => setCurPass(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Kata Sandi Baru</label>
              <input type="password" autoComplete="new-password" required minLength={8} value={newPass} onChange={(e) => setNewPass(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow" />
            </div>
            <button type="submit" disabled={savingPass}
              className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-60">
              {savingPass ? 'Menyimpan...' : 'Simpan Kata Sandi'}
            </button>
          </form>
          <div className="pt-2 border-t border-border flex justify-end">
            <button onClick={signOut}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
              <LogOut className="w-4 h-4" /> Keluar dari akun
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
