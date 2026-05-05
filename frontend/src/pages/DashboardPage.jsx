import { CookingPot, Users, Truck, Wallet } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import StatsCard from '../components/StatsCard'
import api from '../services/api'

export default function DashboardPage() {
  const [stats, setStats] = useState({ total_kitchens: 0, total_users: 0, total_couriers: 0, total_expense: 0 })

  useEffect(() => {
    api.get('/dashboard').then((res) => setStats(res.data.data)).catch(() => toast.error('Gagal memuat dashboard'))
  }, [])

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Total Dapur" value={stats.total_kitchens} icon={CookingPot} />
        <StatsCard title="Total User" value={stats.total_users} icon={Users} />
        <StatsCard title="Total Kurir" value={stats.total_couriers} icon={Truck} />
        <StatsCard title="Total Pengeluaran" value={`Rp ${Number(stats.total_expense).toLocaleString('id-ID')}`} icon={Wallet} />
      </div>
    </div>
  )
}
