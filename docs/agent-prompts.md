# 可复制的子系统接入提示词

将方括号内容替换成实际信息。不要把未安装的包名或未知 issue 仓库当成可用服务。

## 新建子系统

```text
请在 [目标目录] 构建 [系统名与业务范围]，使用 CQU Moe Design v1。
先读 [design源码目录]/START-HERE.md、docs/agent-start.md 和 DESIGN.md，再按页面需求读取专题文档。
盘点现有文件，不覆盖用户代码。通过 pnpm create:app [全新目录] 生成模板；保留 .design tarball、锁文件和模板 AGENTS.md。
使用 @cqu-moe/ui 的公开组件、@cqu-moe/theme、lucide-react。按最近示例组合，双主题与桌面/手机功能齐全。
业务接口合同：[文档或路径]；允许访问的环境：[环境]；禁止的外部操作：[边界]。
假数据只用于开发并明确标注，不把示例定时器当接口。不要复制基础组件、覆盖 .ds-* 或新增图标库。
执行 docs/acceptance.md，交付运行入口、包版本、实际验证结果和人工待验项。
发现设计组件/模板/示例缺陷或缺口按 docs/feedback-contract.md 提醒我。当前不授权发 issue；有需要时先提供完整反馈记录。
```

## 接入已有系统

```text
请将 [仓库/子系统] 接入 CQU Moe Design v1，设计仓库位于 [路径]。
先读设计仓库 START-HERE.md、docs/agent-start.md、DESIGN.md、docs/business-integration.md；再盘点现有路由、样式、认证、API及测试。
在隔离分支/worktree 完成。先迁移 [指定页面/范围] 的外壳、控件和完整状态，保留原业务/权限/URL合同；不要顺手更换后端或认证方案。
安装同版 theme/ui 和模板锁定的 lucide-react，避免重复主题、通知容器及CSS reset。
真实数据使用现有数据层，替换所有演示内存/定时器；支持加载、空数据、错误、403和失败重试。
按 docs/acceptance.md 验证并报告迁移范围、行为变化、回滚点和待人工验收项。
设计系统问题先反馈，不复制修改共享控件。issue 授权与仓库：[未授权，或具体授权范围和仓库]。
```

## 授权创建 issue 时追加

```text
我授权你在 [owner/repo或准确URL] 为本次发现的设计系统问题创建 issue。
先检查重复项，再按 docs/feedback-contract.md 提供复现、实际/预期、影响和建议；脱敏后提交并返回链接。
此授权仅限 issue，不包括发布包、修改生产或在子系统私建组件分叉。
```

后续独立 Agent 接入验证应使用新会话与这些入口，记录其遇到的缺口；本轮不执行该验证，也不启动老系统重构试点。
