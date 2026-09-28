import { useRef, useState, type FormEvent } from 'react';
import {
  Button,
  Input,
  Label,
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@cqu-moe/ui';
import { Search, Plus, ArrowUpRight, AlertCircle } from 'lucide-react';
import { useAdminData } from './state';
import type { DemoClient } from '../../admin-data';
export function Clients() {
  const { clients, setClients } = useAdminData();
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [draft, setDraft] = useState({ name: '', id: '', callback: '' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const trigger = useRef<HTMLButtonElement | null>(null);
  const createTrigger = useRef<HTMLButtonElement | null>(null);
  const selected = clients.find((client) => client.id === selectedId);
  const filtered = clients.filter(
    (client) =>
      `${client.name} ${client.id}`.toLowerCase().includes(query.toLowerCase()) &&
      (kind === 'all' || kind === client.kind),
  );
  function create(event: FormEvent) {
    event.preventDefault();
    let url: URL;
    try {
      url = new URL(draft.callback);
    } catch {
      setError('请输入有效的 HTTP 或 HTTPS 回调地址。');
      return;
    }
    if (
      !draft.name.trim() ||
      !/^[a-z0-9][a-z0-9-]*$/.test(draft.id) ||
      !['http:', 'https:'].includes(url.protocol)
    ) {
      setError('填写名称、小写英文标识及 HTTP 或 HTTPS 回调地址。');
      return;
    }
    if (clients.some((client) => client.id === draft.id)) {
      setError('客户端标识已存在，请换一个。');
      return;
    }
    setClients((current) => [
      {
        ...draft,
        name: draft.name.trim(),
        kind: 'Web 应用',
        status: '启用',
        scopes: ['profile'],
        requests: 0,
      },
      ...current,
    ]);
    setCreateOpen(false);
    setMessage('客户端已添加，仅对本次演示有效。');
  }
  function toggle() {
    if (!selected) return;
    setClients((current) =>
      current.map((client) =>
        client.id === selected.id
          ? { ...client, status: client.status === '启用' ? '停用' : '启用' }
          : client,
      ),
    );
    setMessage('客户端状态已更新，仅对本次演示有效。');
  }
  return (
    <>
      <PageHeader
        title="客户端管理"
        description="查看接入应用、回调地址与授权范围。"
        actions={
          <Button
            onClick={(event) => {
              createTrigger.current = event.currentTarget;
              setDraft({ name: '', id: '', callback: '' });
              setError('');
              setCreateOpen(true);
            }}
          >
            <Plus />
            新增客户端
          </Button>
        }
      />
      <p className="admin-demo-note">演示数据 · 不生成真实客户端凭据</p>
      <div className="list-toolbar">
        <div className="search-field">
          <Search aria-hidden="true" />
          <Input
            type="search"
            aria-label="搜索客户端"
            placeholder="搜索应用名称或标识…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <Select value={kind} onValueChange={setKind}>
          <SelectTrigger aria-label="筛选客户端类型">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部类型</SelectItem>
            {['Web 应用', '移动应用', '服务端'].map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <p className="table-scroll-hint">左右滑动查看完整表格</p>
      <div className="admin-table admin-table-framed">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>客户端</TableHead>
              <TableHead>类型</TableHead>
              <TableHead>状态</TableHead>
              <TableHead className="numeric">请求数</TableHead>
              <TableHead>
                <span className="sr-only">详情</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((client) => (
              <TableRow key={client.id}>
                <TableCell>
                  <strong>{client.name}</strong>
                  <small>{client.id}</small>
                </TableCell>
                <TableCell>{client.kind}</TableCell>
                <TableCell>
                  <span
                    className={client.status === '启用' ? 'admin-status' : 'admin-status muted'}
                  >
                    {client.status}
                  </span>
                </TableCell>
                <TableCell className="numeric">{client.requests.toLocaleString()}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={'查看' + client.name + ' 详情'}
                    onClick={(event) => {
                      trigger.current = event.currentTarget;
                      setSelectedId(client.id);
                      setDetailsOpen(true);
                    }}
                  >
                    <ArrowUpRight />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {!filtered.length && (
          <div className="empty-state">
            <h2>没有匹配的客户端</h2>
            <Button
              variant="outline"
              onClick={() => {
                setQuery('');
                setKind('all');
              }}
            >
              清除筛选
            </Button>
          </div>
        )}
      </div>
      <p className="list-footer">共 {filtered.length} 个客户端</p>
      {message && (
        <p role="status" className="admin-feedback">
          {message}
        </p>
      )}
      <Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
        <SheetContent
          className="client-sheet"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            trigger.current?.focus();
          }}
        >
          <SheetHeader>
            <SheetTitle>{selected?.name ?? '客户端详情'}</SheetTitle>
            <SheetDescription>接入信息与授权范围 · 演示数据</SheetDescription>
          </SheetHeader>
          {selected && (
            <div className="client-detail-body">
              <dl className="client-properties">
                <div>
                  <dt>客户端标识</dt>
                  <dd>
                    <code>{selected.id}</code>
                  </dd>
                </div>
                <div>
                  <dt>应用类型</dt>
                  <dd>{selected.kind}</dd>
                </div>
                <div>
                  <dt>状态</dt>
                  <dd>{selected.status}</dd>
                </div>
                <div>
                  <dt>回调地址</dt>
                  <dd>{selected.callback}</dd>
                </div>
                <div>
                  <dt>授权范围</dt>
                  <dd className="scope-list">
                    {selected.scopes.map((scope) => (
                      <code key={scope}>{scope}</code>
                    ))}
                  </dd>
                </div>
              </dl>
              <Button variant="outline" onClick={toggle}>
                {selected.status === '启用' ? '暂停演示客户端' : '启用演示客户端'}
              </Button>
              <p className="field-hint">状态切换仅影响此演示，不会中断真实服务。</p>
            </div>
          )}
        </SheetContent>
      </Sheet>
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            createTrigger.current?.focus();
          }}
          onOpenAutoFocus={(event) => {
            if (matchMedia('(pointer: coarse)').matches) {
              event.preventDefault();
              document.getElementById('client-create-title')?.focus();
            }
          }}
        >
          <DialogTitle id="client-create-title" tabIndex={-1}>
            新增客户端
          </DialogTitle>
          <DialogDescription>创建一个本地 Web 应用示例。</DialogDescription>
          <form onSubmit={create} className="editor-form" noValidate>
            {(
              [
                { key: 'name', label: '应用名称' },
                { key: 'id', label: '客户端标识' },
                { key: 'callback', label: '回调地址' },
              ] as const
            ).map((field) => (
              <div className="field" key={field.key}>
                <Label htmlFor={'client-' + field.key}>{field.label}</Label>
                <Input
                  id={'client-' + field.key}
                  type={field.key === 'callback' ? 'url' : 'text'}
                  value={draft[field.key]}
                  onChange={(event) => setDraft({ ...draft, [field.key]: event.target.value })}
                />
              </div>
            ))}
            {error && (
              <p role="alert" className="field-error">
                <AlertCircle />
                {error}
              </p>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                取消
              </Button>
              <Button type="submit">创建客户端</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
