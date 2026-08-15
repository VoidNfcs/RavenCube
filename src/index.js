import { config } from './config.js';
import { startWhatsApp } from './whatsapp/client.js';

if (!config.apiKey) {
  console.error('PREMKU_API_KEY belum diatur. Salin .env.example ke .env dan isi API key Anda.');
  process.exit(1);
}

console.log(`Starting ${config.botName}...`);
startWhatsApp();
