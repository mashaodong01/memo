import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { DailyLog } from '@/types/models'
import { db } from '@/utils/indexedDB'

export function formatDateKey(date: Date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export interface DayGroup {
  date: string
  content: string
  logId: string
}

function mergeLogContent(existing: string, addition: string): string {
  const next = addition.trim()
  if (!next) return existing.trim()
  if (!existing.trim()) return next
  return `${existing.trim()}\n${next}`
}

export const useDailyLogStore = defineStore('dailyLog', () => {
  const logs = ref<DailyLog[]>([])
  const loading = ref(false)

  function logsByDate(date: string) {
    return logs.value
      .filter(log => log.date === date)
      .sort((a, b) => a.createdAt - b.createdAt)
  }

  const logsGroupedByDate = computed((): DayGroup[] => {
    const groups = new Map<string, DailyLog[]>()

    logs.value.forEach(log => {
      const dayLogs = groups.get(log.date) ?? []
      dayLogs.push(log)
      groups.set(log.date, dayLogs)
    })

    return Array.from(groups.entries())
      .map(([date, dayLogs]) => {
        const sorted = dayLogs.sort((a, b) => a.createdAt - b.createdAt)
        return {
          date,
          content: sorted.map(log => log.content.trim()).filter(Boolean).join('\n'),
          logId: sorted[0].id
        }
      })
      .sort((a, b) => b.date.localeCompare(a.date))
  })

  async function consolidateDuplicateDays() {
    const groups = new Map<string, DailyLog[]>()

    logs.value.forEach(log => {
      const dayLogs = groups.get(log.date) ?? []
      dayLogs.push(log)
      groups.set(log.date, dayLogs)
    })

    for (const dayLogs of groups.values()) {
      if (dayLogs.length <= 1) continue

      const sorted = dayLogs.sort((a, b) => a.createdAt - b.createdAt)
      const mergedContent = sorted.map(log => log.content.trim()).filter(Boolean).join('\n')
      const keep = sorted[0]

      await db.table<DailyLog>('dailyLogs').put({
        ...keep,
        content: mergedContent,
        updatedAt: Date.now()
      })

      for (let i = 1; i < sorted.length; i++) {
        await db.table<DailyLog>('dailyLogs').delete(sorted[i].id)
      }
    }

    logs.value = await db.table<DailyLog>('dailyLogs').getAll()
  }

  async function loadLogs() {
    loading.value = true
    try {
      const allLogs = await db.table<DailyLog>('dailyLogs').getAll()
      logs.value = allLogs
      await consolidateDuplicateDays()
    } catch (error) {
      console.error('[DailyLogStore] Failed to load logs:', error)
    } finally {
      loading.value = false
    }
  }

  async function createLog(content: string, date: string) {
    const trimmed = content.trim()
    if (!trimmed) return

    const existing = logs.value.find(log => log.date === date)

    if (existing) {
      await updateLog(existing.id, mergeLogContent(existing.content, trimmed))
      return existing
    }

    const log: DailyLog = {
      id: Date.now().toString(),
      content: trimmed,
      date,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

    try {
      await db.table<DailyLog>('dailyLogs').add(log)
      logs.value.push(log)
      return log
    } catch (error) {
      console.error('[DailyLogStore] Failed to create log:', error)
      throw error
    }
  }

  async function updateLog(id: string, content: string) {
    try {
      const index = logs.value.findIndex(log => log.id === id)
      if (index === -1) return

      const updated = {
        ...logs.value[index],
        content,
        updatedAt: Date.now()
      }

      await db.table<DailyLog>('dailyLogs').put(updated)
      logs.value[index] = updated
    } catch (error) {
      console.error('[DailyLogStore] Failed to update log:', error)
      throw error
    }
  }

  async function deleteLog(id: string) {
    try {
      await db.table<DailyLog>('dailyLogs').delete(id)
      logs.value = logs.value.filter(log => log.id !== id)
    } catch (error) {
      console.error('[DailyLogStore] Failed to delete log:', error)
      throw error
    }
  }

  async function updateDayContent(date: string, content: string) {
    const existing = logs.value.find(log => log.date === date)
    const trimmed = content.trim()

    if (!existing) return
    if (!trimmed) {
      await deleteLog(existing.id)
      return
    }

    await updateLog(existing.id, trimmed)
  }

  async function deleteDayLog(date: string) {
    const dayLogs = logs.value.filter(log => log.date === date)
    for (const log of dayLogs) {
      await deleteLog(log.id)
    }
  }

  return {
    logs,
    loading,
    logsByDate,
    logsGroupedByDate,
    loadLogs,
    createLog,
    updateLog,
    updateDayContent,
    deleteLog,
    deleteDayLog
  }
})
