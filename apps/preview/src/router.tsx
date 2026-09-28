import { createBrowserRouter, Navigate, Link } from 'react-router';
import { PageHeader, Button, ContentContainer } from '@cqu-moe/ui';
import { App } from './app';
export const router = createBrowserRouter([
  {
    path: 'auth',
    lazy: async () => ({ Component: (await import('./pages/auth')).Auth }),
    hydrateFallbackElement: (
      <main className="auth-main">
        <p role="status">正在加载账号入口…</p>
      </main>
    ),
  },
  {
    element: <App />,
    hydrateFallbackElement: (
      <main>
        <ContentContainer>
          <p role="status">正在加载页面…</p>
        </ContentContainer>
      </main>
    ),
    children: [
      { index: true, element: <Navigate to="/settings" replace /> },
      {
        path: 'admin',
        lazy: async () => ({ Component: (await import('./pages/admin/state')).AdminLayout }),
        children: [
          {
            index: true,
            lazy: async () => ({ Component: (await import('./pages/admin/dashboard')).Dashboard }),
          },
          {
            path: 'analytics',
            lazy: async () => ({ Component: (await import('./pages/admin/analytics')).Analytics }),
          },
          {
            path: 'users',
            lazy: async () => ({ Component: (await import('./pages/admin/users')).Users }),
          },
          {
            path: 'clients',
            lazy: async () => ({ Component: (await import('./pages/admin/clients')).Clients }),
          },
        ],
      },
      {
        path: 'settings',
        lazy: async () => ({ Component: (await import('./pages/settings')).Settings }),
      },
      { path: 'items', lazy: async () => ({ Component: (await import('./pages/items')).Items }) },
      {
        path: 'items/:id',
        lazy: async () => ({ Component: (await import('./pages/item-detail')).ItemDetail }),
      },
      {
        path: 'components',
        lazy: async () => ({ Component: (await import('./pages/components')).Components }),
      },
      {
        path: 'agent-probe',
        lazy: async () => ({ Component: (await import('./agent-probe')).AgentProbe }),
      },
      {
        path: '*',
        element: (
          <>
            <PageHeader title="页面不存在" />
            <Button asChild variant="outline">
              <Link to="/settings">返回账号设置</Link>
            </Button>
          </>
        ),
      },
    ],
  },
]);
