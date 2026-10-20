# CQU Moe Logo 素材包 · v1

2026-10-13。以用户确认的 imagegen 概念稿为依据，复刻 Schedule、Auth、QuickLogin、Feed 四枚标识。2026-10-16 增补用户确认的 Learning CLI 与 CQU Moe A 版；2026-10-20 增补用户确认的快速评教标识。打开 `index.html` 查看素材目录，`overview.png` / `overview.svg` 为总览。

## 标识与色板

| 产品 | 造型含义 | 浅底标准色 | 深底彩色版 |
| --- | --- | --- | --- |
| Schedule | 叠放的日历页与流动带，表达课表订阅及持续同步 | `#1C50AA` | `#99BFFF` |
| Auth | 锁形与交叠带，表达统一认证及可信连接 | `#089891` | `#89CCC7` |
| Feed | 通知叠页与汇聚带，表达通知采集、统一阅读与存档 | `#B13758` | `#F6A3B1` |
| QuickLogin | 环绕入口的连续带，表达登录状态自动同步与顺畅通行 | `#EB6433` | `#F6A88D` |
| 快速评教 | 评价气泡、勾选与环绕带，表达学生反馈、逐项核对与确认提交 | `#A66B18` | `#DEB588` |

七枚标识保留确认稿的轮廓、倾斜角度与各自比例。它们以同类曲线、带状交叠和负空间建立家族关系，命名更换或首字母重复不影响图形身份。色值从原稿内部取样；生成图中的轻微色差与底纹规范为单一填色。OKLCH 和 sRGB 表示保存在 `palette.json`。

## 文件选择

每个产品都有独立目录：`schedule/`、`auth/`、`quicklogin/`、`feed/`、`learning/`、`cqu-moe/`、`jxzljc/`。

| 文件 | 用法 |
| --- | --- |
| `logo.svg`、`logo-{512,1024}.png` | 浅底彩色标识，背景透明 |
| `logo-dark.svg`、`logo-dark-{512,1024}.png` | 深底彩色标识，背景透明 |
| `logo-black.svg`、`logo-black-{512,1024}.png` | 纯黑标识，背景透明 |
| `logo-white.svg`、`logo-white-{512,1024}.png` | 纯白标识，背景透明 |
| `logo-current.svg` | 内联 SVG，可跟随 `currentColor`；通过 `<img>` 加载不会继承外部文字色 |
| `app-icon.svg`、`icon-{16,32,48,128,192,512,1024}.png` | 白色标识与品牌色圆角容器，容器外角透明 |
| `favicon.svg` | 独立标识，按系统浅深主题切换颜色 |
| `favicon-{16,32,48}.png`、`favicon.ico` | 固定浅底色图标；ICO 含 16、32、48 三个分辨率 |

SVG 内为可编辑的贝塞尔路径，可在 Figma、Illustrator、Inkscape 中继续编辑；没有嵌入 PNG、字体、外链或脚本。标识与产品名分开提供，风格板上的文字不属于标识路径。

## 使用规范

- 使用完整的 `0 0 64 64` viewBox。实际图形最长边约 52 单位，外留白至少约 6 单位；紧邻文字或其他元素时，再留出不少于画布宽度 1/8 的间距。
- 品牌入口建议使用 24 或 32px；16px 仅作为 favicon / 扩展工具栏图标，内部叠层细节会弱化。低于 16px 不支持。此版小图保留主图轮廓，未另造简化标志。
- CQU Moe / Learning CLI / Schedule / Auth / Feed 页面品牌入口：浅底纯黑、深底纯白。QuickLogin 页面与扩展、快速评教页面：浅底标准色、深底 `logo-dark`。所有产品 favicon 使用彩色版。应用图标容器保留白色标识。扩展优先用 `icon-*`，避免依赖浏览器工具栏底色。
- favicon 优先用自适应 SVG，ICO 作为回退；PNG / ICO 不会自动切换颜色。
- 等比缩放，保留原有倾斜角度；不拉伸、不镜像、不添加描边、阴影、渐变，不交换各产品的颜色和图形。
- CQU Moe / Learning CLI / Schedule / Auth / Feed 的品牌色只用于标识及品牌内容；QuickLogin 使用经确认的暖橙主题，快速评教使用经确认的赭金主题，均以局部语义变量管理强调色。品牌标识的非文字对比度不代表这些颜色可直接用于正文。
- 并排文字采用现有产品字体，准确写作 `Schedule`、`Auth`、`QuickLogin`、`Feed`、`快速评教`。有可见产品名时图片用 `alt=""`；独立出现时写明产品名；作为链接时给链接明确的可访问名称。

## 来源与维护

确认稿保存在 `source/reference/approved-concept.png`。它由本会话 imagegen 生成，用户确认的是 Auth 改成带状锁形的版本。已否定的字母版、旋转钥孔版及工具图标版都不是本素材包的依据。

使用 [VTracer](https://github.com/visioncortex/vtracer) 0.6.15 提取平滑曲线，标准化到统一 viewBox，并对原稿轮廓、透明度、浅深背景及小尺寸进行了检查。描摹后的可维护主源为 `source/marks.json`；无需每次修改都重新描摹位图。

仓库安装现有依赖及 Playwright Chromium 后，在仓库根目录重建：

```sh
node assets/brand/path-family/source/build.cjs
node assets/brand/path-family/source/verify.cjs
```

仅在更换确认稿、需要重新提取轮廓时使用 `prepare-trace.py`、`trace.py`、`import-traces.py`，详见 `source/REBUILD.md`。没有向项目添加运行时依赖。

产品接入以 design 仓库的 `docs/brand.md` 和同步脚本为准；素材包可独立使用。共享 theme / ui 仍为 1.1.0。素材检查范围与限制见 `VERIFICATION.md`。

Feed 使用单独确认的 `source/reference/feed-approved-concept.png`；按同一规则提取路径与颜色。页面用黑白 SVG，favicon 用彩色。

## Learning CLI 与 CQU Moe · 2026-10-16

Learning CLI 为书页与命令提示符，标准色 `#327354`；CQU Moe 为用户选定的 A 版折叠立方，标准色 `#6951A5`。它们的原稿、提取 mask 与可编辑路径一并保留在 `source/reference/` 与 `source/marks.json`。两枚新标识使用设计稿约定的品牌色，将生成图内轻微色差统一为纯色；深底色由相同 OKLCH 色相提高明度生成，精确值见 `palette.json`。

主站的页头和 Learning CLI 入口跟随页面 `data-theme` 使用纯黑或纯白；favicon 保留各自彩色。两者使用现有 64 × 64 viewBox 和约 52 单位最长边，保留原稿比例。CQU Moe 原稿包含三个候选，仅 A 的轮廓被收录。

## 快速评教 · 2026-10-20

快速评教为评价气泡、勾选与环绕带，来源是用户 2026-10-20 确认的 `source/reference/jxzljc-approved-concept.png`，图形取自原 PNG 裁切区域 `[116,104,548,478]`。标准色 `#A66B18`，深底色 `#DEB588`；页面使用彩色双主题标识与赭金主题。原 mask 与矢量的 alpha≥128 二值 IoU 为 0.9884677636903156，仅说明栅格化边缘拟合误差。
