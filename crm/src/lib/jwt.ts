export type CrmRole = 'superadmin' | 'admin' | 'support' | 'operator' | 'tester' | string

export function decodeJwtClaims(token?: string | null): { username: string | null; role: CrmRole | null } {
  try {
    if (!token) return { username: null, role: null }
    const parts = token.split('.')
    if (parts.length < 2) return { username: null, role: null }

    const payload = parts[1]
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)
    const json = window.atob(padded)
    const data = JSON.parse(json)

    const username =
      typeof data?.username === 'string'
        ? data.username
        : typeof data?.adminUsername === 'string'
          ? data.adminUsername
          : typeof data?.login === 'string'
            ? data.login
            : null

    const role =
      typeof data?.role === 'string'
        ? data.role
        : typeof data?.adminRole === 'string'
          ? data.adminRole
          : null

    return { username, role }
  } catch {
    return { username: null, role: null }
  }
}

export function normalizeCrmRole(role: CrmRole | null | undefined): 'superadmin' | 'admin' | 'support' | 'operator' | 'tester' | null {
  if (!role) return null
  const r = String(role).toLowerCase()
  if (r === 'superadmin') return 'superadmin'
  if (r === 'admin') return 'admin'
  if (r === 'support') return 'support'
  if (r === 'operator') return 'operator'
  if (r === 'tester') return 'tester'
  return null
}
