# AI 销售执行平台 - Web 前端

## 技术栈

| 类别 | 技术 | 版本 |
|------|------|------|
| 构建工具 | Vite | 8.x |
| 框架 | React | 19.x |
| 语言 | TypeScript | 6.x |
| 样式 | Tailwind CSS | 4.x |
| UI 组件库 | shadcn/ui (base-nova) | - |
| 数据请求 | TanStack React Query | 5.x |
| 路由 | React Router DOM | 7.x |
| 图标 | Lucide React（[lucide.dev/icons](https://lucide.dev/icons/)） | - |

## 快速开始

```bash
cd web
npm install

# 开发模式（推荐日常开发使用）
npm run dev      # 启动开发服务器 http://localhost:5173，修改代码后页面实时热更新

# 生产构建 & 预览
npm run build    # 生产构建，输出到 dist/
npm run preview  # 启动本地服务器预览 dist/ 打包产物（不会热更新，修改代码后需重新 build 再 preview）

npm run lint     # ESLint 检查
```

## 目录结构

```
src/
├── components/
│   ├── layout/          # 布局组件（AppLayout, AppSidebar）
│   └── ui/              # shadcn/ui 基础组件（勿手动修改）
├── hooks/               # 自定义 hooks
├── lib/                 # 工具函数（cn 等）
├── pages/               # 页面组件，每个路由对应一个文件
├── App.tsx              # 路由配置 + Provider 组装
├── main.tsx             # 入口文件
└── index.css            # Tailwind + shadcn 主题变量
```

## 页面路由

| 路由 | 页面文件 | 说明 |
|------|----------|------|
| `/` | `AssistantPage.tsx` | AI 助手 |
| `/workbench` | `WorkbenchPage.tsx` | 工作台 |
| `/session-review` | `SessionReviewPage.tsx` | 会话复盘 |
| `/team-coaching` | `TeamCoachingPage.tsx` | 团队辅导 |
| `/member-settings` | `MemberSettingsPage.tsx` | 成员设置 |

## 开发规范

### 路径别名

使用 `@/` 别名引用 `src/` 下的模块：

```tsx
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
```

### 样式

- **只使用 Tailwind CSS utility classes**，不写自定义 CSS 文件
- 需要条件拼接 class 时使用 `cn()` 工具函数：
  ```tsx
  import { cn } from '@/lib/utils'
  <div className={cn('p-4', isActive && 'bg-primary')} />
  ```
- 颜色使用 shadcn 语义化 CSS 变量（`bg-background`, `text-foreground`, `border-border` 等），不要硬编码色值

### UI 组件

- **优先使用 shadcn/ui 组件**，通过 CLI 按需添加：
  ```bash
  npx shadcn@latest add dialog    # 添加 dialog 组件
  npx shadcn@latest add table     # 添加 table 组件
  ```
- `src/components/ui/` 目录下的文件由 shadcn CLI 生成，**不要手动修改**这些文件
- 业务组件放在 `src/components/` 下按功能模块建子目录

### 数据请求

- 使用 TanStack React Query 管理服务端状态，不要用 `useEffect` + `useState` 手动请求
- Query 和 Mutation 定义集中管理（后续会建 `src/api/` 目录）
- 示例：
  ```tsx
  import { useQuery } from '@tanstack/react-query'

  const { data, isLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => fetch('/api/sessions').then(r => r.json()),
  })
  ```

### 新增页面流程

1. 在 `src/pages/` 下创建 `XxxPage.tsx`，使用 `export default function`
2. 在 `src/App.tsx` 的 `<Route>` 中添加路由
3. 在 `src/components/layout/AppSidebar.tsx` 的 `navItems` 中添加导航项

### 文件命名

| 类型 | 命名规则 | 示例 |
|------|----------|------|
| 页面组件 | PascalCase + `Page` 后缀 | `WorkbenchPage.tsx` |
| 业务组件 | PascalCase | `SignalCard.tsx` |
| hooks | camelCase + `use` 前缀 | `use-mobile.ts` |
| 工具函数 | camelCase | `utils.ts`，所有导出函数需添加 JSDoc 注释 |

### 禁止事项

- 不要在 `src/components/ui/` 下手动创建或修改文件
- 不要引入额外的 CSS-in-JS 方案（styled-components, emotion 等）
- 不要引入额外的状态管理库（Redux, MobX 等），用 React Query + React Context 即可
- 不要使用 `any` 类型，必须提供明确的类型定义
- 不要在组件中直接写 `fetch` 调用，统一通过 React Query
- 不要修改 `vite.config.ts`、`tsconfig.*.json`、`index.css` 中的主题配置，除非与前端团队确认
