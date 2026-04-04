# 备忘录 & 任务管理 Chrome 扩展

一个基于 Vue 3 的轻量级 Chrome 扩展，提供备忘录和任务管理功能。

## 功能特性

### 📝 备忘录
- 快速记录文本备忘
- 置顶重要备忘录
- 编辑和删除功能
- 自动时间戳

### ✅ 任务管理
- 创建和管理待办事项
- 状态管理（待处理/进行中/已完成）
- 优先级设置（低/中/高/紧急）
- 截止日期提醒
- 按状态和优先级筛选

### 📊 数据统计
- 任务完成率统计
- 状态分布可视化（甜甜圈图）
- 优先级分布图（条形图）
- 实时数据更新

## 技术栈

- **框架**: Vue 3 + TypeScript + Composition API
- **构建工具**: Vite 5
- **状态管理**: Pinia
- **数据存储**: IndexedDB
- **Chrome API**: Manifest V3 + Side Panel API

## 开发

### 安装依赖

\`\`\`bash
npm install
\`\`\`

### 开发模式

\`\`\`bash
npm run dev
\`\`\`

### 构建生产版本

\`\`\`bash
npm run build
\`\`\`

构建输出在 `dist/` 目录。

## 安装到 Chrome

1. 构建项目：`npm run build`
2. 打开 Chrome 浏览器
3. 访问 `chrome://extensions/`
4. 开启右上角的"开发者模式"
5. 点击"加载已解压的扩展程序"
6. 选择项目的 `dist` 目录
7. 扩展安装完成！点击工具栏图标打开侧边栏

## 使用指南

### 备忘录页面
- 在顶部输入框输入内容，按 Enter 或点击发送按钮创建备忘录
- 点击图钉图标可置顶备忘录
- 点击编辑图标可修改内容
- 点击删除图标删除备忘录

### 任务管理页面
- 点击右下角的 "+" 按钮创建新任务
- 点击复选框标记任务完成/未完成
- 使用顶部筛选器按状态和优先级过滤任务
- 每个任务显示状态标签和截止日期

### 数据统计页面
- 查看任务总数、已完成数、进行中数和完成率
- 甜甜圈图展示任务状态分布
- 条形图展示不同优先级任务数量

## 数据存储

所有数据存储在浏览器的 IndexedDB 中，数据完全本地化，不会上传到云端。

## 项目结构

\`\`\`
memo/
├── src/
│   ├── sidepanel/          # 侧边栏主应用
│   │   ├── App.vue
│   │   ├── index.html
│   │   └── main.ts
│   ├── components/         # 组件
│   │   ├── MemoSection/    # 备忘录组件
│   │   ├── TaskSection/    # 任务管理组件
│   │   └── StatsSection/   # 数据统计组件
│   ├── stores/             # Pinia stores
│   │   ├── memoStore.ts
│   │   └── taskStore.ts
│   ├── utils/              # 工具函数
│   │   └── indexedDB/      # IndexedDB 封装
│   ├── assets/             # 静态资源
│   │   └── styles/         # 样式文件
│   └── types/              # TypeScript 类型定义
├── public/                 # 公共资源
│   ├── manifest.json       # Chrome 扩展配置
│   └── icons/              # 扩展图标
├── dist/                   # 构建输出目录
├── vite.config.ts          # Vite 配置
├── tsconfig.json           # TypeScript 配置
└── package.json            # 项目配置

\`\`\`

## 设计稿

UI 设计基于 `/new.pen` 设计稿，采用 Warm Linen 配色方案，Soft Bento 设计风格。

- 侧边栏尺寸：360px × 100vh
- 主色调：#F3EBE2（米色背景）
- 强调色：#D4916E（橙棕色）
- 字体：Inter（UI）+ Geist Mono（数据）

## License

ISC
