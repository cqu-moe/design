# 主题与设计变量

唯一来源：源码 packages/theme/src/tokens.css，安装后为 @cqu-moe/theme/dist/styles.css。两个主题共用变量名，业务组件使用语义层，禁止原始颜色。

| 用途 | 变量 |
| --- | --- |
| 页面背景、正文 | --background、--foreground |
| 内容与浮层 | --surface、--popover、--popover-foreground |
| 次要背景与说明 | --muted、--muted-foreground |
| 分组线、输入边界、焦点 | --border、--input、--ring |
| 主要按钮 | --primary、--primary-foreground |
| 当前选中与轻交互 | --muted、--accent |
| 卡片轻投影 | --shadow-card |
| 错误、成功、警告、链接 | --destructive、--success、--warning、--link |

background 是整页底色，surface 用于确需分组的内容区域，muted 用于选中状态和次要填充。不要为了分组反复套卡片。

## 字体与尺寸

--font-sans 使用 Geist 候选及系统中西文无衬线回退；本版本不下载 Geist 字体，实际以系统字体渲染。
--font-mono 用于代码与标识。

| 变量 | 值 | 使用场景 |
| --- | --- | --- |
| --text-xs | 12px | 次要说明、日期、元信息 |
| --text-sm | 14px | 标签、紧凑说明 |
| --text-base | 16px | 正文与输入 |
| --text-lg | 18px | 局部重点 |
| --text-xl | 20px | 次级标题 |
| --text-title | 28px | 桌面页面标题 |
| --text-display | 36px | 仅确有需要的展示标题 |

手机页面标题在共享外壳中为 24px。不要在业务页面另设字号。
使用 --space-1/2/3/4/5/6/8/10/12，对应 4/8/12/16/20/24/32/40/48px。
圆角用 --radius-sm、--radius、--radius-lg，对应 6/8/12px。

```css
/* 正确 */
.description { color: var(--muted-foreground); gap: var(--space-3); }
/* 错误：业务页面另造颜色与间距 */
.description { color: #888; gap: 13px; }
```

## 深浅模式

使用 ThemeProvider 和 ThemeMenu。默认跟随系统，可固定浅色或深色，存储键 cqu-moe-theme。
深色背景 oklch(.235 0 0)，内容区域 oklch(.265 0 0)，不得在页面覆盖成纯黑。
正文和语义文字须按实际背景测量对比度；contrast.json 是当前测量，不替代修改后的重新检测。
