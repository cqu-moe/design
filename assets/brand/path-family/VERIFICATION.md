# 矢量素材验收 · 2026-10-13

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
