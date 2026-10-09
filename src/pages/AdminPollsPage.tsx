import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Edit2, Trash2, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { pollService } from '@/services/polls'

export default function AdminPollsPage() {
  const [polls, setPolls] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  const fetchPolls = async () => {
    setLoading(true)
    try {
      // The API doesn't have an admin-specific list, we can just use the public one 
      // or we can fetch without status filters if the public one is restricted.
      // Wait, the public one only returns active/closed. 
      // Assuming public one is fine for now or if we need all, we should have an admin endpoint.
      // For now, let's use getPolls() which fetches public ones.
      const data = await pollService.getPolls()
      setPolls(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load polls')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPolls()
  }, [])

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this poll?')) return
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || '/api'}/polls/${id}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      if (!response.ok) throw new Error('Failed to delete poll')
      setPolls(polls.filter(p => p.id !== id))
    } catch (err: any) {
      alert(err.message)
    }
  }

  const filteredPolls = polls.filter(poll => 
    poll.question.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Polls Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage public opinion polls.</p>
        </div>
        <Link to="/k8s9d7f3-polls-add">
          <Button className="bg-[#146c4f] hover:bg-[#115a42] text-white flex items-center gap-2">
            <Plus className="w-4 h-4" /> Create Poll
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"><div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search polls..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div></div>
          ) : error ? (
            <div className="text-red-500 py-4">{error}</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-gray-100 bg-gray-50/50">
                    <TableHead className="text-[0.65rem] font-bold text-gray-500 tracking-wider h-11 px-6">Question</TableHead>
                    <TableHead className="text-[0.65rem] font-bold text-gray-500 tracking-wider h-11 px-6">Status</TableHead>
                    <TableHead className="text-[0.65rem] font-bold text-gray-500 tracking-wider h-11 px-6">Start Date</TableHead>
                    <TableHead className="text-[0.65rem] font-bold text-gray-500 tracking-wider h-11 px-6">End Date</TableHead>
                    <TableHead className="text-[0.65rem] font-bold text-gray-500 tracking-wider h-11 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPolls.map((poll) => (
                    <TableRow key={poll.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                      <TableCell className="px-6 py-4 font-medium text-sm text-gray-900">{poll.question}</TableCell>
                      <TableCell className="px-6 py-4 text-sm text-gray-600">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          poll.status === 'active' ? 'bg-green-100 text-green-700' :
                          poll.status === 'closed' ? 'bg-gray-100 text-gray-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {poll.status}
                        </span>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-sm text-gray-600">{new Date(poll.starts_at).toLocaleDateString()}</TableCell>
                      <TableCell className="px-6 py-4 text-sm text-gray-600">{new Date(poll.ends_at).toLocaleDateString()}</TableCell>
                      <TableCell className="px-6 py-4 text-right text-sm">
                        <div className="flex justify-end gap-2">
                          <Link to={`/k8s9d7f3-polls-edit/${poll.id}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                              <Edit2 className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleDelete(poll.id)}
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredPolls.length === 0 && (
                    <TableRow className="hover:bg-transparent border-gray-100 bg-gray-50/50">
                      <TableCell colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                        No polls found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div></div>
    </div>
  )
}





