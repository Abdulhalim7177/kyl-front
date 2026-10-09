import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { blogService, Post, PostType } from '@/services/blogs'
import { Calendar, ChevronRight, Tag, ArrowRight } from 'lucide-react'

export default function PublicBlogsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const categoryParam = searchParams.get('category')
  
  const [posts, setPosts] = useState<Post[]>([])
  const [categories, setCategories] = useState<PostType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchBlogs = async () => {
      setLoading(true)
      try {
        const [postsRes, catsRes] = await Promise.all([
          categoryParam ? blogService.getPostsByType(Number(categoryParam)) : blogService.getPosts(),
          blogService.getPostTypes()
        ])
        setPosts(postsRes.data)
        setCategories(catsRes)
      } catch (err: any) {
        setError(err.message || 'Failed to load blogs')
      } finally {
        setLoading(false)
      }
    }
    fetchBlogs()
  }, [categoryParam])

  return (
    <div className="bg-gray-50 min-h-screen pt-24 pb-12">
      {/* Header Section */}
      <section className="bg-primary text-primary-foreground py-20 mt-[-6rem] mb-12">
        <div className="container mx-auto px-4 text-center mt-12">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight text-white">Latest News & Updates</h1>
          <p className="text-lg md:text-xl text-primary-foreground/90 max-w-2xl mx-auto">
            Stay informed with the latest updates, political insights, and election news from across the nation.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Main Content */}
          <div className="lg:w-3/4">
            {loading ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : error ? (
              <div className="text-center py-20 text-red-500 font-medium">{error}</div>
            ) : posts.length === 0 ? (
              <div className="text-center py-20 text-gray-500 bg-white rounded-2xl shadow-sm border border-gray-100">
                <p className="text-xl font-medium mb-2">No articles found</p>
                <p>Check back later for updates.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {posts.map(post => (
                  <article key={post.id} className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 group flex flex-col">
                    <div className="h-56 relative overflow-hidden bg-gray-100">
                      {post.images?.[0]?.url ? (
                        <img 
                          src={post.images[0].url} 
                          alt={post.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
                          No Image
                        </div>
                      )}
                      {post.type && (
                        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur text-primary text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
                          {post.type.name}
                        </div>
                      )}
                    </div>
                    
                    <div className="p-8 flex flex-col flex-grow">
                      <div className="flex items-center text-sm text-gray-500 mb-4 gap-2">
                        <Calendar className="w-4 h-4" />
                        {new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-4 line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                        {post.title}
                      </h2>
                      <p className="text-gray-600 mb-6 line-clamp-3 flex-grow" dangerouslySetInnerHTML={{ __html: post.content.substring(0, 150) + '...' }} />
                      
                      <Link 
                        to={`/blog/${post.id}`} 
                        className="inline-flex items-center text-primary font-bold hover:text-emerald-700 transition-colors mt-auto"
                      >
                        Read Article <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:w-1/4">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 sticky top-24">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Tag className="w-5 h-5 text-primary" />
                Categories
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => setSearchParams({})}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-colors ${
                    !categoryParam ? 'bg-primary text-white font-semibold shadow-sm' : 'hover:bg-gray-50 text-gray-700 font-medium'
                  }`}
                >
                  All Posts
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSearchParams({ category: cat.id.toString() })}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-colors ${
                      categoryParam === cat.id.toString() ? 'bg-primary text-white font-semibold shadow-sm' : 'hover:bg-gray-50 text-gray-700 font-medium'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}


