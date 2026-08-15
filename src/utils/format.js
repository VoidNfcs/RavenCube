import { config } from '../config.js';

export function formatNumber(n) {
  const num = Number(n);
  if (Number.isNaN(num)) return String(n ?? '-');
  return num.toLocaleString('id-ID');
}

export function formatRupiah(n) {
  const num = Number(n);
  if (Number.isNaN(num)) return 'Rp 0';
  return 'Rp ' + num.toLocaleString('id-ID');
}

export function formatTime(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value ?? '-');
  return d.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
}

export function randomRefId(prefix = 'BOT') {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function parseArgs(text) {
  return text.trim().split(/\s+/);
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidUrl(url) {
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

export function formatProduct(p, idx) {
  const stock = p.stock != null ? `\nStok: ${formatNumber(p.stock)}` : '';
  return `*${idx}.* *${p.name}*\nID: \`${p.product_id}\`\nHarga: *${formatRupiah(p.price)}*${stock}`;
}

export function formatProfile(data) {
  const account = data.account || data;
  const lines = [
    `*${config.botName} - Profil Akun*`,
    '',
    `ID: ${account.id || '-'}`,
    `Username: ${account.username || '-'}`,
    `Email: ${account.email || '-'}`,
    `WhatsApp: ${account.wa || account.whatsapp || '-'}`,
    `Saldo: *${formatRupiah(account.balance ?? account.saldo ?? data.balance ?? 0)}*`,
    `Status: ${account.status || '-'}`,
  ];
  return lines.join('\n');
}

export function formatOrder(data) {
  const order = data.order || data;
  return [
    `*Order Diterima*`,
    '',
    `Invoice: \`${order.invoice || '-'}\``,
    `Produk ID: ${order.product_id || '-'}`,
    `Qty: ${order.qty || '-'}`,
    `Harga: ${formatRupiah(order.price ?? order.total ?? 0)}`,
    `Status: ${order.status || 'pending'}`,
  ].join('\n');
}

export function formatStatus(data) {
  const status = data.order || data;
  return [
    `*Cek Status*`,
    '',
    `Invoice: \`${status.invoice || '-'}\``,
    `Produk: ${status.product_id || '-'}`,
    `Qty: ${status.qty || '-'}`,
    `Status: *${status.status || '-'}*`,
    status.message ? `Info: ${status.message}` : '',
    status.created_at ? `Dibuat: ${formatTime(status.created_at)}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}
