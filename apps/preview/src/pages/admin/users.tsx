import { useRef, useState, type FormEvent } from 'react';
import {
  Button,
  PageState,
  toast,
  Checkbox,
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
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@cqu-moe/ui';
import { Search, Plus, Pencil, ChevronLeft, ChevronRight, AlertCircle, X } from 'lucide-react';
import { useAdminData } from './state';
import type { DemoUser } from '../../admin-data';
import { UserFilterPanel, emptyFilters, type UserFilters } from './user-filters';
const bulkLabels = {
  enable: '启用账号',
  disable: '停用账号',
  member: '设为成员',
  admin: '设为管理员',
} as const;
type BulkAction = keyof typeof bulkLabels;
export function Users() {
  const { users, setUsers } = useAdminData();
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<UserFilters>(emptyFilters);
  const [pageSize, setPageSize] = useState(5);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<BulkAction | ''>('');
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkDraft, setBulkDraft] = useState<{ action: BulkAction; ids: string[] }>({
    action: 'disable',
    ids: [],
  });
  const bulkTrigger = useRef<HTMLButtonElement | null>(null);
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DemoUser | null>(null);
  const [error, setError] = useState('');
  const trigger = useRef<HTMLButtonElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  function restoreFocus(target: HTMLButtonElement | null) {
    if (target?.isConnected && !target.disabled) target.focus();
    else searchRef.current?.focus();
  }
  const filtered = users.filter(
    (user) =>
      `${user.name} ${user.email}`.toLowerCase().includes(query.toLowerCase()) &&
      (filters.status === 'all' || user.status === filters.status) &&
      (filters.role === 'all' || user.role === filters.role) &&
      (!filters.domain || user.email.split('@')[1]?.toLowerCase() === filters.domain) &&
      (!filters.from || user.joined >= filters.from) &&
      (!filters.to || user.joined <= filters.to),
  );
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pages);
  const visible = filtered.slice((current - 1) * pageSize, current * pageSize);
  const visibleSelected = visible.filter((user) => selected.has(user.id)).length;
  const chips = [
    filters.role !== 'all' && { key: 'role' as const, label: `角色：${filters.role}` },
    filters.status !== 'all' && { key: 'status' as const, label: `状态：${filters.status}` },
    filters.domain && { key: 'domain' as const, label: `域名：${filters.domain}` },
    filters.from && { key: 'from' as const, label: `开始：${filters.from}` },
    filters.to && { key: 'to' as const, label: `结束：${filters.to}` },
  ].filter(Boolean) as { key: keyof UserFilters; label: string }[];
  function applyFilters(value: UserFilters) {
    setFilters(value);
    setPage(1);
    setSelected(new Set());
    toast.dismiss('user-operation');
  }
  function resetFilters() {
    setQuery('');
    applyFilters(emptyFilters);
  }
  function selectOne(id: string, checked: boolean) {
    setSelected((previous) => {
      const next = new Set(previous);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }
  function selectPage(checked: boolean) {
    setSelected((previous) => {
      const next = new Set(previous);
      for (const user of visible) {
        if (checked) next.add(user.id);
        else next.delete(user.id);
      }
      return next;
    });
  }
  function applyBulk() {
    const ids = new Set(bulkDraft.ids);
    const changes: Partial<DemoUser> =
      bulkDraft.action === 'enable'
        ? { status: '正常' }
        : bulkDraft.action === 'disable'
          ? { status: '停用' }
          : bulkDraft.action === 'admin'
            ? { role: '管理员' }
            : { role: '成员' };
    setUsers((all) => all.map((user) => (ids.has(user.id) ? { ...user, ...changes } : user)));
    setSelected(new Set());
    setBulkAction('');
    setBulkOpen(false);
    setPage(1);
    toast.success(
      `已对 ${ids.size} 位用户应用“${bulkLabels[bulkDraft.action]}”，仅对本次演示有效。`,
      { id: 'user-operation' },
    );
  }
  function edit(user: DemoUser | null, button: HTMLButtonElement) {
    trigger.current = button;
    setError('');
    setDraft(
      user
        ? { ...user }
        : { id: '', name: '', email: '', role: '成员', status: '正常', joined: '2026-09-29' },
    );
    setOpen(true);
  }
  function save(event: FormEvent) {
    event.preventDefault();
    if (!draft) return;
    if (!draft.name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email)) {
      setError('请填写显示名称和有效邮箱。');
      return;
    }
    if (
      users.some(
        (user) => user.id !== draft.id && user.email.toLowerCase() === draft.email.toLowerCase(),
      )
    ) {
      setError('此邮箱已被其他演示用户使用。');
      return;
    }
    const user = {
      ...draft,
      name: draft.name.trim(),
      email: draft.email.trim(),
      id: draft.id || crypto.randomUUID(),
    };
    setUsers((all) =>
      draft.id ? all.map((item) => (item.id === draft.id ? user : item)) : [user, ...all],
    );
    setOpen(false);
    setSelected(new Set());
    toast.success('用户已保存，仅对本次演示有效。', { id: 'user-operation' });
  }
  return (
    <>
      <PageHeader
        title="用户管理"
        description="管理工作空间成员、角色与账号状态。"
        actions={
          <Button onClick={(event) => edit(null, event.currentTarget)}>
            <Plus />
            新增用户
          </Button>
        }
      />
      <p className="admin-demo-note">演示操作在后台页面间保留，离开后台或刷新后恢复。</p>
      <div className="list-toolbar user-toolbar">
        <div className="search-field">
          <Search aria-hidden="true" />
          <Input
            ref={searchRef}
            type="search"
            aria-label="搜索用户"
            placeholder="搜索姓名或邮箱…"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
              setSelected(new Set());
              toast.dismiss('user-operation');
            }}
          />
        </div>
        <Select
          value={filters.status}
          onValueChange={(status) =>
            applyFilters({ ...filters, status: status as UserFilters['status'] })
          }
        >
          <SelectTrigger aria-label="筛选用户状态">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="正常">正常</SelectItem>
            <SelectItem value="停用">停用</SelectItem>
          </SelectContent>
        </Select>
        <UserFilterPanel value={filters} onApply={applyFilters} />
      </div>
      {(chips.length > 0 || query) && (
        <div className="filter-chips">
          {chips.map((chip) => (
            <Button
              key={chip.key}
              size="sm"
              variant="outline"
              aria-label={'移除' + chip.label + '筛选'}
              onClick={() => applyFilters({ ...filters, [chip.key]: emptyFilters[chip.key] })}
            >
              {chip.label}
              <X aria-hidden="true" />
            </Button>
          ))}
          <Button size="sm" variant="ghost" onClick={resetFilters}>
            重置全部筛选
          </Button>
        </div>
      )}
      {selected.size > 0 && (
        <div
          className="bulk-toolbar"
          role="region"
          aria-label="批量操作工具栏"
          aria-describedby="bulk-help"
        >
          <div className="bulk-selection">
            <strong title="跨页保留选择，修改筛选时清空。">已选择 {selected.size} 位用户</strong>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setSelected(new Set());
                setBulkAction('');
              }}
            >
              清除选择
            </Button>
          </div>
          <div className="bulk-actions">
            <Select
              value={bulkAction}
              onValueChange={(value) => setBulkAction(value as BulkAction)}
            >
              <SelectTrigger size="sm" aria-label="批量操作">
                <SelectValue placeholder="选择批量操作" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(bulkLabels).map(([value, label]) => (
                  <SelectItem value={value} key={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              disabled={!bulkAction}
              onClick={(event) => {
                if (!bulkAction) return;
                bulkTrigger.current = event.currentTarget;
                setBulkDraft({ action: bulkAction, ids: [...selected] });
                setBulkOpen(true);
              }}
            >
              应用更改
            </Button>
          </div>
          <span id="bulk-help" className="sr-only">
            跨页保留选择，修改筛选时清空。
          </span>
        </div>
      )}
      <p className="table-scroll-hint">左右滑动查看完整表格</p>
      <div className="admin-table admin-table-framed">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="selection-column">
                <Checkbox
                  id="select-all-users"
                  aria-label="选择本页全部用户"
                  disabled={!visible.length}
                  checked={
                    visible.length > 0 && visibleSelected === visible.length
                      ? true
                      : visibleSelected > 0
                        ? 'indeterminate'
                        : false
                  }
                  onCheckedChange={(checked) => selectPage(checked === true)}
                />
              </TableHead>
              <TableHead>用户</TableHead>
              <TableHead>角色</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>加入时间</TableHead>
              <TableHead>
                <span className="sr-only">操作</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((user) => (
              <TableRow key={user.id} data-state={selected.has(user.id) ? 'selected' : undefined}>
                <TableCell className="selection-column">
                  <Checkbox
                    aria-label={'选择' + user.name}
                    checked={selected.has(user.id)}
                    onCheckedChange={(checked) => selectOne(user.id, checked === true)}
                  />
                </TableCell>
                <TableCell>
                  <strong>{user.name}</strong>
                  <small>{user.email}</small>
                </TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell>
                  <span className={user.status === '正常' ? 'admin-status' : 'admin-status muted'}>
                    {user.status}
                  </span>
                </TableCell>
                <TableCell className="numeric">{user.joined}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={'编辑' + user.name}
                    onClick={(event) => edit(user, event.currentTarget)}
                  >
                    <Pencil />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {!filtered.length && (
          <PageState
            state="empty"
            title="没有匹配的用户"
            description="试试其他条件，或清除当前筛选。"
            action={
              <Button variant="outline" onClick={resetFilters}>
                清除筛选
              </Button>
            }
          />
        )}
      </div>
      <div className="list-footer user-pagination">
        <span>共 {filtered.length} 位用户</span>
        <div className="pagination">
          <Select
            value={String(pageSize)}
            onValueChange={(value) => {
              setPageSize(Number(value));
              setPage(1);
            }}
          >
            <SelectTrigger aria-label="每页条数">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[5, 10, 20, 50].map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size} 条 / 页
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            aria-label="上一页"
            disabled={current === 1}
            onClick={() => setPage(current - 1)}
          >
            <ChevronLeft />
          </Button>
          <span>
            {current} / {pages}
          </span>
          <Button
            variant="outline"
            size="icon"
            aria-label="下一页"
            disabled={current === pages}
            onClick={() => setPage(current + 1)}
          >
            <ChevronRight />
          </Button>
        </div>
      </div>
      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            restoreFocus(bulkTrigger.current);
          }}
        >
          <DialogTitle>确认批量更改</DialogTitle>
          <DialogDescription>
            将对 {bulkDraft.ids.length} 位用户执行“{bulkLabels[bulkDraft.action]}
            ”。此操作仅修改演示数据。
          </DialogDescription>
          <ul className="bulk-preview">
            {users
              .filter((user) => bulkDraft.ids.includes(user.id))
              .slice(0, 5)
              .map((user) => (
                <li key={user.id}>
                  {user.name}
                  <span>{user.email}</span>
                </li>
              ))}
            {bulkDraft.ids.length > 5 && <li>另有 {bulkDraft.ids.length - 5} 位用户</li>}
          </ul>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkOpen(false)}>
              取消
            </Button>
            <Button
              variant={bulkDraft.action === 'disable' ? 'destructive' : 'default'}
              onClick={applyBulk}
            >
              确认应用
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            restoreFocus(trigger.current);
          }}
          onOpenAutoFocus={(event) => {
            if (matchMedia('(pointer: coarse)').matches) {
              event.preventDefault();
              document.getElementById('user-editor-title')?.focus();
            }
          }}
        >
          <DialogTitle id="user-editor-title" tabIndex={-1}>
            {draft?.id ? '编辑用户' : '新增用户'}
          </DialogTitle>
          <DialogDescription>修改仅在当前演示中生效。</DialogDescription>
          {draft && (
            <form onSubmit={save} className="editor-form" noValidate>
              <div className="field">
                <Label htmlFor="user-name">显示名称</Label>
                <Input
                  id="user-name"
                  value={draft.name}
                  onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                />
              </div>
              <div className="field">
                <Label htmlFor="user-email">邮箱</Label>
                <Input
                  id="user-email"
                  type="email"
                  value={draft.email}
                  onChange={(event) => setDraft({ ...draft, email: event.target.value })}
                />
              </div>
              <div className="field">
                <Label htmlFor="user-role">角色</Label>
                <Select
                  value={draft.role}
                  onValueChange={(value) => setDraft({ ...draft, role: value as DemoUser['role'] })}
                >
                  <SelectTrigger id="user-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="成员">成员</SelectItem>
                    <SelectItem value="管理员">管理员</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="field">
                <Label htmlFor="user-status">账号状态</Label>
                <Select
                  value={draft.status}
                  onValueChange={(value) =>
                    setDraft({ ...draft, status: value as DemoUser['status'] })
                  }
                >
                  <SelectTrigger id="user-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="正常">正常</SelectItem>
                    <SelectItem value="停用">停用</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {error && (
                <p role="alert" className="field-error">
                  <AlertCircle />
                  {error}
                </p>
              )}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  取消
                </Button>
                <Button type="submit">保存用户</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
