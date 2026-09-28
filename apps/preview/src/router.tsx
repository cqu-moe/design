import { createBrowserRouter, Navigate, Link } from 'react-router';
import { PageHeader, Button } from '@cqu-moe/ui';
import { App } from './app';
export const router = createBrowserRouter([
  {
    element: <App />,
    children: [
      { index: true, element: <Navigate to="/settings" replace /> },
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
