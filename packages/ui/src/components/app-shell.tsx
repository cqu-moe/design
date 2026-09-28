import { useState, type ReactNode } from 'react';
import { Menu } from 'lucide-react';
import { Button } from './ui/button';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from './ui/sheet';
export function AppShell({
  brand,
  navigation,
  utilities,
  children,
}: {
  brand: ReactNode;
  navigation: ReactNode;
  utilities?: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="ds-shell">
      <a className="ds-skip" href="#main-content">
        跳至正文
      </a>
      <header className="ds-topbar">
        <div className="ds-brand-area">
          <div className="ds-mobile-menu">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="打开导航">
                  <Menu aria-hidden="true" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <SheetHeader>
                  <SheetTitle>导航</SheetTitle>
                  <SheetDescription>选择要访问的页面</SheetDescription>
                </SheetHeader>
                <nav
                  aria-label="主导航"
                  className="ds-navigation"
                  onClick={(event) => {
                    if ((event.target as HTMLElement).closest('a')) setOpen(false);
                  }}
                >
                  {navigation}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
          <div className="ds-brand">{brand}</div>
        </div>
        <div className="ds-utilities">{utilities}</div>
      </header>
      <div className="ds-workspace">
        <aside className="ds-sidebar">
          <nav aria-label="主导航" className="ds-navigation">
            {navigation}
          </nav>
        </aside>
        <main id="main-content" tabIndex={-1} className="ds-main">
          {children}
        </main>
      </div>
    </div>
  );
}
