import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

const BACKEND_ORIGIN = 'https://kyl.aitshub.com.ng'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getLogoUrl(value: string | Record<string, any> | null | undefined): string | null {
  if (!value) return null

  if (typeof value === 'string') {
    const normalized = value.trim()
    if (!normalized) return null

    if (normalized.startsWith('http://') || normalized.startsWith('https://') || normalized.startsWith('blob:')) {
      return normalized
    }

    if (normalized.startsWith('//')) {
      return `https:${normalized}`
    }

    if (normalized.startsWith('/')) {
      return `${BACKEND_ORIGIN}${normalized}`
    }

    if (normalized.startsWith('storage/') || normalized.startsWith('uploads/') || normalized.startsWith('public/')) {
      return `${BACKEND_ORIGIN}/${normalized}`
    }

    return `${BACKEND_ORIGIN}/${normalized.replace(/^\.?\//, '')}`
  }

  if (typeof value === 'object') {
    const candidate = value as Record<string, any>
    const nested = candidate.logopath
      ?? candidate.logo_path
      ?? candidate.logo_url
      ?? candidate.image_url
      ?? candidate.image
      ?? candidate.photo
      ?? candidate.photo_url
      ?? candidate.profile_photo
      ?? candidate.profile_picture
      ?? candidate.avatar
      ?? candidate.path
      ?? candidate.url
      ?? candidate.filePath
      ?? candidate.image_path
      ?? candidate.logo
      ?? candidate.src
      ?? null

    return getLogoUrl(nested)
  }

  return null
}

export function getPartyLogoValue(party: any, fallback?: unknown): string | null {
  if (!party && !fallback) return null

  const candidate = party ?? {}
  const value = candidate.logopath
    ?? candidate.logo_path
    ?? candidate.logo_url
    ?? candidate.image_url
    ?? candidate.image
    ?? candidate.photo
    ?? candidate.photo_url
    ?? candidate.profile_photo
    ?? candidate.profile_picture
    ?? candidate.avatar
    ?? candidate.path
    ?? candidate.url
    ?? candidate.filePath
    ?? candidate.image_path
    ?? candidate.logo
    ?? candidate.src
    ?? fallback
    ?? null

  return getLogoUrl(value)
}
