import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { userService } from '@/services/users'
import { User } from '@/services/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  Shield, 
  Calendar, 
  Activity,
  Loader2,
  Edit,
  Plus,
  Trash2,
} from 'lucide-react'
import { format } from 'date-fns'

export default function UserDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchUser()
  }, [id])

  const fetchUser = async () => {
    if (!id) return
    try {
      setLoading(true)
      const data = await userService.getUser(Number(id))
      setUser(data)
    } catch (err) {
      setError('Failed to load user details.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!user) return
    const confirmed = window.confirm('Delete this user? This action cannot be undone.')
    if (!confirmed) return

    try {
      setDeleting(true)
      await userService.deleteUser(user.id)
      if (user.party_id) {
        navigate(`/k8s9d7f3-parties/${user.party_id}`, { state: { activeTab: 'Users' } })
      } else {
        navigate('/k8s9d7f3-users')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user.')
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#146c4f]" />
        <p className="mt-4 text-gray-500 font-medium">Loading user profile...</p>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 font-medium">{error || 'User not found'}</p>
        <Button
          variant="outline"
          onClick={() => {
            if (user?.party_id) {
              navigate(`/k8s9d7f3-parties/${user.party_id}`, { state: { activeTab: 'Users' } })
            } else {
              navigate('/k8s9d7f3-users')
            }
          }}
          className="mt-4"
        >
          Back to Users
        </Button>
      </div>
    )
  }

  const statusColor = user.status === 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'
  const level = user.state_id ? 'State Admin' : 'National Admin'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => {
            if (user?.party_id) {
              navigate(`/k8s9d7f3-parties/${user.party_id}`, { state: { activeTab: 'Users' } })
            } else {
              navigate('/k8s9d7f3-users')
            }
          }}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Users
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={() => navigate('/k8s9d7f3-users-add')}
            className="gap-2"
          >
            <Plus className="w-4 h-4" /> Add User
          </Button>
          <Button
            variant="outline"
            onClick={handleDeleteUser}
            disabled={deleting}
            className="gap-2 text-red-600 border-red-200 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" /> {deleting ? 'Deleting...' : 'Delete'}
          </Button>
          <Button 
            onClick={() => navigate(`/k8s9d7f3-users-edit/${user.id}`)}
            className="bg-[#146c4f] hover:bg-[#115a42] text-white gap-2"
          >
            <Edit className="w-4 h-4" /> Edit Profile
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile Card */}
        <Card className="lg:col-span-1 shadow-sm border-gray-100">
          <CardContent className="pt-8 pb-6 text-center">
            <Avatar className="w-24 h-24 mx-auto border-4 border-white shadow-md">
              <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`} />
              <AvatarFallback className="text-2xl bg-[#146c4f] text-white">
                {user.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <h2 className="mt-4 text-xl font-bold text-gray-900">{user.name}</h2>
            <p className="text-gray-500 text-sm">{user.role?.name || 'Administrative User'}</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Badge className={statusColor}>
                {user.status === 1 ? 'Active' : 'Inactive'}
              </Badge>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100">
                {level}
              </Badge>
            </div>
          </CardContent>
          <div className="border-t border-gray-100 p-6 space-y-4">
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Mail className="w-4 h-4 text-gray-400" />
              <span className="truncate">{user.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Phone className="w-4 h-4 text-gray-400" />
              <span>{user.phoneNo || 'No phone number'}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span>Joined {user.email_verified_at ? format(new Date(user.email_verified_at), 'MMM dd, yyyy') : 'N/A'}</span>
            </div>
          </div>
        </Card>

        {/* Right Column: Detailed Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-sm border-gray-100">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#146c4f]" />
                Access
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Role Assignment</h4>
                  <p className="text-sm font-semibold text-gray-700">{user.role?.name || 'User'}</p>
                  <p className="text-xs text-gray-500 mt-1">Full administrative access across the platform.</p>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Geography</h4>
                  <p className="text-sm font-semibold text-gray-700">{user.state_id ? 'Assigned State' : 'National Authority'}</p>
                  <p className="text-xs text-gray-500 mt-1">{user.state_id ? `Monitoring State ID: ${user.state_id}` : 'Access to all states and districts.'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-gray-100">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#146c4f]" />
                Recent System Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500 text-sm">
                <p>Activity history integration coming soon.</p>
                <Button 
                  variant="link" 
                  className="text-[#146c4f] mt-2"
                  onClick={() => navigate('/k8s9d7f3-activity-logs')}
                >
                  View Global Logs
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
