import { useMemo, useState } from 'react'
import Select from 'react-select'
import * as XLSX from 'xlsx'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'react-toastify'
import CrudTable from '../components/CrudTable'
import FormModal from '../components/FormModal'
import useKitchenOptions from '../hooks/useKitchenOptions'
import api from '../services/api'
import { toastConfirm } from '../utils/toastConfirm'

const sanitizeNominal = (value) => String(value ?? '').replace(/\D/g, '')
const formatRupiahInput = (value) => {
  const digits = sanitizeNominal(value)
  return digits ? Number(digits).toLocaleString('id-ID') : ''
}

const emptyInvoiceItem = { item_name: '', quantity: '', rate: '', amount: '' }
const emptyInvoiceForm = {
  nama_perusahaan: '',
  ditujukan_kepada: '',
  invoice_number: '',
  total_payment: '',
  amount_paid: '',
  keterangan_tambahan: '',
  status_invoice: 'pending',
  kitchen_id: 1,
  items: [{ ...emptyInvoiceItem }],
}

export default function FinancePage() {
  const [data, setData] = useState([])
  const [invoices, setInvoices] = useState([])
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0 })
  const [invoiceMeta, setInvoiceMeta] = useState({ page: 1, limit: 10, total: 0 })
  const [monthFilter, setMonthFilter] = useState(new Date().toISOString().slice(0, 7))
  const kitchenOptions = useKitchenOptions()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editingInvoiceId, setEditingInvoiceId] = useState(null)
  const [isExporting, setIsExporting] = useState(false)
  const [form, setForm] = useState({ jenis: 'pengeluaran', nominal: '', keterangan: '', kitchen_id: 1, tanggal: new Date().toISOString().slice(0, 10) })
  const [invoiceForm, setInvoiceForm] = useState(emptyInvoiceForm)

  const fetchData = async (page = meta.page, limit = meta.limit, customMonth = monthFilter) => {
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      if (customMonth) params.set('month', customMonth)
      const res = await api.get(`/finance?${params.toString()}`)
      setData(res.data?.data || [])
      setMeta(res.data?.meta || { page, limit, total: 0 })
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal memuat data keuangan')
    }
  }

  const fetchInvoices = async (page = invoiceMeta.page, limit = invoiceMeta.limit) => {
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      const res = await api.get(`/invoices?${params.toString()}`)
      setInvoices(res.data?.data || [])
      setInvoiceMeta(res.data?.meta || { page, limit, total: 0 })
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal memuat invoice')
    }
  }

  useMemo(() => {
    fetchData(1, 10, monthFilter)
    fetchInvoices(1, 10)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const save = async (e) => {
    e.preventDefault()
    const payload = {
      ...form,
      nominal: Number(sanitizeNominal(form.nominal) || 0),
      kitchen_id: form.kitchen_id || kitchenOptions[0]?.value || 1,
    }
    try {
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
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal menyimpan keuangan')
    }
  }

  const calcInvoiceTotal = (items) => items.reduce((sum, item) => sum + Number(sanitizeNominal(item.amount) || 0), 0)

  const updateInvoiceItem = (index, field, value) => {
    setInvoiceForm((prev) => {
      const items = [...prev.items]
      const item = { ...items[index], [field]: value }
      if (field === 'quantity' || field === 'rate') {
        const qty = Number(item.quantity) || 0
        const rate = Number(sanitizeNominal(item.rate)) || 0
        item.amount = String(qty * rate)
      }
      items[index] = item
      const total = calcInvoiceTotal(items)
      return { ...prev, items, total_payment: String(total) }
    })
  }

  const addInvoiceItem = () => {
    setInvoiceForm((prev) => ({ ...prev, items: [...prev.items, { ...emptyInvoiceItem }] }))
  }

  const removeInvoiceItem = (index) => {
    setInvoiceForm((prev) => {
      const items = prev.items.filter((_, i) => i !== index)
      const total = calcInvoiceTotal(items.length ? items : [{ ...emptyInvoiceItem }])
      return { ...prev, items: items.length ? items : [{ ...emptyInvoiceItem }], total_payment: String(total) }
    })
  }

  const saveInvoice = async (e) => {
    e.preventDefault()
    const payload = {
      ...invoiceForm,
      total_payment: Number(sanitizeNominal(invoiceForm.total_payment) || calcInvoiceTotal(invoiceForm.items)),
      amount_paid: Number(sanitizeNominal(invoiceForm.amount_paid) || 0),
      kitchen_id: invoiceForm.kitchen_id || kitchenOptions[0]?.value || 1,
      items: invoiceForm.items.map((item) => ({
        item_name: item.item_name,
        quantity: Number(item.quantity) || 0,
        rate: Number(sanitizeNominal(item.rate)) || 0,
        amount: Number(sanitizeNominal(item.amount)) || 0,
      })),
    }
    try {
      if (editingInvoiceId) {
        await api.put(`/invoices/${editingInvoiceId}`, payload)
        toast.success('Invoice diupdate')
      } else {
        await api.post('/invoices', payload)
        toast.success('Invoice disimpan')
      }
      setEditingInvoiceId(null)
      setIsInvoiceModalOpen(false)
      fetchInvoices()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal menyimpan invoice')
    }
  }

  const openAddModal = () => {
    setEditingId(null)
    setForm((prev) => ({ ...prev, nominal: '', keterangan: '', kitchen_id: prev.kitchen_id || kitchenOptions[0]?.value || 1 }))
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

  const openAddInvoiceModal = () => {
    setEditingInvoiceId(null)
    setInvoiceForm({ ...emptyInvoiceForm, kitchen_id: kitchenOptions[0]?.value || 1, items: [{ ...emptyInvoiceItem }] })
    setIsInvoiceModalOpen(true)
  }

  const openEditInvoiceModal = async (row) => {
    try {
      const res = await api.get(`/invoices/${row.id}`)
      const invoice = res.data?.data
      setEditingInvoiceId(row.id)
      setInvoiceForm({
        nama_perusahaan: invoice.nama_perusahaan || '',
        ditujukan_kepada: invoice.ditujukan_kepada || '',
        invoice_number: invoice.invoice_number || '',
        total_payment: sanitizeNominal(invoice.total_payment),
        amount_paid: sanitizeNominal(invoice.amount_paid),
        keterangan_tambahan: invoice.keterangan_tambahan || '',
        status_invoice: invoice.status_invoice || 'pending',
        kitchen_id: invoice.kitchen_id || kitchenOptions[0]?.value || 1,
        items: (invoice.items || []).length
          ? invoice.items.map((item) => ({
            item_name: item.item_name || '',
            quantity: String(item.quantity ?? ''),
            rate: sanitizeNominal(item.rate),
            amount: sanitizeNominal(item.amount),
          }))
          : [{ ...emptyInvoiceItem }],
      })
      setIsInvoiceModalOpen(true)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal memuat detail invoice')
    }
  }

  const removeInvoice = async (id) => {
    if (!(await toastConfirm('Hapus invoice ini?'))) return
    try {
      await api.delete(`/invoices/${id}`)
      toast.success('Invoice dihapus')
      fetchInvoices()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal menghapus invoice')
    }
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
    <div className="space-y-8">
      <CrudTable
        title="Laporan Keuangan"
        rows={data}
        meta={meta}
        onPageChange={(nextPage) => fetchData(nextPage, meta.limit, monthFilter)}
        columns={[
          { key: 'tanggal', label: 'Tanggal' },
          { key: 'jenis', label: 'Jenis' },
          { key: 'nominal', label: 'Nominal', render: (row) => `Rp ${Number(row.nominal).toLocaleString('id-ID')}` },
          { key: 'keterangan', label: 'Keterangan' },
          { key: 'id', label: 'Aksi', render: (row) => <button className="rounded bg-amber-600 px-2 py-1 text-white" onClick={() => openEditModal(row)}>Edit</button> },
        ]}
      >
        <div className="flex flex-wrap items-end gap-2">
          <label className="grid gap-1 text-sm">
            <span>Filter Bulan</span>
            <input className="rounded border p-2" type="month" value={monthFilter} onChange={(e) => {
              const nextMonth = e.target.value
              setMonthFilter(nextMonth)
              fetchData(1, meta.limit, nextMonth)
            }} />
          </label>
          <button className="rounded bg-slate-700 px-3 py-2 text-white" onClick={() => fetchData(1, 10, monthFilter)}>Terapkan Filter</button>
          <button className="rounded bg-emerald-700 px-3 py-2 text-white" onClick={downloadExcel} disabled={isExporting}>
            {isExporting ? 'Mempersiapkan Excel...' : 'Download Excel'}
          </button>
          <button className="rounded bg-cyan-600 px-3 py-2 text-white" onClick={openAddModal}>Tambah Keuangan</button>
          <button className="rounded bg-indigo-600 px-3 py-2 text-white" onClick={openAddInvoiceModal}>Invoice</button>
        </div>
      </CrudTable>

      <CrudTable
        title="Daftar Invoice"
        rows={invoices}
        meta={invoiceMeta}
        onPageChange={(nextPage) => fetchInvoices(nextPage, invoiceMeta.limit)}
        columns={[
          { key: 'invoice_number', label: 'No. Invoice' },
          { key: 'nama_perusahaan', label: 'Perusahaan' },
          { key: 'ditujukan_kepada', label: 'Ditujukan Kepada' },
          { key: 'total_payment', label: 'Total', render: (row) => `Rp ${Number(row.total_payment).toLocaleString('id-ID')}` },
          { key: 'amount_paid', label: 'Dibayar', render: (row) => `Rp ${Number(row.amount_paid).toLocaleString('id-ID')}` },
          { key: 'status_invoice', label: 'Status' },
          {
            key: 'id',
            label: 'Aksi',
            render: (row) => (
              <div className="flex gap-2">
                <button className="rounded bg-amber-600 px-2 py-1 text-white" onClick={() => openEditInvoiceModal(row)}>Edit</button>
                <button className="rounded bg-red-600 px-2 py-1 text-white" onClick={() => removeInvoice(row.id)}>Hapus</button>
              </div>
            ),
          },
        ]}
      />

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

      <FormModal open={isInvoiceModalOpen} title={editingInvoiceId ? 'Edit Invoice' : 'Buat Invoice'} onClose={() => setIsInvoiceModalOpen(false)}>
        <form onSubmit={saveInvoice} className="grid gap-3">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="grid gap-1 text-sm">
              <span>Nama Perusahaan</span>
              <input className="rounded border p-2" value={invoiceForm.nama_perusahaan} onChange={(e) => setInvoiceForm({ ...invoiceForm, nama_perusahaan: e.target.value })} required />
            </label>
            <label className="grid gap-1 text-sm">
              <span>Ditujukan Kepada</span>
              <input className="rounded border p-2" value={invoiceForm.ditujukan_kepada} onChange={(e) => setInvoiceForm({ ...invoiceForm, ditujukan_kepada: e.target.value })} required />
            </label>
            <label className="grid gap-1 text-sm">
              <span>Invoice Number</span>
              <input className="rounded border p-2" value={invoiceForm.invoice_number} onChange={(e) => setInvoiceForm({ ...invoiceForm, invoice_number: e.target.value })} required />
            </label>
            <label className="grid gap-1 text-sm">
              <span>Status Invoice</span>
              <select className="rounded border p-2" value={invoiceForm.status_invoice} onChange={(e) => setInvoiceForm({ ...invoiceForm, status_invoice: e.target.value })}>
                <option value="draft">Draft</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </label>
          </div>

          <div className="overflow-x-auto rounded border">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="p-2 text-left">Item</th>
                  <th className="p-2 text-left">Quantity</th>
                  <th className="p-2 text-left">Rate</th>
                  <th className="p-2 text-left">Amount</th>
                  <th className="p-2" />
                </tr>
              </thead>
              <tbody>
                {invoiceForm.items.map((item, index) => (
                  <tr key={index} className="border-t">
                    <td className="p-2"><input className="w-full rounded border p-1" value={item.item_name} onChange={(e) => updateInvoiceItem(index, 'item_name', e.target.value)} required /></td>
                    <td className="p-2"><input className="w-full rounded border p-1" type="number" min="0" value={item.quantity} onChange={(e) => updateInvoiceItem(index, 'quantity', e.target.value)} required /></td>
                    <td className="p-2"><input className="w-full rounded border p-1" value={formatRupiahInput(item.rate)} onChange={(e) => updateInvoiceItem(index, 'rate', sanitizeNominal(e.target.value))} required /></td>
                    <td className="p-2"><input className="w-full rounded border p-1 bg-slate-50" value={formatRupiahInput(item.amount)} readOnly /></td>
                    <td className="p-2">
                      {invoiceForm.items.length > 1 && (
                        <button type="button" className="rounded bg-red-100 p-1 text-red-700" onClick={() => removeInvoiceItem(index)}>
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button type="button" className="flex items-center gap-2 self-start rounded bg-slate-200 px-3 py-1 text-sm" onClick={addInvoiceItem}>
            <Plus size={16} /> Tambah Item
          </button>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="grid gap-1 text-sm">
              <span>Total Payment</span>
              <input className="rounded border p-2 bg-slate-50" value={formatRupiahInput(invoiceForm.total_payment)} readOnly />
            </label>
            <label className="grid gap-1 text-sm">
              <span>Amount Paid</span>
              <input className="rounded border p-2" value={formatRupiahInput(invoiceForm.amount_paid)} onChange={(e) => setInvoiceForm({ ...invoiceForm, amount_paid: sanitizeNominal(e.target.value) })} />
            </label>
            <label className="grid gap-1 text-sm md:col-span-2">
              <span>Keterangan Tambahan</span>
              <textarea className="rounded border p-2" rows={3} value={invoiceForm.keterangan_tambahan} onChange={(e) => setInvoiceForm({ ...invoiceForm, keterangan_tambahan: e.target.value })} />
            </label>
            <label className="grid gap-1 text-sm md:col-span-2">
              <span>Dapur</span>
              <Select
                className="text-sm"
                options={kitchenOptions}
                value={kitchenOptions.find((option) => option.value === invoiceForm.kitchen_id) || null}
                onChange={(selected) => setInvoiceForm({ ...invoiceForm, kitchen_id: selected?.value || 1 })}
                placeholder="Pilih Dapur"
              />
            </label>
          </div>
          <button className="rounded bg-indigo-600 p-2 text-white">{editingInvoiceId ? 'Simpan Perubahan' : 'Simpan Invoice'}</button>
        </form>
      </FormModal>
    </div>
  )
}
