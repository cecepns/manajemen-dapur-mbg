export default function CrudTable({ title, columns, rows, children }) {
  return (
    <section className="rounded-xl bg-white p-4 shadow">
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      {children}
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
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
            {rows.length === 0 && (
              <tr>
                <td className="px-3 py-4 text-slate-500" colSpan={columns.length}>Belum ada data</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
