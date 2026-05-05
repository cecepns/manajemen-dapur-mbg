import { useEffect, useState } from 'react'
import Select from 'react-select'
import { toast } from 'react-toastify'
import CrudTable from '../components/CrudTable'
import FormModal from '../components/FormModal'
import useKitchenOptions from '../hooks/useKitchenOptions'
import usePaginatedFetch from '../hooks/usePaginatedFetch'
import api from '../services/api'

export default function SuppliersPage() {
  const { data, meta, fetchData } = usePaginatedFetch('/suppliers')
  const { data: itemCategories, fetchData: fetchItemCategories } = usePaginatedFetch('/item-categories')
  const kitchenOptions = useKitchenOptions()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ nama_supplier: '', kontak: '', kitchen_id: 1, item_category_ids: [] })

  useEffect(() => {
    if (kitchenOptions.length) setForm((prev) => ({ ...prev, kitchen_id: kitchenOptions[0].value }))
  }, [kitchenOptions])

  useEffect(() => {
    fetchItemCategories(1, 100)
  }, [fetchItemCategories])

  const save = async (e) => {
    e.preventDefault()
    if (editingId) {
      await api.put(`/suppliers/${editingId}`, form)
      toast.success('Supplier diupdate')
    } else {
      await api.post('/suppliers', form)
      toast.success('Supplier ditambahkan')
    }
    setForm((prev) => ({ ...prev, nama_supplier: '', kontak: '', item_category_ids: [] }))
    setEditingId(null)
    setIsModalOpen(false)
    fetchData()
  }

  const openAddModal = () => {
    setEditingId(null)
    setForm((prev) => ({ ...prev, nama_supplier: '', kontak: '', item_category_ids: [] }))
    setIsModalOpen(true)
  }

  const openEditModal = (row) => {
    setEditingId(row.id)
    setForm((prev) => ({
      ...prev,
      nama_supplier: row.nama_supplier || '',
      kontak: row.kontak || '',
      kitchen_id: row.kitchen_id || prev.kitchen_id,
      item_category_ids: row.item_category_ids ? String(row.item_category_ids).split(',').map(Number).filter(Boolean) : [],
    }))
    setIsModalOpen(true)
  }

  return (
    <CrudTable
      title="Supplier"
      rows={data}
      meta={meta}
      onPageChange={(nextPage) => fetchData(nextPage, meta.limit)}
      columns={[
        { key: 'nama_supplier', label: 'Nama' },
        { key: 'jenis_barang', label: 'Jenis Barang' },
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
            <span>Master Barang</span>
            <Select
              className="text-sm"
              isMulti
              options={itemCategories.map((item) => ({ value: item.id, label: item.nama_barang }))}
              value={itemCategories.filter((item) => form.item_category_ids.includes(item.id)).map((item) => ({ value: item.id, label: item.nama_barang }))}
              onChange={(selected) => setForm({ ...form, item_category_ids: (selected || []).map((item) => item.value) })}
              placeholder="Pilih barang supplier"
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
          <button className="rounded bg-cyan-600 p-2 text-white">{editingId ? 'Simpan Perubahan' : 'Tambah'}</button>
        </form>
      </FormModal>
    </CrudTable>
  )
}
