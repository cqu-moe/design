import { AppShell, ContentContainer, ThemeMenu } from '@cqu-moe/ui';
import { NavLink, Outlet } from 'react-router';
import { UserRound, Layers, FolderOpen, Box, CheckCheck } from 'lucide-react';
export function App() {
  return (
    <AppShell
      brand={
        <>
          <Box size={22} aria-hidden="true" />
          CQU Moe
          <span className="brand-divider" />
          设计系统
        </>
      }
      utilities={
        <>
          <span className="preview-label">预览 · 0.1</span>
          <ThemeMenu />
        </>
      }
      navigation={
        <>
          <span className="ds-nav-label">工作空间</span>
          <NavLink to="/settings">
            <UserRound aria-hidden="true" />
            账号设置
          </NavLink>
          <NavLink to="/items">
            <FolderOpen aria-hidden="true" />
            服务管理
          </NavLink>
          <span className="ds-nav-label">设计系统</span>
          <NavLink to="/components">
            <Layers aria-hidden="true" />
            组件与状态
          </NavLink>
          <NavLink to="/agent-probe">
            <CheckCheck aria-hidden="true" />
            接入验证
          </NavLink>
          <div className="nav-footnote">
            同一套设计。
            <br />
            适应每一块屏幕。
          </div>
        </>
      }
    >
      <ContentContainer>
        <Outlet />
      </ContentContainer>
    </AppShell>
  );
}
