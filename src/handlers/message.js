import { config, isAllowed } from '../config.js';
import { findCommand } from '../commands/index.js';
import { getMessageText } from './messageText.js';
import { parseArgs } from '../utils/format.js';

export async function onMessage(sock, msg, type) {
  if (!msg || msg.key?.fromMe) return;
  if (type === 'notify' && !msg.message) return;

  const jid = msg.key?.remoteJid;
  if (!jid) return;
  if (!isAllowed(jid)) return;

  const text = getMessageText(msg);
  if (!text.startsWith(config.prefix)) return;

  const parts = parseArgs(text.slice(config.prefix.length));
  const [trigger, ...args] = parts;
  if (!trigger) return;

  const cmd = await findCommand(trigger);
  if (!cmd) {
    return sock.sendMessage(jid, {
      text: `Perintah \`${config.prefix}${trigger}\` tidak dikenal. Ketik ${config.prefix}help untuk bantuan.`,
    });
  }

  const quotedId = msg.key.id;
  try {
    await cmd.run(sock, jid, args, quotedId);
  } catch (err) {
    console.error('Command error:', err);
    await sock.sendMessage(jid, { text: `Terjadi kesalahan internal: ${err.message}` });
  }
}
