/**
 * IndexedDB 封装主入口
 */

import { Database } from './database'
import { dbConfig } from './config'

// 导出类型
export * from './types'
export * from './config'
export { Database, Table } from './database'
export { IndexedDBCore } from './core'
export { QueryBuilder } from './queryBuilder'

/**
 * 全局数据库实例
 */
let dbInstance: Database | null = null

/**
 * 获取数据库实例（单例模式）
 */
export const getDB = (): Database => {
  if (!dbInstance) {
    dbInstance = new Database(dbConfig)
  }
  return dbInstance
}

/**
 * 初始化数据库
 */
export const initDB = async (): Promise<Database> => {
  const db = getDB()
  await db.init()
  return db
}

/**
 * 重置数据库
 */
export const resetDB = async (): Promise<Database> => {
  if (dbInstance) {
    await dbInstance.destroy()
    dbInstance = null
  }
  return initDB()
}

/**
 * 数据库实例（便捷访问）
 */
export const db = getDB()

// 默认导出
export default {
  getDB,
  initDB,
  resetDB,
  db
}
