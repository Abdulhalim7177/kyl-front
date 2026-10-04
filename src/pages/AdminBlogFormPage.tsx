import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { Textarea } from '@/components/ui/textarea'
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
      // The API endpoint is `/create-post` and `/update-post` using FormData for file uploads
      const url = `${import.meta.env.VITE_API_BASE_URL || '/api'}/blog/${isEditing ? 'update-post' : 'create-post'}`
      
      const payload = new FormData()
      if (isEditing) payload.append('post_id', id as string)
      payload.append('title', formData.title)
      payload.append('post_type_id', formData.post_type_id)
      payload.append('content', formData.content)
      
      if (imageFile) {
        payload.append('images[]', imageFile)
      }

      const response = await fetch(url, {
        method: 'POST', // Backend expects POST even for update-post based on API route
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
    return <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div></div>
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? 'Edit Blog Post' : 'Create New Post'}</CardTitle>
        </CardHeader>
        <CardContent>
          {error && <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input required name="title" value={formData.title} onChange={handleChange} placeholder="Article title" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <select 
                required 
                name="post_type_id" 
                value={formData.post_type_id} 
                onChange={handleChange} 
                className="w-full border rounded-md px-3 py-2 bg-background"
              >
                <option value="">Select Category...</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Featured Image</label>
              <Input 
                type="file" 
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    setImageFile(e.target.files[0])
                  }
                }} 
              />
              {isEditing && !imageFile && <p className="text-xs text-muted-foreground">Leave empty to keep existing image</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Content (HTML / Text)</label>
              <Textarea 
                required 
                name="content" 
                value={formData.content} 
                onChange={handleChange} 
                className="min-h-[300px]" 
                placeholder="Write your article content here..." 
              />
            </div>

            <div className="pt-4 flex justify-end gap-2 border-t">
              <Button type="button" variant="outline" onClick={() => navigate('/k8s9d7f3-blogs')}>Cancel</Button>
              <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Post'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}


