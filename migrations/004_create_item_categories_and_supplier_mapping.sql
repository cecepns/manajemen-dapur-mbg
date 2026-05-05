USE mbg_multi_dapur;

CREATE TABLE IF NOT EXISTS item_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama_barang VARCHAR(120) NOT NULL,
  kitchen_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_item_category_name_kitchen (nama_barang, kitchen_id),
  FOREIGN KEY (kitchen_id) REFERENCES kitchens(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS supplier_item_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  supplier_id INT NOT NULL,
  item_category_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_supplier_item_category (supplier_id, item_category_id),
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE,
  FOREIGN KEY (item_category_id) REFERENCES item_categories(id) ON DELETE CASCADE
);

-- Pastikan kolom lama ada dulu supaya query backfill tidak gagal di DB lama.
ALTER TABLE suppliers
ADD COLUMN IF NOT EXISTS jenis_barang VARCHAR(255) NULL AFTER nama_supplier;

-- Backfill minimal dari field lama `jenis_barang` (jika ada data).
INSERT IGNORE INTO item_categories (nama_barang, kitchen_id)
SELECT TRIM(jenis_barang), kitchen_id
FROM suppliers
WHERE jenis_barang IS NOT NULL
  AND TRIM(jenis_barang) <> '';

INSERT IGNORE INTO supplier_item_categories (supplier_id, item_category_id)
SELECT s.id, ic.id
FROM suppliers s
JOIN item_categories ic
  ON ic.nama_barang = TRIM(s.jenis_barang)
 AND ic.kitchen_id = s.kitchen_id
WHERE s.jenis_barang IS NOT NULL
  AND TRIM(s.jenis_barang) <> '';
