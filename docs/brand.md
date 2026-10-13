# 品牌标识 · 通路

Schedule、Auth、QuickLogin 使用已确认的「通路」标识家族。共同特征是连续曲线、带状交叠和负空间；每个服务有独立轮廓，不以首字母作为身份。

| 产品 | 图形 | 浅底 / 深底色 |
| --- | --- | --- |
| Schedule | 日历页与流动带：课表订阅、持续同步 | `#1C50AA` / `#99BFFF` |
| Auth | 带状锁：统一认证、可信连接 | `#089891` / `#89CCC7` |
| QuickLogin | 环绕入口的带：登录状态同步、顺畅通行 | `#EB6433` / `#F6A88D` |

## 选用与接入

- 页面入口建议 24 或 32px，图文间距 12px；保留完整 64 × 64 viewBox 与内部留白。等比缩放，不镜像、旋转、描边或添加效果。
- Schedule / Auth 页面使用纯黑 `logo-black.svg` 与纯白 `logo-white.svg`，融入黑白界面。QuickLogin 页面与扩展使用彩色 `logo.svg` / `logo-dark.svg`。页面内切换依据实际 `data-theme`，不能仅依据系统颜色偏好。
- favicon 使用 `favicon.svg`，按系统浅深主题自动适配，`favicon.ico` 回退；触屏书签使用 `icon-192.png`。扩展工具栏使用对应尺寸的 `icon-*.png`。
- 16px 只用于 favicon / 扩展工具栏，层叠细节会弱化；不用于小于 16px 的场景。
- 旁边已有产品名时，图片 `alt=""`；独立展示时提供产品名。链接给出明确的可访问名称，保留键盘焦点与 44px 命中区域。
- Schedule / Auth 的品牌色限于标识内容；QuickLogin 经确认使用暖橙色主题，通过局部语义变量覆盖主操作、开关、焦点与链接。正文仍保持中性色，错误等状态保留原有语义色，功能图标仍用 Lucide。外部图片加载 `logo-current.svg` 不会继承页面的 currentColor。

## 唯一来源与预览

design 仓库的 `assets/brand/path-family/` 是素材源，`source/marks.json` 是可编辑的路径与配色，`source/reference/approved-concept.png` 是确认稿。详尽留白、变体和来源记录随素材包的 README 分发。

运行 `pnpm build && pnpm dev` 后打开 `/brand`，查看双主题预览并下载完整 ZIP；`/brand/index.html` 提供黑白及小尺寸对照。构建自动复制素材到忽略跟踪的预览 public 目录，禁止在那里修改源文件。

素材独立于 theme / ui 包发布，不要求消费项目为 Logo 升级共享组件。安装包内附本说明，实际素材从 design 仓库或其预览站素材包取得。

## 更新与同步

在 design 仓库根目录运行，需要 Node、现有 Playwright Chromium；ZIP 打包只使用 Python 3 标准库。

```sh
pnpm brand:build
pnpm brand:verify
# 验证报告更新后重新收录哈希和素材包
python3 scripts/package-brand.py
pnpm brand:sync schedule /path/to/schedule
pnpm brand:sync auth /path/to/auth
pnpm brand:sync quicklogin /path/to/quicklogin
pnpm brand:check schedule /path/to/schedule
```

同步只覆盖命名明确的品牌资源，并逐项校验 SHA-256。网页资源写到 `frontend/public/brand/`，QuickLogin 写到 `website/public/brand/` 并更新扩展的 `public/brand/` 双主题标识和四个 `public/icons/icon-*.png`。组件与 HTML 引用需在消费仓库维护；已有兼容路径若继续使用，也需同步或移除引用，避免保留旧标。

完成各仓库构建与浏览器检查后，按各自发布流程交付。素材同步、仓库提交、站点部署和 Chrome Web Store 发布是不同步骤。不要从 design 的构建脚本自动改写业务仓库或部署它们。

本次不改变 UI / theme API 或主题变量，包版本保持 1.1.0。接入验证见 design 仓库 `docs/brand-integration.md`，素材本体的验证见素材包 `VERIFICATION.md`。
