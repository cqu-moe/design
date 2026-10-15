# 生产产物浏览器验证

本仓只验证组件、参考页面的本地演示和独立安装包消费者；演示登录、保存和导出不是业务服务成功。真实 Auth 消费者由后续独立票负责。

## 运行

使用锁定依赖后安装对应浏览器：`pnpm exec playwright install chromium`。PR 入口为 `pnpm test:e2e`，完整保留原有参考页场景，并增加 Chromium 手机项目；后台桌面专属断言保留在桌面项目，原有显式窄屏和触屏场景仍运行。本地 `pnpm verify:consumer` 打包主题/UI、创建并迁移独立消费者、安装、构建并实际操作生产页面；GitHub Actions 的 browser job 先下载 source job 上传的候选包，并通过 `DESIGN_CANDIDATE_PACKAGES` 让消费者校验并安装同一批字节。

发布前安装 `pnpm exec playwright install firefox webkit`，运行 `pnpm test:e2e:release`；它包含 Chromium 桌面/手机及 Firefox/WebKit 桌面。Firefox 不支持 isMobile 仿真，既有手动手机上下文在 Firefox 使用真实窄视口与触屏能力，不声称为设备仿真或真机。GitHub 的 v 标签会强制运行 Firefox/WebKit job，手动工作流的 release_browsers 也可启用；发布依赖聚合门禁成功。原有 Cloudflare 构建门禁继续运行 Chromium 与 tarball 消费者。

可定点运行 `node scripts/run-browser-tests.mjs --project=chromium-desktop tests/components.browser.spec.ts`。不要直接调用裸 Playwright，也不要传入未知服务地址：入口先构建本次候选，将参考站直接输出到本次独占目录，然后绑定操作系统分配的回环端口；不会探测或复用 5173/5174。共享包构建和打包使用独占锁，冲突时明确失败，不覆盖另一个验证任务。源码检查和构建不应在同一 worktree 并发修改共享包输出。

## 隔离与失败

每次运行有独占工作目录和证据目录。测试浏览器使用全新 context，主题等状态由真实本地浏览器存储承载。HTTP 只允许本次预览 origin，WebSocket 全部拒绝；预览没有外部网络依赖。即使页面自行捕获请求错误，测试也会因意外外联失败，日志只记录 origin。不会读取日常浏览器或用户会话，也不使用模型。

进程、监听器与本次临时项目在成功或失败后清理，清理错误使运行失败。证据保留在 artifacts/e2e 下每次新建的目录，包括命令日志、run.json、浏览器结果 JSON/HTML、失败截图与 trace；消费者还保留合成页面截图和 trace。不会改写已跟踪的历史消费者报告。证据目录不会因下一次执行被清空；CI 收集这些目录。不得将真实身份数据加入本地演示或上传制品。

`pnpm test:e2e:harness` 用实际生产页面进行受控负向探针：错误断言和意外外联必须让子运行非零退出且产生截图/trace；即使显式允许零测试，门禁仍拒绝空套件。探针还从文件系统与 HTTP 核对目录已删除、监听器已关闭。预期失败的子运行保留原始证据，探针自身只有确认失败原因正确后才成功。

首次失败与后续修复执行分别保留，不配置自动重试掩盖首败。运行记录中的 commit 为启动时源码基线；未提交改动须在票的结果报告中列出，不能由基线 SHA 推定为已提交。源码检查、真实浏览器、本地 tarball、远端 CI、部署及真机结果分别报告；本地通过不等于远端通过。
