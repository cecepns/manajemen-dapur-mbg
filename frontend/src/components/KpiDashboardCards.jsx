import { Clock, FileText, Smile, TrendingDown, TrendingUp, Users } from 'lucide-react'

const ICONS = {
  delivery: TrendingDown,
  production: Clock,
  finance: FileText,
  usage: Users,
  satisfaction: Smile,
}

const ACCENTS = {
  delivery: 'from-emerald-600 to-emerald-700',
  production: 'from-green-600 to-green-700',
  finance: 'from-teal-600 to-teal-700',
  usage: 'from-cyan-600 to-cyan-700',
  satisfaction: 'from-lime-600 to-lime-700',
}

export default function KpiDashboardCards({
  kpi = [],
  periodRange,
  periodLabel = 'Mingguan',
  loading = false,
  period = 'mingguan',
  refDate = '',
  periodOptions = [],
  onPeriodChange,
  onDateChange,
}) {
  const dateInputType = period === 'bulanan' ? 'month' : 'date'
  const dateValue = period === 'bulanan' ? refDate.slice(0, 7) : refDate

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-emerald-900">Key Performance Indicators</h2>
          <p className="text-sm text-slate-500">
            Penilaian operasional {periodLabel.toLowerCase()} (Senin–Jumat)
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex rounded-lg border bg-white p-1">
            {periodOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`rounded-md px-3 py-1.5 text-sm transition ${period === option.value ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                onClick={() => onPeriodChange?.(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
          <label className="grid gap-1 text-sm">
            <span className="text-slate-600">{period === 'bulanan' ? 'Bulan' : 'Tanggal'}</span>
            <input
              className="rounded border p-2"
              type={dateInputType}
              value={dateValue}
              onChange={(e) => onDateChange?.(e.target.value)}
            />
          </label>
          {periodRange && (
            <p className="text-xs text-slate-500">
              Periode: {periodRange.start}{periodRange.start !== periodRange.end ? ` s/d ${periodRange.end}` : ''}
            </p>
          )}
        </div>
      </div>

      {loading && (
        <p className="text-sm text-slate-500">Memuat data KPI...</p>
      )}

      {!loading && !kpi.length && (
        <p className="rounded-lg border bg-slate-50 p-4 text-sm text-slate-500">Belum ada data KPI untuk periode ini.</p>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {kpi.map((card, index) => {
          const Icon = ICONS[card.id] || TrendingUp
          const accent = ACCENTS[card.id] || 'from-emerald-600 to-emerald-700'
          return (
            <div key={card.id} className="overflow-hidden rounded-xl border bg-white shadow-sm">
              <div className={`bg-gradient-to-r ${accent} px-4 py-3 text-white`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold opacity-90">{String(index + 1).padStart(2, '0')}</span>
                  <Icon size={20} />
                </div>
                <h3 className="mt-1 text-sm font-medium leading-snug">{card.title}</h3>
              </div>
              <div className="space-y-3 p-4">
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-bold text-emerald-800">{card.display}</span>
                  {card.trend === 'up' && <TrendingUp className="mb-1 text-emerald-600" size={18} />}
                  {card.trend === 'down' && <TrendingDown className="mb-1 text-emerald-600" size={18} />}
                  {card.met && <span className="mb-1 rounded bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">Memenuhi</span>}
                </div>
                <p className="text-sm text-slate-600">{card.description}</p>
                <div className="h-2 rounded-full bg-slate-100">
                  <div
                    className={`h-2 rounded-full transition-all ${card.met ? 'bg-emerald-500' : 'bg-amber-500'}`}
                    style={{ width: `${Math.min(100, card.value)}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500">{card.targetLabel}</p>
                {card.detail && <p className="text-xs text-slate-400">{card.detail}</p>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
