import { premku } from '../api/premku.js';
import { formatProduct } from '../utils/format.js';

export const name = 'products';
export const aliases = ['product', 'list', 'produk'];
export const description = 'Daftar produk beserta harga dan stok';
export const usage = 'products';

export async function run(sock, jid, quotedId) {
  try {
    const data = await premku.products();
    const list = data.products || data.data || data;
    if (!Array.isArray(list) || list.length === 0) {
      return sock.sendMessage(jid, { text: 'Tidak ada produk tersedia.' });
    }
    const lines = [`*Daftar Produk*`, ''];
    list.forEach((p, i) => lines.push(formatProduct(p, i + 1)));
    await sock.sendMessage(jid, { text: lines.join('\n') });
  } catch (err) {
    await sock.sendMessage(jid, { text: `Gagal mengambil produk:\n${err.message}` });
  }
}
