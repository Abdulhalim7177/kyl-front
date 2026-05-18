import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getLogoUrl(logopath: string | null): string | null {
  if (!logopath) return null
  
  // If it's already a full URL, return as is
  if (logopath.startsWith('http://') || logopath.startsWith('https://')) {
    return logopath
  }
  
  // If it starts with /, prefix with API base URL
  if (logopath.startsWith('/')) {
    return `https://kyl.aitshub.com.ng${logopath}`
  }
  
  // Otherwise, prefix with API base URL and /
  return `https://kyl.aitshub.com.ng/${logopath}`
}
