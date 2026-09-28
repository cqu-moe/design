import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider, NavLink, Outlet } from 'react-router';
import {
  ThemeProvider,
  ThemeMenu,
  AppShell,
  ContentContainer,
  PageHeader,
  Button,
} from '@cqu-moe/ui';
import '@cqu-moe/theme/styles.css';
import '@cqu-moe/ui/styles.css';
import './styles.css';
function Layout() {
  return (
    <AppShell brand="CQU Moe" utilities={<ThemeMenu />} navigation={<NavLink to="/">首页</NavLink>}>
      <ContentContainer>
        <Outlet />
      </ContentContainer>
    </AppShell>
  );
}
function Home() {
  return (
    <>
      <PageHeader title="新的工作空间" description="从共享组件开始，专注于你的业务。" />
      <Button onClick={() => window.alert('共享组件已就绪。')}>检查交互</Button>
    </>
  );
}
const router = createBrowserRouter([
  { element: <Layout />, children: [{ index: true, element: <Home /> }] },
]);
createRoot(document.getElementById('root')!).render(
  <ThemeProvider>
    <RouterProvider router={router} />
  </ThemeProvider>,
);
