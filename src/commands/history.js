import { dbHelpers } from '../db/index.js';
import { formatRupiah, formatTime } from '../utils/format.js';

export const name = 'history';
export const aliases = ['riwayat', 'histori'];
export const description = 'Riwayat order & pembayaran lokal';
export const usage = 'history';

export async function run(sock, jid, args, quotedId) {
  const orders = await dbHelpers.listOrders(5);
  const lines = [`*Riwayat Order Terbaru*`, ''];

  if (orders.length === 0) {
    lines.push('Belum ada order.');
  } else {
    orders.forEach((o, i) => {
      lines.push(
        `${i + 1}. Invoice: \`${o.invoice}\``,
        `   Produk: ${o.productId} x${o.qty}`,
        `   Total: ${formatRupiah(o.price)}`,
        `   Status: ${o.status}`,
        `   Waktu: ${formatTime(o.createdAt)}`,
        ''
      );
    });
  }

  lines.push('Gunakan /paystatus <invoice> untuk cek pembayaran tertentu.');
  await sock.sendMessage(jid, { text: lines.join('\n').trim() });
}
