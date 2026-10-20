import { Button, PageHeader } from '@cqu-moe/ui';
import './brand.css';

const products = [
  { id: 'cqu-moe', name: 'CQU Moe', meaning: '折叠立方与开放负空间，表达校园工具汇聚成统一入口。' },
  {
    id: 'learning',
    name: 'Learning CLI',
    meaning: '展开的书页与命令提示符，连接学习资源与命令行工具。',
  },
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
  {
    id: 'jxzljc',
    name: '快速评教',
    meaning: '评价气泡、勾选与环绕带，表达学生反馈、逐项核对与确认提交。',
  },
];

export function Brand() {
  return (
    <>
      <PageHeader
        title="品牌标识"
        description="通路 · Path。统一蓝色品牌，通过独立轮廓与产品名区分工具。"
        actions={
          <Button asChild variant="outline">
            <a href="/brand/cqu-moe-logo-kit-v1.zip" download>
              下载完整素材包
            </a>
          </Button>
        }
      />
      <section className="brand-contexts" aria-label="品牌色使用示例">
        <div className="brand-marketing-example">
          <h2>展示页</h2>
          <p>蓝色介绍产品，浅色衬底承载演示。</p>
          <Button asChild className="brand-action">
            <a href="#brand-usage">查看使用规范</a>
          </Button>
        </div>
        <div className="brand-work-example">
          <h2>工作界面</h2>
          <p>中性表面与黑白主按钮，蓝色点缀标识、链接和焦点。</p>
          <Button asChild>
            <a href="/settings">查看工作界面</a>
          </Button>
        </div>
      </section>
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
            <div className="brand-sizes" aria-label={`${name} 小尺寸与应用图标`}>
              {[16, 24, 32].map((size) => (
                <figure key={size}>
                  <span>
                    <img
                      className="brand-light"
                      src={`/brand/${id}/logo.svg`}
                      width={size}
                      height={size}
                      alt=""
                    />
                    <img
                      className="brand-dark"
                      src={`/brand/${id}/logo-dark.svg`}
                      width={size}
                      height={size}
                      alt=""
                    />
                  </span>
                  <figcaption>{size}px</figcaption>
                </figure>
              ))}
              <figure>
                <img src={`/brand/${id}/icon-48.png`} width="48" height="48" alt="" />
                <figcaption>应用 / 扩展</figcaption>
              </figure>
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
          页面品牌入口使用 24 或 32px；16px 用于 favicon 和扩展工具栏。所有产品页面标识、
          favicon、应用与扩展图标统一蓝色。完整素材包保留纯黑、纯白版供单色与反白场景使用。
        </p>
        <p>
          保留比例、倾斜角度与留白。展示页的品牌主动作局部映射共享颜色；工作界面的主按钮、
          开关与导航选中态保持黑白灰。错误、警告和成功仍使用各自的语义色。
        </p>
        <Button asChild variant="outline">
          <a href="/brand/index.html">查看黑白版本与小尺寸对照</a>
        </Button>
      </section>
    </>
  );
}
