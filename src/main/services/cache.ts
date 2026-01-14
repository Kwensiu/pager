export interface CacheEntry<T> {
  value: T
  timestamp: number
}

export class LRUCache<K, V> {
  private cache = new Map<K, CacheEntry<V>>()
  private maxSize: number
  private ttl: number // Time to live in milliseconds

  constructor(maxSize: number = 500, ttl: number = 7 * 24 * 60 * 60 * 1000) {
    this.maxSize = maxSize
    this.ttl = ttl
  }

  get(key: K): V | undefined {
    const entry = this.cache.get(key)
    if (!entry) {
      return undefined
    }

    // 检查是否过期
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key)
      return undefined
    }

    // 删除后重新插入，更新访问顺序
    this.cache.delete(key)
    this.cache.set(key, entry)
    return entry.value
  }

  set(key: K, value: V): void {
    // 如果条目已存在，更新值和时间戳
    if (this.cache.has(key)) {
      this.cache.delete(key)
    } else if (this.cache.size >= this.maxSize) {
      // 删除最旧的条目
      const firstKey = this.cache.keys().next().value
      if (firstKey !== undefined) {
        this.cache.delete(firstKey)
      }
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now()
    })
  }

  delete(key: K): boolean {
    return this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  size(): number {
    return this.cache.size
  }

  // 获取所有有效条目
  getAll(): Map<K, CacheEntry<V>> {
    const now = Date.now()
    const validEntries = new Map<K, CacheEntry<V>>()

    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp <= this.ttl) {
        validEntries.set(key, entry)
      }
    })

    return validEntries
  }

  // 清理过期条目
  cleanup(): void {
    const now = Date.now()
    const keysToDelete: K[] = []

    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > this.ttl) {
        keysToDelete.push(key)
      }
    })

    keysToDelete.forEach((key) => this.cache.delete(key))
  }
}
