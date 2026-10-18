import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  ChevronDown,
  Newspaper,
  Tag,
  UserRound,
} from 'lucide-react'
import { getLogoUrl } from '@/lib/utils'
import { blogService, getPostImageUrl, type Post, type PostType } from '@/services/blogs'

const formatDate = (value?: string | null) => {
  if (!value) return null
  const parsed = new Date(value.length <= 10 ? `${value}T00:00:00` : value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })
}

const stripHtml = (html?: string) =>
  (html ?? '')
    .replace(/<[^>]*>?/gm, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const getPostTypeName = (post: Post) => post.type?.name || post.post_type?.name || 'News'
const getPostImage = (post: Post) => getPostImageUrl(post.images?.[0]) ?? getLogoUrl(post.image)

const COVER_STYLES = [
  'from-[#0b3d2c] via-[#146c4f] to-emerald-500',
  'from-[#0b3b3a] via-[#0f6154] to-teal-400',
  'from-[#1f2937] via-[#155e4b] to-emerald-400',
  'from-[#0b3d2c] via-[#1a5c3f] to-lime-500',
]

const getCoverStyle = (post: Post) =>
  COVER_STYLES[(post.post_type_id || post.id) % COVER_STYLES.length]

function PostMeta({ post }: { post: Post }) {
  const publishedOn = formatDate(post.created_at)

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] font-medium text-gray-400">
      {publishedOn ? (
        <time dateTime={post.created_at} className="inline-flex items-center gap-1.5">
          <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
          {publishedOn}
        </time>
      ) : null}
      {post.author?.name ? (
        <>
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1.5">
            <UserRound className="h-3.5 w-3.5" aria-hidden="true" />
            {post.author.name}
          </span>
        </>
      ) : null}
    </div>
  )
}

function FeaturedPost({ post }: { post: Post }) {
  const imageUrl = getPostImage(post)
  const excerpt = stripHtml(post.content)

  return (
    <article className="group overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-[0_12px_40px_rgb(0,0,0,0.06)] transition-all duration-300 hover:border-[#146c4f]/25 hover:shadow-xl">
      <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
        <div className="flex flex-col p-7 sm:p-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-700">
              <BookOpen className="h-3.5 w-3.5" aria-hidden="true" /> Featured story
            </span>
            <span className="rounded-full border border-gray-200 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500">
              {getPostTypeName(post)}
            </span>
          </div>

          <h2 className="mt-6 text-3xl font-extrabold leading-tight tracking-tight text-gray-900 transition-colors group-hover:text-[#146c4f] sm:text-4xl">
            <Link to={`/blog/${post.id}`}>{post.title}</Link>
          </h2>

          <p className="mt-4 line-clamp-4 text-sm leading-relaxed text-gray-500 sm:text-base">
            {excerpt || 'Read the latest update from Know Your Leaders.'}
          </p>

          <div className="mt-6">
            <PostMeta post={post} />
          </div>

          <Link
            to={`/blog/${post.id}`}
            className="mt-8 inline-flex w-fit items-center gap-2 rounded-xl bg-[#146c4f] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#10563f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#146c4f] focus-visible:ring-offset-2"
          >
            Read the story <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <Link
          to={`/blog/${post.id}`}
          className="relative min-h-[18rem] overflow-hidden bg-gray-100 lg:min-h-full"
          aria-label={`Read ${post.title}`}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt=""
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${getCoverStyle(post)} text-white/80`}>
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.08]"
                style={{
                  backgroundImage:
                    'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
                  backgroundSize: '42px 42px',
                }}
                aria-hidden="true"
              />
              <Newspaper className="relative h-20 w-20" aria-hidden="true" />
            </div>
          )}
          <span className="absolute bottom-5 left-5 rounded-full bg-black/25 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white backdrop-blur">
            KYL Journal
          </span>
        </Link>
      </div>
    </article>
  )
}

function PostCard({ post }: { post: Post }) {
  const imageUrl = getPostImage(post)
  const excerpt = stripHtml(post.content)

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-[0_4px_24px_rgb(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 hover:border-[#146c4f]/25 hover:shadow-xl">
      <Link to={`/blog/${post.id}`} className="relative aspect-[16/10] overflow-hidden bg-gray-100">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${getCoverStyle(post)} text-white/80`}>
            <Newspaper className="h-11 w-11" aria-hidden="true" />
          </div>
        )}
        <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-[#146c4f] backdrop-blur">
          {getPostTypeName(post)}
        </span>
      </Link>

      <div className="flex flex-1 flex-col p-6">
        <PostMeta post={post} />
        <h3 className="mt-3 line-clamp-2 text-xl font-extrabold leading-snug tracking-tight text-gray-900 transition-colors group-hover:text-[#146c4f]">
          <Link to={`/blog/${post.id}`}>{post.title}</Link>
        </h3>
        <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-gray-500">
          {excerpt || 'Read the full update from Know Your Leaders.'}
        </p>
        <Link
          to={`/blog/${post.id}`}
          className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-[#146c4f] transition hover:gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#146c4f] focus-visible:ring-offset-2"
        >
          Read story <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </article>
  )
}

function BlogSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-[420px] animate-pulse rounded-[2rem] bg-white" />
      <div className="grid gap-6 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="overflow-hidden rounded-3xl border border-gray-100 bg-white">
            <div className="aspect-[16/10] animate-pulse bg-gray-100" />
            <div className="space-y-3 p-6">
              <div className="h-3 w-1/3 animate-pulse rounded bg-gray-100" />
              <div className="h-6 w-5/6 animate-pulse rounded bg-gray-100" />
              <div className="h-3 w-full animate-pulse rounded bg-gray-100" />
              <div className="h-3 w-2/3 animate-pulse rounded bg-gray-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function PublicBlogsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const categoryParam = searchParams.get('category')

  const [posts, setPosts] = useState<Post[]>([])
  const [categories, setCategories] = useState<PostType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [visibleCount, setVisibleCount] = useState(6)

  useEffect(() => {
    let cancelled = false

    const fetchBlogs = async () => {
      setLoading(true)
      setError('')
      setVisibleCount(6)

      try {
        const [postsRes, categoriesRes] = await Promise.all([
          categoryParam
            ? blogService.getPostsByType(Number(categoryParam))
            : blogService.getPosts(),
          blogService.getPostTypes(),
        ])

        if (cancelled) return

        setPosts(
          [...postsRes.data].sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
          ),
        )
        setCategories(categoriesRes)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load blogs')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void fetchBlogs()

    return () => {
      cancelled = true
    }
  }, [categoryParam])

  const activeCategory = useMemo(
    () => categories.find((category) => category.id.toString() === categoryParam),
    [categories, categoryParam],
  )

  const visiblePosts = posts.slice(0, visibleCount)
  const [featuredPost, ...otherPosts] = visiblePosts
  const latestDate = posts[0] ? formatDate(posts[0].created_at) : null

  return (
    <div className="bg-[#f7f8f5]">
      <Helmet>
        <title>News & Analysis | Know Your Leaders</title>
        <meta
          name="description"
          content="Context, explainers, and updates on Nigerian leadership, elections, and civic life."
        />
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

        <div className="container relative mx-auto px-4 py-16 sm:py-20">
          <div className="mx-auto grid max-w-6xl items-end gap-10 lg:grid-cols-[1fr_auto]">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-50 backdrop-blur">
                <Newspaper className="h-3.5 w-3.5 text-emerald-300" aria-hidden="true" />
                News & analysis
              </span>
              <h1 className="mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl">
                Context for the decisions that <span className="text-emerald-300">shape Nigeria.</span>
              </h1>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-emerald-50/75 sm:text-lg">
                Reporting, explainers, and updates that make the people, parties, and processes
                behind Nigerian politics easier to understand.
              </p>
            </div>

            <div className="grid w-full grid-cols-2 gap-3 lg:w-[20rem]">
              <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-100/60">Stories</p>
                <p className="mt-2 text-3xl font-extrabold leading-none text-white">{posts.length}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-100/60">Topics</p>
                <p className="mt-2 text-3xl font-extrabold leading-none text-white">
                  {categories.length}
                </p>
              </div>
              <div className="col-span-2 rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-100/60">
                  Latest publication
                </p>
                <p className="mt-1.5 text-sm font-bold text-white">{latestDate || 'Updates soon'}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex flex-col gap-5 border-b border-gray-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#146c4f]">
                {activeCategory ? activeCategory.name : 'The latest'}
              </p>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900">
                {activeCategory ? `Stories on ${activeCategory.name.toLowerCase()}.` : 'Fresh from the newsroom.'}
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Tag className="mr-1 h-4 w-4 text-gray-400" aria-hidden="true" />
              <button
                type="button"
                onClick={() => setSearchParams({})}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#146c4f] focus-visible:ring-offset-2 ${
                  !categoryParam
                    ? 'bg-[#146c4f] text-white'
                    : 'border border-gray-200 bg-white text-gray-600 hover:border-[#146c4f]/30 hover:text-[#146c4f]'
                }`}
              >
                All stories
              </button>
              {categories.map((category) => {
                const selected = categoryParam === category.id.toString()
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setSearchParams({ category: category.id.toString() })}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#146c4f] focus-visible:ring-offset-2 ${
                      selected
                        ? 'bg-[#146c4f] text-white'
                        : 'border border-gray-200 bg-white text-gray-600 hover:border-[#146c4f]/30 hover:text-[#146c4f]'
                    }`}
                  >
                    {category.name}
                  </button>
                )
              })}
            </div>
          </div>

          {loading ? (
            <BlogSkeleton />
          ) : error ? (
            <div role="alert" className="rounded-3xl border border-red-100 bg-red-50 p-8 text-center">
              <p className="font-semibold text-red-700">We could not load the newsroom.</p>
              <p className="mt-1 text-sm text-red-600">{error}</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-gray-300 bg-white/70 p-12 text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                <Newspaper className="h-7 w-7" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-xl font-bold text-gray-900">
                {activeCategory ? 'No stories in this topic yet' : 'No stories yet'}
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-gray-500">
                {activeCategory
                  ? 'Try another topic or return to all stories.'
                  : 'Check back soon for reporting and analysis from the KYL newsroom.'}
              </p>
              {activeCategory ? (
                <button
                  type="button"
                  onClick={() => setSearchParams({})}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#146c4f] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#10563f]"
                >
                  View all stories <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              ) : null}
            </div>
          ) : (
            <div className="space-y-6">
              <FeaturedPost post={featuredPost} />
              {otherPosts.length ? (
                <div className="grid gap-6 md:grid-cols-2">
                  {otherPosts.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              ) : null}

              {visibleCount < posts.length ? (
                <div className="flex flex-col items-center gap-3 pt-2">
                  <p className="text-xs font-semibold text-gray-400">
                    Showing {visiblePosts.length} of {posts.length} stories
                  </p>
                  <button
                    type="button"
                    onClick={() => setVisibleCount((count) => count + 6)}
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-bold text-gray-700 transition hover:border-[#146c4f]/30 hover:text-[#146c4f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#146c4f] focus-visible:ring-offset-2"
                  >
                    Load more stories
                    <ChevronDown className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
