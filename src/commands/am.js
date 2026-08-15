import { premku } from '../api/premku.js';
import { isValidEmail, isValidUrl, randomRefId } from '../utils/format.js';

export const name = 'am';
export const aliases = ['alightmotion', 'alight', 'amotion'];
export const description = 'Layanan Alight Motion (bulk/single)';
export const usage = 'am <buybulk|buysingle|verify|cancel> ...';

export async function run(sock, jid, args, quotedId) {
  const action = (args[0] || '').toLowerCase();
  const rest = args.slice(1);

  switch (action) {
    case 'buybulk':
    case 'bulk': {
      const qty = rest[0] ? parseInt(rest[0], 10) : 1;
      if (Number.isNaN(qty) || qty < 1 || qty > 200) {
        return sock.sendMessage(jid, { text: `Qty harus 1-200.\nContoh: /am buybulk 10` });
      }
      const refId = rest[1] || randomRefId('AM');
      try {
        const data = await premku.amBuyBulk(qty, refId);
        const d = data.data || data;
        const lines = [
          `*Alight Motion Bulk*`,
          ``,
          `Qty: ${qty}`,
          `Invoice: \`${d.invoice || '-'}\``,
          `Status: ${d.status || data.message || 'OK'}`,
          `Ref ID: \`${refId}\``,
        ].join('\n');
        await sock.sendMessage(jid, { text: lines });
      } catch (err) {
        await sock.sendMessage(jid, { text: `Buy bulk gagal:\n${err.message}` });
      }
      break;
    }

    case 'buysingle':
    case 'single': {
      const email = rest[0];
      if (!email || !isValidEmail(email)) {
        return sock.sendMessage(jid, { text: `Email tidak valid.\nContoh: /am buysingle user@mail.com` });
      }
      try {
        const data = await premku.amBuySingle(email);
        const d = data.data || data;
        const lines = [
          `*Alight Motion Single*`,
          ``,
          `Email: ${email}`,
          `Invoice: \`${d.invoice || '-'}\``,
          `Status: ${d.status || data.message || 'OK'}`,
          ``,
          `Kirim link verifikasi saat customer menerimanya:\n/am verify <invoice> <email> <link>`,
        ].join('\n');
        await sock.sendMessage(jid, { text: lines });
      } catch (err) {
        await sock.sendMessage(jid, { text: `Buy single gagal:\n${err.message}` });
      }
      break;
    }

    case 'verify': {
      const [invoice, email, link] = rest;
      if (!invoice || !email || !link || !isValidEmail(email) || !isValidUrl(link)) {
        return sock.sendMessage(jid, {
          text: `Format: /am verify <invoice> <email> <link>\nContoh: /am verify INV-123 user@mail.com https://alight.link/abc`,
        });
      }
      try {
        const data = await premku.amVerifySingle(invoice, email, link);
        const lines = [
          `*Verifikasi Alight Motion*`,
          ``,
          `Invoice: \`${invoice}\``,
          `Status: ${data.message || 'Berhasil diverifikasi'}`,
        ].join('\n');
        await sock.sendMessage(jid, { text: lines });
      } catch (err) {
        await sock.sendMessage(jid, { text: `Verifikasi gagal:\n${err.message}` });
      }
      break;
    }

    case 'cancel': {
      const invoice = rest[0];
      if (!invoice) {
        return sock.sendMessage(jid, { text: `Format: /am cancel <invoice>` });
      }
      try {
        const data = await premku.amCancelSingle(invoice);
        const lines = [
          `*Batalkan Alight Motion*`,
          ``,
          `Invoice: \`${invoice}\``,
          `Status: ${data.message || 'Request dibatalkan'}`,
        ].join('\n');
        await sock.sendMessage(jid, { text: lines });
      } catch (err) {
        await sock.sendMessage(jid, { text: `Pembatalan gagal:\n${err.message}` });
      }
      break;
    }

    default: {
      const help = [
        `*Perintah Alight Motion*`,
        ``,
        `• /am buybulk <qty 1-200> [ref_id]`,
        `• /am buysingle <email>`,
        `• /am verify <invoice> <email> <link>`,
        `• /am cancel <invoice>`,
      ].join('\n');
      await sock.sendMessage(jid, { text: help });
    }
  }
}
