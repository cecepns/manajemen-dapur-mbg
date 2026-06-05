import { CookingPot, Users, Truck, Wallet } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import StatsCard from '../components/StatsCard'
import KpiDashboardCards from '../components/KpiDashboardCards'
import api from '../services/api'

const PERIOD_OPTIONS = [
  { value: 'harian', label: 'Harian' },
  { value: 'mingguan', label: 'Mingguan' },
  { value: 'bulanan', label: 'Bulanan' },
]

export default function DashboardPage() {
  const [stats, setStats] = useState({ total_kitchens: 0, total_users: 0, total_couriers: 0, total_expense: 0 })
  const [kpi, setKpi] = useState([])
  const [periodRange, setPeriodRange] = useState(null)
  const [kpiPeriod, setKpiPeriod] = useState('mingguan')
  const [kpiPeriodLabel, setKpiPeriodLabel] = useState('Mingguan')
  const [refDate, setRefDate] = useState(new Date().toISOString().slice(0, 10))
  const [loadingKpi, setLoadingKpi] = useState(false)

  const fetchDashboard = async (period, date) => {
    setLoadingKpi(true)
    try {
      const params = new URLSearchParams({ period })
      if (date) params.set('date', date)
      const res = await api.get(`/dashboard?${params.toString()}`)
      const data = res.data.data || {}
      setStats(data)
      setKpi(data.kpi || [])
      setPeriodRange(data.period_range || null)
      setKpiPeriodLabel(data.kpi_period_label || period)
    } catch {
      toast.error('Gagal memuat dashboard')
    } finally {
      setLoadingKpi(false)
    }
  }

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10)
    // Initial dashboard load on mount
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDashboard('mingguan', today)
  }, [])

  const handlePeriodChange = (period) => {
    let nextDate = refDate
    if (period === 'bulanan') {
      nextDate = refDate.slice(0, 7)
    } else if (refDate.length === 7) {
      nextDate = `${refDate}-01`
    }
    setKpiPeriod(period)
    setRefDate(nextDate)
    fetchDashboard(period, nextDate)
  }

  const handleDateChange = (date) => {
    setRefDate(date)
    fetchDashboard(kpiPeriod, date)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Total Dapur" value={stats.total_kitchens} icon={CookingPot} />
        <StatsCard title="Total User" value={stats.total_users} icon={Users} />
        <StatsCard title="Total Kurir" value={stats.total_couriers} icon={Truck} />
        <StatsCard title="Total Pengeluaran" value={`Rp ${Number(stats.total_expense).toLocaleString('id-ID')}`} icon={Wallet} />
      </div>

      <KpiDashboardCards
        kpi={kpi}
        periodRange={periodRange}
        periodLabel={kpiPeriodLabel}
        loading={loadingKpi}
        period={kpiPeriod}
        refDate={refDate}
        periodOptions={PERIOD_OPTIONS}
        onPeriodChange={handlePeriodChange}
        onDateChange={handleDateChange}
      />
    </div>
  )
}
