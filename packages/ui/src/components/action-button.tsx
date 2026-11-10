import type { ComponentProps } from 'react';
import type { LucideIcon } from 'lucide-react';
import { ArrowRight, LoaderCircle, Check, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '../lib/utils';
export type ActionButtonState = 'idle' | 'loading' | 'success' | 'error';
type ActionButtonProps = Omit<
  ComponentProps<typeof Button>,
  'children' | 'asChild' | 'size' | 'aria-busy' | 'aria-disabled'
> & {
  state: ActionButtonState;
  labels: Record<ActionButtonState, string>;
  idleIcon?: LucideIcon;
  size?: 'default' | 'sm' | 'lg';
};
const icons = { idle: ArrowRight, loading: LoaderCircle, success: Check, error: AlertCircle };
export function ActionButton({
  state,
  labels,
  idleIcon: IdleIcon = ArrowRight,
  className,
  disabled,
  onClick,
  type = 'button',
  'aria-label': ariaLabel,
  ...props
}: ActionButtonProps) {
  const busy = state === 'loading';
  return (
    <>
      <Button
        {...props}
        type={type}
        disabled={disabled}
        className={cn('ds-action-button', className)}
        data-action-state={state}
        aria-label={ariaLabel ?? labels[state]}
        aria-busy={busy}
        aria-disabled={disabled || busy}
        onClick={(event) => {
          if (disabled || busy) {
            event.preventDefault();
            event.stopPropagation();
            return;
          }
          onClick?.(event);
        }}
      >
        <span className="ds-action-labels" aria-hidden="true">
          {(Object.keys(icons) as ActionButtonState[]).map((value) => {
            const Icon = value === 'idle' ? IdleIcon : icons[value];
            return (
              <span key={value} className="ds-action-label" data-active={state === value}>
                <Icon
                  aria-hidden="true"
                  className={value === 'loading' ? 'ds-action-spinner' : undefined}
                />
                {labels[value]}
              </span>
            );
          })}
        </span>
      </Button>
      <span role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {state === 'idle' ? '' : ariaLabel ? `${ariaLabel}：${labels[state]}` : labels[state]}
      </span>
    </>
  );
}
