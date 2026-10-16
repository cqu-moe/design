# DESIGN final 审查修复

- 任务：[DESIGN-02 / Design #11](https://github.com/cqu-moe/design/issues/11)，父规格 #9。
- 唯一代码 worktree：`/Users/uu/Developer/cqu-moe/.agent-worktrees/e2e-20261015/tickets/DESIGN-02`，分支 `codex/e2e-20261015-design-02`。
- 修复基点：`3eb00ee5591feb495e7c67a34c3e1c1c0a6c40a9`；沿用前任未提交文件，没有重建分支或改 integration。前任三文件及精确基线保存在本 worktree `artifacts/final-fixes/predecessor/`、`artifacts/final-fixes/base-3eb00ee/`；受控缺陷对照在 `artifacts/final-fixes/baseline/`。
- Auth：`d9bf0c5e6d5cc459029da6a345991b8d0f13f514`；`e2e@0.21.0`、`@e2e-dev/web@0.15.0`；Node v22.22.3、pnpm 11.19.0、macOS arm64。
- 本文件随实现签名提交；不写自引用 SHA。最终 SHA、签名与提交后回读见根工作区 `docs/e2e/results/DESIGN-final-fixes.md`。

## 修复

1. Auth 通过公开 `surfaceOf(engine).context().routeWebSocket` 默认拒绝全部 WebSocket。配置和测试引用共享模块的 `globalThis` engine handle，避免不同 module graph 生成另一 handle。HTTP route 注册后，先打开纯 JSON `/api/v1/auth/get-session` 并核对 content type，再装 WebSocket guard，最后进入 SPA。拒绝记录只含 origin，页面吞掉连接错误仍使 afterEach 失败；没有手写协议栈或替换 e2e 框架。
2. 实际 Auth runner 使用独占 detached 进程组；超时先 SIGTERM、5 秒后 SIGKILL。等待 close 有硬截止，最终 SIGKILL、存活进程组检查及 ps 调用也有截止；僵尸进程视为已停止执行，真实后代监听器另行核验。`runner.json` 记录 timeout、code/signal、组清理状态。主错误、runtime 清理错误及证据错误同时保留；`runtime.json` 单独保存 primaryError、cleanupError，并实际请求确认 Auth/control 两个监听器拒绝连接。
3. 不再排除整个 `node_modules/**`。theme 不允许附加文件；UI 只允许 `node_modules/.bin/tsc` 和 `node_modules/.bin/tsserver`。依据为候选包可选 TypeScript peer、固定安装 TypeScript 5.9.3 的 bin 元数据，以及同次 pnpm 安装的顶层 shim；仅替换 shim 目标相对位置后逐字节比较。其余发布文件与候选文件集及 SHA-256 全量相等，额外文件、符号链接或不匹配 shim 均拒绝。
4. 新增真实负例 harness 并接入既有 auth-consumer CI job；每次仍下载 source job 的同一 candidate artifact。修正 `results/DESIGN-02.md` 的正式票 9→11、历史宽泛豁免的错误描述及全部失效 artifact 相对链接。

## 候选字节与真实链路

本次实际下载 [run 38733239379](https://github.com/cqu-moe/design/actions/runs/38733239379) 的候选 artifact `11971492912`，路径 `artifacts/final-fixes/ci-candidate-11971492912`；API 读取确认未过期且 head 为 3eb00ee。下载制品的 ZIP digest 为 `f3cb193b175e2d7fa63ecde2d9d94ffbec74c8f84aa2f661a72e50c571d1a130`（API 元数据）。以下为实际 tarball SHA-256，和原本地打包报告中的哈希不同，未混用：

| 包 | 版本 | 下载 tarball SHA-256 |
| --- | --- | --- |
| theme | 1.1.0 | `001342cf629bbcdbc0b80308b8aea4ef2b93ded5aab375b8a41b2099b1d4f605` |
| UI | 1.1.0 | `ed982e03c94ad739ee66b0dd68421bee76f5858068ac505a2197ae00f73a18c0` |

正向和三个负例均先校验同一 SHA256SUMS，再从远端 clone 并检出固定 Auth，复制候选包、同步本地 tarball integrity、frozen install。正向实际安装的 theme 4/UI 166 个发布文件逐项全等；仅 UI 两个已核验 pnpm shim 被单列。真实 Worker/D1、登录、保存与独立 API 读回、退出后的真实 401 和草稿保留、重登恢复及再次读回均通过；外部邮件由受控合成替身接收，不 seed 登录 session。

## 实际命令与结果

全部命令 cwd 为本票 worktree。定义 `CANDIDATE="$PWD/artifacts/final-fixes/ci-candidate-11971492912"` 仅为下表缩写，运行时实际传入完整目录。

| 确切命令 / 操作 | 退出码和结果 | 证据 |
| --- | --- | --- |
| `gh run download 38733239379 --repo cqu-moe/design --name cqu-moe-design-candidate-packages --dir artifacts/final-fixes/ci-candidate-11971492912` | 0，下载同一旧 CI 候选；`shasum -a 256 .../*.tgz` 与 sums 相等 | [SHA256SUMS](../artifacts/final-fixes/ci-candidate-11971492912/SHA256SUMS) |
| `DESIGN_CANDIDATE_PACKAGES="$CANDIDATE" node scripts/verify-auth-consumer.mjs` | 0，完整 desktop/mobile 各 1/1；两个 runtime、进程组、监听器及目录均清理 | [run](../artifacts/e2e/auth-consumer-fLZboE/run.json)、[desktop](../artifacts/e2e/auth-consumer-fLZboE/desktop/report.json)、[mobile](../artifacts/e2e/auth-consumer-fLZboE/mobile/report.json) |
| `DESIGN_CANDIDATE_PACKAGES="$CANDIDATE" pnpm verify:auth-consumer:harness` | 0；三个子入口均因指定原因退出 1 | [harness run](../artifacts/e2e/auth-consumer-harness-oinpeg/run.json)、[命令日志](../artifacts/final-fixes/harness.log) |
| 子入口 `DESIGN_AUTH_EXTRA_PAYLOAD=1 node scripts/verify-auth-consumer.mjs --variant desktop`（另设置同一 candidate） | 1；真实安装后新增 `node_modules/arbitrary.js`，因超出两个允许 shim 的文件集而失败，目录清理通过 | [run](../artifacts/e2e/auth-consumer-6K8Mdq/run.json) |
| 子入口 `DESIGN_AUTH_PROBE_WEBSOCKET=1 node scripts/verify-auth-consumer.mjs --variant desktop`（另设置同一 candidate） | 1；真实 Chromium WebSocket 在登录页被 1008 拒绝，页面捕获错误；afterEach 唯一失败，合成 ws 服务器零连接 | [report](../artifacts/e2e/auth-consumer-D457Xu/desktop/report.json)、[socket](../artifacts/e2e/auth-consumer-D457Xu/desktop/websocket-probe.json)、[server](../artifacts/e2e/auth-consumer-D457Xu/desktop/websocket-server.json) |
| 子入口 `DESIGN_AUTH_PROBE_TIMEOUT=1 DESIGN_AUTH_FAIL_CLEANUP=1 node scripts/verify-auth-consumer.mjs --variant desktop`（另设置同一 candidate） | 1；真实导航后挂起，15 秒超时，runner code 130/interrupted、timedOut=true、组清理 passed；runtime 真实关闭后受控清理失败，两份错误都保留，两个监听器已关闭 | [runner](../artifacts/e2e/auth-consumer-YDaUTj/desktop/runner.json)、[runtime](../artifacts/e2e/auth-consumer-YDaUTj/desktop/runtime.json)、[run](../artifacts/e2e/auth-consumer-YDaUTj/run.json) |
| 最后增加 ps 的 1 秒调用截止后，再运行上一条真实 timeout+cleanup 子入口 | 1，预期失败；两个错误、组清理和监听器关闭再次核对通过 | [runner](../artifacts/e2e/auth-consumer-NDg7Af/desktop/runner.json)、[runtime](../artifacts/e2e/auth-consumer-NDg7Af/desktop/runtime.json)、[run](../artifacts/e2e/auth-consumer-NDg7Af/run.json) |
| `pnpm check` | 0，构建、类型、5 个 Vitest、14 个 Node 测试、设计规则通过 | [日志](../artifacts/final-fixes/check.log) |
| `node --test tests/detached-child.test.mjs tests/auth-consumer-config.test.mjs` | 0，最后 ps 截止修改后 3/3；真实父进程忽略 TERM 和先退出两种情况，顽固后代 HTTP listener 均关闭 | [日志](../artifacts/final-fixes/process-green.log) |
| `pnpm test:e2e` | 0，Chromium desktop/mobile 106/106、零跳过/失败；serverClosed、cleanup 均通过 | [run](../artifacts/e2e/preview-dVHuR0/run.json)、[日志](../artifacts/final-fixes/browser.log) |
| `DESIGN_CANDIDATE_PACKAGES="$CANDIDATE" pnpm verify:consumer` | 0，同一 tarball 独立消费者安装、迁移、生产构建、设计检查及真实浏览器操作通过 | [run](../artifacts/e2e/consumer-aEkc6h/run.json)、[日志](../artifacts/final-fixes/consumer.log) |
| `pnpm exec prettier --check scripts/verification-runtime.mjs scripts/verify-auth-consumer.mjs scripts/verify-auth-consumer-harness.mjs tests/detached-child.test.mjs package.json .github/workflows/ci.yml` | 0，包含 CI YAML 的实际解析 | 会话输出 |
| 证据独立回读 / 合成秘密检查 | 0，8 个本轮 work 目录均不存在；两次超时的进程组无存活成员；94 个文本制品未发现合成密码、runtime secret 或 Bearer 凭据模式 | 会话输出；已目视手机登录和 WebSocket 失败截图，密码区域遮盖 |

验证过程中仓库源码未提交，所以本表 run.json 如实记录基线 3eb00ee、sourceDirty=true；不将其冒称最终 SHA 的干净运行。最终 ps 调用截止的变更只重跑所影响的进程树与真实 timeout 负例；未无故重复无关套件。

## 红绿证据与首次失败

- 使用受控对照：保留新探针和安全清理，恢复 3eb 的 HTTP-only guard 与整个 node_modules 排除规则。实际 WebSocket 成功触达合成服务器 1 次，额外 payload 仍被列为包管理器文件，入口却退出 0；[对照 run](../artifacts/e2e/auth-consumer-UAsags/run.json)、[server](../artifacts/e2e/auth-consumer-UAsags/desktop/websocket-server.json)。这是恢复两个缺陷规则的对照，不声称运行了完全未修改的旧提交。修复后对应独立负例都因预期 guard 退出 1。
- 相同真实进程树回归使用原 runner 的 leader-only kill 等待逻辑，加测试自有 1 秒安全截止。两个测试均因后代 pipe/listener 仍活跃而失败；finally 清理本次进程组。修复 helper 后均通过。[red](../artifacts/final-fixes/process-red.log)、[green](../artifacts/final-fixes/process-green.log)。没有源码 grep 或自造 mock 协议。
- 第一次正向试跑 `auth-consumer-1Ta9P5` 因 shim 比对未解析 pnpm 包 symlink 的真实 bin 目录失败；修为 realpath 后通过。
- `auth-consumer-kFXsKG` 的 JSON 首开后仍因不同 config/test module graph 的 handle 报 APP_NOT_OPEN；`auth-consumer-uVFTGD` 的共享 .mjs 试跑因误留 TypeScript 非空断言而 CONFIG_LOAD_FAILED。均保留失败证据，没有将其算作业务回归红绿或宣称已解决。按父代理给出的 global holder 方案修复，并实际通过最终双视口和 WebSocket 负例。
- 原普通沙箱 ps 被拒的失败不是业务红绿；获批本地执行后实际进程组与监听器测试通过。

## test-audit 与范围

新增测试分别保护真实传输、发布文件集和进程资源生命周期；可信回归是吞掉 WebSocket 错误、任意包内追加 payload、只杀 leader 留下浏览器后代。原 HTTP route 和文件哈希不能覆盖这些不同契约。主要验收在实际安装/runner/browser 边界；快的进程树回归独立覆盖“不退出的后代”和“leader 先退出但后代继承 pipe”这两类生命周期风险。导出的 helper 由实际 Auth runner 和 harness 调用，没有只服务测试的生产 export；故障开关沿用既有验证脚本边界，不进入产品代码。

代码只涉及验证工具、测试、CI 和报告，没有共享 UI/theme 产品源码或公开消费 API 变化；无需升级包版本或修改 cqu-design 消费技能。OpenClaw 专用验证入口不在本仓，以本仓 pnpm 命令执行；独立 Standards/Spec review 及 merger 由父代理安排。

## CI、身份与未验证边界

- 实际 `gh run view 38733239379` 核实旧 head 3eb00ee 的 source、Chromium、auth-consumer、ci-result 成功。交接另给 run 38733232200 与 Auth artifact 11971443487，本次未重新下载该 Auth artifact，不将其作为本次修复证据。
- 修复后的 workflow 加入上述真实负例，仍保持 source 打包一次→同一 artifact→SHA256SUMS→固定 Auth→全部安装发布字节对账。**本次未 push、未开 PR、未改/快进 integration。修复版远端 CI 尚未运行，父代理须在独立审查/merger 后推送固定新 SHA 并重新验收。旧 run 不能证明新提交 CI 通过。**
- 提交前有效 `user.name=User-Unauthorized`、`user.email=69748465+UserUnauthorized@users.noreply.github.com`；author/committer 均相同；`commit.gpgsign=true`、`gpg.format=ssh`，使用现有配置，不覆盖身份或禁用签名。
- 未部署或发布，未调用真实学校、真实邮件或付费模型。手机为 390×844 浏览器视口，非真机；本次真实 Auth 使用 Chromium，未重复 Firefox/WebKit 发布门禁。

## Changed paths

- `.github/workflows/ci.yml`
- `docs/e2e.md`
- `package.json`
- `results/DESIGN-02.md`
- `results/DESIGN-final-fixes.md`
- `scripts/verification-runtime.mjs`
- `scripts/verify-auth-consumer.mjs`
- `scripts/verify-auth-consumer-harness.mjs`
- `tests/detached-child.test.mjs`

除按用户要求写根工作区的本报告副本外，所有实现、临时 checkout、探针和证据仅在本票已有隔离 worktree 内。
