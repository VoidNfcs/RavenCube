import { config } from '../config.js';
import { loadCommands } from './index.js';

export const name = 'help';
export const aliases = ['menu', 'bantuan', 'halo', 'hi'];
export const description = 'Tampilkan daftar perintah';

export async function run(sock, jid, quotedId) {
  const commands = await loadCommands();
  const lines = [
    `*${config.botName}*`,
    `Bot jualan otomatis via premku.com API.`,
    ``,
    `*Perintah Tersedia:*`,
  ];
  for (const cmd of commands) {
    if (cmd.name === 'help') continue;
    const usage = cmd.usage ? `\`${config.prefix}${cmd.usage}\`` : `\`${config.prefix}${cmd.name}\``;
    lines.push(`${usage}\n  ${cmd.description}`);
  }
  lines.push('', `Prefix: ${config.prefix}`, 'Cek profil: /profile');
  await sock.sendMessage(jid, { text: lines.join('\n') });
}
