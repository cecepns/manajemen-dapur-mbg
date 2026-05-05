import { useState } from 'react'
import { LocateFixed } from 'lucide-react'
import { toast } from 'react-toastify'
import CrudTable from '../components/CrudTable'
import FormModal from '../components/FormModal'
import usePaginatedFetch from '../hooks/usePaginatedFetch'
import api from '../services/api'
import { toastConfirm } from '../utils/toastConfirm'

export default function TrackingPage() {
  const { data, meta, fetchData } = usePaginatedFetch('/tracking/history')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isGettingGps, setIsGettingGps] = useState(false)
  const [coords, setCoords] = useState({ latitude: '', longitude: '' })
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}')
    } catch {
      return {}
    }
  })()
  const isAdmin = String(user.role_name || '').toLowerCase() === 'admin'

  const formatTimestamp = (value) => {
    if (!value) return '-'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return new Intl.DateTimeFormat('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'medium',
      timeZone: 'Asia/Jakarta',
    }).format(date)
  }

  const sendLocation = async () => {
    await api.post('/tracking/update-location', {
      latitude: Number(coords.latitude),
      longitude: Number(coords.longitude),
    })
    toast.success('Lokasi terupdate')
    setIsModalOpen(false)
    fetchData()
  }

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Browser tidak mendukung GPS')
      return
    }

    setIsGettingGps(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          latitude: String(position.coords.latitude),
          longitude: String(position.coords.longitude),
        })
        setIsGettingGps(false)
        toast.success('Lokasi berhasil diambil')
      },
      (error) => {
        setIsGettingGps(false)
        if (error.code === error.PERMISSION_DENIED) {
          toast.error('Izin lokasi ditolak')
        } else {
          toast.error('Gagal mengambil lokasi GPS')
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    )
  }

  const openInMaps = (latitude, longitude) => {
    if (!latitude || !longitude) {
      toast.error('Koordinat tidak valid')
      return
    }
    const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`
    window.open(mapsUrl, '_blank', 'noopener,noreferrer')
  }

  const removeTracking = async (id) => {
    if (!(await toastConfirm('Hapus data tracking ini?'))) return
    try {
      await api.delete(`/tracking/${id}`)
      toast.success('Data tracking dihapus')
      fetchData()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal menghapus data')
    }
  }

  return (
    <CrudTable
      title="Tracking GPS"
      rows={data}
      meta={meta}
      onPageChange={(nextPage) => fetchData(nextPage, meta.limit)}
      columns={[
        { key: 'nama', label: 'User' },
        { key: 'latitude', label: 'Latitude' },
        { key: 'longitude', label: 'Longitude' },
        { key: 'timestamp', label: 'Timestamp', render: (row) => formatTimestamp(row.timestamp) },
        {
          key: 'aksi',
          label: 'Aksi',
          render: (row) => (
            <div className="flex gap-2">
              <button
                className="rounded bg-blue-600 px-2 py-1 text-xs text-white"
                onClick={() => openInMaps(row.latitude, row.longitude)}
              >
                Lihat di Maps
              </button>
              {isAdmin && (
                <button
                  className="rounded bg-red-600 px-2 py-1 text-xs text-white"
                  onClick={() => removeTracking(row.id)}
                >
                  Hapus
                </button>
              )}
            </div>
          ),
        },
      ]}
    >
      <button className="rounded bg-cyan-600 px-3 py-2 text-white" onClick={() => setIsModalOpen(true)}>Update Lokasi</button>
      <FormModal open={isModalOpen} title="Update Lokasi GPS" onClose={() => setIsModalOpen(false)}>
        <div className="grid gap-3">
          <button
            className="flex items-center justify-center gap-2 rounded bg-slate-700 p-2 text-white"
            onClick={useMyLocation}
            disabled={isGettingGps}
          >
            <LocateFixed size={16} />
            {isGettingGps ? 'Mengambil Lokasi...' : 'Gunakan Lokasi Saya'}
          </button>
          <label className="grid gap-1 text-sm">
            <span>Latitude</span>
            <input className="rounded border p-2" value={coords.latitude} onChange={(e) => setCoords({ ...coords, latitude: e.target.value })} />
          </label>
          <label className="grid gap-1 text-sm">
            <span>Longitude</span>
            <input className="rounded border p-2" value={coords.longitude} onChange={(e) => setCoords({ ...coords, longitude: e.target.value })} />
          </label>
          <button className="rounded bg-cyan-600 p-2 text-white" onClick={sendLocation}>Simpan Lokasi</button>
        </div>
      </FormModal>
    </CrudTable>
  )
}
