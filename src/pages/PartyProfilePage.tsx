import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { partyService, Party } from '@/services/parties'
import { candidateService } from '@/services/candidates'
import { userService, CreateUserData, Role, Permission } from '@/services/users'
import { User } from '@/services/auth'
import { ArrowLeft, Globe, ToggleRight } from 'lucide-react' 
import UploadPartyLogoDialog from '@/components/UploadPartyLogoDialog'
import AddChairmanDialog from '@/components/AddChairmanDialog'
import { getLogoUrl } from '@/lib/utils'

function toAbbreviation(name: string) {
  return name
    .split(' ')
    .map((word) => word[0] ?? '')
    .join('')
    .slice(0, 4)
    .toUpperCase()
}

function formatWebsite(name: string) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '')
  return `https://www.${slug}.com.ng`
}

function isActiveUserStatus(status: number | string | boolean | null | undefined) {
  if (status === 1 || status === true) return true
  if (typeof status === 'string') {
    const normalized = status.trim().toLowerCase()
    return normalized === '1' || normalized === 'true' || normalized === 'active'
  }
  return false
}

interface PartyChairmanRecord {
  id: number
  userId?: string
  fullName?: string
  avatarUrl?: string | null
  status?: string
  termStart?: string
  addedBy?: string
  termLimit?: string
  period?: string
  duration?: string
}

interface PartyChairmanData {
  partyName?: string
  currentChairman?: PartyChairmanRecord
  formerChairmen?: PartyChairmanRecord[]
}

interface PartyUserFormState extends CreateUserData {
  permissions: number[]
}

function deriveStats(id: number) {
  return {
    totalUsers: 12 + ((id * 7) % 18),
    electedOfficials: 72 + ((id * 11) % 42),
    activeCandidates: 20 + ((id * 5) % 34),
  }
}

function formatChairmanDate(value?: string) {
  if (!value) return 'N/A'

  const trimmed = value.trim()
  if (!trimmed) return 'N/A'

  const slashMatch = trimmed.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})$/)
  const date = slashMatch
    ? new Date(Number(slashMatch[1]), Number(slashMatch[2]) - 1, Number(slashMatch[3]))
    : new Date(trimmed)

  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
}

export default function PartyProfilePage() {
  const { partyId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [party, setParty] = useState<Party | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [chairmanData, setChairmanData] = useState<PartyChairmanData | null>(null)
  const [chairmanLoading, setChairmanLoading] = useState(true)
  const [selectedFormerChairmen, setSelectedFormerChairmen] = useState<Set<number>>(new Set())
  const [partyUsers, setPartyUsers] = useState<User[]>([])
  const [partyUsersLoading, setPartyUsersLoading] = useState(true)
  const [partyUsersError, setPartyUsersError] = useState<string | null>(null)
  const [partyCandidateCount, setPartyCandidateCount] = useState<number | null>(null)
  const [selectedPartyUser, setSelectedPartyUser] = useState<User | null>(null)
  const [isViewUserDialogOpen, setIsViewUserDialogOpen] = useState(false)
  const [viewingUserLoading, setViewingUserLoading] = useState(false)
  const [viewingUserError, setViewingUserError] = useState<string | null>(null)
  const [deletingPartyUserId, setDeletingPartyUserId] = useState<number | null>(null)
  const [partyUserTogglingIds, setPartyUserTogglingIds] = useState<Set<number>>(new Set())
  const [selectedPartyUserIds, setSelectedPartyUserIds] = useState<Set<number>>(new Set())
  const [deletingSelectedPartyUsers, setDeletingSelectedPartyUsers] = useState(false)
  const [partyRoles, setPartyRoles] = useState<Role[]>([])
  const [partyRolesLoading, setPartyRolesLoading] = useState(true)
  const [partyRolesError, setPartyRolesError] = useState<string | null>(null)
  const [rolePermissions, setRolePermissions] = useState<Permission[]>([])
  const [rolePermissionsLoading, setRolePermissionsLoading] = useState(false)
  const [rolePermissionsError, setRolePermissionsError] = useState<string | null>(null)
  const [showPermissionsDropdown, setShowPermissionsDropdown] = useState(false)

  const handlePermissionToggle = (permissionId: number) => {
    setAddUserForm((prev) => {
      const current = prev.permissions ?? []
      if (current.includes(permissionId)) {
        return { ...prev, permissions: current.filter((p) => p !== permissionId) }
      }
      return { ...prev, permissions: [...current, permissionId] }
    })
  }

  const toggleSelectAllPermissions = () => {
    setAddUserForm((prev) => {
      const current = prev.permissions ?? []
      if (rolePermissions.length === 0) return prev
      if (current.length === rolePermissions.length) {
        return { ...prev, permissions: [] }
      }
      return { ...prev, permissions: rolePermissions.map((p) => p.id) }
    })
  }

  const handleRoleChange = (roleId: number) => {
    setAddUserForm((prev) => ({ ...prev, role_id: roleId }))
    loadRolePermissions(roleId)
  }

  const openViewPartyUser = async (userId: number) => {
    setSelectedPartyUser(null)
    setViewingUserError(null)
    setIsViewUserDialogOpen(true)
    setViewingUserLoading(true)

    try {
      const user = await userService.getUser(userId)
      setSelectedPartyUser(user)
    } catch (err) {
      console.error('Unable to load party user:', err)
      setViewingUserError(err instanceof Error ? err.message : 'Unable to load party user.')
    } finally {
      setViewingUserLoading(false)
    }
  }

  const handleEditPartyUserFromView = (user: User) => {
    const permissionIds: number[] = Array.isArray(user.permissions)
      ? user.permissions
          .map((p: any) => {
            if (typeof p === 'number') return p
            if (typeof p === 'string') return parseInt(p, 10)
            if (typeof p === 'object' && p?.id) return typeof p.id === 'number' ? p.id : parseInt(p.id, 10)
            return NaN
          })
          .filter((id) => !isNaN(id))
      : []

    setEditingUserId(user.id)
    setAddUserForm((prev) => ({
      ...prev,
      name: user.name || '',
      email: user.email || '',
      phoneNo: user.phoneNo || '',
      role_id: user.role_id || 0,
      state_id: user.state_id ?? 0,
      party_id: user.party_id ?? (party?.id ?? 0),
      permissions: permissionIds,
    }))

    setAddUserError(null)
    setAddUserSuccess(null)
    setShowPermissionsDropdown(false)
    if (user.role_id) {
      loadRolePermissions(user.role_id)
    }

    setIsViewUserDialogOpen(false)
    setIsAddUserDialogOpen(true)
  }

  const handleDeletePartyUserFromView = async (userId: number) => {
    const confirmDelete = window.confirm('Delete this user? This action cannot be undone.')
    if (!confirmDelete) return

    try {
      setDeletingPartyUserId(userId)
      await userService.deleteUser(userId)
      // remove deleted user from list
      setPartyUsers((prev) => prev.filter((u) => u.id !== userId))
      setIsViewUserDialogOpen(false)
    } catch (err) {
      console.error('Failed to delete user:', err)
      setViewingUserError(err instanceof Error ? err.message : 'Failed to delete user.')
    } finally {
      setDeletingPartyUserId(null)
    }
  }

  const handleTogglePartyUser = async (userId: number) => {
    setPartyUserTogglingIds((prev) => new Set(prev).add(userId))
    try {
      const updatedUser = await userService.toggleUser(userId)
      setPartyUsers((prev) => prev.map((user) => user.id === userId ? { ...user, status: updatedUser.status } : user))
    } catch (err) {
      console.error('Failed to toggle party user status:', err)
    } finally {
      setPartyUserTogglingIds((prev) => {
        const next = new Set(prev)
        next.delete(userId)
        return next
      })
    }
  }

  const allPartyUsersSelected = partyUsers.length > 0 && selectedPartyUserIds.size === partyUsers.length

  const handleToggleSelectAllPartyUsers = (checked: boolean | string) => {
    if (checked === true) {
      setSelectedPartyUserIds(new Set(partyUsers.map((user) => user.id)))
      return
    }
    setSelectedPartyUserIds(new Set())
  }

  const handleToggleSelectPartyUser = (userId: number, checked: boolean | string) => {
    setSelectedPartyUserIds((prev) => {
      const next = new Set(prev)
      if (checked === true) {
        next.add(userId)
      } else {
        next.delete(userId)
      }
      return next
    })
  }

  const handleToggleSelectedPartyUsers = async () => {
    const selectedIds = Array.from(selectedPartyUserIds)
    if (selectedIds.length === 0) return

    setPartyUserTogglingIds((prev) => {
      const next = new Set(prev)
      selectedIds.forEach((id) => next.add(id))
      return next
    })

    try {
      const updatedUsers = await Promise.all(selectedIds.map((id) => userService.toggleUser(id)))
      setPartyUsers((prev) => prev.map((user) => {
        const updated = updatedUsers.find((u) => u.id === user.id)
        return updated ? { ...user, status: updated.status } : user
      }))
    } catch (err) {
      console.error('Failed to toggle selected party users:', err)
    } finally {
      setPartyUserTogglingIds((prev) => {
        const next = new Set(prev)
        selectedIds.forEach((id) => next.delete(id))
        return next
      })
    }
  }

  const handleDeleteSelectedPartyUsers = async () => {
    if (selectedPartyUserIds.size === 0) return
    const confirmDelete = window.confirm(
      `Delete ${selectedPartyUserIds.size} selected user${selectedPartyUserIds.size > 1 ? 's' : ''}? This action cannot be undone.`
    )
    if (!confirmDelete) return

    setDeletingSelectedPartyUsers(true)
    const selectedIds = Array.from(selectedPartyUserIds)

    try {
      await Promise.all(selectedIds.map((id) => userService.deleteUser(id)))
      setPartyUsers((prev) => prev.filter((user) => !selectedPartyUserIds.has(user.id)))
      setSelectedPartyUserIds(new Set())
    } catch (err) {
      console.error('Failed to delete selected party users:', err)
    } finally {
      setDeletingSelectedPartyUsers(false)
    }
  }

  const loadRolePermissions = async (roleId: number) => {
    if (!roleId) {
      setRolePermissions([])
      setRolePermissionsError(null)
      return
    }

    try {
      setRolePermissionsLoading(true)
      const permissions = await userService.getRolePermissions(roleId)
      setRolePermissions(permissions)
      setRolePermissionsError(null)
      // Only auto-select all permissions when creating a new user, preserve selections when editing
      if (!editingUserId) {
        setAddUserForm((prev) => ({ ...prev, permissions: permissions.map((permission) => permission.id) }))
      }
    } catch (err) {
      console.error('Unable to load role permissions:', err)
      setRolePermissionsError(err instanceof Error ? err.message : 'Unable to load role permissions.')
      setRolePermissions([])
    } finally {
      setRolePermissionsLoading(false)
    }
  }
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false)
  const [addUserLoading, setAddUserLoading] = useState(false)
  const [addUserError, setAddUserError] = useState<string | null>(null)
  const [addUserSuccess, setAddUserSuccess] = useState<string | null>(null)
  const [addUserForm, setAddUserForm] = useState<PartyUserFormState>({
    name: '',
    phoneNo: '',
    email: '',
    role_id: 0,
    permissions: [],
    state_id: 0,
    party_id: 0
  })

  const resetAddUserDialog = () => {
    setEditingUserId(null)
    setAddUserForm({
      name: '',
      phoneNo: '',
      email: '',
      role_id: 0,
      permissions: [],
      state_id: 0,
      party_id: party?.id ?? 0,
    })
    setAddUserError(null)
    setAddUserSuccess(null)
  }

  const [activeTab, setActiveTab] = useState(() => {
    const state: any = (location && (location as any).state) || {}
    return state.activeTab ?? 'Overview'
  })
  const [editingUserId, setEditingUserId] = useState<number | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    slogan: '',
    philosophy: '',
    address: '',
    registrationYear: '',
  })

  useEffect(() => {
    const id = Number(partyId)
    if (!partyId || Number.isNaN(id)) {
      setError('Invalid party ID.')
      setLoading(false)
      return
    }

    const loadParty = async () => {
      try {
        setLoading(true)
        const data = await partyService.getPartyById(id)
        setParty(data)
        setFormData({
          name: data.name || '',
          description: data.description || '',
          slogan: data.slogan || '',
          philosophy: data.philosophy || '',
          address: data.address || '',
          registrationYear: data.registrationYear ?? '',
        })
        setAddUserForm((prev) => ({ ...prev, party_id: data.id }))
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to load party profile.'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    const loadChairmen = async () => {
      try {
        setChairmanLoading(true)
        const chairmanResult = await partyService.getPartyChairman(String(id))
        // DEBUG: log chairman result to verify dates and status coming from service
        // Remove this log after verification
        // eslint-disable-next-line no-console
        console.log('chairmanResult:', chairmanResult)
        setChairmanData(chairmanResult)
      } catch (err) {
        console.error('Unable to load party chairmen:', err)
        setChairmanData(null)
      } finally {
        setChairmanLoading(false)
      }
    }

    const loadPartyUsers = async () => {
      try {
        setPartyUsersLoading(true)
        const users = await userService.getPartyUsers(id)
        setPartyUsers(users)
        setPartyUsersError(null)
      } catch (err) {
        console.error('Unable to load party users:', err)
        setPartyUsersError(err instanceof Error ? err.message : 'Unable to load party users.')
        setPartyUsers([])
      } finally {
        setPartyUsersLoading(false)
      }
    }

    const loadPartyCandidates = async (partyName: string) => {
      try {
        const candidates = await candidateService.getAllCandidates()
        const activePartyCandidates = candidates.filter((candidate) => {
          if (!candidate.political_party) return false
          return candidate.political_party.toLowerCase() === partyName.toLowerCase()
        }).filter((candidate) => candidate.status === 'Active')

        setPartyCandidateCount(activePartyCandidates.length)
      } catch (err) {
        console.error('Unable to load party candidates:', err)
        setPartyCandidateCount(null)
      }
    }

    const loadPartyRoles = async () => {
      try {
        setPartyRolesLoading(true)
        const roles = await userService.getPartyRoles()
        setPartyRoles(roles)
        setPartyRolesError(null)
      } catch (err) {
        console.error('Unable to load party roles:', err)
        setPartyRolesError(err instanceof Error ? err.message : 'Unable to load party roles.')
        setPartyRoles([])
      } finally {
        setPartyRolesLoading(false)
      }
    }

    loadParty()
    loadChairmen()
    loadPartyUsers()
    loadPartyRoles()
    if (party?.name) {
      loadPartyCandidates(party.name)
    }
  }, [partyId, party?.name])

  useEffect(() => {
    const state: any = (location && (location as any).state) || {}
    if (state.activeTab) setActiveTab(state.activeTab)
  }, [location])

  const formerChairmen = chairmanData?.formerChairmen ?? []
  const allFormerSelected = formerChairmen.length > 0 && formerChairmen.every((chairman) => selectedFormerChairmen.has(chairman.id))

  const toggleSelectAllFormerChairmen = () => {
    if (formerChairmen.length === 0) return

    if (allFormerSelected) {
      setSelectedFormerChairmen(new Set())
      return
    }

    setSelectedFormerChairmen(new Set(formerChairmen.map((chairman) => chairman.id)))
  }

  const toggleSelectFormerChairman = (id: number) => {
    setSelectedFormerChairmen((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleDeleteSelectedFormerChairmen = async () => {
    if (selectedFormerChairmen.size === 0) return

    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${selectedFormerChairmen.size} former chairman${selectedFormerChairmen.size > 1 ? 's' : ''}?`
    )

    if (!confirmDelete) return

    try {
      await Promise.all(
        Array.from(selectedFormerChairmen).map((id) => partyService.deletePartyChairman(id))
      )

      // Update the chairman data by removing deleted chairmen
      setChairmanData((prev) => {
        if (!prev?.formerChairmen) return prev
        return {
          ...prev,
          formerChairmen: prev.formerChairmen.filter((chairman) => !selectedFormerChairmen.has(chairman.id)),
        }
      })

      setSelectedFormerChairmen(new Set())
    } catch (err) {
      console.error('Failed to delete selected former chairmen:', err)
      // You might want to show an error message to the user here
    }
  }

  const stats = useMemo(() => {
    if (!party) return null
    const derived = deriveStats(party.id)
    return {
      ...derived,
      totalUsers: partyUsers.length,
      activeCandidates: partyCandidateCount ?? partyUsers.filter((user) => isActiveUserStatus(user.status)).length,
    }
  }, [party, partyUsers, partyCandidateCount])

  const handleFormChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setFormError(null)
    setSuccess(null)
  }

  const handleSave = async () => {
    if (!party) return
    setFormError(null)
    setSuccess(null)

    const payload = {
      name: formData.name,
      description: formData.description,
      slogan: formData.slogan,
      philosophy: formData.philosophy,
      address: formData.address,
      registrationYear: String(formData.registrationYear),
    }

    try {
      setSaving(true)
      const updated = await partyService.updateParty(party.id, payload)
      setParty(updated)
      setFormData({
        name: updated.name || '',
        description: updated.description || '',
        slogan: updated.slogan || '',
        philosophy: updated.philosophy || '',
        address: updated.address || '',
        registrationYear: updated.registrationYear ?? '',
      })
      setSuccess('Party details updated successfully.')
      setIsEditDialogOpen(false)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to save party details.')
    } finally {
      setSaving(false)
    }
  }

  const handleCancelEdit = () => {
    if (!party) return
    setFormData({
      name: party.name || '',
      description: party.description || '',
      slogan: party.slogan || '',
      philosophy: party.philosophy || '',
      address: party.address || '',
      registrationYear: party.registrationYear ?? '',
    })
    setFormError(null)
    setSuccess(null)
    setIsEditDialogOpen(false)
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    )
  }

  if (error || !party) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center">
        <p className="text-sm text-red-600">{error || 'Party profile not found.'}</p>
        <Button variant="outline" onClick={() => navigate('/k8s9d7f3-parties')}>
          Back to Parties
        </Button>
      </div>
  )
  }

  const abbreviation = toAbbreviation(party.name)
  const website = formatWebsite(party.name)

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex items-start gap-4">
          <div className="w-20 h-20 rounded-3xl bg-slate-100 border border-gray-200 overflow-hidden flex items-center justify-center">
            {party.logopath && getLogoUrl(party.logopath) ? (
              <img src={getLogoUrl(party.logopath) || ''} alt={`${party.name} logo`} className="h-full w-full object-contain" />
            ) : (
              <span className="text-3xl font-semibold text-slate-600">{abbreviation}</span>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{party.name}</h1>
              <Badge variant="secondary">{Boolean(party.status) ? 'Active' : 'Inactive'}</Badge>
            </div>
            <p className="max-w-2xl text-sm text-slate-500">{party.description}</p>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span>Founded {party.registrationYear || 'N/A'}</span>
              <span className="hidden sm:block">•</span>
              <span>{abbreviation}</span>
              <span className="hidden sm:block">•</span>
              <span>{party.philosophy}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => navigate('/k8s9d7f3-parties')}>
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          {activeTab !== 'Users' && (
            <UploadPartyLogoDialog
              partyId={party.id}
              onUploadSuccess={async () => {
                const updated = await partyService.getPartyById(party.id)
                setParty(updated)
              }}
            />
          )}
          {activeTab === 'Party Chairman' ? (
            partyId ? (
              <AddChairmanDialog
                partyId={partyId}
                partyName={party.name}
                onChairmanAssigned={async () => {
                  // Refresh chairman data after assignment
                  const chairmanResult = await partyService.getPartyChairman(partyId)
                  setChairmanData(chairmanResult)
                }}
              />
            ) : (
              <Button disabled>Add Chairman</Button>
            )
          ) : activeTab === 'Users' ? (
            <Button
              onClick={() => {
                resetAddUserDialog()
                setIsAddUserDialogOpen(true)
              }}
              className="bg-[#146c4f] text-white hover:bg-[#115a42]"
            >
              Add User
            </Button>
          ) : (
            <Button variant={isEditDialogOpen ? 'secondary' : 'default'} onClick={() => setIsEditDialogOpen(true)}>
              {isEditDialogOpen ? 'Cancel Edit' : 'Edit Details'}
            </Button>
          )}
        </div>
      </div>

      {success && (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {success}
        </div>
      )}

      {/* Edit Form Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Party</DialogTitle>
            <DialogDescription>
              Update the fields below and save to persist changes.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {formError && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {formError}
              </div>
            )}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Party Name</label>
                <Input value={formData.name} onChange={(e) => handleFormChange('name', e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Slogan</label>
                <Input value={formData.slogan} onChange={(e) => handleFormChange('slogan', e.target.value)} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-slate-700">Description</label>
                <Textarea value={formData.description} onChange={(e) => handleFormChange('description', e.target.value)} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-slate-700">Philosophy</label>
                <Textarea value={formData.philosophy} onChange={(e) => handleFormChange('philosophy', e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Address</label>
                <Input value={formData.address} onChange={(e) => handleFormChange('address', e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Registered Year</label>
                <Input type="number" value={formData.registrationYear} onChange={(e) => handleFormChange('registrationYear', e.target.value)} />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCancelEdit}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isViewUserDialogOpen} onOpenChange={setIsViewUserDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Party User Details</DialogTitle>
            <DialogDescription>
              View details for the selected party user. Use the button below to edit this user.
            </DialogDescription>
          </DialogHeader>

          {viewingUserLoading ? (
            <div className="py-8 text-center text-slate-500">Loading user details…</div>
          ) : viewingUserError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
              {viewingUserError}
            </div>
          ) : selectedPartyUser ? (
            <div className="grid gap-4 py-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Name</p>
                  <p className="text-sm font-medium text-slate-900">{selectedPartyUser.name || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email</p>
                  <p className="text-sm font-medium text-slate-900">{selectedPartyUser.email || 'N/A'}</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Phone</p>
                  <p className="text-sm font-medium text-slate-900">{selectedPartyUser.phoneNo || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Role</p>
                  <p className="text-sm font-medium text-slate-900">{selectedPartyUser.role?.name || 'User'}</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Level</p>
                  <p className="text-sm font-medium text-slate-900">{selectedPartyUser.state_id ? 'State' : 'National'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</p>
                  <span className={isActiveUserStatus(selectedPartyUser.status) ? 'inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-emerald-700 text-sm font-semibold' : 'inline-flex items-center gap-2 rounded-full bg-red-100 px-3 py-1 text-red-700 text-sm font-semibold'}>
                    <span className={isActiveUserStatus(selectedPartyUser.status) ? 'block h-2.5 w-2.5 rounded-full bg-emerald-700' : 'block h-2.5 w-2.5 rounded-full bg-red-700'}></span>
                    {isActiveUserStatus(selectedPartyUser.status) ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Party</p>
                  <p className="text-sm font-medium text-slate-900">{(selectedPartyUser.party && typeof selectedPartyUser.party === 'object' ? (selectedPartyUser.party as any).name : undefined) || party?.name || 'N/A'}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-slate-500">No user selected.</div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewUserDialogOpen(false)}>
              Close
            </Button>
            {selectedPartyUser && (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsViewUserDialogOpen(false)
                    resetAddUserDialog()
                    setIsAddUserDialogOpen(true)
                  }}
                >
                  Add
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleDeletePartyUserFromView(selectedPartyUser.id)}
                  disabled={deletingPartyUserId === selectedPartyUser.id}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  {deletingPartyUserId === selectedPartyUser.id ? 'Deleting...' : 'Delete'}
                </Button>
                <Button onClick={() => handleEditPartyUserFromView(selectedPartyUser)}>
                  Edit
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
        <DialogContent className="max-w-sm sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingUserId ? 'Edit Party User' : 'Add Party User'}</DialogTitle>
            <DialogDescription className="text-sm">
              {editingUserId ? 'Update the party user details below.' : 'Create a new party user with only the required fields.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-1">
            {addUserError && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {addUserError}
              </div>
            )}
            {addUserSuccess && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                {addUserSuccess}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Full Name *</label>
              <Input
                placeholder="Enter full name"
                value={addUserForm.name}
                onChange={(e) => setAddUserForm((prev) => ({ ...prev, name: e.target.value }))}
                className="h-8"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Email Address *</label>
                <Input
                  type="email"
                  placeholder="user@example.com"
                  value={addUserForm.email}
                  onChange={(e) => setAddUserForm((prev) => ({ ...prev, email: e.target.value }))}
                  className="h-8"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Phone Number *</label>
                <Input
                  placeholder="Enter phone number"
                  value={addUserForm.phoneNo}
                  onChange={(e) => setAddUserForm((prev) => ({ ...prev, phoneNo: e.target.value }))}
                  className="h-8"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Party Role *</label>
                <Select
                  value={addUserForm.role_id?.toString()}
                  onValueChange={(value) => {
                    const selectedRoleId = Number(value)
                    handleRoleChange(selectedRoleId)
                  }}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {partyRoles.map((role) => (
                      <SelectItem key={role.id} value={role.id.toString()}>{role.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {partyRolesLoading && (
                  <p className="text-xs text-slate-500 mt-1">Loading party roles…</p>
                )}
                {partyRolesError && (
                  <p className="text-xs text-red-600 mt-1">{partyRolesError}</p>
                )}
                {addUserForm.role_id ? (
                  <div className="mt-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-sm text-slate-700">Permissions</p>
                      <div className="flex items-center gap-2">
                        {rolePermissionsLoading && <span className="text-xs text-slate-500">Loading…</span>}
                        <Button variant="outline" size="sm" onClick={() => setShowPermissionsDropdown((v) => !v)}>
                          {showPermissionsDropdown ? 'Close' : 'Manage'}
                        </Button>
                      </div>
                    </div>

                    {rolePermissionsError && (
                      <p className="text-xs text-red-600 mt-1">{rolePermissionsError}</p>
                    )}

                    {showPermissionsDropdown && (
                      <div className="mt-2 rounded-2xl border border-slate-200 bg-white p-2 text-sm text-slate-700">
                        <label className="flex items-center gap-2">
                          <Checkbox
                            checked={(addUserForm.permissions?.length ?? 0) === rolePermissions.length && rolePermissions.length > 0}
                            onCheckedChange={() => toggleSelectAllPermissions()}
                          />
                          <span className="font-medium">Select all</span>
                        </label>

                        {rolePermissions.length > 0 ? (
                          <div className="mt-2 max-h-40 overflow-auto grid grid-cols-1 gap-2">
                            {rolePermissions.map((permission) => (
                              <label key={permission.id} className="flex items-center gap-2 rounded px-2 py-1 border border-slate-200">
                                <Checkbox
                                  checked={!!addUserForm.permissions?.includes(permission.id)}
                                  onCheckedChange={() => handlePermissionToggle(permission.id)}
                                />
                                <span className="text-slate-700">{permission.name}</span>
                              </label>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-2 text-xs text-slate-500">No permissions found.</p>
                        )}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Party</label>
                <Input value={party?.name || ''} disabled className="h-8 bg-slate-100" />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsAddUserDialogOpen(false)
              resetAddUserDialog()
            }}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!addUserForm.name || !addUserForm.email || !addUserForm.phoneNo || !addUserForm.role_id) {
                  setAddUserError('Please fill in all required fields.')
                  return
                }
                setAddUserError(null)
                setAddUserSuccess(null)
                setAddUserLoading(true)
                try {
                  const userData = {
                    ...addUserForm,
                    party_id: party?.id ?? addUserForm.party_id,
                    permissions: addUserForm.permissions?.length ? addUserForm.permissions : []
                  }
                  if (editingUserId) {
                    await userService.updateUser(editingUserId, userData)
                    setAddUserSuccess('User updated successfully.')
                    const refreshedUsers = party?.id ? await userService.getPartyUsers(party.id) : []
                    setPartyUsers(refreshedUsers)
                    setTimeout(() => {
                      setIsAddUserDialogOpen(false)
                      resetAddUserDialog()
                    }, 1500)
                  } else {
                    await userService.createUser(userData)
                    setAddUserSuccess('User created successfully.')
                    const refreshedUsers = party?.id ? await userService.getPartyUsers(party.id) : []
                    setPartyUsers(refreshedUsers)
                    setTimeout(() => {
                      setIsAddUserDialogOpen(false)
                      resetAddUserDialog()
                    }, 1500)
                  }
                } catch (err) {
                  setAddUserError(err instanceof Error ? err.message : 'Failed to save user.')
                } finally {
                  setAddUserLoading(false)
                }
              }}
              disabled={addUserLoading}
              className="bg-[#146c4f] text-white hover:bg-[#115a42]"
            >
              {addUserLoading ? 'Saving...' : editingUserId ? 'Save Changes' : 'Create User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tabs */}
      <div className="flex flex-col gap-4">
        <div className="flex gap-4 border-b border-slate-200">
          {['Overview', 'Party Chairman', 'Users'].map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`
                  relative px-4 py-3 text-sm font-bold transition-all duration-200
                  ${isActive ? 'text-emerald-700' : 'text-slate-500'}
                  hover:text-emerald-600 hover:bg-emerald-50 rounded-t-lg
                  ${isActive 
                    ? 'after:absolute after:bottom-0 after:left-0 after:h-[3px] after:w-full after:bg-emerald-600 after:rounded-t-full' 
                    : 'after:absolute after:bottom-0 after:left-0 after:h-[3px] after:w-0 after:bg-transparent transition-all'
                  }
                `}
              >
                {tab}
              </button>
            )
          })}
        </div>
      </div>

      {/* Party Chairman Section */}
      {activeTab === 'Party Chairman' && (
        <>
          <Card className="border-0">
            <CardHeader>
              <CardTitle className="text-lg">Current Chairman</CardTitle>
              <CardDescription>Most recent party chairman and leadership details.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6 sm:flex-row sm:items-start">
              <Avatar className="h-24 w-24 rounded-[1.5rem] border border-slate-200 bg-slate-100">
                <AvatarFallback className="text-2xl font-semibold text-slate-700">
                  {party.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:justify-between sm:items-start">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-semibold text-slate-900">
                      {chairmanData?.currentChairman?.fullName || 'No chairman assigned'}
                    </p>
                    {chairmanData?.currentChairman?.status && (
                      <Badge variant={chairmanData.currentChairman.status.toLowerCase() === 'active' ? 'secondary' : 'outline'} className="border-emerald-200 text-emerald-600 bg-emerald-50 h-6">
                        {chairmanData.currentChairman.status}
                      </Badge>
                    )}
                  </div>
                  {chairmanData?.currentChairman && (
                    <>
                      <p className="text-sm text-slate-500">
                        {chairmanData.currentChairman.period ? `Period ${chairmanData.currentChairman.period}` : (chairmanData.currentChairman.termStart ? `Assumed position ${formatChairmanDate(chairmanData.currentChairman.termStart)}` : 'Assumption date not available')}
                      </p>
                      {chairmanData.currentChairman.duration ? (
                        <p className="text-sm text-slate-500">Duration {chairmanData.currentChairman.duration}</p>
                      ) : null}
                      <p className="text-sm text-slate-500">
                        {chairmanData.currentChairman.addedBy ? `Added by ${chairmanData.currentChairman.addedBy}` : 'Added by N/A'}
                      </p>
                    </>
                  )}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="rounded-full bg-slate-100 px-3 py-1">Nationwide</span>
                    <span className="rounded-full bg-slate-100 px-3 py-1">Party Chairman</span>
                  </div>
                </div>

                <div className="flex items-center sm:pt-0.5">
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/k8s9d7f3-parties/${partyId}/chairman`)}
                    className="w-full sm:w-auto"
                  >
                    View Full Profile
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0">
            <CardHeader>
              <CardTitle className="text-lg">Former Chairmen</CardTitle>
              <CardDescription>Previous chairmen records for this party.</CardDescription>
            </CardHeader>
            <CardContent>
              {selectedFormerChairmen.size > 0 && (
                <div className="mb-4 flex items-center justify-between bg-red-50 border border-red-100 rounded-lg px-4 py-3">
                  <p className="text-sm text-red-700">
                    {selectedFormerChairmen.size} former chairman{selectedFormerChairmen.size > 1 ? 's' : ''} selected
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedFormerChairmen(new Set())}
                      className="text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                    >
                      Clear Selection
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDeleteSelectedFormerChairmen}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Delete Selected
                    </Button>
                  </div>
                </div>
              )}
              {chairmanLoading ? (
                <p className="text-sm text-slate-500">Loading chairmen…</p>
              ) : chairmanData?.formerChairmen?.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="px-4 py-3 text-left">
                          <input
                            type="checkbox"
                            checked={allFormerSelected}
                            onChange={toggleSelectAllFormerChairmen}
                            className="rounded border-slate-300"
                          />
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Full Name</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Period</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Duration</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chairmanData.formerChairmen.map((chairman) => (
                        <tr key={chairman.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedFormerChairmen.has(chairman.id)}
                              onChange={() => toggleSelectFormerChairman(chairman.id)}
                              className="rounded border-slate-300"
                            />
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-slate-900">{chairman.fullName || 'Unknown'}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{chairman.period || 'N/A'}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{chairman.duration || 'N/A'}</td>
                          <td className="px-4 py-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/k8s9d7f3-parties/${partyId}/chairman`)}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              View
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-slate-500">No former chairmen available.</p>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {activeTab === 'Users' && (
        <>
          <Card className="border-0">
            <CardHeader>
              <CardTitle className="text-lg">Party Users</CardTitle>
              <CardDescription>Users assigned to this party and their current access status.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-[1fr_auto]">
              <div>
                <p className="text-sm text-slate-500">Assigned users</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">
                  {partyUsersLoading ? '…' : partyUsers.length}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2">
                {selectedPartyUserIds.size > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                      {selectedPartyUserIds.size} selected
                    </span>
                    <Button
                      variant="outline"
                      onClick={handleToggleSelectedPartyUsers}
                      disabled={partyUserTogglingIds.size > 0 || deletingSelectedPartyUsers}
                      className="gap-2"
                    >
                      Toggle selected
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleDeleteSelectedPartyUsers}
                      disabled={deletingSelectedPartyUsers || partyUserTogglingIds.size > 0}
                      className="text-red-600 border-red-200 hover:bg-red-50 gap-2"
                    >
                      {deletingSelectedPartyUsers ? 'Deleting...' : 'Delete selected'}
                    </Button>
                  </div>
                )}
                <Button variant="outline" onClick={() => navigate('/k8s9d7f3-users')}>
                  Manage Users
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto relative min-h-[300px]">
            {partyUsersLoading && (
              <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center text-slate-500">
                Loading party users…
              </div>
            )}
            <div className="min-w-[800px]">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-100">
                    <TableHead className="w-12 px-6">
                      <label className="flex items-center justify-center cursor-pointer">
                        <Checkbox
                          checked={allPartyUsersSelected}
                          onCheckedChange={handleToggleSelectAllPartyUsers}
                        />
                        <span className="sr-only">Select all party users</span>
                      </label>
                    </TableHead>
                    <TableHead className="text-[0.65rem] font-bold text-gray-500 tracking-wider">NAME</TableHead>
                    <TableHead className="text-[0.65rem] font-bold text-gray-500 tracking-wider">EMAIL</TableHead>
                    <TableHead className="text-[0.65rem] font-bold text-gray-500 tracking-wider">ROLE</TableHead>
                    <TableHead className="text-[0.65rem] font-bold text-gray-500 tracking-wider">LEVEL</TableHead>
                    <TableHead className="text-[0.65rem] font-bold text-gray-500 tracking-wider">STATUS</TableHead>
                    <TableHead className="text-[0.65rem] font-bold text-gray-500 tracking-wider">ACTIONS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {partyUsers.length ? partyUsers.map((user) => {
                    const level = user.state_id ? 'State' : 'National'
                    const active = isActiveUserStatus(user.status)
                    const status = active ? 'Active' : 'Inactive'

                    return (
                      <TableRow key={user.id} className="border-b border-gray-100 hover:bg-gray-50/70">
                        <TableCell className="px-6 py-5">
                          <label className="flex items-center justify-center cursor-pointer">
                            <Checkbox
                              checked={selectedPartyUserIds.has(user.id)}
                              onCheckedChange={(checked) => handleToggleSelectPartyUser(user.id, checked)}
                              className="rounded-[4px] border-gray-300"
                            />
                            <span className="sr-only">Select {user.name}</span>
                          </label>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="w-8 h-8 rounded-full border border-gray-100 bg-slate-100">
                              <AvatarFallback className="text-[10px] text-slate-600">{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <span className="font-semibold text-slate-900 whitespace-nowrap">{user.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-500 font-medium whitespace-nowrap">{user.email}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="whitespace-nowrap">
                            {user.role?.name || 'User'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium text-slate-700">{level}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="flex items-center gap-2 font-semibold text-[0.8rem] whitespace-nowrap">
                              <span className={`w-2.5 h-2.5 rounded-full ${status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                              <span className={status === 'Active' ? 'text-emerald-600' : 'text-slate-500'}>{status}</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => handleTogglePartyUser(user.id)}
                              disabled={partyUserTogglingIds.has(user.id)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                              aria-label={`Toggle status for ${user.name}`}
                            >
                              <ToggleRight className="w-4 h-4" />
                            </button>
                          </div>
                        </TableCell>
                        <TableCell className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openViewPartyUser(user.id)}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  }) : (
                    <TableRow>
                      <TableCell colSpan={7} className="px-6 py-8 text-center text-sm text-slate-500">
                        {partyUsersError ?? 'No users assigned to this party.'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </>
      )}

      {/* Stats and Contact Section (Example for Overview tab) */}
      {activeTab === 'Overview' && (
        <div className="grid xl:grid-cols-2 gap-4">
          <Card className="border-0">
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Party Statistics</CardTitle>
              <CardDescription className="text-xs">
                Key membership and participation metrics for this party.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white p-1.5">
                  <p className="text-[10px] uppercase tracking-wider text-slate-400">Total users</p>
                  <p className="mt-1 text-xl font-semibold text-slate-900">{stats?.totalUsers ?? 0}</p>
                </div>
                <div className="bg-white p-1.5">
                  <p className="text-[10px] uppercase tracking-wider text-slate-400">Elected officials</p>
                  <p className="mt-1 text-xl font-semibold text-slate-900">{stats?.electedOfficials ?? 0}</p>
                </div>
                <div className="bg-white p-1.5">
                  <p className="text-[10px] uppercase tracking-wider text-slate-400">Active candidates</p>
                  <p className="mt-1 text-xl font-semibold text-slate-900">{stats?.activeCandidates ?? 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0">
            <CardHeader>
              <CardTitle className="text-lg">Contact Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 py-0">
              <div className="bg-white p-2">
                <p className="text-sm font-medium text-slate-700">Address</p>
                <p className="mt-2 text-sm text-slate-500">{party.address || 'No address available'}</p>
              </div>
              <div className="bg-white p-2">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-700"><Globe className="w-4 h-4" /> Website</div>
                <a href={website} target="_blank" rel="noreferrer" className="mt-2 block text-sm text-primary hover:underline">{website}</a>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}


