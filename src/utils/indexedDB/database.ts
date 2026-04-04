/**
 * IndexedDB 数据库管理器
 * 提供高级的数据库操作接口
 */

import { IndexedDBCore } from './core'
import { QueryBuilder } from './queryBuilder'
import type { DBConfig, PaginationResult } from './types'

export class Database {
  private core: IndexedDBCore
  private config: DBConfig

  constructor(config: DBConfig) {
    this.config = config
    this.core = new IndexedDBCore(config)
  }

  /**
   * 初始化数据库
   */
  async init(): Promise<void> {
    await this.core.open()
  }

  /**
   * 获取表操作对象
   */
  table<T = any>(storeName: string) {
    return new Table<T>(this.core, storeName)
  }

  /**
   * 关闭数据库
   */
  close() {
    this.core.close()
  }

  /**
   * 删除数据库
   */
  async destroy(): Promise<void> {
    await this.core.deleteDatabase()
  }

  /**
   * 清空所有表
   */
  async clearAll(): Promise<void> {
    for (const store of this.config.stores) {
      await this.core.clear(store.name)
    }
  }

  /**
   * 导出数据
   */
  async export(): Promise<Record<string, any[]>> {
    const data: Record<string, any[]> = {}

    for (const store of this.config.stores) {
      data[store.name] = await this.core.getAll(store.name)
    }

    return data
  }

  /**
   * 导入数据
   */
  async import(data: Record<string, any[]>): Promise<void> {
    for (const [storeName, items] of Object.entries(data)) {
      if (items.length > 0) {
        await this.core.putBatch(storeName, items)
      }
    }
  }
}

/**
 * 表操作类
 */
export class Table<T> {
  private core: IndexedDBCore
  private storeName: string

  constructor(core: IndexedDBCore, storeName: string) {
    this.core = core
    this.storeName = storeName
  }

  /**
   * 添加数据
   */
  async add(data: T): Promise<IDBValidKey> {
    return this.core.add(this.storeName, data)
  }

  /**
   * 批量添加
   */
  async addMany(dataList: T[]): Promise<IDBValidKey[]> {
    return this.core.addBatch(this.storeName, dataList)
  }

  /**
   * 更新数据（不存在则添加）
   */
  async put(data: T): Promise<IDBValidKey> {
    return this.core.put(this.storeName, data)
  }

  /**
   * 批量更新
   */
  async putMany(dataList: T[]): Promise<IDBValidKey[]> {
    return this.core.putBatch(this.storeName, dataList)
  }

  /**
   * 根据主键获取
   */
  async get(key: IDBValidKey): Promise<T | undefined> {
    return this.core.get<T>(this.storeName, key)
  }

  /**
   * 获取所有数据
   */
  async getAll(): Promise<T[]> {
    console.log(112321321312, this.core, this.storeName)
    return this.core.getAll<T>(this.storeName)
  }

  /**
   * 删除数据
   */
  async delete(key: IDBValidKey): Promise<void> {
    return this.core.delete(this.storeName, key)
  }

  /**
   * 批量删除
   */
  async deleteMany(keys: IDBValidKey[]): Promise<void> {
    return this.core.deleteBatch(this.storeName, keys)
  }

  /**
   * 清空表
   */
  async clear(): Promise<void> {
    return this.core.clear(this.storeName)
  }

  /**
   * 统计数量
   */
  async count(): Promise<number> {
    return this.core.count(this.storeName)
  }

  /**
   * 创建查询构造器
   */
  query(): QueryBuilder<T> {
    return new QueryBuilder<T>(this.core, this.storeName)
  }

  /**
   * 分页查询
   */
  async paginate(
    page: number = 1,
    pageSize: number = 10
  ): Promise<PaginationResult<T>> {
    return this.core.paginate<T>(this.storeName, page, pageSize)
  }

  /**
   * 查找单条数据
   */
  async findOne(predicate: (item: T) => boolean): Promise<T | undefined> {
    const results = await this.core.query<T>(this.storeName, {
      filter: predicate,
      limit: 1
    })
    return results[0]
  }

  /**
   * 查找多条数据
   */
  async findMany(predicate: (item: T) => boolean): Promise<T[]> {
    return this.core.query<T>(this.storeName, {
      filter: predicate
    })
  }

  /**
   * 更新匹配的数据
   */
  async updateMany(
    predicate: (item: T) => boolean,
    updater: (item: T) => T
  ): Promise<number> {
    const items = await this.findMany(predicate)
    const updated = items.map(updater)
    await this.putMany(updated)
    return updated.length
  }

  /**
   * 删除匹配的数据
   */
  async deleteWhere(predicate: (item: T) => boolean): Promise<number> {
    const keys = await this.core.getAllKeys(this.storeName)
    const allItems = await this.getAll()

    const keysToDelete = allItems
      .map((item, index) => ({ item, key: keys[index] }))
      .filter(({ item }) => predicate(item))
      .map(({ key }) => key)

    await this.deleteMany(keysToDelete)
    return keysToDelete.length
  }

  /**
   * 批量操作（事务）
   */
  async bulkOperation(operations: Array<{
    type: 'add' | 'put' | 'delete'
    data?: T
    key?: IDBValidKey
  }>): Promise<void> {
    for (const op of operations) {
      switch (op.type) {
        case 'add':
          if (op.data) await this.add(op.data)
          break
        case 'put':
          if (op.data) await this.put(op.data)
          break
        case 'delete':
          if (op.key) await this.delete(op.key)
          break
      }
    }
  }
}
