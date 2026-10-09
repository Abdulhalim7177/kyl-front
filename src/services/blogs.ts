const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

export interface PostType {
  id: number
  name: string
  description?: string
  status: number
  created_at?: string
  updated_at?: string
}

export interface PostImage {
  id: number
  post_id: number
  path: string
  url: string
}

export interface Post {
  id: number
  post_type_id: number
  title: string
  content: string
  status: number
  created_at: string
  type?: PostType
  images?: PostImage[]
  image?: PostImage
}

class BlogService {
  private getHeaders() {
    return {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  }

  async getPosts(page: number = 1): Promise<{ data: Post[], meta: any }> {
    const response = await fetch(`${API_BASE_URL}/blog/posts?page=${page}`, {
      headers: this.getHeaders()
    })
    if (!response.ok) throw new Error('Failed to fetch posts')
    const data = await response.json()
    // Depending on backend pagination format
    return {
      data: data.data?.data || data.data || [],
      meta: data.data?.meta || data.meta || {}
    }
  }

  async getPost(id: number): Promise<Post> {
    const response = await fetch(`${API_BASE_URL}/blog/show-post/${id}`, {
      headers: this.getHeaders()
    })
    if (!response.ok) throw new Error('Failed to fetch post')
    const data = await response.json()
    return data.data
  }

  async getPostTypes(): Promise<PostType[]> {
    const response = await fetch(`${API_BASE_URL}/blog/post-types`, {
      headers: this.getHeaders()
    })
    if (!response.ok) throw new Error('Failed to fetch post types')
    const data = await response.json()
    return data.data?.data || data.data || []
  }

  async getPostsByType(typeId: number, page: number = 1): Promise<{ data: Post[], meta: any }> {
    const response = await fetch(`${API_BASE_URL}/blog/posts-by-type/${typeId}?page=${page}`, {
      headers: this.getHeaders()
    })
    if (!response.ok) throw new Error('Failed to fetch posts for category')
    const data = await response.json()
    return {
      data: data.data?.data || data.data || [],
      meta: data.data?.meta || data.meta || {}
    }
  }
}

export const blogService = new BlogService()
