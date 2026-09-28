import { createRoot } from 'react-dom/client';
import { ThemeProvider, useTheme, Button, Input, Label, Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription } from '@cqu-moe/ui';
import '@cqu-moe/theme/styles.css';
import '@cqu-moe/ui/styles.css';
import './styles.css';
function App(){const {preference,setPreference}=useTheme();return <main><h1>CQU Moe 设计系统</h1><div>{(['light','dark','system'] as const).map((value,i)=><Button key={value} variant={value===preference?'default':'outline'} onClick={()=>setPreference(value)}>{['浅色','深色','跟随系统'][i]}</Button>)}</div><Label htmlFor="name">示例名称</Label><Input id="name"/><Button disabled>不可用操作</Button><Dialog><DialogTrigger asChild><Button>打开弹窗</Button></DialogTrigger><DialogContent><DialogTitle>确认设置</DialogTitle><DialogDescription>这是一条用于展示的说明。</DialogDescription></DialogContent></Dialog></main>}
createRoot(document.getElementById('root')!).render(<ThemeProvider><App/></ThemeProvider>);
