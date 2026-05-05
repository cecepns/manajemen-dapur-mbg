import { useEffect, useMemo, useState } from 'react'
import Select from 'react-select'
import { toast } from 'react-toastify'
import FormModal from '../components/FormModal'
import useKitchenOptions from '../hooks/useKitchenOptions'
import api from '../services/api'
import { toastConfirm } from '../utils/toastConfirm'

export default function CourierPage() {
  const [deliveries, setDeliveries] = useState([])
  const [couriers, setCouriers] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const kitchenOptions = useKitchenOptions()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [form, setForm] = useState({ destination: '', courier_id: null, kitchen_id: null, status: 'pending' })

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}')
    } catch {
      return {}
    }
  }, [])
  const role = String(user.role_name || '').toLowerCase()
  const canCreate = role === 'admin' || role === 'manager'

  const load = async (searchQuery = debouncedSearch) => {
    try {
      const query = new URLSearchParams()
      if (searchQuery) query.set('q', searchQuery)
      const res = await api.get(`/courier/deliveries${query.toString() ? `?${query.toString()}` : ''}`)
      setDeliveries(res.data.data || [])
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal memuat pengiriman')
    }
  }

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/courier/deliveries/${id}/status`, { status })
      toast.success('Status diperbarui')
      load(debouncedSearch)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal update status')
    }
  }

  const loadCouriers = async () => {
    try {
      const res = await api.get('/courier/couriers')
      setCouriers(res.data.data || [])
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal memuat daftar kurir')
    }
  }

  const openAddModal = () => {
    setForm({
      destination: '',
      courier_id: couriers[0]?.id || null,
      kitchen_id: role === 'manager' ? user.kitchen_id : (kitchenOptions[0]?.value || null),
      status: 'pending',
    })
    setIsModalOpen(true)
  }

  const createDelivery = async (e) => {
    e.preventDefault()
    try {
      await api.post('/courier/deliveries', form)
      toast.success('Pengiriman ditambahkan')
      setIsModalOpen(false)
      load(debouncedSearch)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal membuat pengiriman')
    }
  }

  useEffect(() => {
    load('')
    if (canCreate) loadCouriers()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 400)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    load(debouncedSearch)
  }, [debouncedSearch])

  const courierOptions = couriers.map((courier) => ({
    value: courier.id,
    label: courier.nama,
  }))

  const statusBadgeClass = (status) => {
    if (status === 'delivered') return 'bg-emerald-100 text-emerald-700'
    if (status === 'on delivery') return 'bg-amber-100 text-amber-700'
    return 'bg-slate-200 text-slate-700'
  }

  const statusLabel = (status) => {
    if (status === 'pending') return 'Menunggu'
    if (status === 'on delivery') return 'Dalam Pengantaran'
    if (status === 'delivered') return 'Terkirim'
    return status
  }

  const openCourierLocation = (delivery) => {
    if (!delivery.courier_latitude || !delivery.courier_longitude) {
      toast.error('Lokasi kurir belum tersedia')
      return
    }
    const mapsUrl = `https://www.google.com/maps?q=${delivery.courier_latitude},${delivery.courier_longitude}`
    window.open(mapsUrl, '_blank', 'noopener,noreferrer')
  }

  const resetAllStatus = async () => {
    if (!(await toastConfirm('Reset semua status pengiriman menjadi Menunggu?'))) return
    try {
      await api.post('/courier/deliveries/reset-status')
      toast.success('Semua status berhasil direset')
      load(debouncedSearch)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal reset status')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold">Pengiriman Kurir</h1>
        <div className="flex flex-wrap gap-2">
          {role === 'admin' && <button className="rounded bg-orange-600 px-3 py-2 text-white" onClick={resetAllStatus}>Reset Semua Status</button>}
          {canCreate && <button className="rounded bg-emerald-600 px-3 py-2 text-white" onClick={openAddModal}>Tambah Pengiriman</button>}
          <button className="rounded bg-cyan-600 px-3 py-2 text-white" onClick={() => load(debouncedSearch)}>Muat Data</button>
        </div>
      </div>
      <div className="rounded-xl bg-white p-4 shadow">
        <div className="mb-4 md:max-w-md">
          <label className="grid gap-1 text-sm">
            <span>Cari Pengiriman (tujuan / nama kurir)</span>
            <input
              className="rounded border p-2"
              placeholder="Ketik untuk mencari..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
        </div>
        <div className="w-full overflow-x-auto">
          <table className="min-w-[760px] text-left text-sm md:min-w-full">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-3 py-2">Tujuan</th>
                <th className="px-3 py-2">Kurir</th>
                <th className="px-3 py-2">Status Saat Ini</th>
                <th className="px-3 py-2">Ubah Status</th>
                <th className="px-3 py-2">Lokasi</th>
              </tr>
            </thead>
            <tbody>
              {deliveries.map((delivery) => (
                <tr key={delivery.id} className="border-b">
                  <td className="px-3 py-2">{delivery.destination}</td>
                  <td className="px-3 py-2">{delivery.courier_name || '-'}</td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${statusBadgeClass(delivery.status)}`}>
                      {statusLabel(delivery.status)}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <select
                      className="rounded border border-slate-300 px-2 py-1 text-xs"
                      value={delivery.status}
                      onChange={(e) => updateStatus(delivery.id, e.target.value)}
                    >
                      <option value="pending">Menunggu</option>
                      <option value="on delivery">Dalam Pengantaran</option>
                      <option value="delivered">Terkirim</option>
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <button
                      className="rounded bg-blue-600 px-3 py-1 text-xs text-white"
                      onClick={() => openCourierLocation(delivery)}
                    >
                      Lihat Lokasi Kurir
                    </button>
                  </td>
                </tr>
              ))}
              {deliveries.length === 0 && (
                <tr>
                  <td className="px-3 py-4 text-slate-500" colSpan={5}>
                    Tidak ada data pengiriman
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <FormModal open={isModalOpen} title="Tambah Pengiriman" onClose={() => setIsModalOpen(false)}>
        <form onSubmit={createDelivery} className="grid gap-3">
          <label className="grid gap-1 text-sm">
            <span>Tujuan Pengiriman</span>
            <input className="rounded border p-2" value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} />
          </label>
          <label className="grid gap-1 text-sm">
            <span>Kurir</span>
            <Select
              options={courierOptions}
              value={courierOptions.find((opt) => opt.value === form.courier_id) || null}
              onChange={(selected) => setForm({ ...form, courier_id: selected?.value || null })}
              placeholder="Pilih kurir"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span>Dapur</span>
            <Select
              isDisabled={role === 'manager'}
              options={kitchenOptions}
              value={kitchenOptions.find((opt) => opt.value === form.kitchen_id) || null}
              onChange={(selected) => setForm({ ...form, kitchen_id: selected?.value || null })}
              placeholder="Pilih dapur"
            />
          </label>
          <button className="rounded bg-cyan-600 p-2 text-white">Simpan Pengiriman</button>
        </form>
      </FormModal>
    </div>
  )
}
