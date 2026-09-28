import { useId, type ReactNode } from 'react';
import { AlertCircle, FolderOpen, LoaderCircle, ShieldAlert, FileQuestion } from 'lucide-react';

const icons = {
  loading: LoaderCircle,
  empty: FolderOpen,
  error: AlertCircle,
  forbidden: ShieldAlert,
  'not-found': FileQuestion,
};

export function PageState({
  state,
  title,
  description,
  action,
}: {
  state: keyof typeof icons;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  const id = useId();
  const Icon = icons[state];
  return (
    <section className="ds-page-state" data-state={state} aria-labelledby={id}>
      <Icon aria-hidden="true" />
      <div role={state === 'error' ? 'alert' : 'status'} aria-atomic="true">
        <h2 id={id}>{title}</h2>
        <p>{description}</p>
      </div>
      {action && <div className="ds-page-state-action">{action}</div>}
    </section>
  );
}
