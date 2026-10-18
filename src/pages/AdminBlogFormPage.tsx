import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Loader2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import Can from '@/components/Can'
import { Permissions } from '@/lib/permissions'
import { blogService, PostType } from '@/services/blogs'

export default function AdminBlogFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEditing = Boolean(id)
  const [loading, setLoading] = useState(false)
  const [initLoading, setInitLoading] = useState(true)
  const [error, setError] = useState('')
  const [categories, setCategories] = useState<PostType[]>([])
  const [formData, setFormData] = useState({ title: '', post_type_id: '', content: '' })
  const [imageFiles, setImageFiles] = useState<File[]>([])

  useEffect(() => {
    const fetchData = async () => {
      setError('')
      try {
        const types = await blogService.getPostTypes()
        setCategories(types)
        if (isEditing && id) {
          const post = await blogService.getPost(Number(id))
          setFormData({
            title: post.title || '',
            post_type_id: post.post_type_id?.toString() || '',
            content: post.content || '',
          })
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load the post form.')
      } finally {
        setInitLoading(false)
      }
    }
    void fetchData()
  }, [id, isEditing])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const payload = new FormData()
      if (isEditing && id) payload.append('id', id)
      payload.append('title', formData.title.trim())
      payload.append('post_type_id', formData.post_type_id)
      payload.append('content', formData.content)
      imageFiles.forEach(file => payload.append('images[]', file))

      if (isEditing) await blogService.updatePost(payload)
      else await blogService.createPost(payload)
      navigate('/k8s9d7f3-blogs')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save this post.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(current => ({ ...current, [event.target.name]: event.target.value }))
  }

  if (initLoading) {
    return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#146c4f]" /></div>
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center gap-4">
        <Button type="button" variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Go back" className="text-gray-500 hover:text-gray-900">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{isEditing ? 'Edit blog post' : 'Create a post'}</h1>
          <p className="mt-1 text-sm text-gray-500">{isEditing ? 'Update the details, content, or add images.' : 'Write an article or news update for your audience.'}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm md:p-8">
        {error && <div role="alert" className="mb-6 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
        <form onSubmit={event => void handleSubmit(event)} className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.9fr)]">
          <label className="block space-y-2 text-sm font-medium text-gray-700 lg:col-span-2">
            Post title
            <Input required maxLength={255} name="title" value={formData.title} onChange={handleChange} placeholder="Give your post a clear title" className="rounded-xl border-gray-200" />
          </label>

          <label className="block space-y-2 text-sm font-medium text-gray-700">
            Content
            <Textarea required name="content" value={formData.content} onChange={handleChange} className="min-h-[260px] rounded-xl border-gray-200 leading-6" placeholder="Write your post content here..." />
          </label>

          <div className="space-y-5">
            <label className="block space-y-2 text-sm font-medium text-gray-700">
              Post type
              <select required name="post_type_id" value={formData.post_type_id} onChange={handleChange} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#146c4f] focus:ring-2 focus:ring-[#146c4f]/10">
                <option value="">Select a post type</option>
                {categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
              {categories.length === 0 && <span className="block text-xs font-normal text-amber-700">Create a post type before publishing your first post.</span>}
            </label>

            <label className="block space-y-2 text-sm font-medium text-gray-700">
              Images
              <span className="flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-4 text-center transition hover:border-[#146c4f] hover:bg-emerald-50/50">
                <Upload className="h-5 w-5 text-[#146c4f]" />
                <span className="text-sm font-medium text-gray-700">Choose one or more images</span>
                <span className="text-xs font-normal text-gray-500">PNG, JPG, or other image formats</span>
                <Input type="file" accept="image/*" multiple onChange={event => setImageFiles(Array.from(event.target.files || []))} className="sr-only" />
              </span>
              {imageFiles.length > 0 && <span className="block text-xs font-normal text-[#146c4f]">{imageFiles.length} image{imageFiles.length === 1 ? '' : 's'} selected</span>}
              {isEditing && imageFiles.length === 0 && <span className="block text-xs font-normal text-gray-500">Leave empty to keep current images. Remove existing images from the post details view.</span>}
            </label>
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-6 lg:col-span-2">
            <Button type="button" variant="outline" onClick={() => navigate(-1)} className="rounded-xl border-gray-200 text-gray-600">Cancel</Button>
            <Can any={[Permissions.CREATE_POST, Permissions.UPDATE_POST]}>
              <Button type="submit" disabled={loading || categories.length === 0} className="rounded-xl bg-[#146c4f] text-white hover:bg-[#115a42]">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{isEditing ? 'Save changes' : 'Create post'}
              </Button>
            </Can>
          </div>
        </form>
      </div>
    </div>
  )
}
