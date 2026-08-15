import pino from 'pino';
import qrcodeTerminal from 'qrcode-terminal';
import {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
} from '@whiskeysockets/baileys';
import { config } from '../config.js';
import { onMessage } from '../handlers/message.js';

let sock = null;

export function getSocket() {
  return sock;
}

export async function startWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState(config.sessionDir);
  const { version } = await fetchLatestBaileysVersion();

  const logger = pino({
    level: process.env.LOG_LEVEL || 'silent',
  });

  sock = makeWASocket({
    version,
    logger,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    browser: ['Premku Bot', 'Chrome', '1.0.0'],
    markOnlineOnConnect: true,
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) {
      console.log('Scan QR di bawah ini menggunakan WhatsApp Anda (Linked Devices).');
      qrcodeTerminal.generate(qr, { small: true });
    }
    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      console.log(
        `Koneksi terputus (${statusCode}). ${shouldReconnect ? 'Mencoba reconnect...' : 'Logout.'}`
      );
      if (shouldReconnect) {
        startWhatsApp();
      }
    } else if (connection === 'open') {
      console.log('WhatsApp terhubung!');
    }
  });

  sock.ev.on('messages.upsert', async (messages) => {
    for (const msg of messages.messages) {
      await onMessage(sock, msg, messages.type);
    }
  });

  return sock;
}
