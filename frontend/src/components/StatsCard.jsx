export default function StatsCard({ title, value, icon: Icon }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{title}</p>
        <Icon className="text-cyan-600" size={18} />
      </div>
      <h3 className="mt-2 text-2xl font-semibold">{value}</h3>
    </div>
  )
}
