# 品牌标识 · 通路

CQU Moe、Learning CLI、Schedule、Auth、QuickLogin、Feed、快速评教使用已确认的「通路」标识家族。共同特征是连续曲线、带状交叠和负空间；每个服务有独立轮廓，不以首字母作为身份。

## 已确认的统一方向

2026-10-21 用户确认蓝色为全产品统一品牌色，替代逐产品配色及 QuickLogin 暖橙例外。页面 Logo、favicon、扩展工具栏与应用图标全部纳入；产品身份由轮廓和名称区分。颜色角色与当前可用范围见 [主题变量](tokens.md)，页面用途见 [产品页面](product-pages.md)。

| 产品         | 保留的图形                                 |
| ------------ | ------------------------------------------ |
| CQU Moe      | 折叠立方与开放负空间：校园工具统一入口     |
| Learning CLI | 书页与命令提示符：学习资源、命令行访问     |
| Schedule     | 日历页与流动带：课表订阅、持续同步         |
| Auth         | 带状锁：统一认证、可信连接                 |
| Feed         | 通知叠页与汇聚带：通知采集、阅读与存档     |
| QuickLogin   | 环绕入口的带：登录状态同步、顺畅通行       |
| 快速评教     | 评价气泡、勾选与环绕带：逐项核对、认真评价 |

**当前边界：** design 源码使用 theme 1.2.0 的品牌 token 生成 7 个产品的共享蓝色素材，并保留各自已确认轮廓。真实消费仓库是否已更新，以各自仓库记录为准；不要把设计源码状态说成消费产品已迁移或上线。

## 选用与接入

- 页面入口建议 24 或 32px，图文间距 12px；保留完整 64 × 64 viewBox 与内部留白。等比缩放，不镜像、旋转、描边或添加效果。
- 没有已确认图形的新产品先显示产品名，不用首字母徽章或临时几何形冒充正式 Logo；虚构演示产品也遵守此规则。
- 统一后的页面标识使用蓝色浅深变体，依据实际 `data-theme` 切换，不能仅依据系统颜色偏好。保留 `logo-black.svg` / `logo-white.svg` 供单色印刷、轮廓验收与反白场景；不能再为单个产品指定专属颜色。
- favicon 使用 `favicon.svg`，按系统浅深主题自动适配，`favicon.ico` 回退；触屏书签使用 `icon-192.png`。扩展工具栏使用对应尺寸的 `icon-*.png`。
- 16px 只用于 favicon / 扩展工具栏，层叠细节会弱化；不用于小于 16px 的场景。
- 旁边已有产品名时，图片 `alt=""`；独立展示时提供产品名。链接给出明确的可访问名称，保留键盘焦点与 44px 命中区域。
- 工作界面的主操作与开关沿用中性语义；品牌色用于标识、链接与焦点。成功、警告、错误保留状态色，功能图标仍用 Lucide。外部图片加载 `logo-current.svg` 不会继承页面的 currentColor；使用正式浅深素材，不能假设外部 SVG 会自动变蓝。
- 并排检查全部产品的 16 / 24 / 32px 图形。若同色后难以区分，修订小尺寸轮廓；不通过恢复产品专属色解决。

## 唯一来源与预览

```tsx
// 正确：ThemeProvider 内按实际主题选用蓝色文件
const { resolvedTheme } = useTheme();
<img src={`/brand/jxzljc/${resolvedTheme === 'dark' ? 'logo-dark.svg' : 'logo.svg'}`} alt="" width={32} height={32} />
// 错误：外部 SVG 的 currentColor 不继承页面颜色，不能作为默认蓝色 Logo
<img src="/brand/jxzljc/logo-current.svg" alt="" width={32} height={32} />
```

design 仓库的 `assets/brand/path-family/` 是素材源。`source/marks.json` 只保存轮廓路径、变换、尺寸和含义；颜色由生成器直接读取 `packages/theme/src/tokens.css`。每个产品的确认稿与提取记录保存在 `source/reference/`。详尽留白、变体和来源记录随素材包 README 分发。

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
pnpm brand:sync jxzljc /path/to/jxzljc
pnpm brand:check <product> /path/to/<repo>
```

同步只覆盖命名明确的品牌资源，并逐项校验 SHA-256。网页侧统一分发蓝色双 Logo、黑白兼容 Logo、应用图标、favicon 和 `icon-16/32/48/128/192/512.png`。Feed 资源写到 `public/brand/`；Schedule / Auth 写到 `frontend/public/brand/`；QuickLogin 与快速评教写到 `website/public/brand/`；Learning CLI 写到 `assets/brand/`。主站同步 7 个产品的 4 个 Logo 变体并维护根 favicon、触屏图标与 `public/brand/manifest.json`。

QuickLogin 额外更新扩展 `public/brand/logo.svg`、`public/brand/logo-dark.svg` 和 `public/icons/icon-16/32/48/128.png`。组件与 HTML 引用需在消费仓库维护；已有兼容路径若继续使用，也需同步或移除引用，避免保留旧标。

完成各仓库构建与浏览器检查后，按各自发布流程交付。素材同步、仓库提交、站点部署和 Chrome Web Store 发布是不同步骤。不要从 design 的构建脚本自动改写业务仓库或部署它们。

当前 theme / UI 基线为 1.2.0；品牌 token 是主题 API 的一部分，Button 变体集合不变。素材验证结果以运行后更新的 `VERIFICATION.md` 和 `qa/report.json` 为准；消费接入记录见 `docs/brand-integration.md`。

## 历史来源（配色已被统一蓝色决策取代）

Feed 的独立确认稿保存于 `source/reference/feed-approved-concept.png`。当时页面使用黑白版本，favicon 为彩色；接入仅涉及品牌资源和入口，不改变通知业务。

2026-10-16：新增 CQU Moe（用户选择的 A 版折叠立方）与 Learning CLI（书页与命令提示符）。独立确认稿分别为 `source/reference/cqu-moe-approved-concept.png` 与 `learning-approved-concept.png`。主站页面使用黑白标识，favicon 使用紫色立方；Learning CLI 在主站的服务入口使用黑白书页。主站同步命令同时维护六枚标识、根 favicon / 触屏图标和 `public/brand/manifest.json` 的来源哈希；Learning 仓库同步目标为 `assets/brand/`。

2026-10-20：新增用户确认的快速评教标识，来源 `source/reference/jxzljc-approved-concept.png`，图形取自原 PNG 裁切区域 `[116,104,548,478]`。标准色 `#A66B18`，深底色 `#DEB588`；页面与官网入口使用彩色双主题标识和赭金主题。原 mask 与矢量的 alpha≥128 二值 IoU 为 0.9884677636903156，只代表栅格化边缘拟合误差，不宣称逐像素 100% 相同。
