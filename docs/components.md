# 组件选择

公开 API：packages/ui/src/index.ts。类型是允许属性的最终依据，未导出的组件或不存在的变体不能使用。

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
