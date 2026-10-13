# 图标

唯一界面图标来源是 **lucide-react**，模板已直接锁定 1.48.0，与 UI 包一致。按名称导入，不导入整套动态图标，不另装图标库，不用 Emoji 或手绘 SVG 代替普通界面图标。品牌标识和业务图片属于内容资产，单独记录来源。

## 尺寸和描边

| 场景 | 图标尺寸 | 图文间距 |
| --- | --- | --- |
| 默认按钮、表单说明、列表状态 | 16 × 16px | 8px（--space-2） |
| sm 按钮 | 16 × 16px | 6px（共享 Button 内部） |
| xs / icon-xs 按钮 | 12 × 12px | 4px（共享 Button 内部） |
| AppShell 导航 | 16 × 16px | 12px（--space-3） |
| Toast 类型图标 / 关闭图标 | 16 / 12px | 沿用 Sonner 容器间距 |
| 独立品牌入口 | 24 × 24px | 12px（--space-3） |
| PageState 的状态标识 | 32 × 32px | 12px（与下方说明的距离） |

默认 strokeWidth=2，24px viewBox，圆角端点；保持 Lucide 默认随尺寸缩放，不启用 absoluteStrokeWidth，不自行调整描边来突出某个动作。Button 内部 CSS 决定图标尺寸，给子图标 size 并不能覆盖该规则；通过 Button size 选密度。业务独立行内图标显式 size={16}，不采用默认的 24px。

颜色默认 currentColor，随标签文字继承；次要装饰用 --muted-foreground，错误用 --destructive，成功用 --success，警告用 --warning。状态必须同时有文字或可访问名称，不能只靠颜色。

## 无障碍和交互

```tsx
import { Plus, Pencil } from 'lucide-react';
import { Button } from '@cqu-moe/ui';

<Button><Plus aria-hidden="true" />新增用户</Button>
<Button size="icon" variant="ghost" aria-label="编辑林同学" onClick={openEditor}>
  <Pencil aria-hidden="true" />
</Button>
```

- 带文字的图标是装饰，aria-hidden="true"；不要同时在图标上设置 aria-label 造成重复朗读。
- 纯图标按钮把描述动作的 aria-label 放在 button 上；同一列表包含对象名称，不能全部叫“编辑”。可见提示/tooltip 不能代替可访问名称。
- 用原生 Button，Tab 可聚焦、Enter/Space 可操作；焦点环不可去掉。图标本身不接点击事件，不设 tabIndex。
- size="icon" 在精细指针下宽36px、最小高40px；触屏命中区由共享 CSS 提升到至少 44 × 44px。禁止缩小点击区；按钮内部 SVG flex-shrink:0。
- 图标导航用 Button asChild + Link，保留链接语义。需要状态切换时使用 ActionButton，不另造旋转/成功图标组件。

错误示例：`<Pencil onClick={openEditor} />` 没有按钮语义和键盘操作；`<Button size="icon"><Pencil /></Button>` 没有可访问名称。

依据：packages/ui/src/components/ui/button.tsx、layout.css、action-button.tsx 和 page-state.tsx；外部语义参考 [Lucide accessibility](https://lucide.dev/guide/accessibility)。图标规则的自动扫描仅拦截常见替代库，名称、命中区和语义仍需交互检查。

Schedule、Auth、QuickLogin 的正式品牌标识见 [品牌规范](brand.md)。Logo 不替代按钮、状态、列表等功能图标。
