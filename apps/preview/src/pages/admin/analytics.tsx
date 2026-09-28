import { useState } from 'react';
import { Button, PageHeader } from '@cqu-moe/ui';
import { DataChart } from '@cqu-moe/ui/charts';
import { traffic, latency } from '../../admin-data';
import { useAdminData } from './state';
export function Analytics() {
  const { clients } = useAdminData();
  const [period, setPeriod] = useState(7);
  return (
    <>
      <PageHeader
        title="数据分析"
        description="趋势、分布与响应表现。图表下方可展开完整数据。"
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
      <p className="admin-demo-note">全部为演示数据 · 不代表生产指标</p>
      <div className="analytics-grid">
        <DataChart
          title="请求量趋势"
          description={`近 ${period} 天的每日请求量`}
          data={traffic.slice(-period).map(({ label, value }) => ({ label, value }))}
          valueLabel="请求数（次）"
        />
        <DataChart
          title="响应延迟"
          description="同一时间范围的 P50 与 P95"
          data={latency.slice(-period)}
          valueLabel="P50（毫秒）"
          secondaryLabel="P95（毫秒）"
        />
        <DataChart
          title="客户端请求分布"
          description="固定示例窗口 · 按请求数排序，不随上方时间切换"
          data={[...clients]
            .sort((a, b) => b.requests - a.requests)
            .map((client) => ({ label: client.name, value: client.requests }))}
          kind="bar"
          valueLabel="请求数（次）"
        />
        <DataChart
          title="失败请求"
          description={`近 ${period} 天的每日失败次数`}
          data={traffic
            .slice(-period)
            .map((point) => ({ label: point.label, value: point.secondary }))}
          kind="bar"
          valueLabel="失败次数"
        />
      </div>
    </>
  );
}
