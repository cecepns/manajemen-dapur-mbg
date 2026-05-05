import { toast } from 'react-toastify'

export function toastConfirm(message) {
  return new Promise((resolve) => {
    const id = toast.info(
      <div className="space-y-3">
        <p className="text-sm">{message}</p>
        <div className="flex gap-2">
          <button className="rounded bg-red-600 px-3 py-1 text-white" onClick={() => { toast.dismiss(id); resolve(true) }}>Ya</button>
          <button className="rounded bg-slate-500 px-3 py-1 text-white" onClick={() => { toast.dismiss(id); resolve(false) }}>Batal</button>
        </div>
      </div>,
      { autoClose: false, closeOnClick: false },
    )
  })
}
