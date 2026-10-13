import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CalendarDays, Image as ImageIcon, Loader2, Pencil, Trash2 } from 'lucide-react'
import { AnimatedConfirmDialog } from '@/components/AnimatedConfirmDialog'
import { Button } from '@/components/ui/button'
import { blogService, getPostImageUrl, Post, PostImage } from '@/services/blogs'

const primaryButtonClass = 'bg-[#146c4f] text-white hover:bg-[#115a42]'

export default function AdminBlogDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [post, setPost] = useState<Post | null>(null)
  const [images, setImages] = useState<PostImage[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [imageToDelete, setImageToDelete] = useState<PostImage | null>(null)

  useEffect(() => {
    let active = true

    const loadPost = async () => {
      if (!id) {
        setError('Post not found.')
        setLoading(false)
        return
      }

      setLoading(true)
      setError('')
      try {
        const [postResult, imageResults] = await Promise.all([
          blogService.getPost(Number(id)),
          blogService.getPostImages(Number(id)),
        ])
        if (!active) return
        setPost(postResult)
        setImages(imageResults.length ? imageResults : postResult.images || (postResult.image ? [postResult.image] : []))
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Unable to load post details.')
      } finally {
        if (active) setLoading(false)
      }
    }

    void loadPost()
    return () => { active = false }
  }, [id])

  const deleteImage = async () => {
    if (!imageToDelete) return
    setSaving(true)
    setError('')
    try {
      await blogService.deletePostImage(imageToDelete.id)
      setImages(current => current.filter(image => image.id !== imageToDelete.id))
      setImageToDelete(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete this image.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex min-h-[50vh] items-center justify-center gap-3 text-sm text-gray-500"><Loader2 className="h-5 w-5 animate-spin text-[#146c4f]" />Loading post...</div>
  }

  if (!post) {
    return (
      <div className="mx-auto max-w-4xl space-y-5">
        <Link to="/k8s9d7f3-blogs"><Button type="button" variant="outline" className="rounded-xl"><ArrowLeft className="mr-2 h-4 w-4" />Back to posts</Button></Link>
        <div role="alert" className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">{error || 'Post not found.'}</div>
      </div>
    )
  }

  const postType = post.type?.name || 'Blog post'
  const createdDate = post.created_at && !Number.isNaN(Date.parse(post.created_at))
    ? new Date(post.created_at).toLocaleDateString()
    : null

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/k8s9d7f3-blogs"><Button type="button" variant="outline" className="rounded-xl"><ArrowLeft className="mr-2 h-4 w-4" />Back to posts</Button></Link>
        <Link to={`/k8s9d7f3-blogs-edit/${post.id}`}><Button type="button" className={`${primaryButtonClass} rounded-xl`}><Pencil className="mr-2 h-4 w-4" />Edit post</Button></Link>
      </div>

      {error && <div role="alert" className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <article className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <header className="space-y-4 border-b border-gray-100 p-5 sm:p-8">
          <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-[#146c4f]">{postType}</span>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">{post.title}</h1>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <CalendarDays className="h-4 w-4" />{createdDate || 'Date unavailable'}
          </div>
        </header>

        <div className="space-y-8 p-5 sm:p-8">
          {images.length > 0 && (
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-800"><ImageIcon className="h-4 w-4" />Post images</h2>
              <div className={`grid gap-4 ${images.length === 1 ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
                {images.map(image => {
                  const imageUrl = getPostImageUrl(image)
                  if (!imageUrl) return null
                  return (
                    <div key={image.id} className="group relative overflow-hidden rounded-xl bg-gray-100">
                      <img src={imageUrl} alt={post.title} className="block h-auto w-full object-contain" />
                      <button type="button" onClick={() => setImageToDelete(image)} aria-label="Delete image" title="Delete image" className="absolute right-3 top-3 rounded-lg bg-white/95 p-2 text-gray-600 shadow transition hover:bg-red-50 hover:text-red-600 sm:opacity-0 sm:group-hover:opacity-100"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          <section>
            <h2 className="mb-3 text-sm font-semibold text-gray-800">Content</h2>
            <div className="whitespace-pre-wrap text-sm leading-7 text-gray-700">{post.content}</div>
          </section>
        </div>
      </article>

      <AnimatedConfirmDialog
        open={Boolean(imageToDelete)}
        onOpenChange={open => { if (!open && !saving) setImageToDelete(null) }}
        title="Delete image?"
        description="Are you sure you want to delete this image? This action cannot be undone."
        variant="danger"
        icon="trash"
        confirmText={saving ? 'Deleting...' : 'Delete'}
        confirmDisabled={saving}
        onConfirm={() => void deleteImage()}
      />
    </div>
  )
}
