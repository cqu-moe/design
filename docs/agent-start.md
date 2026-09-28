# 子系统开发 Agent 接入入口

你的任务是交付业务系统，复用此设计系统。不要把设计系统维护、示例中的假数据或定时器带入生产。

## 阅读顺序

1. 读 START-HERE.md 和 DESIGN.md，确认安装版本。
2. 读本文件和 [安装说明](consumption.md)，完成项目运行。
3. 按页面类型读 [布局](layout.md)、[组件](components.md)、[图标](icons.md)、[页面状态](states.md)；反馈查 [通知](notifications.md) 和 [动效](motion.md)。
4. 找下表中最近的示例，再读它使用的公开类型。不要扫描全部示例或猜测 API。
5. 连接业务前读 [真实数据接入](business-integration.md)；交付前逐项检查 [交付清单](acceptance.md)。

源码仓库中文档位于 docs/，页面位于 apps/preview/src/pages/。安装后入口为 node_modules/@cqu-moe/ui/dist/START-HERE.md；同一版本的 docs/、examples/pages/ 与类型声明都位于 dist/。

## 新项目

在设计仓库运行 `pnpm install`，然后 `pnpm create:app ../my-subsystem`。新目录必须不存在；生成器不会覆盖已有项目。进入新目录，修改 package.json 的 name 和 index.html 的 title，执行 `pnpm install`、`pnpm build`、`pnpm check:design`、`pnpm dev`。

模板已接入一次 ThemeProvider / Toaster、首帧主题初始化、AppShell、路由错误页、404、Lucide 图标、编译后的共享 CSS 和设计检查器。提交生成的 .design/*.tgz、pnpm-workspace.yaml 及锁文件，保证其他机器能安装。

依赖责任：@cqu-moe/theme 提供 tokens 与首帧主题；@cqu-moe/ui 提供控件、布局、状态和通知；lucide-react 由业务项目直接依赖。基础组件从 @cqu-moe/ui 导入；图表仅从 @cqu-moe/ui/charts 导入；图标从 lucide-react 按名称导入。

## 老系统接入

1. 盘点现有框架、路由、认证、CSS reset、通知容器、接口和测试，记录哪些能保留。先在独立分支/worktree 操作。
2. React 客户端应用按 consumption.md 安装 tarball，在根入口按顺序加载主题/UI/业务 CSS，并接入首帧主题脚本。已有 Tailwind reset 只留一份。
3. 应用根部只保留一个主题提供者和通知容器。先替换外壳与一个完整业务页面，再逐路由迁移；已迁移页面禁止继续混用旧基础控件。
4. 保留 URL、鉴权、业务字段和接口语义。若需同时升级 React/路由，单独记录兼容性改动；不要仅为外观变化改认证流程。
5. 逐页通过交互与响应式验证后再扩大范围，旧组件无调用者后删除。不要写第二份 .ds-* 覆盖规则解决迁移问题。

非 React 或 SSR 系统可先接入 theme；当前 ThemeProvider 面向客户端，不能假定 SSR 安全。先确定框架迁移或客户端边界再接入 UI，不强行塞进不兼容环境。本轮未完成老系统迁移试点。

## 页面参考

| 业务页面 | 预览路由 | 相对 pages/ 的文件 |
| --- | --- | --- |
| 设置、内联和全局保存 | /settings | settings.tsx |
| 列表、分页、加载/空/错误/权限 | /items → 演示状态 | items.tsx |
| 详情、无效链接 | /items/schedule | item-detail.tsx |
| 仪表盘 | /admin | admin/dashboard.tsx |
| 图表、可访问数据表 | /admin/analytics | admin/analytics.tsx |
| 用户、批量操作、高级筛选 | /admin/users | admin/users.tsx、admin/user-filters.tsx |
| 客户端、新建弹窗、详情侧栏 | /admin/clients | admin/clients.tsx |
| 登录注册 | /auth | auth.tsx |
| 按钮状态、Toast、持续通知 | /feedback | feedback.tsx、button-feedback.tsx |
| 基础控件状态 | /components | components.tsx |

示例业务容器还依赖 examples/demo-data.ts、admin-data.ts 和 examples/styles.css；仓库对应 apps/preview/src/。按需参考页面组合和对应 CSS，不复制整份预览应用、演示开关或基础组件。admin/state.tsx 的内存状态需替换为业务数据层。

## 最小页面

```tsx
import { Plus } from 'lucide-react';
import { Button, PageHeader, PageState } from '@cqu-moe/ui';

export function UsersPage({ onCreate }: { onCreate: () => void }) {
  return <>
    <PageHeader title="用户管理" description="管理成员与访问权限。"
      actions={<Button onClick={onCreate}><Plus aria-hidden="true" />新增用户</Button>} />
    <PageState state="empty" title="还没有用户" description="创建首位用户后，成员会显示在这里。" />
  </>;
}
```

此页面放在模板的 Layout / ContentContainer 内。onCreate 由业务决定打开创建弹窗或跳转新建路由；不要把空函数当作已实现。完整可运行根入口见模板 src/main.tsx。

## 遇到缺口

先查公开类型与最近示例；能组合就组合。组件有缺陷或需要通用变体时，按 [反馈约定](feedback-contract.md) 提醒用户并给出可复现记录。无授权不改设计包、不发 issue、不复制出本地分叉。可继续完成不受影响的业务部分，并在交付中列明阻塞与临时方案。
