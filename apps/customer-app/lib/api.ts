import NetInfo from '@react-native-community/netinfo'
import { supabase } from './supabase/client'
import { logger } from './logger'

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api'

export async function getAuthToken() {
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token
}

async function requireConnectivity() {
  const state = await NetInfo.fetch()
  if (!state.isConnected) {
    throw new Error('No internet connection. Please check your network settings and try again.')
  }
}

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  await requireConnectivity()

  const token = await getAuthToken()
  
  const headers = new Headers(options.headers)
  headers.set('Content-Type', 'application/json')
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    })
  } catch (err: any) {
    if (err?.name === 'AbortError') throw err
    logger.error('Network request failed', err?.message)
    throw new Error('Unable to reach the server. Please check your connection and try again.')
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    const statusMessages: Record<number, string> = {
      400: 'Invalid request. Please check your input and try again.',
      401: 'Session expired. Please log in again.',
      403: 'You do not have permission to perform this action.',
      404: 'The requested resource was not found.',
      429: 'Too many requests. Please wait and try again.',
      500: 'Server error. Please try again later.',
      502: 'Server temporarily unavailable. Please try again.',
      503: 'Service unavailable. Please try again later.',
    }
    const message = errorData.error || statusMessages[response.status] || `Request failed (${response.status})`
    throw new Error(message)
  }

  return response.json()
}
