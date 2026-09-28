import { useState } from 'react';
import { Link } from 'react-router';
import {
  Button,
  Input,
  PageHeader,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Skeleton,
} from '@cqu-moe/ui';
import {
  Search,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  PauseCircle,
  AlertCircle,
  FolderOpen,
} from 'lucide-react';
import { items } from '../demo-data';
export function Items() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [scenario, setScenario] = useState('normal');
  const filtered = items.filter(
    (item) => item.title.includes(query) && (status === 'all' || status === item.status),
  );
  const pages = Math.max(1, Math.ceil(filtered.length / 4));
  const shown = filtered.slice((page - 1) * 4, page * 4);
  function clear() {
    setQuery('');
    setStatus('all');
    setPage(1);
    setScenario('normal');
  }
  return (
    <>
      <PageHeader
        title="服务管理"
        description="查看工作空间中的服务与运行状态。"
        actions={<span className="preview-badge">{items.length} 个服务 · 演示数据</span>}
      />
      <div className="list-toolbar">
        <div className="search-field">
          <Search aria-hidden="true" />
          <Input
            type="search"
            aria-label="搜索服务"
            placeholder="搜索服务…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <Select
          value={status}
          onValueChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
        >
          <SelectTrigger aria-label="筛选状态">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="active">运行中</SelectItem>
            <SelectItem value="paused">已暂停</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {scenario === 'loading' ? (
        <div className="loading-list" aria-label="正在加载">
          {[1, 2, 3].map((x) => (
            <Skeleton key={x} className="loading-row" />
          ))}
        </div>
      ) : scenario === 'error' ? (
        <div className="empty-state" role="alert">
          <AlertCircle />
          <h2>暂时无法加载服务</h2>
          <p>请重试，筛选条件会为你保留。</p>
          <Button variant="outline" onClick={() => setScenario('normal')}>
            重新加载
          </Button>
        </div>
      ) : !filtered.length ? (
        <div className="empty-state">
          <FolderOpen />
          <h2>没有找到匹配的服务</h2>
          <p>试试其他名称，或清除当前筛选。</p>
          <Button variant="outline" onClick={clear}>
            清除筛选
          </Button>
        </div>
      ) : (
        <div className="service-list">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>服务</TableHead>
                <TableHead className="category-column">分类</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="date-column">最近更新</TableHead>
                <TableHead>
                  <span className="sr-only">详情</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shown.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="service-cell">
                    <Link className="service-title" to={'/items/' + item.id}>
                      {item.title}
                    </Link>
                    <p>{item.description}</p>
                  </TableCell>
                  <TableCell className="category-column">{item.category}</TableCell>
                  <TableCell>
                    <span className={`status-label status-${item.status}`}>
                      {item.status === 'active' ? <CheckCircle2 /> : <PauseCircle />}
                      {item.status === 'active' ? '运行中' : '已暂停'}
                    </span>
                  </TableCell>
                  <TableCell className="date-column">
                    <time>{item.updatedAt}</time>
                  </TableCell>
                  <TableCell>
                    <Button asChild variant="ghost" size="icon">
                      <Link to={'/items/' + item.id} aria-label={'查看' + item.title + '详情'}>
                        <ArrowUpRight />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <div className="list-footer">
        <span>共 {filtered.length} 个服务</span>
        <div className="pagination">
          <Button
            variant="outline"
            size="icon"
            aria-label="上一页"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft />
          </Button>
          <span>
            {page} / {pages}
          </span>
          <Button
            variant="outline"
            size="icon"
            aria-label="下一页"
            disabled={page >= pages}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight />
          </Button>
        </div>
      </div>
      <details className="demo-controls">
        <summary>演示状态</summary>
        <label>
          列表状态{' '}
          <select value={scenario} onChange={(e) => setScenario(e.target.value)}>
            <option value="normal">正常</option>
            <option value="loading">加载中</option>
            <option value="error">加载失败</option>
          </select>
        </label>
      </details>
    </>
  );
}
