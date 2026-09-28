import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router';
import {
  ActionButton,
  Input,
  Label,
  Switch,
  useTheme,
  PageHeader,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@cqu-moe/ui';
import { Sun, Moon, Monitor, Check, AlertCircle } from 'lucide-react';
const sections = ['profile', 'appearance', 'notifications'] as const;
type Section = (typeof sections)[number];
type Profile = { name: string; email: string; notify: boolean };
type Field = 'name' | 'email';
const initial: Profile = { name: '林同学', email: 'student@example.edu', notify: true };
function errorFor(field: Field, value: string) {
  return field === 'name'
    ? value.trim()
      ? ''
      : '请输入显示名称。'
    : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
      ? ''
      : '请输入有效的邮箱地址。';
}
export function Settings() {
  const { preference, setPreference } = useTheme();
  const [params, setParams] = useSearchParams();
  const requested = params.get('section');
  const section: Section = sections.includes(requested as Section)
    ? (requested as Section)
    : 'profile';
  const [direction, setDirection] = useState<'none' | 'forward' | 'backward'>('none');
  const [draft, setDraft] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [pending, setPending] = useState<Field | 'all' | null>(null);
  const lock = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [outcome, setOutcome] = useState<{
    scope: Field | 'all';
    state: 'success' | 'error';
  } | null>(null);
  useEffect(
    () => () => {
      if (timer.current !== null) clearTimeout(timer.current);
    },
    [],
  );
  function actionState(scope: Field | 'all') {
    return pending === scope ? 'loading' : outcome?.scope === scope ? outcome.state : 'idle';
  }
  const [result, setResult] = useState<string | null>(null);
  const [fail, setFail] = useState(false);
  const [focusField, setFocusField] = useState<Field | null>(null);
  const dirty = (Object.keys(draft) as (keyof Profile)[]).filter(
    (key) => draft[key] !== saved[key],
  );
  function choose(value: string) {
    const next = value as Section;
    setDirection(sections.indexOf(next) > sections.indexOf(section) ? 'forward' : 'backward');
    setParams((previous) => {
      const query = new URLSearchParams(previous);
      query.set('section', next);
      return query;
    });
  }
  function edit(field: Field, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
    setErrors((current) =>
      current[field] ? { ...current, [field]: errorFor(field, value) } : current,
    );
    setResult(null);
    setOutcome(null);
  }
  function save(scope: Field | 'all') {
    if (lock.current) return;
    const fields: Field[] = scope === 'all' ? ['name', 'email'] : [scope];
    const next = Object.fromEntries(fields.map((field) => [field, errorFor(field, draft[field])]));
    setErrors((current) => ({ ...current, ...next }));
    setResult(null);
    setOutcome(null);
    const invalid = fields.find((field) => next[field]);
    if (invalid) {
      if (section !== 'profile') choose('profile');
      setFocusField(invalid);
      return;
    }
    lock.current = true;
    setPending(scope);
    const snapshot = { ...draft };
    timer.current = setTimeout(() => {
      if (fail) setResult('保存失败，输入已保留，请重试。');
      else {
        setSaved((current) =>
          scope === 'all' ? snapshot : { ...current, [scope]: snapshot[scope] },
        );
      }
      setOutcome({ scope, state: fail ? 'error' : 'success' });
      setPending(null);
      lock.current = false;
    }, 450);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void save('all');
  }
  return (
    <>
      <PageHeader
        title="账号设置"
        description="管理个人资料，调整适合自己的使用方式。"
        actions={<span className="preview-badge">个人空间</span>}
      />
      <form onSubmit={submit} noValidate>
        <Tabs value={section} onValueChange={choose} className="settings-tabs">
          <TabsList variant="line" aria-label="账号设置子页面" className="settings-tab-list">
            <TabsTrigger value="profile">个人资料</TabsTrigger>
            <TabsTrigger value="appearance">外观</TabsTrigger>
            <TabsTrigger value="notifications">通知</TabsTrigger>
          </TabsList>
          <div className="settings-form">
            <div className="settings-panel-viewport">
              <TabsContent value="profile" className="settings-pane" data-direction={direction}>
                <section className="settings-section">
                  <div className="section-intro">
                    <h2>个人资料</h2>
                    <p>
                      更新你的称呼和联系邮箱。
                      <br />
                      可单独保存，也可一次保存全部更改。
                    </p>
                  </div>
                  <fieldset className="section-fields">
                    <div className="avatar-row">
                      <span className="avatar" aria-hidden="true">
                        {saved.name.slice(0, 1)}
                      </span>
                      <div>
                        <strong>{saved.name}</strong>
                        <p>学生账号 · 演示数据</p>
                      </div>
                    </div>
                    {(['name', 'email'] as const).map((field) => {
                      const label = field === 'name' ? '显示名称' : '联系邮箱';
                      const id = field === 'name' ? 'display-name' : 'email';
                      return (
                        <div className="field" key={field}>
                          <Label htmlFor={id}>{label}</Label>
                          <div className="inline-save-row">
                            <Input
                              id={id}
                              ref={(element) => {
                                if (element && focusField === field) {
                                  element.focus();
                                  setFocusField(null);
                                }
                              }}
                              disabled={pending !== null}
                              name={field}
                              type={field === 'email' ? 'email' : 'text'}
                              autoComplete={field}
                              value={draft[field]}
                              aria-invalid={!!errors[field]}
                              aria-describedby={errors[field] ? `${field}-error` : `${field}-help`}
                              onChange={(event) => edit(field, event.target.value)}
                            />
                            <ActionButton
                              type="button"
                              variant="outline"
                              aria-label={'保存' + label}
                              state={actionState(field)}
                              labels={{
                                idle: '保存',
                                loading: '保存中…',
                                success: '已保存',
                                error: '重试',
                              }}
                              disabled={
                                (pending !== null && pending !== field) ||
                                draft[field] === saved[field]
                              }
                              onClick={() => save(field)}
                            />
                          </div>
                          <p id={`${field}-help`} className="field-hint">
                            {draft[field] !== saved[field]
                              ? '有未保存的修改'
                              : field === 'name'
                                ? '用于个人主页和服务内的称呼。'
                                : '用于接收重要服务通知。'}
                          </p>
                          {errors[field] && (
                            <p id={`${field}-error`} className="field-error">
                              <AlertCircle />
                              {errors[field]}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </fieldset>
                </section>
              </TabsContent>
              <TabsContent value="appearance" className="settings-pane" data-direction={direction}>
                <section className="settings-section">
                  <div className="section-intro">
                    <h2>外观</h2>
                    <p>
                      选择浅色、深色，或跟随设备设置。
                      <br />
                      外观更改立即生效，无需保存。
                    </p>
                  </div>
                  <div className="theme-choices" role="group" aria-label="主题偏好">
                    {(['light', 'dark', 'system'] as const).map((value, i) => {
                      const Icon = [Sun, Moon, Monitor][i];
                      return (
                        <button
                          type="button"
                          className="theme-choice"
                          key={value}
                          aria-pressed={preference === value}
                          onClick={() => setPreference(value)}
                        >
                          <span
                            className={`theme-thumbnail theme-thumbnail-${value}`}
                            aria-hidden="true"
                          >
                            <span className="mini-sidebar" />
                            <span className="mini-content">
                              <i />
                              <i />
                              <i />
                            </span>
                          </span>
                          <span className="theme-choice-caption">
                            <Icon size={16} aria-hidden="true" />
                            {['浅色', '深色', '跟随系统'][i]}
                            {preference === value && <Check size={16} aria-hidden="true" />}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              </TabsContent>
              <TabsContent
                value="notifications"
                className="settings-pane"
                data-direction={direction}
              >
                <section className="settings-section">
                  <div className="section-intro">
                    <h2>通知</h2>
                    <p>
                      只接收与你有关的重要消息。
                      <br />
                      调整后使用下方按钮保存。
                    </p>
                  </div>
                  <div className="notification-row">
                    <Label htmlFor="notify">
                      <span>
                        <strong>服务更新通知</strong>
                        <span className="field-hint">课表变更和账号提醒，通过邮箱通知。</span>
                      </span>
                    </Label>
                    <Switch
                      id="notify"
                      disabled={pending !== null}
                      checked={draft.notify}
                      onCheckedChange={(notify) => {
                        setDraft((current) => ({ ...current, notify }));
                        setResult(null);
                        setOutcome(null);
                      }}
                    />
                  </div>
                </section>
              </TabsContent>
            </div>
            <footer className="form-footer">
              <div>
                <span className="field-hint">
                  {dirty.length ? `${dirty.length} 项未保存修改` : '所有更改已保存'}
                </span>
                <span className="field-hint">仅演示，不会修改真实账号。</span>
              </div>
              <ActionButton
                type="submit"
                state={actionState('all')}
                labels={{
                  idle: '保存更改',
                  loading: '正在保存…',
                  success: '已保存',
                  error: '重试保存',
                }}
                disabled={(pending !== null && pending !== 'all') || dirty.length === 0}
              />
            </footer>
            {result && (
              <p role="alert" className="form-result error">
                <AlertCircle />
                {result}
              </p>
            )}
          </div>
        </Tabs>
      </form>
      <details className="demo-controls">
        <summary>演示状态</summary>
        <label>
          <input
            type="checkbox"
            checked={fail}
            onChange={(event) => setFail(event.target.checked)}
          />
          模拟保存失败
        </label>
        <p>用于检查失败反馈与重试流程。</p>
      </details>
    </>
  );
}
