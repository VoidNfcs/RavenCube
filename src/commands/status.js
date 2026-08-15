import { premku } from '../api/premku.js';
import { dbHelpers } from '../db/index.js';
import { formatStatus } from '../utils/format.js';

export const name = 'status';
export const aliases = ['cek', 'invoice', 'cekinvoice'];
export const description = 'Cek status order atau akun';
export const usage = 'status <invoice>';

export async function run(sock, jid, args, quotedId) {
  const invoice = args[0];
  if (!invoice) {
    return sock.sendMessage(jid, { text: `Format: ${usage}\nContoh: /status INV-123` });
  }
  try {
    const data = await premku.status(invoice);
    const order = data.order || data;
    if (order.status) {
      await dbHelpers.updateOrderStatus(order.invoice || invoice, order.status);
    }
    await sock.sendMessage(jid, { text: formatStatus(data) });
  } catch (err) {
    await sock.sendMessage(jid, { text: `Cek status gagal:\n${err.message}` });
  }
}
