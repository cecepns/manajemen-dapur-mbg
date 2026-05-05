import { useEffect, useRef, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { ChevronDown, LogOut, Menu, User } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import api from '../services/api'

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}')
    } catch {
      return {}
    }
  })
  const profileRef = useRef(null)
  const navigate = useNavigate()

  const logout = () => {
    localStorage.clear()
    navigate('/login')
  }

  useEffect(() => {
    api.get('/auth/me')
      .then((res) => {
        setUser(res.data?.data || {})
        localStorage.setItem('user', JSON.stringify(res.data?.data || {}))
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!profileRef.current?.contains(event.target)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="flex bg-slate-100">
      <Sidebar
        collapsed={collapsed}
        isMobileOpen={mobileOpen}
        toggleCollapse={() => setCollapsed((v) => !v)}
        closeMobile={() => setMobileOpen(false)}
        roleName={user.role_name}
      />
      <main className="min-h-screen min-w-0 flex-1 overflow-x-hidden p-4 md:p-6">
        <div className="mb-4 flex items-center justify-between">
          <button className="rounded bg-slate-800 p-2 text-white md:hidden" onClick={() => setMobileOpen(true)} aria-label="Buka menu">
            <Menu size={18} />
          </button>
          <div className="relative ml-auto" ref={profileRef}>
            <button
              className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-slate-700 shadow-sm"
              onClick={() => setProfileOpen((v) => !v)}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-100 text-cyan-700">
                <User size={16} />
              </div>
              <div className="hidden text-left sm:block">
                <p className="text-sm font-medium leading-none">{user.nama || 'User'}</p>
                <p className="text-xs text-slate-500">{user.role_name || 'Role'}</p>
              </div>
              <ChevronDown size={16} />
            </button>

            {profileOpen && (
              <div className="absolute right-0 z-20 mt-2 w-64 rounded-xl border bg-white p-3 shadow-lg">
                <div className="mb-3 border-b pb-3">
                  <p className="text-sm font-semibold text-slate-800">{user.nama || '-'}</p>
                  <p className="text-xs text-slate-500">{user.email || '-'}</p>
                  <p className="mt-1 inline-block rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                    {user.role_name || '-'}
                  </p>
                </div>
                <button
                  className="flex w-full items-center justify-center gap-2 rounded bg-red-600 px-3 py-2 text-sm text-white"
                  onClick={logout}
                >
                  <LogOut size={15} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
        <Outlet />
      </main>
    </div>
  )
}
