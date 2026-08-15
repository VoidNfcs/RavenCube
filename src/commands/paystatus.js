import { premku } from '../api/premku.js';
import { dbHelpers } from '../db/index.js';
import { formatRupiah } from '../utils/format.js';

export const name = 'paystatus';
export const aliases = ['cekpembayaran', 'paymentstatus'];
export const description = 'Cek status pembayaran deposit';
export const usage = 'paystatus <invoice>';

export async function run(sock, jid, args, quotedId) {
  const invoice = args[0];
  if (!invoice) {
    return sock.sendMessage(jid, { text: `Format: ${usage}\nContoh: /paystatus PAY-123` });
  }
  try {
    const data = await premku.payStatus(invoice);
    const d = data.data || data;
    const status = String(d.status || data.status || '');
    const lower = status.toLowerCase();
    if (lower === 'paid' || lower === 'success' || lower === 'settled' || lower === 'completed') {
      await dbHelpers.updatePaymentStatus(d.invoice || invoice, 'paid');
    } else if (lower === 'expired' || lower === 'cancelled') {
      await dbHelpers.updatePaymentStatus(d.invoice || invoice, lower);
    }
    const local = await dbHelpers.getPayment(d.invoice || invoice);
    const lines = [
      `*Status Pembayaran*`,
      ``,
      `Invoice: \`${d.invoice || invoice}\``,
      `Status: *${status || local?.status || '-'}*`,
      d.total_bayar ? `Total: ${formatRupiah(d.total_bayar)}` : local?.totalBayar ? `Total: ${formatRupiah(local.totalBayar)}` : '',
      local?.productId ? `Untuk produk: ${local.productId} x${local.qty}` : '',
      data.message ? `Info: ${data.message}` : '',
    ]
      .filter(Boolean)
      .join('\n');
    await sock.sendMessage(jid, { text: lines });
  } catch (err) {
    await sock.sendMessage(jid, { text: `Cek pembayaran gagal:\n${err.message}` });
  }
}
