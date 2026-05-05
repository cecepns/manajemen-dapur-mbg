import { useState } from 'react'
import { toast } from 'react-toastify'
import CrudTable from '../components/CrudTable'
import FormModal from '../components/FormModal'
import usePaginatedFetch from '../hooks/usePaginatedFetch'
import api from '../services/api'
import { toastConfirm } from '../utils/toastConfirm'

export default function KitchensPage() {
  const { data, fetchData } = usePaginatedFetch('/kitchens')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ nama_dapur: '', lokasi: '', penanggung_jawab: '' })

  const save = async (e) => {
    e.preventDefault()
    try {
      if (editingId) {
        await api.put(`/kitchens/${editingId}`, form)
        toast.success('Dapur diupdate')
      } else {
        await api.post('/kitchens', form)
        toast.success('Dapur ditambahkan')
      }
      setForm({ nama_dapur: '', lokasi: '', penanggung_jawab: '' })
      setEditingId(null)
      setIsModalOpen(false)
      fetchData()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal menyimpan')
    }
  }

  const remove = async (id) => {
    if (!(await toastConfirm('Hapus dapur ini?'))) return
    await api.delete(`/kitchens/${id}`)
    toast.success('Dapur dihapus')
    fetchData()
  }

  const openAddModal = () => {
    setEditingId(null)
    setForm({ nama_dapur: '', lokasi: '', penanggung_jawab: '' })
    setIsModalOpen(true)
  }

  const openEditModal = (row) => {
    setEditingId(row.id)
    setForm({
      nama_dapur: row.nama_dapur || '',
      lokasi: row.lokasi || '',
      penanggung_jawab: row.penanggung_jawab || '',
    })
    setIsModalOpen(true)
  }

  return (
    <CrudTable
      title="Manajemen Dapur"
      rows={data}
      columns={[
        { key: 'nama_dapur', label: 'Nama Dapur' },
        { key: 'lokasi', label: 'Lokasi' },
        { key: 'penanggung_jawab', label: 'Penanggung Jawab' },
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
      <button className="rounded bg-cyan-600 px-3 py-2 text-white" onClick={openAddModal}>Tambah Dapur</button>
      <FormModal open={isModalOpen} title={editingId ? 'Edit Dapur' : 'Tambah Dapur'} onClose={() => setIsModalOpen(false)}>
        <form onSubmit={save} className="grid gap-3">
          <label className="grid gap-1 text-sm">
            <span>Nama Dapur</span>
            <input className="rounded border p-2" value={form.nama_dapur} onChange={(e) => setForm({ ...form, nama_dapur: e.target.value })} />
          </label>
          <label className="grid gap-1 text-sm">
            <span>Lokasi</span>
            <input className="rounded border p-2" value={form.lokasi} onChange={(e) => setForm({ ...form, lokasi: e.target.value })} />
          </label>
          <label className="grid gap-1 text-sm">
            <span>Penanggung Jawab</span>
            <input className="rounded border p-2" value={form.penanggung_jawab} onChange={(e) => setForm({ ...form, penanggung_jawab: e.target.value })} />
          </label>
          <button className="rounded bg-cyan-600 p-2 text-white">{editingId ? 'Simpan Perubahan' : 'Tambah'}</button>
        </form>
      </FormModal>
    </CrudTable>
  )
}
