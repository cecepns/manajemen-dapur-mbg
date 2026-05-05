# Manajemen Dapur MBG Multi-Dapur

Fullstack app dengan frontend dan backend terpisah.

## Stack
- Frontend: React + Vite (JSX), TailwindCSS, React Router, Lucide React, React Toastify, PWA (manifest + service worker)
- Backend: Node.js + Express + MySQL (`backend/server.js` satu file)
- Auth: JWT + bcrypt

## Struktur
- `frontend/`
- `backend/server.js`
- `backend/.env`
- `database.sql`

## Setup
1. Gunakan Node:
   - `nvm use v23.6.0`
2. Import DB:
   - `mysql -u root -p < database.sql`
3. Jalankan backend:
   - `cd backend`
   - `npm install`
   - `npm run dev`

## Migration
- Baseline migration ada di folder `migrations/`:
  - `001_create_initial_tables.sql`
  - `002_seed_initial_data.sql`
  - `003_create_menu_kitchens_table.sql`
- Jalankan berurutan:
  - `mysql -u root -p < migrations/001_create_initial_tables.sql`
  - `mysql -u root -p < migrations/002_seed_initial_data.sql`
  - `mysql -u root -p < migrations/003_create_menu_kitchens_table.sql`
- Aturan ke depan: setiap perubahan struktur tabel wajib dibuatkan file migration baru dengan nomor urut berikutnya (contoh `003_add_column_x.sql`).
4. Jalankan frontend:
   - `cd frontend`
   - `npm install`
   - `npm run dev`

## Default Login
- email: `admin@mbg.local`
- password: `admin123`

## Endpoint Utama
- `POST /auth/login`
- `GET /auth/me`
- `GET/POST/PUT/DELETE /users`
- `GET/POST/DELETE /kitchens`
- `GET/POST /menus`
- `GET/POST /suppliers`
- `GET/POST /finance`
- `POST /tracking/update-location`
- `GET /tracking/history`
- `GET /courier/deliveries`
- `PUT /courier/deliveries/:id/status`
# manajemen-dapur-mbg
