# 组件选择

公开 API：源码的 packages/ui/src/index.ts；安装包对应 dist/index.d.ts 及关联声明。类型是允许属性的最终依据，未导出的组件或不存在的变体不能使用。

## Button

动作使用 Button，导航使用真实链接；按钮外观的导航用 Button asChild 包裹链接。

变体仅有 default、secondary、outline、ghost、destructive、link。

- default：默认变体，只用于最重要的动作。
- outline：普通次要动作的首选，例如取消或重新加载。
- secondary：需要填充背景的次要动作。
- ghost：工具栏和图标动作。
- destructive：删除等破坏性操作，需要确认；不是普通警告。
- link：轻量动作，导航仍须使用链接元素。

```tsx
// 正确
<Button variant="outline">取消</Button>
<Button asChild variant="ghost"><Link to="/items">返回列表</Link></Button>
// 错误：不存在的变体
<Button variant="primary">保存</Button>
```

决策顺序：破坏性操作 → destructive；主要操作 → default；普通次要操作 → outline；紧凑工具栏 → ghost。
图标按钮必须有 aria-label。触屏下共享包将有效尺寸提升到至少 44px；不要覆盖 ds-button 类。

## 表单

Input、Label、Textarea 用于原生输入语义，htmlFor 必须对应 id。Label 不能用 placeholder 替代。
Checkbox 表示独立勾选，Switch 表示开关。Select 用于单选，搜索输入使用 Input type="search"。
简单选择不使用菜单代替表单控件；需要可搜索的大选项集时先扩展共享组件，不伪造 Select 属性。

```tsx
<Label htmlFor="display-name">显示名称</Label>
<Input id="display-name" name="name" autoComplete="name" aria-describedby="name-help" />
<p id="name-help">用于服务内的称呼。</p>
```

校验在失焦或提交时发生；出现过错误后可随输入纠正。字段错误同时提供 aria-invalid、关联说明和文字。
保存期间禁止重复提交，显示进度；失败保留输入，不显示成功反馈。

## 浮层

Dialog 用于需要完成或确认的独立任务；DropdownMenu 用于动作集合；Select 用于表单选择；Sheet 用于手机导航等侧边内容。
每个 Dialog / Sheet 必须提供 Title 和 Description，关闭后返回触发位置。
使用 Trigger asChild 包裹 Button，避免嵌套 button。关闭行为交给原语，勿另加全局 Escape 监听。

## 表格与加载

Table 是语义表格组件，不自动提供数据请求、排序、分页或虚拟化。组合参考 items.tsx。
Skeleton 保留内容形状；空和错误状态写明恢复动作，不让加载状态永久代替错误。

## 主题与外壳

ThemeProvider 放在应用根部。ThemeMenu 用于全局外观选择；useTheme 提供 preference、resolvedTheme、setPreference。
AppShell、ContentContainer、PageHeader 的接口见 layout.md，业务逻辑不放进共享外壳。

## Tabs

同一任务中的并列子页面使用 Tabs、TabsList、TabsTrigger、TabsContent；账号设置示例使用 line 变体。默认变体用于紧凑分段选择。
支持方向键、Home/End；每个 Content 与 Trigger 使用相同 value。业务草稿放在 Tabs 上层，避免切换时丢失。
字段旁的保存按钮只提交该字段，全局保存提交全部草稿。两者使用同一个保存状态与并发锁。

## 图表

从 @cqu-moe/ui/charts 导入 DataChart，避免让只用基础控件的页面加载 Recharts。
kind 仅支持 line、area、bar；传入 title、valueLabel 和 data，数据项为 { label: string, value: number, secondary?: number }。
需要第二组时提供 secondaryLabel。趋势用 line/area，分类比较用 bar；柱图从零起，次级趋势使用虚线。单位写在标签中。
每张图保留可展开的数据表，不只提供悬停提示。后台示例按路由懒加载；默认不播放图表入场动画。

## 通知与 Alert

Toaster 在应用根部挂载一次，toast 原生 API 用于操作结果。Alert、AlertTitle、AlertDescription 用于持续的页面状态。选择规则见 notifications.md，同一结果不重复显示两种反馈。
