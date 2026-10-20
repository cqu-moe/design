# 统一蓝色素材验收 · 2026-10-21

- 7 个产品：Schedule、Auth、QuickLogin、Feed、Learning CLI、CQU Moe、快速评教。
- 所有 `marks.json` 记录去除旧 `color` / `darkColor` 后，与已批准版本 `c2bccbb` 逐字段相等；轮廓、比例、transform、负空间保持原样。
- 唯一色源为 `packages/theme/src/tokens.css`：浅底标识 `#0850ab`，深底标识 `#9bc0f7`，应用与扩展图标蓝底 `#195cb9`。黑白变体仅用于兼容、单色打印等场景。
- `source/build.cjs` 重建 134 张栅格图（含源稿回绘）；`source/verify.cjs` 实际解码并绘制 70 个图像样本，验证双主题 SVG、PNG、响应主题的 favicon 和 16 / 128px 图标的蓝色像素与 alpha 边缘。
- 7 组 ICO 的 16 / 32 / 48px 内嵌 PNG 与对应 PNG 文件相同；全部应用 PNG 尺寸正确。
- 标识与白底对比度 **7.65:1**，深色标识与 `#242424` 对比度 **8.34:1**。
- 320 / 390 / 768 / 1440 × 双主题共 8 组静态目录检查通过：无溢出、无断图、下载命中区至少 44px，Tab 焦点可见；21 个 SVG / PNG / ICO 下载成功，控制台错误和外部请求均为零。结果见 `qa/report.json`。
- 本节只证明生成素材与静态目录；共享包、完整预览和消费包验收另见设计仓库的蓝色交付记录。尚未接入真实消费仓库、扩展安装或部署。

以下为历史轮廓提取和旧配色验收，保留溯源；旧色值与旧数量不代表当前素材。

## 历史：矢量素材验收 · 2026-10-13

## 已完成

- 参考：用户确认的 imagegen 图，Auth 为带状锁形。原稿保存在 `source/reference/approved-concept.png`。
- 21 份产品 SVG 为原生路径，无嵌入位图、字体、外链、脚本或滤镜。主路径为贝塞尔曲线，统一 viewBox，保留各自宽高比例。
- 54 份产品 PNG 已核对 RGBA、尺寸和透明留白；16px 圆角容器角部允许 1/255 级抗锯齿覆盖。3 份 ICO 均解码出 16、32、48 三种尺寸，内嵌像素与对应 PNG 一致。
- 标准色来自确认稿取样，轻微渐变与纸面色差统一为纯色。深底版由同一色相提高明度并控制饱和度；全部位于 sRGB 色域。
- Chromium：320、390、768、1440 宽度 × 浅深主题，图片均加载，无横向溢出，点击区域至少 44px；开启减少动态效果。实看风格板、390 深色及 1440 浅色截图。
- Tab 可到达素材链接且焦点可见。通过临时本地 HTTP 服务验证 9 个 SVG / PNG / ICO 下载链接成功，无控制台错误或外部网络请求。结果见 `qa/report.json`。
- 经 emil-touch-and-accessibility 与 emil-ui-review 检查，静态目录无发现阻塞交互或可访问性的缺陷。

## 与原稿的轮廓比对

| 产品 | 二值轮廓 IoU | 超出原稿 2px 容差的面积占比 |
| --- | ---: | ---: |
| Schedule | 97.63% | 0.0223% |
| Auth | 98.46% | 0% |
| QuickLogin | 98.12% | 0.0609% |

测量在约 300–370px 的原稿裁切尺寸上执行，比较取样轮廓与 SVG 渲染；不是“与生成图逐像素完全相同”的声明。2px 约相当于最终 64 单位画布的 0.3 单位。差异主要来自边缘抗锯齿、色阈值和曲线拟合。取样 mask、描摹 SVG 和回绘 PNG 均留存。

## 对比度

| 产品 | 标准色 / 白底 | 深底色 / #242424 |
| --- | ---: | ---: |
| Schedule | 7.56:1 | 8.32:1 |
| Auth | 3.55:1 | 8.52:1 |
| QuickLogin | 3.28:1 | 8.06:1 |

以上是非文字标识的色值检查，不能用于宣称 Auth / QuickLogin 标准色可直接做普通正文色。预览正文沿用中性主题变量。

## 实际运行与范围

- Python 3.12：`prepare-trace.py`、`import-traces.py`；独立 uv 环境：VTracer 0.6.15 的 `trace.py`。
- `node assets/brand/path-family/source/build.cjs`：生成素材；使用原工作区已有的 Playwright 依赖，未增加项目依赖。
- `node assets/brand/path-family/source/verify.cjs`：8 个主题 / 宽度组合、9 个下载均通过。
- 额外 XML、PNG alpha、ICO 解码及轮廓比对检查通过；`git diff --check` 无输出。
- 接入 design 预览后，已执行 `pnpm check`（5 项单元测试、7 项规则/分发测试）、`pnpm test:e2e`（69 项）及 `pnpm verify:consumer`，全部通过。
- theme / ui 保持 1.1.0。三个产品在隔离 worktree 接入；跨仓库接入与发布状态记录在 design 仓库 `docs/brand-integration.md`。
- 本素材验收不覆盖真实手机、Safari、Firefox、Chrome 扩展安装或真实账号业务。16px 内部层叠细节会弱化，页面入口建议至少 24px。

## 本轮修复过的环境问题

- VTracer 在本机 Python 3.14 下崩溃，改用 Python 3.12 后成功。
- 纯 file URL 的下载事件不稳定，验收改用临时本地 HTTP 服务后九个下载均成功。

## Feed 扩展验收 · 2026-10-13

本节为新增第四枚标识的验证，前文三枚标识记录保留。

- `source/reference/feed-approved-concept.png` 为用户确认稿。新增 7 份 SVG、18 份 PNG、1 份 ICO；SVG 均为原生路径，无嵌入位图或外部资源。PNG alpha 与 ICO 16/32/48 解码通过。
- Feed 原稿二值轮廓与 SVG 回绘 IoU **97.84%**；超出原稿 2px 容差的面积为 **0.1230%**。原稿裁切尺寸 474×451，原比例与负空间保留。
- 标准色 `#B13758`（原稿内部取样），深底彩色 `#F6A3B1`；对比度分别为白底 **5.90:1**、石墨底 **7.98:1**。网页使用纯黑/纯白；favicon 使用彩色。
- 重跑素材验证：320、390、768、1440 × 双主题均无溢出、断图，12 个下载通过。连续下载验证改为每个下载前重载目录，避免 Chromium 对同一文档多次自动下载的限制。
- 设计仓库 `pnpm check`、`pnpm test:e2e`（69 项）、`pnpm verify:consumer` 均通过；完整素材包重新生成，前三枚产品素材字节未变。
- 实看四产品总览、静态目录双主题与 Feed 本地页面。按 emil-touch-and-accessibility、emil-ui-review 检查；页面增加固定尺寸并跟随实际主题选择黑白图，手机顶栏名称允许省略，键盘焦点可见。
- ui / theme 保持 1.1.0。未验证真实手机、Safari、Firefox；本地假数据验收不等于真实账号业务验收。生产合并状态见 PR。

## Learning CLI 与 CQU Moe 扩展验收 · 2026-10-16

- 新增两枚已确认标识：Learning CLI 书页与命令提示符、CQU Moe A 版折叠立方。每枚含 7 份 SVG、18 份 RGBA PNG、1 份三尺寸 ICO，原稿、mask、trace 与回绘 PNG 均保留。
- 原稿二值轮廓与 SVG 回绘 IoU：Learning CLI **99.06%**、CQU Moe **98.70%**；两者超出原稿 2px 容差的面积均为 **0%**。实际图形按最长边 52 单位置于 64 × 64 viewBox，不改变原稿比例。
- 标准色遵循设计稿约定：Learning CLI `#327354` / 深底 `#A0C9B2`；CQU Moe `#6951A5` / 深底 `#C1B4EF`。白底对比度分别 **5.65:1 / 6.32:1**，深底对比度 **8.49:1 / 8.16:1**。SVG 无位图、脚本、外链与滤镜，PNG 留白透明。
- 既有 Schedule / Auth / QuickLogin / Feed 产品目录逐文件与基线比较，字节不变。渲染器对一个既有 PNG 产生 6 个边缘像素差异，保留原文件，避免无关素材变化。
- `pnpm brand:verify`：320 / 390 / 768 / 1440 × 双主题共 8 组通过，18 个 SVG / PNG / ICO 下载通过，图片完整、无横向溢出、链接命中区域至少 44px，无控制台错误或外部请求。
- `pnpm check` 通过（5 项单元、7 项规则/分发测试）；`CI=1 pnpm test:e2e` **69 项通过**；`pnpm verify:consumer` 通过。构建保留已有的大于 500kB chunk 提示；Playwright 有 NO_COLOR / FORCE_COLOR 环境提示，无失败。
- 实看六产品总览与品牌预览双主题、主站桌面/窄屏和 Learning CLI 服务区截图。主站 320px 顶栏拥挤已修正，保持首页名称、账号入口与主题按钮可用。
- `pnpm brand:check cqu-moe <repo-root>` 校验主站 **15 个素材与来源清单**。主站本地 `pnpm check`、Wrangler dry run、8 组宽度/主题、系统主题相反时手动主题选择、无脚本导航、404 页和键盘焦点通过。
- emil-touch-and-accessibility / emil-ui-review：本次改动无阻塞发现；触屏模拟各操作区域至少 44 × 44px。共享 theme / ui 保持 **1.1.0**，未新增依赖。
- 范围：本地 Chromium / Ego Lite；未验证真实手机、Safari、Firefox 或各子系统账号业务。GitHub CI、合并与线上资源结果独立报告，不由本节本地验证推断。

## 快速评教扩展验收 · 2026-10-20

- 新增用户确认的快速评教标识：`source/reference/jxzljc-approved-concept.png` 为 1536 × 1024 不透明 RGB 原稿，图形取自 crop `[116,104,548,478]`。标准色 `#A66B18`，深底色 `#DEB588`；页面使用彩色双主题标识与赭金主题，不按网页黑白标识接入。
- 新增 7 份 SVG、18 份 RGBA PNG 与 1 份三尺寸 ICO。全部导出 PNG 的模式 / 尺寸核对通过：纯 logo 与 favicon 画布边缘 alpha 为 0；应用图标容器外角透明，16px 四角抗锯齿 alpha 最高 12/255。ICO 由 16 / 32 / 48 PNG 帧组成。
- 原 mask 前景与 SVG 回绘 alpha≥128 的二值 IoU 为 `0.9884677636903156`。该值只代表栅格化边缘拟合误差，不宣称与原 PNG 逐像素 100% 相同。
- `node assets/brand/path-family/source/verify.cjs`：320 / 390 / 768 / 1440 × 双主题均无溢出、断图，21 个下载通过，链接命中区域至少 44px，无控制台错误或外部请求。赭金标识对比度为白底 4.43:1、石墨底 8.18:1。
- 实看确认稿裁切、浅深 / 黑白透明版、16–192px 应用图标与 favicon；透明变体在棋盘底接触表上核对。品牌包重新生成并校验 manifest / ZIP。
- design 的 `check` 通过（构建、类型检查、5 项 Vitest、24 项 node:test 与设计规则）；`test:e2e` 桌面 / 触屏 Chromium **106 项通过**。构建保留既有的大于 500kB chunk 提示。
- 未重跑 `verify:consumer`：本次不修改共享 theme / ui 的源码、公开 API 或模板行为；消费方官网使用已有 theme 1.1.0，并单独完成素材 SHA 与浏览器检查。
- 范围：品牌素材、design 预览与上述本地回归；不覆盖快速评教真实页面、真实提交或生产部署。
