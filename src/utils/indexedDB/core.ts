/**
 * IndexedDB 核心类
 * 提供基础的数据库操作功能
 */

import type { DBConfig, StoreConfig, QueryOptions, PaginationResult } from './types'

export class IndexedDBCore {
  private db: IDBDatabase | null = null
  private config: DBConfig
  private opening: Promise<IDBDatabase> | null = null

  constructor(config: DBConfig) {
    this.config = config
  }

  /**
   * 打开数据库
   */
  async open(): Promise<IDBDatabase> {
    if (this.db) {
      return this.db
    }

    // 防止重复打开
    if (this.opening) {
      return this.opening
    }

    this.opening = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.config.name, this.config.version)

      request.onerror = () => {
        this.opening = null
        reject(new Error(`Failed to open database: ${request.error?.message}`))
      }

      request.onsuccess = () => {
        this.db = request.result
        this.opening = null
        resolve(request.result)
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        const oldVersion = event.oldVersion
        const newVersion = event.newVersion
        console.log(`[IndexedDB] Upgrading database from version ${oldVersion} to ${newVersion}`)
        this.createStores(db, event)
      }
    })

    return this.opening
  }

  /**
   * 创建对象存储和索引
   */
  private createStores(db: IDBDatabase, event: IDBVersionChangeEvent) {
    const transaction = (event.target as IDBOpenDBRequest).transaction!

    this.config.stores.forEach((storeConfig: StoreConfig) => {
      let store: IDBObjectStore

      // 如果存储不存在，创建新的
      if (!db.objectStoreNames.contains(storeConfig.name)) {
        console.log(`[IndexedDB] Creating store "${storeConfig.name}"`)
        store = db.createObjectStore(storeConfig.name, {
          keyPath: storeConfig.keyPath,
          autoIncrement: storeConfig.autoIncrement ?? false
        })

        // 创建索引
        storeConfig.indexes?.forEach((indexConfig) => {
          console.log(`[IndexedDB] Creating index "${indexConfig.name}" on store "${storeConfig.name}"`)
          store.createIndex(
            indexConfig.name,
            indexConfig.keyPath,
            indexConfig.options
          )
        })
      } else {
        // Store 已存在，只添加缺失的索引
        console.log(`[IndexedDB] Store "${storeConfig.name}" already exists, checking indexes`)
        store = transaction.objectStore(storeConfig.name)

        storeConfig.indexes?.forEach((indexConfig) => {
          if (!store.indexNames.contains(indexConfig.name)) {
            console.log(`[IndexedDB] Creating missing index "${indexConfig.name}" on store "${storeConfig.name}"`)
            store.createIndex(
              indexConfig.name,
              indexConfig.keyPath,
              indexConfig.options
            )
          }
        })
      }
    })
  }

  /**
   * 关闭数据库
   */
  close() {
    if (this.db) {
      this.db.close()
      this.db = null
    }
  }

  /**
   * 删除数据库
   */
  async deleteDatabase(): Promise<void> {
    this.close()
    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(this.config.name)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * 获取事务
   */
  private async getTransaction(
    storeNames: string | string[],
    mode: IDBTransactionMode = 'readonly'
  ): Promise<IDBTransaction> {
    const db = await this.open()
    return db.transaction(storeNames, mode)
  }

  /**
   * 添加数据
   */
  async add<T>(storeName: string, data: T): Promise<IDBValidKey> {
    console.log(`[IndexedDB] Adding data to store: ${storeName}`, data)
    const transaction = await this.getTransaction(storeName, 'readwrite')
    const store = transaction.objectStore(storeName)

    return new Promise((resolve, reject) => {
      const request = store.add(data)
      request.onsuccess = () => {
        console.log(`[IndexedDB] Data added successfully to ${storeName}, key:`, request.result)
        resolve(request.result)
      }
      request.onerror = () => {
        console.error(`[IndexedDB] Error adding data to ${storeName}:`, request.error)
        reject(request.error)
      }
    })
  }

  /**
   * 批量添加数据
   */
  async addBatch<T>(storeName: string, dataList: T[]): Promise<IDBValidKey[]> {
    const transaction = await this.getTransaction(storeName, 'readwrite')
    const store = transaction.objectStore(storeName)

    const promises = dataList.map((data) => {
      return new Promise<IDBValidKey>((resolve, reject) => {
        const request = store.add(data)
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })
    })

    return Promise.all(promises)
  }

  /**
   * 更新数据（如果不存在则添加）
   */
  async put<T>(storeName: string, data: T): Promise<IDBValidKey> {
    const transaction = await this.getTransaction(storeName, 'readwrite')
    const store = transaction.objectStore(storeName)

    return new Promise((resolve, reject) => {
      const request = store.put(data)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * 批量更新数据
   */
  async putBatch<T>(storeName: string, dataList: T[]): Promise<IDBValidKey[]> {
    const transaction = await this.getTransaction(storeName, 'readwrite')
    const store = transaction.objectStore(storeName)

    const promises = dataList.map((data) => {
      return new Promise<IDBValidKey>((resolve, reject) => {
        const request = store.put(data)
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })
    })

    return Promise.all(promises)
  }

  /**
   * 根据主键获取数据
   */
  async get<T>(storeName: string, key: IDBValidKey): Promise<T | undefined> {
    const transaction = await this.getTransaction(storeName, 'readonly')
    const store = transaction.objectStore(storeName)

    return new Promise((resolve, reject) => {
      const request = store.get(key)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * 获取所有数据
   */
  async getAll<T>(storeName: string, options?: QueryOptions): Promise<T[]> {
    console.log(`[IndexedDB] getAll called for store: ${storeName}`)
    const transaction = await this.getTransaction(storeName, 'readonly')
    const store = transaction.objectStore(storeName)
    const source = options?.index ? store.index(options.index) : store

    return new Promise((resolve, reject) => {
      // 勿使用 getAll(undefined, undefined)：部分环境下会错误地返回空结果，应使用无参 getAll()
      let request: IDBRequest<T[]>
      if (options?.range !== undefined) {
        request = (
          options.limit !== undefined
            ? source.getAll(options.range, options.limit)
            : source.getAll(options.range)
        ) as IDBRequest<T[]>
      } else if (options?.limit !== undefined) {
        request = source.getAll(undefined, options.limit) as IDBRequest<T[]>
      } else {
        request = source.getAll() as IDBRequest<T[]>
      }
      request.onsuccess = () => {
        let results = request.result
        console.log(`[IndexedDB] getAll result for ${storeName}:`, results.length, 'items')

        // 处理偏移量
        if (options?.offset) {
          results = results.slice(options.offset)
        }

        resolve(results)
      }
      request.onerror = () => {
        console.error(`[IndexedDB] getAll error for ${storeName}:`, request.error)
        reject(request.error)
      }
    })
  }

  /**
   * 使用游标查询数据（支持更复杂的查询）
   */
  async query<T>(
    storeName: string,
    options?: QueryOptions & { filter?: (item: T) => boolean }
  ): Promise<T[]> {
    const transaction = await this.getTransaction(storeName, 'readonly')
    const store = transaction.objectStore(storeName)
    const source = options?.index ? store.index(options.index) : store

    return new Promise((resolve, reject) => {
      const results: T[] = []
      let skipped = 0
      const offset = options?.offset ?? 0
      const limit = options?.limit

      const request = source.openCursor(options?.range, options?.direction)

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result

        if (cursor) {
          // 处理偏移量
          if (skipped < offset) {
            skipped++
            cursor.continue()
            return
          }

          // 处理过滤器
          if (options?.filter && !options.filter(cursor.value)) {
            cursor.continue()
            return
          }

          results.push(cursor.value)

          // 处理限制
          if (limit && results.length >= limit) {
            resolve(results)
            return
          }

          cursor.continue()
        } else {
          resolve(results)
        }
      }

      request.onerror = () => reject(request.error)
    })
  }

  /**
   * 分页查询
   */
  async paginate<T>(
    storeName: string,
    page: number = 1,
    pageSize: number = 10,
    options?: QueryOptions
  ): Promise<PaginationResult<T>> {
    // 获取总数
    const total = await this.count(storeName, options?.index, options?.range)

    // 计算偏移量
    const offset = (page - 1) * pageSize

    // 查询数据
    const data = await this.query<T>(storeName, {
      ...options,
      offset,
      limit: pageSize
    })

    return {
      data,
      total,
      page,
      pageSize,
      hasMore: offset + pageSize < total
    }
  }

  /**
   * 统计数量
   */
  async count(
    storeName: string,
    indexName?: string,
    range?: IDBKeyRange
  ): Promise<number> {
    console.log(`[IndexedDB] Counting records in store: ${storeName}`)
    const transaction = await this.getTransaction(storeName, 'readonly')
    const store = transaction.objectStore(storeName)
    const source = indexName ? store.index(indexName) : store

    return new Promise((resolve, reject) => {
      const request = source.count(range)
      request.onsuccess = () => {
        console.log(`[IndexedDB] Count result for ${storeName}:`, request.result)
        resolve(request.result)
      }
      request.onerror = () => {
        console.error(`[IndexedDB] Count error for ${storeName}:`, request.error)
        reject(request.error)
      }
    })
  }

  /**
   * 删除数据
   */
  async delete(storeName: string, key: IDBValidKey): Promise<void> {
    const transaction = await this.getTransaction(storeName, 'readwrite')
    const store = transaction.objectStore(storeName)

    return new Promise((resolve, reject) => {
      const request = store.delete(key)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * 批量删除
   */
  async deleteBatch(storeName: string, keys: IDBValidKey[]): Promise<void> {
    const transaction = await this.getTransaction(storeName, 'readwrite')
    const store = transaction.objectStore(storeName)

    const promises = keys.map((key) => {
      return new Promise<void>((resolve, reject) => {
        const request = store.delete(key)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })
    })

    await Promise.all(promises)
  }

  /**
   * 清空对象存储
   */
  async clear(storeName: string): Promise<void> {
    const transaction = await this.getTransaction(storeName, 'readwrite')
    const store = transaction.objectStore(storeName)

    return new Promise((resolve, reject) => {
      const request = store.clear()
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * 获取所有主键
   */
  async getAllKeys(storeName: string, range?: IDBKeyRange): Promise<IDBValidKey[]> {
    const transaction = await this.getTransaction(storeName, 'readonly')
    const store = transaction.objectStore(storeName)

    return new Promise((resolve, reject) => {
      const request = store.getAllKeys(range)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }
}
