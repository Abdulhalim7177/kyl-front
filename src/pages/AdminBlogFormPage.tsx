import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { blogService, PostType } from '@/services/blogs'

export default function AdminBlogFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEditing = !!id

  const [loading, setLoading] = useState(false)
  const [initLoading, setInitLoading] = useState(true)
  const [error, setError] = useState('')
  const [categories, setCategories] = useState<PostType[]>([])

  const [formData, setFormData] = useState({
    title: '',
    post_type_id: '',
    content: ''
  })
  
  const [imageFile, setImageFile] = useState<File | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const cats = await blogService.getPostTypes()
        setCategories(cats)
        
        if (isEditing) {
          const post = await blogService.getPost(Number(id))
          setFormData({
            title: post.title,
            post_type_id: post.post_type_id?.toString() || '',
            content: post.content
          })
        }
      } catch (err: any) {
        setError('Failed to load data')
      } finally {
        setInitLoading(false)
      }
    }
    fetchData()
  }, [id, isEditing])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const url = `${import.meta.env.VITE_API_BASE_URL || '/api'}/blog/${isEditing ? 'update-post' : 'create-post'}`
      
      const payload = new FormData()
      if (isEditing) payload.append('id', id as string)
      payload.append('title', formData.title)
      payload.append('post_type_id', formData.post_type_id)
      payload.append('content', formData.content)
      
      if (imageFile) {
        payload.append('images[]', imageFile)
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: payload
      })

      if (!response.ok) {
        const resData = await response.json()
        throw new Error(resData.message || 'Failed to save post')
      }

      navigate('/k8s9d7f3-blogs')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  if (initLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#146c4f]" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate(-1)}
          className="text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Edit Blog Post' : 'Add New Post'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isEditing ? 'Update the details of an existing article.' : 'Create a new blog post or news article.'}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Title</label>
              <Input 
                required 
                name="title" 
                value={formData.title} 
                onChange={handleChange} 
                placeholder="Article title" 
                className="rounded-xl border-gray-200"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Category</label>
              <select 
                required 
                name="post_type_id" 
                value={formData.post_type_id} 
                onChange={handleChange} 
                className="w-full border border-gray-200 rounded-xl px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select Category...</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Featured Image</label>
              <Input 
                type="file" 
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    setImageFile(e.target.files[0])
                  }
                }} 
                className="rounded-xl border-gray-200"
              />
              {isEditing && !imageFile && <p className="text-xs text-muted-foreground mt-2">Leave empty to keep existing image</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Content (HTML / Text)</label>
              <Textarea 
                required 
                name="content" 
                value={formData.content} 
                onChange={handleChange} 
                className="min-h-[300px] rounded-xl border-gray-200" 
                placeholder="Write your article content here..." 
              />
            </div>
          </div>

          <div className="pt-6 flex justify-end gap-3 border-t border-gray-100">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate(-1)} 
              className="rounded-xl border-gray-200 text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading} 
              className="rounded-xl bg-[#146c4f] hover:bg-[#115a42] text-white"
            >
              {loading ? 'Saving...' : 'Save Post'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
