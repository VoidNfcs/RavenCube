import { premku } from '../api/premku.js';
import { dbHelpers } from '../db/index.js';
import { formatRupiah, randomRefId } from '../utils/format.js';

export const name = 'pay';
export const aliases = ['deposit', 'topup', 'qris'];
export const description = 'Deposit saldo via QRIS';
export const usage = 'pay <amount> [ref_id]';

export async function run(sock, jid, args, quotedId) {
  const amount = args[0] ? parseInt(args[0], 10) : NaN;
  if (Number.isNaN(amount) || amount <= 0) {
    return sock.sendMessage(jid, { text: `Format: ${usage}\nContoh: /pay 100000` });
  }
  const refId = args[1] || randomRefId('PAY');
  try {
    const data = await premku.pay(amount, refId);
    const d = data.data || data;
    const invoice = d.invoice;
    if (invoice) {
      await dbHelpers.insertPayment({
        invoice,
        amount_req: Number(d.amount_req ?? amount),
        kode_unik: d.kode_unik != null ? Number(d.kode_unik) : null,
        total_bayar: Number(d.total_bayar ?? d.amount_req ?? amount),
        qr_image: d.qr_image || null,
        expired_in: d.expired_in != null ? Number(d.expired_in) : null,
        status: 'waiting_payment',
        ref_id: refId,
        jid,
      });
    }
    const lines = [
      `*Deposit QRIS*`,
      ``,
      `Invoice: \`${d.invoice || '-'}\``,
      `Nominal: ${formatRupiah(d.amount_req ?? amount)}`,
      `Kode Unik: ${d.kode_unik != null ? d.kode_unik : '-'}`,
      `Total Bayar: *${formatRupiah(d.total_bayar ?? d.amount_req ?? amount)}*`,
      `Batas Waktu: ${d.expired_in != null ? `${d.expired_in} detik` : '-'}`,
      ``,
      `Gunakan perintah \`/paystatus <invoice>\` untuk cek status pembayaran.`,
      `Untuk batal: \`/cancelpay <invoice>\``,
    ];
    await sock.sendMessage(jid, { text: lines.join('\n') });
    if (d.qr_image) {
      await sock.sendMessage(jid, { text: `QR: ${d.qr_image}` });
    } else if (d.qr_raw) {
      await sock.sendMessage(jid, { text: `QR Raw:\n${d.qr_raw}` });
    }
  } catch (err) {
    await sock.sendMessage(jid, { text: `Deposit gagal:\n${err.message}` });
  }
}
