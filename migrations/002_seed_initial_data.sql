USE mbg_multi_dapur;

INSERT IGNORE INTO roles (id, name) VALUES
  (1, 'Admin'),
  (2, 'Manager'),
  (3, 'Staff'),
  (4, 'Kurir');

INSERT IGNORE INTO kitchens (id, nama_dapur, lokasi, penanggung_jawab) VALUES
  (1, 'Dapur Utama MBG', 'Jakarta', 'Koordinator Pusat');
