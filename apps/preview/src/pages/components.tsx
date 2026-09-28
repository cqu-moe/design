import { useState } from 'react';
import {
  PageHeader,
  Button,
  Input,
  Label,
  Textarea,
  Checkbox,
  Switch,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  Skeleton,
  useTheme,
} from '@cqu-moe/ui';
import { Check, ArrowUpRight, LoaderCircle } from 'lucide-react';
export function Components() {
  const { preference, setPreference } = useTheme();
  const [checked, setChecked] = useState(false);
  return (
    <>
      <PageHeader
        title="组件与状态"
        description="同一套组件，同一套交互。为各个系统提供可直接复用的基础。"
        actions={<span className="preview-badge">shadcn/ui · Radix</span>}
      />
      <section className="component-section">
        <div className="section-intro">
          <h2>按钮</h2>
          <p>让主要动作明确，次要动作保持安静。</p>
        </div>
        <div className="component-examples">
          <Button>
            主要操作
            <ArrowUpRight />
          </Button>
          <Button variant="outline">次要操作</Button>
          <Button variant="ghost">轻量操作</Button>
          <Button variant="destructive">危险操作</Button>
          <Button disabled>不可用操作</Button>
          <Button disabled aria-busy="true">
            <LoaderCircle />
            正在处理
          </Button>
        </div>
      </section>
      <section className="component-section">
        <div className="section-intro">
          <h2>表单控件</h2>
          <p>清晰的标签、状态与焦点。</p>
        </div>
        <div className="component-form">
          <div className="field">
            <Label htmlFor="example-name">示例名称</Label>
            <Input id="example-name" placeholder="输入名称" />
          </div>
          <div className="field">
            <Label htmlFor="example-note">补充说明</Label>
            <Textarea id="example-note" placeholder="写下需要补充的内容…" />
          </div>
          <div className="field">
            <Label htmlFor="example-select">服务分类</Label>
            <Select defaultValue="learning">
              <SelectTrigger id="example-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="learning">学习工具</SelectItem>
                <SelectItem value="account">账号服务</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="control-row">
            <Checkbox
              id="agree"
              checked={checked}
              onCheckedChange={(v) => setChecked(v === true)}
            />
            <Label htmlFor="agree">接收通知</Label>
            <Switch id="example-switch" />
            <Label htmlFor="example-switch">启用服务</Label>
          </div>
        </div>
      </section>
      <section className="component-section">
        <div className="section-intro">
          <h2>外观与浮层</h2>
          <p>明暗主题共享布局和操作规则。</p>
        </div>
        <div className="component-examples">
          {(['light', 'dark', 'system'] as const).map((value, i) => (
            <Button
              key={value}
              variant={preference === value ? 'default' : 'outline'}
              onClick={() => setPreference(value)}
            >
              {['浅色', '深色', '跟随系统'][i]}
            </Button>
          ))}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">打开弹窗</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogTitle>确认设置</DialogTitle>
              <DialogDescription>
                这是一条用于展示的说明。按 Escape 或点击关闭，可返回触发位置。
              </DialogDescription>
              <DialogFooter>
                <DialogClose asChild>
                  <Button>
                    <Check />
                    知道了
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </section>
      <section className="component-section">
        <div className="section-intro">
          <h2>加载状态</h2>
          <p>保留内容轮廓，减少布局跳动。</p>
        </div>
        <div className="loading-list">
          <Skeleton className="loading-row" />
          <Skeleton className="loading-row" />
        </div>
      </section>
    </>
  );
}
