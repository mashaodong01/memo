<template>
  <div class="history-section">
    <!-- History List -->
    <div class="history-list">
      <template v-if="memoStore.completedMemos.length > 0">
        <div class="section-label">已完成 ({{ memoStore.completedMemos.length }})</div>
        <div class="history-card" v-for="memo in memoStore.completedMemos" :key="memo.id">
          <div class="memo-content completed">
            {{ memo.content }}
          </div>
          <div class="memo-footer">
            <div class="memo-footer-left">
              <span class="memo-time">{{ formatTime(memo.updatedAt) }}</span>
              <span class="priority-tag" :class="`priority-${memo.priority || 'medium'}`">
                {{ getPriorityLabel(memo.priority) }}
              </span>
            </div>
            <div class="memo-actions">
              <button class="icon-btn-sm" @click="restoreMemo(memo.id)" title="恢复到待办">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                  <path d="M21 3v5h-5"/>
                </svg>
              </button>
              <button class="icon-btn-sm delete-btn" @click="confirmDelete(memo)" title="删除">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </template>

      <!-- Empty State -->
      <div v-else class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M9 11l3 3L22 4"/>
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
        </svg>
        <p>还没有完成的备忘录</p>
        <p>完成的备忘录会出现在这里</p>
      </div>
    </div>

    <!-- Delete Confirmation Dialog -->
    <div class="dialog-overlay" v-if="showDeleteDialog" @click="showDeleteDialog = false">
      <div class="dialog-content" @click.stop>
        <div class="dialog-header">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="16" x2="12" y2="12"/>
            <line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
          <h3>确认删除</h3>
        </div>
        <div class="dialog-body">
          <p>确定要永久删除这条备忘录吗？</p>
          <div class="memo-preview">{{ pendingDeleteContent }}</div>
        </div>
        <div class="dialog-footer">
          <button class="dialog-btn dialog-btn-cancel" @click="showDeleteDialog = false">
            取消
          </button>
          <button class="dialog-btn dialog-btn-delete" @click="executeDelete">
            删除
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useMemoStore } from '@/stores/memoStore'

const memoStore = useMemoStore()
const showDeleteDialog = ref(false)
const pendingDeleteId = ref<string | null>(null)
const pendingDeleteContent = ref('')

const priorities = [
  { value: 'low' as const, label: '低', color: '#6B6B6B' },
  { value: 'medium' as const, label: '中', color: '#3b82f6' },
  { value: 'high' as const, label: '高', color: '#f59e0b' },
  { value: 'urgent' as const, label: '紧急', color: '#ef4444' }
]

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

async function restoreMemo(id: string) {
  await memoStore.updateMemo(id, { status: 'todo' })
}

function confirmDelete(memo: any) {
  pendingDeleteId.value = memo.id
  pendingDeleteContent.value = memo.content
  showDeleteDialog.value = true
}

async function executeDelete() {
  if (pendingDeleteId.value) {
    await memoStore.deleteMemo(pendingDeleteId.value)
    showDeleteDialog.value = false
    pendingDeleteId.value = null
    pendingDeleteContent.value = ''
  }
}
</script>

<style scoped>
.history-section {
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
}

.history-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
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

.history-card {
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

.history-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
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

/* Dialog Styles */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  animation: fadeIn 0.2s ease-out;
}

.dialog-content {
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  width: 90%;
  max-width: 360px;
  animation: slideUp 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.dialog-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px 20px 16px;
  border-bottom: 1px solid #E8DFD3;
}

.dialog-header svg {
  color: #ef4444;
  flex-shrink: 0;
}

.dialog-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: var(--foreground-primary);
  margin: 0;
}

.dialog-body {
  padding: 20px;
}

.dialog-body p {
  font-size: 14px;
  color: var(--foreground-secondary);
  margin: 0 0 12px;
  line-height: 1.5;
}

.memo-preview {
  background: var(--surface-primary);
  padding: 12px;
  border-radius: 10px;
  font-size: 13px;
  color: var(--foreground-primary);
  line-height: 1.5;
  max-height: 80px;
  overflow-y: auto;
  word-wrap: break-word;
}

.dialog-footer {
  display: flex;
  gap: 10px;
  padding: 16px 20px 20px;
}

.dialog-btn {
  flex: 1;
  padding: 10px 20px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.dialog-btn-cancel {
  background: var(--surface-primary);
  color: var(--foreground-secondary);
}

.dialog-btn-cancel:hover {
  background: #E8DFD3;
}

.dialog-btn-delete {
  background: #ef4444;
  color: white;
}

.dialog-btn-delete:hover {
  background: #dc2626;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
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

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
