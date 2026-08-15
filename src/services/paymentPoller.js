import { premku } from '../api/premku.js';
import { dbHelpers } from '../db/index.js';
import { config } from '../config.js';
import { formatOrder } from '../utils/format.js';

const pollers = new Map();

async function pollPayment(sock, jid, invoice, totalAmount, product, qty, refId, onTimeout) {
  const intervalMs = Math.max(config.pollIntervalMs, 1000);
  const start = Date.now();

  const check = async () => {
    const elapsed = Date.now() - start;
    const timeoutSec = config.payTimeoutSeconds > 0 ? config.payTimeoutSeconds * 1000 : 0;
    const local = await dbHelpers.getPayment(invoice);
    const apiTimeoutMs = local?.expiredIn ? Number(local.expiredIn) * 1000 : 0;
    const limit = timeoutSec || apiTimeoutMs || 15 * 60 * 1000;
    if (elapsed > limit) {
      stop();
      await dbHelpers.updatePaymentStatus(invoice, 'expired');
      await sock.sendMessage(jid, {
        text: `Pembayaran untuk invoice \`${invoice}\` sudah kedaluwarsa. Silakan kirim ulang perintah order jika ingin melanjutkan.`,
      });
      if (typeof onTimeout === 'function') onTimeout();
      return;
    }

    let data;
    try {
      data = await premku.payStatus(invoice);
    } catch {
      return;
    }
    const d = data.data || data;
    const status = (d.status || data.status || '').toLowerCase();

    if (status === 'paid' || status === 'success' || status === 'settled' || status === 'completed') {
      stop();
      await dbHelpers.updatePaymentStatus(invoice, 'paid');
      await executeOrder(sock, jid, invoice, totalAmount, product, qty, refId);
    }
  };

  const timer = setInterval(check, intervalMs);
  const stop = () => {
    clearInterval(timer);
    pollers.delete(invoice);
  };
  pollers.set(invoice, { stop, check });

  check();
}

async function executeOrder(sock, jid, invoice, totalAmount, product, qty, refId) {
  try {
    const data = await premku.order(product.product_id, qty, refId);
    const order = data.order || data;
    const orderInvoice = order.invoice || invoice;

    await dbHelpers.insertOrder({
      invoice: orderInvoice,
      ref_id: refId,
      product_id: product.product_id,
      qty,
      price: totalAmount,
      status: order.status || 'success',
      payment_invoice: invoice,
      jid,
    });

    const text =
      formatOrder({ order: { ...order, price: totalAmount } }) +
      `\n\nPembayaran \`${invoice}\` berhasil, order diproses.\nRef ID: \`${refId}\``;
    await sock.sendMessage(jid, { text });
  } catch (err) {
    await dbHelpers.updatePaymentStatus(invoice, 'paid');
    await sock.sendMessage(jid, {
      text: `Pembayaran \`${invoice}\` sukses tetapi order gagal dieksekusi:\n${err.message}\nGunakan \`/order ${product.product_id} ${qty}\` untuk mencoba lagi.`,
    });
  }
}

export function startPollingPayment({ sock, jid, invoice, totalAmount, product, qty, refId, onTimeout }) {
  pollPayment(sock, jid, invoice, totalAmount, product, qty, refId, onTimeout);
}

export function stopPollingPayment(invoice) {
  const p = pollers.get(invoice);
  if (p) p.stop();
}
