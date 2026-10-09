import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { blogService, Post } from '@/services/blogs'
import { Calendar, ArrowLeft, Share2 } from 'lucide-react'

export default function PublicBlogDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchPost = async () => {
      if (!id) return
      setLoading(true)
      try {
        const data = await blogService.getPost(Number(id))
        setPost(data)
      } catch (err: any) {
        setError(err.message || 'Failed to load post')
      } finally {
        setLoading(false)
      }
    }
    fetchPost()
  }, [id])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-32 flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="container mx-auto px-4 py-32 text-center min-h-[50vh] flex flex-col justify-center items-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Post Not Found</h2>
        <p className="text-gray-500 mb-8">{error || "The article you're looking for doesn't exist or has been removed."}</p>
        <Link to="/blogs" className="text-primary font-medium hover:underline flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to News
        </Link>
      </div>
    )
  }

  return (
    <>
      {post && (
        <Helmet>
          <title>{post.title} | Know Your Leaders</title>
          <meta name="description" content={(post.content || '').replace(/<[^>]*>?/gm, '').substring(0, 160)} />
          <meta property="og:title" content={post.title} />
          <meta property="og:description" content={(post.content || '').replace(/<[^>]*>?/gm, '').substring(0, 160)} />
          {post.images && post.images.length > 0 && <meta property="og:image" content={post.images[0].url || "http://kyl.test/" + (post.images[0] as any).image_path} />}
        </Helmet>
      )}
    <div className="bg-white min-h-screen pt-24 pb-12">
      {/* Hero Section */}
      <section className="bg-gray-50 py-16 md:py-24 mt-[-6rem] border-b border-gray-100">
        <div className="container mx-auto px-4 max-w-4xl">
          <Link to="/blogs" className="inline-flex items-center text-primary font-semibold hover:text-emerald-700 transition-colors mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to News
          </Link>
          
          {post.type && (
            <div className="mb-6 inline-block bg-primary/10 text-primary font-bold px-4 py-1.5 rounded-full text-sm uppercase tracking-wider">
              {post.type.name}
            </div>
          )}
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6 leading-tight tracking-tight">
            {post.title}
          </h1>
          
          <div className="flex items-center text-gray-500 font-medium gap-4 border-t border-gray-200 pt-6">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-400" />
              {new Date(post.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Image */}
      {post.images?.[0]?.url && (
        <div className="container mx-auto px-4 max-w-5xl -mt-12 relative z-10">
          <div className="rounded-3xl overflow-hidden shadow-2xl bg-white p-2">
            <img 
              src={post.images[0].url} 
              alt={post.title} 
              className="w-full h-auto max-h-[600px] object-cover rounded-2xl"
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="container mx-auto px-4 max-w-4xl py-16">
        <div 
          className="prose prose-lg md:prose-xl prose-emerald max-w-none text-gray-700 prose-headings:text-gray-900 prose-a:text-primary hover:prose-a:text-emerald-700 prose-img:rounded-xl"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
        
        <div className="mt-16 pt-8 border-t border-gray-100 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span className="font-semibold text-gray-900">Share this article:</span>
            <button className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-600 transition-colors" onClick={() => navigator.clipboard.writeText(window.location.href).then(() => alert('Link copied!'))}>
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}





