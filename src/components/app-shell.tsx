import { cn } from "@/lib/utils";

type Props = {
  navbar: React.ReactNode;
  sidebar?: React.ReactNode;
  sidebarCollapsed?: boolean;
  children: React.ReactNode;
  className?: string;
};

export function AppShell({
  navbar,
  sidebar,
  sidebarCollapsed = false,
  children,
  className,
}: Props) {
  return (
    <div className={cn("flex h-svh flex-col bg-background", className)}>
      <header className="flex h-11 shrink-0 items-center border-b bg-background px-3">
        {navbar}
      </header>
      <div className="flex min-h-0 flex-1">
        {sidebar && !sidebarCollapsed && (
          <aside
            className="flex w-64 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground"
            data-testid="app-sidebar"
          >
            {sidebar}
          </aside>
        )}
        <div className="relative flex min-w-0 flex-1 flex-col">
          <main className="min-h-0 flex-1 overflow-hidden">{children}</main>
        </div>
      </div>
    </div>
  );
}
