# 重建素材

常规几何编辑：修改 `marks.json` 的路径、外层 transform 或尺寸，然后运行 `node assets/brand/path-family/source/build.cjs`。渲染使用仓库已有的 `@playwright/test` 和本机 Chromium。路径坐标与外层 transform 保留了确认稿比例。

品牌颜色不属于 `marks.json`。生成器直接读取 `packages/theme/src/tokens.css` 的 `--brand-ink` 与浅色 `--brand-solid`；修改颜色先按主题维护流程更新 token，再重建素材并同步 theme / ui 版本。`reference/extraction.json` 中的历史 hex 只记录当时取色，不参与当前输出。

只有更换确认稿时才需要完整描摹流水线（在仓库根目录运行）：

```sh
# 使用已有的 Python 3.12、Pillow、numpy、OpenCV；默认输入为保留的确认稿。
python3 assets/brand/path-family/source/prepare-trace.py
# VTracer 在独立 uv 环境中运行，不写入仓库依赖；此版本已用 Python 3.12 验证。
uv run --python 3.12 --with vtracer==0.6.15 python assets/brand/path-family/source/trace.py
python3 assets/brand/path-family/source/import-traces.py
node assets/brand/path-family/source/build.cjs
node assets/brand/path-family/source/verify.cjs
```

`prepare-trace.py` 的三处取样区域对应当前 1774 × 887 确认稿；换图时必须复核区域。中间 mask / trace 与校验 PNG 存在 `reference/` 中，便于核对来源。

`verify.cjs` 仅访问临时本地 HTTP 服务，检查四个宽度、双主题、加载、焦点和下载。纯 `file://` 打开仍可看图，但浏览器可能限制下载链接；以 HTTP 下的验证为准。

VTracer 的 Python 包版本为 0.6.15，输出 SVG 注释中的 Rust 核心版本为 0.6.12；两者不是同一个版本字段。不要用 Python 3.14 复现本次流程，该组合在本机发生过崩溃。

素材或验收报告更新后，在 design 仓库运行 `python3 scripts/package-brand.py`，刷新 SHA-256 清单和可复现 ZIP。随后 `pnpm brand:prepare` 刷新预览资源。

## 快速评教

快速评教的批准几何来自 design 主仓库 `c2bccbb`，确认稿为 `reference/jxzljc-approved-concept.png`。只在需要重提轮廓时运行：

```sh
python3 assets/brand/path-family/source/prepare-jxzljc.py
uv run --python 3.12 --with vtracer==0.6.15 python assets/brand/path-family/source/trace.py jxzljc
python3 assets/brand/path-family/source/import-traces.py jxzljc
node assets/brand/path-family/source/build.cjs
node assets/brand/path-family/source/verify.cjs
```

提取脚本固定 1536 × 1024 原稿与 `[100,90,680,600]` 裁切区域，排除展示文字。不得用简化重画替代批准轮廓；当前统一蓝色仍由 theme token 生成。

## Feed 独立确认稿

先运行 `python3 assets/brand/path-family/source/prepare-feed.py`，再运行 `uv run --python 3.12 --with vtracer==0.6.15 python assets/brand/path-family/source/trace.py feed` 与 `python3 assets/brand/path-family/source/import-traces.py feed`。Feed 原稿为 `reference/feed-approved-concept.png`，固定裁切区域已排除文字和下方黑白示例。只描摹 Feed 时不会修改前三枚路径。常规重建仍只需 build / verify。

## Learning CLI 与 CQU Moe A 版

运行 `python3 assets/brand/path-family/source/prepare-learning-homepage.py`，再运行 `uv run --python 3.12 --with vtracer==0.6.15 python assets/brand/path-family/source/trace.py learning cqu-moe` 和 `python3 assets/brand/path-family/source/import-traces.py learning cqu-moe`。提取脚本固定了原稿尺寸与裁切区域，CQU Moe 只使用左侧 A 方案，排除 B/C 和下方示例。新稿使用约定的标准色而非压缩后取样值，记录见 extraction.json。之后照常 build / verify / package。

## 快速评教独立确认稿

运行 `python3 assets/brand/path-family/source/prepare-jxzljc.py`，再运行 `uv run --python 3.12 --with vtracer==0.6.15 python assets/brand/path-family/source/trace.py jxzljc` 与 `python3 assets/brand/path-family/source/import-traces.py jxzljc`。确认稿为 `reference/jxzljc-approved-concept.png`（2026-10-20 用户确认），图形取自裁切 `[116,104,548,478]`。原稿使用赭金色；重建色值统一读取 theme 蓝色变量。原 mask 与矢量的 alpha≥128 二值 IoU 为 0.9884677636903156。之后照常 build / verify / package。
