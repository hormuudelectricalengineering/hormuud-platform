import { useState, useEffect, useRef, useCallback } from 'react'

interface CacheEntry<T> {
  data: T
  timestamp: number
}

const cache = new Map<string, CacheEntry<any>>()
const DEFAULT_CACHE_TIME = 5 * 60 * 1000

export function useApi<T = any>(
  key: string | null,
  fetcher: () => Promise<T>,
  options?: { cacheTime?: number; enabled?: boolean }
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const cacheTime = options?.cacheTime ?? DEFAULT_CACHE_TIME
  const enabled = options?.enabled ?? true
  const abortRef = useRef<AbortController | null>(null)

  const execute = useCallback(async () => {
    if (!key || !enabled) return

    const cached = cache.get(key)
    if (cached && Date.now() - cached.timestamp < cacheTime) {
      setData(cached.data)
      return cached.data
    }

    abortRef.current?.abort()
    abortRef.current = new AbortController()

    setLoading(true)
    setError(null)
    try {
      const result = await fetcher()
      cache.set(key, { data: result, timestamp: Date.now() })
      setData(result)
      return result
    } catch (err: any) {
      const message = err?.message || 'Request failed'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [key, cacheTime, enabled])

  useEffect(() => {
    execute()
    return () => { abortRef.current?.abort() }
  }, [execute])

  const refresh = useCallback(() => {
    const keyToClear = key
    if (keyToClear) cache.delete(keyToClear)
    return execute()
  }, [key, execute])

  return { data, loading, error, refresh, execute }
}

export function clearCache(pattern?: string) {
  if (!pattern) {
    cache.clear()
    return
  }
  for (const key of cache.keys()) {
    if (key.includes(pattern)) cache.delete(key)
  }
}
