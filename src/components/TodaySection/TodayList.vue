<template>
  <div class="today-section">
    <!-- Input Area -->
    <div class="input-area">
      <div class="input-card">
        <div class="date-row">
          <label class="date-label" for="daily-date">日期</label>
          <input
            id="daily-date"
            v-model="selectedDate"
            type="date"
            class="date-picker"
          />
          <span class="date-hint">{{ formatDayLabel(selectedDate) }}</span>
        </div>
        <div class="input-box">
          <textarea
            v-model="newContent"
            placeholder="今天做了什么..."
            rows="1"
            @keydown.enter.exact.prevent="handleCreate"
            @input="autoResize"
            ref="textareaRef"
          />
          <button class="send-btn" @click="handleCreate" :disabled="!newContent.trim()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- History List: one merged record per day -->
    <div class="today-list">
      <div class="section-label">历史记录 ({{ dailyLogStore.logsGroupedByDate.length }} 天)</div>

      <template v-if="dailyLogStore.logsGroupedByDate.length > 0">
        <div
          class="day-card"
          v-for="group in dailyLogStore.logsGroupedByDate"
          :key="group.date"
          :class="{ selected: selectedDate === group.date }"
          @click="selectedDate = group.date"
        >
          <div class="day-header">
            <span class="day-label">{{ formatDayLabel(group.date) }}</span>
            <div class="day-actions" @click.stop>
              <button class="icon-btn-sm" @click="startEdit(group)" title="编辑">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button class="icon-btn-sm delete-btn" @click="handleDelete(group.date)" title="删除">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
              </button>
            </div>
          </div>

          <div class="day-body" @click.stop>
            <textarea
              v-if="editingDate === group.date"
              v-model="editingContent"
              class="day-edit-input"
              rows="3"
              @blur="saveEdit(group.date)"
              @keydown.esc="cancelEdit"
              ref="editInputRef"
            />
            <div v-else class="day-content">{{ group.content }}</div>
          </div>
        </div>
      </template>

      <div v-else class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
        </svg>
        <p>还没有任何记录</p>
        <p>输入内容后按回车添加</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { useDailyLogStore, formatDateKey, type DayGroup } from '@/stores/dailyLogStore'

const dailyLogStore = useDailyLogStore()

const todayKey = formatDateKey()
const selectedDate = ref(todayKey)
const newContent = ref('')
const editingDate = ref<string | null>(null)
const editingContent = ref('')
const textareaRef = ref<HTMLTextAreaElement | null>(null)
const editInputRef = ref<HTMLTextAreaElement | HTMLTextAreaElement[] | null>(null)

function formatDayLabel(dateKey: string) {
  const [, m, d] = dateKey.split('-').map(Number)
  const date = new Date(dateKey + 'T00:00:00')
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const isToday = dateKey === todayKey
  const prefix = isToday ? '今天 · ' : ''
  return `${prefix}${m}月${d}日 ${weekdays[date.getDay()]}`
}

function autoResize() {
  const el = textareaRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 72) + 'px'
}

async function handleCreate() {
  const content = newContent.value.trim()
  if (!content) return

  await dailyLogStore.createLog(content, selectedDate.value)
  newContent.value = ''
  if (textareaRef.value) {
    textareaRef.value.style.height = 'auto'
  }
}

function startEdit(group: DayGroup) {
  editingDate.value = group.date
  editingContent.value = group.content
  selectedDate.value = group.date
  nextTick(() => {
    const input = Array.isArray(editInputRef.value)
      ? editInputRef.value[0]
      : editInputRef.value
    input?.focus()
    input?.select()
  })
}

async function saveEdit(date: string) {
  if (editingDate.value !== date) return

  await dailyLogStore.updateDayContent(date, editingContent.value)
  editingDate.value = null
  editingContent.value = ''
}

function cancelEdit() {
  editingDate.value = null
  editingContent.value = ''
}

async function handleDelete(date: string) {
  await dailyLogStore.deleteDayLog(date)
  if (editingDate.value === date) {
    cancelEdit()
  }
}
</script>

<style scoped>
.today-section {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.input-area {
  padding: 16px 16px 0;
  flex-shrink: 0;
}

.input-card {
  background: white;
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-sm);
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.date-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.date-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--foreground-muted);
  flex-shrink: 0;
}

.date-picker {
  font-size: 13px;
  color: var(--foreground-primary);
  background: var(--surface-primary);
  border: none;
  border-radius: var(--radius-lg);
  padding: 6px 10px;
  cursor: pointer;
  flex-shrink: 0;
}

.date-picker:focus {
  outline: 2px solid var(--accent-primary);
  outline-offset: 1px;
}

.date-hint {
  font-size: 12px;
  color: var(--foreground-muted);
  margin-left: auto;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.input-box {
  display: flex;
  gap: 8px;
  align-items: center;
}

textarea {
  flex: 1;
  resize: none;
  font-size: 14px;
  color: var(--foreground-primary);
  max-height: 72px;
  overflow-y: auto;
  border: none;
  background: transparent;
}

textarea:focus {
  outline: none;
}

.send-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  border-radius: var(--radius-full);
  background: var(--accent-primary);
  color: white;
  transition: all 0.2s;
  flex-shrink: 0;
}

.send-btn:hover {
  background: #c58562;
  transform: scale(1.05);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.today-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.section-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--foreground-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.day-card {
  background: white;
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-sm);
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  animation: fadeIn 0.2s ease-out;
  transition: all 0.2s;
  cursor: pointer;
  border: 2px solid transparent;
}

.day-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.day-card.selected {
  border-color: var(--accent-primary);
}

.day-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.day-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--foreground-primary);
}

.day-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.15s;
}

.day-card:hover .day-actions {
  opacity: 1;
}

.day-body {
  padding-top: 4px;
  border-top: 1px solid var(--surface-primary);
}

.day-content {
  font-size: 13px;
  line-height: 1.6;
  color: var(--foreground-primary);
  white-space: pre-wrap;
  word-wrap: break-word;
}

.day-edit-input {
  width: 100%;
  font-size: 13px;
  line-height: 1.6;
  color: var(--foreground-primary);
  background: var(--surface-primary);
  border: none;
  border-radius: var(--radius-lg);
  padding: 8px 10px;
  resize: vertical;
  min-height: 72px;
}

.day-edit-input:focus {
  outline: 2px solid var(--accent-primary);
  outline-offset: 1px;
}

.icon-btn-sm {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: var(--radius-lg);
  color: var(--foreground-muted);
  transition: all 0.2s;
}

.icon-btn-sm:hover {
  background: var(--surface-primary);
  color: var(--foreground-primary);
}

.icon-btn-sm.delete-btn:hover {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--foreground-muted);
  text-align: center;
  padding: 40px 20px;
}

.empty-state svg {
  opacity: 0.3;
  margin-bottom: 8px;
}

.empty-state p:first-of-type {
  font-size: 15px;
  font-weight: 500;
  margin: 0;
}

.empty-state p:last-of-type {
  font-size: 13px;
  margin: 0;
  opacity: 0.7;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
