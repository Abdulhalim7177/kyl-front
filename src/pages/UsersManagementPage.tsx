import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { AnimatedConfirmDialog } from '@/components/AnimatedConfirmDialog'
import { userService, Role, Party } from '@/services/users'
import { User } from '@/services/auth'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Search, 
  Download, 
  List as ListIcon, 
  LayoutGrid, 
  MoreVertical, 
  X, 
  Plus,
  Check,
  UserMinus,
  ShieldAlert,
  Trash2,
  Loader2,
  Lock,
} from 'lucide-react'

export default function UsersManagementPage() {
  const navigate = useNavigate()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [deleteInput, setDeleteInput] = useState('')
  
  // Filter states
  const [roles, setRoles] = useState<Role[]>([])
  const [parties, setParties] = useState<Party[]>([])
  const [filters, setFilters] = useState({
    role: 'all',
    party: 'all',
    state: 'all',
    status: 'all',
    search: ''
  })

  // Dialog visibility states for batch actions
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isRoleOpen, setIsRoleOpen] = useState(false)
  const [isDeactivateOpen, setIsDeactivateOpen] = useState(false)
  const [isPasswordOpen, setIsPasswordOpen] = useState(false)
  
  const [passwordData, setPasswordData] = useState({ password: '', confirm: '' })
  const [targetUserId, setTargetUserId] = useState<number | null>(null)

  useEffect(() => {
    fetchMetadata()
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [filters.party, filters.state])

  const fetchMetadata = async () => {
    try {
      const [rolesData, partiesData] = await Promise.all([
        userService.getUserRoles(),
        userService.getParties()
      ])
      setRoles(rolesData)
      setParties(partiesData)
    } catch (err) {
      console.error('Failed to fetch metadata:', err)
    }
  }

  const fetchUsers = async () => {
    try {
      setLoading(true)
      let data: User[] = []
      
      if (filters.party !== 'all') {
        data = await userService.getPartyUsers(Number(filters.party))
      } else if (filters.state === 'state-only') {
        data = await userService.getStateUsers()
      } else {
        data = await userService.getUsers()
      }
      
      setUsers(data)
      setError(null)
    } catch (err) {
      setError('Failed to load users. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesRole = filters.role === 'all' || user.role_id === Number(filters.role)
    const matchesStatus = filters.status === 'all' || user.status === Number(filters.status)
    const matchesSearch = !filters.search || 
      user.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      user.email.toLowerCase().includes(filters.search.toLowerCase())
    
    return matchesRole && matchesStatus && matchesSearch
  })

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredUsers.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredUsers.map(u => u.id)))
    }
  }

  const toggleSelect = (id: number) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  const handleDelete = async () => {
    try {
      const ids = Array.from(selectedIds)
      await Promise.all(ids.map(id => userService.deleteUser(id)))
      setUsers(users.filter(u => !selectedIds.has(u.id)))
      setSelectedIds(new Set())
      setIsDeleteOpen(false)
      setDeleteInput('')
    } catch (err) {
      console.error('Delete failed:', err)
    }
  }

  const handleToggleStatus = async (id: number) => {
    try {
      const updatedUser = await userService.toggleUser(id)
      setUsers(users.map(u => u.id === id ? updatedUser : u))
    } catch (err) {
      console.error('Toggle status failed:', err)
    }
  }

  const numSelected = selectedIds.size
  const isSelectionActive = numSelected > 0

  if (loading && users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-[#146c4f]" />
        <p className="text-gray-500 font-medium">Loading users...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mt-2 sm:mt-4">
         <p className="text-sm text-gray-500 max-w-2xl">Manage system users, assign specific permissions, and control access levels across National and State hierarchies within the KYL database.</p>
         <Link to="/k8s9d7f3-users-add">
           <Button className="bg-[#146c4f] hover:bg-[#115a42] text-white rounded-lg px-4 py-2 h-10 flex items-center justify-center shadow w-full sm:w-auto">
               <Plus className="w-4 h-4 mr-2" />
               Add User
           </Button>
         </Link>
      </div>

      {/* Filter Bar - Scrollable on mobile */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-4 bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
         <div className="relative flex-1 w-full min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input 
              type="text" 
              placeholder="Search by name or email..." 
              className="pl-9 bg-gray-50/50 border-gray-200 shadow-none rounded-xl h-10 w-full"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
         </div>
         
         <div className="flex items-center gap-3 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0 hide-scrollbar">
           <Select value={filters.role} onValueChange={(v) => setFilters({ ...filters, role: v })}>
             <SelectTrigger className="w-[130px] shrink-0 h-10 rounded-xl bg-gray-50/50 border-gray-200">
               <span className="text-gray-500 mr-1">Role:</span> <SelectValue />
             </SelectTrigger>
             <SelectContent>
               <SelectItem value="all">All Roles</SelectItem>
               {roles.map(r => <SelectItem key={r.id} value={r.id.toString()}>{r.name}</SelectItem>)}
             </SelectContent>
           </Select>

           <Select value={filters.party} onValueChange={(v) => setFilters({ ...filters, party: v, state: 'all' })}>
             <SelectTrigger className="w-[140px] shrink-0 h-10 rounded-xl bg-gray-50/50 border-gray-200">
               <span className="text-gray-500 mr-1">Party:</span> <SelectValue />
             </SelectTrigger>
             <SelectContent>
               <SelectItem value="all">All Parties</SelectItem>
               {parties.map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>)}
             </SelectContent>
           </Select>

           <Select value={filters.state} onValueChange={(v) => setFilters({ ...filters, state: v, party: 'all' })}>
             <SelectTrigger className="w-[140px] shrink-0 h-10 rounded-xl bg-gray-50/50 border-gray-200">
               <span className="text-gray-500 mr-1">Level:</span> <SelectValue />
             </SelectTrigger>
             <SelectContent>
               <SelectItem value="all">National</SelectItem>
               <SelectItem value="state-only">State Users</SelectItem>
             </SelectContent>
           </Select>

           <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v })}>
             <SelectTrigger className="w-[120px] shrink-0 h-10 rounded-xl bg-gray-50/50 border-gray-200">
               <span className="text-gray-500 mr-1">Status:</span> <SelectValue />
             </SelectTrigger>
             <SelectContent>
               <SelectItem value="all">All Status</SelectItem>
               <SelectItem value="1">Active</SelectItem>
               <SelectItem value="0">Inactive</SelectItem>
             </SelectContent>
           </Select>
           
           <div className="h-8 w-px bg-gray-200 mx-1 shrink-0 hidden sm:block" />

           <button className="p-2 text-gray-500 hover:text-gray-800 transition-colors shrink-0 hidden sm:block">
              <Download className="w-5 h-5" />
           </button>
           
           <div className="flex items-center bg-gray-100 rounded-lg p-1 shrink-0 hidden sm:flex">
              <button className="p-1 px-3 bg-[#146c4f] text-white rounded shadow-sm"><ListIcon className="w-4 h-4" /></button>
              <button className="p-1 px-3 text-gray-500 hover:text-gray-800"><LayoutGrid className="w-4 h-4" /></button>
           </div>
         </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 text-sm font-medium">
          {error}
          <button onClick={fetchUsers} className="ml-4 underline">Try Again</button>
        </div>
      )}

      {/* Table Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto relative min-h-[300px]">
         {loading && (
           <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center">
             <Loader2 className="w-8 h-8 animate-spin text-[#146c4f]" />
           </div>
         )}

         {/* Contextual Action Bar Overlay */}
         {isSelectionActive && (
           <div className="absolute inset-x-0 top-0 h-16 min-h-[64px] bg-[#187555] text-white z-20 flex items-center justify-between px-4 sm:px-6 lg:px-8 animate-in slide-in-from-top-2 fade-in duration-200 shadow-md whitespace-nowrap overflow-x-auto hide-scrollbar">
             <div className="flex items-center gap-3 sm:gap-4 shrink-0 mr-4">
                <button className="w-8 h-8 rounded shrink-0 bg-white/20 flex items-center justify-center text-white cursor-pointer hover:bg-white/30" onClick={toggleSelectAll}>
                   <Check className="w-5 h-5" />
                </button>
                <div>
                   <span className="font-semibold block leading-tight text-sm sm:text-base">{numSelected} Selected</span>
                   <span className="text-[10px] sm:text-xs text-emerald-100 block opacity-90 hidden sm:block">Apply actions to the selected records</span>
                </div>
             </div>
             <div className="flex items-center gap-2 shrink-0">
                <Button variant="outline" className="bg-white/10 hover:bg-white/20 border-white/20 text-white rounded-lg h-8 sm:h-9 text-xs sm:text-sm font-medium px-3 sm:px-4" onClick={() => setIsDeactivateOpen(true)}>
                   <UserMinus className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 opacity-70" />
                   DEACTIVATE
                </Button>
                <Button variant="outline" className="bg-white/10 hover:bg-white/20 border-white/20 text-white rounded-lg h-8 sm:h-9 text-xs sm:text-sm font-medium px-3 sm:px-4" onClick={() => setIsRoleOpen(true)}>
                   <ShieldAlert className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 text-emerald-200" />
                   CHANGE ROLE
                </Button>
                <Button className="bg-red-500 hover:bg-red-600 border border-red-500 text-white rounded-lg h-8 sm:h-9 text-xs sm:text-sm font-medium px-3 sm:px-5" onClick={() => setIsDeleteOpen(true)}>
                   <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 opacity-80" />
                   DELETE
                </Button>
                <button className="ml-2 sm:ml-4 p-1.5 text-emerald-200 hover:text-white transition-colors" onClick={() => setSelectedIds(new Set())}>
                   <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
             </div>
           </div>
         )}

         <div className="min-w-[800px]">
           <Table>
             <TableHeader>
               <TableRow className="hover:bg-transparent border-gray-100">
                 <TableHead className="w-12 px-6">
                   <Checkbox 
                     checked={selectedIds.size === filteredUsers.length && filteredUsers.length > 0} 
                     onCheckedChange={toggleSelectAll} 
                     className="rounded-[4px] border-gray-300"
                   />
                 </TableHead>
                 <TableHead className="text-[0.65rem] font-bold text-gray-500 tracking-wider">USER ID</TableHead>
                 <TableHead className="text-[0.65rem] font-bold text-gray-500 tracking-wider">FULL NAME</TableHead>
                 <TableHead className="text-[0.65rem] font-bold text-gray-500 tracking-wider">EMAIL</TableHead>
                 <TableHead className="text-[0.65rem] font-bold text-gray-500 tracking-wider">ROLE</TableHead>
                 <TableHead className="text-[0.65rem] font-bold text-gray-500 tracking-wider">LEVEL</TableHead>
                 <TableHead className="text-[0.65rem] font-bold text-gray-500 tracking-wider">STATUS</TableHead>
                 <TableHead className="text-[0.65rem] font-bold text-gray-500 tracking-wider">ACTIONS</TableHead>
               </TableRow>
             </TableHeader>
             <TableBody>
               {filteredUsers.map((item) => {
                 const isSelected = selectedIds.has(item.id)
                 const status = item.status === 1 ? 'Active' : 'Inactive'
                 const level = item.state_id ? 'State' : 'National'
                 
                 return (
                   <TableRow 
                     key={item.id} 
                     className={`group transition-colors border-gray-50 ${isSelected ? 'bg-[#dcfce7]/20 border-[#146c4f]/20' : 'hover:bg-gray-50/50'}`}
                   >
                      <TableCell className="px-6 py-5">
                        <Checkbox checked={isSelected} onCheckedChange={() => toggleSelect(item.id)} className="rounded-[4px] border-gray-300 data-[state=checked]:bg-[#146c4f] data-[state=checked]:border-[#146c4f]" />
                      </TableCell>
                      <TableCell className="font-medium text-gray-400 text-xs tracking-wide">
                        #KYL-{item.id.toString().padStart(4, '0')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                           <Avatar className="w-8 h-8 rounded-full border border-gray-100 shadow-sm bg-blue-100 shrink-0">
                             <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${item.id}`} />
                             <AvatarFallback className="text-[10px] bg-slate-200">
                               {item.name.substring(0,2).toUpperCase()}
                             </AvatarFallback>
                           </Avatar>
                           <span className="font-semibold text-gray-900 whitespace-nowrap">{item.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-500 font-medium whitespace-nowrap">{item.email}</TableCell>
                      <TableCell>
                         <Badge variant="secondary" className={`whitespace-nowrap ${
                           item.role?.name.includes('Super') ? 'bg-purple-100 text-purple-700 hover:bg-purple-100 font-semibold' : 
                           item.role?.name.includes('Party') ? 'bg-blue-100 text-blue-700 hover:bg-blue-100 font-semibold' : 
                           'bg-gray-100 text-gray-700 hover:bg-gray-100 font-semibold'
                         }`}>
                           {item.role?.name || 'User'}
                         </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-gray-700">{level}</TableCell>
                      <TableCell>
                         <span className="flex items-center gap-1.5 font-semibold text-[0.8rem] whitespace-nowrap">
                           <span className={`w-1.5 h-1.5 rounded-full ${status === 'Active' ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
                           <span className={status === 'Active' ? 'text-emerald-600' : 'text-gray-500'}>
                             {status}
                           </span>
                         </span>
                      </TableCell>
                      <TableCell>
                         <div className="flex items-center gap-3 w-16">
                           {status === 'Active' && (
                             <button 
                               onClick={() => navigate(`/k8s9d7f3-users-view/${item.id}`)}
                               className="text-[#146c4f] font-semibold text-xs hover:underline"
                             >
                               View
                             </button>
                           )}
                           <DropdownMenu>
                             <DropdownMenuTrigger asChild>
                               <button className="text-gray-400 hover:text-gray-700 p-1 rounded-md ml-auto"><MoreVertical className="w-4 h-4" /></button>
                             </DropdownMenuTrigger>
                             <DropdownMenuContent align="end">
                               <DropdownMenuItem onClick={() => navigate(`/k8s9d7f3-users-view/${item.id}`)}>View Details</DropdownMenuItem>
                               <DropdownMenuItem onClick={() => navigate(`/k8s9d7f3-users-edit/${item.id}`)}>Edit Profile</DropdownMenuItem>
                               <DropdownMenuItem onClick={() => {
                                 setTargetUserId(item.id)
                                 setIsPasswordOpen(true)
                               }}>Reset Password</DropdownMenuItem>
                               <DropdownMenuItem onClick={() => handleToggleStatus(item.id)} className={status === 'Active' ? 'text-amber-600' : 'text-emerald-600'}>
                                 {status === 'Active' ? 'Suspend User' : 'Activate User'}
                               </DropdownMenuItem>
                               <DropdownMenuItem className="text-red-500 focus:text-red-600" onClick={() => {
                                 setSelectedIds(new Set([item.id]))
                                 setIsDeleteOpen(true)
                               }}>Delete User</DropdownMenuItem>
                             </DropdownMenuContent>
                           </DropdownMenu>
                         </div>
                      </TableCell>
                   </TableRow>
                 )
               })}
             </TableBody>
           </Table>
         </div>

         {/* Pagination Footer */}
         <div className="bg-gray-50/50 p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between text-sm gap-4">
            <span className="text-gray-500 font-medium ml-2">Showing {filteredUsers.length} users</span>
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto justify-center">
               <button className="w-8 h-8 shrink-0 flex items-center justify-center rounded border border-gray-200 text-gray-400 hover:bg-white bg-transparent"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg></button>
               <button className="w-8 h-8 shrink-0 flex items-center justify-center rounded bg-[#146c4f] text-white font-medium border border-[#146c4f]">1</button>
               <button className="w-8 h-8 shrink-0 flex items-center justify-center rounded border border-gray-200 text-gray-700 hover:bg-white bg-white shadow-sm"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg></button>
            </div>
         </div>
      </div>

      {/* --- Batch Actions Modals --- */}

      {/* 1. Delete Action Dialog */}
      <AnimatedConfirmDialog
        open={isDeleteOpen}
        onOpenChange={(open) => {
          setIsDeleteOpen(open)
          if (!open) setDeleteInput('')
        }}
        variant="danger"
        icon="trash"
        title="Confirm Permanent Deletion"
        description="High-risk administrative action"
        confirmText="Permanently Delete"
        onConfirm={handleDelete}
        confirmDisabled={deleteInput !== 'DELETE'}
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
           <p className="text-gray-700 leading-relaxed font-medium">Are you sure you want to permanently delete <span className="text-red-600 font-bold">{numSelected} user(s)</span>?</p>
           <div className="bg-gray-50 rounded-lg p-4 text-gray-600 text-sm border border-gray-100">
             This action <strong>cannot be undone</strong> and will remove all their access, history, and associated data from the KYL Admin database permanently.
           </div>
           
           <div className="space-y-2 mt-6">
             <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">To confirm, please type 'DELETE' in the field below:</label>
             <Input 
               value={deleteInput} 
               onChange={(e) => setDeleteInput(e.target.value)} 
               placeholder="DELETE" 
               className="border-gray-200 font-medium tracking-widest text-red-600 placeholder:text-gray-300"
             />
           </div>
        </div>
      </AnimatedConfirmDialog>

      {/* 2. Deactivate Action Dialog */}
      <AnimatedConfirmDialog
        open={isDeactivateOpen}
        onOpenChange={setIsDeactivateOpen}
        variant="warning"
        icon={<ShieldAlert className="w-6 h-6" />}
        title="Deactivate User Accounts?"
        description="Medium-risk administrative action"
        confirmText="Deactivate Users"
        onConfirm={async () => {
          try {
            const ids = Array.from(selectedIds)
            await Promise.all(ids.map(id => userService.toggleUser(id)))
            fetchUsers()
            setSelectedIds(new Set())
            setIsDeactivateOpen(false)
          } catch (err) {
            console.error('Bulk deactivate failed:', err)
          }
        }}
      >
        <div className="space-y-4 pr-1">
           <p className="text-gray-700 leading-relaxed font-medium">Are you sure you want to deactivate these <span className="text-amber-500 font-bold">{numSelected} users</span>?</p>
           <div className="bg-gray-50 rounded-lg p-3 sm:p-4 text-gray-600 text-sm border border-gray-100">
             This will immediately revoke access. They will be transferred to the Inactive tab.
           </div>
           
           <div className="space-y-4 mt-4 sm:mt-6">
             <div className="space-y-1.5">
                <label className="text-xs text-gray-500">Reason for Deactivation</label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Select a reason" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="security">Security Protocol</SelectItem>
                    <SelectItem value="leave">Temporary Leave</SelectItem>
                  </SelectContent>
                </Select>
             </div>
           </div>
        </div>
      </AnimatedConfirmDialog>

      {/* 3. Change Role Action Dialog */}
      <AnimatedConfirmDialog
        open={isRoleOpen}
        onOpenChange={setIsRoleOpen}
        variant="warning"
        icon="alert"
        title="Change User Role"
        confirmText="Confirm Role Change"
        onConfirm={async () => {
           // This would require a bulk update endpoint or calling updateUser for each
           setIsRoleOpen(false)
        }}
      >
        <div className="space-y-4">
           <div className="bg-orange-50/50 rounded-xl p-3 sm:p-4 border border-orange-100 flex gap-3">
              <ShieldAlert className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
              <div>
                 <p className="font-semibold text-gray-900 text-sm">Update Role for Selected Users?</p>
                 <p className="text-gray-500 text-sm mt-1">Changes permissions for {numSelected} users.</p>
              </div>
           </div>
           
           <div className="space-y-2 mt-4 pt-2">
             <label className="text-sm font-semibold text-gray-700">Select New Role</label>
             <Select defaultValue="party">
               <SelectTrigger className="h-12"><SelectValue placeholder="Select a role" /></SelectTrigger>
               <SelectContent>
                 <SelectItem value="super">Super Admin</SelectItem>
                 <SelectItem value="party">Party Admin</SelectItem>
               </SelectContent>
             </Select>
           </div>
        </div>
      </AnimatedConfirmDialog>

      {/* 4. Reset Password Dialog */}
      <AnimatedConfirmDialog
        open={isPasswordOpen}
        onOpenChange={setIsPasswordOpen}
        variant="warning"
        icon={<Lock className="w-6 h-6" />}
        title="Reset User Password"
        confirmText="Update Password"
        onConfirm={async () => {
          if (!targetUserId || passwordData.password !== passwordData.confirm) return
          try {
            await userService.updatePassword(targetUserId, { 
              password: passwordData.password,
              password_confirmation: passwordData.confirm 
            })
            setIsPasswordOpen(false)
            setPasswordData({ password: '', confirm: '' })
            alert('Password updated successfully')
          } catch (err) {
            console.error('Password update failed:', err)
            alert('Failed to update password')
          }
        }}
        confirmDisabled={!passwordData.password || passwordData.password !== passwordData.confirm}
      >
        <div className="space-y-4">
           <div className="space-y-2">
             <label className="text-sm font-semibold text-gray-700">New Password</label>
             <Input 
               type="password"
               value={passwordData.password} 
               onChange={(e) => setPasswordData({ ...passwordData, password: e.target.value })} 
               placeholder="Enter new password" 
               className="h-12"
             />
           </div>
           <div className="space-y-2">
             <label className="text-sm font-semibold text-gray-700">Confirm Password</label>
             <Input 
               type="password"
               value={passwordData.confirm} 
               onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })} 
               placeholder="Confirm new password" 
               className="h-12"
             />
           </div>
           {passwordData.password !== passwordData.confirm && passwordData.confirm !== '' && (
             <p className="text-xs text-red-500 font-medium">Passwords do not match</p>
           )}
        </div>
      </AnimatedConfirmDialog>

    </div>
  )
}
