/**
 * IndexedDB 类型定义
 */

// 数据库配置
export interface DBConfig {
  name: string
  version: number
  stores: StoreConfig[]
}

// 对象存储配置
export interface StoreConfig {
  name: string
  keyPath: string
  autoIncrement?: boolean
  indexes?: IndexConfig[]
}

// 索引配置
export interface IndexConfig {
  name: string
  keyPath: string | string[]
  options?: IDBIndexParameters
}

// 查询条件
export interface QueryOptions {
  index?: string
  range?: IDBKeyRange
  direction?: IDBCursorDirection
  limit?: number
  offset?: number
}

// 分页结果
export interface PaginationResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

// 查询条件构造器
export type WhereCondition<T> = {
  [K in keyof T]?: T[K] | {
    $gt?: T[K]
    $gte?: T[K]
    $lt?: T[K]
    $lte?: T[K]
    $eq?: T[K]
    $in?: T[K][]
  }
}
