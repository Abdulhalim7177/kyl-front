import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  Clock,
  Link2,
  Newspaper,
  UserRound,
} from 'lucide-react'
import { blogService, getPostImageUrl, type Post } from '@/services/blogs'

const formatDate = (value?: string | null) => {
  if (!value) return null
  const parsed = new Date(value.length <= 10 ? `${value}T00:00:00` : value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toLocaleDateString('en-NG', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

const stripHtml = (html?: string) =>
  (html ?? '')
    .replace(/<[^>]*>?/gm, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const getPostTypeName = (post: Post) => post.type?.name || post.post_type?.name || 'News'
const getPostImage = (post: Post) => getPostImageUrl(post.images?.[0]) ?? getPostImageUrl(post.image)

const isHtmlContent = (content: string) => /<\/?[a-z][\s\S]*>/i.test(content)

const getReadingTime = (content: string) => {
  const words = stripHtml(content).split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 220))
}

function RelatedCard({ post }: { post: Post }) {
  const imageUrl = getPostImage(post)

  return (
    <Link
      to={`/blog/${post.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_4px_20px_rgb(0,0,0,0.03)] transition-all duration-300 hover:-translate-y-1 hover:border-[#146c4f]/25 hover:shadow-lg"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-gray-100">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-900 via-[#146c4f] to-emerald-500 text-white/80">
            <Newspaper className="h-9 w-9" aria-hidden="true" />
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#146c4f] backdrop-blur">
          {getPostTypeName(post)}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="line-clamp-2 text-base font-extrabold leading-snug text-gray-900 transition-colors group-hover:text-[#146c4f]">
          {post.title}
        </h3>
        <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-gray-500">
          {stripHtml(post.content) || 'Read the full update from Know Your Leaders.'}
        </p>
        <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-[#146c4f]">
          Read story <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
    </Link>
  )
}

export default function PublicBlogDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [post, setPost] = useState<Post | null>(null)
  const [related, setRelated] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!id) {
      setLoading(false)
      setError('This article could not be found.')
      return
    }

    let cancelled = false

    const fetchPost = async () => {
      setLoading(true)
      setError('')

      try {
        const postId = Number(id)
        const [postData, postsData] = await Promise.all([
          blogService.getPost(postId),
          blogService.getPosts().catch(() => ({ data: [] as Post[], meta: {} })),
        ])

        if (cancelled) return

        setPost(postData)
        setRelated(
          postsData.data
            .filter((item) => item.id !== postId)
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 3),
        )
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load post')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void fetchPost()

    return () => {
      cancelled = true
    }
  }, [id])

  const description = useMemo(
    () => stripHtml(post?.content).substring(0, 160),
    [post?.content],
  )

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('Could not copy the link. Please copy it from the address bar.')
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[#f7f8f5]">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-gray-200 border-t-[#146c4f]" />
      </div>
    )
  }

  if (!post) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center bg-[#f7f8f5] px-4 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400">
          <Newspaper className="h-7 w-7" aria-hidden="true" />
        </span>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-gray-900">Post not found</h1>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-gray-500">
          {error || "The article you're looking for doesn't exist or has been removed."}
        </p>
        <Link
          to="/blogs"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#146c4f] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#10563f]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to all stories
        </Link>
      </div>
    )
  }

  const imageUrl = getPostImage(post)
  const publishedOn = formatDate(post.created_at)
  const readingTime = getReadingTime(post.content)
  const htmlContent = isHtmlContent(post.content)
  const paragraphs = post.content.split(/\n+/).filter((paragraph) => paragraph.trim())

  return (
    <div className="bg-[#f7f8f5]">
      <Helmet>
        <title>{post.title} | Know Your Leaders</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={description} />
        {imageUrl ? <meta property="og:image" content={imageUrl} /> : null}
      </Helmet>

      <section className="relative overflow-hidden bg-[#072b20] text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.7) 1px, transparent 1px)',
            backgroundSize: '52px 52px',
          }}
          aria-hidden="true"
        />
        <div className="pointer-events-none absolute -left-24 top-0 h-80 w-80 rounded-full bg-emerald-400/20 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -right-20 bottom-0 h-96 w-96 rounded-full bg-teal-300/10 blur-3xl" aria-hidden="true" />

        <div className="container relative mx-auto max-w-5xl px-4 py-14 sm:py-20">
          <Link
            to="/blogs"
            className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-100/70 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> All stories
          </Link>

          <div className="mt-8 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-emerald-300/30 bg-emerald-400/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-100">
              {getPostTypeName(post)}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold text-emerald-50">
              <Clock className="h-3.5 w-3.5 text-emerald-300" aria-hidden="true" />
              {readingTime} min read
            </span>
          </div>

          <h1 className="mt-5 max-w-4xl text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
            {post.title}
          </h1>

          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm font-medium text-emerald-50/70">
            {publishedOn ? (
              <span className="inline-flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-emerald-300" aria-hidden="true" />
                {publishedOn}
              </span>
            ) : null}
            {post.author?.name ? (
              <span className="inline-flex items-center gap-2">
                <UserRound className="h-4 w-4 text-emerald-300" aria-hidden="true" />
                {post.author.name}
              </span>
            ) : null}
          </div>
        </div>
      </section>

      {imageUrl ? (
        <div className="container relative z-10 mx-auto -mt-10 max-w-5xl px-4">
          <div className="overflow-hidden rounded-[2rem] border-8 border-[#f7f8f5] bg-white shadow-2xl">
            <img
              src={imageUrl}
              alt=""
              className="max-h-[34rem] w-full object-cover"
            />
          </div>
        </div>
      ) : null}

      <section className="container mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
          <article className="rounded-3xl border border-gray-100 bg-white p-6 shadow-[0_4px_24px_rgb(0,0,0,0.04)] sm:p-10">
            {error ? (
              <div role="alert" className="mb-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </div>
            ) : null}

            {htmlContent ? (
              <div
                className="article-content"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />
            ) : (
              <div className="article-content">
                {paragraphs.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            )}

            <div className="mt-10 flex flex-col gap-4 border-t border-gray-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <Link
                to="/blogs"
                className="inline-flex items-center gap-2 text-sm font-bold text-[#146c4f] transition hover:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#146c4f] focus-visible:ring-offset-2"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to all stories
              </Link>
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:border-[#146c4f]/30 hover:text-[#146c4f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#146c4f] focus-visible:ring-offset-2"
              >
                {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Link2 className="h-4 w-4" aria-hidden="true" />}
                {copied ? 'Link copied' : 'Copy link'}
              </button>
            </div>
          </article>

          <aside className="space-y-4 lg:sticky lg:top-24">
            <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">
                Published by
              </p>
              <div className="mt-4 flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#146c4f] text-sm font-extrabold text-white">
                  {(post.author?.name || 'KYL').substring(0, 1).toUpperCase()}
                </span>
                <div>
                  <p className="font-bold text-gray-900">{post.author?.name || 'Know Your Leaders'}</p>
                  <p className="text-xs text-gray-500">KYL Editorial Desk</p>
                </div>
              </div>

              <dl className="mt-5 space-y-3 border-t border-gray-100 pt-4 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-gray-500">Published</dt>
                  <dd className="font-semibold text-gray-900">{publishedOn || '—'}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-gray-500">Reading time</dt>
                  <dd className="font-semibold text-gray-900">{readingTime} min</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-gray-500">Section</dt>
                  <dd className="font-semibold text-gray-900">{getPostTypeName(post)}</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-3xl bg-gradient-to-br from-[#072b20] via-[#0b3d2c] to-[#146c4f] p-6 text-white shadow-xl">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-100/60">
                Know your leaders
              </p>
              <h2 className="mt-3 text-xl font-extrabold leading-tight">
                Follow the people and elections behind the headlines.
              </h2>
              <Link
                to="/directory"
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-300 px-4 py-3 text-sm font-bold text-emerald-950 transition hover:bg-emerald-200"
              >
                Search the directory <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </aside>
        </div>

        {related.length ? (
          <div className="mt-12">
            <div className="mb-6 flex items-end justify-between gap-4 border-b border-gray-200 pb-5">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#146c4f]">
                  Keep reading
                </p>
                <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-gray-900">
                  More from the newsroom.
                </h2>
              </div>
              <Link
                to="/blogs"
                className="hidden items-center gap-2 text-sm font-bold text-[#146c4f] transition hover:gap-3 sm:inline-flex"
              >
                All stories <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((relatedPost) => (
                <RelatedCard key={relatedPost.id} post={relatedPost} />
              ))}
            </div>
          </div>
        ) : null}
      </section>
    </div>
  )
}
