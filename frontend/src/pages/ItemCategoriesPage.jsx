import { useEffect, useState } from 'react'
import Select from 'react-select'
import { toast } from 'react-toastify'
import CrudTable from '../components/CrudTable'
import FormModal from '../components/FormModal'
import useKitchenOptions from '../hooks/useKitchenOptions'
import usePaginatedFetch from '../hooks/usePaginatedFetch'
import api from '../services/api'
import { toastConfirm } from '../utils/toastConfirm'

export default function ItemCategoriesPage() {
  const { data, meta, fetchData } = usePaginatedFetch('/item-categories')
  const kitchenOptions = useKitchenOptions()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ nama_barang: '', kitchen_id: 1 })

  useEffect(() => {
    if (kitchenOptions.length) setForm((prev) => ({ ...prev, kitchen_id: kitchenOptions[0].value }))
  }, [kitchenOptions])

  const save = async (e) => {
    e.preventDefault()
    try {
      if (editingId) {
        await api.put(`/item-categories/${editingId}`, form)
        toast.success('Barang diupdate')
      } else {
        await api.post('/item-categories', form)
        toast.success('Barang ditambahkan')
      }
      setForm((prev) => ({ ...prev, nama_barang: '' }))
      setEditingId(null)
      setIsModalOpen(false)
      fetchData()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal menyimpan barang')
    }
  }

  const openAddModal = () => {
    setEditingId(null)
    setForm((prev) => ({ ...prev, nama_barang: '' }))
    setIsModalOpen(true)
  }

  const openEditModal = (row) => {
    setEditingId(row.id)
    setForm((prev) => ({
      ...prev,
      nama_barang: row.nama_barang || '',
      kitchen_id: row.kitchen_id || prev.kitchen_id,
    }))
    setIsModalOpen(true)
  }

  const remove = async (id) => {
    if (!(await toastConfirm('Hapus barang ini?'))) return
    try {
      await api.delete(`/item-categories/${id}`)
      toast.success('Barang dihapus')
      fetchData()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal menghapus barang')
    }
  }

  return (
    <CrudTable
      title="Master Barang"
      rows={data}
      meta={meta}
      onPageChange={(nextPage) => fetchData(nextPage, meta.limit)}
      columns={[
        { key: 'nama_barang', label: 'Nama Barang' },
        { key: 'kitchen_name', label: 'Dapur' },
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
      <button className="rounded bg-cyan-600 px-3 py-2 text-white" onClick={openAddModal}>Tambah Barang</button>
      <FormModal open={isModalOpen} title={editingId ? 'Edit Barang' : 'Tambah Barang'} onClose={() => setIsModalOpen(false)}>
        <form onSubmit={save} className="grid gap-3">
          <label className="grid gap-1 text-sm">
            <span>Nama Barang</span>
            <input className="rounded border p-2" value={form.nama_barang} onChange={(e) => setForm({ ...form, nama_barang: e.target.value })} />
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
