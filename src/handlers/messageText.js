export function getMessageText(msg) {
  const message = msg?.message;
  if (!message) return '';
  const type = message.messageType || message.type || Object.keys(message)[0];
  if (type === 'conversation') return message.conversation || '';
  const data = message[type];
  if (type === 'extendedTextMessage') return data?.text || '';
  if (data?.text) return data.text;
  return '';
}
