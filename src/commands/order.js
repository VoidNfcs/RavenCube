import { premku } from '../api/premku.js';
import { dbHelpers } from '../db/index.js';
import { formatRupiah, randomRefId } from '../utils/format.js';
import { startPollingPayment } from '../services/paymentPoller.js';

export const name = 'order';
export const aliases = ['buy', 'beli', 'pesan'];
export const description = 'Beli produk (bayar QRIS dulu, order diproses setelah pembayaran sukses)';
export const usage = 'order <product_id> <qty>';

async function findProduct(productId) {
  const data = await premku.products();
  const list = data.products || data.data || [];
  return list.find((p) => String(p.product_id) === String(productId)) || null;
}

export async function run(sock, jid, args, quotedId) {
  const productId = args[0];
  const qty = args[1] ? parseInt(args[1], 10) : 1;
  if (!productId || Number.isNaN(qty) || qty <= 0) {
    return sock.sendMessage(jid, {
      text: `Format: ${usage}\nContoh: /order 12345 2`,
    });
  }

  let product;
  try {
    product = await findProduct(productId);
  } catch (err) {
    return sock.sendMessage(jid, { text: `Gagal mengambil daftar produk:\n${err.message}` });
  }
  if (!product) {
    return sock.sendMessage(jid, { text: `Produk \`${productId}\` tidak ditemukan. Ketik /products untuk melihat daftar.` });
  }

  const price = Number(product.price ?? 0);
  if (price <= 0) {
    return sock.sendMessage(jid, { text: `Harga produk \`${productId}\` tidak valid.` });
  }
  const total = price * qty;

  try {
    const stockData = await premku.stock(productId);
    const stock = stockData.stock ?? stockData.data?.stock;
    if (stock != null && Number(stock) <= 0) {
      return sock.sendMessage(jid, { text: `Stok produk \`${productId}\` habis.` });
    }
  } catch {
    // Abaikan jika cek stok gagal, lanjut ke pembayaran.
  }

  const refId = randomRefId();
  let payData;
  try {
    payData = await premku.pay(total, refId);
  } catch (err) {
    return sock.sendMessage(jid, { text: `Gagal membuat pembayaran:\n${err.message}` });
  }

  const d = payData.data || payData;
  const invoice = d.invoice;
  if (!invoice) {
    return sock.sendMessage(jid, { text: 'Respon pembayaran tidak valid (tidak ada invoice).' });
  }

  const amountReq = Number(d.amount_req ?? total);
  const kodeUnik = d.kode_unik != null ? Number(d.kode_unik) : null;
  const totalBayar = Number(d.total_bayar ?? amountReq ?? total);
  const expiredIn = d.expired_in != null ? Number(d.expired_in) : null;

  await dbHelpers.insertPayment({
    invoice,
    amount_req: amountReq,
    kode_unik: kodeUnik,
    total_bayar: totalBayar,
    qr_image: d.qr_image || null,
    expired_in: expiredIn,
    status: 'waiting_payment',
    product_id: productId,
    qty,
    ref_id: refId,
    jid,
  });

  const lines = [
    `*Konfirmasi Pembayaran*`,
    ``,
    `Produk: *${product.name}*`,
    `Qty: ${qty}`,
    `Harga Satuan: ${formatRupiah(price)}`,
    `Total: *${formatRupiah(totalBayar)}*`,
    kodeUnik != null ? `Kode Unik: ${kodeUnik}` : '',
    `Invoice: \`${invoice}\``,
    expiredIn != null ? `Batas Waktu: ${expiredIn} detik` : '',
    ``,
    `Silakan bayar via QRIS di bawah ini. Setelah pembayaran sukses, order akan diproses otomatis.`,
  ]
    .filter(Boolean)
    .join('\n');

  await sock.sendMessage(jid, { text: lines });

  if (d.qr_image) {
    await sock.sendMessage(jid, { text: d.qr_image });
  } else if (d.qr_raw) {
    await sock.sendMessage(jid, { text: `QR Raw:\n${d.qr_raw}` });
  }

  startPollingPayment({
    sock,
    jid,
    invoice,
    totalAmount: totalBayar,
    product: { product_id: productId, name: product.name },
    qty,
    refId,
    onTimeout: () => {
      try {
        premku.cancelPay(invoice);
      } catch {
        // Abaikan error saat membatalkan.
      }
    },
  });
}
