import { useState } from 'react'
import Select from 'react-select'
import { toast } from 'react-toastify'
import CrudTable from '../components/CrudTable'
import FormModal from '../components/FormModal'
import usePaginatedFetch from '../hooks/usePaginatedFetch'
import useKitchenOptions from '../hooks/useKitchenOptions'
import api from '../services/api'
import { toastConfirm } from '../utils/toastConfirm'

export default function UsersPage() {
  const { data, fetchData } = usePaginatedFetch('/users')
  const kitchenOptions = useKitchenOptions()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ nama: '', email: '', password: '', role_id: 3, kitchen_id: 1, status_aktif: 1 })

  const save = async (e) => {
    e.preventDefault()
    try {
      if (editingId) {
        await api.put(`/users/${editingId}`, {
          nama: form.nama,
          role_id: form.role_id,
          kitchen_id: form.kitchen_id || kitchenOptions[0]?.value || 1,
          status_aktif: form.status_aktif,
          password: form.password,
        })
        toast.success('User diupdate')
      } else {
        await api.post('/users', {
          ...form,
          kitchen_id: form.kitchen_id || kitchenOptions[0]?.value || 1,
        })
        toast.success('User ditambahkan')
      }
      setForm({ ...form, nama: '', email: '', password: '' })
      setEditingId(null)
      setIsModalOpen(false)
      fetchData()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal menyimpan user')
    }
  }

  const remove = async (id) => {
    if (!(await toastConfirm('Hapus user ini?'))) return
    try {
      await api.delete(`/users/${id}`)
      toast.success('User dihapus')
      fetchData()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal menghapus user')
    }
  }

  const openAddModal = () => {
    setEditingId(null)
    setForm((prev) => ({ ...prev, nama: '', email: '', password: '', kitchen_id: kitchenOptions[0]?.value || 1 }))
    setIsModalOpen(true)
  }

  const openEditModal = (row) => {
    setEditingId(row.id)
    setForm((prev) => ({
      ...prev,
      nama: row.nama || '',
      email: row.email || '',
      password: '',
      role_id: Number(row.role_id) || 3,
      kitchen_id: row.kitchen_id || prev.kitchen_id,
      status_aktif: row.status_aktif ? 1 : 0,
    }))
    setIsModalOpen(true)
  }

  return (
    <CrudTable
      title="Manajemen User"
      rows={data}
      columns={[
        { key: 'nama', label: 'Nama' },
        { key: 'email', label: 'Email' },
        { key: 'role_name', label: 'Role' },
        { key: 'kitchen_name', label: 'Dapur' },
        { key: 'status_aktif', label: 'Status', render: (row) => (row.status_aktif ? 'Aktif' : 'Nonaktif') },
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
      <button className="rounded bg-cyan-600 px-3 py-2 text-white" onClick={openAddModal}>Tambah User</button>
      <FormModal open={isModalOpen} title={editingId ? 'Edit User' : 'Tambah User'} onClose={() => setIsModalOpen(false)}>
        <form onSubmit={save} className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-1 text-sm md:col-span-2">
            <span>Nama</span>
            <input className="rounded border p-2" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} />
          </label>
          <label className="grid gap-1 text-sm">
            <span>Email</span>
            <input className="rounded border p-2 disabled:bg-slate-100" value={form.email} disabled={Boolean(editingId)} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </label>
          <label className="grid gap-1 text-sm">
            <span>{editingId ? 'Password Baru (opsional)' : 'Password'}</span>
            <input className="rounded border p-2" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder={editingId ? 'Kosongkan jika tidak diubah' : ''} />
          </label>
          <label className="grid gap-1 text-sm">
            <span>Role</span>
            <select className="rounded border p-2" value={form.role_id} onChange={(e) => setForm({ ...form, role_id: Number(e.target.value) })}>
              <option value={1}>Admin</option><option value={2}>Manager</option><option value={3}>Staff</option><option value={4}>Kurir</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span>Dapur</span>
            <Select
              className="text-sm"
              options={kitchenOptions}
              value={kitchenOptions.find((option) => option.value === form.kitchen_id) || kitchenOptions[0] || null}
              onChange={(selected) => setForm({ ...form, kitchen_id: selected?.value || 1 })}
              placeholder="Pilih Dapur"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span>Status Aktif</span>
            <select className="rounded border p-2" value={form.status_aktif} onChange={(e) => setForm({ ...form, status_aktif: Number(e.target.value) })}>
              <option value={1}>Aktif</option>
              <option value={0}>Nonaktif</option>
            </select>
          </label>
          <button className="rounded bg-cyan-600 p-2 text-white md:col-span-2">{editingId ? 'Simpan Perubahan' : 'Tambah'}</button>
        </form>
      </FormModal>
    </CrudTable>
  )
}
