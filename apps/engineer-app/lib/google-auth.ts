import * as WebBrowser from 'expo-web-browser'
import { Platform } from 'react-native'

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'
const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID

type GoogleAuthResult = {
  token: string
  user: {
    id: string
    email: string
    full_name: string
    role: string
    auth_method: string
  }
}

export async function signInWithGoogle(): Promise<GoogleAuthResult | null> {
  if (!GOOGLE_CLIENT_ID) {
    return null
  }

  try {
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${GOOGLE_CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent('http://localhost:8082')}` +
      `&response_type=id_token` +
      `&scope=openid%20email%20profile` +
      `&nonce=${Date.now()}`

    const result = await WebBrowser.openAuthSessionAsync(authUrl, 'http://localhost:8082')

    if (result.type !== 'success') {
      throw new Error('Google sign-in was cancelled')
    }

    const params = new URLSearchParams(result.url.split('#')[1])
    const idToken = params.get('id_token')
    if (!idToken) throw new Error('No ID token received')

    const response = await fetch(`${API_BASE_URL}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_token: idToken, role: 'engineer' }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Google sign-in failed')
    }

    return await response.json()
  } catch (error) {
    if (error instanceof Error) throw error
    throw new Error('Google sign-in failed')
  }
}

export function isGoogleAuthAvailable(): boolean {
  return !!GOOGLE_CLIENT_ID && Platform.OS !== 'web'
}
