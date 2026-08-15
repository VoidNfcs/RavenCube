import { premku } from '../api/premku.js';
import { formatNumber } from '../utils/format.js';

export const name = 'stock';
export const aliases = ['stok'];
export const description = 'Cek stok produk secara realtime';
export const usage = 'stock <product_id>';

export async function run(sock, jid, args, quotedId) {
  const productId = args[0];
  if (!productId) {
    return sock.sendMessage(jid, { text: `Format: ${usage}\nContoh: /stock 12345` });
  }
  try {
    const data = await premku.stock(productId);
    const info = data.data || data;
    const stock = info.stock != null ? info.stock : data.stock;
    await sock.sendMessage(jid, {
      text: `*Stok Produk ${productId}*\n\n${stock != null ? `Stok: *${formatNumber(stock)}*` : 'Data stok tidak tersedia.'}\n${data.message ? `Info: ${data.message}` : ''}`,
    });
  } catch (err) {
    await sock.sendMessage(jid, { text: `Gagal cek stok:\n${err.message}` });
  }
}
