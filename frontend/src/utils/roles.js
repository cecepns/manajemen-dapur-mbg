export const ROLES = {
  ADMIN: 'admin',
  KEPALA_SPPG: 'kepala sppg',
  KEUANGAN: 'keuangan',
  AHLI_GIZI: 'ahli gizi',
  STAFF: 'staff',
  KURIR: 'kurir',
}

export function normalizeRole(roleName) {
  return String(roleName || '').toLowerCase().trim()
}

export function isFullAccess(roleName) {
  const role = normalizeRole(roleName)
  return role === ROLES.ADMIN || role === ROLES.KEPALA_SPPG
}

export function getDefaultRouteByRole(roleName) {
  const role = normalizeRole(roleName)
  if (role === ROLES.KURIR || role === ROLES.STAFF) return '/courier'
  if (role === ROLES.KEUANGAN) return '/finance'
  if (role === ROLES.AHLI_GIZI) return '/menus'
  return '/'
}

export const MENU_ACCESS = {
  '/': [ROLES.ADMIN, ROLES.KEPALA_SPPG],
  '/kitchens': [ROLES.ADMIN, ROLES.KEPALA_SPPG, ROLES.AHLI_GIZI],
  '/users': [ROLES.ADMIN, ROLES.KEPALA_SPPG],
  '/menus': [ROLES.ADMIN, ROLES.KEPALA_SPPG, ROLES.AHLI_GIZI],
  '/item-categories': [ROLES.ADMIN, ROLES.KEPALA_SPPG],
  '/suppliers': [ROLES.ADMIN, ROLES.KEPALA_SPPG, ROLES.AHLI_GIZI],
  '/finance': [ROLES.ADMIN, ROLES.KEPALA_SPPG, ROLES.KEUANGAN],
  '/tracking': [ROLES.ADMIN, ROLES.KEPALA_SPPG],
  '/courier': [ROLES.ADMIN, ROLES.KEPALA_SPPG, ROLES.STAFF, ROLES.KURIR],
}

export function canAccessRoute(roleName, path) {
  const role = normalizeRole(roleName)
  const allowed = MENU_ACCESS[path] || []
  return allowed.includes(role)
}
