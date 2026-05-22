import { Clock, FileText, Smile, TrendingDown, TrendingUp, Users } from 'lucide-react'

const kpiCards = [
  {
    number: '01',
    title: 'Penurunan Keterlambatan Distribusi',
    value: '35%',
    trend: 'down',
    description: 'penurunan keterlambatan distribusi',
    target: 'Target: ≥ 30% penurunan keterlambatan distribusi',
    icon: TrendingDown,
    accent: 'from-emerald-600 to-emerald-700',
  },
  {
    number: '02',
    title: 'Peningkatan Efisiensi Waktu Produksi',
    value: '28%',
    trend: 'up',
    description: 'peningkatan efisiensi waktu produksi',
    target: 'Target: ≥ 25% peningkatan efisiensi waktu produksi',
    icon: Clock,
    accent: 'from-green-600 to-green-700',
  },
  {
    number: '03',
    title: 'Akurasi Laporan Keuangan',
    value: '98%',
    trend: 'neutral',
    description: 'akurasi laporan keuangan',
    target: 'Target: ≥ 95% akurasi laporan keuangan',
    icon: FileText,
    accent: 'from-teal-600 to-teal-700',
  },
  {
    number: '04',
    title: 'Tingkat Penggunaan Aplikasi',
    value: '90%',
    trend: 'up',
    description: 'tingkat penggunaan aplikasi oleh pengguna',
    target: 'Target: ≥ 85% tingkat penggunaan aplikasi',
    icon: Users,
    accent: 'from-cyan-600 to-cyan-700',
  },
  {
    number: '05',
    title: 'Kepuasan Pengguna Sistem',
    value: '4.6 / 5',
    trend: 'up',
    description: 'tingkat kepuasan pengguna',
    target: 'Target: ≥ 4.5 dari 5 tingkat kepuasan pengguna',
    icon: Smile,
    accent: 'from-lime-600 to-lime-700',
  },
]

const impacts = [
  'Operasional lebih efisien dan terkontrol',
  'Pengambilan keputusan lebih cepat dan akurat',
  'Transparansi dan akuntabilitas meningkat',
  'Kepuasan pengguna dan kualitas layanan meningkat',
  'Kinerja SPPG semakin optimal dan berkelanjutan',
]

export default function KpiPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-gradient-to-r from-emerald-800 to-emerald-900 p-6 text-white">
        <p className="text-xs uppercase tracking-widest text-emerald-200">SPPG SmartOps</p>
        <h1 className="mt-1 text-2xl font-bold md:text-3xl">Key Performance Indicators (KPI)</h1>
        <p className="mt-3 max-w-3xl text-sm text-emerald-100">
          KPI digunakan untuk mengukur keberhasilan implementasi SPPG SmartOps dalam meningkatkan kinerja operasional secara terukur dan berkelanjutan.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {kpiCards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.number} className="overflow-hidden rounded-xl border bg-white shadow-sm">
              <div className={`bg-gradient-to-r ${card.accent} px-4 py-3 text-white`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold opacity-90">{card.number}</span>
                  <Icon size={20} />
                </div>
                <h2 className="mt-1 text-sm font-medium leading-snug">{card.title}</h2>
              </div>
              <div className="space-y-3 p-4">
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-bold text-emerald-800">{card.value}</span>
                  {card.trend === 'up' && <TrendingUp className="mb-1 text-emerald-600" size={18} />}
                  {card.trend === 'down' && <TrendingDown className="mb-1 text-emerald-600" size={18} />}
                </div>
                <p className="text-sm text-slate-600">{card.description}</p>
                <div className="h-2 rounded-full bg-slate-100">
                  <div className="h-2 rounded-full bg-emerald-500" style={{ width: card.trend === 'neutral' ? '98%' : '85%' }} />
                </div>
                <p className="text-xs text-slate-500">{card.target}</p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-emerald-900">Dampak yang Diharapkan</h3>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {impacts.map((item) => (
            <li key={item} className="flex items-start gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
              <TrendingUp size={16} className="mt-0.5 shrink-0 text-emerald-600" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
