"use client";

import { MoreHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ActionTooltip } from "@/components/action-tooltip";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiProjectPath } from "@/lib/paths";

type Props = { workspace: string; project: string };

export function ProjectMenu({ workspace, project }: Props) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmName, setConfirmName] = useState("");

  async function deleteProject() {
    if (confirmName !== project) return;
    const res = await fetch(apiProjectPath(workspace, project), {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirmName }),
    });
    if (res.ok) router.push("/");
  }

  return (
    <>
      <DropdownMenu>
        <ActionTooltip label="Project menu">
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Project menu"
                data-testid="project-menu-trigger"
              >
                <MoreHorizontal className="size-4" />
              </Button>
            }
          />
        </ActionTooltip>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            variant="destructive"
            data-testid="delete-project-toggle"
            onClick={() => setDeleteOpen(true)}
          >
            Delete project…
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open);
          if (!open) setConfirmName("");
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete project?</AlertDialogTitle>
            <AlertDialogDescription>
              Type the project name to confirm. All sessions and markup will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 px-4">
            <Label htmlFor="delete-project-confirm-input" className="sr-only">
              Project name
            </Label>
            <Input
              id="delete-project-confirm-input"
              data-testid="delete-project-confirm-input"
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              placeholder={project}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              data-testid="delete-project-confirm"
              disabled={confirmName !== project}
              onClick={() => void deleteProject()}
            >
              Delete project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
