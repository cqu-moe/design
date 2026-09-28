# 页面布局

AppShell 负责顶部身份区、桌面侧栏、手机导航和正文区域。内容不得放到外壳以外另建一套导航。

```tsx
<AppShell brand="项目名称" navigation={<NavLink to="/settings">设置</NavLink>} utilities={<ThemeMenu />}>
  <ContentContainer>
    <PageHeader title="设置" description="管理使用偏好。" />
    {/* 业务内容 */}
  </ContentContainer>
</AppShell>
```

导航由项目自己的路由链接提供，当前链接设置 aria-current="page"；React Router 的 NavLink 会自动设置。
不要在 navigation 中使用固定 DOM id，因为导航会在桌面与手机容器各渲染一次。

## 内容宽度

- reading：48rem，长文或单列内容。
- compact：64rem，设置与紧凑管理列表。
- standard：75rem，默认设置和列表页。
- wide：90rem，二维数据或课表等需要额外空间的页面。

宽度由 ContentContainer 的 width 属性选择。消费页面不得修改 .ds-container 或 .ds-sidebar 的内部规则。
桌面内边距 40px，手机 16px；导航在 768px 以下转为抽屉。

## 页面组合

| 内容 | 参考代码 |
| --- | --- |
| 个人资料、偏好、保存反馈 | apps/preview/src/pages/settings.tsx |
| 搜索、筛选、分页与空状态 | apps/preview/src/pages/items.tsx |
| 长标题、元信息、错误链接恢复 | apps/preview/src/pages/item-detail.tsx |
| 组件状态和浮层 | apps/preview/src/pages/components.tsx |

手机端重排布局，保留所有操作；列表次要字段可以移到详情，详情必须完整。
二维关系不可丢失的表格允许容器内横向滚动，整页不能横向溢出。
主要动作使用 PageHeader actions 或表单末尾明确的操作区，不分散在多个同权重位置。
长表单保持单一表单语义，校验信息靠近字段，失败时保留输入。

简单页面允许使用 inline style 或页面自己的类表达 flex/grid 布局，gap/padding 等值取共享变量；不要创建通用布局 DSL，也不要覆盖共享组件内部样式。
同步的本地演示保存直接给出完成反馈，不伪造 loading。真实异步保存则必须显示进度并防止重复提交。

安装包中的对应参考页面位于 dist/examples/pages/，示例样式为 dist/examples/styles.css。它们用于理解组合方式，不应把 ui 基础组件复制到消费项目。

数据多列且确需空间时再使用 standard/wide。

后台示例位于 apps/preview/src/pages/admin/：dashboard、analytics、users、clients。共用 AdminLayout 的内存演示状态；离开后台或刷新后恢复初始数据。
管理表格在手机端允许局部横向滚动，保留完整字段和操作，并显示滚动提示。

用户管理组合示例还包含批量选择、确认后应用、可调分页和高级筛选。全选指当前页，跨页保留；改变搜索/筛选时清空选择。高级筛选在 Sheet 中编辑草稿，点应用后更新列表，关闭则保留已应用条件。

登录/注册入口 /auth 是未认证页面，使用独立品牌顶栏与居中表单，不显示业务侧栏；仍复用主题、Tabs、Input 和 Button。登录与注册切换保留邮箱、清空密码。示例只模拟提交状态，不实现真实认证。
