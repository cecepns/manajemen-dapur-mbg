import { useEffect, useState } from 'react'
import Select from 'react-select'
import * as XLSX from 'xlsx'
import { toast } from 'react-toastify'
import CrudTable from '../components/CrudTable'
import FormModal from '../components/FormModal'
import useKitchenOptions from '../hooks/useKitchenOptions'
import api from '../services/api'

const sanitizeNominal = (value) => String(value ?? '').replace(/\D/g, '')
const formatRupiahInput = (value) => {
  const digits = sanitizeNominal(value)
  return digits ? Number(digits).toLocaleString('id-ID') : ''
}

export default function FinancePage() {
  const [data, setData] = useState([])
  const [monthFilter, setMonthFilter] = useState(new Date().toISOString().slice(0, 7))
  const kitchenOptions = useKitchenOptions()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [isExporting, setIsExporting] = useState(false)
  const [form, setForm] = useState({ jenis: 'pengeluaran', nominal: '', keterangan: '', kitchen_id: 1, tanggal: new Date().toISOString().slice(0, 10) })

  const fetchData = async (page = 1, limit = 10, customMonth = monthFilter) => {
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      })
      if (customMonth) params.set('month', customMonth)
      const res = await api.get(`/finance?${params.toString()}`)
      setData(res.data?.data || [])
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal memuat data keuangan')
    }
  }

  useEffect(() => {
    if (kitchenOptions.length) setForm((prev) => ({ ...prev, kitchen_id: kitchenOptions[0].value }))
  }, [kitchenOptions])

  useEffect(() => {
    fetchData(1, 10, monthFilter)
  }, [monthFilter])

  const save = async (e) => {
    e.preventDefault()
    const payload = {
      ...form,
      nominal: Number(sanitizeNominal(form.nominal) || 0),
    }
    if (editingId) {
      await api.put(`/finance/${editingId}`, payload)
      toast.success('Data keuangan diupdate')
    } else {
      await api.post('/finance', payload)
      toast.success('Data keuangan disimpan')
    }
    setEditingId(null)
    setIsModalOpen(false)
    fetchData()
  }

  const openAddModal = () => {
    setEditingId(null)
    setForm((prev) => ({ ...prev, nominal: '', keterangan: '' }))
    setIsModalOpen(true)
  }

  const openEditModal = (row) => {
    setEditingId(row.id)
    setForm((prev) => ({
      ...prev,
      tanggal: row.tanggal || prev.tanggal,
      jenis: row.jenis || 'pengeluaran',
      nominal: sanitizeNominal(row.nominal),
      keterangan: row.keterangan || '',
      kitchen_id: row.kitchen_id || prev.kitchen_id,
    }))
    setIsModalOpen(true)
  }

  const downloadExcel = async () => {
    try {
      setIsExporting(true)
      const allRows = []
      let page = 1
      const limit = 10
      let total = 0

      do {
        const params = new URLSearchParams({ page: String(page), limit: String(limit) })
        if (monthFilter) params.set('month', monthFilter)
        const res = await api.get(`/finance?${params.toString()}`)
        const rows = res.data?.data || []
        allRows.push(...rows)
        total = Number(res.data?.meta?.total || 0)
        page += 1
      } while (allRows.length < total)

      const excelRows = allRows.map((row, index) => ({
        No: index + 1,
        Tanggal: row.tanggal,
        Jenis: row.jenis,
        Nominal: Number(row.nominal),
        Keterangan: row.keterangan || '',
      }))

      const worksheet = XLSX.utils.json_to_sheet(excelRows)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan Keuangan')
      XLSX.writeFile(workbook, `laporan-keuangan-${monthFilter || 'semua'}.xlsx`)
      toast.success('File Excel berhasil diunduh')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal mengunduh laporan')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <CrudTable
      title="Laporan Keuangan"
      rows={data}
      columns={[
        { key: 'tanggal', label: 'Tanggal' },
        { key: 'jenis', label: 'Jenis' },
        { key: 'nominal', label: 'Nominal' },
        { key: 'keterangan', label: 'Keterangan' },
        { key: 'id', label: 'Aksi', render: (row) => <button className="rounded bg-amber-600 px-2 py-1 text-white" onClick={() => openEditModal(row)}>Edit</button> },
      ]}
    >
      <div className="flex flex-wrap items-end gap-2">
        <label className="grid gap-1 text-sm">
          <span>Filter Bulan</span>
          <input className="rounded border p-2" type="month" value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} />
        </label>
        <button className="rounded bg-slate-700 px-3 py-2 text-white" onClick={() => fetchData(1, 10, monthFilter)}>Terapkan Filter</button>
        <button className="rounded bg-emerald-700 px-3 py-2 text-white" onClick={downloadExcel} disabled={isExporting}>
          {isExporting ? 'Mempersiapkan Excel...' : 'Download Excel'}
        </button>
        <button className="rounded bg-cyan-600 px-3 py-2 text-white" onClick={openAddModal}>Tambah Keuangan</button>
      </div>
      <FormModal open={isModalOpen} title={editingId ? 'Edit Keuangan' : 'Tambah Keuangan'} onClose={() => setIsModalOpen(false)}>
        <form onSubmit={save} className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-1 text-sm">
            <span>Tanggal</span>
            <input className="rounded border p-2" type="date" value={form.tanggal} onChange={(e) => setForm({ ...form, tanggal: e.target.value })} />
          </label>
          <label className="grid gap-1 text-sm">
            <span>Jenis</span>
            <select className="rounded border p-2" value={form.jenis} onChange={(e) => setForm({ ...form, jenis: e.target.value })}>
              <option value="pemasukan">Pemasukan</option>
              <option value="pengeluaran">Pengeluaran</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span>Nominal</span>
            <input
              className="rounded border p-2"
              type="text"
              inputMode="numeric"
              placeholder="Contoh: 10.000"
              value={formatRupiahInput(form.nominal)}
              onChange={(e) => setForm({ ...form, nominal: sanitizeNominal(e.target.value) })}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span>Dapur</span>
            <Select
              className="text-sm"
              options={kitchenOptions}
              value={kitchenOptions.find((option) => option.value === form.kitchen_id) || null}
              onChange={(selected) => setForm({ ...form, kitchen_id: selected?.value || 1 })}
              placeholder="Pilih Dapur"
            />
          </label>
          <label className="grid gap-1 text-sm md:col-span-2">
            <span>Keterangan</span>
            <input className="rounded border p-2" value={form.keterangan} onChange={(e) => setForm({ ...form, keterangan: e.target.value })} />
          </label>
          <button className="rounded bg-cyan-600 p-2 text-white md:col-span-2">{editingId ? 'Simpan Perubahan' : 'Tambah'}</button>
        </form>
      </FormModal>
    </CrudTable>
  )
}
