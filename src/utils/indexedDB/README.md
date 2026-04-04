# IndexedDB 封装使用指南

完整的 IndexedDB 封装方案，提供类型安全的数据库操作接口，可用于替代后端数据库实现前端数据持久化。

## 特性

- ✅ TypeScript 类型安全
- ✅ Promise 化的异步 API
- ✅ 链式查询构造器
- ✅ 批量操作支持
- ✅ 分页查询
- ✅ 索引查询
- ✅ 数据导入/导出
- ✅ 单例模式
- ✅ 错误处理

## 快速开始

### 1. 初始化数据库

在应用入口初始化数据库：

```typescript
// main.ts
import { initDB } from '@/utils/indexedDB'

// 初始化数据库
await initDB()

// 创建 Vue 应用
const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
```

### 2. 基础 CRUD 操作

```typescript
import { getDB } from '@/utils/indexedDB'
import type { Task } from '@/utils/indexedDB/config'

const db = getDB()
const taskTable = db.table<Task>('tasks')

// 添加数据
const task: Task = {
  id: 'task-1',
  title: 'Learn IndexedDB',
  status: 'pending',
  priority: 'high',
  createdAt: Date.now(),
  updatedAt: Date.now()
}
await taskTable.add(task)

// 获取数据
const foundTask = await taskTable.get('task-1')

// 更新数据
await taskTable.put({
  ...task,
  status: 'completed',
  updatedAt: Date.now()
})

// 删除数据
await taskTable.delete('task-1')

// 获取所有数据
const allTasks = await taskTable.getAll()

// 清空表
await taskTable.clear()

// 统计数量
const count = await taskTable.count()
```

### 3. 查询构造器

```typescript
// 使用索引查询
const pendingTasks = await taskTable
  .query()
  .useIndex('status')
  .equals('pending')
  .execute()

// 范围查询
const highPriorityTasks = await taskTable
  .query()
  .useIndex('priority')
  .equals('high')
  .orderBy('next')
  .execute()

// 区间查询
const recentTasks = await taskTable
  .query()
  .useIndex('createdAt')
  .between(startDate, endDate)
  .limit(10)
  .execute()

// 自定义过滤
const urgentPendingTasks = await taskTable
  .query()
  .where((task) => task.priority === 'urgent' && task.status === 'pending')
  .execute()

// 获取第一条
const firstTask = await taskTable
  .query()
  .useIndex('createdAt')
  .orderBy('prev')
  .first()

// 分页查询
const page = await taskTable.paginate(1, 10)
console.log(page.data) // 数据
console.log(page.total) // 总数
console.log(page.hasMore) // 是否有更多
```

### 4. 批量操作

```typescript
// 批量添加
const tasks: Task[] = [
  { id: '1', title: 'Task 1', ... },
  { id: '2', title: 'Task 2', ... },
  { id: '3', title: 'Task 3', ... }
]
await taskTable.addMany(tasks)

// 批量更新
await taskTable.putMany(tasks.map(t => ({ ...t, status: 'completed' })))

// 批量删除
await taskTable.deleteMany(['1', '2', '3'])

// 批量操作（事务）
await taskTable.bulkOperation([
  { type: 'add', data: task1 },
  { type: 'put', data: task2 },
  { type: 'delete', key: 'task-3' }
])
```

### 5. 高级查询

```typescript
// 查找单条
const task = await taskTable.findOne(
  (t) => t.title.includes('Important')
)

// 查找多条
const tasks = await taskTable.findMany(
  (t) => t.priority === 'high' && t.status !== 'completed'
)

// 更新符合条件的数据
const updated = await taskTable.updateMany(
  (t) => t.status === 'pending',
  (t) => ({ ...t, status: 'in-progress', updatedAt: Date.now() })
)

// 删除符合条件的数据
const deleted = await taskTable.deleteWhere(
  (t) => t.status === 'cancelled'
)
```

### 6. 在 Pinia Store 中使用

```typescript
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getDB } from '@/utils/indexedDB'
import type { Task } from '@/utils/indexedDB/config'

export const useTaskStore = defineStore('task', () => {
  const tasks = ref<Task[]>([])

  // 加载所有任务
  const loadTasks = async () => {
    const db = getDB()
    const taskTable = db.table<Task>('tasks')
    tasks.value = await taskTable.getAll()
  }

  // 创建任务
  const createTask = async (taskData: Partial<Task>) => {
    const task: Task = {
      id: generateId(),
      ...taskData,
      createdAt: Date.now(),
      updatedAt: Date.now()
    } as Task

    const db = getDB()
    await db.table<Task>('tasks').add(task)
    tasks.value.push(task)
  }

  // 更新任务
  const updateTask = async (id: string, updates: Partial<Task>) => {
    const db = getDB()
    const taskTable = db.table<Task>('tasks')
    const task = await taskTable.get(id)

    if (task) {
      const updated = { ...task, ...updates, updatedAt: Date.now() }
      await taskTable.put(updated)

      const index = tasks.value.findIndex(t => t.id === id)
      if (index !== -1) {
        tasks.value[index] = updated
      }
    }
  }

  return {
    tasks,
    loadTasks,
    createTask,
    updateTask
  }
})
```

### 7. 数据导入/导出

```typescript
import { getDB } from '@/utils/indexedDB'
import { downloadData, importFromFile } from '@/utils/indexedDB/helpers'

// 导出所有数据
const exportData = async () => {
  const db = getDB()
  const data = await db.export()
  downloadData(data, 'backup.json')
}

// 导入数据
const importData = async (file: File) => {
  const data = await importFromFile(file)
  const db = getDB()
  await db.import(data)
}

// 清空并导入
const resetAndImport = async (file: File) => {
  const data = await importFromFile(file)
  const db = getDB()
  await db.clearAll()
  await db.import(data)
}
```

### 8. 数据库管理

```typescript
import { getDB, resetDB } from '@/utils/indexedDB'
import { getStorageEstimate, formatBytes } from '@/utils/indexedDB/helpers'

// 获取存储使用情况
const checkStorage = async () => {
  const estimate = await getStorageEstimate()
  console.log(`Used: ${formatBytes(estimate.usage)}`)
  console.log(`Quota: ${formatBytes(estimate.quota)}`)
  console.log(`Usage: ${estimate.usagePercentage.toFixed(2)}%`)
}

// 重置数据库（删除并重新创建）
await resetDB()

// 关闭数据库连接
const db = getDB()
db.close()
```

## 配置数据库结构

在 `config.ts` 中定义数据库结构：

```typescript
export const dbConfig: DBConfig = {
  name: 'MyAppDB',
  version: 1,
  stores: [
    {
      name: 'users',
      keyPath: 'id',
      autoIncrement: false,
      indexes: [
        {
          name: 'email',
          keyPath: 'email',
          options: { unique: true }
        },
        {
          name: 'createdAt',
          keyPath: 'createdAt',
          options: { unique: false }
        }
      ]
    }
  ]
}
```

## 辅助工具函数

```typescript
import {
  generateId,
  now,
  isIndexedDBSupported,
  deepClone,
  batchProcess
} from '@/utils/indexedDB/helpers'

// 生成唯一 ID
const id = generateId()

// 当前时间戳
const timestamp = now()

// 检查浏览器支持
if (isIndexedDBSupported()) {
  // 初始化数据库
}

// 深拷贝
const copy = deepClone(originalObject)

// 批量处理
await batchProcess(items, async (item) => {
  await processItem(item)
}, 100) // 每批 100 条
```

## 最佳实践

1. **在应用启动时初始化数据库**
   ```typescript
   await initDB()
   ```

2. **使用 TypeScript 类型**
   ```typescript
   const taskTable = db.table<Task>('tasks')
   ```

3. **错误处理**
   ```typescript
   try {
     await taskTable.add(task)
   } catch (error) {
     console.error('Failed to add task:', error)
   }
   ```

4. **使用索引优化查询**
   - 为常用查询字段创建索引
   - 使用 `.useIndex()` 进行索引查询

5. **批量操作提升性能**
   - 使用 `addMany()`、`putMany()` 而不是循环调用 `add()`、`put()`

6. **定期备份数据**
   - 提供导出功能给用户
   - 实现自动备份机制

## 常见问题

### Q: 数据库版本如何升级？

A: 修改 `config.ts` 中的 `version` 字段，IndexedDB 会自动触发升级流程。

### Q: 如何处理多标签页同步？

A: 可以使用 BroadcastChannel API 或 localStorage 事件来同步数据。

### Q: 数据库有大小限制吗？

A: 不同浏览器有不同限制，一般为可用磁盘空间的 50%，使用 `getStorageEstimate()` 查看。

### Q: 如何迁移数据？

A: 使用 `export()` 导出旧数据，更新数据库结构，然后使用 `import()` 导入。

## 示例项目

查看 `src/stores/taskStore.ts` 和 `src/components/TaskExample.vue` 获取完整的使用示例。

## API 文档

### Database 类

- `init()` - 初始化数据库
- `table<T>(name)` - 获取表操作对象
- `close()` - 关闭数据库
- `destroy()` - 删除数据库
- `clearAll()` - 清空所有表
- `export()` - 导出所有数据
- `import(data)` - 导入数据

### Table 类

- `add(data)` - 添加数据
- `addMany(data[])` - 批量添加
- `put(data)` - 更新数据
- `putMany(data[])` - 批量更新
- `get(key)` - 获取数据
- `getAll()` - 获取所有数据
- `delete(key)` - 删除数据
- `deleteMany(keys[])` - 批量删除
- `clear()` - 清空表
- `count()` - 统计数量
- `query()` - 创建查询构造器
- `paginate(page, size)` - 分页查询
- `findOne(predicate)` - 查找单条
- `findMany(predicate)` - 查找多条
- `updateMany(predicate, updater)` - 批量更新
- `deleteWhere(predicate)` - 条件删除

### QueryBuilder 类

- `useIndex(name)` - 使用索引
- `equals(value)` - 等于
- `greaterThan(value)` - 大于
- `lessThan(value)` - 小于
- `between(lower, upper)` - 区间
- `orderBy(direction)` - 排序
- `limit(count)` - 限制数量
- `offset(count)` - 跳过数量
- `where(predicate)` - 自定义过滤
- `execute()` - 执行查询
- `first()` - 获取第一条
- `count()` - 统计数量
