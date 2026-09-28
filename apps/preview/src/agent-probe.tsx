import { useId, useState } from 'react';
import { Button, Input, Label, PageHeader, Switch } from '@cqu-moe/ui';

export function AgentProbe() {
  const id = useId();
  const [email, setEmail] = useState('');
  const [enabled, setEnabled] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  return (
    <>
      <PageHeader
        title="通知偏好"
        description="此页仅用于演示，不会发送邮件。保存的设置仅在本页有效，刷新后清除。"
      />
      <form
        style={{ display: 'grid', gap: 'var(--space-6)' }}
        onSubmit={(event) => {
          event.preventDefault();
          setSaved(true);
        }}
      >
        <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
          <Label htmlFor={`${id}-email`}>通知邮箱</Label>
          <Input
            id={`${id}-email`}
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            aria-invalid={!!error}
            aria-describedby={`${id}-email-help`}
            onInvalid={() => setError('请输入有效的邮箱地址，例如 name@example.com。')}
            onChange={(event) => {
              setEmail(event.target.value);
              setSaved(false);
              if (event.target.validity.valid) setError('');
            }}
          />
          <p
            id={`${id}-email-help`}
            style={{ margin: 0, color: error ? 'var(--destructive)' : 'var(--muted-foreground)' }}
          >
            {error || '用于接收你选择开启的通知。'}
          </p>
        </div>
        <Label
          htmlFor={`${id}-enabled`}
          style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}
        >
          <Switch
            id={`${id}-enabled`}
            checked={enabled}
            onCheckedChange={(checked) => {
              setEnabled(checked);
              setSaved(false);
            }}
          />
          接收邮件通知
        </Label>
        <div style={{ display: 'grid', justifyItems: 'start', gap: 'var(--space-3)' }}>
          <Button type="submit" disabled={saved}>
            保存偏好
          </Button>
          <p role="status" style={{ margin: 0, color: 'var(--muted-foreground)' }}>
            {saved ? '已在本页保存。刷新后清除，未同步到服务器。' : '更改后点击“保存偏好”。'}
          </p>
        </div>
      </form>
    </>
  );
}
