import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { AnimatedConfirmDialog } from '@/components/AnimatedConfirmDialog'
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
} from 'lucide-react'

// --- Mock Data ---
const MOCK_USERS = [
  { id: '#KYL-2984', name: 'Aisha Zainab', email: 'aisha.z***@kyl.gov', role: 'Super Admin', level: 'National', status: 'Active', avatarIndex: 1 },
  { id: '#KYL-2985', name: 'Musa Ibrahim', email: 'musa.i***@gmail.com', role: 'Support Admin', level: 'State', status: 'Pending', avatarIndex: 2 },
  { id: '#KYL-3012', name: 'Ngozi Musa', email: 'ngozi***@state.gov', role: 'Party Admin', level: 'National', status: 'Active', avatarIndex: 3 },
  { id: '#KYL-3015', name: 'David Johnson', email: 'david.j***@kyl.gov', role: 'Party Support Admin', level: 'State', status: 'Inactive', avatarIndex: 4 },
]

export default function UsersManagementPage() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [deleteInput, setDeleteInput] = useState('')
  
  // Dialog visibility states for batch actions
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isRoleOpen, setIsRoleOpen] = useState(false)
  const [isDeactivateOpen, setIsDeactivateOpen] = useState(false)

  const toggleSelectAll = () => {
    if (selectedIds.size === MOCK_USERS.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(MOCK_USERS.map(u => u.id)))
    }
  }

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  const numSelected = selectedIds.size
  const isSelectionActive = numSelected > 0

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mt-2 sm:mt-4">
         <p className="text-sm text-gray-500 max-w-2xl">Manage system users, assign specific permissions, and control access levels across National and State hierarchies within the KYL database.</p>
         <Button className="bg-[#146c4f] hover:bg-[#115a42] text-white rounded-lg px-4 py-2 h-10 flex items-center justify-center shadow w-full sm:w-auto">
             <Plus className="w-4 h-4 mr-2" />
             Add User
         </Button>
      </div>

      {/* Filter Bar - Scrollable on mobile */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-4 bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
         <div className="relative flex-1 w-full min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input type="text" placeholder="Search by name, email, or digital ID..." className="pl-9 bg-gray-50/50 border-gray-200 shadow-none rounded-xl h-10 w-full" />
         </div>
         
         <div className="flex items-center gap-3 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0 hide-scrollbar">
           <Select defaultValue="all">
             <SelectTrigger className="w-[130px] shrink-0 h-10 rounded-xl bg-gray-50/50 border-gray-200">
               <span className="text-gray-500 mr-1">Role:</span> <SelectValue />
             </SelectTrigger>
             <SelectContent><SelectItem value="all">All</SelectItem></SelectContent>
           </Select>

           <Select defaultValue="all">
             <SelectTrigger className="w-[130px] shrink-0 h-10 rounded-xl bg-gray-50/50 border-gray-200">
               <span className="text-gray-500 mr-1">Level:</span> <SelectValue />
             </SelectTrigger>
             <SelectContent><SelectItem value="all">All</SelectItem></SelectContent>
           </Select>

           <Select defaultValue="all">
             <SelectTrigger className="w-[140px] shrink-0 h-10 rounded-xl bg-gray-50/50 border-gray-200">
               <span className="text-gray-500 mr-1">Status:</span> <SelectValue />
             </SelectTrigger>
             <SelectContent><SelectItem value="all">All</SelectItem></SelectContent>
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

      {/* Table Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto relative">
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
                     checked={selectedIds.size === MOCK_USERS.length && MOCK_USERS.length > 0} 
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
               {MOCK_USERS.map((item) => {
                 const isSelected = selectedIds.has(item.id)
                 return (
                   <TableRow 
                     key={item.id} 
                     className={`group transition-colors border-gray-50 ${isSelected ? 'bg-[#dcfce7]/20 border-[#146c4f]/20' : 'hover:bg-gray-50/50'}`}
                   >
                      <TableCell className="px-6 py-5">
                        <Checkbox checked={isSelected} onCheckedChange={() => toggleSelect(item.id)} className="rounded-[4px] border-gray-300 data-[state=checked]:bg-[#146c4f] data-[state=checked]:border-[#146c4f]" />
                      </TableCell>
                      <TableCell className="font-medium text-gray-400 text-xs tracking-wide">
                        {item.id.replace('-', '\n')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                           <Avatar className="w-8 h-8 rounded-full border border-gray-100 shadow-sm bg-blue-100 shrink-0">
                             <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${item.avatarIndex}`} />
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
                           item.role.includes('Super') ? 'bg-purple-100 text-purple-700 hover:bg-purple-100 font-semibold' : 
                           item.role.includes('Party') ? 'bg-blue-100 text-blue-700 hover:bg-blue-100 font-semibold' : 
                           'bg-gray-100 text-gray-700 hover:bg-gray-100 font-semibold'
                         }`}>
                           {item.role}
                         </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-gray-700">{item.level}</TableCell>
                      <TableCell>
                         <span className="flex items-center gap-1.5 font-semibold text-[0.8rem] whitespace-nowrap">
                           <span className={`w-1.5 h-1.5 rounded-full ${item.status === 'Active' ? 'bg-emerald-500' : item.status === 'Pending' ? 'bg-amber-500' : 'bg-gray-400'}`}></span>
                           <span className={item.status === 'Active' ? 'text-emerald-600' : item.status === 'Pending' ? 'text-amber-600' : 'text-gray-500'}>
                             {item.status}
                           </span>
                         </span>
                      </TableCell>
                      <TableCell>
                         <div className="flex items-center gap-3 w-16">
                           {item.status === 'Active' && <button className="text-[#146c4f] font-semibold text-xs hover:underline">View</button>}
                           <DropdownMenu>
                             <DropdownMenuTrigger asChild>
                               <button className="text-gray-400 hover:text-gray-700 p-1 rounded-md ml-auto"><MoreVertical className="w-4 h-4" /></button>
                             </DropdownMenuTrigger>
                             <DropdownMenuContent align="end">
                               <DropdownMenuItem>View Details</DropdownMenuItem>
                               <DropdownMenuItem>Edit Profile</DropdownMenuItem>
                               <DropdownMenuItem className="text-red-500 focus:text-red-600">Suspend User</DropdownMenuItem>
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
            <span className="text-gray-500 font-medium ml-2">Showing 1 to 4 of 4 users</span>
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
        onOpenChange={setIsDeleteOpen}
        variant="danger"
        icon="trash"
        title="Confirm Permanent Deletion"
        description="High-risk administrative action"
        confirmText="Permanently Delete"
        onConfirm={() => {
          setSelectedIds(new Set())
          setIsDeleteOpen(false)
        }}
        confirmDisabled={deleteInput !== 'DELETE'}
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
           <p className="text-gray-700 leading-relaxed font-medium">Are you sure you want to permanently delete these <span className="text-red-600 font-bold">{numSelected} users</span>?</p>
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
        onConfirm={() => setIsDeactivateOpen(false)}
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
        onConfirm={() => setIsRoleOpen(false)}
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

    </div>
  )
}