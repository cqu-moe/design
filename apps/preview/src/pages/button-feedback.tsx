import { useEffect, useRef, useState } from 'react';
import {
  ActionButton,
  type ActionButtonState,
  Label,
  Switch,
  Alert,
  AlertTitle,
  AlertDescription,
  toast,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  Button,
} from '@cqu-moe/ui';
import { AlertCircle } from 'lucide-react';
const saveLabels = {
  idle: '保存设置',
  loading: '正在保存设置…',
  success: '设置已保存',
  error: '重试保存',
};
const exportLabels = {
  idle: '导出报告',
  loading: '正在导出报告…',
  success: '报告已完成',
  error: '重试导出',
};
export function ButtonFeedback() {
  const [saveState, setSaveState] = useState<ActionButtonState>('idle');
  const [exportState, setExportState] = useState<ActionButtonState>('idle');
  const [fail, setFail] = useState(false);
  const [revision, setRevision] = useState(1);
  const [details, setDetails] = useState(false);
  const timers = useRef<{
    save: ReturnType<typeof setTimeout> | null;
    export: ReturnType<typeof setTimeout> | null;
  }>({ save: null, export: null });
  useEffect(
    () => () => {
      for (const timer of Object.values(timers.current)) if (timer !== null) clearTimeout(timer);
      toast.dismiss('feedback-button-export');
    },
    [],
  );
  function save() {
    if (timers.current.save !== null) return;
    setSaveState('loading');
    timers.current.save = setTimeout(() => {
      timers.current.save = null;
      if (fail) setSaveState('error');
      else {
        setRevision((value) => value + 1);
        setSaveState('success');
      }
    }, 1000);
  }
  function exportReport() {
    if (timers.current.export !== null) return;
    setExportState('loading');
    timers.current.export = setTimeout(() => {
      timers.current.export = null;
      setExportState('success');
      toast.info('演示结果已就绪', {
        id: 'feedback-button-export',
        description: '通知提供详情入口，完成状态留在按钮上。',
        duration: 8000,
        action: { label: '查看详情', onClick: () => setDetails(true) },
      });
    }, 1200);
  }
  return (
    <section className="component-section">
      <div className="section-intro">
        <h2>按钮状态反馈</h2>
        <p>
          操作、进行中与结果在按钮内切换。
          <br />
          文案和图标更新，宽度保持稳定。
        </p>
      </div>
      <div className="feedback-stack button-feedback-examples">
        <div className="button-feedback-case">
          <div className="component-examples">
            <ActionButton state={saveState} labels={saveLabels} onClick={save} />
            <Label htmlFor="button-failure">
              <Switch
                id="button-failure"
                checked={fail}
                disabled={saveState === 'loading'}
                onCheckedChange={setFail}
              />
              模拟按钮失败
            </Label>
          </div>
          <p className="field-hint">演示配置：第 {revision} 版</p>
          <p className="field-hint">简单保存直接反馈在按钮上，不再额外弹成功通知。</p>
          {saveState === 'error' && (
            <Alert variant="destructive">
              <AlertCircle />
              <AlertTitle>保存未完成（示例）</AlertTitle>
              <AlertDescription>修改已保留。关闭失败模拟后，可点击“重试保存”。</AlertDescription>
            </Alert>
          )}
        </div>
        <div className="button-feedback-case">
          <ActionButton
            id="feedback-export"
            variant="outline"
            state={exportState}
            labels={exportLabels}
            onClick={exportReport}
          />
          <p className="field-hint">需要更多信息时，用通知补充“查看详情”等下一步操作。</p>
        </div>
      </div>
      <Dialog open={details} onOpenChange={setDetails}>
        <DialogContent
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            document.getElementById('feedback-export')?.focus();
          }}
        >
          <DialogTitle>导出结果示例</DialogTitle>
          <DialogDescription>
            任务状态：已完成。这是本地交互示例，没有创建或下载真实文件。
          </DialogDescription>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">关闭</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
