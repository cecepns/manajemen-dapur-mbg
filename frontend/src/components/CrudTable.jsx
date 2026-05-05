export default function CrudTable({ title, columns, rows, children, meta, onPageChange, loading = false }) {
  const page = Number(meta?.page || 1)
  const limit = Number(meta?.limit || rows.length || 10)
  const total = Number(meta?.total || rows.length || 0)
  const totalPages = Math.max(1, Math.ceil(total / (limit || 1)))
  const canPaginate = Boolean(onPageChange) && totalPages > 1

  return (
    <section className="min-w-0 rounded-xl bg-white p-4 shadow">
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      {children}
      <div className="mt-4 w-full overflow-x-auto">
        <table className="min-w-[640px] text-left text-sm md:min-w-full">
          <thead className="bg-slate-100">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="px-3 py-2">{column.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.id || index} className="border-b">
                {columns.map((column) => (
                  <td key={column.key} className="px-3 py-2">{column.render ? column.render(row) : row[column.key]}</td>
                ))}
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr>
                <td className="px-3 py-4 text-slate-500" colSpan={columns.length}>Belum ada data</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {canPaginate && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-slate-600">
            Halaman {page} dari {totalPages} - Total {total} data
          </p>
          <div className="flex items-center gap-2">
            <button
              className="rounded border border-slate-300 px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1 || loading}
            >
              Sebelumnya
            </button>
            <button
              className="rounded border border-slate-300 px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages || loading}
            >
              Selanjutnya
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
