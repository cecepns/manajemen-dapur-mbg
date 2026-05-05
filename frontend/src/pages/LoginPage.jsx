import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import api from '../services/api'
import logo from '../assets/logo.png'

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.post('/auth/login', form)
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      toast.success('Login berhasil')
      const role = String(res.data?.user?.role_name || '').toLowerCase()
      if (role === 'kurir') navigate('/courier')
      else navigate('/')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login gagal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <form onSubmit={submit} className="w-full max-w-md space-y-4 rounded-xl bg-white p-6 shadow">
        <div className="flex flex-col items-center gap-3">
          <img src={logo} alt="Logo Badan Gizi Nasional" className="h-20 w-20 object-contain" />
          <h1 className="text-center text-2xl font-semibold">Manajemen Dapur MBG</h1>
        </div>
        <input className="w-full rounded border p-2" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input className="w-full rounded border p-2" type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <button disabled={loading} className="w-full rounded bg-cyan-600 p-2 text-white">{loading ? 'Memproses...' : 'Masuk'}</button>
      </form>
    </div>
  )
}
