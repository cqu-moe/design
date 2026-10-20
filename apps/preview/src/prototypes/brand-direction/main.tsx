import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  AppShell,
  Button,
  ContentContainer,
  PageHeader,
  Input,
  Label,
  Textarea,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  ThemeProvider,
  useTheme,
} from '@cqu-moe/ui';
import { ArrowLeft, ArrowUpRight, Moon, Sun } from 'lucide-react';
import { products, Mark, ProductDetails, QuickPanel, type ProductId } from './content';
import { ColorField } from './color-field';
import { Symbol } from './symbol';
import { Editorial } from './editorial';
import '@cqu-moe/theme/styles.css';
import '@cqu-moe/ui/styles.css';
import './prototype.css';
import './picker.css';

const variants = [
  { name: '分区', Component: ColorField },
  { name: '手册', Component: Editorial },
  { name: '演示', Component: Symbol },
];
function initialVariant() {
  const index = Number(new URLSearchParams(location.search).get('v')) - 1;
  return Number.isInteger(index) && index >= 0 && index < variants.length ? index : 0;
}

function Prototype() {
  const [variant, setVariant] = useState(initialVariant);
  const [replay, setReplay] = useState(0);
  const [productId, setProductId] = useState<ProductId>(() =>
    new URLSearchParams(location.search).get('product') === 'jxzljc' ? 'jxzljc' : 'quicklogin',
  );
  const [surface, setSurface] = useState<'landing' | 'work'>('landing');
  const previousSurface = useRef(surface);
  const picker = useRef<HTMLElement>(null);
  const { resolvedTheme, setPreference } = useTheme();
  const product = products[productId];
  const Variant = variants[variant].Component;

  useEffect(() => {
    if (previousSurface.current === surface) return;
    previousSurface.current = surface;
    document
      .getElementById(surface === 'work' ? 'main-content' : 'prototype-content')
      ?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }, [surface]);

  useLayoutEffect(() => {
    const move = () => {
      const selected = picker.current?.querySelector<HTMLElement>('[data-active]');
      const highlight = picker.current?.querySelector<HTMLElement>('.proto-picker-highlight');
      if (!selected || !highlight) return;
      highlight.style.width = `${selected.offsetWidth}px`;
      highlight.style.transform = `translateX(${selected.offsetLeft}px)`;
    };
    move();
    const url = new URL(location.href);
    url.searchParams.set('v', String(variant + 1));
    url.searchParams.set('product', productId);
    history.replaceState(null, '', url);
    window.addEventListener('resize', move);
    return () => window.removeEventListener('resize', move);
  }, [variant, productId]);

  useEffect(() => {
    let secondFrame = 0;
    const firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => picker.current?.setAttribute('data-ready', ''));
    });
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (
        target.closest(
          'input, textarea, select, [contenteditable="true"], [role="tablist"], [role="radiogroup"], [role="combobox"], [role="listbox"], [role="option"]',
        )
      )
        return;
      if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
      if (/^[1-3]$/.test(event.key)) setVariant(Number(event.key) - 1);
      else if (event.key === 'ArrowRight') {
        event.preventDefault();
        setVariant((v) => (v + 1) % variants.length);
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        setVariant((v) => (v + variants.length - 1) % variants.length);
      } else if (event.key.toLowerCase() === 'r') setReplay((v) => v + 1);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      cancelAnimationFrame(firstFrame);
      cancelAnimationFrame(secondFrame);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  return (
    <div className="brand-prototype">
      <a className="skip-link" href="#prototype-content">
        跳到正文
      </a>
      <aside className="prototype-tools" aria-label="原型控制">
        <span className="prototype-label">品牌原型 / 02</span>
        <div className="tool-group" aria-label="示例产品">
          {(Object.keys(products) as ProductId[]).map((id) => (
            <Button
              key={id}
              variant="ghost"
              aria-pressed={productId === id}
              onClick={() => setProductId(id)}
            >
              {products[id].name}
            </Button>
          ))}
        </div>
        <div className="tool-group surface-tools" aria-label="页面用途">
          <Button
            variant="ghost"
            aria-pressed={surface === 'landing'}
            onClick={() => setSurface('landing')}
          >
            产品页
          </Button>
          <Button
            variant="ghost"
            aria-pressed={surface === 'work'}
            onClick={() => setSurface('work')}
          >
            工作界面
          </Button>
        </div>
        <div className="tool-group palette-tools">
          <span className="brand-choice">
            <span className="swatch" aria-hidden="true" />
            统一蓝
          </span>
          <Button
            variant="ghost"
            size="icon"
            aria-label={resolvedTheme === 'dark' ? '切换浅色' : '切换深色'}
            onClick={() => setPreference(resolvedTheme === 'dark' ? 'light' : 'dark')}
          >
            {resolvedTheme === 'dark' ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
          </Button>
        </div>
      </aside>
      {surface === 'landing' ? (
        <div
          className={`landing-surface direction-${variant}`}
          key={`${variant}-${replay}-${productId}`}
        >
          <header className="landing-header">
            <a href="#prototype-content" className="product-brand">
              <Mark id={productId} />
              {product.name}
            </a>
            <nav aria-label="产品导航">
              <a href="#features">功能</a>
              <a href="#install">安装</a>
              <a href="#faq">常见问题</a>
              <a href="#resources">
                {productId === 'jxzljc' ? '开源与支持' : '文档与支持'}
                <ArrowUpRight aria-hidden="true" />
              </a>
            </nav>
            <a className="parent-brand" href="https://cqu.moe/" target="_blank" rel="noreferrer">
              <Mark id="cqu-moe" />
              <span>CQU Moe</span>
            </a>
          </header>
          <main id="prototype-content" tabIndex={-1}>
            <Variant product={product} id={productId} onEnter={() => setSurface('work')} />
            <ProductDetails id={productId} product={product} />
          </main>
          <footer className="site-footer">
            <span className="product-brand">
              <Mark id="cqu-moe" />
              CQU Moe
            </span>
            <p>让校园日常，少一点繁琐。</p>
            <span>非学校官方产品</span>
          </footer>
        </div>
      ) : (
        <Workspace key={productId} id={productId} onBack={() => setSurface('landing')} />
      )}
      <p className="prototype-footnote">本地设计原型 · 界面为演示数据 · 1–3 / ← → 切换版式</p>
      <nav className="proto-picker" aria-label="Prototype variants" ref={picker}>
        <span className="proto-picker-highlight" aria-hidden="true" />
        {variants.map((v, index) => (
          <button
            key={v.name}
            className="proto-picker-item"
            data-active={variant === index ? '' : undefined}
            aria-current={variant === index ? 'true' : undefined}
            onClick={() => setVariant(index)}
          >
            {v.name}
          </button>
        ))}
      </nav>
    </div>
  );
}

function Workspace({ id, onBack }: { id: ProductId; onBack: () => void }) {
  const product = products[id];
  return (
    <div className="work-surface" id="prototype-content" tabIndex={-1}>
      <AppShell
        brand={
          <span className="product-brand">
            <Mark id={id} />
            {product.name}
          </span>
        }
        utilities={<span>CQU Moe</span>}
        navigation={
          <a
            href="#"
            onClick={(event) => {
              event.preventDefault();
              onBack();
            }}
          >
            <ArrowLeft aria-hidden="true" />
            返回产品介绍
          </a>
        }
      >
        <ContentContainer>
          <PageHeader
            title={id === 'quicklogin' ? '当前浏览器' : '统一评价设置'}
            description="工作界面演示 · 仅使用本地合成数据"
          />
          {id === 'quicklogin' ? (
            <div className="quick-work">
              <QuickPanel />
              <div className="work-explanation">
                <h2>只控制这台浏览器。</h2>
                <p>
                  关闭快捷登录会暂停当前浏览器的同步，退出设备则会撤销授权。其他设备可以在 Auth
                  中分别管理。
                </p>
                <p>这里的开关仅改变本地演示状态。</p>
                <Button variant="outline" asChild>
                  <a href="https://auth.cqu.moe/settings" target="_blank" rel="noreferrer">
                    在 Auth 管理设备
                    <ArrowUpRight aria-hidden="true" />
                  </a>
                </Button>
              </div>
            </div>
          ) : (
            <EvaluationForm />
          )}
        </ContentContainer>
      </AppShell>
    </div>
  );
}

function EvaluationForm() {
  const [grade, setGrade] = useState('');
  const [score, setScore] = useState('');
  const [comment, setComment] = useState('');
  const [review, setReview] = useState(false);
  const [done, setDone] = useState(false);
  useEffect(() => {
    document.getElementById(review ? 'review-heading' : 'grade')?.focus({ preventScroll: true });
  }, [review]);
  return (
    <div className="evaluation-work">
      <p className="form-intro">
        统一设置只补充空白内容，已有评分与评语会保留。请根据真实上课体验填写。
      </p>
      {!review ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (grade) setReview(true);
          }}
        >
          <div className="form-columns">
            <div>
              <Label htmlFor="grade">满意度档位</Label>
              <Select value={grade} onValueChange={setGrade} required>
                <SelectTrigger className="w-full text-base" id="grade">
                  <SelectValue placeholder="选择档位" />
                </SelectTrigger>
                <SelectContent>
                  {['非常满意', '满意', '一般满意', '不满意', '非常不满意'].map((value) => (
                    <SelectItem key={value} value={value}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="score">综合评分</Label>
              <Input
                className="text-base"
                id="score"
                type="number"
                min={2}
                max={95}
                required
                value={score}
                onChange={(event) => setScore(event.target.value)}
                aria-describedby="score-help"
              />
              <p id="score-help">示例课程允许 2–95 分</p>
            </div>
          </div>
          <Label htmlFor="comment">统一评语（可选）</Label>
          <Textarea
            className="text-base"
            id="comment"
            rows={4}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="根据实际体验填写"
          />
          <div className="form-actions">
            <span>下一步核对示例课程与评价内容。</span>
            <Button type="submit">下一步，核对内容</Button>
          </div>
        </form>
      ) : (
        <div className="review-panel">
          <h2 id="review-heading" tabIndex={-1}>
            核对示例评价
          </h2>
          <p>以下为合成课程，不连接学校系统。</p>
          <dl>
            <div>
              <dt>课程</dt>
              <dd>示例课程 · A</dd>
            </div>
            <div>
              <dt>满意度</dt>
              <dd>{grade}</dd>
            </div>
            <div>
              <dt>综合评分</dt>
              <dd>{score}</dd>
            </div>
            <div>
              <dt>评语</dt>
              <dd>{comment || '未填写'}</dd>
            </div>
          </dl>
          <div className="form-actions">
            <Button
              variant="outline"
              onClick={() => {
                setReview(false);
                setDone(false);
              }}
            >
              返回修改
            </Button>
            <Button onClick={() => setDone(true)}>完成演示</Button>
          </div>
          {done && (
            <p className="demo-result" role="status">
              演示已结束，没有向学校提交评价。
            </p>
          )}
        </div>
      )}
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <ThemeProvider>
    <Prototype />
  </ThemeProvider>,
);
