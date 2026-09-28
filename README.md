# CQU Moe Design

统一的 React 组件、双主题、页面外壳和 Agent 设计规范。基于 shadcn/ui，视觉参考 Vercel / Geist。

```sh
pnpm install
pnpm build
pnpm dev
```

打开 http://127.0.0.1:5173/settings；登录注册二合一示例位于 /auth。预览包含设置子页面、内联与全局保存、紧凑服务列表，以及 /admin 后台示例（仪表盘、图表、用户批量管理、客户端管理）。
修改共享包源码后，执行 pnpm --filter @cqu-moe/theme build 或 pnpm --filter @cqu-moe/ui build。

- [Agent 入口](AGENTS.md)
- [设计规则](DESIGN.md)
- [接入其他系统](docs/consumption.md)
- [验证记录](docs/visual-review.md)

```sh
pnpm check
pnpm test:e2e
pnpm verify:consumer
```

首次运行浏览器测试需安装 Chromium：pnpm exec playwright install chromium。
需要 Node.js 22.12+ 和 pnpm 11；本次在 Node.js 22.22.3、pnpm 11.19.0 验证。
包版本为 0.3.0，尚未发布。不要直接从公共 registry 安装本项目包名。
