import { useEffect, useState, useCallback } from 'react'
import NetInfo, { NetInfoState } from '@react-native-community/netinfo'
import { logger } from './logger'

interface NetworkStatus {
  isConnected: boolean
  isInternetReachable: boolean | null
  connectionType: string | null
}

const defaults: NetworkStatus = {
  isConnected: true,
  isInternetReachable: true,
  connectionType: null,
}

export function useNetworkStatus() {
  const [status, setStatus] = useState<NetworkStatus>(defaults)

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const next: NetworkStatus = {
        isConnected: !!state.isConnected,
        isInternetReachable: state.isInternetReachable,
        connectionType: state.type,
      }
      setStatus(next)
      if (!next.isConnected) {
        logger.warn('Network connection lost')
      } else if (!next.isInternetReachable) {
        logger.warn('Network reachable but no internet access')
      }
    })

    NetInfo.fetch().then((state) => {
      setStatus({
        isConnected: !!state.isConnected,
        isInternetReachable: state.isInternetReachable,
        connectionType: state.type,
      })
    })

    return () => unsubscribe()
  }, [])

  const checkConnection = useCallback(async (): Promise<boolean> => {
    const state = await NetInfo.fetch()
    return !!state.isConnected
  }, [])

  return { ...status, checkConnection }
}
