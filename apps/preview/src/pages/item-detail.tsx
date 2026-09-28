import { Link, useParams } from 'react-router';
import { Button, PageHeader } from '@cqu-moe/ui';
import { ArrowLeft, CheckCircle2, PauseCircle } from 'lucide-react';
import { items } from '../demo-data';
export function ItemDetail() {
  const { id } = useParams();
  const item = items.find((x) => x.id === id);
  if (!item)
    return (
      <>
        <PageHeader title="未找到服务" description="这项服务可能不存在，或链接已经发生变化。" />
        <Button asChild variant="outline">
          <Link to="/items">返回服务列表</Link>
        </Button>
      </>
    );
  return (
    <>
      <Link className="back-link" to="/items">
        <ArrowLeft size={16} />
        返回服务列表
      </Link>
      <PageHeader
        title={item.title}
        description={item.description}
        actions={
          <span className={`status-label status-${item.status}`}>
            {item.status === 'active' ? <CheckCircle2 /> : <PauseCircle />}
            {item.status === 'active' ? '运行中' : '已暂停'}
          </span>
        }
      />
      <section className="detail-section">
        <h2>服务信息</h2>
        <dl className="details">
          <div>
            <dt>服务标识</dt>
            <dd>
              <code>{item.id}</code>
            </dd>
          </div>
          <div>
            <dt>所属分类</dt>
            <dd>{item.category}</dd>
          </div>
          <div>
            <dt>最近更新</dt>
            <dd>{item.updatedAt}</dd>
          </div>
          <div>
            <dt>数据来源</dt>
            <dd>本地演示数据</dd>
          </div>
        </dl>
      </section>
      <section className="detail-section">
        <h2>使用说明</h2>
        <p>这是服务详情页的参考布局。桌面与手机共享相同的信息和导航，较长的名称会自然换行。</p>
        <p>实际接入时，由业务系统提供数据与操作，共享组件负责保持布局和交互一致。</p>
      </section>
    </>
  );
}
