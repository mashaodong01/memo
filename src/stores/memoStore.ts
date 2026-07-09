import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Memo } from '@/types/models'
import { db } from '@/utils/indexedDB'

export const useMemoStore = defineStore('memo', () => {
  const memos = ref<Memo[]>([])
  const loading = ref(false)

  // 计算属性：置顶的备忘录
  const pinnedMemos = computed(() =>
    memos.value
      .filter(m => m.isPinned && m.status !== 'completed')
      .sort((a, b) => b.createdAt - a.createdAt)
  )

  // 计算属性：普通备忘录
  const normalMemos = computed(() =>
    memos.value
      .filter(m => !m.isPinned && m.status !== 'completed')
      .sort((a, b) => b.createdAt - a.createdAt)
  )

  // 计算属性：已完成的备忘录
  const completedMemos = computed(() =>
    memos.value
      .filter(m => m.status === 'completed')
      .sort((a, b) => b.updatedAt - a.updatedAt)
  )

  function isToday(timestamp: number) {
    const date = new Date(timestamp)
    const today = new Date()
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    )
  }

  // 计算属性：今日完成的备忘录
  const todayCompletedMemos = computed(() =>
    memos.value
      .filter(m => m.status === 'completed' && isToday(m.updatedAt))
      .sort((a, b) => b.updatedAt - a.updatedAt)
  )

  // 统计数据
  const stats = computed(() => {
    const total = memos.value.length
    const todo = memos.value.filter(m => m.status !== 'completed').length
    const completed = memos.value.filter(m => m.status === 'completed').length
    const pinned = memos.value.filter(m => m.isPinned).length
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

    return {
      total,
      todo,
      completed,
      pinned,
      completionRate
    }
  })

  // 按优先级分组
  const memosByPriority = computed(() => {
    const grouped: Record<string, number> = {
      urgent: 0,
      high: 0,
      medium: 0,
      low: 0
    }

    memos.value.forEach(memo => {
      const priority = memo.priority || 'medium'
      grouped[priority]++
    })

    return grouped
  })

  // 加载所有备忘录
  async function loadMemos() {
    loading.value = true
    try {
      console.log('[MemoStore] Loading memos from database...')
      const allMemos = await db.table<Memo>('memos').getAll()
      console.log('[MemoStore] Loaded memos:', allMemos.length)
      memos.value = allMemos
    } catch (error) {
      console.error('[MemoStore] Failed to load memos:', error)
    } finally {
      loading.value = false
    }
  }

  // 创建备忘录
  async function createMemo(content: string, priority: Memo['priority'] = 'medium') {
    const memo: Memo = {
      id: Date.now().toString(),
      content,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isPinned: false,
      priority,
      status: 'todo'
    }

    try {
      await db.table<Memo>('memos').add(memo)
      memos.value.push(memo)
      return memo
    } catch (error) {
      console.error('Failed to create memo:', error)
      throw error
    }
  }

  // 更新备忘录
  async function updateMemo(id: string, updates: Partial<Memo>) {
    try {
      const index = memos.value.findIndex(m => m.id === id)
      if (index === -1) return

      const updated = {
        ...memos.value[index],
        ...updates,
        updatedAt: Date.now()
      }

      await db.table<Memo>('memos').put(updated)
      memos.value[index] = updated
    } catch (error) {
      console.error('Failed to update memo:', error)
      throw error
    }
  }

  // 删除备忘录
  async function deleteMemo(id: string) {
    try {
      await db.table<Memo>('memos').delete(id)
      memos.value = memos.value.filter(m => m.id !== id)
    } catch (error) {
      console.error('Failed to delete memo:', error)
      throw error
    }
  }

  // 切换置顶状态
  async function togglePin(id: string) {
    const memo = memos.value.find(m => m.id === id)
    if (!memo) return

    await updateMemo(id, { isPinned: !memo.isPinned })
  }

  // 搜索备忘录
  function searchMemos(keyword: string) {
    if (!keyword) return memos.value

    return memos.value.filter(m =>
      m.content.toLowerCase().includes(keyword.toLowerCase())
    )
  }

  return {
    memos,
    loading,
    pinnedMemos,
    normalMemos,
    completedMemos,
    todayCompletedMemos,
    stats,
    memosByPriority,
    loadMemos,
    createMemo,
    updateMemo,
    deleteMemo,
    togglePin,
    searchMemos
  }
})
