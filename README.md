# CQU Moe Design

统一的 React 组件、双主题、页面外壳和 Agent 设计规范。基于 shadcn/ui，视觉参考 Vercel / Geist。

```sh
pnpm install
pnpm build
pnpm dev
```

打开 http://127.0.0.1:5173/settings；登录注册二合一示例位于 /auth。预览包含设置子页面、内联与全局保存、紧凑服务列表，以及 /admin 后台示例（仪表盘、图表、用户批量管理、客户端管理）。
修改共享包源码后，执行 pnpm --filter @cqu-moe/theme build 或 pnpm --filter @cqu-moe/ui build。

- [子系统 Agent 从这里开始](START-HERE.md)
- [设计系统维护入口](AGENTS.md)
- [设计规则](DESIGN.md)
- [品牌标识与素材同步](docs/brand.md)（预览 `/brand`）
- [接入其他系统](docs/consumption.md)
- [验证记录](docs/visual-review.md)

```sh
pnpm check
pnpm test:e2e
pnpm verify:consumer
```

首次运行浏览器测试需安装 Chromium：pnpm exec playwright install chromium。
需要 Node.js 22.12+ 和 pnpm 11。
包版本为 1.2.0，尚未发布到 registry。不要直接从公共 registry 安装本项目包名。

创建新子系统：`pnpm create:app ../my-subsystem`（目标目录必须不存在）。它沿用现有模板并配置可随项目分发的本地 tarball。

第一版规范、图标约定、问题反馈和人工待验项见 [v1 验收记录](docs/v1-acceptance.md)。

## 部署预览站

登录 Cloudflare 后执行 `pnpm deploy`。站点使用 Workers Static Assets，支持直接打开设置、仪表盘等前端路由。全部业务数据仍为本地演示数据。theme/ui 通过本地 tarball 分发，部署站点不代表发布 npm 包。

生产构建、桌面/手机及发布前 Firefox/WebKit 验证入口、隔离与失败证据见 [E2E 验证](docs/e2e.md)。
