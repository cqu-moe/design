# 维护设计系统

本文件面向修改 design 仓库的维护 Agent，是维护流程和验收标准的详细来源。构建业务系统从 [START-HERE.md](../START-HERE.md) 开始。

## 结构与边界

| 路径 | 责任 |
| --- | --- |
| packages/theme/src/tokens.css、theme.ts | 双主题变量、偏好解析与首帧脚本 |
| packages/ui/src | shadcn/Radix 基础组件、外壳、状态、通知；index.ts / charts.tsx 是公开入口 |
| apps/preview/src | 业务组合参考，内存示例，不接生产 API |
| templates/app | 可复制启动项目；主入口的可运行用法是最小示例 |
| docs/ | 规范、接入与验收；随版本分发的文件由 build-ui.mjs 明确列出 |
| scripts/create-app.mjs | 创建新目录、打包并接入本地依赖，禁止覆盖现有目录 |
| scripts/verify-consumer.mjs | 通过同一生成器创建独立安装项目，验证实际包内容 |

先读 DESIGN.md，并遵守根 AGENTS.md 的指定技能和安全边界；先查已有组合，再决定扩展 API。只有重复且行为一致的部分才收进共享层；业务请求、角色权限、CRUD状态、筛选条件留给子系统。v1 抽出 PageState，因为多个列表已重复空/错反馈；未引入通用表单、数据表控制器或 CRUD 工厂。

## 修改流程

1. 在现有或新建隔离 worktree 检查当前改动；按仓库要求使用设计和动效技能。
2. 追踪公开类型、样式、现有调用和模板。新增组件同步导出、文档、示例和必要回归。
3. 用语义变量实现双主题；对移动、键盘、减少动态效果、错误恢复一起验收。
4. 首次安装后先 `pnpm build`，再 `pnpm dev`；共享包源码变更后重新构建对应包，避免浏览器误用旧 dist。
5. 运行 `pnpm check`、`pnpm test:e2e`、`pnpm verify:consumer`；按实际变更记录未适用的命令及原因。
6. 更新截图并实际查看页面层级、长中文、双主题和移动布局，记录浏览器范围、警告和人工待验项；更新版本、模板与迁移记录。
7. 不宣称静态扫描能检测全部复制或风格偏离，不把 Chromium 触屏模拟当作真机测试。
8. 交付报告共享包版本、运行过的命令、实际结果、例外及未验证的设备。
9. 提交前检查有效 Git 身份并使用配置的签名；不覆盖身份，不擅自关闭签名。签名服务不可用时先报告。

## 版本和发布

第一版契约为 1.0.0（两个包同步）。后续破坏性公开 API/变量变更升级 major，兼容新增升级 minor，修复升级 patch。视觉行为变化即使兼容也写清楚影响并重跑消费验证。

发布前同步 packages/theme、packages/ui、templates/app 的版本，更新 README、DESIGN、consumption、锁文件和随包规则。`pnpm create:app` 使用现有构建后 pack 的准确版本，不从公共 registry 猜测下载。

预览站通过根目录 wrangler.jsonc 部署到 Cloudflare Workers Static Assets；执行 pnpm deploy。当前没有 registry 发布目标，创建本地 tarball 不等于发布 npm 包。发布包、部署和对外 issue 需要用户明确授权。当前 .worktrees 与 .agent-worktrees 属于活跃工作区，不用 shell 删除。

## 文档和问题处理

安装包的规则只链接随包文件，不依赖个人绝对路径；分发测试检查本地链接及关键入口存在。

问题按 feedback-contract.md 处理；修复在共享仓库完成后交付版本、迁移方式和验证结果。临时方案有明确移除条件，避免子系统永久偏离。

独立 Agent 接入验证和老系统重构试点是后续单独任务。历史 agent-verification.md 仅记录早期一次实验，不作为本轮 v1 接入有效性的证明。
