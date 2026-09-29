# 从这里开始

这是 CQU Moe 第一版设计底座（theme / ui **1.1.0**）。React + TypeScript + React Router + Tailwind + shadcn/ui，浅色与石墨灰深色，桌面和手机使用同一套组件。

- **正在构建或重构子系统**：读 [子系统 Agent 接入入口](docs/agent-start.md)，再读 [设计规范](DESIGN.md)。复制任务指令用 [接入提示词](docs/agent-prompts.md)。
- **正在维护此设计系统**：源码仓库的 AGENTS.md 是维护入口，具体流程见 [维护指南](docs/maintenance.md)。不要把维护指令复制到子系统。
- **发现缺陷或缺少能力**：按 [问题反馈约定](docs/feedback-contract.md) 提醒用户，取得明确授权后才向指定仓库创建 issue。
- **查看本轮成果**：读 [v1 验收记录](docs/v1-acceptance.md)。自动验证完成不等于用户视觉批准或真机验收。

包尚未发布到 registry。源码仓库运行 `pnpm create:app ../你的项目名` 创建带本地安装包的项目；脱离源码仓库后使用一起分发的 tarball 和模板。详细步骤见 [安装与升级](docs/consumption.md)。
