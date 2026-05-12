const IS_DEV = __DEV__ || process.env.NODE_ENV === 'development'

export const logger = {
  error: (message: string, ...args: any[]) => {
    if (IS_DEV) {
      console.error(`[Error] ${message}`, ...args)
    }
  },
  warn: (message: string, ...args: any[]) => {
    if (IS_DEV) {
      console.warn(`[Warn] ${message}`, ...args)
    }
  },
  info: (message: string, ...args: any[]) => {
    if (IS_DEV) {
      console.log(`[Info] ${message}`, ...args)
    }
  },
}
