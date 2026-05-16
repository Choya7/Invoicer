-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "issueDate" DATETIME NOT NULL,
    "clientName" TEXT NOT NULL,
    "supplier" TEXT NOT NULL,
    "footer" TEXT NOT NULL,
    "grand_total" REAL NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "invoice_items" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "invoice_id" TEXT NOT NULL,
    "date" TEXT,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "spec" TEXT,
    "qty" REAL,
    "price" REAL,
    "supply" REAL,
    "tax" REAL,
    "note" TEXT,
    CONSTRAINT "invoice_items_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "clients" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "biz_no" TEXT,
    "owner" TEXT,
    "memo" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "item_master" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "spec" TEXT,
    "price" REAL
);

-- CreateIndex
CREATE UNIQUE INDEX "clients_name_key" ON "clients"("name");

-- CreateIndex
CREATE UNIQUE INDEX "item_master_code_key" ON "item_master"("code");
