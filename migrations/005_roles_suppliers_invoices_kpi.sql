USE mbg_multi_dapur;

UPDATE roles SET name = 'Kepala SPPG' WHERE name = 'Manager';
INSERT IGNORE INTO roles (name) VALUES ('Keuangan'), ('Ahli gizi');

ALTER TABLE suppliers
  ADD COLUMN IF NOT EXISTS cp_penanggung_jawab VARCHAR(120) NULL AFTER nama_supplier,
  ADD COLUMN IF NOT EXISTS alamat TEXT NULL AFTER cp_penanggung_jawab,
  ADD COLUMN IF NOT EXISTS nama_barang VARCHAR(255) NULL AFTER alamat,
  ADD COLUMN IF NOT EXISTS jumlah_barang VARCHAR(100) NULL AFTER nama_barang,
  ADD COLUMN IF NOT EXISTS jadwal_pengiriman VARCHAR(255) NULL AFTER jumlah_barang,
  ADD COLUMN IF NOT EXISTS tanggal_akhir_kontrak DATE NULL AFTER jadwal_pengiriman;

UPDATE suppliers SET cp_penanggung_jawab = kontak WHERE cp_penanggung_jawab IS NULL AND kontak IS NOT NULL;

CREATE TABLE IF NOT EXISTS invoices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama_perusahaan VARCHAR(255),
  ditujukan_kepada VARCHAR(255),
  invoice_number VARCHAR(100),
  total_payment DECIMAL(14,2) DEFAULT 0,
  amount_paid DECIMAL(14,2) DEFAULT 0,
  keterangan_tambahan TEXT,
  status_invoice ENUM('draft','pending','paid','cancelled') DEFAULT 'pending',
  kitchen_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (kitchen_id) REFERENCES kitchens(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS invoice_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_id INT NOT NULL,
  item_name VARCHAR(255),
  quantity DECIMAL(10,2) DEFAULT 0,
  rate DECIMAL(14,2) DEFAULT 0,
  amount DECIMAL(14,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);
