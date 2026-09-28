import { useState } from 'react';
import { Link } from 'react-router';
import {
  Button,
  PageHeader,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@cqu-moe/ui';
import { DataChart } from '@cqu-moe/ui/charts';
import { ArrowUpRight, Users, MonitorSmartphone, Activity, CheckCircle2 } from 'lucide-react';
import { traffic } from '../../admin-data';
import { useAdminData } from './state';
export function Dashboard() {
  const { users, clients } = useAdminData();
  const [period, setPeriod] = useState(7);
  const data = traffic.slice(-period);
  const total = data.reduce((sum, p) => sum + p.value, 0);
  const failures = data.reduce((sum, p) => sum + p.secondary, 0);
  const metrics = [
    {
      label: '请求总量',
      value: total.toLocaleString(),
      detail: `近 ${period} 天 · 次`,
      Icon: Activity,
    },
    {
      label: '请求成功率',
      value: `${(((total - failures) / total) * 100).toFixed(2)}%`,
      detail: `${failures} 次失败请求`,
      Icon: CheckCircle2,
    },
    {
      label: '用户总数',
      value: String(users.length),
      detail: `${users.filter((u) => u.status === '正常').length} 个正常账号`,
      Icon: Users,
    },
    {
      label: '启用客户端',
      value: String(clients.filter((c) => c.status === '启用').length),
      detail: `共 ${clients.length} 个客户端`,
      Icon: MonitorSmartphone,
    },
  ];
  return (
    <>
      <PageHeader
        title="仪表盘"
        description="工作空间的使用概况与管理入口。"
        actions={
          <div className="period-control" role="group" aria-label="统计周期">
            {[7, 30].map((days) => (
              <Button
                key={days}
                variant={period === days ? 'secondary' : 'ghost'}
                size="sm"
                aria-pressed={period === days}
                onClick={() => setPeriod(days)}
              >
                近 {days} 天
              </Button>
            ))}
          </div>
        }
      />
      <p className="admin-demo-note">全部为演示数据</p>
      <div className="metric-grid">
        {metrics.map(({ label, value, detail, Icon }) => (
          <section className="metric-card" key={label}>
            <div>
              <span>{label}</span>
              <Icon aria-hidden="true" />
            </div>
            <strong>{value}</strong>
            <p>{detail}</p>
          </section>
        ))}
      </div>
      <div className="dashboard-grid">
        <DataChart
          title="请求量趋势"
          description={`9/${31 - period}—9/30 · 每日请求数`}
          data={data.map(({ label, value }) => ({ label, value }))}
          kind="area"
          valueLabel="请求数（次）"
        />
        <section className="admin-panel">
          <header>
            <h2>管理入口</h2>
            <span>工作空间</span>
          </header>
          <div className="quick-links">
            <Link to="/admin/users">
              <Users />
              <span>
                <strong>用户管理</strong>
                <small>账号、角色与使用状态</small>
              </span>
              <ArrowUpRight />
            </Link>
            <Link to="/admin/clients">
              <MonitorSmartphone />
              <span>
                <strong>客户端管理</strong>
                <small>应用接入与授权范围</small>
              </span>
              <ArrowUpRight />
            </Link>
            <Link to="/admin/analytics">
              <Activity />
              <span>
                <strong>数据分析</strong>
                <small>请求、延迟与服务分布</small>
              </span>
              <ArrowUpRight />
            </Link>
          </div>
          <div className="quiet-note">这里的操作仅改变演示状态，不连接真实账号或服务。</div>
        </section>
      </div>
      <section className="admin-panel">
        <header>
          <h2>客户端概况</h2>
          <Button asChild variant="ghost" size="sm">
            <Link to="/admin/clients">
              查看全部
              <ArrowUpRight />
            </Link>
          </Button>
        </header>
        <div className="admin-table">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>客户端</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="numeric">示例请求数</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>
                    <strong>{client.name}</strong>
                    <small>{client.id}</small>
                  </TableCell>
                  <TableCell>{client.kind}</TableCell>
                  <TableCell>
                    <span
                      className={client.status === '启用' ? 'admin-status' : 'admin-status muted'}
                    >
                      {client.status}
                    </span>
                  </TableCell>
                  <TableCell className="numeric">{client.requests.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </>
  );
}
