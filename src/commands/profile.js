import { premku, PremkuAPIError } from '../api/premku.js';
import { formatProfile } from '../utils/format.js';

export const name = 'profile';
export const aliases = ['p', 'saldo', 'me', 'akun'];
export const description = 'Cek profil akun, saldo, dan WhatsApp terdaftar';

export async function run(sock, jid, quotedId) {
  try {
    const data = await premku.profile();
    await sock.sendMessage(jid, { text: formatProfile(data) }, { quoted: quotedId ? { key: { id: quotedId, remoteJid: jid } } : undefined });
  } catch (err) {
    await sock.sendMessage(jid, { text: `Gagal mengambil profil:\n${err.message}` });
  }
}
