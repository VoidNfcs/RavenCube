import { config } from '../config.js';

class PremkuAPIError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'PremkuAPIError';
    this.status = status;
    this.data = data;
  }
}

async function request(endpoint, params = {}) {
  const body = { api_key: config.apiKey, ...params };
  let res;
  try {
    res = await fetch(`${config.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (err) {
    throw new PremkuAPIError(`Gagal terhubung ke server (${err.message})`, 0, null);
  }

  let json = null;
  try {
    json = await res.json();
  } catch {
    throw new PremkuAPIError(`Respon tidak valid dari server (HTTP ${res.status})`, res.status, null);
  }

  if (!res.ok || json.success === false) {
    throw new PremkuAPIError(
      json.message || `Terjadi kesalahan (HTTP ${res.status})`,
      res.status,
      json
    );
  }
  return json;
}

export const premku = {
  profile() {
    return request('/profile');
  },

  products() {
    return request('/products');
  },

  stock(productId) {
    return request('/stock', { product_id: productId });
  },

  order(productId, qty, refId) {
    return request('/order', { product_id: productId, qty, ref_id: refId });
  },

  status(invoice) {
    return request('/status', { invoice });
  },

  amBuyBulk(qty, refId) {
    return request('/am', { action: 'buy_bulk', qty, ...(refId ? { ref_id: refId } : {}) });
  },

  amBuySingle(email) {
    return request('/am', { action: 'buy_single', email });
  },

  amVerifySingle(invoice, email, link) {
    return request('/am', { action: 'verify_single', invoice, email, link });
  },

  amCancelSingle(invoice) {
    return request('/am', { action: 'cancel_single', invoice });
  },

  pay(amount, refId) {
    return request('/pay', { amount, ...(refId ? { ref_id: refId } : {}) });
  },

  payStatus(invoice) {
    return request('/pay_status', { invoice });
  },

  cancelPay(invoice) {
    return request('/cancel_pay', { invoice });
  },
};

export { PremkuAPIError };
