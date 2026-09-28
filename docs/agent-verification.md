# 历史记录：早期独立 Agent 接入验证

这是 v1 固化之前的一次实验，不代表本轮新版接入入口已由独立 Agent 验收。本轮按用户要求延后新的独立 Agent 验证和老系统试点。

任务：仅凭 AGENTS.md、DESIGN.md 及需要的链接文档，制作中文通知偏好页，包含邮箱、开关与本地保存反馈。

Agent 未读取 SPEC.md、PLAN.md 或现有业务页面；读取了布局、组件、主题文档和公开导出入口。产物为 apps/preview/src/agent-probe.tsx，在 /agent-probe 展示。

产物复用 PageHeader、Label、Input、Switch、Button，没有基础组件复制、新增依赖或外部 API，也没有原始颜色。状态明确说明只在当前页面有效。

反馈暴露两个文档缺口：简单表单的布局方法、同步演示是否需要 loading。已在 layout.md 补充规则，允许语义变量布局，并禁止伪造同步操作的加载过程。

主 Agent 已通过类型检查、规则扫描及邮箱校验、开关、本地保存反馈的浏览器测试。一次样本验证不能证明所有未来任务零偏离。
