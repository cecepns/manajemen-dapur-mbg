import { useEffect, useState } from 'react'
import Select from 'react-select'
import { toast } from 'react-toastify'
import CrudTable from '../components/CrudTable'
import FormModal from '../components/FormModal'
import useKitchenOptions from '../hooks/useKitchenOptions'
import usePaginatedFetch from '../hooks/usePaginatedFetch'
import api from '../services/api'

export default function SuppliersPage() {
  const { data, fetchData } = usePaginatedFetch('/suppliers')
  const kitchenOptions = useKitchenOptions()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ nama_supplier: '', kontak: '', kitchen_id: 1 })

  useEffect(() => {
    if (kitchenOptions.length) setForm((prev) => ({ ...prev, kitchen_id: kitchenOptions[0].value }))
  }, [kitchenOptions])

  const save = async (e) => {
    e.preventDefault()
    if (editingId) {
      await api.put(`/suppliers/${editingId}`, form)
      toast.success('Supplier diupdate')
    } else {
      await api.post('/suppliers', form)
      toast.success('Supplier ditambahkan')
    }
    setForm({ ...form, nama_supplier: '', kontak: '' })
    setEditingId(null)
    setIsModalOpen(false)
    fetchData()
  }

  const openAddModal = () => {
    setEditingId(null)
    setForm((prev) => ({ ...prev, nama_supplier: '', kontak: '' }))
    setIsModalOpen(true)
  }

  const openEditModal = (row) => {
    setEditingId(row.id)
    setForm((prev) => ({
      ...prev,
      nama_supplier: row.nama_supplier || '',
      kontak: row.kontak || '',
      kitchen_id: row.kitchen_id || prev.kitchen_id,
    }))
    setIsModalOpen(true)
  }

  return (
    <CrudTable
      title="Supplier"
      rows={data}
      columns={[
        { key: 'nama_supplier', label: 'Nama' },
        { key: 'kontak', label: 'Kontak' },
        { key: 'kitchen_name', label: 'Dapur' },
        { key: 'id', label: 'Aksi', render: (row) => <button className="rounded bg-amber-600 px-2 py-1 text-white" onClick={() => openEditModal(row)}>Edit</button> },
      ]}
    >
      <button className="rounded bg-cyan-600 px-3 py-2 text-white" onClick={openAddModal}>Tambah Supplier</button>
      <FormModal open={isModalOpen} title={editingId ? 'Edit Supplier' : 'Tambah Supplier'} onClose={() => setIsModalOpen(false)}>
        <form onSubmit={save} className="grid gap-3">
          <label className="grid gap-1 text-sm">
            <span>Nama Supplier</span>
            <input className="rounded border p-2" value={form.nama_supplier} onChange={(e) => setForm({ ...form, nama_supplier: e.target.value })} />
          </label>
          <label className="grid gap-1 text-sm">
            <span>Kontak</span>
            <input className="rounded border p-2" value={form.kontak} onChange={(e) => setForm({ ...form, kontak: e.target.value })} />
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
          <button className="rounded bg-cyan-600 p-2 text-white">{editingId ? 'Simpan Perubahan' : 'Tambah'}</button>
        </form>
      </FormModal>
    </CrudTable>
  )
}
