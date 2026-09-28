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
      richColors
      closeButton
      visibleToasts={3}
      duration={4000}
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
          '--success-bg': 'color-mix(in oklab, var(--success) 8%, var(--surface))',
          '--success-border': 'color-mix(in oklab, var(--success) 30%, var(--border))',
          '--success-text': 'var(--success)',
          '--error-bg': 'color-mix(in oklab, var(--destructive) 8%, var(--surface))',
          '--error-border': 'color-mix(in oklab, var(--destructive) 30%, var(--border))',
          '--error-text': 'var(--destructive)',
          '--warning-bg': 'color-mix(in oklab, var(--warning) 8%, var(--surface))',
          '--warning-border': 'color-mix(in oklab, var(--warning) 30%, var(--border))',
          '--warning-text': 'var(--warning)',
          '--info-bg': 'color-mix(in oklab, var(--link) 8%, var(--surface))',
          '--info-border': 'color-mix(in oklab, var(--link) 30%, var(--border))',
          '--info-text': 'var(--link)',
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
