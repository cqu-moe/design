import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { ThemeProvider, Toaster } from '@cqu-moe/ui';
import { router } from './router';
import '@cqu-moe/theme/styles.css';
import '@cqu-moe/ui/styles.css';
import './styles.css';
createRoot(document.getElementById('root')!).render(
  <ThemeProvider>
    <RouterProvider router={router} />
    <Toaster />
  </ThemeProvider>,
);
