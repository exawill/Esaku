// Utility: combine class names (same as Portfolio's lib/utils)
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// IDR formatter
const IDR = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

export function formatIDR(n) {
  return IDR.format(Number(n || 0));
}

export function formatDate(d) {
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function unFmt(s) {
  return parseInt(String(s).replace(/\D/g, ''), 10) || 0;
}

export function fmtAmt(s) {
  const n = unFmt(s);
  return n ? n.toLocaleString('id-ID') : '';
}

export async function api(path, options = {}) {
  const opts = {
    method: options.method || 'GET',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    credentials: 'same-origin',
  };
  if (options.body !== undefined) opts.body = JSON.stringify(options.body);
  const res = await fetch(path, opts);
  let data = null;
  try { data = await res.json(); } catch (_e) {}
  if (!res.ok) {
    const err = new Error((data && data.error) || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

export async function getMe() {
  try { return (await api('/api/auth/me')).user; } catch (_e) { return null; }
}

export async function signOut() {
  try { await api('/api/auth/sign-out', { method: 'POST' }); } catch (_e) {}
  window.location.href = '/';
}

export function initials(u) {
  return (u.name || u.email || '?')
    .split(/\s+|@/)
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}
