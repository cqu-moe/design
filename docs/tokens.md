# 主题与设计变量

唯一来源：源码 packages/theme/src/tokens.css，安装后为 @cqu-moe/theme/dist/styles.css。两个主题共用变量名，业务组件使用语义层，禁止原始颜色。

| 用途                   | 变量                                        |
| ---------------------- | ------------------------------------------- |
| 页面背景、正文         | --background、--foreground                  |
| 内容与浮层             | --surface、--popover、--popover-foreground  |
| 次要背景与说明         | --muted、--muted-foreground                 |
| 分组线、输入边界、焦点 | --border、--input、--ring                   |
| 主要按钮               | --primary、--primary-foreground             |
| 当前选中与轻交互       | --muted、--accent                           |
| 卡片轻投影             | --shadow-card                               |
| 错误、成功、警告、链接 | --destructive、--success、--warning、--link |

background 是整页底色，surface 用于确需分组的内容区域，muted 用于选中状态和次要填充。不要为了分组反复套卡片。

```text
选择背景
├─ 页面、侧栏 → --background
├─ 表单、业务内容、演示内部 → --surface
├─ 导航选中、次要填充 → --muted
└─ 展示页品牌衬底 → --brand-soft

选择文字
├─ 正文、标题 → --foreground
├─ 次要说明 → --muted-foreground
├─ 链接 → --link
└─ 错误 / 成功 / 警告 → 对应状态变量，同时提供文字或图标
```

## 统一品牌色

用户已确认所有产品共享蓝色。以下角色由 theme 1.2.0 导出，业务页面引用变量，不写产品专属色或原始 hex。

| 变量             | 浅色                           | 深色                           | 用途                   |
| ---------------- | ------------------------------ | ------------------------------ | ---------------------- |
| --brand-solid    | oklch(.49 .16 258) / `#195cb9` | oklch(.39 .1152 258)           | 展示页实底、品牌主动作 |
| --brand-on-solid | oklch(.99 0 0)                 | 继承浅色                       | 实底上的文字与图标     |
| --brand-ink      | oklch(.45 .16 258) / `#0850ab` | oklch(.8 .088 258) / `#9bc0f7` | Logo、链接、焦点       |
| --brand-soft     | oklch(.955 .018 258)           | oklch(.29 .025 258)            | 展示页外围衬底         |

- 不为产品暴露 hue / 色相配置。共享品牌用不同明度适应浅深背景，不用不同色相区分产品。
- `--link` 和 `--ring` 使用 `--brand-ink`。工作界面的 `--primary` / `--primary-foreground`、开关和导航选中态保持中性；展示页只在品牌主动作容器局部映射 `--primary: var(--brand-solid)`、`--primary-foreground: var(--brand-on-solid)`，不能覆盖应用根节点。
- 应用与扩展图标容器固定使用浅色 `--brand-solid`（`#195cb9`），不随工具栏深浅模式切换；页面 Logo 使用 `--brand-ink` 的浅深值。
- 浅品牌面只承载展示页演示外围；表单与工具窗口内部使用 `--surface` 和 `--foreground`，避免品牌底与操作内容争夺注意力。

## 字体与尺寸

--font-sans 使用 Geist 候选及系统中西文无衬线回退；本版本不下载 Geist 字体，实际以系统字体渲染。
--font-mono 用于代码与标识。

| 变量           | 值   | 使用场景               |
| -------------- | ---- | ---------------------- |
| --text-xs      | 12px | 次要说明、日期、元信息 |
| --text-sm      | 14px | 标签、紧凑说明         |
| --text-base    | 16px | 正文与输入             |
| --text-lg      | 18px | 局部重点               |
| --text-xl      | 20px | 次级标题               |
| --text-title   | 28px | 桌面页面标题           |
| --text-display | 36px | 仅确有需要的展示标题   |

手机页面标题在共享外壳中为 24px。不要在业务页面另设字号。
使用 --space-1/2/3/4/5/6/8/10/12，对应 4/8/12/16/20/24/32/40/48px。
圆角用 --radius-sm、--radius、--radius-lg，对应 6/8/12px。

```css
/* 正确 */
.description {
  color: var(--muted-foreground);
  gap: var(--space-3);
}
/* 错误：业务页面另造颜色与间距 */
.description {
  color: #888;
  gap: 13px;
}
```

## 深浅模式

使用 ThemeProvider 和 ThemeMenu。默认跟随系统，可固定浅色或深色，存储键 cqu-moe-theme。
深色背景 oklch(.235 0 0)，内容区域 oklch(.265 0 0)，不得在页面覆盖成纯黑。
正文和语义文字须按实际背景测量对比度；contrast.json 是当前测量，不替代修改后的重新检测。
