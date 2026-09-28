import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@cqu-moe/ui';
import { App } from './app';
import '@cqu-moe/theme/styles.css';
import '@cqu-moe/ui/styles.css';
import './styles.css';
createRoot(document.getElementById('root')!).render(<ThemeProvider><App/></ThemeProvider>);
