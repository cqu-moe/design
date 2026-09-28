# 接入其他系统

当前包名为 @cqu-moe/theme 与 @cqu-moe/ui，版本 0.1.0，尚未发布到 registry。先使用本地 tarball；实际发布时另行确定命名空间和 registry。

## 本地完整验证

在 design 仓库根目录运行：

```sh
pnpm install
pnpm build
pnpm verify:consumer
```

脚本打包主题和 UI，在 .verification 下复制独立应用，安装 tarball、编译类型和生产代码、验证单一 React 实例，再通过浏览器检查样式、主题持久化与手机导航。它会打印可用副本路径，且不使用 workspace 源码别名。

## 创建实际项目

1. 将 templates/app 复制到新项目目录，修改项目名称。
2. 在 design 根目录运行下列命令，生成两个包：

```sh
mkdir -p artifacts
pnpm --dir packages/theme pack --pack-destination ../../artifacts
pnpm --dir packages/ui pack --pack-destination ../../artifacts
```

3. 在新项目 package.json 中把两个 0.1.0 依赖替换为各自 tarball 的 file: 绝对路径。
4. 若使用 pnpm，在新项目 pnpm-workspace.yaml 中加 theme override，让 UI 的间接依赖使用同一个 tarball：

```yaml
packages:
  - .
overrides:
  '@cqu-moe/theme': 'file:/绝对路径/cqu-moe-theme-0.1.0.tgz'
allowBuilds:
  esbuild: true
  '@parcel/watcher': true
```

5. 在新项目执行 pnpm install、pnpm build、pnpm dev。分发给他人时同时提供两个 tarball，不能留下只在个人电脑有效的 file: 路径。

发布到 registry 后移除临时 override，依赖锁定准确版本。不要把 workspace:* 直接写入外部项目。

## 样式与主题

模板的 main.tsx 已按以下顺序加载：

```tsx
import '@cqu-moe/theme/styles.css';
import '@cqu-moe/ui/styles.css';
import './styles.css';
```

消费应用 styles.css 加载一次 Tailwind reset，仅扫描自身源码；共享 UI 已提供编译后的 CSS。
不要让消费项目扫描 UI 的 src 或 dist 来补齐样式。React、React DOM 和 UI 包的 peer 范围须兼容。

ThemeProvider 包裹应用；ThemeMenu 提供外观切换。模板的 Vite 插件将 themeInitScript 注入 head，在首次绘制前应用偏好。
若部署配置 CSP，需为这段固定初始化脚本配置匹配的 nonce 或 hash；不要为方便全局开放任意内联脚本。

## 内容站

内容站可单独安装 theme 并引入 styles.css，使用语义变量。无脚本时 CSS 跟随系统主题。
需要手动偏好时，从 theme 导入 themeInitScript，在站点框架的 head 模板中执行，并复用导出的解析/应用函数。
React ThemeProvider 当前面向客户端应用；不要直接在 SSR 环境调用。内容站保留自己的渲染框架。

## 更新

修改共享包后先通过 check、test:e2e、verify:consumer，再同步两个包版本、模板依赖和锁文件。
如果公开 API、主题变量或视觉行为发生变化，记录具体迁移说明并重新检查消费页面。单独复制旧组件不属于升级方式。

## Agent 随包入口

复制模板时保留 AGENTS.md。它指向安装包内的 dist/DESIGN.md，规则、主题说明、组件用法、参考页面与检查器随 UI 版本一起升级。
消费项目执行 pnpm check:design；检查器使用 TypeScript，模板已安装这个可选 peer dependency。它不进入应用运行时 bundle。
脱离源码仓库后，仍可读取 node_modules/@cqu-moe/ui/dist/docs/ 与 dist/examples/，无需依赖个人电脑的 design 绝对路径。
