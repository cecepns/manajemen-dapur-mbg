const express = require('express')
const mysql = require('mysql2/promise')
const dotenv = require('dotenv')
const cors = require('cors')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

dotenv.config()
const app = express()
app.use(cors())
app.use(express.json())

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
})

const permissionMap = {
  admin: ['dashboard', 'menu', 'supplier', 'keuangan', 'tracking', 'user management', 'kitchen', 'kpi', 'courier'],
  'kepala sppg': ['dashboard', 'menu', 'supplier', 'keuangan', 'tracking', 'user management', 'kitchen', 'kpi', 'courier'],
  keuangan: ['keuangan'],
  'ahli gizi': ['kitchen', 'menu', 'supplier'],
  staff: ['courier'],
  kurir: ['courier', 'tracking'],
}

const pagination = (req) => {
  const page = Math.max(1, Number(req.query.page) || 1)
  const limit = Math.min(10, Math.max(1, Number(req.query.limit) || 10))
  const offset = (page - 1) * limit
  return { page, limit, offset }
}

const paged = (res, data, meta) => res.json({ data, meta })
const signToken = (user) => jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '1d' })
const normalizeRole = (roleName) => String(roleName || '').toLowerCase().trim()
const isAdmin = (user) => normalizeRole(user?.role_name) === 'admin'
const isFullAccess = (user) => ['admin', 'kepala sppg'].includes(normalizeRole(user?.role_name))
const hasPermission = (user, permission) => {
  const role = normalizeRole(user?.role_name)
  if (isFullAccess(user)) return true
  return (permissionMap[role] || []).includes(permission)
}

const authMiddleware = (req, res, next) => {
  const auth = req.headers.authorization
  if (!auth) return res.status(401).json({ message: 'Unauthorized' })
  const token = auth.split(' ')[1]
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ message: 'Token tidak valid' })
  }
}

const permissionMiddleware = (permission) => (req, res, next) => {
  if (hasPermission(req.user, permission)) return next()
  return res.status(403).json({ message: 'Akses ditolak' })
}

async function initDatabase() {
  await pool.query(`CREATE TABLE IF NOT EXISTS roles (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(50) UNIQUE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)`)
  await pool.query(`CREATE TABLE IF NOT EXISTS kitchens (id INT AUTO_INCREMENT PRIMARY KEY, nama_dapur VARCHAR(120), lokasi VARCHAR(255), penanggung_jawab VARCHAR(120), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)`)
  await pool.query(`CREATE TABLE IF NOT EXISTS users (id INT AUTO_INCREMENT PRIMARY KEY, nama VARCHAR(120), email VARCHAR(120) UNIQUE, password VARCHAR(255), role_id INT, kitchen_id INT NULL, status_aktif TINYINT DEFAULT 1, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, FOREIGN KEY (role_id) REFERENCES roles(id), FOREIGN KEY (kitchen_id) REFERENCES kitchens(id) ON DELETE SET NULL)`)
  await pool.query(`CREATE TABLE IF NOT EXISTS menus (id INT AUTO_INCREMENT PRIMARY KEY, hari VARCHAR(50), nama_menu VARCHAR(120), deskripsi TEXT, estimasi_porsi INT, kitchen_id INT NULL, waktu_persiapan INT DEFAULT 0, waktu_memasak INT DEFAULT 0, waktu_distribusi INT DEFAULT 0, total_waktu INT DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, FOREIGN KEY (kitchen_id) REFERENCES kitchens(id) ON DELETE SET NULL)`)
  await pool.query(`CREATE TABLE IF NOT EXISTS menu_kitchens (id INT AUTO_INCREMENT PRIMARY KEY, menu_id INT NOT NULL, kitchen_id INT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, UNIQUE KEY uniq_menu_kitchen (menu_id, kitchen_id), FOREIGN KEY (menu_id) REFERENCES menus(id) ON DELETE CASCADE, FOREIGN KEY (kitchen_id) REFERENCES kitchens(id) ON DELETE CASCADE)`)
  await pool.query(`INSERT IGNORE INTO menu_kitchens (menu_id, kitchen_id) SELECT id, kitchen_id FROM menus WHERE kitchen_id IS NOT NULL`)
  await pool.query(`CREATE TABLE IF NOT EXISTS suppliers (id INT AUTO_INCREMENT PRIMARY KEY, nama_supplier VARCHAR(120), cp_penanggung_jawab VARCHAR(120) NULL, alamat TEXT NULL, nama_barang VARCHAR(255) NULL, jumlah_barang VARCHAR(100) NULL, jadwal_pengiriman VARCHAR(255) NULL, tanggal_akhir_kontrak DATE NULL, kontak VARCHAR(120), kitchen_id INT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, FOREIGN KEY (kitchen_id) REFERENCES kitchens(id) ON DELETE CASCADE)`)
  await pool.query('ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS cp_penanggung_jawab VARCHAR(120) NULL AFTER nama_supplier')
  await pool.query('ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS alamat TEXT NULL AFTER cp_penanggung_jawab')
  await pool.query('ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS nama_barang VARCHAR(255) NULL AFTER alamat')
  await pool.query('ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS jumlah_barang VARCHAR(100) NULL AFTER nama_barang')
  await pool.query('ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS jadwal_pengiriman VARCHAR(255) NULL AFTER jumlah_barang')
  await pool.query('ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS tanggal_akhir_kontrak DATE NULL AFTER jadwal_pengiriman')
  await pool.query('UPDATE suppliers SET cp_penanggung_jawab = kontak WHERE cp_penanggung_jawab IS NULL AND kontak IS NOT NULL')
  await pool.query(`CREATE TABLE IF NOT EXISTS item_categories (id INT AUTO_INCREMENT PRIMARY KEY, nama_barang VARCHAR(120) NOT NULL, kitchen_id INT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, UNIQUE KEY uniq_item_category_name_kitchen (nama_barang, kitchen_id), FOREIGN KEY (kitchen_id) REFERENCES kitchens(id) ON DELETE CASCADE)`)
  await pool.query(`CREATE TABLE IF NOT EXISTS supplier_item_categories (id INT AUTO_INCREMENT PRIMARY KEY, supplier_id INT NOT NULL, item_category_id INT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, UNIQUE KEY uniq_supplier_item_category (supplier_id, item_category_id), FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE, FOREIGN KEY (item_category_id) REFERENCES item_categories(id) ON DELETE CASCADE)`)
  await pool.query(`CREATE TABLE IF NOT EXISTS finance (id INT AUTO_INCREMENT PRIMARY KEY, jenis ENUM('pemasukan','pengeluaran'), nominal DECIMAL(14,2), keterangan VARCHAR(255), tanggal DATE, kitchen_id INT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, FOREIGN KEY (kitchen_id) REFERENCES kitchens(id) ON DELETE CASCADE)`)
  await pool.query(`CREATE TABLE IF NOT EXISTS invoices (id INT AUTO_INCREMENT PRIMARY KEY, nama_perusahaan VARCHAR(255), ditujukan_kepada VARCHAR(255), invoice_number VARCHAR(100), total_payment DECIMAL(14,2) DEFAULT 0, amount_paid DECIMAL(14,2) DEFAULT 0, keterangan_tambahan TEXT, status_invoice ENUM('draft','pending','paid','cancelled') DEFAULT 'pending', kitchen_id INT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, FOREIGN KEY (kitchen_id) REFERENCES kitchens(id) ON DELETE CASCADE)`)
  await pool.query(`CREATE TABLE IF NOT EXISTS invoice_items (id INT AUTO_INCREMENT PRIMARY KEY, invoice_id INT NOT NULL, item_name VARCHAR(255), quantity DECIMAL(10,2) DEFAULT 0, rate DECIMAL(14,2) DEFAULT 0, amount DECIMAL(14,2) DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE)`)
  await pool.query(`CREATE TABLE IF NOT EXISTS gps_tracking (id INT AUTO_INCREMENT PRIMARY KEY, latitude DECIMAL(10,7), longitude DECIMAL(10,7), timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, user_id INT, kitchen_id INT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id), FOREIGN KEY (kitchen_id) REFERENCES kitchens(id))`)
  await pool.query(`CREATE TABLE IF NOT EXISTS deliveries (id INT AUTO_INCREMENT PRIMARY KEY, destination VARCHAR(255), status ENUM('pending','on delivery','delivered') DEFAULT 'pending', courier_id INT, kitchen_id INT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, FOREIGN KEY (courier_id) REFERENCES users(id), FOREIGN KEY (kitchen_id) REFERENCES kitchens(id) ON DELETE CASCADE)`)

  for (const role of ['Admin', 'Kepala SPPG', 'Staff', 'Kurir', 'Keuangan', 'Ahli gizi']) {
    await pool.query('INSERT IGNORE INTO roles (name) VALUES (?)', [role])
  }
  await pool.query("UPDATE roles SET name='Kepala SPPG' WHERE name='Manager'")
  await pool.query("INSERT IGNORE INTO kitchens (id, nama_dapur, lokasi, penanggung_jawab) VALUES (1,'Dapur Utama MBG','Jakarta','Koordinator Pusat')")
  const [existingAdmin] = await pool.query("SELECT id FROM users WHERE email='admin@mbg.local'")
  if (!existingAdmin.length) {
    const password = await bcrypt.hash('admin123', 10)
    await pool.query("INSERT INTO users (nama, email, password, role_id, kitchen_id, status_aktif) VALUES ('Admin MBG','admin@mbg.local',?,1,1,1)", [password])
  }
}

app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body
    const [rows] = await pool.query(`SELECT u.id,u.nama,u.email,u.password,u.role_id,u.kitchen_id,r.name role_name FROM users u JOIN roles r ON r.id=u.role_id WHERE u.email=? AND u.status_aktif=1`, [email])
    if (!rows.length) return res.status(401).json({ message: 'Email tidak ditemukan' })
    const valid = await bcrypt.compare(password, rows[0].password)
    if (!valid) return res.status(401).json({ message: 'Password salah' })
    const user = { id: rows[0].id, nama: rows[0].nama, email, role_id: rows[0].role_id, role_name: rows[0].role_name, kitchen_id: rows[0].kitchen_id }
    res.json({ token: signToken(user), user })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

app.get('/auth/me', authMiddleware, (req, res) => res.json({ data: req.user }))
app.get('/dashboard', authMiddleware, permissionMiddleware('dashboard'), async (req, res) => {
  try {
    const kitchenFilter = isFullAccess(req.user) ? '' : 'WHERE kitchen_id=?'
    const params = isFullAccess(req.user) ? [] : [req.user.kitchen_id]
    const [[k]] = await pool.query(`SELECT COUNT(*) total_kitchens FROM kitchens ${isFullAccess(req.user) ? '' : 'WHERE id=?'}`, params)
    const [[u]] = await pool.query(`SELECT COUNT(*) total_users FROM users ${kitchenFilter}`, params)
    const [[c]] = await pool.query(`SELECT COUNT(*) total_couriers FROM users u JOIN roles r ON r.id=u.role_id WHERE r.name='Kurir' ${isFullAccess(req.user) ? '' : 'AND u.kitchen_id=?'}`, params)
    const [[f]] = await pool.query(`SELECT COALESCE(SUM(nominal),0) total_expense FROM finance WHERE jenis='pengeluaran' ${isFullAccess(req.user) ? '' : 'AND kitchen_id=?'}`, params)
    res.json({ data: { ...k, ...u, ...c, ...f } })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

app.get('/roles', authMiddleware, permissionMiddleware('user management'), async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, name FROM roles ORDER BY id ASC')
    res.json({ data: rows })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

app.get('/users', authMiddleware, permissionMiddleware('user management'), async (req, res) => {
  try {
    const { page, limit, offset } = pagination(req)
    const where = isFullAccess(req.user) ? '' : 'WHERE u.kitchen_id=?'
    const params = isFullAccess(req.user) ? [limit, offset] : [req.user.kitchen_id, limit, offset]
    const [rows] = await pool.query(`SELECT u.id,u.nama,u.email,u.role_id,u.status_aktif,u.kitchen_id,k.nama_dapur kitchen_name,r.name role_name FROM users u LEFT JOIN kitchens k ON k.id=u.kitchen_id JOIN roles r ON r.id=u.role_id ${where} ORDER BY u.id DESC LIMIT ? OFFSET ?`, params)
    const [countRows] = await pool.query(`SELECT COUNT(*) total FROM users u ${isFullAccess(req.user) ? '' : 'WHERE u.kitchen_id=?'}`, isFullAccess(req.user) ? [] : [req.user.kitchen_id])
    paged(res, rows, { page, limit, total: countRows[0].total })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

app.post('/users', authMiddleware, permissionMiddleware('user management'), async (req, res) => {
  try {
    const { nama, email, password, role_id, kitchen_id, status_aktif } = req.body
    const hash = await bcrypt.hash(password, 10)
    const resolvedKitchen = isFullAccess(req.user) ? kitchen_id : req.user.kitchen_id
    await pool.query('INSERT INTO users (nama,email,password,role_id,kitchen_id,status_aktif) VALUES (?,?,?,?,?,?)', [nama, email, hash, role_id, resolvedKitchen, status_aktif ?? 1])
    res.status(201).json({ message: 'User dibuat' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

app.put('/users/:id', authMiddleware, permissionMiddleware('user management'), async (req, res) => {
  try {
    const { nama, email, role_id, kitchen_id, status_aktif, password } = req.body
    const params = [nama, email, role_id, isFullAccess(req.user) ? kitchen_id : req.user.kitchen_id, status_aktif]
    let sql = 'UPDATE users SET nama=?, email=?, role_id=?, kitchen_id=?, status_aktif=?'
    if (password && String(password).trim().length > 0) {
      const hash = await bcrypt.hash(password, 10)
      sql += ', password=?'
      params.push(hash)
    }
    sql += ' WHERE id=?'
    params.push(req.params.id)
    await pool.query(sql, params)
    res.json({ message: 'User diupdate' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

app.delete('/users/:id', authMiddleware, permissionMiddleware('user management'), async (req, res) => {
  try {
    const userId = req.params.id
    await pool.query('DELETE FROM gps_tracking WHERE user_id=?', [userId])
    await pool.query('DELETE FROM deliveries WHERE courier_id=?', [userId])
    await pool.query('DELETE FROM users WHERE id=?', [userId])
    res.json({ message: 'User dihapus' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

async function paginatedEntity(req, res, table, permission, join = '', select = '*') {
  if (!hasPermission(req.user, permission)) return res.status(403).json({ message: 'Akses ditolak' })
  const { page, limit, offset } = pagination(req)
  const where = isFullAccess(req.user) ? '' : `WHERE ${table}.kitchen_id=?`
  const params = isFullAccess(req.user) ? [limit, offset] : [req.user.kitchen_id, limit, offset]
  const [rows] = await pool.query(`SELECT ${select} FROM ${table} ${join} ${where} ORDER BY ${table}.id DESC LIMIT ? OFFSET ?`, params)
  const [countRows] = await pool.query(`SELECT COUNT(*) total FROM ${table} ${isFullAccess(req.user) ? '' : 'WHERE kitchen_id=?'}`, isFullAccess(req.user) ? [] : [req.user.kitchen_id])
  return paged(res, rows, { page, limit, total: countRows[0].total })
}

const normalizeIds = (value) => (Array.isArray(value) ? value.map(Number).filter(Boolean) : [])

app.get('/kitchens', authMiddleware, async (req, res) => {
  try {
    if (!hasPermission(req.user, 'kitchen') && !hasPermission(req.user, 'dashboard')) {
      return res.status(403).json({ message: 'Akses ditolak' })
    }
    if (isFullAccess(req.user)) return paginatedEntity(req, res, 'kitchens', 'kitchen')
    const [rows] = await pool.query('SELECT * FROM kitchens WHERE id=?', [req.user.kitchen_id])
    return paged(res, rows, { page: 1, limit: 10, total: rows.length })
  } catch (error) { res.status(500).json({ message: error.message }) }
})
app.post('/kitchens', authMiddleware, async (req, res) => {
  try {
    if (!isFullAccess(req.user)) return res.status(403).json({ message: 'Hanya admin atau kepala SPPG' })
    const { nama_dapur, lokasi, penanggung_jawab } = req.body
    await pool.query('INSERT INTO kitchens (nama_dapur,lokasi,penanggung_jawab) VALUES (?,?,?)', [nama_dapur, lokasi, penanggung_jawab])
    res.status(201).json({ message: 'Dapur dibuat' })
  } catch (error) { res.status(500).json({ message: error.message }) }
})

app.get('/item-categories', authMiddleware, permissionMiddleware('supplier'), async (req, res) => {
  try {
    const { page, limit, offset } = pagination(req)
    const where = isFullAccess(req.user) ? '' : 'WHERE ic.kitchen_id=?'
    const params = isFullAccess(req.user) ? [limit, offset] : [req.user.kitchen_id, limit, offset]
    const [rows] = await pool.query(`SELECT ic.*, k.nama_dapur kitchen_name FROM item_categories ic LEFT JOIN kitchens k ON k.id=ic.kitchen_id ${where} ORDER BY ic.id DESC LIMIT ? OFFSET ?`, params)
    const [countRows] = await pool.query(`SELECT COUNT(*) total FROM item_categories ${isFullAccess(req.user) ? '' : 'WHERE kitchen_id=?'}`, isFullAccess(req.user) ? [] : [req.user.kitchen_id])
    paged(res, rows, { page, limit, total: countRows[0].total })
  } catch (error) { res.status(500).json({ message: error.message }) }
})
app.post('/item-categories', authMiddleware, permissionMiddleware('supplier'), async (req, res) => {
  try {
    const { nama_barang, kitchen_id } = req.body
    await pool.query('INSERT INTO item_categories (nama_barang,kitchen_id) VALUES (?,?)', [nama_barang, isFullAccess(req.user) ? kitchen_id : req.user.kitchen_id])
    res.status(201).json({ message: 'Barang dibuat' })
  } catch (error) { res.status(500).json({ message: error.message }) }
})
app.put('/item-categories/:id', authMiddleware, permissionMiddleware('supplier'), async (req, res) => {
  try {
    const { nama_barang, kitchen_id } = req.body
    await pool.query(`UPDATE item_categories SET nama_barang=?, kitchen_id=? WHERE id=? ${isFullAccess(req.user) ? '' : 'AND kitchen_id=?'}`, isFullAccess(req.user) ? [nama_barang, kitchen_id, req.params.id] : [nama_barang, req.user.kitchen_id, req.params.id, req.user.kitchen_id])
    res.json({ message: 'Barang diupdate' })
  } catch (error) { res.status(500).json({ message: error.message }) }
})
app.delete('/item-categories/:id', authMiddleware, permissionMiddleware('supplier'), async (req, res) => {
  try {
    await pool.query(`DELETE FROM item_categories WHERE id=? ${isFullAccess(req.user) ? '' : 'AND kitchen_id=?'}`, isFullAccess(req.user) ? [req.params.id] : [req.params.id, req.user.kitchen_id])
    res.json({ message: 'Barang dihapus' })
  } catch (error) { res.status(500).json({ message: error.message }) }
})
app.put('/kitchens/:id', authMiddleware, async (req, res) => {
  try {
    if (!isFullAccess(req.user)) return res.status(403).json({ message: 'Hanya admin' })
    const { nama_dapur, lokasi, penanggung_jawab } = req.body
    await pool.query('UPDATE kitchens SET nama_dapur=?, lokasi=?, penanggung_jawab=? WHERE id=?', [nama_dapur, lokasi, penanggung_jawab, req.params.id])
    res.json({ message: 'Dapur diupdate' })
  } catch (error) { res.status(500).json({ message: error.message }) }
})
app.delete('/kitchens/:id', authMiddleware, async (req, res) => {
  try {
    if (!isFullAccess(req.user)) return res.status(403).json({ message: 'Hanya admin' })
    await pool.query('DELETE FROM kitchens WHERE id=?', [req.params.id])
    res.json({ message: 'Dapur dihapus' })
  } catch (error) { res.status(500).json({ message: error.message }) }
})

app.get('/menus', authMiddleware, permissionMiddleware('menu'), async (req, res) => {
  try {
    const { page, limit, offset } = pagination(req)
    const where = isFullAccess(req.user) ? '' : 'WHERE EXISTS (SELECT 1 FROM menu_kitchens mkf WHERE mkf.menu_id=m.id AND mkf.kitchen_id=?)'
    const args = isFullAccess(req.user) ? [] : [req.user.kitchen_id]
    const [rows] = await pool.query(
      `SELECT m.*, GROUP_CONCAT(DISTINCT mk.kitchen_id) kitchen_ids, GROUP_CONCAT(DISTINCT k.nama_dapur) kitchen_names
       FROM menus m
       LEFT JOIN menu_kitchens mk ON mk.menu_id=m.id
       LEFT JOIN kitchens k ON k.id=mk.kitchen_id
       ${where}
       GROUP BY m.id
       ORDER BY m.id DESC
       LIMIT ? OFFSET ?`,
      [...args, limit, offset],
    )
    const [countRows] = await pool.query(
      `SELECT COUNT(DISTINCT m.id) total
       FROM menus m
       ${where}`,
      args,
    )
    paged(res, rows, { page, limit, total: countRows[0].total })
  } catch (error) { res.status(500).json({ message: error.message }) }
})
app.post('/menus', authMiddleware, permissionMiddleware('menu'), async (req, res) => {
  try {
    const data = req.body
    const kitchenIds = Array.isArray(data.kitchen_ids) ? data.kitchen_ids.map(Number).filter(Boolean) : []
    const resolvedKitchenIds = isFullAccess(req.user) ? kitchenIds : [req.user.kitchen_id]
    if (!resolvedKitchenIds.length) return res.status(400).json({ message: 'Minimal pilih 1 dapur' })
    const total = Number(data.waktu_persiapan || 0) + Number(data.waktu_memasak || 0) + Number(data.waktu_distribusi || 0)
    const [result] = await pool.query('INSERT INTO menus (hari,nama_menu,deskripsi,estimasi_porsi,waktu_persiapan,waktu_memasak,waktu_distribusi,total_waktu) VALUES (?,?,?,?,?,?,?,?)', [data.hari, data.nama_menu, data.deskripsi, data.estimasi_porsi, data.waktu_persiapan || 0, data.waktu_memasak || 0, data.waktu_distribusi || 0, total])
    const values = resolvedKitchenIds.map((id) => [result.insertId, id])
    await pool.query('INSERT INTO menu_kitchens (menu_id, kitchen_id) VALUES ?', [values])
    res.status(201).json({ message: 'Menu dibuat' })
  } catch (error) { res.status(500).json({ message: error.message }) }
})
app.put('/menus/:id', authMiddleware, permissionMiddleware('menu'), async (req, res) => {
  try {
    const data = req.body
    const kitchenIds = Array.isArray(data.kitchen_ids) ? data.kitchen_ids.map(Number).filter(Boolean) : []
    const resolvedKitchenIds = isFullAccess(req.user) ? kitchenIds : [req.user.kitchen_id]
    if (!resolvedKitchenIds.length) return res.status(400).json({ message: 'Minimal pilih 1 dapur' })
    const total = Number(data.waktu_persiapan || 0) + Number(data.waktu_memasak || 0) + Number(data.waktu_distribusi || 0)
    const [allowed] = await pool.query(`SELECT id FROM menus WHERE id=? ${isFullAccess(req.user) ? '' : 'AND EXISTS (SELECT 1 FROM menu_kitchens mk WHERE mk.menu_id=menus.id AND mk.kitchen_id=?)'}`, isFullAccess(req.user) ? [req.params.id] : [req.params.id, req.user.kitchen_id])
    if (!allowed.length) return res.status(404).json({ message: 'Menu tidak ditemukan' })
    await pool.query('UPDATE menus SET hari=?, nama_menu=?, deskripsi=?, estimasi_porsi=?, waktu_persiapan=?, waktu_memasak=?, waktu_distribusi=?, total_waktu=? WHERE id=?', [data.hari, data.nama_menu, data.deskripsi, data.estimasi_porsi, data.waktu_persiapan || 0, data.waktu_memasak || 0, data.waktu_distribusi || 0, total, req.params.id])
    await pool.query('DELETE FROM menu_kitchens WHERE menu_id=?', [req.params.id])
    const values = resolvedKitchenIds.map((id) => [Number(req.params.id), id])
    await pool.query('INSERT INTO menu_kitchens (menu_id, kitchen_id) VALUES ?', [values])
    res.json({ message: 'Menu diupdate' })
  } catch (error) { res.status(500).json({ message: error.message }) }
})
app.delete('/menus/:id', authMiddleware, permissionMiddleware('menu'), async (req, res) => {
  try {
    if (!isFullAccess(req.user)) {
      const [allowed] = await pool.query('SELECT id FROM menu_kitchens WHERE menu_id=? AND kitchen_id=? LIMIT 1', [req.params.id, req.user.kitchen_id])
      if (!allowed.length) return res.status(404).json({ message: 'Menu tidak ditemukan' })
    }
    await pool.query('DELETE FROM menus WHERE id=?', [req.params.id])
    res.json({ message: 'Menu dihapus' })
  } catch (error) { res.status(500).json({ message: error.message }) }
})

app.get('/suppliers', authMiddleware, permissionMiddleware('supplier'), async (req, res) => {
  try {
    const { page, limit, offset } = pagination(req)
    const where = isFullAccess(req.user) ? '' : 'WHERE s.kitchen_id=?'
    const params = isFullAccess(req.user) ? [limit, offset] : [req.user.kitchen_id, limit, offset]
    const [rows] = await pool.query(
      `SELECT s.id, s.nama_supplier, s.cp_penanggung_jawab, s.alamat, s.nama_barang, s.jumlah_barang,
       s.jadwal_pengiriman, s.tanggal_akhir_kontrak, s.kontak, s.kitchen_id, k.nama_dapur kitchen_name
       FROM suppliers s
       LEFT JOIN kitchens k ON k.id=s.kitchen_id
       ${where}
       ORDER BY s.id DESC
       LIMIT ? OFFSET ?`,
      params,
    )
    const [countRows] = await pool.query(`SELECT COUNT(*) total FROM suppliers ${isFullAccess(req.user) ? '' : 'WHERE kitchen_id=?'}`, isFullAccess(req.user) ? [] : [req.user.kitchen_id])
    paged(res, rows, { page, limit, total: countRows[0].total })
  } catch (error) { res.status(500).json({ message: error.message }) }
})
app.post('/suppliers', authMiddleware, permissionMiddleware('supplier'), async (req, res) => {
  try {
    const { nama_supplier, cp_penanggung_jawab, alamat, nama_barang, jumlah_barang, jadwal_pengiriman, tanggal_akhir_kontrak, kitchen_id } = req.body
    const resolvedKitchenId = isFullAccess(req.user) ? kitchen_id : req.user.kitchen_id
    await pool.query(
      `INSERT INTO suppliers (nama_supplier, cp_penanggung_jawab, alamat, nama_barang, jumlah_barang, jadwal_pengiriman, tanggal_akhir_kontrak, kontak, kitchen_id)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [nama_supplier, cp_penanggung_jawab, alamat, nama_barang, jumlah_barang, jadwal_pengiriman, tanggal_akhir_kontrak || null, cp_penanggung_jawab, resolvedKitchenId],
    )
    res.status(201).json({ message: 'Supplier dibuat' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})
app.put('/suppliers/:id', authMiddleware, permissionMiddleware('supplier'), async (req, res) => {
  try {
    const { nama_supplier, cp_penanggung_jawab, alamat, nama_barang, jumlah_barang, jadwal_pengiriman, tanggal_akhir_kontrak, kitchen_id } = req.body
    await pool.query(
      `UPDATE suppliers SET nama_supplier=?, cp_penanggung_jawab=?, alamat=?, nama_barang=?, jumlah_barang=?, jadwal_pengiriman=?, tanggal_akhir_kontrak=?, kontak=?, kitchen_id=? WHERE id=? ${isFullAccess(req.user) ? '' : 'AND kitchen_id=?'}`,
      isFullAccess(req.user)
        ? [nama_supplier, cp_penanggung_jawab, alamat, nama_barang, jumlah_barang, jadwal_pengiriman, tanggal_akhir_kontrak || null, cp_penanggung_jawab, kitchen_id, req.params.id]
        : [nama_supplier, cp_penanggung_jawab, alamat, nama_barang, jumlah_barang, jadwal_pengiriman, tanggal_akhir_kontrak || null, cp_penanggung_jawab, req.user.kitchen_id, req.params.id, req.user.kitchen_id],
    )
    res.json({ message: 'Supplier diupdate' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})
app.delete('/suppliers/:id', authMiddleware, permissionMiddleware('supplier'), async (req, res) => {
  try {
    await pool.query(`DELETE FROM suppliers WHERE id=? ${isFullAccess(req.user) ? '' : 'AND kitchen_id=?'}`, isFullAccess(req.user) ? [req.params.id] : [req.params.id, req.user.kitchen_id])
    res.json({ message: 'Supplier dihapus' })
  } catch (error) { res.status(500).json({ message: error.message }) }
})

app.get('/finance', authMiddleware, permissionMiddleware('keuangan'), async (req, res) => {
  try {
    const { page, limit, offset } = pagination(req)
    const clauses = []
    const args = []
    if (!isFullAccess(req.user)) { clauses.push('kitchen_id=?'); args.push(req.user.kitchen_id) }
    if (req.query.tanggal) { clauses.push('tanggal=?'); args.push(req.query.tanggal) }
    if (req.query.month) { clauses.push("DATE_FORMAT(tanggal, '%Y-%m')=?"); args.push(req.query.month) }
    if (req.query.kitchen_id && isFullAccess(req.user)) { clauses.push('kitchen_id=?'); args.push(req.query.kitchen_id) }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
    const [rows] = await pool.query(`SELECT * FROM finance ${where} ORDER BY id DESC LIMIT ? OFFSET ?`, [...args, limit, offset])
    const [countRows] = await pool.query(`SELECT COUNT(*) total FROM finance ${where}`, args)
    const [summary] = await pool.query(`SELECT COALESCE(SUM(CASE WHEN jenis='pemasukan' THEN nominal END),0) total_pemasukan, COALESCE(SUM(CASE WHEN jenis='pengeluaran' THEN nominal END),0) total_pengeluaran FROM finance ${where}`, args)
    res.json({ data: rows, meta: { page, limit, total: countRows[0].total }, summary: summary[0] })
  } catch (error) { res.status(500).json({ message: error.message }) }
})
app.post('/finance', authMiddleware, permissionMiddleware('keuangan'), async (req, res) => {
  try {
    const { jenis, nominal, keterangan, tanggal, kitchen_id } = req.body
    await pool.query('INSERT INTO finance (jenis,nominal,keterangan,tanggal,kitchen_id) VALUES (?,?,?,?,?)', [jenis, nominal, keterangan, tanggal, isFullAccess(req.user) ? kitchen_id : req.user.kitchen_id])
    res.status(201).json({ message: 'Laporan keuangan dibuat' })
  } catch (error) { res.status(500).json({ message: error.message }) }
})
app.put('/finance/:id', authMiddleware, permissionMiddleware('keuangan'), async (req, res) => {
  try {
    const { jenis, nominal, keterangan, tanggal, kitchen_id } = req.body
    await pool.query(`UPDATE finance SET jenis=?, nominal=?, keterangan=?, tanggal=?, kitchen_id=? WHERE id=? ${isFullAccess(req.user) ? '' : 'AND kitchen_id=?'}`, isFullAccess(req.user) ? [jenis, nominal, keterangan, tanggal, kitchen_id, req.params.id] : [jenis, nominal, keterangan, tanggal, req.user.kitchen_id, req.params.id, req.user.kitchen_id])
    res.json({ message: 'Laporan keuangan diupdate' })
  } catch (error) { res.status(500).json({ message: error.message }) }
})

app.get('/invoices', authMiddleware, permissionMiddleware('keuangan'), async (req, res) => {
  try {
    const { page, limit, offset } = pagination(req)
    const clauses = []
    const args = []
    if (!isFullAccess(req.user)) { clauses.push('i.kitchen_id=?'); args.push(req.user.kitchen_id) }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
    const [rows] = await pool.query(`SELECT i.* FROM invoices i ${where} ORDER BY i.id DESC LIMIT ? OFFSET ?`, [...args, limit, offset])
    const [countRows] = await pool.query(`SELECT COUNT(*) total FROM invoices i ${where}`, args)
    paged(res, rows, { page, limit, total: countRows[0].total })
  } catch (error) { res.status(500).json({ message: error.message }) }
})

app.get('/invoices/:id', authMiddleware, permissionMiddleware('keuangan'), async (req, res) => {
  try {
    const [invoices] = await pool.query(`SELECT * FROM invoices WHERE id=? ${isFullAccess(req.user) ? '' : 'AND kitchen_id=?'}`, isFullAccess(req.user) ? [req.params.id] : [req.params.id, req.user.kitchen_id])
    if (!invoices.length) return res.status(404).json({ message: 'Invoice tidak ditemukan' })
    const [items] = await pool.query('SELECT * FROM invoice_items WHERE invoice_id=? ORDER BY id ASC', [req.params.id])
    res.json({ data: { ...invoices[0], items } })
  } catch (error) { res.status(500).json({ message: error.message }) }
})

app.post('/invoices', authMiddleware, permissionMiddleware('keuangan'), async (req, res) => {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    const { nama_perusahaan, ditujukan_kepada, invoice_number, total_payment, amount_paid, keterangan_tambahan, status_invoice, kitchen_id, items } = req.body
    const resolvedKitchenId = isFullAccess(req.user) ? kitchen_id : req.user.kitchen_id
    const [result] = await connection.query(
      'INSERT INTO invoices (nama_perusahaan,ditujukan_kepada,invoice_number,total_payment,amount_paid,keterangan_tambahan,status_invoice,kitchen_id) VALUES (?,?,?,?,?,?,?,?)',
      [nama_perusahaan, ditujukan_kepada, invoice_number, total_payment || 0, amount_paid || 0, keterangan_tambahan, status_invoice || 'pending', resolvedKitchenId],
    )
    const invoiceId = result.insertId
    const lineItems = Array.isArray(items) ? items : []
    if (lineItems.length) {
      const values = lineItems.map((item) => [invoiceId, item.item_name, item.quantity || 0, item.rate || 0, item.amount || 0])
      await connection.query('INSERT INTO invoice_items (invoice_id,item_name,quantity,rate,amount) VALUES ?', [values])
    }
    await connection.commit()
    res.status(201).json({ message: 'Invoice dibuat', id: invoiceId })
  } catch (error) {
    await connection.rollback()
    res.status(500).json({ message: error.message })
  } finally {
    connection.release()
  }
})

app.put('/invoices/:id', authMiddleware, permissionMiddleware('keuangan'), async (req, res) => {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    const { nama_perusahaan, ditujukan_kepada, invoice_number, total_payment, amount_paid, keterangan_tambahan, status_invoice, kitchen_id, items } = req.body
    await connection.query(
      `UPDATE invoices SET nama_perusahaan=?, ditujukan_kepada=?, invoice_number=?, total_payment=?, amount_paid=?, keterangan_tambahan=?, status_invoice=?, kitchen_id=? WHERE id=? ${isFullAccess(req.user) ? '' : 'AND kitchen_id=?'}`,
      isFullAccess(req.user)
        ? [nama_perusahaan, ditujukan_kepada, invoice_number, total_payment || 0, amount_paid || 0, keterangan_tambahan, status_invoice || 'pending', kitchen_id, req.params.id]
        : [nama_perusahaan, ditujukan_kepada, invoice_number, total_payment || 0, amount_paid || 0, keterangan_tambahan, status_invoice || 'pending', req.user.kitchen_id, req.params.id, req.user.kitchen_id],
    )
    await connection.query('DELETE FROM invoice_items WHERE invoice_id=?', [req.params.id])
    const lineItems = Array.isArray(items) ? items : []
    if (lineItems.length) {
      const values = lineItems.map((item) => [req.params.id, item.item_name, item.quantity || 0, item.rate || 0, item.amount || 0])
      await connection.query('INSERT INTO invoice_items (invoice_id,item_name,quantity,rate,amount) VALUES ?', [values])
    }
    await connection.commit()
    res.json({ message: 'Invoice diupdate' })
  } catch (error) {
    await connection.rollback()
    res.status(500).json({ message: error.message })
  } finally {
    connection.release()
  }
})

app.delete('/invoices/:id', authMiddleware, permissionMiddleware('keuangan'), async (req, res) => {
  try {
    await pool.query(`DELETE FROM invoices WHERE id=? ${isFullAccess(req.user) ? '' : 'AND kitchen_id=?'}`, isFullAccess(req.user) ? [req.params.id] : [req.params.id, req.user.kitchen_id])
    res.json({ message: 'Invoice dihapus' })
  } catch (error) { res.status(500).json({ message: error.message }) }
})

app.post('/tracking/update-location', authMiddleware, permissionMiddleware('tracking'), async (req, res) => {
  try {
    const { latitude, longitude } = req.body
    await pool.query('INSERT INTO gps_tracking (latitude,longitude,user_id,kitchen_id) VALUES (?,?,?,?)', [latitude, longitude, req.user.id, req.user.kitchen_id])
    res.json({ message: 'Lokasi diperbarui' })
  } catch (error) { res.status(500).json({ message: error.message }) }
})
app.get('/tracking/history', authMiddleware, permissionMiddleware('tracking'), async (req, res) => {
  try {
    const { page, limit, offset } = pagination(req)
    const params = isFullAccess(req.user) ? [limit, offset] : [req.user.kitchen_id, limit, offset]
    const [rows] = await pool.query(`SELECT gps_tracking.*, users.nama FROM gps_tracking JOIN users ON users.id=gps_tracking.user_id ${isFullAccess(req.user) ? '' : 'WHERE gps_tracking.kitchen_id=?'} ORDER BY gps_tracking.id DESC LIMIT ? OFFSET ?`, params)
    const [countRows] = await pool.query(`SELECT COUNT(*) total FROM gps_tracking ${isFullAccess(req.user) ? '' : 'WHERE kitchen_id=?'}`, isFullAccess(req.user) ? [] : [req.user.kitchen_id])
    paged(res, rows, { page, limit, total: countRows[0].total })
  } catch (error) { res.status(500).json({ message: error.message }) }
})
app.delete('/tracking/:id', authMiddleware, async (req, res) => {
  try {
    if (!isFullAccess(req.user)) return res.status(403).json({ message: 'Hanya admin' })
    await pool.query('DELETE FROM gps_tracking WHERE id=?', [req.params.id])
    res.json({ message: 'Data tracking dihapus' })
  } catch (error) { res.status(500).json({ message: error.message }) }
})

app.get('/courier/deliveries', authMiddleware, async (req, res) => {
  try {
    const role = normalizeRole(req.user.role_name)
    if (!hasPermission(req.user, 'courier')) return res.status(403).json({ message: 'Akses ditolak' })
    let query = `
      SELECT d.*, u.nama courier_name, gt.latitude courier_latitude, gt.longitude courier_longitude
      FROM deliveries d
      LEFT JOIN users u ON u.id = d.courier_id
      LEFT JOIN gps_tracking gt ON gt.id = (
        SELECT g2.id
        FROM gps_tracking g2
        WHERE g2.user_id = d.courier_id
        ORDER BY g2.timestamp DESC, g2.id DESC
        LIMIT 1
      )
    `
    const search = String(req.query.q || '').trim()
    const searchClause = search ? '(d.destination LIKE ? OR u.nama LIKE ?)' : ''
    let params = []
    if (isFullAccess(req.user)) {
      if (searchClause) {
        query += ` WHERE ${searchClause}`
        params = [`%${search}%`, `%${search}%`]
      }
      query += ' ORDER BY d.id DESC'
    } else if (role === 'staff') {
      query += ' WHERE d.kitchen_id=?'
      params = [req.user.kitchen_id]
      if (searchClause) {
        query += ` AND ${searchClause}`
        params.push(`%${search}%`, `%${search}%`)
      }
      query += ' ORDER BY d.id DESC'
    } else {
      query += ' WHERE d.courier_id=?'
      params = [req.user.id]
      if (searchClause) {
        query += ` AND ${searchClause}`
        params.push(`%${search}%`, `%${search}%`)
      }
      query += ' ORDER BY d.id DESC'
    }
    const [rows] = await pool.query(query, params)
    res.json({ data: rows })
  } catch (error) { res.status(500).json({ message: error.message }) }
})
app.get('/courier/couriers', authMiddleware, async (req, res) => {
  try {
    if (!isFullAccess(req.user) && normalizeRole(req.user.role_name) !== 'staff') {
      return res.status(403).json({ message: 'Akses ditolak' })
    }
    const [rows] = await pool.query(
      `SELECT u.id, u.nama, u.kitchen_id FROM users u JOIN roles r ON r.id=u.role_id WHERE r.name='Kurir' ${isFullAccess(req.user) ? '' : 'AND u.kitchen_id=?'} ORDER BY u.nama ASC`,
      isFullAccess(req.user) ? [] : [req.user.kitchen_id],
    )
    res.json({ data: rows })
  } catch (error) { res.status(500).json({ message: error.message }) }
})
app.post('/courier/deliveries', authMiddleware, async (req, res) => {
  try {
    const role = normalizeRole(req.user.role_name)
    if (!isFullAccess(req.user) && role !== 'staff') return res.status(403).json({ message: 'Akses ditolak' })
    const { destination, courier_id, kitchen_id, status } = req.body
    const resolvedKitchenId = isFullAccess(req.user) ? kitchen_id : req.user.kitchen_id
    await pool.query('INSERT INTO deliveries (destination,status,courier_id,kitchen_id) VALUES (?,?,?,?)', [destination, status || 'pending', courier_id, resolvedKitchenId])
    res.status(201).json({ message: 'Pengiriman dibuat' })
  } catch (error) { res.status(500).json({ message: error.message }) }
})
app.post('/courier/deliveries/reset-status', authMiddleware, async (req, res) => {
  try {
    if (!isFullAccess(req.user)) return res.status(403).json({ message: 'Hanya admin' })
    await pool.query("UPDATE deliveries SET status='pending'")
    res.json({ message: 'Semua status pengiriman direset ke menunggu' })
  } catch (error) { res.status(500).json({ message: error.message }) }
})
app.put('/courier/deliveries/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body
    const role = normalizeRole(req.user.role_name)
    if (isFullAccess(req.user)) {
      await pool.query('UPDATE deliveries SET status=? WHERE id=?', [status, req.params.id])
    } else if (role === 'staff') {
      await pool.query('UPDATE deliveries SET status=? WHERE id=? AND kitchen_id=?', [status, req.params.id, req.user.kitchen_id])
    } else if (role === 'kurir') {
      await pool.query('UPDATE deliveries SET status=? WHERE id=? AND courier_id=?', [status, req.params.id, req.user.id])
    } else {
      return res.status(403).json({ message: 'Akses ditolak' })
    }
    res.json({ message: 'Status pengiriman diupdate' })
  } catch (error) { res.status(500).json({ message: error.message }) }
})

app.listen(process.env.PORT || 4000, async () => {
  await initDatabase()
  console.log(`API jalan di port ${process.env.PORT || 4000}`)
})
