import { getLogoUrl } from '@/lib/utils'

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
  image_path?: string
  url: string
}

export function getPostImageUrl(image: PostImage | undefined): string | null {
  if (!image) return null
  return getLogoUrl(image.url || image.path || image.image_path)
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

interface ApiResponse<T> {
  data?: T
  message?: string
  success?: boolean
}

function getAuthHeaders(contentType = true): HeadersInit {
  const token = localStorage.getItem('auth_token')
  return {
    Accept: 'application/json',
    ...(contentType ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...getAuthHeaders(init.body instanceof FormData ? false : true),
      ...init.headers,
    },
  })
  const result = await response.json().catch(() => null) as ApiResponse<T> | null

  if (!response.ok) {
    throw new Error(result?.message || `Blog request failed (${response.status})`)
  }
  if (result?.success === false) {
    throw new Error(result.message || 'The blog request was unsuccessful')
  }
  return result?.data as T
}

function unwrapList<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[]
  if (payload && typeof payload === 'object' && 'data' in payload) {
    const nested = (payload as { data?: unknown }).data
    if (Array.isArray(nested)) return nested as T[]
  }
  return []
}

class BlogService {
  async getPosts(page = 1): Promise<{ data: Post[]; meta: Record<string, unknown> }> {
    const payload = await request<unknown>(`/blog/posts?page=${page}`)
    const data = unwrapList<Post>(payload)
    const meta = payload && typeof payload === 'object' && 'meta' in payload
      ? (payload as { meta?: Record<string, unknown> }).meta || {}
      : {}
    return { data, meta }
  }

  async getPost(id: number): Promise<Post> {
    return request<Post>(`/blog/show-post/${id}`)
  }

  async getPostTypes(): Promise<PostType[]> {
    return unwrapList<PostType>(await request<unknown>('/blog/post-types'))
  }

  async getPostType(id: number): Promise<PostType> {
    return request<PostType>(`/blog/show-post-type/${id}`)
  }

  async createPostType(values: Pick<PostType, 'name'> & Partial<Pick<PostType, 'description' | 'status'>>): Promise<PostType> {
    return request<PostType>('/blog/create-post-type', {
      method: 'POST',
      body: JSON.stringify(values),
    })
  }

  async updatePostType(id: number, values: Pick<PostType, 'name'> & Partial<Pick<PostType, 'description' | 'status'>>): Promise<PostType> {
    return request<PostType>(`/blog/update-post-type/${id}`, {
      method: 'PUT',
      body: JSON.stringify(values),
    })
  }

  async deletePostType(id: number): Promise<void> {
    await request<unknown>(`/blog/delete-post-type/${id}`, { method: 'DELETE' })
  }

  async getPostsByType(typeId: number, page = 1): Promise<{ data: Post[]; meta: Record<string, unknown> }> {
    const payload = await request<unknown>(`/blog/posts-by-type/${typeId}?page=${page}`)
    const data = unwrapList<Post>(payload)
    const meta = payload && typeof payload === 'object' && 'meta' in payload
      ? (payload as { meta?: Record<string, unknown> }).meta || {}
      : {}
    return { data, meta }
  }

  async createPost(formData: FormData): Promise<Post> {
    return request<Post>('/blog/create-post', { method: 'POST', body: formData })
  }

  async updatePost(formData: FormData): Promise<Post> {
    return request<Post>('/blog/update-post', { method: 'POST', body: formData })
  }

  async deletePost(id: number): Promise<void> {
    await request<unknown>(`/blog/delete-post/${id}`, { method: 'DELETE' })
  }

  async getPostImages(postId: number): Promise<PostImage[]> {
    return unwrapList<PostImage>(await request<unknown>(`/blog/post-images/${postId}`))
  }

  async deletePostImage(id: number): Promise<void> {
    await request<unknown>(`/blog/delete-post-image/${id}`, { method: 'DELETE' })
  }
}

export const blogService = new BlogService()
