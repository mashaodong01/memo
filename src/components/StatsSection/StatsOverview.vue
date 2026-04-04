<template>
  <div class="stats-section">
    <!-- Stats Grid -->
    <div class="stats-grid">
      <div class="stats-col">
        <div class="stat-card">
          <div class="stat-label">总备忘录</div>
          <div class="stat-value">{{ memoStore.stats.total }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">待办中</div>
          <div class="stat-value" style="color: var(--accent-primary)">
            {{ memoStore.stats.todo }}
          </div>
        </div>
      </div>
      <div class="stats-col">
        <div class="stat-card">
          <div class="stat-label">已完成</div>
          <div class="stat-value" style="color: var(--success-color)">
            {{ memoStore.stats.completed }}
          </div>
        </div>
        <div class="stat-card highlight">
          <div class="stat-label">完成率</div>
          <div class="stat-value">{{ memoStore.stats.completionRate }}%</div>
        </div>
      </div>
    </div>

    <!-- Status Distribution Chart -->
    <div class="chart-card">
      <div class="chart-title">备忘录状态分布</div>
      <div class="donut-container">
        <div class="donut-chart">
          <svg width="100" height="100" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              :stroke="completedColor"
              stroke-width="20"
              :stroke-dasharray="completedArc + ' ' + (251.2 - completedArc)"
              transform="rotate(-90 50 50)"
            />
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              :stroke="todoColor"
              stroke-width="20"
              :stroke-dasharray="todoArc + ' ' + (251.2 - todoArc)"
              :transform="`rotate(${completedDeg - 90} 50 50)`"
            />
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              :stroke="pinnedColor"
              stroke-width="20"
              :stroke-dasharray="pinnedArc + ' ' + (251.2 - pinnedArc)"
              :transform="`rotate(${completedDeg + todoDeg - 90} 50 50)`"
            />
          </svg>
          <div class="donut-center">{{ memoStore.stats.total }}</div>
        </div>
      </div>
      <div class="chart-legend">
        <div class="legend-item">
          <div class="legend-dot" :style="{ background: completedColor }"></div>
          <div class="legend-text">已完成 ({{ memoStore.stats.completed }})</div>
        </div>
        <div class="legend-item">
          <div class="legend-dot" :style="{ background: todoColor }"></div>
          <div class="legend-text">待办中 ({{ memoStore.stats.todo }})</div>
        </div>
        <div class="legend-item">
          <div class="legend-dot" :style="{ background: pinnedColor }"></div>
          <div class="legend-text">置顶 ({{ memoStore.stats.pinned }})</div>
        </div>
      </div>
    </div>

    <!-- Priority Distribution Chart -->
    <div class="chart-card">
      <div class="chart-title">优先级分布</div>
      <div class="bar-chart">
        <div class="bar-row">
          <div class="bar-label">紧急</div>
          <div class="bar-track">
            <div
              class="bar-fill"
              :style="{
                width: getBarWidth(memoStore.memosByPriority.urgent),
                background: '#ef4444'
              }"
            >
              <span>{{ memoStore.memosByPriority.urgent }}</span>
            </div>
          </div>
        </div>
        <div class="bar-row">
          <div class="bar-label">高</div>
          <div class="bar-track">
            <div
              class="bar-fill"
              :style="{
                width: getBarWidth(memoStore.memosByPriority.high),
                background: '#f59e0b'
              }"
            >
              <span>{{ memoStore.memosByPriority.high }}</span>
            </div>
          </div>
        </div>
        <div class="bar-row">
          <div class="bar-label">中</div>
          <div class="bar-track">
            <div
              class="bar-fill"
              :style="{
                width: getBarWidth(memoStore.memosByPriority.medium),
                background: '#3b82f6'
              }"
            >
              <span>{{ memoStore.memosByPriority.medium }}</span>
            </div>
          </div>
        </div>
        <div class="bar-row">
          <div class="bar-label">低</div>
          <div class="bar-track">
            <div
              class="bar-fill"
              :style="{
                width: getBarWidth(memoStore.memosByPriority.low),
                background: '#6B6B6B'
              }"
            >
              <span>{{ memoStore.memosByPriority.low }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useMemoStore } from '@/stores/memoStore'

const memoStore = useMemoStore()

const completedColor = '#10b981'
const todoColor = '#D4916E'
const pinnedColor = '#6B6B6B'

const completedPercent = computed(() => {
  return memoStore.stats.total > 0
    ? memoStore.stats.completed / memoStore.stats.total
    : 0
})

const todoPercent = computed(() => {
  return memoStore.stats.total > 0
    ? memoStore.stats.todo / memoStore.stats.total
    : 0
})

const pinnedPercent = computed(() => {
  return memoStore.stats.total > 0
    ? memoStore.stats.pinned / memoStore.stats.total
    : 0
})

const completedDeg = computed(() => completedPercent.value * 360)
const todoDeg = computed(() => todoPercent.value * 360)

const completedArc = computed(() => (completedPercent.value * 251.2))
const todoArc = computed(() => (todoPercent.value * 251.2))
const pinnedArc = computed(() => (pinnedPercent.value * 251.2))

function getBarWidth(count: number) {
  if (memoStore.stats.total === 0) return '0%'
  const maxCount = Math.max(
    memoStore.memosByPriority.urgent,
    memoStore.memosByPriority.high,
    memoStore.memosByPriority.medium,
    memoStore.memosByPriority.low
  )
  return count === 0 ? '0%' : Math.max((count / maxCount) * 80, 15) + '%'
}
</script>

<style scoped>
.stats-section {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
}

.stats-grid {
  display: flex;
  gap: 12px;
}

.stats-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stat-card {
  background: white;
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-sm);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-card.highlight {
  background: var(--surface-secondary);
}

.stat-label {
  font-size: 12px;
  color: var(--foreground-muted);
}

.stat-card.highlight .stat-label {
  color: var(--foreground-secondary);
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  font-family: 'Geist Mono', monospace;
  color: var(--foreground-primary);
}

.chart-card {
  background: white;
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-sm);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chart-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--foreground-primary);
}

.donut-container {
  display: flex;
  justify-content: flex-start;
  padding: 20px 0;
}

.donut-chart {
  position: relative;
  width: 100px;
  height: 100px;
}

.donut-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 24px;
  font-weight: 600;
  font-family: 'Geist Mono', monospace;
  color: var(--foreground-primary);
}

.chart-legend {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.legend-text {
  font-size: 12px;
  color: var(--foreground-secondary);
}

.bar-chart {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.bar-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.bar-label {
  width: 50px;
  font-size: 13px;
  color: var(--foreground-secondary);
}

.bar-track {
  flex: 1;
  height: 28px;
  background: var(--surface-primary);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  color: white;
  transition: width 0.3s ease;
}
</style>
