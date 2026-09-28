import {AppShell,ContentContainer,PageHeader} from '@cqu-moe/ui';
import {UserRound,Layers,FolderOpen,Box} from 'lucide-react';
import {ComponentsDemo} from './components-demo';
export function App(){return <AppShell brand={<><Box size={22} aria-hidden="true"/>CQU Moe</>} utilities={<span className="preview-label">设计预览 · 0.1</span>} navigation={<><span className="ds-nav-label">工作空间</span><a href="/settings"><UserRound/>账号设置</a><a href="/items"><FolderOpen/>服务管理</a><span className="ds-nav-label">设计系统</span><a href="/components" aria-current="page"><Layers/>组件与状态</a></>}><ContentContainer><PageHeader title="组件与状态" description="统一的基础组件与交互规则。"/><ComponentsDemo/></ContentContainer></AppShell>}
