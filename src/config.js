import 'dotenv/config';

export const config = {
  apiKey: process.env.PREMKU_API_KEY || '',
  baseUrl: (process.env.PREMKU_BASE_URL || 'https://premku.com/api').replace(/\/+$/, ''),
  botName: process.env.BOT_NAME || 'Premku Bot',
  prefix: process.env.PREFIX || '/',
  allowedNumbers: (process.env.ALLOWED_NUMBERS || '')
    .split(',')
    .map((n) => n.trim())
    .filter(Boolean)
    .map((n) => n.replace(/[^0-9]/g, '')),
  sessionDir: process.env.SESSION_DIR || './session',
  databaseUrl: process.env.DATABASE_URL || 'file:./dev.db',
  pollIntervalMs: Number(process.env.POLL_INTERVAL_MS || 5000),
  payTimeoutSeconds: Number(process.env.PAY_TIMEOUT_SECONDS || 0),
};

export function isAllowed(jid) {
  if (config.allowedNumbers.length === 0) return true;
  const number = (jid || '').replace(/[^0-9]/g, '');
  return config.allowedNumbers.some((n) => number === n);
}
