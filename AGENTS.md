# 设计系统维护 Agent 入口

此文件仅面向修改 design 仓库的 Agent。子系统开发从 START-HERE.md → docs/agent-start.md 开始，复制模板内的消费 AGENTS.md，不复制本文件。维护流程见 docs/maintenance.md。

先阅读 DESIGN.md，再按任务加载对应主题文档。计划执行记录见 PLAN.md；已有系统的业务重构不在本仓库范围内。

## 指定技能

具体设计必须先用 emil-ask-emil 选择当前阶段的一至两个技能；动效必须用 animate。
布局先 foundations，配色再 color，表单用 forms-and-inputs；最后 touch-and-accessibility 与 ui-review。
技能不能覆盖本仓库已确认要求。动效冲突以 docs/motion.md 为准。
若当前 Agent 没有这些技能，遵守仓库内的具体规则，并在交付中报告未执行的技能，不伪称已使用。

## 开发边界

- 消费页面只从 @cqu-moe/ui 导入基础组件，从 @cqu-moe/theme 导入主题能力。
- 不复制 src/components/ui 到应用，不从包的 src 路径导入，不在消费页面直接导入 Radix。
- 新增通用变体须同步实现、文档与预览。先确认现有组合能否满足需求。
- 颜色、字号和间距使用语义变量与既有刻度。例外必须是局部、有原因且有结束标记的 design-exception 区块。
- 不访问真实账号、课程、考试或生产 API。演示页面不得假装已保存到服务端。
- 保留现有用户文件，非微小实现使用隔离 worktree。提交使用有效 Git 身份，签名服务不可用时先报告。
- pnpm 安装依赖，根锁文件必须提交。两包统一版本并同步模板依赖。

## 验证与报告

首次安装后先 pnpm build，再 pnpm dev。共享包源码变更后重新构建对应包。
pnpm check 验证类型、逻辑、规则与构建；pnpm test:e2e 验证浏览器；pnpm verify:consumer 验证独立安装。
对照 docs/screenshots，手工检查页面层级、长中文、主题和移动布局，不把截图文件存在视为视觉通过。
交付报告共享包版本、运行过的命令、实际结果、例外及未验证的设备。
不宣称静态扫描能检测全部复制或风格偏离，不把 Chromium 触屏模拟当作真机测试。

## 测试页任务

收到仅用于规则验证的页面任务时，在指定路径创建页面；不修改共享包、不加依赖、不接外部 API。优先使用文档中已存在的组件和页面组合。

## 缺陷与能力反馈

遵守 docs/feedback-contract.md；提醒用户并提供复现、实际/预期、影响和建议。仅在明确授权且有对应 issue 仓库时对外创建 issue，不让子系统复制修改基础组件。本轮 v1 不执行新的独立 Agent 接入验证或老系统试点。
