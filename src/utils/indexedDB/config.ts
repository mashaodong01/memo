/**
 * IndexedDB 数据库配置
 */

import type { DBConfig } from './types'

/**
 * 数据库配置
 */
export const dbConfig: DBConfig = {
  name: 'MemoExtensionDB',
  version: 3,
  stores: [
    // 备忘录表
    {
      name: 'memos',
      keyPath: 'id',
      autoIncrement: false,
      indexes: [
        {
          name: 'createdAt',
          keyPath: 'createdAt',
          options: { unique: false }
        },
        {
          name: 'isPinned',
          keyPath: 'isPinned',
          options: { unique: false }
        },
        {
          name: 'priority',
          keyPath: 'priority',
          options: { unique: false }
        },
        {
          name: 'status',
          keyPath: 'status',
          options: { unique: false }
        }
      ]
    }
  ]
}

/**
 * 数据模型类型定义
 */

// 备忘录模型
export interface Memo {
  id: string
  content: string
  createdAt: number
  updatedAt: number
  isPinned?: boolean
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  color?: string
  status?: 'todo' | 'completed'
}
