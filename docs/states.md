# 页面和组件状态

页面正常内容之外必须设计以下状态，具体文案由业务提供。不要用空数组同时表示“还在加载”“请求失败”和“没有数据”。

| 场景 | 使用方式 | 恢复方式 |
| --- | --- | --- |
| 首次加载 | PageState state="loading"；已知结构可用 Skeleton | 完成后替换为内容或错误，不能一直转圈 |
| 后台刷新 | 保留已有内容，局部 aria-busy 与更新时间 | 不清空列表、不跳到全屏 loading |
| 数据为空 | PageState state="empty"，说明尚未创建 | 有权限时提供创建入口 |
| 筛选无结果 | PageState state="empty"，说明条件无匹配 | 清除筛选，保留搜索框可用 |
| 网络/服务错误 | PageState state="error" 或局部 Alert | 重试同一请求，保留草稿与筛选 |
| 权限不足 | PageState state="forbidden" | 联系管理员或返回可访问页面，不能假装空数据 |
| 未登录 / 会话失效 | 业务认证边界处理 401 | 引导登录，安全保留返回地址和非敏感草稿 |
| 页面/对象不存在 | PageState state="not-found" | 返回列表或首页 |
| 局部保存 | ActionButton 四态 + 字段错误 | 成功只在服务端确认后显示，失败可重试 |

PageState 的 props：state（loading / empty / error / forbidden / not-found）、title、description、可选 action: ReactNode。没有默认业务文案，不负责请求或权限判断。它提供 h2、状态播报、Lucide 图标和响应式布局；页面仍需 PageHeader 的 h1。action 使用现有 Button/Link，不传入自制点击 div。

```tsx
<PageState state="forbidden" title="没有访问权限"
  description="请联系工作空间管理员确认权限。"
  action={<Button asChild variant="outline"><Link to="/">返回首页</Link></Button>} />
```

- 403 时不渲染受保护表格、统计数或详情；权限必须由后端执行，隐藏控件不是安全边界。
- 禁用要说明原因；没有执行权限的动作不能仍能触发请求。只读内容与可编辑内容明确区分。
- 按钮覆盖 default/hover/active/focus/disabled；输入覆盖 empty/filled/focus/disabled/invalid；浮层覆盖 open/close、取消与焦点返回。
- 输入校验在提交或失焦后出现；错误通过 aria-invalid 和 aria-describedby 关联，修正后及时清除。
- 不对空/错/权限页播放大幅入场。加载图标在减少动态效果和键盘操作时静止，文字仍表达状态。
- Toast 不能成为错误、权限原因或撤销入口的唯一存放处，自动消失后页面仍可恢复。

预览 /items 的“演示状态”可切换加载、空数据、错误、权限；/items/missing 演示无效对象；模板未知路由显示 404。示例的“清除筛选”在空数据演示中仅恢复本地样本，真实系统空库应给创建或帮助入口。
