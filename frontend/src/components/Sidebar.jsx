import { NavLink } from 'react-router-dom'
import {
  House,
  CookingPot,
  Users,
  UtensilsCrossed,
  Truck,
  Wallet,
  MapPinned,
  Menu,
  X,
} from 'lucide-react'
import logo from '../assets/logo.png'

const menus = [
  { to: '/', label: 'Dashboard', icon: House, roles: ['admin', 'manager', 'staff'] },
  { to: '/kitchens', label: 'Dapur', icon: CookingPot, roles: ['admin'] },
  { to: '/users', label: 'User', icon: Users, roles: ['admin'] },
  { to: '/menus', label: 'Menu', icon: UtensilsCrossed, roles: ['admin', 'manager', 'staff'] },
  { to: '/suppliers', label: 'Supplier', icon: Truck, roles: ['admin', 'manager', 'staff'] },
  { to: '/finance', label: 'Keuangan', icon: Wallet, roles: ['admin', 'manager'] },
  { to: '/tracking', label: 'Tracking', icon: MapPinned, roles: ['admin', 'manager', 'kurir'] },
  { to: '/courier', label: 'Kurir', icon: Truck, roles: ['admin', 'manager', 'kurir'] },
]

export default function Sidebar({ collapsed, isMobileOpen, toggleCollapse, closeMobile, roleName }) {
  const role = String(roleName || '').toLowerCase()
  const allowedMenus = menus.filter((item) => item.roles.includes(role))

  return (
    <>
      {isMobileOpen && <button className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={closeMobile} aria-label="Tutup sidebar" />}
      <aside className={`fixed left-0 top-0 z-40 min-h-screen bg-slate-900 p-4 text-white transition-all duration-300 md:static ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} ${collapsed ? 'w-20' : 'w-64'}`}>
        <div className={`mb-4 flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
          <img src={logo} alt="Logo Badan Gizi Nasional" className="h-10 w-10 rounded-full object-cover" />
          {!collapsed && <p className="text-sm font-semibold leading-tight">Manajemen Dapur MBG</p>}
        </div>
        <div className="mb-6 flex items-center justify-between">
          <button className="flex items-center gap-2 rounded bg-slate-700 p-2" onClick={toggleCollapse}>
            <Menu size={18} />
            {!collapsed && <span>Menu</span>}
          </button>
          <button className="rounded bg-slate-700 p-2 md:hidden" onClick={closeMobile} aria-label="Close">
            <X size={16} />
          </button>
        </div>
      <nav className="space-y-1">
        {allowedMenus.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={closeMobile}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded px-3 py-2 text-sm ${isActive ? 'bg-cyan-600' : 'hover:bg-slate-800'}`
              }
            >
              <Icon size={18} />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          )
        })}
      </nav>
      </aside>
    </>
  )
}
