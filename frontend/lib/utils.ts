import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const extractIdFromQr = (qrData: string) => {
  try {
    // If it's a URL, extracting the id param
    if (qrData.includes('http') || qrData.includes('?')) {
      const url = new URL(qrData)
      const id = url.searchParams.get('id')
      return id || qrData
    }
  } catch (error) {
    // If URL parsing fails, checking if it might be a partial URL or just the ID
    console.warn('Failed to parse QR as URL:', error)
  }
  return qrData
}
