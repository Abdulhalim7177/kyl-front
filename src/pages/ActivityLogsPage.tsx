import { useState, useEffect } from 'react'
import { userService, ActivityLog } from '@/services/users'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Search, Loader2, Calendar } from 'lucide-react'
import { format } from 'date-fns'

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchLogs()
  }, [])

  const fetchLogs = async () => {
    try {
      setLoading(true)
      const data = await userService.getActivityLogs()
      setLogs(data)
      setError(null)
    } catch (err) {
      setError('Failed to load activity logs.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const filteredLogs = logs.filter(log => {
    const action = (log.action || '').toLowerCase()
    const module = (log.module || '').toLowerCase()
    const userName = (log.user?.name || '').toLowerCase()
    const searchLower = search.toLowerCase()
    
    return action.includes(searchLower) ||
           module.includes(searchLower) ||
           userName.includes(searchLower)
  })

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-[#146c4f]" />
        <p className="text-gray-500 font-medium">Loading activity logs...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <p className="text-sm text-gray-500">Track all administrative actions and system events across the KYL platform.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input 
            placeholder="Search by action, module, or user..." 
            className="pl-9 bg-gray-50/50 border-gray-200"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
           <button className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
             <Calendar className="w-4 h-4" />
             Date Range
           </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 text-sm">
          {error}
          <button onClick={fetchLogs} className="ml-4 underline">Try Again</button>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-gray-100">
                <TableHead className="text-[0.65rem] font-bold text-gray-500 tracking-wider">TIMESTAMP</TableHead>
                <TableHead className="text-[0.65rem] font-bold text-gray-500 tracking-wider">USER</TableHead>
                <TableHead className="text-[0.65rem] font-bold text-gray-500 tracking-wider">ACTION</TableHead>
                <TableHead className="text-[0.65rem] font-bold text-gray-500 tracking-wider">MODULE</TableHead>
                <TableHead className="text-[0.65rem] font-bold text-gray-500 tracking-wider">IP ADDRESS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id} className="hover:bg-gray-50/50 border-gray-50">
                  <TableCell className="whitespace-nowrap text-gray-500 text-xs font-medium">
                    {format(new Date(log.created_at), 'MMM dd, yyyy HH:mm:ss')}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-900 text-sm">{log.user?.name || 'Unknown'}</span>
                      <span className="text-[10px] text-gray-400 font-medium">{log.user?.email || 'N/A'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-gray-700 text-sm">{log.action}</span>
                    <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">{log.details}</p>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600">
                      {log.module}
                    </span>
                  </TableCell>
                  <TableCell className="text-gray-400 text-xs font-mono">
                    {log.ip_address}
                  </TableCell>
                </TableRow>
              ))}
              {filteredLogs.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-gray-500 font-medium">
                    No activity logs found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
