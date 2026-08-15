-- CreateTable
CREATE TABLE "payments" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "invoice" TEXT NOT NULL,
    "amount_req" INTEGER,
    "kode_unik" INTEGER,
    "total_bayar" INTEGER,
    "qr_image" TEXT,
    "expired_in" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'waiting_payment',
    "product_id" TEXT,
    "qty" INTEGER,
    "ref_id" TEXT,
    "jid" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "orders" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "invoice" TEXT NOT NULL,
    "ref_id" TEXT,
    "product_id" TEXT,
    "qty" INTEGER,
    "price" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "payment_invoice" TEXT,
    "jid" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "orders_payment_invoice_fkey" FOREIGN KEY ("payment_invoice") REFERENCES "payments" ("invoice") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "payments_invoice_key" ON "payments"("invoice");

-- CreateIndex
CREATE UNIQUE INDEX "orders_invoice_key" ON "orders"("invoice");

-- CreateIndex
CREATE UNIQUE INDEX "orders_payment_invoice_key" ON "orders"("payment_invoice");
