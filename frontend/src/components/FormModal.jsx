export default function FormModal({ open, title, onClose, children }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button className="rounded bg-slate-200 px-3 py-1 text-sm" onClick={onClose}>
            Tutup
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
