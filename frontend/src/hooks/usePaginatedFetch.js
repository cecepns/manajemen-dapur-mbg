import { useCallback, useEffect, useRef, useState } from 'react'
import api from '../services/api'
import { toast } from 'react-toastify'

export default function usePaginatedFetch(endpoint) {
  const [data, setData] = useState([])
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0 })
  const [loading, setLoading] = useState(false)
  const latestMetaRef = useRef(meta)

  useEffect(() => {
    latestMetaRef.current = meta
  }, [meta])

  const fetchData = useCallback(
    async (page = latestMetaRef.current.page, limit = latestMetaRef.current.limit) => {
      setLoading(true)
      try {
        const res = await api.get(`${endpoint}?page=${page}&limit=${limit}`)
        setData(res.data.data || [])
        setMeta(res.data.meta || { page, limit, total: 0 })
      } catch (error) {
        toast.error(error.response?.data?.message || 'Gagal mengambil data')
      } finally {
        setLoading(false)
      }
    },
    [endpoint],
  )

  useEffect(() => {
    fetchData(1, 10)
  }, [fetchData])

  return { data, meta, loading, fetchData }
}
