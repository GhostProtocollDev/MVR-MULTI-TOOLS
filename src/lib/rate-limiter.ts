interface RateLimitResult {
  success: boolean
  remaining: number
  resetTime: number
}

interface RateLimitEntry {
  count: number
  resetTime: number
}

class RateLimiter {
  private store = new Map<string, RateLimitEntry>()
  private limit: number
  private windowMs: number
  private cleanupTimer: ReturnType<typeof setInterval>

  constructor(limit: number, windowMs: number) {
    this.limit = limit
    this.windowMs = windowMs
    this.cleanupTimer = setInterval(() => this.cleanup(), 60_000)
    if (this.cleanupTimer.unref) {
      this.cleanupTimer.unref()
    }
  }

  check(key: string): RateLimitResult {
    const now = Date.now()
    const entry = this.store.get(key)

    if (!entry || now > entry.resetTime) {
      this.store.set(key, { count: 1, resetTime: now + this.windowMs })
      return { success: true, remaining: this.limit - 1, resetTime: now + this.windowMs }
    }

    entry.count++

    if (entry.count > this.limit) {
      return { success: false, remaining: 0, resetTime: entry.resetTime }
    }

    return { success: true, remaining: this.limit - entry.count, resetTime: entry.resetTime }
  }

  private cleanup() {
    const now = Date.now()
    this.store.forEach((entry, key) => {
      if (now > entry.resetTime) {
        this.store.delete(key)
      }
    })
  }

  destroy() {
    clearInterval(this.cleanupTimer)
  }
}

const defaultLimiter = new RateLimiter(10, 60_000)

export { RateLimiter }
export default defaultLimiter
