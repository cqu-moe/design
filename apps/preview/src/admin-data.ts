export type DemoUser = {
  id: string;
  name: string;
  email: string;
  role: '管理员' | '成员';
  status: '正常' | '停用';
  joined: string;
};
export const initialUsers: DemoUser[] = [
  {
    id: 'u-001',
    name: '林同学',
    email: 'lin@example.test',
    role: '管理员',
    status: '正常',
    joined: '2026-09-01',
  },
  {
    id: 'u-002',
    name: '陈同学',
    email: 'chen@example.test',
    role: '成员',
    status: '正常',
    joined: '2026-09-04',
  },
  {
    id: 'u-003',
    name: '王同学',
    email: 'wang@example.test',
    role: '成员',
    status: '正常',
    joined: '2026-09-08',
  },
  {
    id: 'u-004',
    name: '李同学',
    email: 'li@example.test',
    role: '成员',
    status: '停用',
    joined: '2026-09-12',
  },
  {
    id: 'u-005',
    name: '周同学',
    email: 'zhou@example.test',
    role: '成员',
    status: '正常',
    joined: '2026-09-16',
  },
  {
    id: 'u-006',
    name: '赵同学',
    email: 'zhao@example.test',
    role: '成员',
    status: '正常',
    joined: '2026-09-20',
  },
];
export type DemoClient = {
  id: string;
  name: string;
  kind: 'Web 应用' | '移动应用' | '服务端';
  status: '启用' | '停用';
  callback: string;
  scopes: string[];
  requests: number;
};
export const initialClients: DemoClient[] = [
  {
    id: 'schedule-web',
    name: '课表 Web',
    kind: 'Web 应用',
    status: '启用',
    callback: 'https://schedule.example.test/callback',
    scopes: ['profile', 'calendar:read'],
    requests: 14280,
  },
  {
    id: 'resource-library',
    name: '资料库',
    kind: 'Web 应用',
    status: '启用',
    callback: 'https://library.example.test/callback',
    scopes: ['profile', 'resources:read'],
    requests: 9460,
  },
  {
    id: 'campus-mobile',
    name: '校园助手',
    kind: '移动应用',
    status: '启用',
    callback: 'https://mobile.example.test/callback',
    scopes: ['profile'],
    requests: 6820,
  },
  {
    id: 'sync-service',
    name: '同步服务',
    kind: '服务端',
    status: '停用',
    callback: 'https://sync.example.test/callback',
    scopes: ['calendar:read'],
    requests: 2180,
  },
];
export const traffic = Array.from({ length: 30 }, (_, i) => ({
  label: `9/${i + 1}`,
  value: 2400 + i * 83 + [0, 180, -120, 290, 430, -260, -180][i % 7],
  secondary: 12 + ((i * 7) % 30),
}));
export const latency = traffic.map((point, i) => ({
  label: point.label,
  value: 85 + ((i * 11) % 32),
  secondary: 145 + ((i * 17) % 48),
}));
