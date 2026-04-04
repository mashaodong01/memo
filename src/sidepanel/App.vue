<template>
  <div class="app">
    <!-- Header -->
    <header class="header">
      <div class="tabs">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="tab"
          :class="{ active: currentTab === tab.id }"
          @click="currentTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </div>
      <button class="icon-btn">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="3"/>
          <path d="M12 1v6m0 6v6m9-9h-6m-6 0H3"/>
        </svg>
      </button>
    </header>

    <!-- Content -->
    <main class="content">
      <MemoSection v-if="currentTab === 'memo'" />
      <StatsSection v-if="currentTab === 'stats'" />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import MemoSection from '@/components/MemoSection/MemoList.vue'
import StatsSection from '@/components/StatsSection/StatsOverview.vue'
import { useMemoStore } from '@/stores/memoStore'
import { db } from '@/utils/indexedDB'

const currentTab = ref('memo')

const tabs = [
  { id: 'memo', label: '备忘录' },
  { id: 'stats', label: '统计' }
]

const memoStore = useMemoStore()

onMounted(async () => {
  try {
    console.log('[App] Initializing database...')
    // 初始化数据库
    await db.init()
    console.log('[App] Database initialized successfully')

    // 加载数据
    console.log('[App] Loading memos...')
    await memoStore.loadMemos()
    console.log('[App] Data loaded successfully')

    // 暴露调试工具到全局
    ;(window as any).__DEBUG__ = {
      db,
      memoStore,
      async checkDB() {
        const memoCount = await db.table('memos').count()
        console.log('Database status:', { memoCount })
        return { memoCount }
      },
      async addTestMemo() {
        const content = '测试备忘录 ' + new Date().toLocaleString()
        return await memoStore.createMemo(content, 'medium')
      },
      async clearAll() {
        await db.clearAll()
        console.log('Database cleared')
        await memoStore.loadMemos()
      }
    }
    console.log('[App] Debug tools available: window.__DEBUG__')
  } catch (error) {
    console.error('[App] Failed to initialize:', error)
  }
})
</script>

<style scoped>
.app {
  width: 360px;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--surface-primary);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 16px 12px;
  gap: 8px;
}

.tabs {
  display: flex;
  gap: 4px;
}

.tab {
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: var(--foreground-muted);
  transition: all 0.2s;
}

.tab.active {
  background: var(--surface-inverse);
  color: var(--foreground-inverse);
}

.tab:not(.active):hover {
  background: var(--surface-secondary);
}

.content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}
</style>
