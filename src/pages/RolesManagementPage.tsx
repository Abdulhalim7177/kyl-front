import { useState, useEffect } from 'react'
import { roleService, Role, Module } from '@/services/roles'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, Shield, Plus, ChevronRight, Lock } from 'lucide-react'

export default function RolesManagementPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [modules, setModules] = useState<Module[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [rolePermissions, setRolePermissions] = useState<Set<number>>(new Set())
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    try {
      setLoading(true)
      const [rolesData, modulesData] = await Promise.all([
        roleService.getUserRoles(),
        roleService.getModules().catch(() => []) // Fallback if get-modules is not yet implemented
      ])
      setRoles(rolesData)
      setModules(modulesData)
      
      if (rolesData.length > 0) {
        handleSelectRole(rolesData[0])
      }
    } catch (err) {
      console.error('Failed to fetch roles data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectRole = async (role: Role) => {
    setSelectedRole(role)
    try {
      const permissions = await roleService.getRolePermissions(role.id)
      setRolePermissions(new Set(permissions.map(p => p.id)))
    } catch (err) {
      console.error('Failed to fetch role permissions:', err)
      setRolePermissions(new Set())
    }
  }

  const togglePermission = (permissionId: number) => {
    const next = new Set(rolePermissions)
    if (next.has(permissionId)) next.delete(permissionId)
    else next.add(permissionId)
    setRolePermissions(next)
  }

  const handleSavePermissions = async () => {
    if (!selectedRole) return
    try {
      setSaving(true)
      await roleService.updateRole(selectedRole.id, {
        permissions: Array.from(rolePermissions)
      })
      alert('Permissions updated successfully')
    } catch (err) {
      console.error('Failed to save permissions:', err)
      alert('Failed to save permissions')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-[#146c4f]" />
        <p className="text-gray-500 font-medium">Loading roles & permissions...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mt-2 sm:mt-4">
        <p className="text-sm text-gray-500 max-w-2xl">
          Define administrative roles and manage granular permissions across different system modules.
        </p>
        <Button className="bg-[#146c4f] hover:bg-[#115a42] text-white">
          <Plus className="w-4 h-4 mr-2" />
          Create New Role
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Roles List */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider px-1">System Roles</h3>
          <div className="space-y-2">
            {roles.map((role) => (
              <button
                key={role.id}
                onClick={() => handleSelectRole(role)}
                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all text-left ${
                  selectedRole?.id === role.id
                    ? 'bg-[#dcfce7]/50 border-[#146c4f] shadow-sm'
                    : 'bg-white border-gray-100 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${selectedRole?.id === role.id ? 'bg-[#146c4f] text-white' : 'bg-gray-100 text-gray-500'}`}>
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-semibold text-gray-900 block">{role.name}</span>
                    <span className="text-xs text-gray-500">{role.description || 'System access role'}</span>
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 ${selectedRole?.id === role.id ? 'text-[#146c4f]' : 'text-gray-300'}`} />
              </button>
            ))}
          </div>
        </div>

        {/* Permissions Grid */}
        <div className="lg:col-span-2">
          {selectedRole ? (
            <Card className="border-gray-100 shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="bg-gray-50/50 border-b border-gray-100 flex flex-row items-center justify-between py-4">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="w-5 h-5 text-[#146c4f]" />
                    {selectedRole.name} Permissions
                  </CardTitle>
                  <CardDescription>Manage what users with this role can see and do.</CardDescription>
                </div>
                <Button 
                  onClick={handleSavePermissions} 
                  disabled={saving}
                  className="bg-[#146c4f] hover:bg-[#115a42] text-white"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Save Changes
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {modules.length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {modules.map((module) => (
                      <div key={module.id} className="p-6">
                        <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#146c4f]"></span>
                          {module.name}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {module.permissions.map((permission) => (
                            <div 
                              key={permission.id} 
                              className="flex items-center space-x-3 p-3 rounded-lg border border-transparent hover:border-gray-100 hover:bg-gray-50/50 transition-all cursor-pointer"
                              onClick={() => togglePermission(permission.id)}
                            >
                              <Checkbox 
                                id={`perm-${permission.id}`}
                                checked={rolePermissions.has(permission.id)}
                                onCheckedChange={() => togglePermission(permission.id)}
                                className="data-[state=checked]:bg-[#146c4f] data-[state=checked]:border-[#146c4f]"
                              />
                              <label 
                                htmlFor={`perm-${permission.id}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer text-gray-700"
                              >
                                {permission.name}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Lock className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 font-medium">No permission modules found.</p>
                    <p className="text-sm text-gray-400">Permissions are managed by the system administrator.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
              <Shield className="w-12 h-12 text-gray-200 mb-4" />
              <p className="text-gray-500 font-medium">Select a role to manage its permissions</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
