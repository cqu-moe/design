import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router';
import {
  Button,
  ActionButton,
  Input,
  Label,
  Checkbox,
  ThemeMenu,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@cqu-moe/ui';
import { Box, ArrowLeft, ArrowRight, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
type Mode = 'login' | 'register';
type Field = 'name' | 'email' | 'password';
function AuthForm({
  mode,
  email,
  onEmailChange,
}: {
  mode: Mode;
  email: string;
  onEmailChange: (value: string) => void;
}) {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [fail, setFail] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [result, setResult] = useState<'success' | 'error' | null>(null);
  const lock = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current !== null) clearTimeout(timer.current);
    },
    [],
  );
  const passwordId = mode === 'login' ? 'current-password' : 'new-password';
  function validate(field: Field, value: string) {
    if (field === 'name') return value.trim() ? '' : '请输入显示名称。';
    if (field === 'email')
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? '' : '请输入有效的邮箱地址。';
    if (!value) return '请输入密码。';
    return mode === 'register' && Array.from(value).length < 8 ? '密码至少需要 8 个字符。' : '';
  }
  function change(field: Field, value: string) {
    if (field === 'name') setName(value);
    else if (field === 'email') onEmailChange(value);
    else setPassword(value);
    if (errors[field]) setErrors((current) => ({ ...current, [field]: validate(field, value) }));
    setResult(null);
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    if (lock.current || result === 'success') return;
    const next = {
      name: mode === 'register' ? validate('name', name) : '',
      email: validate('email', email),
      password: validate('password', password),
    };
    setErrors(next);
    setResult(null);
    const invalid = (['name', 'email', 'password'] as const).find((field) => next[field]);
    if (invalid) {
      document.getElementById(invalid === 'password' ? passwordId : `auth-${invalid}`)?.focus();
      return;
    }
    lock.current = true;
    setPending(true);
    timer.current = setTimeout(() => {
      setPending(false);
      lock.current = false;
      setResult(fail ? 'error' : 'success');
      if (!fail) {
        setPassword('');
        setShowPassword(false);
      }
    }, 500);
  }
  function demo() {
    setName('演示用户');
    onEmailChange('demo@example.test');
    setPassword('Demo12345!');
    setErrors({});
    setResult(null);
  }
  return (
    <>
      <form onSubmit={submit} noValidate className="auth-form">
        <fieldset disabled={pending} className="auth-fields">
          {mode === 'register' && (
            <div className="field">
              <Label htmlFor="auth-name">显示名称</Label>
              <Input
                id="auth-name"
                name="name"
                autoComplete="name"
                placeholder="怎么称呼你"
                value={name}
                onChange={(event) => change('name', event.target.value)}
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? 'auth-name-error' : undefined}
                required
              />
              {errors.name && (
                <p className="field-error" id="auth-name-error">
                  <AlertCircle />
                  {errors.name}
                </p>
              )}
            </div>
          )}
          <div className="field">
            <Label htmlFor="auth-email">邮箱</Label>
            <Input
              id="auth-email"
              name="email"
              type="email"
              autoComplete="username"
              inputMode="email"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="you@example.com"
              value={email}
              onChange={(event) => change('email', event.target.value)}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'auth-email-error' : undefined}
              required
            />
            {errors.email && (
              <p className="field-error" id="auth-email-error">
                <AlertCircle />
                {errors.email}
              </p>
            )}
          </div>
          <div className="field">
            <Label htmlFor={passwordId}>密码</Label>
            <div className="auth-password">
              <Input
                id={passwordId}
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                enterKeyHint="go"
                placeholder={mode === 'login' ? '输入密码' : '至少 8 个字符'}
                value={password}
                onChange={(event) => change('password', event.target.value)}
                aria-invalid={!!errors.password}
                aria-describedby={
                  errors.password
                    ? 'auth-password-error'
                    : mode === 'register'
                      ? 'auth-password-help'
                      : undefined
                }
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="auth-password-toggle"
                aria-label={showPassword ? '隐藏密码' : '显示密码'}
                aria-pressed={showPassword}
                aria-controls={passwordId}
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
              </Button>
            </div>
            {errors.password ? (
              <p className="field-error" id="auth-password-error">
                <AlertCircle />
                {errors.password}
              </p>
            ) : (
              mode === 'register' && (
                <p className="field-hint" id="auth-password-help">
                  支持粘贴或使用密码管理器生成密码。
                </p>
              )
            )}
          </div>
        </fieldset>
        <ActionButton
          type="submit"
          className="auth-submit"
          disabled={result === 'success'}
          state={pending ? 'loading' : (result ?? 'idle')}
          labels={{
            idle: mode === 'login' ? '登录' : '创建账号',
            loading: mode === 'login' ? '正在登录…' : '正在创建…',
            success: mode === 'login' ? '登录演示完成' : '注册演示完成',
            error: '重试提交',
          }}
        />
        {result === 'error' && (
          <p role="alert" className="auth-result error">
            <AlertCircle />
            提交失败，请重试。输入已保留。
          </p>
        )}
        {result === 'success' && (
          <div className="auth-result success" role="status">
            <CheckCircle2 />
            <span>
              {mode === 'login'
                ? '登录演示完成，未建立真实会话。'
                : '注册演示完成，未创建真实账号。'}
              <Link to="/admin">
                进入后台示例
                <ArrowRight aria-hidden="true" />
              </Link>
            </span>
          </div>
        )}
      </form>
      <details className="auth-demo-tools">
        <summary>演示选项</summary>
        <div>
          <Button type="button" size="sm" variant="outline" onClick={demo} disabled={pending}>
            填入演示信息
          </Button>
          <Label htmlFor="auth-failure">
            <Checkbox
              id="auth-failure"
              checked={fail}
              disabled={pending}
              onCheckedChange={(checked) => setFail(checked === true)}
            />
            模拟提交失败
          </Label>
        </div>
      </details>
    </>
  );
}
export function Auth() {
  const [params, setParams] = useSearchParams();
  const mode: Mode = params.get('mode') === 'register' ? 'register' : 'login';
  const [email, setEmail] = useState('');
  return (
    <div className="auth-page">
      <header className="auth-header">
        <Link to="/" className="auth-brand">
          <Box aria-hidden="true" />
          CQU Moe
        </Link>
        <div className="auth-header-actions">
          <Button asChild variant="ghost" size="sm">
            <Link to="/components">
              <ArrowLeft aria-hidden="true" />
              返回预览
            </Link>
          </Button>
          <ThemeMenu />
        </div>
      </header>
      <main className="auth-main">
        <div className="auth-wrap">
          <div className="auth-intro">
            <div className="auth-mark" aria-hidden="true">
              <Box />
            </div>
            <h1>{mode === 'login' ? '欢迎回来' : '创建账号'}</h1>
            <p>
              {mode === 'login'
                ? '登录你的账号，继续使用校园服务。'
                : '一个账号，连接你的校园服务。'}
            </p>
          </div>
          <div className="auth-card">
            <Tabs value={mode} onValueChange={(value) => setParams({ mode: value })}>
              <TabsList aria-label="账号入口" className="auth-tabs">
                <TabsTrigger value="login">登录</TabsTrigger>
                <TabsTrigger value="register">注册</TabsTrigger>
              </TabsList>
              <TabsContent value={mode} key={mode} className="auth-panel">
                <AuthForm mode={mode} email={email} onEmailChange={setEmail} />
              </TabsContent>
            </Tabs>
          </div>
          <p className="auth-disclaimer">交互演示 · 不会登录或创建真实账号</p>
        </div>
      </main>
      <footer className="auth-footer">
        CQU Moe <span>统一账号入口示例</span>
      </footer>
    </div>
  );
}
