import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ExportMenu } from "@/components/export-menu";
import { ActionTooltip } from "@/components/action-tooltip";
import { Input } from "@/components/ui/input";
import { projectPath } from "@/lib/paths";
import { cn } from "@/lib/utils";

export type Crumb = {
  label: string;
  href?: string;
  testId?: string;
  editable?: boolean;
  editValue?: string;
  onEditChange?: (value: string) => void;
  onEditCommit?: () => void;
};

type Props = {
  crumbs: Crumb[];
  exportHref?: string;
  trailing?: React.ReactNode;
  className?: string;
};

export function AppNavbar({ crumbs, exportHref, trailing, className }: Props) {
  return (
    <div className={cn("flex w-full items-center gap-3", className)}>
      <ActionTooltip label="Back to workspace entry">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-1.5 text-sm font-semibold tracking-tight hover:opacity-80"
        >
          Annotate
        </Link>
      </ActionTooltip>
      {crumbs.length > 0 && (
        <nav
          className="flex min-w-0 flex-1 items-center gap-1 text-sm text-muted-foreground"
          aria-label="Breadcrumb"
        >
          {crumbs.map((crumb, i) => (
            <span key={`${crumb.label}-${i}`} className="flex min-w-0 items-center gap-1">
              <ChevronRight className="size-3.5 shrink-0 opacity-50" aria-hidden />
              {crumb.editable ? (
                <Input
                  data-testid={crumb.testId ?? "session-editor-title"}
                  value={crumb.editValue ?? crumb.label}
                  onChange={(e) => crumb.onEditChange?.(e.target.value)}
                  onBlur={() => crumb.onEditCommit?.()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") e.currentTarget.blur();
                  }}
                  className="h-7 max-w-[14rem] min-w-[8rem] border-transparent bg-transparent px-1.5 font-medium text-foreground shadow-none focus-visible:border-input"
                  aria-label="Session title"
                />
              ) : crumb.href ? (
                <Link
                  href={crumb.href}
                  className="truncate hover:text-foreground"
                  data-testid={crumb.testId}
                  title={crumb.label}
                >
                  {crumb.label}
                </Link>
              ) : (
                <span
                  className="truncate font-medium text-foreground"
                  data-testid={crumb.testId}
                  title={crumb.label}
                >
                  {crumb.label}
                </span>
              )}
            </span>
          ))}
        </nav>
      )}
      <div className="ml-auto flex shrink-0 items-center gap-2">
        {exportHref && <ExportMenu exportHref={exportHref} />}
        {trailing}
      </div>
    </div>
  );
}

/** Workspace is a label only; project links to project page. */
export function projectCrumbs(workspace: string, project: string): Crumb[] {
  return [
    { label: workspace },
    { label: project, href: projectPath(workspace, project) },
  ];
}

export function sessionCrumbs(
  workspace: string,
  project: string,
  sessionTitle: string,
  edit?: Pick<Crumb, "editValue" | "onEditChange" | "onEditCommit">,
): Crumb[] {
  return [
    { label: workspace },
    { label: project, href: projectPath(workspace, project), testId: "project-breadcrumb" },
    {
      label: sessionTitle,
      testId: "session-editor-title",
      editable: !!edit,
      editValue: edit?.editValue ?? sessionTitle,
      onEditChange: edit?.onEditChange,
      onEditCommit: edit?.onEditCommit,
    },
  ];
}
