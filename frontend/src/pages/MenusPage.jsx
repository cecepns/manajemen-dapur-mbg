import { useEffect, useState } from 'react'
import Select from 'react-select'
import { toast } from 'react-toastify'
import CrudTable from '../components/CrudTable'
import FormModal from '../components/FormModal'
import useKitchenOptions from '../hooks/useKitchenOptions'
import usePaginatedFetch from '../hooks/usePaginatedFetch'
import api from '../services/api'
import { toastConfirm } from '../utils/toastConfirm'

export default function MenusPage() {
  const { data, fetchData } = usePaginatedFetch('/menus')
  const kitchenOptions = useKitchenOptions()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ hari: 'Senin', nama_menu: '', deskripsi: '', estimasi_porsi: 0, kitchen_ids: [], waktu_persiapan: 0, waktu_memasak: 0, waktu_distribusi: 0 })

  useEffect(() => {
    if (kitchenOptions.length) setForm((prev) => ({ ...prev, kitchen_ids: [kitchenOptions[0].value] }))
  }, [kitchenOptions])

  const save = async (e) => {
    e.preventDefault()
    try {
      if (editingId) {
        await api.put(`/menus/${editingId}`, form)
        toast.success('Menu diupdate')
      } else {
        await api.post('/menus', form)
        toast.success('Menu ditambahkan')
      }
      setForm({ ...form, nama_menu: '', deskripsi: '', kitchen_ids: kitchenOptions[0] ? [kitchenOptions[0].value] : [] })
      setEditingId(null)
      setIsModalOpen(false)
      fetchData()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal menyimpan menu')
    }
  }

  const openAddModal = () => {
    setEditingId(null)
    setForm((prev) => ({ ...prev, nama_menu: '', deskripsi: '', estimasi_porsi: 0, kitchen_ids: kitchenOptions[0] ? [kitchenOptions[0].value] : [] }))
    setIsModalOpen(true)
  }

  const openEditModal = (row) => {
    setEditingId(row.id)
    setForm((prev) => ({
      ...prev,
      hari: row.hari || 'Senin',
      nama_menu: row.nama_menu || '',
      deskripsi: row.deskripsi || '',
      estimasi_porsi: row.estimasi_porsi || 0,
      kitchen_ids: row.kitchen_ids ? String(row.kitchen_ids).split(',').map(Number).filter(Boolean) : (prev.kitchen_ids.length ? prev.kitchen_ids : (kitchenOptions[0] ? [kitchenOptions[0].value] : [])),
      waktu_persiapan: row.waktu_persiapan || 0,
      waktu_memasak: row.waktu_memasak || 0,
      waktu_distribusi: row.waktu_distribusi || 0,
    }))
    setIsModalOpen(true)
  }

  const remove = async (id) => {
    if (!(await toastConfirm('Hapus menu ini?'))) return
    try {
      await api.delete(`/menus/${id}`)
      toast.success('Menu dihapus')
      fetchData()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal menghapus menu')
    }
  }

  return (
    <CrudTable
      title="Menu Mingguan"
      rows={data}
      columns={[
        { key: 'hari', label: 'Hari' },
        { key: 'nama_menu', label: 'Nama Menu' },
        { key: 'estimasi_porsi', label: 'Porsi' },
        { key: 'kitchen_names', label: 'Dapur' },
        { key: 'total_waktu', label: 'Total Waktu (menit)' },
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
      <button className="rounded bg-cyan-600 px-3 py-2 text-white" onClick={openAddModal}>Tambah Menu</button>
      <FormModal open={isModalOpen} title={editingId ? 'Edit Menu' : 'Tambah Menu'} onClose={() => setIsModalOpen(false)}>
        <form onSubmit={save} className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-1 text-sm">
            <span>Hari</span>
            <input className="rounded border p-2" value={form.hari} onChange={(e) => setForm({ ...form, hari: e.target.value })} />
          </label>
          <label className="grid gap-1 text-sm">
            <span>Estimasi Porsi</span>
            <input className="rounded border p-2" type="number" min="0" value={form.estimasi_porsi} onChange={(e) => setForm({ ...form, estimasi_porsi: Number(e.target.value) })} />
          </label>
          <label className="grid gap-1 text-sm md:col-span-2">
            <span>Nama Menu</span>
            <input className="rounded border p-2" value={form.nama_menu} onChange={(e) => setForm({ ...form, nama_menu: e.target.value })} />
          </label>
          <label className="grid gap-1 text-sm md:col-span-2">
            <span>Deskripsi</span>
            <input className="rounded border p-2" value={form.deskripsi} onChange={(e) => setForm({ ...form, deskripsi: e.target.value })} />
          </label>
          <label className="grid gap-1 text-sm">
            <span>Dapur</span>
            <Select
              className="text-sm"
              isMulti
              options={kitchenOptions}
              value={kitchenOptions.filter((option) => form.kitchen_ids.includes(option.value))}
              onChange={(selected) => setForm({ ...form, kitchen_ids: (selected || []).map((item) => item.value) })}
              placeholder="Pilih satu atau banyak dapur"
            />
            <div className="mt-1 flex gap-2">
              <button
                type="button"
                className="rounded bg-slate-200 px-2 py-1 text-xs"
                onClick={() => setForm({ ...form, kitchen_ids: kitchenOptions.map((opt) => opt.value) })}
              >
                Select All
              </button>
              <button
                type="button"
                className="rounded bg-slate-200 px-2 py-1 text-xs"
                onClick={() => setForm({ ...form, kitchen_ids: [] })}
              >
                Unselect All
              </button>
            </div>
          </label>
          <label className="grid gap-1 text-sm">
            <span>Waktu Persiapan (menit)</span>
            <input className="rounded border p-2" type="number" min="0" value={form.waktu_persiapan} onChange={(e) => setForm({ ...form, waktu_persiapan: Number(e.target.value) })} />
          </label>
          <label className="grid gap-1 text-sm">
            <span>Waktu Memasak (menit)</span>
            <input className="rounded border p-2" type="number" min="0" value={form.waktu_memasak} onChange={(e) => setForm({ ...form, waktu_memasak: Number(e.target.value) })} />
          </label>
          <label className="grid gap-1 text-sm">
            <span>Waktu Distribusi (menit)</span>
            <input className="rounded border p-2" type="number" min="0" value={form.waktu_distribusi} onChange={(e) => setForm({ ...form, waktu_distribusi: Number(e.target.value) })} />
          </label>
          <button className="rounded bg-cyan-600 p-2 text-white md:col-span-2">{editingId ? 'Simpan Perubahan' : 'Tambah'}</button>
        </form>
      </FormModal>
    </CrudTable>
  )
}
