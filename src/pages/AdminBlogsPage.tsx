import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  Eye,
  FileText,
  Image as ImageIcon,
  Loader2,
  Pencil,
  Plus,
  Search,
  Tag,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { AnimatedConfirmDialog } from '@/components/AnimatedConfirmDialog'
import Can from '@/components/Can'
import { Permissions } from '@/lib/permissions'
import { blogService, getPostImageUrl, Post, PostType } from '@/services/blogs'

type Tab = 'posts' | 'types'
type DeleteTarget = { kind: 'post'; id: number; label: string } | { kind: 'type'; id: number; label: string }

const cardClass = 'rounded-2xl border border-gray-100 bg-white shadow-sm'
const primaryButtonClass = 'bg-[#146c4f] text-white hover:bg-[#115a42]'
const fieldClass = 'w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#146c4f] focus:ring-2 focus:ring-[#146c4f]/10'

export default function AdminBlogsPage() {
  const [tab, setTab] = useState<Tab>('posts')
  const [posts, setPosts] = useState<Post[]>([])
  const [postTypes, setPostTypes] = useState<PostType[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [search, setSearch] = useState('')
  const [selectedTypeId, setSelectedTypeId] = useState('')
  const [editingType, setEditingType] = useState<PostType | null>(null)
  const [typeDialogOpen, setTypeDialogOpen] = useState(false)
  const [typeName, setTypeName] = useState('')
  const [typeDescription, setTypeDescription] = useState('')
  const [viewingType, setViewingType] = useState<PostType | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)

  const loadPostTypes = useCallback(async () => {
    const result = await blogService.getPostTypes()
    setPostTypes(result)
  }, [])

  const loadPosts = useCallback(async () => {
    const result = selectedTypeId
      ? await blogService.getPostsByType(Number(selectedTypeId))
      : await blogService.getPosts()
    setPosts(result.data)
  }, [selectedTypeId])

  const loadPage = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      await Promise.all([loadPosts(), loadPostTypes()])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load blog content.')
    } finally {
      setLoading(false)
    }
  }, [loadPosts, loadPostTypes])

  useEffect(() => {
    void loadPage()
  }, [loadPage])

  const openTypeDialog = (type?: PostType) => {
    setEditingType(type || null)
    setTypeName(type?.name || '')
    setTypeDescription(type?.description || '')
    setTypeDialogOpen(true)
    setError('')
  }

  const handleTypeSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const values = { name: typeName.trim(), description: typeDescription.trim() }
      if (editingType) {
        await blogService.updatePostType(editingType.id, values)
      } else {
        await blogService.createPostType(values)
      }
      setTypeDialogOpen(false)
      setNotice(editingType ? 'Post type updated.' : 'Post type created.')
      await loadPostTypes()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save this post type.')
    } finally {
      setSaving(false)
    }
  }

  const openTypeDetails = async (typeId: number) => {
    setError('')
    try {
      setViewingType(await blogService.getPostType(typeId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load post type.')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    const target = deleteTarget
    setSaving(true)
    setError('')
    try {
      if (target.kind === 'post') {
        await blogService.deletePost(target.id)
        setPosts(current => current.filter(post => post.id !== target.id))
        setNotice('Post and its images deleted.')
      } else {
        await blogService.deletePostType(target.id)
        setPostTypes(current => current.filter(type => type.id !== target.id))
        if (selectedTypeId === String(target.id)) setSelectedTypeId('')
        setNotice('Post type deleted.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete this item.')
    } finally {
      setSaving(false)
      setDeleteTarget(null)
    }
  }

  const filteredPosts = posts.filter(post => (
    `${post.title} ${post.type?.name || ''}`.toLowerCase().includes(search.trim().toLowerCase())
  ))

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-[#146c4f]">
            <BookOpen className="h-4 w-4" /> Content management
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Blog</h1>
          <p className="mt-1 text-sm text-gray-500">Create and organize articles, announcements, and updates.</p>
        </div>
        {tab === 'posts' ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <select
              value={selectedTypeId}
              onChange={event => setSelectedTypeId(event.target.value)}
              className={`${fieldClass} sm:w-56`}
              aria-label="Filter posts by type"
            >
              <option value="">All post types</option>
              {postTypes.map(type => <option key={type.id} value={type.id}>{type.name}</option>)}
            </select>
            <Can permission={Permissions.CREATE_POST}>
              <Link to="/k8s9d7f3-blogs-add">
                <Button className={`${primaryButtonClass} w-full rounded-xl sm:w-auto`}>
                  <Plus aria-hidden="true" className="mr-2 h-4 w-4" /> Create post
                </Button>
              </Link>
            </Can>
          </div>
        ) : (
          <Can permission={Permissions.CREATE_POST_TYPE}>
            <Button onClick={() => openTypeDialog()} className={`${primaryButtonClass} rounded-xl`}>
              <Plus aria-hidden="true" className="mr-2 h-4 w-4" /> New post type
            </Button>
          </Can>
        )}
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className={`${cardClass} flex items-center gap-4 p-5`}>
          <div className="rounded-xl bg-emerald-50 p-3 text-[#146c4f]"><FileText className="h-5 w-5" /></div>
          <div><p className="text-sm text-gray-500">Articles loaded</p><p className="text-2xl font-semibold text-gray-900">{posts.length}</p></div>
        </div>
        <div className={`${cardClass} flex items-center gap-4 p-5`}>
          <div className="rounded-xl bg-amber-50 p-3 text-amber-700"><Tag className="h-5 w-5" /></div>
          <div><p className="text-sm text-gray-500">Post types</p><p className="text-2xl font-semibold text-gray-900">{postTypes.length}</p></div>
        </div>
      </section>

      <section className={`${cardClass} overflow-hidden`}>
        <div className="flex flex-wrap gap-2 border-b border-gray-100 px-5 pt-4 sm:px-6">
          {([{ id: 'posts', label: 'Posts', icon: FileText }, { id: 'types', label: 'Post types', icon: Tag }] as const).map(item => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => { setTab(item.id); setError(''); setNotice('') }}
                className={`inline-flex items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition ${tab === item.id ? 'border-[#146c4f] text-[#146c4f]' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
              >
                <Icon className="h-4 w-4" />{item.label}
              </button>
            )
          })}
        </div>

        <div className="p-5 sm:p-6">
          {error && <div role="alert" className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
          {notice && <div role="status" className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</div>}

          {tab === 'posts' ? (
            <>
              <div className="mb-5">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input aria-label="Search posts" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search posts..." className="rounded-xl pl-9" />
                </div>
              </div>
              {loading ? (
                <div className="flex items-center justify-center gap-3 py-14 text-sm text-gray-500"><Loader2 className="h-5 w-5 animate-spin text-[#146c4f]" />Loading blog posts...</div>
              ) : filteredPosts.length === 0 ? (
                <div className="px-5 py-16 text-center">
                  <FileText className="mx-auto mb-3 h-8 w-8 text-gray-300" />
                  <p className="font-medium text-gray-800">
                    {search
                      ? 'No posts match your search'
                      : selectedTypeId
                        ? `No posts in ${postTypes.find(type => String(type.id) === selectedTypeId)?.name || 'this post type'} yet`
                        : 'No posts yet'}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {search
                      ? 'Try another title or clear the search.'
                      : selectedTypeId
                        ? 'This post type does not have any posts yet.'
                        : 'Create your first article to get started.'}
                  </p>
                </div>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredPosts.map(post => {
                    const coverImage = getPostImageUrl(post.images?.[0] || post.image)
                    const postType = post.type?.name || postTypes.find(type => type.id === post.post_type_id)?.name || 'Uncategorized'
                    const createdDate = post.created_at && !Number.isNaN(Date.parse(post.created_at))
                      ? new Date(post.created_at).toLocaleDateString()
                      : null

                    return (
                      <article key={post.id} className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                        <Link to={`/k8s9d7f3-blogs-view/${post.id}`} className="relative block h-48 w-full overflow-hidden bg-gray-100 text-left" aria-label={`View ${post.title}`}>
                          {coverImage ? (
                            <img src={coverImage} alt={post.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                          ) : (
                            <span className="flex h-full items-center justify-center text-sm font-medium text-gray-400"><ImageIcon className="mr-2 h-5 w-5" />No image</span>
                          )}
                          <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-medium text-[#146c4f] shadow-sm">{postType}</span>
                        </Link>
                        <div className="flex flex-1 flex-col p-4">
                          <div className="mb-2 flex items-center gap-2 text-xs text-gray-500">
                            <CalendarDays className="h-3.5 w-3.5" />{createdDate || 'Date unavailable'}
                          </div>
                          <Link to={`/k8s9d7f3-blogs-view/${post.id}`} className="line-clamp-2 text-left font-semibold text-gray-900 transition hover:text-[#146c4f]">
                            {post.title}
                          </Link>
                          <p className="mt-2 line-clamp-3 flex-1 whitespace-pre-wrap text-sm leading-5 text-gray-600">{post.content}</p>
                          <div className="mt-4 flex justify-end gap-1 border-t border-gray-100 pt-3">
                            <Link to={`/k8s9d7f3-blogs-view/${post.id}`} aria-label={`View ${post.title}`} title="View post"><Button type="button" variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-gray-500 hover:text-[#146c4f]"><Eye aria-hidden="true" className="h-4 w-4" /></Button></Link>
                            <Can permission={Permissions.UPDATE_POST}>
                              <Link to={`/k8s9d7f3-blogs-edit/${post.id}`} aria-label={`Edit ${post.title}`} title="Edit post"><Button type="button" variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-gray-500 hover:text-blue-700"><Pencil aria-hidden="true" className="h-4 w-4" /></Button></Link>
                            </Can>
                            <Can permission={Permissions.DELETE_POST}>
                              <Button type="button" variant="ghost" size="icon" aria-label={`Delete ${post.title}`} title="Delete post" onClick={() => setDeleteTarget({ kind: 'post', id: post.id, label: post.title })} className="h-9 w-9 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600"><Trash2 aria-hidden="true" className="h-4 w-4" /></Button>
                            </Can>
                          </div>
                        </div>
                      </article>
                    )
                  })}
                </div>
              )}
            </>
          ) : (
            loading ? (
              <div className="flex items-center justify-center gap-3 py-14 text-sm text-gray-500"><Loader2 className="h-5 w-5 animate-spin text-[#146c4f]" />Loading post types...</div>
            ) : postTypes.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 px-5 py-12 text-center">
                <Tag className="mx-auto mb-3 h-8 w-8 text-gray-300" />
                <p className="font-medium text-gray-800">No post types yet</p>
                <p className="mt-1 text-sm text-gray-500">Create a type to organize your articles.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {postTypes.map(type => (
                  <article key={type.id} className="rounded-xl border border-gray-100 p-5 transition hover:border-emerald-200 hover:shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="truncate font-semibold text-gray-900">{type.name}</h2>
                        <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-gray-500">{type.description || 'No description added.'}</p>
                      </div>
                      <span className="rounded-lg bg-emerald-50 p-2 text-[#146c4f]"><Tag className="h-4 w-4" /></span>
                    </div>
                    <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
                      <button type="button" onClick={() => { setTab('posts'); setSelectedTypeId(String(type.id)) }} className="text-sm font-medium text-[#146c4f] hover:underline">View posts</button>
                      <div className="flex gap-1">
                        <Button type="button" variant="ghost" size="icon" aria-label={`View ${type.name}`} title="View post type" onClick={() => void openTypeDetails(type.id)} className="h-8 w-8 text-gray-500"><ArrowUpRight aria-hidden="true" className="h-4 w-4" /></Button>
                        <Can permission={Permissions.UPDATE_POST_TYPE}>
                          <Button type="button" variant="ghost" size="icon" aria-label={`Edit ${type.name}`} title="Edit post type" onClick={() => openTypeDialog(type)} className="h-8 w-8 text-gray-500"><Pencil aria-hidden="true" className="h-4 w-4" /></Button>
                        </Can>
                        <Can permission={Permissions.DELETE_POST_TYPE}>
                          <Button type="button" variant="ghost" size="icon" aria-label={`Delete ${type.name}`} title="Delete post type" onClick={() => setDeleteTarget({ kind: 'type', id: type.id, label: type.name })} className="h-8 w-8 text-gray-500 hover:bg-red-50 hover:text-red-600"><Trash2 aria-hidden="true" className="h-4 w-4" /></Button>
                        </Can>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )
          )}
        </div>
      </section>

      <Dialog open={typeDialogOpen} onOpenChange={open => { if (!saving) setTypeDialogOpen(open) }}>
        <DialogContent className="rounded-2xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingType ? 'Edit post type' : 'Create post type'}</DialogTitle>
            <DialogDescription>Use post types to keep your blog content organized.</DialogDescription>
          </DialogHeader>
          <form onSubmit={event => void handleTypeSubmit(event)} className="space-y-4">
            {error && <div role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
            <label className="block space-y-1.5 text-sm font-medium text-gray-700">
              Name
              <Input required maxLength={120} value={typeName} onChange={event => setTypeName(event.target.value)} placeholder="e.g. News and updates" className="rounded-xl" />
            </label>
            <label className="block space-y-1.5 text-sm font-medium text-gray-700">
              Description <span className="font-normal text-gray-400">(optional)</span>
              <textarea maxLength={500} rows={3} value={typeDescription} onChange={event => setTypeDescription(event.target.value)} placeholder="What kind of posts belong here?" className={fieldClass} />
            </label>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setTypeDialogOpen(false)} disabled={saving} className="rounded-xl">Cancel</Button>
              <Button type="submit" disabled={saving || !typeName.trim()} className={`${primaryButtonClass} rounded-xl`}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{editingType ? 'Save changes' : 'Create type'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(viewingType)} onOpenChange={open => !open && setViewingType(null)}>
        <DialogContent className="rounded-2xl sm:max-w-lg">
          <DialogHeader><DialogTitle>{viewingType?.name}</DialogTitle><DialogDescription>Post type details</DialogDescription></DialogHeader>
          <div className="space-y-3 rounded-xl bg-gray-50 p-4 text-sm">
            <p className="text-gray-600">{viewingType?.description || 'No description provided.'}</p>
            <p className="text-xs text-gray-400">ID: {viewingType?.id}{viewingType?.created_at ? ` · Created ${new Date(viewingType.created_at).toLocaleDateString()}` : ''}</p>
          </div>
          <DialogFooter><Button type="button" variant="outline" onClick={() => setViewingType(null)} className="rounded-xl">Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AnimatedConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={open => { if (!open && !saving) setDeleteTarget(null) }}
        title={`Delete ${deleteTarget?.kind === 'type' ? 'post type' : 'post'}?`}
        description={deleteTarget?.kind === 'post'
          ? `“${deleteTarget.label}” and its attached images will be permanently deleted.`
          : `Are you sure you want to delete ${deleteTarget?.label}? This action cannot be undone.`}
        variant="danger"
        icon="trash"
        confirmText={saving ? 'Deleting...' : 'Delete'}
        confirmDisabled={saving}
        onConfirm={() => void handleDelete()}
      />
    </div>
  )
}
