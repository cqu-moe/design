# 重建素材

常规编辑：修改 `marks.json` 的路径或颜色，然后运行 `node assets/brand/path-family/source/build.cjs`。渲染使用仓库已有的 `@playwright/test` 和本机 Chromium。路径坐标与外层 transform 保留了确认稿比例。

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

`prepare-trace.py` 的三处取样区域对应当前 1774 × 887 确认稿；换图时必须复核区域。生成图的色差被转换为单一标准色。中间 mask / trace 与校验 PNG 存在 `reference/` 中，便于核对来源。

`verify.cjs` 仅访问临时本地 HTTP 服务，检查四个宽度、双主题、加载、焦点和下载。纯 `file://` 打开仍可看图，但浏览器可能限制下载链接；以 HTTP 下的验证为准。

VTracer 的 Python 包版本为 0.6.15，输出 SVG 注释中的 Rust 核心版本为 0.6.12；两者不是同一个版本字段。不要用 Python 3.14 复现本次流程，该组合在本机发生过崩溃。

素材或验收报告更新后，在 design 仓库运行 `python3 scripts/package-brand.py`，刷新 SHA-256 清单和可复现 ZIP。随后 `pnpm brand:prepare` 刷新预览资源。

## Feed 独立确认稿

先运行 `python3 assets/brand/path-family/source/prepare-feed.py`，再运行 `uv run --python 3.12 --with vtracer==0.6.15 python assets/brand/path-family/source/trace.py feed` 与 `python3 assets/brand/path-family/source/import-traces.py feed`。Feed 原稿为 `reference/feed-approved-concept.png`，固定裁切区域已排除文字和下方黑白示例。只描摹 Feed 时不会修改前三枚路径。常规重建仍只需 build / verify。
