import { premku } from '../api/premku.js';
import { dbHelpers } from '../db/index.js';
import { stopPollingPayment } from '../services/paymentPoller.js';

export const name = 'cancelpay';
export const aliases = ['batalkan', 'batalkanpay'];
export const description = 'Batalkan deposit yang masih pending';
export const usage = 'cancelpay <invoice>';

export async function run(sock, jid, args, quotedId) {
  const invoice = args[0];
  if (!invoice) {
    return sock.sendMessage(jid, { text: `Format: ${usage}\nContoh: /cancelpay PAY-123` });
  }
  try {
    const data = await premku.cancelPay(invoice);
    await dbHelpers.updatePaymentStatus(invoice, 'cancelled');
    stopPollingPayment(invoice);
    const lines = [
      `*Pembatalan Deposit*`,
      ``,
      `Invoice: \`${invoice}\``,
      data.message ? `Info: ${data.message}` : 'Pembayaran berhasil dibatalkan.',
    ].join('\n');
    await sock.sendMessage(jid, { text: lines });
  } catch (err) {
    await sock.sendMessage(jid, { text: `Pembatalan gagal:\n${err.message}` });
  }
}
