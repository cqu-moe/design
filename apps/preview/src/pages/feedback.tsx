import { useEffect, useState, type FormEvent } from 'react';
import {
  Button,
  PageHeader,
  toast,
  Input,
  Label,
  Switch,
  Alert,
  AlertTitle,
  AlertDescription,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@cqu-moe/ui';
import {
  CheckCircle2,
  AlertCircle,
  Info,
  TriangleAlert,
  Archive,
  WifiOff,
  Wifi,
  X,
  ArrowRight,
} from 'lucide-react';
export function Feedback() {
  const [pending, setPending] = useState(false);
  const [archived, setArchived] = useState(false);
  const [connected, setConnected] = useState(true);
  const [reduce, setReduce] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    if (reduce) document.documentElement.dataset.motionPreview = 'reduce';
    else delete document.documentElement.dataset.motionPreview;
    return () => {
      delete document.documentElement.dataset.motionPreview;
    };
  }, [reduce]);
  useEffect(
    () => () => {
      toast.dismiss('feedback-undo');
      toast.dismiss('feedback-persistent');
    },
    [],
  );
  function request(fail: boolean) {
    if (pending) return;
    setPending(true);
    toast.promise(
      new Promise<void>((resolve, reject) =>
        setTimeout(() => (fail ? reject(new Error('保存失败，请重试。')) : resolve()), 900),
      ),
      {
        id: 'feedback-request',
        loading: '正在保存…',
        success: '保存成功（示例）',
        error: '保存失败，请重试。',
        description: '同一条通知更新状态，不重复弹出。',
        finally: () => setPending(false),
      },
    );
  }
  function archive() {
    setArchived(true);
    toast('演示记录已归档', {
      id: 'feedback-undo',
      description: '可以撤销这次本地操作。',
      duration: Infinity,
      action: { label: '撤销', onClick: () => setArchived(false) },
    });
  }
  function validate(event: FormEvent) {
    event.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('请输入有效的邮箱地址。');
      document.getElementById('feedback-email')?.focus();
    } else {
      setError('');
      toast.success('邮箱格式正确', { id: 'feedback-validation' });
    }
  }
  return (
    <>
      <PageHeader
        title="通知与反馈"
        description="操作结果用短提示，需要处理的问题留在原位。"
        actions={
          <Button variant="outline" onClick={() => toast.dismiss()}>
            <X />
            清空通知
          </Button>
        }
      />
      <p className="admin-demo-note">所有通知均为交互示例，可重复触发。</p>
      <section className="component-section">
        <div className="section-intro">
          <h2>短提示</h2>
          <p>
            轻量确认，不打断当前操作。
            <br />
            相同操作重复触发时更新已有通知。
          </p>
        </div>
        <div className="component-examples">
          <Button
            variant="outline"
            onClick={() =>
              toast.success('设置已保存（示例）', {
                id: 'feedback-success',
                description: '你的使用偏好已更新。',
              })
            }
          >
            <CheckCircle2 />
            成功通知
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              toast.error('操作未完成（示例）', {
                id: 'feedback-error',
                description: '请稍后重试。输入内容不会丢失。',
              })
            }
          >
            <AlertCircle />
            错误通知
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              toast.warning('有待确认的更改', {
                id: 'feedback-warning',
                description: '离开前检查尚未保存的内容。',
              })
            }
          >
            <TriangleAlert />
            警告通知
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              toast.info('新版本已准备就绪', {
                id: 'feedback-info',
                description: '这是一条普通信息提示。',
              })
            }
          >
            <Info />
            信息通知
          </Button>
        </div>
      </section>
      <section className="component-section">
        <div className="section-intro">
          <h2>异步状态</h2>
          <p>
            加载、完成和失败共用同一条通知。
            <br />
            等待期间阻止重复提交。
          </p>
        </div>
        <div className="component-examples">
          <Button variant="outline" disabled={pending} onClick={() => request(false)}>
            模拟保存成功
          </Button>
          <Button variant="outline" disabled={pending} onClick={() => request(true)}>
            模拟保存失败
          </Button>
        </div>
      </section>
      <section className="component-section">
        <div className="section-intro">
          <h2>可操作通知</h2>
          <p>
            需要下一步时提供明确的动作。
            <br />
            重要操作不能只靠短暂的提示承载。
          </p>
        </div>
        <div className="feedback-stack">
          <div className="component-examples">
            <Button variant="outline" disabled={archived} onClick={archive}>
              <Archive />
              归档演示记录
            </Button>
            {archived && (
              <Button
                variant="ghost"
                onClick={() => {
                  setArchived(false);
                  toast.dismiss('feedback-undo');
                }}
              >
                还原记录
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() =>
                toast.info('需要你手动关闭', {
                  id: 'feedback-persistent',
                  duration: Infinity,
                  description: '这条通知会保留，直到点击关闭或清空。',
                })
              }
            >
              持续通知
            </Button>
          </div>
          <p className="field-hint">演示记录：{archived ? '已归档' : '正常'}</p>
        </div>
      </section>
      <section className="component-section">
        <div className="section-intro">
          <h2>持续通知条</h2>
          <p>
            影响当前页面的问题持续显示，
            <br />
            直到问题解决或用户处理。
          </p>
        </div>
        <div className="feedback-stack">
          {connected ? (
            <>
              <p className="connection-state">
                <Wifi />
                演示连接正常
              </p>
              <Button variant="outline" onClick={() => setConnected(false)}>
                模拟连接中断
              </Button>
            </>
          ) : (
            <Alert variant="destructive">
              <WifiOff />
              <AlertTitle>连接已中断（示例）</AlertTitle>
              <AlertDescription>
                <p>暂时无法更新数据，当前内容会为你保留。</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setConnected(true);
                    toast.success('连接已恢复', { id: 'feedback-connection' });
                  }}
                >
                  重新连接
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </div>
      </section>
      <section className="component-section">
        <div className="section-intro">
          <h2>行内校验</h2>
          <p>
            字段错误出现在输入框附近，
            <br />
            不再同时弹出错误通知。
          </p>
        </div>
        <form className="feedback-stack" onSubmit={validate} noValidate>
          <div className="field">
            <Label htmlFor="feedback-email">联系邮箱示例</Label>
            <Input
              id="feedback-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              aria-invalid={!!error}
              aria-describedby={error ? 'feedback-email-error' : undefined}
              onChange={(event) => {
                setEmail(event.target.value);
                if (error && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(event.target.value)) setError('');
              }}
            />
            {error && (
              <p id="feedback-email-error" className="field-error">
                <AlertCircle />
                {error}
              </p>
            )}
          </div>
          <Button variant="outline" type="submit">
            验证邮箱格式
          </Button>
        </form>
      </section>
      <section className="component-section">
        <div className="section-intro">
          <h2>动效与辅助功能</h2>
          <p>
            只解释状态变化，保持操作及时。
            <br />
            键盘操作和系统减少动态效果始终优先。
          </p>
        </div>
        <div className="feedback-stack">
          <Label className="feedback-motion-switch" htmlFor="feedback-motion">
            <Switch id="feedback-motion" checked={reduce} onCheckedChange={setReduce} />
            <span>减少动态效果预览</span>
          </Label>
          <p className="field-hint">仅影响当前预览；离开此页恢复系统设置。</p>
          <div className="component-examples">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">预览确认弹窗</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogTitle>应用这些更改？</DialogTitle>
                <DialogDescription>确认后关闭弹窗，再显示操作结果。</DialogDescription>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">取消</Button>
                  </DialogClose>
                  <DialogClose asChild>
                    <Button
                      onClick={() =>
                        toast.success('更改已应用（示例）', { id: 'feedback-confirm' })
                      }
                    >
                      确认应用
                      <ArrowRight />
                    </Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline">预览侧边抽屉</Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>侧边内容</SheetTitle>
                  <SheetDescription>短距离进入，关闭后焦点返回触发按钮。</SheetDescription>
                </SheetHeader>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </section>
    </>
  );
}
