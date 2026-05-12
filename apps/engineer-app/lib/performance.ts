const metrics: Record<string, number[]> = {}

export const perf = {
  start: (label: string) => {
    if (__DEV__) {
      performance.mark(`${label}-start`)
    }
  },
  end: (label: string) => {
    if (__DEV__) {
      performance.mark(`${label}-end`)
      performance.measure(label, `${label}-start`, `${label}-end`)
      const entries = performance.getEntriesByName(label)
      const duration = entries[entries.length - 1]?.duration
      if (duration) {
        if (!metrics[label]) metrics[label] = []
        metrics[label].push(duration)
        if (metrics[label].length > 10) metrics[label].shift()
        const avg = metrics[label].reduce((a, b) => a + b, 0) / metrics[label].length
        console.log(`[Perf] ${label}: ${duration.toFixed(0)}ms (avg: ${avg.toFixed(0)}ms)`)
      }
      performance.clearMeasures(label)
      performance.clearMarks(`${label}-start`)
      performance.clearMarks(`${label}-end`)
    }
  },
}
