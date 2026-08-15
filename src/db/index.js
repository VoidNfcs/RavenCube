import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dbHelpers = {
  async insertPayment(data) {
    return prisma.payment.create({
      data: {
        invoice: data.invoice,
        amountReq: data.amount_req ?? null,
        kodeUnik: data.kode_unik ?? null,
        totalBayar: data.total_bayar ?? null,
        qrImage: data.qr_image ?? null,
        expiredIn: data.expired_in ?? null,
        status: data.status ?? 'waiting_payment',
        productId: data.product_id ?? null,
        qty: data.qty ?? null,
        refId: data.ref_id ?? null,
        jid: data.jid ?? null,
      },
    });
  },

  async getPayment(invoice) {
    return prisma.payment.findUnique({ where: { invoice } });
  },

  async updatePaymentStatus(invoice, status) {
    return prisma.payment.update({ where: { invoice }, data: { status } });
  },

  async insertOrder(data) {
    return prisma.order.create({
      data: {
        invoice: data.invoice,
        refId: data.ref_id ?? null,
        productId: data.product_id ?? null,
        qty: data.qty ?? null,
        price: data.price ?? null,
        status: data.status ?? 'pending',
        paymentInvoice: data.payment_invoice ?? null,
        jid: data.jid ?? null,
      },
    });
  },

  async getOrder(invoiceOrRef) {
    return (
      (await prisma.order.findUnique({ where: { invoice: invoiceOrRef } })) ||
      (await prisma.order.findFirst({ where: { refId: invoiceOrRef } }))
    );
  },

  async updateOrderStatus(invoice, status) {
    return prisma.order.update({ where: { invoice }, data: { status } });
  },

  async listOrders(limit = 10) {
    return prisma.order.findMany({ orderBy: { id: 'desc' }, take: limit });
  },

  async listPendingPayments() {
    return prisma.payment.findMany({ where: { status: 'waiting_payment' } });
  },
};

export { prisma };
export default prisma;
