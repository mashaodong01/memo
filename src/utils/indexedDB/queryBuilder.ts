/**
 * IndexedDB 查询构造器
 * 提供更友好的查询接口
 */

import type { IndexedDBCore } from './core'
import type { QueryOptions } from './types'

export class QueryBuilder<T> {
  private storeName: string
  private db: IndexedDBCore
  private options: QueryOptions = {}
  private filterFn?: (item: T) => boolean

  constructor(db: IndexedDBCore, storeName: string) {
    this.db = db
    this.storeName = storeName
  }

  /**
   * 使用索引
   */
  useIndex(indexName: string): this {
    this.options.index = indexName
    return this
  }

  /**
   * 等于
   */
  equals(value: IDBValidKey): this {
    this.options.range = IDBKeyRange.only(value)
    return this
  }

  /**
   * 大于
   */
  greaterThan(value: IDBValidKey, inclusive: boolean = false): this {
    this.options.range = IDBKeyRange.lowerBound(value, !inclusive)
    return this
  }

  /**
   * 小于
   */
  lessThan(value: IDBValidKey, inclusive: boolean = false): this {
    this.options.range = IDBKeyRange.upperBound(value, !inclusive)
    return this
  }

  /**
   * 区间
   */
  between(
    lower: IDBValidKey,
    upper: IDBValidKey,
    lowerInclusive: boolean = true,
    upperInclusive: boolean = true
  ): this {
    this.options.range = IDBKeyRange.bound(
      lower,
      upper,
      !lowerInclusive,
      !upperInclusive
    )
    return this
  }

  /**
   * 排序方向
   */
  orderBy(direction: IDBCursorDirection): this {
    this.options.direction = direction
    return this
  }

  /**
   * 限制数量
   */
  limit(count: number): this {
    this.options.limit = count
    return this
  }

  /**
   * 跳过数量
   */
  offset(count: number): this {
    this.options.offset = count
    return this
  }

  /**
   * 自定义过滤器
   */
  where(predicate: (item: T) => boolean): this {
    this.filterFn = predicate
    return this
  }

  /**
   * 执行查询
   */
  async execute(): Promise<T[]> {
    return this.db.query<T>(this.storeName, {
      ...this.options,
      filter: this.filterFn
    })
  }

  /**
   * 获取第一条数据
   */
  async first(): Promise<T | undefined> {
    const results = await this.limit(1).execute()
    return results[0]
  }

  /**
   * 统计数量
   */
  async count(): Promise<number> {
    if (this.filterFn) {
      // 如果有自定义过滤器，需要遍历所有数据
      const results = await this.execute()
      return results.length
    }
    return this.db.count(this.storeName, this.options.index, this.options.range)
  }
}
