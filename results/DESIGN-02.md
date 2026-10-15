# DESIGN-02 实施结果

- 正式票：https://github.com/cqu-moe/design/issues/9
- 分支：`codex/e2e-20261015-design-02`
- Worktree：`/Users/uu/Developer/cqu-moe/.agent-worktrees/e2e-20261015/tickets/DESIGN-02`
- integration 基点：`55378367c993bb7a236f86c51c79c7515aa36a7a`
- Auth 固定提交：`d9bf0c5e6d5cc459029da6a345991b8d0f13f514`
- 本报告与实现使用一个签名提交；提交 SHA 在提交后由 `git rev-parse HEAD` 和签名验证记录，不在文件内预填自引用伪值。

## 交付

1. 新增 `pnpm verify:auth-consumer`。入口必须设置 `DESIGN_CANDIDATE_PACKAGES`，先按 DESIGN-01 契约核对恰好两个当前 theme/UI tarball 与 `SHA256SUMS`，缺配置在克隆或安装前失败。
2. 每次运行克隆独占 Auth checkout、检出固定 SHA，并复制同一批候选包。仅替换 Auth 锁文件中两个本地 file tarball 的 integrity 后执行 `pnpm install --frozen-lockfile`；最终锁文件与固定 Auth 锁的差异只有 UI tarball integrity，未删除或重解析全部依赖。
3. 安装后解包候选 tarball，枚举全部发布文件，并将候选侧与 `frontend/node_modules/@cqu-moe/{theme,ui}` 实际安装文件的 SHA-256 逐一比对。theme 4 个、UI 166 个发布文件全部匹配；pnpm 在 UI 包内生成的 `node_modules/.bin/tsc` 与 `node_modules/.bin/tsserver` 被记录为包管理器附加文件，其他 tarball 外额外发布路径仍会导致失败。负例篡改本次安装中的 UI `dist/index.js` 后，入口以候选/安装哈希不一致退出 1。
4. 安装真实 Auth root/frontend 锁文件依赖并构建生产 SPA，安装 Auth 已固定 e2e 工具链的 Chromium，复用 `startAuth` 与 `prepareAccount` 启动真实 Worker/D1 和受控外部邮箱替身。没有替换 Auth 内部服务，没有造登录 session，没有读取或使用真实账号。
5. 每个视口从真实登录 UI 进入既有个人信息设置：空昵称显示校验且无成功；保存昵称后刷新页面并调用独立 session API 读回；真实退出后提交保存观察到真实 401、错误状态与草稿保留且无假成功；重新真实登录后恢复原昵称并再次刷新/API 读回。桌面为 1440×900，手机为 390×844。
6. 新 Web 场景使用 Auth 已使用的 `e2e@0.21.0` 与 `@e2e-dev/web@0.15.0`，未迁移或替换既有 Playwright。浏览器路由只允许本次 Auth origin，意外外联、零用例、跳过或中断均失败。
7. `startAuth` 成功后的 `runtime.json` 写入、环境装配、`prepareAccount`、测试、报告校验和 artifact 检查均在 `try/finally` 内。主失败、runtime 清理失败与证据复制失败会同时保留；清理探针先执行真实 runtime 关闭再抛受控错误，整体仍非零。
8. 证据复制先创建目标父目录，失败截图、`trace.md` 与失败屏幕文本的深层路径均已实测复制。公开文本/日志不含密码、控制 origin、Cookie 或 token。
9. CI 新增 `auth-consumer` job：依赖 source，下载同名 `cqu-moe-design-candidate-packages` artifact，从 GitHub 克隆固定 Auth SHA，安装同一批候选包并运行双视口，上传报告；该 job 加入 `ci-result` 必需依赖。这里只做 YAML 解析和人工结构检查，未用配置字符串断言冒充远端执行。

## 固定版本与候选字节

- `@cqu-moe/theme@1.1.0` tarball SHA-256：`fdd71ff8df7ffe0ceccb3128d364bf52785bfb4bb0329219a3528e2ce26cc3c9`
- `@cqu-moe/ui@1.1.0` tarball SHA-256：`a3ddd14069511b78b8dbddc75a983502c42d0f2a72bb447c60b389487b91306b`
- Auth 提交：`d9bf0c5e6d5cc459029da6a345991b8d0f13f514`
- e2e runner/engine：`e2e@0.21.0` / `@e2e-dev/web@0.15.0`
- 本地执行：Node `v22.22.3`，macOS arm64，Chromium 156.0.8078.4

## 实际验证

| 命令或探针                                        | 退出码与结果                                                                                                                                    | 证据                                                                                                                                                                                                                                                                                                                                                   |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 第 1 次 `pnpm verify:auth-consumer`               | 0；独立 clone/install/build/runtime，桌面与手机各 1/1 通过，两个 runtime cleanup 均通过；theme 4/UI 166 发布文件哈希全等                        | [run](artifacts/e2e/auth-consumer-9566L5/run.json)；[desktop](artifacts/e2e/auth-consumer-9566L5/desktop/report.json)；[mobile](artifacts/e2e/auth-consumer-9566L5/mobile/report.json)                                                                                                                                                                 |
| 第 2 次 `pnpm verify:auth-consumer`               | 0；全新独立 clone/install/build/runtime、账号、端口和浏览器 context，结果同上                                                                   | [run](artifacts/e2e/auth-consumer-ufkB6h/run.json)；[desktop](artifacts/e2e/auth-consumer-ufkB6h/desktop/report.json)；[mobile](artifacts/e2e/auth-consumer-ufkB6h/mobile/report.json)                                                                                                                                                                 |
| `DESIGN_AUTH_BREAK_PAYLOAD=1`                     | 1；安装后篡改 UI `dist/index.js`，候选 SHA-256 `c7b96f6d…d25f7` 与安装 SHA-256 `0568649f…ee7df` 不一致；外层工作目录清理通过                    | [run](artifacts/e2e/auth-consumer-iE1RIb/run.json)                                                                                                                                                                                                                                                                                                     |
| `DESIGN_AUTH_BREAK_ASSERTION=1`                   | 1；唯一测试失败，失败原因正确；失败截图、trace、失败屏幕文本和 runtime cleanup 记录均复制到深层目标目录                                         | [run](artifacts/e2e/auth-consumer-8yEIB8/run.json)；[失败截图](artifacts/e2e/auth-consumer-8yEIB8/desktop/results/design-consumer-save-reload-survive-a-real-becf6826dc8c2c7a/attempt-1/screenshots/002-failure.png)；[trace](artifacts/e2e/auth-consumer-8yEIB8/desktop/results/design-consumer-save-reload-survive-a-real-becf6826dc8c2c7a/trace.md) |
| `DESIGN_AUTH_FAIL_CLEANUP=1`                      | 1；真实测试通过后先执行实际 `runtime.close()`，再抛受控清理错误；runtime 证据为 `cleanup: failed`，整体非零，外层独占工作目录仍清理             | [runtime](artifacts/e2e/auth-consumer-o5kDer/desktop/runtime.json)；[run](artifacts/e2e/auth-consumer-o5kDer/run.json)                                                                                                                                                                                                                                 |
| `node --test tests/auth-consumer-config.test.mjs` | 0；子进程实际执行缺配置的真实脚本，断言其非零且错误指向 `DESIGN_CANDIDATE_PACKAGES`                                                             | 测试输出包含在最终 `pnpm check`                                                                                                                                                                                                                                                                                                                        |
| `pnpm check`                                      | 0；构建、类型、5 个 Vitest、12 个 Node 测试与设计规则通过。首次沙箱运行因绑定 127.0.0.1 的 EPERM 失败，批准本地环境复跑通过；该失败不是业务红绿 | 会话命令输出                                                                                                                                                                                                                                                                                                                                           |
| 既有 `pnpm test:e2e`                              | 0；106/106 通过、0 跳过/失败/flaky，服务关闭与清理通过；本票未改共享组件或预览产品源码                                                          | [run](artifacts/e2e/preview-94OCrs/run.json)；[结果](artifacts/e2e/preview-94OCrs/results.json)                                                                                                                                                                                                                                                        |
| CI YAML 解析                                      | 0；`auth-consumer` 依赖 source，且进入 `ci-result` needs                                                                                        | 会话命令输出                                                                                                                                                                                                                                                                                                                                           |

两个正向运行目录均记录 `sourceDirty: true`，这是当时实现尚未提交的真实状态；最终提交只包含本票列出的文件，没有额外产品变动。第一次尝试在沙箱中因 registry DNS/网络受限失败，未把它当作业务结果；批准环境使用固定锁文件完成同一安装。

## 红绿与父审修复

- 生命周期首版只把 `prepareAccount` 放在 `try/finally` 内，`startAuth` 返回后的 `runtime.json` 写入和环境装配仍有泄漏窗口。已把启动后所有操作纳入保护，并在主错误、清理错误、证据错误同时出现时逐项保留。
- 深层证据复制首版只创建顶层目录；负例确认失败截图、trace 和失败屏幕文本位于多层目录后，已为每个目标文件递归创建父目录并复验。
- 安装 provenance 首版只证明 `.design` tarball 哈希和版本号。父审指出同版本旧缓存/锁文本可能掩盖实际安装字节后，改为解包候选 tarball 并全发布文件独立哈希对账。首轮严格文件集比较暴露 pnpm 在 UI 包内生成的两个 `.bin` 入口；实现随后只豁免并记录 `node_modules/` 下这些包管理器生成文件，候选发布文件及其他额外发布路径仍强一致。
- cleanup 探针首版在所有 runtime 正常关闭后事后抛错。现改为包装本次 runtime 的 `close`：先等待真实关闭完成，再抛受控错误；因此仍验证资源释放，同时证明清理失败不能被通过掩盖。
- 一次通过后的 workerd 关闭输出 `Broken pipe` 警告；测试、runtime 清理和外层清理均通过，未作为失败或重试依据。

## 审查与边界

- 已按根实施约定和本仓 AGENTS 执行；测试写作按 tdd/test-audit 检查，新增配置测试执行真实命令，payload 验收执行真实文件哈希，不新增源码 grep 或通用代理框架。
- 父代理补充 DESIGN-01 手动 Linux Firefox/WebKit GitHub run `38726954339` 已全部通过。该结果是父代理提供的远端/手动验收证据，不属于 DESIGN-02 本地运行或本票新增 CI。
- DESIGN-02 的 GitHub CI 尚未 push/执行。主代理后续必须验收远端 source 与 auth-consumer 是否下载同一 artifact、Auth SHA/包哈希是否与上述一致、报告 artifact 是否清理；不得用本报告的本地结果替代。
- 未部署、未发布、未使用生产账号、未发真实邮件、未调用付费服务。手机为浏览器视口仿真，不代表真机。
- 未修改 execution/API/Linkfix/UC，未反向 merge，未 push，未开 PR。

## 修改文件

- `.github/workflows/ci.yml`
- `docs/e2e.md`
- `package.json`
- `scripts/verify-auth-consumer.mjs`
- `tests/auth-consumer-config.test.mjs`
- `results/DESIGN-02.md`
