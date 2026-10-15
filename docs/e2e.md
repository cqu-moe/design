# 生产产物浏览器与真实消费者验证

本仓验证组件、参考页面的本地演示、独立安装包消费者，以及 DESIGN-02 固定 Auth 提交的真实消费者旅程。参考页面的演示登录、保存和导出不是业务服务成功；真实结果只由 Auth 消费者入口认定。

## 运行

使用锁定依赖后安装对应浏览器：`pnpm exec playwright install chromium`。PR 入口为 `pnpm test:e2e`，完整保留原有参考页场景，并增加 Chromium 手机项目；后台桌面专属断言保留在桌面项目，原有显式窄屏和触屏场景仍运行。本地 `pnpm verify:consumer` 打包主题/UI、创建并迁移独立消费者、安装、构建并实际操作生产页面；GitHub Actions 的 browser job 先下载 source job 上传的候选包，并通过 `DESIGN_CANDIDATE_PACKAGES` 让消费者校验并安装同一批字节。

发布前安装 `pnpm exec playwright install firefox webkit`，运行 `pnpm test:e2e:release`；它包含 Chromium 桌面/手机及 Firefox/WebKit 桌面。Firefox 不支持 isMobile 仿真，既有手动手机上下文在 Firefox 使用真实窄视口与触屏能力，不声称为设备仿真或真机。GitHub 的 v 标签会强制运行 Firefox/WebKit job，手动工作流的 release_browsers 也可启用；发布依赖聚合门禁成功。原有 Cloudflare 构建门禁继续运行 Chromium 与 tarball 消费者。

可定点运行 `node scripts/run-browser-tests.mjs --project=chromium-desktop tests/components.browser.spec.ts`。不要直接调用裸 Playwright，也不要传入未知服务地址：入口先构建本次候选，将参考站直接输出到本次独占目录，然后绑定操作系统分配的回环端口；不会探测或复用 5173/5174。共享包构建和打包使用独占锁，冲突时明确失败，不覆盖另一个验证任务。源码检查和构建不应在同一 worktree 并发修改共享包输出。

`pnpm verify:auth-consumer` 必须设置 `DESIGN_CANDIDATE_PACKAGES`，先核对 DESIGN-01 的两个 tarball 与 `SHA256SUMS`，再克隆并检出固定 Auth 提交 `d9bf0c5e6d5cc459029da6a345991b8d0f13f514`。脚本把候选包复制到该次独占 Auth checkout 的 `frontend/.design`，仅同步锁文件中本地 tarball 的 integrity，并以 frozen lockfile 安装、构建生产 SPA。随后复用 Auth 的 `startAuth`/`prepareAccount` 启动真实 Worker/D1 和受控外部邮箱替身，浏览器从真实登录入口进入已有个人信息设置，在桌面和 390×844 手机视口分别保存昵称、刷新读回、经历真实退出后的 401 保存失败、重新登录并恢复原值。脚本记录 Auth 提交、两个设计包版本与 SHA-256、安装锁文件和每个视口清理状态。

## 隔离与失败

每次运行有独占工作目录和证据目录。测试浏览器使用全新 context，主题等状态由真实本地浏览器存储承载。HTTP 只允许本次预览 origin，WebSocket 全部拒绝；预览没有外部网络依赖。即使页面自行捕获请求错误，测试也会因意外外联失败，日志只记录 origin。不会读取日常浏览器或用户会话，也不使用模型。

进程、监听器与本次临时项目在成功或失败后清理，清理错误使运行失败。证据保留在 artifacts/e2e 下每次新建的目录，包括命令日志、run.json、浏览器结果 JSON/HTML、失败截图与 trace；消费者还保留合成页面截图和 trace。不会改写已跟踪的历史消费者报告。证据目录不会因下一次执行被清空；CI 收集这些目录。不得将真实身份数据加入本地演示或上传制品。

`pnpm test:e2e:harness` 用实际生产页面进行受控负向探针：错误断言和意外外联必须让子运行非零退出且产生截图/trace；即使显式允许零测试，门禁仍拒绝空套件。探针还从文件系统与 HTTP 核对目录已删除、监听器已关闭。预期失败的子运行保留原始证据，探针自身只有确认失败原因正确后才成功。

Auth 消费者同样拒绝缺配置、零用例、跳过、意外外联和清理失败。`DESIGN_AUTH_BREAK_ASSERTION=1` 的负例必须在填写秘密前破坏登录页断言，保留失败截图、trace 和清理记录；`DESIGN_AUTH_FAIL_CLEANUP=1` 会在真实关闭 runtime 后抛出受控清理错误，确认清理阶段错误不能被成功测试掩盖。安装后还会解包两个候选 tarball，把全部发布文件的独立 SHA-256 与 `node_modules` 内实际文件逐一比对；`DESIGN_AUTH_BREAK_PAYLOAD=1` 通过篡改本次独占安装内的一个 UI 发布文件验证该对账会失败。CI 的 auth-consumer job 依赖 source 上传的同一 candidate artifact，远端克隆固定 Auth SHA，安装原锁文件依赖和候选包字节后运行双视口，并把 run/report/runtime 证据作为独立制品上传。

首次失败与后续修复执行分别保留，不配置自动重试掩盖首败。运行记录中的 commit 为启动时源码基线；未提交改动须在票的结果报告中列出，不能由基线 SHA 推定为已提交。源码检查、真实浏览器、本地 tarball、远端 CI、部署及真机结果分别报告；本地通过不等于远端通过。
