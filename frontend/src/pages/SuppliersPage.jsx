import { useEffect, useState } from 'react'
import Select from 'react-select'
import { toast } from 'react-toastify'
import CrudTable from '../components/CrudTable'
import FormModal from '../components/FormModal'
import useKitchenOptions from '../hooks/useKitchenOptions'
import usePaginatedFetch from '../hooks/usePaginatedFetch'
import api from '../services/api'
import { toastConfirm } from '../utils/toastConfirm'

const emptyForm = {
  nama_supplier: '',
  cp_penanggung_jawab: '',
  alamat: '',
  nama_barang: '',
  jumlah_barang: '',
  jadwal_pengiriman: '',
  tanggal_akhir_kontrak: '',
  kitchen_id: 1,
}

export default function SuppliersPage() {
  const { data, meta, fetchData } = usePaginatedFetch('/suppliers')
  const kitchenOptions = useKitchenOptions()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    if (kitchenOptions.length) setForm((prev) => ({ ...prev, kitchen_id: kitchenOptions[0].value }))
  }, [kitchenOptions])

  const save = async (e) => {
    e.preventDefault()
    try {
      if (editingId) {
        await api.put(`/suppliers/${editingId}`, form)
        toast.success('Supplier diupdate')
      } else {
        await api.post('/suppliers', form)
        toast.success('Supplier ditambahkan')
      }
      setForm({ ...emptyForm, kitchen_id: kitchenOptions[0]?.value || 1 })
      setEditingId(null)
      setIsModalOpen(false)
      fetchData()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal menyimpan supplier')
    }
  }

  const remove = async (id) => {
    if (!(await toastConfirm('Hapus supplier ini?'))) return
    try {
      await api.delete(`/suppliers/${id}`)
      toast.success('Supplier dihapus')
      fetchData()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal menghapus supplier')
    }
  }

  const openAddModal = () => {
    setEditingId(null)
    setForm({ ...emptyForm, kitchen_id: kitchenOptions[0]?.value || 1 })
    setIsModalOpen(true)
  }

  const openEditModal = (row) => {
    setEditingId(row.id)
    setForm({
      nama_supplier: row.nama_supplier || '',
      cp_penanggung_jawab: row.cp_penanggung_jawab || row.kontak || '',
      alamat: row.alamat || '',
      nama_barang: row.nama_barang || '',
      jumlah_barang: row.jumlah_barang || '',
      jadwal_pengiriman: row.jadwal_pengiriman || '',
      tanggal_akhir_kontrak: row.tanggal_akhir_kontrak ? String(row.tanggal_akhir_kontrak).slice(0, 10) : '',
      kitchen_id: row.kitchen_id || kitchenOptions[0]?.value || 1,
    })
    setIsModalOpen(true)
  }

  return (
    <CrudTable
      title="Supplier"
      rows={data}
      meta={meta}
      onPageChange={(nextPage) => fetchData(nextPage, meta.limit)}
      columns={[
        { key: 'nama_supplier', label: 'Nama Supplier' },
        { key: 'cp_penanggung_jawab', label: 'CP Penanggung Jawab' },
        { key: 'alamat', label: 'Alamat Supplier' },
        { key: 'nama_barang', label: 'Nama Barang' },
        { key: 'jumlah_barang', label: 'Jumlah Barang' },
        { key: 'jadwal_pengiriman', label: 'Jadwal Pengiriman' },
        { key: 'tanggal_akhir_kontrak', label: 'Tanggal Akhir Kontrak' },
        {
          key: 'id',
          label: 'Aksi',
          render: (row) => (
            <div className="flex gap-2">
              <button className="rounded bg-amber-600 px-2 py-1 text-white" onClick={() => openEditModal(row)}>Edit</button>
              <button className="rounded bg-red-600 px-2 py-1 text-white" onClick={() => remove(row.id)}>Hapus</button>
            </div>
          ),
        },
      ]}
    >
      <button className="rounded bg-cyan-600 px-3 py-2 text-white" onClick={openAddModal}>Tambah Supplier</button>
      <FormModal open={isModalOpen} title={editingId ? 'Edit Supplier' : 'Tambah Supplier'} onClose={() => setIsModalOpen(false)}>
        <form onSubmit={save} className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-1 text-sm">
            <span>Nama Supplier</span>
            <input className="rounded border p-2" value={form.nama_supplier} onChange={(e) => setForm({ ...form, nama_supplier: e.target.value })} required />
          </label>
          <label className="grid gap-1 text-sm">
            <span>CP Penanggung Jawab</span>
            <input className="rounded border p-2" value={form.cp_penanggung_jawab} onChange={(e) => setForm({ ...form, cp_penanggung_jawab: e.target.value })} required />
          </label>
          <label className="grid gap-1 text-sm md:col-span-2">
            <span>Alamat Supplier</span>
            <textarea className="rounded border p-2" rows={2} value={form.alamat} onChange={(e) => setForm({ ...form, alamat: e.target.value })} required />
          </label>
          <label className="grid gap-1 text-sm">
            <span>Nama Barang</span>
            <input className="rounded border p-2" value={form.nama_barang} onChange={(e) => setForm({ ...form, nama_barang: e.target.value })} required />
          </label>
          <label className="grid gap-1 text-sm">
            <span>Jumlah Barang</span>
            <input className="rounded border p-2" value={form.jumlah_barang} onChange={(e) => setForm({ ...form, jumlah_barang: e.target.value })} required />
          </label>
          <label className="grid gap-1 text-sm">
            <span>Jadwal Pengiriman Barang</span>
            <input className="rounded border p-2" placeholder="Contoh: Setiap Senin & Kamis" value={form.jadwal_pengiriman} onChange={(e) => setForm({ ...form, jadwal_pengiriman: e.target.value })} required />
          </label>
          <label className="grid gap-1 text-sm">
            <span>Tanggal Akhir Kontrak</span>
            <input className="rounded border p-2" type="date" value={form.tanggal_akhir_kontrak} onChange={(e) => setForm({ ...form, tanggal_akhir_kontrak: e.target.value })} required />
          </label>
          <label className="grid gap-1 text-sm md:col-span-2">
            <span>Dapur</span>
            <Select
              className="text-sm"
              options={kitchenOptions}
              value={kitchenOptions.find((option) => option.value === form.kitchen_id) || null}
              onChange={(selected) => setForm({ ...form, kitchen_id: selected?.value || 1 })}
              placeholder="Pilih Dapur"
            />
          </label>
          <button className="rounded bg-cyan-600 p-2 text-white md:col-span-2">{editingId ? 'Simpan Perubahan' : 'Tambah'}</button>
        </form>
      </FormModal>
    </CrudTable>
  )
}
