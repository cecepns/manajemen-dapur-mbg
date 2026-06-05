-- Migration 006: Kolom last_login pada users (untuk KPI tingkat penggunaan aplikasi)
-- Jalankan setelah migration 005
-- Catatan: ADD COLUMN IF NOT EXISTS membutuhkan MySQL 8.0.12+ / MariaDB 10.0.2+

USE mbg_multi_dapur;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS last_login TIMESTAMP NULL AFTER status_aktif;
