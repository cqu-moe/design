# 品牌标识 · 通路

CQU Moe、Learning CLI、Schedule、Auth、QuickLogin、Feed、快速评教使用已确认的「通路」标识家族。共同特征是连续曲线、带状交叠和负空间；每个服务有独立轮廓，不以首字母作为身份。

| 产品 | 图形 | 浅底 / 深底色 |
| --- | --- | --- |
| CQU Moe | 折叠立方与开放负空间：校园工具统一入口 | `#6951A5` / `#C1B4EF` |
| Learning CLI | 书页与命令提示符：学习资源、命令行访问 | `#327354` / `#A0C9B2` |
| Schedule | 日历页与流动带：课表订阅、持续同步 | `#1C50AA` / `#99BFFF` |
| Auth | 带状锁：统一认证、可信连接 | `#089891` / `#89CCC7` |
| Feed | 通知叠页与汇聚带：通知采集、阅读与存档 | `#B13758` / `#F6A3B1` |
| QuickLogin | 环绕入口的带：登录状态同步、顺畅通行 | `#EB6433` / `#F6A88D` |
| 快速评教 | 评价气泡、勾选与环绕带：反馈、核对、确认 | `#A66B18` / `#DEB588` |

## 选用与接入

- 页面入口建议 24 或 32px，图文间距 12px；保留完整 64 × 64 viewBox 与内部留白。等比缩放，不镜像、旋转、描边或添加效果。
- CQU Moe / Learning CLI / Schedule / Auth / Feed 页面使用纯黑 `logo-black.svg` 与纯白 `logo-white.svg`，融入黑白界面。QuickLogin 页面与扩展、快速评教页面使用彩色 `logo.svg` / `logo-dark.svg`。有手动主题选择的页面依据实际 `data-theme` 切换，不能仅依据系统颜色偏好；只跟随系统主题的内容站可与页面一致使用 `prefers-color-scheme`。
- favicon 使用 `favicon.svg`，按系统浅深主题自动适配，`favicon.ico` 回退；触屏书签使用 `icon-192.png`。扩展工具栏使用对应尺寸的 `icon-*.png`。
- 16px 只用于 favicon / 扩展工具栏，层叠细节会弱化；不用于小于 16px 的场景。
- 旁边已有产品名时，图片 `alt=""`；独立展示时提供产品名。链接给出明确的可访问名称，保留键盘焦点与 44px 命中区域。
- CQU Moe / Learning CLI / Schedule / Auth / Feed 的品牌色限于标识内容；QuickLogin 经确认使用暖橙色主题，快速评教经确认使用赭金主题，均通过局部语义变量覆盖主操作、开关、焦点与链接。正文仍保持中性色，错误等状态保留原有语义色，功能图标仍用 Lucide。外部图片加载 `logo-current.svg` 不会继承页面的 currentColor。

## 唯一来源与预览

design 仓库的 `assets/brand/path-family/` 是素材源，`source/marks.json` 是可编辑的路径与配色，`source/reference/approved-concept.png` 是确认稿。详尽留白、变体和来源记录随素材包的 README 分发。

运行 `pnpm build && pnpm dev` 后打开 `/brand`，查看双主题预览并下载完整 ZIP；`/brand/index.html` 提供彩色、黑白及小尺寸对照。构建自动复制素材到忽略跟踪的预览 public 目录，禁止在那里修改源文件。

素材独立于 theme / ui 包发布，不要求消费项目为 Logo 升级共享组件。安装包内附本说明，实际素材从 design 仓库或其预览站素材包取得。

## 更新与同步

在 design 仓库根目录运行，需要 Node、现有 Playwright Chromium；ZIP 打包只使用 Python 3 标准库。

```sh
pnpm brand:build
pnpm brand:verify
# 验证报告更新后重新收录哈希和素材包
python3 scripts/package-brand.py
pnpm brand:sync cqu-moe /path/to/cqu.moe
pnpm brand:check cqu-moe /path/to/cqu.moe
pnpm brand:sync learning /path/to/learning
pnpm brand:sync schedule /path/to/schedule
pnpm brand:sync auth /path/to/auth
pnpm brand:sync quicklogin /path/to/quicklogin
pnpm brand:sync feed /path/to/feed
pnpm brand:check feed /path/to/feed
pnpm brand:sync jxzljc /path/to/jxzljc
pnpm brand:check jxzljc /path/to/jxzljc
```

同步只覆盖命名明确的品牌资源，并逐项校验 SHA-256。Feed 资源写到 `public/brand/`；Schedule / Auth 网页资源写到 `frontend/public/brand/`；QuickLogin 与快速评教写到 `website/public/brand/`，其中 QuickLogin 另更新扩展的 `public/brand/` 双主题标识和四个 `public/icons/icon-*.png`。组件与 HTML 引用需在消费仓库维护；已有兼容路径若继续使用，也需同步或移除引用，避免保留旧标。

完成各仓库构建与浏览器检查后，按各自发布流程交付。素材同步、仓库提交、站点部署和 Chrome Web Store 发布是不同步骤。不要从 design 的构建脚本自动改写业务仓库或部署它们。

本次不改变 UI / theme API 或主题变量，包版本保持 1.1.0。接入验证见 design 仓库 `docs/brand-integration.md`，素材本体的验证见素材包 `VERIFICATION.md`。

Feed 的独立确认稿保存于 `source/reference/feed-approved-concept.png`。页面使用黑白版本，favicon 为彩色；接入仅涉及品牌资源和入口，不改变通知业务。

2026-10-16：新增 CQU Moe（用户选择的 A 版折叠立方）与 Learning CLI（书页与命令提示符）。独立确认稿分别为 `source/reference/cqu-moe-approved-concept.png` 与 `learning-approved-concept.png`。主站页面使用黑白标识，favicon 使用紫色立方；Learning CLI 在主站的服务入口使用黑白书页。主站同步命令同时维护六枚标识、根 favicon / 触屏图标和 `public/brand/manifest.json` 的来源哈希；Learning 仓库同步目标为 `assets/brand/`。

2026-10-20：新增用户确认的快速评教标识，来源 `source/reference/jxzljc-approved-concept.png`，图形取自原 PNG 裁切区域 `[116,104,548,478]`。标准色 `#A66B18`，深底色 `#DEB588`；页面与官网入口使用彩色双主题标识和赭金主题。原 mask 与矢量的 alpha≥128 二值 IoU 为 0.9884677636903156，只代表栅格化边缘拟合误差，不宣称逐像素 100% 相同。
