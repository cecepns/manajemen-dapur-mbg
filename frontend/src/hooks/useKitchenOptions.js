import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import api from '../services/api'

export default function useKitchenOptions({ enabled = true, silent = false } = {}) {
  const [kitchenOptions, setKitchenOptions] = useState([])

  useEffect(() => {
    if (!enabled) {
      setKitchenOptions([])
      return
    }

    const fetchKitchens = async () => {
      try {
        const res = await api.get('/kitchens?page=1&limit=10')
        const options = (res.data?.data || []).map((kitchen) => ({
          value: kitchen.id,
          label: kitchen.nama_dapur,
        }))
        setKitchenOptions(options)
      } catch {
        if (!silent) toast.error('Gagal memuat daftar dapur')
      }
    }
    fetchKitchens()
  }, [enabled, silent])

  return kitchenOptions
}
