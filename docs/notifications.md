# 通知与反馈

使用 Sonner。共享包导出 Toaster 与原生 toast API，保留 Sonner 的定位、堆叠、滑动关闭和无障碍通知行为。

## 接入

在 ThemeProvider 内、路由内容外只挂载一次 Toaster。启动模板已接入，禁止在页面或弹窗中再次挂载。

```tsx
<ThemeProvider>
  <RouterProvider router={router} />
  <Toaster />
</ThemeProvider>
```

从 @cqu-moe/ui 导入 toast。不要在消费页面直接导入另一份 Sonner 或覆盖通知颜色。

```tsx
toast.success('保存成功', { id: 'settings-save' });
toast.promise(request, { id: 'save-request', loading: '正在保存…', success: '保存成功', error: '保存失败，请重试。' });
```

## 选择反馈形式

| 场景 | 形式 |
| --- | --- |
| 保存、复制、批量操作完成 | 短 Toast |
| 字段格式错误、登录失败 | 行内反馈，关联输入和错误说明 |
| 持续断线、权限等影响页面的状态 | Alert 持续通知条 |
| 破坏性操作前的确认 | Dialog；完成后再 Toast |

同一结果只用一种主要反馈，不同时展示成功条与成功 Toast。
稳定 id 用于同一操作的更新与去重。重复调用相同 id 会更新现有通知。
异步操作使用真实会结束的 Promise；不要让 loading 永久停留，也不要把失败转换成成功。

## 交互与主题

- 桌面右下角，边距 24px；手机边距 16px，底部考虑安全区。
- 使用当前已解析的主题，保持白色 / 石墨灰表面，不启用大面积富彩背景。
- 默认 5 秒，可关闭；需要等待用户处理的示例可设 duration: Infinity。
- 必要信息不能只存在于会自动消失的 Toast 中。撤销类操作还应有页面内恢复入口。
- 动作按钮在触屏下至少 44px；关闭图标通过透明命中区扩展到 44px。
- 键盘触发的通知即时出现；可用 Sonner 的 Alt+T 聚焦通知区域；中文关闭按钮名称为“关闭通知”。
- 系统减少动态效果使用 Sonner 自带支持。/feedback 还有仅当前预览生效的减少动态效果开关，离开后清理。

预览：/feedback。覆盖成功/错误/警告/信息、Promise 状态、撤销、手动关闭、持续通知条、行内校验、弹窗与抽屉。
认证示例保留行内结果；用户、客户端管理及账号设置的成功反馈已经接入 Toast。
