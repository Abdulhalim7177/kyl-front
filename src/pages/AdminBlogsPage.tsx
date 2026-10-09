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
import { blogService, Post } from '@/services/blogs'

export default function AdminBlogsPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  const fetchPosts = async () => {
    setLoading(true)
    try {
      const data = await blogService.getPosts()
      setPosts(data.data)
    } catch (err: any) {
      setError(err.message || 'Failed to load posts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [])

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this post?')) return
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || '/api'}/blog/delete-post/${id}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      if (!response.ok) throw new Error('Failed to delete post')
      setPosts(posts.filter(p => p.id !== id))
    } catch (err: any) {
      alert(err.message)
    }
  }

  const filteredPosts = posts.filter(post => 
    post.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Blogs Management</h1>
          <p className="text-muted-foreground">Manage news, announcements, and press releases.</p>
        </div>
        <Link to="/k8s9d7f3-blogs-add">
          <Button className="bg-[#146c4f] hover:bg-[#115a42] text-white flex items-center gap-2">
            <Plus className="w-4 h-4" /> Create Post
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"><div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search posts..."
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
                    <TableHead className="text-[0.65rem] font-bold text-gray-500 tracking-wider h-11 px-6">Title</TableHead>
                    <TableHead className="text-[0.65rem] font-bold text-gray-500 tracking-wider h-11 px-6">Category</TableHead>
                    <TableHead className="text-[0.65rem] font-bold text-gray-500 tracking-wider h-11 px-6">Date</TableHead>
                    <TableHead className="text-[0.65rem] font-bold text-gray-500 tracking-wider h-11 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPosts.map((post) => (
                    <TableRow key={post.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                      <TableCell className="px-4 py-3 font-medium max-w-[300px] truncate">{post.title}</TableCell>
                      <TableCell className="px-6 py-4 text-sm text-gray-600">{post.type?.name || 'Uncategorized'}</TableCell>
                      <TableCell className="px-6 py-4 text-sm text-gray-600">{new Date(post.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="px-6 py-4 text-right text-sm">
                        <div className="flex justify-end gap-2">
                          <Link to={`/k8s9d7f3-blogs-edit/${post.id}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                              <Edit2 className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleDelete(post.id)}
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredPosts.length === 0 && (
                    <TableRow className="hover:bg-transparent border-gray-100 bg-gray-50/50">
                      <TableCell colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                        No posts found.
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




