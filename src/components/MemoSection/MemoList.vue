<template>
  <div class="memo-section">
    <!-- Input Area -->
    <div class="input-area">
      <div class="input-card">
        <div class="input-box">
          <textarea
            v-model="newMemoContent"
            placeholder="快速记录一条备忘..."
            rows="1"
            @keydown.enter.exact="handleCreate"
            @input="autoResize"
            ref="textareaRef"
          />
          <button class="send-btn" @click="handleCreate" :disabled="!newMemoContent.trim()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
        <div class="priority-selector">
          <button
            v-for="p in priorities"
            :key="p.value"
            class="priority-btn"
            :class="{ active: newMemoPriority === p.value }"
            @click="newMemoPriority = p.value"
          >
            <span class="priority-dot" :style="{ background: p.color }"></span>
            <span>{{ p.label }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Sort Area -->
    <div class="sort-area">
      <div class="sort-group">
        <button
          class="sort-btn"
          :class="{ active: sortBy === 'time' }"
          @click="sortBy = 'time'"
        >
          按时间
        </button>
        <button
          class="sort-btn"
          :class="{ active: sortBy === 'priority' }"
          @click="sortBy = 'priority'"
        >
          按优先级
        </button>
      </div>
    </div>

    <!-- Memo List -->
    <div class="memo-list">
      <!-- Pinned Memos -->
      <template v-if="sortedPinnedMemos.length > 0">
        <div class="section-label">置顶</div>
        <div class="memo-card pinned" v-for="memo in sortedPinnedMemos" :key="memo.id">
          <input
            v-if="editingMemoId === memo.id"
            v-model="editingContent"
            class="memo-edit-input"
            @blur="saveEdit(memo.id)"
            @keydown.enter="saveEdit(memo.id)"
            @keydown.esc="cancelEdit"
            ref="editInputRef"
          />
          <div
            v-else
            class="memo-content"
            :class="{ completed: memo.status === 'completed' }"
          >
            {{ memo.content }}
          </div>
          <div class="memo-footer">
            <div class="memo-footer-left">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--accent-primary)">
                <path d="M12 17v5m-7-5l7-7 7 7M5 10V8a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v2"/>
              </svg>
              <span class="memo-time">{{ formatTime(memo.createdAt) }}</span>
              <span class="priority-tag" :class="`priority-${memo.priority || 'medium'}`">
                {{ getPriorityLabel(memo.priority) }}
              </span>
            </div>
            <div class="memo-actions">
              <button class="icon-btn-sm" @click="handleEdit(memo)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button class="icon-btn-sm" @click="memoStore.togglePin(memo.id)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 17v5m-7-5l7-7 7 7M5 10V8a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v2"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </template>

      <!-- Normal Memos -->
      <template v-if="sortedNormalMemos.length > 0">
        <div class="section-label">最近</div>
        <div class="memo-card" v-for="memo in sortedNormalMemos" :key="memo.id">
          <input
            v-if="editingMemoId === memo.id"
            v-model="editingContent"
            class="memo-edit-input"
            @blur="saveEdit(memo.id)"
            @keydown.enter="saveEdit(memo.id)"
            @keydown.esc="cancelEdit"
            ref="editInputRef"
          />
          <div
            v-else
            class="memo-content"
            :class="{ completed: memo.status === 'completed' }"
          >
            {{ memo.content }}
          </div>
          <div class="memo-footer">
            <div class="memo-footer-left">
              <span class="memo-time">{{ formatTime(memo.createdAt) }}</span>
              <span class="priority-tag" :class="`priority-${memo.priority || 'medium'}`">
                {{ getPriorityLabel(memo.priority) }}
              </span>
            </div>
            <div class="memo-actions">
              <button class="icon-btn-sm" @click="handleEdit(memo)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button class="icon-btn-sm" @click="cyclePriority(memo)" :title="getStatusText(memo.status)">
                <svg v-if="memo.status === 'completed'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                </svg>
              </button>
              <button class="icon-btn-sm" @click="memoStore.togglePin(memo.id)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--surface-secondary)">
                  <path d="M12 17v5m-7-5l7-7 7 7M5 10V8a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v2"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </template>

      <!-- Empty State -->
      <div v-if="memoStore.memos.length === 0" class="empty-state">
        <p>还没有备忘录</p>
        <p>在上方输入框快速创建一条吧</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, computed } from 'vue'
import { useMemoStore } from '@/stores/memoStore'
import type { Memo } from '@/types/models'

const memoStore = useMemoStore()
const newMemoContent = ref('')
const newMemoPriority = ref<'low' | 'medium' | 'high' | 'urgent'>('medium')
const textareaRef = ref<HTMLTextAreaElement>()
const editingMemoId = ref<string | null>(null)
const editingContent = ref('')
const sortBy = ref<'time' | 'priority'>('time')

const priorities = [
  { value: 'low' as const, label: '低', color: '#6B6B6B' },
  { value: 'medium' as const, label: '中', color: '#3b82f6' },
  { value: 'high' as const, label: '高', color: '#f59e0b' },
  { value: 'urgent' as const, label: '紧急', color: '#ef4444' }
]

// 优先级权重映射
const priorityWeight = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1
}

// 排序函数
function sortMemos(memos: Memo[]) {
  if (sortBy.value === 'time') {
    // 按时间排序（最新的在前）
    return [...memos].sort((a, b) => b.createdAt - a.createdAt)
  } else {
    // 按优先级排序（优先级高的在前，相同优先级按时间排序）
    return [...memos].sort((a, b) => {
      const priorityA = priorityWeight[a.priority || 'medium']
      const priorityB = priorityWeight[b.priority || 'medium']

      if (priorityA !== priorityB) {
        return priorityB - priorityA
      }

      // 优先级相同，按时间排序
      return b.createdAt - a.createdAt
    })
  }
}

// 排序后的置顶备忘录
const sortedPinnedMemos = computed(() => sortMemos(memoStore.pinnedMemos))

// 排序后的普通备忘录
const sortedNormalMemos = computed(() => sortMemos(memoStore.normalMemos))

async function handleCreate() {
  const content = newMemoContent.value.trim()
  if (!content) return

  await memoStore.createMemo(content, newMemoPriority.value)
  newMemoContent.value = ''
  newMemoPriority.value = 'medium'
  if (textareaRef.value) {
    textareaRef.value.style.height = 'auto'
  }
}

async function handleEdit(memo: Memo) {
  editingMemoId.value = memo.id
  editingContent.value = memo.content
  // 在下一个tick自动聚焦input
  await nextTick()
  const inputs = document.querySelectorAll('.memo-edit-input')
  const input = inputs[0] as HTMLInputElement
  if (input) {
    input.focus()
    // 将光标移动到末尾
    const length = input.value.length
    input.setSelectionRange(length, length)
  }
}

async function saveEdit(memoId: string) {
  const trimmedContent = editingContent.value.trim()
  const originalMemo = memoStore.memos.find(m => m.id === memoId)

  if (trimmedContent && originalMemo && trimmedContent !== originalMemo.content) {
    await memoStore.updateMemo(memoId, { content: trimmedContent })
  }

  editingMemoId.value = null
  editingContent.value = ''
}

function cancelEdit() {
  editingMemoId.value = null
  editingContent.value = ''
}

function cyclePriority(memo: Memo) {
  const currentStatus = memo.status || 'todo'
  const nextStatus = currentStatus === 'todo' ? 'completed' : 'todo'

  memoStore.updateMemo(memo.id, { status: nextStatus })
}

function getStatusText(status?: 'todo' | 'completed') {
  return status === 'completed' ? '已完成' : '待办'
}

function autoResize(event: Event) {
  const textarea = event.target as HTMLTextAreaElement
  textarea.style.height = 'auto'
  textarea.style.height = Math.min(textarea.scrollHeight, 72) + 'px'
}

function getPriorityLabel(priority?: string) {
  const p = priorities.find(item => item.value === priority)
  return p?.label || '中'
}

function formatTime(timestamp: number) {
  const now = Date.now()
  const diff = now - timestamp
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour

  if (diff < hour) {
    return Math.floor(diff / minute) + '分钟前'
  } else if (diff < day) {
    return Math.floor(diff / hour) + '小时前'
  } else if (diff < 7 * day) {
    return Math.floor(diff / day) + '天前'
  } else {
    return new Date(timestamp).toLocaleDateString()
  }
}
</script>

<style scoped>
.memo-section {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.input-area {
  padding: 0 16px;
  margin-bottom: 0;
}

.sort-area {
  padding: 0 16px 12px;
  margin-top: 12px;
  display: flex;
  justify-content: flex-start;
}

.sort-group {
  display: flex;
  gap: 4px;
  background: white;
  border-radius: 10px;
  padding: 3px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  width: 328px;
}

.sort-btn {
  flex: 1;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  background: transparent;
  color: #6B6B6B;
}

.sort-btn.active {
  background: #D4916E;
  color: white;
}

.sort-btn:hover {
  opacity: 0.8;
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

.priority-selector {
  display: flex;
  gap: 6px;
}

.priority-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 6px 8px;
  border-radius: var(--radius-lg);
  font-size: 12px;
  color: var(--foreground-secondary);
  background: var(--surface-primary);
  border: 1.5px solid transparent;
  transition: all 0.2s;
}

.priority-btn:hover {
  background: #E8DFD3;
}

.priority-btn.active {
  border-color: var(--accent-primary);
  background: white;
  color: var(--foreground-primary);
  font-weight: 500;
}

.priority-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.memo-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--foreground-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.memo-card {
  background: white;
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-sm);
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  animation: fadeIn 0.2s ease-out;
  transition: all 0.2s;
}

.memo-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
}

.memo-card.pinned {
  background: linear-gradient(135deg, #F8F3ED 0%, #F0E9DD 100%);
  border: 1.5px solid #E8DFD3;
}

.memo-content {
  font-size: 14px;
  line-height: 1.5;
  color: var(--foreground-primary);
  word-wrap: break-word;
  transition: all 0.2s;
}

.memo-content.completed {
  text-decoration: line-through;
  color: var(--foreground-muted);
  opacity: 0.6;
}

.memo-edit-input {
  width: 100%;
  font-size: 14px;
  line-height: 1.5;
  color: var(--foreground-primary);
  padding: 4px 8px;
  border: 2px solid var(--accent-primary);
  border-radius: var(--radius-lg);
  background: white;
  outline: none;
  transition: all 0.2s;
}

.memo-edit-input:focus {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px rgba(212, 145, 110, 0.1);
}

.memo-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.memo-footer-left {
  display: flex;
  gap: 8px;
  align-items: center;
}

.memo-time {
  font-size: 11px;
  color: var(--foreground-muted);
}

.priority-tag {
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-size: 10px;
  font-weight: 500;
}

.priority-tag.priority-urgent {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.priority-tag.priority-high {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

.priority-tag.priority-medium {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.priority-tag.priority-low {
  background: rgba(107, 107, 107, 0.1);
  color: #6B6B6B;
}

.memo-actions {
  display: flex;
  gap: 6px;
}

.icon-btn-sm {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-lg);
  color: var(--foreground-muted);
  transition: all 0.2s;
}

.icon-btn-sm:hover {
  background: var(--surface-primary);
  color: var(--foreground-primary);
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--foreground-muted);
  text-align: center;
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
