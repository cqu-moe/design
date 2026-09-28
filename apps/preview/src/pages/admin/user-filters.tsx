import { useState } from 'react';
import {
  Button,
  Input,
  Label,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@cqu-moe/ui';
import { SlidersHorizontal, AlertCircle } from 'lucide-react';
import type { DemoUser } from '../../admin-data';
export type UserFilters = {
  status: 'all' | DemoUser['status'];
  role: 'all' | DemoUser['role'];
  domain: string;
  from: string;
  to: string;
};
export const emptyFilters: UserFilters = {
  status: 'all',
  role: 'all',
  domain: '',
  from: '',
  to: '',
};
export function UserFilterPanel({
  value,
  onApply,
}: {
  value: UserFilters;
  onApply: (value: UserFilters) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const [error, setError] = useState('');
  const count = Object.entries(value).filter(
    ([key, v]) => v !== emptyFilters[key as keyof UserFilters],
  ).length;
  function apply(event: React.FormEvent) {
    event.preventDefault();
    if (draft.from && draft.to && draft.from > draft.to) {
      setError('起始日期不能晚于结束日期。');
      return;
    }
    const domain = draft.domain.trim().replace(/^@/, '').toLowerCase();
    if (domain && !/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/.test(domain)) {
      setError('请输入有效的邮箱域名，例如 example.test。');
      return;
    }
    onApply({ ...draft, domain });
    setOpen(false);
  }
  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (next) {
          setDraft(value);
          setError('');
        }
        setOpen(next);
      }}
    >
      <SheetTrigger asChild>
        <Button variant="outline" aria-label="高级筛选">
          <SlidersHorizontal />
          高级筛选
          {count > 0 && (
            <span className="filter-count" aria-hidden="true">
              {count}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent
        className="filter-sheet"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          document.getElementById('filters-title')?.focus();
        }}
      >
        <SheetHeader>
          <SheetTitle id="filters-title" tabIndex={-1}>
            高级筛选
          </SheetTitle>
          <SheetDescription>同时满足以下条件。应用后会清空当前选择。</SheetDescription>
        </SheetHeader>
        <form className="filter-form" onSubmit={apply} noValidate>
          <div className="field">
            <Label htmlFor="filter-role">角色</Label>
            <Select
              value={draft.role}
              onValueChange={(role) => setDraft({ ...draft, role: role as UserFilters['role'] })}
            >
              <SelectTrigger id="filter-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部角色</SelectItem>
                <SelectItem value="管理员">管理员</SelectItem>
                <SelectItem value="成员">成员</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="field">
            <Label htmlFor="filter-status">账号状态</Label>
            <Select
              value={draft.status}
              onValueChange={(status) =>
                setDraft({ ...draft, status: status as UserFilters['status'] })
              }
            >
              <SelectTrigger id="filter-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="正常">正常</SelectItem>
                <SelectItem value="停用">停用</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="field">
            <Label htmlFor="filter-domain">邮箱域名</Label>
            <Input
              id="filter-domain"
              placeholder="example.test"
              value={draft.domain}
              onChange={(event) => setDraft({ ...draft, domain: event.target.value })}
            />
            <p className="field-hint">精确匹配 @ 后的域名，不区分大小写。</p>
          </div>
          <div className="field">
            <Label htmlFor="filter-from">加入日期起始</Label>
            <Input
              id="filter-from"
              type="date"
              value={draft.from}
              onChange={(event) => {
                setDraft({ ...draft, from: event.target.value });
                setError('');
              }}
            />
          </div>
          <div className="field">
            <Label htmlFor="filter-to">加入日期结束</Label>
            <Input
              id="filter-to"
              type="date"
              value={draft.to}
              onChange={(event) => {
                setDraft({ ...draft, to: event.target.value });
                setError('');
              }}
            />
          </div>
          {error && (
            <p role="alert" className="field-error">
              <AlertCircle />
              {error}
            </p>
          )}
          <div className="filter-actions">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDraft(emptyFilters);
                setError('');
              }}
            >
              重置条件
            </Button>
            <Button type="submit">应用筛选</Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
