# CQU Moe 统一前端实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans for inline execution, or superpowers:subagent-driven-development if the user chooses delegation. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** 交付可独立安装的共享主题与 UI 包、双主题响应式预览应用、启动模板和 Agent 接入规范。

**Architecture:** design 是独立 pnpm workspace。theme 提供框架无关的变量和主题初始化能力；ui 提供 shadcn 组件及统一页面外壳。预览应用和启动模板消费相同构建产物。

**Tech Stack:** React、TypeScript、Vite、React Router Data Mode、Tailwind CSS、shadcn/ui。首版交互原语选择 Radix，图标选择 Lucide，基础动效使用 CSS。

**Spec:** [SPEC.md](./SPEC.md)，用户已批准。首版实现与验证已完成；执行证据和未验证范围见 docs/delivery.md。

## 全局约束

- 使用 emil-ask-emil 路由具体设计技能，使用 animate 制定动效。
- 视觉参考 Vercel / Geist；支持浅色和深色；深色以石墨灰为主，避免纯黑背景。
- 桌面作为设计起点，桌面和手机均须完整可用、分别验收。
- 统一导航、标题区、内容宽度、操作区和常见页面结构。
- 主题和基础组件集中维护，消费项目锁定准确版本，不复制修改基础组件。
- 普通文字与背景对比度至少 4.5:1，大字至少 3:1。
- 预览只使用虚构数据。本计划不迁移现有生产系统，不发布包或部署服务。
- DESIGN.md 只记录已经实现的 API。所有任务完成前，不能将设计方案、截图或局部检查描述为完整交付。
- 项目依赖在执行时查询官方文档与包元数据，选择兼容的稳定版本并记录准确版本和锁文件。
- 提交前核对有效 Git user.name、user.email，使用原值；缺失即停止提交，不改身份配置。

## 技能执行顺序

1. 基础阶段：emil-ask-emil → emil-design-foundations，确定布局与信息层级；随后 emil-color 确定主题并测量对比度。
2. 组件阶段：需要调整公开接口时使用 emil-component-design；制作表单时使用 emil-forms-and-inputs。按任务逐项加载。
3. 动效阶段：animate；实现 CSS 动效前读取其 css-techniques.md，不默认引入 Motion。
4. 验收阶段：emil-touch-and-accessibility 检查两端操作；emil-ui-review 复核最终界面与代码。

动效细则以本项目的 motion.md 为准。技能建议冲突时遵守用户需求与可访问性要求，并记录选取原因。例如采用 animate 的 ease-out 入场与离场，不照搬其他技能的 ease-in 离场；触屏主要操作保持一次点击，不引入必须悬停后再次点击的流程。

## 审查重点

| 条件 | 预期行为 | 对应任务 |
| --- | --- | --- |
| 存储不可用、偏好值损坏、系统主题变更 | 页面仍可用，主题有确定回退且可切换 | 1 |
| 包安装在 workspace 之外 | 样式、类型、React 实例和资源路径正确 | 2、5 |
| 长中文、200% 缩放、320px 宽度 | 无整页横向溢出，操作和信息仍可访问 | 3、4 |
| 键盘或减少动态效果模式打开浮层 | 焦点正确，操作不等待动画，不产生大幅位移 | 3 |
| 请求失败、快速重复提交、列表为空 | 不误报成功、不重复提交，能恢复操作 | 4 |

## Task 1：可运行的双主题基座

**文件：** 根 package.json、pnpm-workspace.yaml、pnpm-lock.yaml、tsconfig.base.json、.gitignore；packages/theme/package.json、src/tokens.css、src/theme.ts；apps/preview/package.json、index.html、src/main.tsx、src/styles.css、vite.config.ts；tests/theme.test.ts、tests/theme.browser.spec.ts。

**接口：** theme 源码包暂命名 @cqu-moe/theme，仅用于本地，不代表拥有 registry 命名空间。导出 styles.css、ThemePreference = 'system' | 'light' | 'dark'、ResolvedTheme = 'light' | 'dark'、resolveTheme(preference, systemDark): ResolvedTheme。导出 themeInitScript: string，使用相同解析逻辑，在页面正文之前执行；根元素以 data-theme 标记主题，存储键固定为 cqu-moe-theme。

- [x] 核对目录中除批准文档外无其他工作，初始化 Git 并提交文档基线；使用原配置身份。
- [x] 按 using-git-worktrees 及原生 worktree 工具规则建立隔离 checkout；工作区不得位于 /private/tmp。若原生工具不能针对新仓库工作，说明限制后按技能允许的 Git fallback 创建。
- [x] 实现前运行 modern-web-guidance，核对主题初始化、响应式布局和浮层相关建议；第三方 API 使用 Context7 优先查询。
- [x] 配置最小 workspace、TypeScript、Vite、Vitest 和 Playwright。后两者分别承担逻辑验证与真实浏览器交互，不再引入重复测试工具。
- [x] 先写 resolveTheme 测试：light/true → light；dark/false → dark；system/true → dark；system/false → light。浏览器测试要求损坏偏好与存储拒绝访问时仍渲染并能切换主题。
- [x] 执行 pnpm test，记录目标测试因主题实现缺失而失败，再实现主题变量和初始化逻辑。
- [x] 建立 token 角色：background、foreground、surface、muted、muted-foreground、border、input、ring、primary、primary-foreground、destructive、success、warning、link；提供与 shadcn 的映射，避免两套独立颜色值。
- [x] 使用 emil-color 的 OKLCH 方法制作候选色；测量实际渲染对比度，不以感知亮度差代替计算。深色 background 必须与纯黑有可见区分。
- [x] 预览主题角色与文字层级，导出两种主题截图；运行 pnpm test、pnpm build 及主题浏览器测试，全部通过后提交。

## Task 2：可独立消费的共享组件

**文件：** packages/ui/package.json、components.json、tsconfig.json、src/index.ts、src/styles.css、src/lib/utils.ts、src/components/ui/{button,input,label,textarea,checkbox,switch,select,dialog,sheet,dropdown-menu,table,skeleton}.tsx、src/theme-provider.tsx；scripts/build-ui.mjs；tests/components.browser.spec.ts。

**接口：** 本地包名 @cqu-moe/ui；导出组件和 styles.css。ThemeProvider 接收 children；useTheme(): { preference: ThemePreference; resolvedTheme: ResolvedTheme; setPreference(value: ThemePreference): void }。依赖任务 1 的解析逻辑，不另写一套回退规则。

- [x] 从官方 shadcn Radix 版本获取首批组件，记录来源与版本，保留必要许可声明；仅加入样板确实使用的组件。
- [x] 先写测试：Button disabled 时不触发动作；Input 的关联 Label 可聚焦；Dialog 可键盘关闭并把焦点返回触发器；Sheet 关闭后页面恢复交互。运行并确认目标断言失败。
- [x] 保留 shadcn 的组合方式和公开类型；首版 Button 允许 default、secondary、outline、ghost、destructive、link，不另造同义变体。
- [x] 添加无障碍名称、焦点样式及各状态样式；ThemeProvider 监听系统偏好及跨标签存储变化，显式主题不被系统变化覆盖。
- [x] 将 UI 编译为 ESM 与类型声明，React 保持 peer dependency。Tailwind 仅编译 UI 源码使用的 utilities，UI 包不重复注入全局 preflight；消费应用负责一次 reset。
- [x] 对 CSS 标记 sideEffects，显式导出 CSS 与类型；预览只通过包导出使用组件，禁止跨包导入 src。
- [x] 运行 pnpm test、pnpm build 和组件浏览器测试；验证深浅主题下的浮层、焦点与禁用状态后提交。

## Task 3：统一页面外壳与动效

**文件：** packages/ui/src/components/{app-shell,page-header,content-container}.tsx、src/motion.css；apps/preview/src/app.tsx；docs/motion.md；tests/shell.browser.spec.ts。

**接口：** AppShell({ brand: ReactNode, navigation: ReactNode, utilities?: ReactNode, children: ReactNode })；PageHeader({ title: string, description?: string, actions?: ReactNode })；ContentContainer({ width?: 'reading' | 'standard' | 'wide', children: ReactNode })。navigation 在桌面与手机复用同一内容；路由状态与链接由消费项目提供，ui 不绑定 React Router。

- [x] 用 emil-design-foundations 先制作无动效布局：顶部身份区、桌面侧导航、页面标题与操作区；手机通过 Sheet 展示导航，包含跳至正文入口。
- [x] 先写浏览器断言：390px 和 1440px 均可到达所有导航项；320px 页面 scrollWidth 不超过 clientWidth；键盘可打开关闭导航，焦点返回触发器。运行并确认缺失行为失败。
- [x] 内容容器候选最大宽度设为 reading 48rem、standard 75rem、wide 90rem；侧栏候选宽度 15rem。统一放在变量中，通过真实中文页面调整后记录最终值。
- [x] 执行 animate 决策流程并写 motion.md：页面导航、输入、键盘选择即时响应；popover/dialog 入场 180ms、离场 140ms；移动导航入场 220ms、离场 160ms；默认无弹跳。
- [x] 动效使用 transform、opacity 和明确列出的反馈属性，位移动效使用 cubic-bezier(0.19, 1, 0.22, 1)；锚定浮层使用原语提供的 transform-origin。只让容器入场，不让内部元素再次逐项入场。
- [x] 减少动态效果时移除缩放与位移，仅保留必要的短淡入或即时更新。键盘触发的浮层即时打开；主题切换抑制组件颜色过渡；快速开关不能遗留遮罩或阻塞操作。
- [x] 运行 shell 测试，覆盖 reducedMotion: reduce、键盘打开、快速开关三次和长导航。检查录屏中的跳变与退出状态，通过后提交。

## Task 4：可审核的业务参考页面

**文件：** apps/preview/src/pages/{components,settings,items,item-detail}.tsx、src/demo-data.ts、src/router.tsx；tests/reference-pages.browser.spec.ts；docs/visual-review.md。

**接口：** React Router createBrowserRouter 路由 /components、/settings、/items、/items/:id。示例条目为 { id: string; title: string; status: 'active' | 'paused'; updatedAt: string }。所有数据标记为演示数据，状态不冒充服务端持久化。

- [x] 先写流程测试：设置页必填错误阻止保存；保存中不能重复提交；模拟失败保留输入并可重试；空列表提供恢复入口；列表中的长标题可在详情完整阅读。运行并确认目标断言失败。
- [x] 使用 emil-forms-and-inputs 制作设置页，包含主题偏好、通知开关、文本输入、字段错误与保存反馈。保持输入与控件标签关联。
- [x] 制作列表、筛选、分页和详情，手机使用可读摘要或局部滚动；次要信息进入详情，不直接丢弃。筛选后重置无效页码，缺失条目显示可返回的错误页。
- [x] 组件页覆盖默认、hover、focus、active、disabled、loading 及浮层状态；演示控制放在独立的预览控制区，避免与业务操作混淆。
- [x] 浏览器测试增加中文长标签、长标识、200% 缩放和受限高度；分别完成鼠标、键盘与触屏模拟流程。
- [x] 为 390、768、1440 宽度 × 双主题生成截图，另验 320 宽度重排。执行 emil-touch-and-accessibility 和 emil-ui-review，修复阻塞问题。
- [x] 在 visual-review.md 记录视觉参数、截图路径、交互验证及真实设备未验证项，提交可审核候选。
- [ ] 用户审核实际页面后冻结视觉基线。

## Task 5：独立模板、规范与防偏离检查

**文件：** templates/app/{package.json,index.html,vite.config.ts,tsconfig.json,src/main.tsx,src/styles.css}；DESIGN.md、AGENTS.md、docs/{tokens,layout,components,consumption}.md；scripts/{check-design,verify-consumer}.mjs；tests/design-rules.test.mjs。

**接口：** 根命令 pnpm check = 类型检查 + 单元测试 + 构建 + 设计规则；pnpm test:e2e 执行浏览器验证；pnpm verify:consumer 打包两个包并在独立模板副本中安装、构建和启动浏览器验收。首次使用时创建这些命令，不能提前声称可执行。

- [x] 从已完成样板提炼最小模板，保留单页示例、路由、外壳和主题接入；不复制共享组件源码。
- [x] 使用 emil-design-system-docs 按实际代码编写 DESIGN.md 和组件规则；根入口少于 100 行，主题文档每份少于 150 行。示例必须能通过类型检查。
- [x] AGENTS.md 固定用户指定技能、文档读取入口、允许导入、组件更新方式、例外记录和交付证据。缺少本机技能的 Agent 使用仓库内明确规则，并报告技能未执行。
- [x] 先写 check-design 测试：消费源码原始色值、任意字号/间距 utility、基础组件直引 Radix、跨包 src 导入触发失败；共享包受控实现与带理由的局部例外允许。使用现有 TypeScript 解析能力检查导入，窄范围扫描 CSS/utility，不构建通用静态分析框架。
- [x] 实现检查并将基础组件复制列入人工审查项，不声称简单扫描能识别任意改名复制。运行 node --test tests/design-rules.test.mjs 验证正常和违规样本。
- [x] verify-consumer 在仓库内 .verification/ 创建忽略跟踪的独立副本，避免父 workspace 解析；安装包 tarball，并检验双主题、类型、CSS、资源路径和单一 React 实例。
- [x] 按 emil-design-system-docs 的要求，让独立 Agent 仅凭入口文档和一个页面需求制作测试页；记录规则偏离，优先修文档或共享组件，再重跑验证。
- [x] 运行 pnpm check、pnpm test:e2e、pnpm verify:consumer，整理实际结果。只将通过的验证记为完成；提交后提供预览入口、接入文档和剩余限制。

## 交付与执行建议

建议由当前 Agent 顺序实施，保持主题、组件和页面布局的上下文连续；独立 Agent 仅用于规则可用性验证和最终复核。任务之间按验证通过的结果提交，不为增加提交数拆分同一项交付。

用户已批准本计划和当前会话顺序执行方式。首版样板、模板与接入验证已完成；视觉确认和真实设备验收保持待审核，不假称用户已确认。


## 2026-09-29 第一版设计底座

- [x] 盘点既有包、模板和示例，保留现有结构。
- [x] 设置/认证接入共享状态按钮，复核已有浮层动效；高频查询/图表切换即时。
- [x] 固定v1双主题、响应式、状态、图标、通知和动效约定；提取已重复的PageState。
- [x] 模板直接依赖Lucide、补路由错误/404，生成器产出可移动的本地tarball项目。
- [x] 分离消费/维护入口；补真实数据、复制提示词、交付检查和授权issue反馈约定。
- [x] 构建、规则、66项浏览器回归、独立模板安装与截图检查；见docs/v1-acceptance.md。
- [ ] 用户视觉/动效体验、真机/其他浏览器验收。
- [ ] 后续任务：独立Agent接入验证、老系统重构试点（本轮不执行）。
