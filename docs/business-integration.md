# 连接真实业务数据

设计系统负责呈现和交互；接口协议、缓存、分页、认证、鉴权、审计由子系统负责。先确认实际接口，再替换示例中的 demo-data.ts、admin-data.ts、admin/state.tsx 和 setTimeout，不把演示成功当成请求成功。

## 读取：使用项目已有数据层

模板使用 React Router Data Mode，可在路由 loader 读取数据，通过 request.signal 取消过时请求；已经有查询库的系统继续用其缓存与取消机制，不为接入设计系统再加一套。

以下 /api/users、响应结构及 Cookie 认证仅为**接口合同示例**，必须替换为子系统真实约定。不要把服务端返回直接断言为业务类型，也不要把 403 转成空列表。

```tsx
import { useLoaderData, type LoaderFunctionArgs } from 'react-router';
import { PageHeader, PageState } from '@cqu-moe/ui';

type User = { id: string; name: string };
export async function usersLoader({ request }: LoaderFunctionArgs) {
  const response = await fetch('/api/users', {
    signal: request.signal,
    credentials: 'same-origin',
  });
  if (!response.ok) throw new Response(null, { status: response.status });
  const data: unknown = await response.json();
  if (!Array.isArray(data) || !data.every((item) =>
    item && typeof item.id === 'string' && typeof item.name === 'string')) {
    throw new Error('用户接口返回结构不匹配');
  }
  return data as User[];
}
export function Users() {
  const users = useLoaderData<typeof usersLoader>();
  return <>
    <PageHeader title="用户" />
    {users.length
      ? <ul>{users.map((user) => <li key={user.id}>{user.name}</li>)}</ul>
      : <PageState state="empty" title="还没有用户" description="创建后会显示在这里。" />}
  </>;
}
```

把 `{ path: 'users', loader: usersLoader, element: <Users /> }` 加到模板 Layout 的 children。模板 RouteError 已区分 403 和其他加载失败，未向页面暴露原始异常。业务路由按合同补充 401 登录和对象 404；初次异步路由可用 hydrateFallbackElement 放 PageState loading。不要在根 errorElement 直接输出 error.stack 或原始服务器正文。

## 提交：状态由请求决定

复用 ActionButton，state=idle/loading/success/error，业务处理器仍须有提交锁（包括 Enter 提交）。设置页提供同一锁保护内联和全局保存的例子。

1. 前端校验失败时关联字段并聚焦首个错误，不发请求。
2. 校验通过后读取本次提交快照，设 loading，禁止重复提交；保持原始输入。
3. await 请求并检查 HTTP 状态和业务返回码；只有确认成功才能更新 saved 和 success。
4. 422/字段错误映射到对应输入；403 显示权限说明；409 保留草稿并提示重新读取；网络或 5xx 可重试，不自动重试非幂等写入。
5. finally 释放锁。请求可取消时用 AbortController，卸载后不再更新页面；取消不代表服务端写入回滚，重新进入后读回确认。
6. 用户修改输入后清除旧成功态。需要撤销时调用真实撤销接口，不能仅弹“已撤销”。

成功已由按钮表达时不再弹相同 Toast。批量操作可能部分失败：根据逐项结果更新成功项、保留失败项和选择，反馈成功/失败数量；不要照搬演示的全成功逻辑。

## 列表、筛选和权限

- 表格/筛选组件不请求数据。服务端分页接收 page/pageSize/filters/sort；显示服务器 total，不把当前页长度当总数。
- 搜索或筛选改变后回到第一页；确认需要实时 URL 分享时才将条件同步 URL。过时响应不得覆盖新条件的结果。
- 跨页批量选择存稳定 ID，不存行索引；全选默认只选当前页。筛选改变清空选择，除非产品另有明确“全部查询结果”的后端协议。
- 表格横向滚动限于容器；手机不删除筛选、批量操作、分页大小或详情入口。
- 权限决定页面和操作是否可见/可用，后端必须再次鉴权。不要把演示角色选择器作为真实授权策略。
- 401 登录跳转只允许本系统可信的返回地址；会话、Cookie、CSRF 沿用子系统方案，密码/令牌不写进主题存储或 Toast。

## 接口验收

用项目已有工具覆盖成功、慢请求、空数据、401/403/404、422、5xx、断网、重复点击和过时响应。fixture 通过不等于真实接口验收；授权环境中需独立读回写入结果，再报告哪些真实操作已验证。生产认证、用户创建和权限修改不在设计仓库的演示范围内。
