# 设计系统维护 Agent 入口

此文件仅面向修改 design 仓库的 Agent。完整维护流程必须执行 [docs/maintenance.md](docs/maintenance.md)；子系统开发从 [START-HERE.md](START-HERE.md) 开始。

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
- 保留现有用户文件，非微小实现使用隔离 worktree。
- pnpm 安装依赖，根锁文件必须提交。两包统一版本并同步模板依赖。

## 验证与报告

首次安装、共享包构建、验证命令、浏览器检查和交付报告以 docs/maintenance.md 为准；其中的完成条件必须全部满足。

## 测试页任务

收到仅用于规则验证的页面任务时，在指定路径创建页面；不修改共享包、不加依赖、不接外部 API。优先使用文档中已存在的组件和页面组合。

## 缺陷与能力反馈

遵守 [docs/feedback-contract.md](docs/feedback-contract.md)；按其记录和授权边界处理 issue，不让子系统复制修改基础组件。

## Agent skills

- Issue tracker：处理 issue、规格或任务拆分前，读 [GitHub Issues 约定](docs/agents/issue-tracker.md)。
- Triage labels：分类或变更 issue 状态前，读 [标签映射](docs/agents/triage-labels.md)。
- Domain docs：探索领域、命名或设计决策前，读 [领域文档约定](docs/agents/domain.md)。
- 技能按任务选用：排障用 diagnosing-bugs，模块边界用 codebase-design，领域术语与 ADR 用 domain-modeling，代码审查用 code-review，PR 描述用 pr；修改 Agent 文档用 writing-for-agents。已安装 Matt 插件时优先使用 mattpocock-skills 命名空间；技能不可用时按仓库约定完成任务并说明缺失。
