import { useId } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from './components/ui/table';
export type ChartPoint = { label: string; value: number; secondary?: number };
export function DataChart({
  title,
  description,
  data,
  kind = 'line',
  valueLabel,
  secondaryLabel,
}: {
  title: string;
  description?: string;
  data: ChartPoint[];
  kind?: 'line' | 'area' | 'bar';
  valueLabel: string;
  secondaryLabel?: string;
}) {
  const id = useId();
  const Chart = kind === 'bar' ? BarChart : kind === 'area' ? AreaChart : LineChart;
  return (
    <figure className="ds-chart" aria-labelledby={id}>
      <figcaption>
        <h2 id={id}>{title}</h2>
        {description && <p>{description}</p>}
        <div className="ds-chart-legend">
          <span>
            <i />
            {valueLabel}
          </span>
          {secondaryLabel && (
            <span>
              <i data-secondary />
              {secondaryLabel}
            </span>
          )}
        </div>
      </figcaption>
      <div className="ds-chart-plot">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <Chart
            data={data}
            accessibilityLayer
            title={title}
            margin={{ top: 8, right: 12, bottom: 4, left: 0 }}
          >
            <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
              minTickGap={28}
              tickMargin={12}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
              width={48}
              domain={[0, 'auto']}
              tickFormatter={(value) => (value >= 1000 ? `${value / 1000}k` : String(value))}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                color: 'var(--foreground)',
                fontSize: 'var(--text-xs)',
              }}
              itemStyle={{ color: 'var(--foreground)' }}
              cursor={{ stroke: 'var(--border)', fill: 'var(--muted)' }}
            />
            {kind === 'bar' ? (
              <Bar
                dataKey="value"
                name={valueLabel}
                fill="var(--link)"
                maxBarSize={32}
                radius={[3, 3, 0, 0]}
                isAnimationActive={false}
              />
            ) : kind === 'area' ? (
              <Area
                type="monotone"
                dataKey="value"
                name={valueLabel}
                stroke="var(--link)"
                fill="var(--link)"
                fillOpacity={0.1}
                strokeWidth={2}
                isAnimationActive={false}
              />
            ) : (
              <Line
                type="monotone"
                dataKey="value"
                name={valueLabel}
                stroke="var(--link)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                isAnimationActive={false}
              />
            )}
            {secondaryLabel &&
              (kind === 'bar' ? (
                <Bar
                  dataKey="secondary"
                  name={secondaryLabel}
                  fill="var(--muted-foreground)"
                  maxBarSize={32}
                  radius={[3, 3, 0, 0]}
                  isAnimationActive={false}
                />
              ) : kind === 'area' ? (
                <Area
                  type="monotone"
                  dataKey="secondary"
                  name={secondaryLabel}
                  stroke="var(--muted-foreground)"
                  fill="var(--muted)"
                  fillOpacity={0.15}
                  strokeDasharray="5 4"
                  isAnimationActive={false}
                />
              ) : (
                <Line
                  type="monotone"
                  dataKey="secondary"
                  name={secondaryLabel}
                  stroke="var(--muted-foreground)"
                  strokeDasharray="5 4"
                  dot={false}
                  isAnimationActive={false}
                />
              ))}
          </Chart>
        </ResponsiveContainer>
      </div>
      <details className="ds-chart-data">
        <summary>查看{title}数据</summary>
        <Table aria-label={`${title}数据`}>
          <TableHeader>
            <TableRow>
              <TableHead>时间 / 分类</TableHead>
              <TableHead>{valueLabel}</TableHead>
              {secondaryLabel && <TableHead>{secondaryLabel}</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((point) => (
              <TableRow key={point.label}>
                <TableCell>{point.label}</TableCell>
                <TableCell>{point.value.toLocaleString()}</TableCell>
                {secondaryLabel && (
                  <TableCell>{point.secondary?.toLocaleString() ?? '—'}</TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </details>
    </figure>
  );
}
