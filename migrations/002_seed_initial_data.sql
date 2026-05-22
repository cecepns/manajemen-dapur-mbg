USE mbg_multi_dapur;

UPDATE roles SET name = 'Kepala SPPG' WHERE name = 'Manager';

INSERT IGNORE INTO roles (name) VALUES ('Keuangan'), ('Ahli gizi');

INSERT IGNORE INTO kitchens (id, nama_dapur, lokasi, penanggung_jawab) VALUES
  (1, 'Dapur Utama MBG', 'Jakarta', 'Koordinator Pusat');
