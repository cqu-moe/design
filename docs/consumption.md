# 安装、创建项目与升级

当前 @cqu-moe/theme 与 @cqu-moe/ui **1.1.0** 尚未发布到 registry。使用本地 tarball，不要执行从公共 registry 安装这两个包的命令。

## 从源码创建新项目（推荐）

设计仓库根目录：

```sh
pnpm install
pnpm create:app ../my-subsystem
```

命令先构建，再创建新目录、复制模板、打包 theme/ui 到新项目 .design/，写入相对 file: 依赖和 pnpm theme override。目标已存在时直接拒绝，不覆盖用户文件。它不自动安装、不提交 Git、不连接业务 API。

新项目目录：

```sh
pnpm install
pnpm build
pnpm check:design
pnpm dev
```

默认 http://127.0.0.1:5174，Node.js 22.12+、pnpm 11。修改项目名和页面标题；提交 .design/*.tgz、pnpm-workspace.yaml、package.json 和锁文件以便复现。

## 接入已有项目 / 手工分发

在设计仓库先 `pnpm build`，再打包：

```sh
mkdir -p artifacts
pnpm --dir packages/theme pack --pack-destination ../../artifacts
pnpm --dir packages/ui pack --pack-destination ../../artifacts
```

把两个 tgz 复制到业务项目 .design/。按模板合并依赖（不要覆盖业务 package.json）：

```json
{
  "dependencies": {
    "@cqu-moe/theme": "file:./.design/cqu-moe-theme-1.1.0.tgz",
    "@cqu-moe/ui": "file:./.design/cqu-moe-ui-1.1.0.tgz",
    "lucide-react": "1.48.0"
  },
  "scripts": {
    "check:design": "node node_modules/@cqu-moe/ui/dist/check-design.mjs src"
  }
}
```

UI 的 peerDependencies 要求 React/React DOM ^19.0.0；检查器需要 TypeScript >=5.9 <8（模板已装）。模板还锁定 React Router 7、Vite、Tailwind 的实际验证版本，详情以模板 package.json 为准。旧系统不兼容时先规划依赖迁移，不使用强制 peer 忽略。

在已有 pnpm-workspace.yaml 合并以下配置；monorepo 保留原 packages 列表，调整 tarball 路径相对于 workspace 根目录，不覆盖整个文件：

```yaml
packages:
  - .
overrides:
  '@cqu-moe/theme': 'file:./.design/cqu-moe-theme-1.1.0.tgz'
allowBuilds:
  esbuild: true
  '@parcel/watcher': true
```

运行 pnpm install 并提交锁文件。业务项目的 AGENTS.md 合并模板的消费规则，不覆盖原有项目约束。

## 根入口和样式

```tsx
import '@cqu-moe/theme/styles.css';
import '@cqu-moe/ui/styles.css';
import './styles.css';
// 渲染一次：<ThemeProvider><RouterProvider router={router} /><Toaster /></ThemeProvider>
```

业务 styles.css 加载一次 Tailwind reset，仅扫描自身源码（见模板）；不要扫描 UI 的 src/dist 补样式。共享包已经编译 CSS，React 实例必须一致。模板 Vite 配置把 themeInitScript 注入 head，在首帧应用偏好；已有构建工具按其 HTML 插件接入同一脚本。部署 CSP 时配置匹配 hash 或 nonce，不全局开放任意内联脚本。

完整根入口、路由、Lucide、PageState 和通知组合在 templates/app/src/main.tsx。安装包内也携带 dist/template/，无需个人绝对路径即可阅读模板与对应规则。

## 更新和内容站

维护者提供同版本的两个 tarball 及迁移说明，业务项目替换依赖/override、运行 pnpm install，再执行 acceptance.md。不要直接改 node_modules 或留旧组件分叉。0.4 → 1.0 为兼容新增 PageState、模板图标/错误页/生成器和消费文档；设置/认证示例改用 ActionButton。

内容站可仅使用 theme/styles.css；无脚本跟随系统，有手动偏好时在框架 head 接入 themeInitScript。当前 React ThemeProvider 面向客户端，不支持直接 SSR 使用；内容站保留自己的渲染框架。

设计仓库的 `pnpm verify:consumer` 通过同一生成器建立独立应用，安装实际 tarball、构建并验证样式/主题/图标/通知/导航。它是技术安装验证，不是独立 Agent 接入验证。
