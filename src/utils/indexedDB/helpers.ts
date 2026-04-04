/**
 * IndexedDB 辅助工具函数
 */

/**
 * 生成 UUID
 */
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * 当前时间戳
 */
export const now = (): number => {
  return Date.now()
}

/**
 * 深拷贝对象
 */
export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj))
}

/**
 * 检查 IndexedDB 是否可用
 */
export const isIndexedDBSupported = (): boolean => {
  return 'indexedDB' in window
}

/**
 * 获取数据库大小估算
 */
export const getStorageEstimate = async (): Promise<{
  usage: number
  quota: number
  usagePercentage: number
}> => {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate()
    const usage = estimate.usage || 0
    const quota = estimate.quota || 0
    const usagePercentage = quota > 0 ? (usage / quota) * 100 : 0

    return {
      usage,
      quota,
      usagePercentage
    }
  }

  return {
    usage: 0,
    quota: 0,
    usagePercentage: 0
  }
}

/**
 * 格式化存储大小
 */
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

/**
 * 导出数据为 JSON
 */
export const exportToJSON = (data: any): string => {
  return JSON.stringify(data, null, 2)
}

/**
 * 导出数据为 Blob
 */
export const exportToBlob = (data: any): Blob => {
  const json = exportToJSON(data)
  return new Blob([json], { type: 'application/json' })
}

/**
 * 下载数据为文件
 */
export const downloadData = (data: any, filename: string = 'data.json'): void => {
  const blob = exportToBlob(data)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * 从 JSON 文件导入数据
 */
export const importFromFile = (file: File): Promise<any> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        resolve(data)
      } catch (error) {
        reject(new Error('Invalid JSON file'))
      }
    }

    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }

    reader.readAsText(file)
  })
}

/**
 * 批量操作辅助函数
 */
export const batchProcess = async <T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  batchSize: number = 100
): Promise<R[]> => {
  const results: R[] = []

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    const batchResults = await Promise.all(batch.map(processor))
    results.push(...batchResults)
  }

  return results
}

/**
 * 防抖函数
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout> | null = null

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }

    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(later, wait)
  }
}

/**
 * 节流函数
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean = false

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}
