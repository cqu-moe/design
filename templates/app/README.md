# 应用模板

从 design 仓库复制本目录后，按其 docs/consumption.md 配置两个本地 tarball 或已发布版本，然后运行：

```sh
pnpm install
pnpm build
pnpm check:design
pnpm dev
```

安装后，Agent 从 AGENTS.md 进入已安装 UI 包内的 DESIGN.md。
共享样式已编译，无需扫描依赖源码。仅由本应用加载一次 Tailwind reset。
