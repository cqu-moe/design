import type { CSSProperties } from 'react';
import { Toaster as SonnerToaster } from 'sonner';
import { useTheme } from './theme-provider';
export { toast } from 'sonner';
export function Toaster() {
  const { resolvedTheme } = useTheme();
  return (
    <SonnerToaster
      theme={resolvedTheme}
      className="ds-toaster"
      position="bottom-right"
      closeButton
      visibleToasts={3}
      duration={5000}
      offset={24}
      mobileOffset={{ left: 16, right: 16, bottom: 'calc(16px + env(safe-area-inset-bottom))' }}
      customAriaLabel="通知"
      style={
        {
          '--normal-bg': 'var(--surface)',
          '--normal-bg-hover': 'var(--muted)',
          '--normal-text': 'var(--foreground)',
          '--normal-border': 'var(--border)',
          '--normal-border-hover': 'var(--input)',
          fontFamily: 'var(--font-sans)',
        } as CSSProperties
      }
      toastOptions={{
        closeButtonAriaLabel: '关闭通知',
        style: { borderRadius: 'var(--radius)', fontSize: 'var(--text-sm)' },
        classNames: { description: 'ds-toast-description', closeButton: 'ds-toast-close' },
        actionButtonStyle: {
          background: 'var(--primary)',
          color: 'var(--primary-foreground)',
          borderRadius: 'var(--radius-sm)',
        },
        cancelButtonStyle: { background: 'var(--muted)', color: 'var(--foreground)' },
      }}
    />
  );
}
