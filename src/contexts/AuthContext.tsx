/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { authService, User } from '@/services/auth'
import {
  PermissionName,
  RoleName,
  userHasAllPermissions,
  userHasAnyPermission,
  userHasPermission,
  userHasRole,
  userIsSuperAdmin,
} from '@/lib/permissions'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  hasPermission: (permissionName: PermissionName | string) => boolean
  hasAnyPermission: (permissionNames: Array<PermissionName | string>) => boolean
  hasAllPermissions: (permissionNames: Array<PermissionName | string>) => boolean
  hasRole: (role: RoleName | string | Array<RoleName | string>) => boolean
  isSuperAdmin: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const storedUser = authService.getUser()
    const token = authService.getToken()
    
    if (storedUser && token) {
      setUser(storedUser)
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    const response = await authService.login({ email, password })
    const { token, user: userData } = response.data
    authService.setAuth(token, userData)
    setUser(userData)
  }

  const logout = async () => {
    try {
      await authService.logout()
    } catch (error) {
      console.error('Logout API error:', error)
    } finally {
      // Always clear local state regardless of API result
      authService.clearAuth()
      setUser(null)
    }
  }

  const hasPermission = (permissionName: PermissionName | string): boolean =>
    userHasPermission(user, permissionName)

  const hasAnyPermission = (permissionNames: Array<PermissionName | string>): boolean =>
    userHasAnyPermission(user, permissionNames)

  const hasAllPermissions = (permissionNames: Array<PermissionName | string>): boolean =>
    userHasAllPermissions(user, permissionNames)

  const hasRole = (role: RoleName | string | Array<RoleName | string>): boolean =>
    userHasRole(user, role)

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        hasRole,
        isSuperAdmin: userIsSuperAdmin(user),
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}