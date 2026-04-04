# Chrome 扩展开发计划：备忘录 & 任务管理

## 背景与目标

### 项目背景
用户希望开发一个 Chrome 浏览器扩展，提供备忘录和任务管理功能。该项目将在空白的 `memo` 目录中从零开始构建，但可以复用同级目录下现有的 `task-flow` 项目（一个功能完整的 Vue 3 任务管理应用）的代码和架构。

### 用户需求
1. **快速记录文本备忘** - 轻量级的文本输入和列表展示
2. **完整任务管理（待办事项）** - 包含状态、优先级、标签、截止日期等功能
3. **数据统计和可视化** - 图表展示任务完成情况和趋势分析
4. **界面形式** - 侧边栏 Sidebar（固定在浏览器侧边，可边浏览边使用）

### 技术约束
- 必须使用 Manifest V3（Chrome 扩展最新标准）
- 使用 Side Panel API（Chrome 114+）
- 侧边栏尺寸：固定宽度 360px，高度跟随浏览器窗口
- 数据需要本地持久化存储
- 扩展需要能够打包并加载到 Chrome

---

## 技术方案

### 技术栈选择
- **框架**: Vue 3 + TypeScript + Composition API
- **构建工具**: Vite 5
- **状态管理**: Pinia
- **数据存储**: IndexedDB（主）+ Chrome Storage API（配置项）
- **数据可视化**: Chart.js + vue-chartjs
- **样式方案**: CSS + CSS Variables（主题化）

**选择理由**：
- Vue 3 的响应式系统适合复杂的任务管理逻辑
- 可以直接复用 task-flow 项目的 70% 代码（IndexedDB 封装、Store、图表组件）
- Vite 构建优化后体积可控（预计 150KB gzip 后）
- TypeScript 提供类型安全保障

### 项目结构
```
memo/
├── public/
│   ├── icons/                    # 扩展图标
│   │   ├── icon-16.png
│   │   ├── icon-48.png
│   │   └── icon-128.png
│   └── manifest.json             # Manifest V3 配置
├── src/
│   ├── sidepanel/
│   │   ├── index.html           # Sidebar HTML 模板
│   │   ├── main.ts              # 入口文件
│   │   └── App.vue              # 主界面（标签页容器）
│   ├── components/
│   │   ├── MemoSection/         # 备忘录模块
│   │   │   ├── MemoList.vue
│   │   │   └── MemoInput.vue
│   │   ├── TaskSection/         # 任务管理模块
│   │   │   ├── TaskList.vue
│   │   │   ├── TaskItem.vue
│   │   │   └── TaskForm.vue
│   │   └── StatsSection/        # 数据统计模块
│   │       ├── StatsOverview.vue
│   │       └── TaskStatusChart.vue
│   ├── stores/
│   │   ├── memoStore.ts         # 备忘录 Store
│   │   └── taskStore.ts         # 任务 Store（复用）
│   ├── utils/
│   │   └── indexedDB/           # IndexedDB 封装（复用）
│   │       ├── config.ts        # 数据库配置
│   │       ├── core.ts
│   │       ├── database.ts
│   │       ├── helpers.ts
│   │       ├── index.ts
│   │       ├── queryBuilder.ts
│   │       └── types.ts
│   ├── assets/
│   │   └── styles/
│   │       └── main.css         # 全局样式
│   └── types/
│       └── models.ts            # 数据模型
├── vite.config.ts               # Vite 配置（Chrome 扩展优化）
├── tsconfig.json
├── package.json
└── README.md
```

### 数据模型设计

**任务模型（Task）** - 从 task-flow 复用：
```typescript
interface Task {
  id: string
  title: string
  description?: string
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  tags?: string[]
  dueDate?: number
  createdAt: number
  updatedAt: number
  completedAt?: number
}
```

**备忘录模型（Memo）** - 新增：
```typescript
interface Memo {
  id: string
  content: string
  createdAt: number
  updatedAt: number
  isPinned?: boolean    // 置顶标记
  color?: string        // 颜色标签（可选）
}
```

**IndexedDB 数据库配置**：
- 数据库名：`MemoExtensionDB`
- 版本：1
- 数据表：
  - `tasks` - 索引：status, priority, createdAt, dueDate
  - `memos` - 索引：createdAt, isPinned

### UI 设计方案

**侧边栏三标签页布局**（360px 宽 × 浏览器窗口高度）：
1. **备忘录页** - 顶部快速输入框 + 备忘录列表（支持置顶、删除）
2. **任务管理页** - 筛选器（状态/优先级）+ 任务列表 + 底部新建按钮
3. **数据统计页** - 概览卡片（2x2 网格）+ 图表区域（可滚动）

**关键设计点**：
- 固定宽度 360px，高度 100vh（跟随浏览器窗口）
- 侧边栏可保持打开，支持边浏览边使用
- 内容区域可滚动（避免布局抖动）
- 使用 CSS Variables 实现主题化
- 图表使用紧凑布局（甜甜圈图、水平柱状图）

---

## 实施步骤

### 阶段 1: 项目初始化（1 小时）

**目标**：搭建基础项目结构，配置构建工具

1. 在 `memo` 目录初始化 Vite + Vue 3 + TypeScript 项目
2. 安装依赖：
   ```bash
   npm install vue pinia chart.js vue-chartjs
   npm install -D @vitejs/plugin-vue typescript
   ```
3. 配置 `vite.config.ts`：
   - 设置 `rollupOptions.input` 指向 `src/sidepanel/index.html`
   - 配置输出路径和文件名（避免 hash）
   - 禁用代码分割（Chrome 扩展不支持动态 import）
   - 添加别名 `@` 指向 `src` 目录
4. 创建 `public/manifest.json`（Manifest V3）：
   - 配置 `side_panel.default_path` 指向打包后的 sidepanel/index.html
   - 添加 `sidePanel` 和 `storage` 权限
   - 准备图标文件（16x16, 48x48, 128x128）
5. 创建基础目录结构（按上述项目结构）

**关键文件**：
- `/Users/mashaodong/Desktop/hytech/mycode/memo/vite.config.ts`
- `/Users/mashaodong/Desktop/hytech/mycode/memo/public/manifest.json`
- `/Users/mashaodong/Desktop/hytech/mycode/memo/package.json`

---

### 阶段 2: 复用 IndexedDB 封装（30 分钟）

**目标**：将 task-flow 的 IndexedDB 封装移植到新项目

1. 完整复制 task-flow 的 `src/utils/indexedDB/` 目录到 memo 项目
   - 源路径：`/Users/mashaodong/Desktop/hytech/mycode/task-flow/src/utils/indexedDB/`
   - 目标路径：`/Users/mashaodong/Desktop/hytech/mycode/memo/src/utils/indexedDB/`

2. 修改 `config.ts` 文件：
   - 将数据库名从 `TaskFlowDB` 改为 `MemoExtensionDB`
   - 移除不需要的表：`users`, `projects`, `tags`, `settings`
   - 添加 `memos` 表配置：
     ```typescript
     {
       name: 'memos',
       keyPath: 'id',
       autoIncrement: false,
       indexes: [
         { name: 'createdAt', keyPath: 'createdAt', options: { unique: false } },
         { name: 'isPinned', keyPath: 'isPinned', options: { unique: false } }
       ]
     }
     ```
   - 添加 Memo 接口定义

3. 测试数据库初始化（在 main.ts 中调用）

**关键文件**：
- `/Users/mashaodong/Desktop/hytech/mycode/memo/src/utils/indexedDB/config.ts`（需修改）
- 其他 IndexedDB 文件直接复制，无需修改

---

### 阶段 3: 实现备忘录功能（2 小时）

**目标**：完成备忘录的 CRUD 和 UI

1. 创建 `stores/memoStore.ts`（参考 taskStore 的结构）：
   - 状态：`memos: Ref<Memo[]>`
   - 方法：`createMemo`, `updateMemo`, `deleteMemo`, `loadMemos`
   - 计算属性：`pinnedMemos`, `normalMemos`
   - 搜索方法：`searchMemos`

2. 创建 `components/MemoSection/MemoInput.vue`：
   - 文本输入框（自动扩展高度，max 3 行）
   - 右侧发送按钮
   - 按 Enter 快速提交（Shift+Enter 换行）

3. 创建 `components/MemoSection/MemoList.vue`：
   - 置顶备忘录区域（带标记）
   - 普通备忘录列表
   - 每项支持：查看、编辑、置顶/取消置顶、删除
   - 空状态提示

4. 集成到 App.vue 的第一个标签页

**关键文件**：
- `/Users/mashaodong/Desktop/hytech/mycode/memo/src/stores/memoStore.ts`
- `/Users/mashaodong/Desktop/hytech/mycode/memo/src/components/MemoSection/MemoInput.vue`
- `/Users/mashaodong/Desktop/hytech/mycode/memo/src/components/MemoSection/MemoList.vue`

---

### 阶段 4: 移植任务管理功能（2 小时）

**目标**：将 task-flow 的任务管理功能适配到 侧边栏界面

1. 复用 `stores/taskStore.ts`（从 task-flow）：
   - 源文件：`/Users/mashaodong/Desktop/hytech/mycode/task-flow/src/stores/taskStore.ts`
   - 移除不需要的字段：`projectId`, `assigneeId`
   - 保留所有 CRUD 方法和查询方法

2. 创建 `components/TaskSection/TaskList.vue`：
   - 顶部筛选器（状态下拉 + 优先级下拉）
   - 任务列表（虚拟滚动，优化性能）
   - 每项显示：标题、状态、优先级、截止日期
   - 点击展开查看详情/编辑

3. 创建 `components/TaskSection/TaskItem.vue`：
   - 折叠状态：显示标题 + 状态徽章 + 优先级图标
   - 展开状态：显示完整信息 + 操作按钮
   - 快速操作：更改状态、删除

4. 创建 `components/TaskSection/TaskForm.vue`（模态框）：
   - 表单字段：标题、描述、状态、优先级、标签、截止日期
   - 新建和编辑模式共用
   - 验证：标题必填

5. 集成到 侧边栏.vue 的第二个标签页

**关键文件**：
- `/Users/mashaodong/Desktop/hytech/mycode/memo/src/stores/taskStore.ts`（复用并简化）
- `/Users/mashaodong/Desktop/hytech/mycode/memo/src/components/TaskSection/TaskList.vue`
- `/Users/mashaodong/Desktop/hytech/mycode/memo/src/components/TaskSection/TaskItem.vue`
- `/Users/mashaodong/Desktop/hytech/mycode/memo/src/components/TaskSection/TaskForm.vue`

---

### 阶段 5: 实现数据统计和可视化（3 小时）

**目标**：展示任务完成情况和趋势分析

1. 创建 `components/StatsSection/StatsOverview.vue`：
   - 4 个统计卡片（2x2 网格）：
     - 总任务数
     - 已完成任务数
     - 进行中任务数
     - 完成率百分比
   - 每个卡片带图标和颜色区分

2. 复用并改造图表组件（从 task-flow）：
   - 源路径：`/Users/mashaodong/Desktop/hytech/mycode/task-flow/src/components/Dashboard/charts/`
   - `TaskStatusChart.vue` → 任务状态分布图（甜甜圈图）
     - 调整尺寸适应 360px 宽度
     - 减小字体大小
     - 图例放置在图表下方
   - `TaskPriorityChart.vue` → 优先级分布图（柱状图）
     - 水平方向展示
     - 简化配置

3. 配置 Chart.js 按需导入（减小体积）：
   ```typescript
   import {
     Chart as ChartJS,
     ArcElement,      // 甜甜圈图
     BarElement,      // 柱状图
     CategoryScale,   // X 轴
     LinearScale,     // Y 轴
     Tooltip,
     Legend
   } from 'chart.js'
   ```

4. 实现趋势分析（可选）：
   - 按周统计完成率
   - 使用折线图展示
   - 懒加载（点击"查看趋势"按钮时才加载）

5. 集成到 侧边栏.vue 的第三个标签页

**关键文件**：
- `/Users/mashaodong/Desktop/hytech/mycode/memo/src/components/StatsSection/StatsOverview.vue`
- `/Users/mashaodong/Desktop/hytech/mycode/memo/src/components/StatsSection/TaskStatusChart.vue`（复用并改造）
- `/Users/mashaodong/Desktop/hytech/mycode/memo/src/components/StatsSection/TaskPriorityChart.vue`（复用并改造）

---

### 阶段 6: 集成主界面与样式优化（2 小时）

**目标**：完成 侧边栏 主界面集成，统一样式和交互

1. 创建 `sidepanel/App.vue`：
   - Header 区域（40px）：
     - 三个标签按钮：备忘录、任务管理、数据统计
     - 右侧设置图标（预留）
   - Content 区域（560px，可滚动）：
     - 根据选中标签动态切换组件
     - 使用 Vue 的 `<component :is="">` 动态组件

2. 创建 `sidepanel/main.ts`：
   - 初始化 Vue 应用
   - 注册 Pinia
   - 初始化 IndexedDB 连接
   - 挂载到 DOM

3. 创建 `sidepanel/index.html`：
   - 基础 HTML 结构
   - 引入 main.ts
   - 设置固定尺寸（360px 宽 × 100vh 高）

4. 创建全局样式 `assets/styles/main.css`：
   - CSS Variables（主题色）：
     ```css
     :root {
       --primary-color: #3b82f6;
       --success-color: #10b981;
       --warning-color: #f59e0b;
       --danger-color: #ef4444;
       --bg-color: #ffffff;
       --text-color: #1f2937;
     }
     ```
   - 重置样式
   - 通用组件样式（按钮、输入框、卡片、徽章）
   - 滚动条样式

5. 响应式优化：
   - 确保所有文本可读（最小字号 12px）
   - 按钮触摸区域足够大（最小 32x32px）
   - 列表项间距合理（避免误触）

**关键文件**：
- `/Users/mashaodong/Desktop/hytech/mycode/memo/src/sidepanel/App.vue`
- `/Users/mashaodong/Desktop/hytech/mycode/memo/src/sidepanel/main.ts`
- `/Users/mashaodong/Desktop/hytech/mycode/memo/src/sidepanel/index.html`
- `/Users/mashaodong/Desktop/hytech/mycode/memo/src/assets/styles/main.css`

---

### 阶段 7: 构建、测试与打包（1 小时）

**目标**：构建扩展，测试功能，准备发布

1. 完善 `package.json` 脚本：
   ```json
   {
     "scripts": {
       "dev": "vite",
       "build": "vue-tsc && vite build",
       "preview": "vite preview"
     }
   }
   ```

2. 执行构建：
   ```bash
   npm run build
   ```
   验证生成的 `dist` 目录结构：
   ```
   dist/
   ├── popup/
   │   └── index.html
   ├── assets/
   │   ├── popup.js
   │   ├── main.css
   │   └── vendor.js
   ├── icons/
   │   ├── icon-16.png
   │   ├── icon-48.png
   │   └── icon-128.png
   └── manifest.json
   ```

3. 加载到 Chrome 进行测试：
   - 打开 `chrome://extensions/`
   - 开启"开发者模式"
   - 点击"加载已解压的扩展程序"
   - 选择 `dist` 目录

4. 功能测试清单：
   - [ ] 备忘录 CRUD（创建、查看、编辑、删除）
   - [ ] 备忘录置顶功能
   - [ ] 任务 CRUD（创建、查看、编辑、删除）
   - [ ] 任务状态切换（pending → in-progress → completed）
   - [ ] 任务筛选（按状态、优先级）
   - [ ] 数据统计卡片显示正确
   - [ ] 图表渲染正确（状态分布、优先级分布）
   - [ ] 数据持久化（关闭 侧边栏 后重新打开，数据仍存在）
   - [ ] 搜索功能（备忘录和任务）

5. 性能优化检查：
   - 检查打包体积（目标 < 300KB gzip）
   - 检查首次加载时间（目标 < 1 秒）
   - 检查内存占用（侧边栏 打开时）

6. 准备图标：
   - 设计或使用图标生成工具创建 16x16, 48x48, 128x128 三种尺寸
   - 建议使用记事本/清单主题的图标

---

## 数据验证方案

### 端到端测试场景

**场景 1: 备忘录基础流程**
1. 打开扩展 侧边栏
2. 在备忘录标签页输入"买牛奶"并提交
3. 验证备忘录出现在列表中
4. 点击置顶按钮，验证备忘录移到置顶区域
5. 编辑备忘录内容为"买牛奶和面包"
6. 删除备忘录，验证从列表中移除
7. 关闭并重新打开 侧边栏，验证数据持久化

**场景 2: 任务管理流程**
1. 切换到任务管理标签页
2. 点击"新建任务"按钮
3. 填写任务信息：
   - 标题："完成项目报告"
   - 优先级：高
   - 状态：进行中
   - 截止日期：明天
4. 保存任务，验证出现在列表中
5. 点击任务项，展开查看详情
6. 更改状态为"已完成"
7. 使用筛选器，选择"已完成"，验证只显示已完成任务
8. 关闭并重新打开 侧边栏，验证任务数据仍存在

**场景 3: 数据统计**
1. 创建多个任务（不同状态和优先级）
2. 切换到数据统计标签页
3. 验证统计卡片数据正确：
   - 总任务数 = 创建的任务数量
   - 已完成任务数正确
   - 完成率百分比正确计算
4. 验证状态分布图显示正确的比例
5. 验证优先级分布图显示正确的数量

### 数据库验证
使用 Chrome DevTools 验证 IndexedDB：
1. 打开 Chrome DevTools → Application → IndexedDB
2. 检查数据库名：`MemoExtensionDB`
3. 检查数据表：`tasks`, `memos`
4. 验证数据结构与模型定义一致
5. 验证索引创建成功（status, priority, createdAt, dueDate, isPinned）

---

## 关键文件清单

### 必须创建的文件（按优先级排序）

**第一优先级（项目基础）**：
1. `/Users/mashaodong/Desktop/hytech/mycode/memo/package.json` - 项目配置和依赖
2. `/Users/mashaodong/Desktop/hytech/mycode/memo/vite.config.ts` - Vite 构建配置
3. `/Users/mashaodong/Desktop/hytech/mycode/memo/tsconfig.json` - TypeScript 配置
4. `/Users/mashaodong/Desktop/hytech/mycode/memo/public/manifest.json` - Chrome 扩展清单

**第二优先级（数据层）**：
5. `/Users/mashaodong/Desktop/hytech/mycode/memo/src/utils/indexedDB/config.ts` - 数据库配置（复用并修改）
6. `/Users/mashaodong/Desktop/hytech/mycode/memo/src/types/models.ts` - 数据模型类型定义
7. `/Users/mashaodong/Desktop/hytech/mycode/memo/src/stores/memoStore.ts` - 备忘录状态管理
8. `/Users/mashaodong/Desktop/hytech/mycode/memo/src/stores/taskStore.ts` - 任务状态管理（复用）

**第三优先级（UI 组件）**：
9. `/Users/mashaodong/Desktop/hytech/mycode/memo/src/sidepanel/App.vue` - 主界面容器
10. `/Users/mashaodong/Desktop/hytech/mycode/memo/src/sidepanel/main.ts` - Vue 应用入口
11. `/Users/mashaodong/Desktop/hytech/mycode/memo/src/sidepanel/index.html` - HTML 模板
12. `/Users/mashaodong/Desktop/hytech/mycode/memo/src/components/MemoSection/MemoList.vue` - 备忘录列表
13. `/Users/mashaodong/Desktop/hytech/mycode/memo/src/components/MemoSection/MemoInput.vue` - 备忘录输入框
14. `/Users/mashaodong/Desktop/hytech/mycode/memo/src/components/TaskSection/TaskList.vue` - 任务列表
15. `/Users/mashaodong/Desktop/hytech/mycode/memo/src/components/TaskSection/TaskItem.vue` - 任务项
16. `/Users/mashaodong/Desktop/hytech/mycode/memo/src/components/TaskSection/TaskForm.vue` - 任务表单
17. `/Users/mashaodong/Desktop/hytech/mycode/memo/src/components/StatsSection/StatsOverview.vue` - 统计概览
18. `/Users/mashaodong/Desktop/hytech/mycode/memo/src/components/StatsSection/TaskStatusChart.vue` - 状态图表

**第四优先级（样式和资源）**：
19. `/Users/mashaodong/Desktop/hytech/mycode/memo/src/assets/styles/main.css` - 全局样式
20. `/Users/mashaodong/Desktop/hytech/mycode/memo/public/icons/icon-16.png` - 扩展图标
21. `/Users/mashaodong/Desktop/hytech/mycode/memo/public/icons/icon-48.png` - 扩展图标
22. `/Users/mashaodong/Desktop/hytech/mycode/memo/public/icons/icon-128.png` - 扩展图标
23. `/Users/mashaodong/Desktop/hytech/mycode/memo/README.md` - 项目说明文档

### 可以完整复用的文件（从 task-flow）
- `/Users/mashaodong/Desktop/hytech/mycode/task-flow/src/utils/indexedDB/core.ts`
- `/Users/mashaodong/Desktop/hytech/mycode/task-flow/src/utils/indexedDB/database.ts`
- `/Users/mashaodong/Desktop/hytech/mycode/task-flow/src/utils/indexedDB/helpers.ts`
- `/Users/mashaodong/Desktop/hytech/mycode/task-flow/src/utils/indexedDB/index.ts`
- `/Users/mashaodong/Desktop/hytech/mycode/task-flow/src/utils/indexedDB/queryBuilder.ts`
- `/Users/mashaodong/Desktop/hytech/mycode/task-flow/src/utils/indexedDB/types.ts`

---

## 风险与缓解措施

### 风险 1: 打包体积过大
**影响**: 扩展加载慢，用户体验差
**缓解措施**:
- Chart.js 按需导入（只注册需要的组件）
- 移除未使用的依赖（如 vue-router）
- 启用 Vite 的 Tree Shaking
- 使用 Terser 压缩代码
- 目标体积：< 300KB（gzip 后）

### 风险 2: 侧边栏 尺寸限制导致 UI 拥挤
**影响**: 信息展示不完整，操作困难
**缓解措施**:
- 采用折叠式设计（任务详情默认折叠）
- 使用滚动容器（内容可滚动）
- 提供"在新标签页打开"选项（使用 chrome.tabs.create API）
- 图表使用紧凑布局（甜甜圈图中心显示数据）

### 风险 3: IndexedDB 连接丢失
**影响**: 数据无法保存或读取
**缓解措施**:
- 在 侧边栏 挂载时重新初始化数据库连接
- 使用单例模式管理 DB 实例
- 所有数据操作添加错误处理
- 关键操作后立即同步数据（不依赖 beforeunload）

### 风险 4: Vite 构建与 Chrome 扩展兼容性
**影响**: 扩展无法正常加载或运行
**缓解措施**:
- 禁用代码分割（避免动态 import）
- 固定输出文件名（避免 hash）
- 确保 manifest.json 路径正确
- 使用 ES2020 作为编译目标（兼容现代 Chrome）

---

## 开发时间估算

| 阶段 | 内容 | 预计时间 |
|------|------|---------|
| 阶段 1 | 项目初始化 | 1 小时 |
| 阶段 2 | IndexedDB 移植 | 0.5 小时 |
| 阶段 3 | 备忘录功能 | 2 小时 |
| 阶段 4 | 任务管理功能 | 2 小时 |
| 阶段 5 | 数据统计可视化 | 3 小时 |
| 阶段 6 | UI 集成与优化 | 2 小时 |
| 阶段 7 | 构建测试打包 | 1 小时 |
| **总计** | | **11.5 小时** |

对于熟练开发者，预计 **1.5-2 个工作日** 可完成核心功能。

---

## 功能优先级

### P0（核心功能 - 必须实现）
- IndexedDB 数据存储
- 备忘录 CRUD（快速记录）
- 任务 CRUD + 状态管理
- 基础筛选（按状态/优先级）
- 数据统计概览（总数、完成率）
- 状态分布图（饼图）
- 优先级分布图
- 搜索功能（备忘录 + 任务）

### P1（后续迭代功能）
- 主题切换（暗黑模式）
