import { Button, PageHeader } from '@cqu-moe/ui';
import './brand.css';

const products = [
  { id: 'cqu-moe', name: 'CQU Moe', meaning: '折叠立方与开放负空间，表达校园工具汇聚成统一入口。' },
  { id: 'learning', name: 'Learning CLI', meaning: '展开的书页与命令提示符，连接学习资源与命令行工具。' },
  {
    id: 'feed',
    name: 'Feed',
    meaning: '叠放的通知页与汇聚的信息流，表达通知采集、统一阅读与存档。',
  },
  { id: 'schedule', name: 'Schedule', meaning: '叠放的日历页与流动带，表达课表订阅和持续同步。' },
  { id: 'auth', name: 'Auth', meaning: '锁形与交叠带，表达统一认证和可信连接。' },
  {
    id: 'quicklogin',
    name: 'QuickLogin',
    meaning: '环绕入口的连续带，表达登录状态同步和顺畅通行。',
  },
];

export function Brand() {
  return (
    <>
      <PageHeader
        title="品牌标识"
        description="通路 · Path。用连续的曲线与交叠的留白，连接主站与五个服务。"
        actions={
          <Button asChild variant="outline">
            <a href="/brand/cqu-moe-logo-kit-v1.zip" download>
              下载完整素材包
            </a>
          </Button>
        }
      />
      <div className="brand-catalog">
        {products.map(({ id, name, meaning }) => (
          <section key={id} className="brand-specimen" aria-labelledby={`brand-${id}`}>
            <div className="brand-art" aria-hidden="true">
              <img
                className="brand-light"
                src={`/brand/${id}/logo.svg`}
                alt=""
                width="160"
                height="160"
              />
              <img
                className="brand-dark"
                src={`/brand/${id}/logo-dark.svg`}
                alt=""
                width="160"
                height="160"
              />
            </div>
            <h2 id={`brand-${id}`}>{name}</h2>
            <p>{meaning}</p>
            <div className="brand-downloads" aria-label={`${name} 素材`}>
              <Button asChild variant="outline">
                <a href={`/brand/${id}/logo.svg`} download aria-label={`下载 ${name} SVG`}>
                  SVG
                </a>
              </Button>
              <Button asChild variant="outline">
                <a href={`/brand/${id}/logo-1024.png`} download aria-label={`下载 ${name} PNG`}>
                  PNG
                </a>
              </Button>
              <Button asChild variant="outline">
                <a href={`/brand/${id}/favicon.ico`} download aria-label={`下载 ${name} ICO`}>
                  ICO
                </a>
              </Button>
            </div>
          </section>
        ))}
      </div>
      <section className="brand-guidance" aria-labelledby="brand-usage">
        <h2 id="brand-usage">使用方式</h2>
        <p>
          页面品牌入口使用 24 或 32px；16px 用于 favicon 和扩展工具栏。CQU Moe、Learning CLI、Schedule、Auth 与 Feed
          页面使用黑白版；QuickLogin 使用彩色版与暖橙主题。所有产品 favicon
          使用彩色版。完整素材包同时提供纯黑、纯白与应用图标。
        </p>
        <p>
          保留比例、倾斜角度与留白。CQU Moe、Learning CLI、Schedule、Auth 与 Feed 保持中性界面；QuickLogin
          的主操作与强调元素使用经过对比度校验的暖橙色。
        </p>
        <Button asChild variant="outline">
          <a href="/brand/index.html">查看黑白版本与小尺寸对照</a>
        </Button>
      </section>
    </>
  );
}
