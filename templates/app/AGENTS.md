# 本项目的设计入口

首先阅读 node_modules/@cqu-moe/ui/dist/DESIGN.md，再按任务读取其链接文档。
这些规范、参考页面与检查器随 UI 包版本分发；不要另建一份独立演化的基础设计规范。
依赖尚未安装时先按项目 README 安装依赖，不根据组件名猜测变体。

具体设计使用 emil-ask-emil 路由当前阶段的技能，动效使用 animate。若技能不可用，遵守包内具体规则，并报告技能未执行。

- 只从 @cqu-moe/ui 公开入口导入基础组件，不直接导入 Radix，不复制基础组件源码。
- 复用 AppShell、ContentContainer、PageHeader；业务数据与权限由本项目负责。
- 使用语义变量与现有刻度，不硬编码颜色、任意字号或间距。
- 桌面与手机功能完整，支持浅色与石墨灰深色、键盘、触屏和减少动态效果。
- 交付前执行 pnpm build 和 pnpm check:design，并用本项目测试工具检查交互和页面截图。
- 报告使用的 UI 包版本、验证结果、例外及未验证设备；规则检查不等于视觉验收。

包内参考页面位于 node_modules/@cqu-moe/ui/dist/examples/pages/。使用页面组合，不复制基础组件。
