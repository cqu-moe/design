# 首版交付记录

版本：theme / ui 0.1.0。全部代码在本地，未发布包、未部署网站、未迁移现有系统。

## 验证证据

- pnpm check：生产构建、TypeScript、5 项主题逻辑测试、5 项设计与分发检查测试通过。
- pnpm test:e2e：24 项 Chromium 浏览器测试通过，包含双主题、多宽度、触屏、键盘、减少动态效果、主题同步和演示业务流程。
- pnpm verify:consumer：两个 tarball 在独立应用中安装，类型和生产构建通过；React 实例一致，CSS 不依赖共享源码扫描，主题和移动导航可用。记录见 consumer-verification.json。
- 独立 Agent 只凭入口文档制作页面，主 Agent 对产物执行类型、规则及交互验证。见 agent-verification.md。
- 截图及颜色测量见 visual-review.md、screenshots/、contrast.json。

## 实施中的决定

- 原生 worktree 工具不能针对聊天目录下新建的子仓库工作，采用仓库内的 Git worktree；不涉及远程仓库。
- 第一个文档基线提交因 1Password socket 不可达而未签名。用户要求重试后，通过沙箱外 Git 调用成功，后续实现提交使用 1Password 签名。
- 保留已批准的跟随系统 / 浅色 / 深色三种偏好，没有采用外部指南的两状态建议。
- 使用单一根 tsconfig.json，避免增加无实际差异的 base 配置。
- 静态扫描约束常见原始设计值与导入路径；不能识别任意改名复制，仍需人工或 Agent 复核。
- 实际视觉参数为可审核候选，继续完成可逆的模板工作；后续视觉调整可能需要重新生成截图和发布包版本。

## 未验证与后续范围

- 用户尚未审核实际页面，视觉基线未冻结。
- 真实 iPhone / Android、软键盘、安全区域与真实浏览器缩放尚未验收。
- 本版本验证 Chromium，不把其结果推广为完整 Safari / Firefox 验收。
- registry 与命名空间待实际发布时确认，目前用本地 tarball 接入。

## 独立审查与修复

独立审查没有 Critical，发现 3 项 Important，均已补回归并修复：

- 深色危险按钮实际合成色对比度 3.59:1；移除半透明覆盖，组件浏览器对比度测试从失败转为通过。
- 主题菜单 radio item 的触屏高度约 32px；共享规则扩展到 radio、checkbox、sub-trigger，44px 测试通过。
- 独立模板缺少 Agent 规范入口；模板加入 AGENTS.md，UI 包携带版本化规则、参考页面和检查器，外部安装后可读取并运行。

外部安装验证又发现 pnpm 符号链接使检查器未执行 CLI；改为真实路径比较，加入符号链接回归，并在消费副本中故意写入违规颜色，确认检查失败后移除并重新通过。

审查明确未覆盖真实业务 API、SSR Provider、registry 发布、蓄意绕过检查器、跨浏览器/真机验收及用户视觉批准。这些均保持既定范围或待验收状态，不作为已完成事项。没有延期处理的 Minor。
