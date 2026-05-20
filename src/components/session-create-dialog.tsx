"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ImageUpload } from "@/components/image-upload";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiSessionsPath, sessionPath } from "@/lib/paths";

type Props = {
  workspace: string;
  project: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
};

export function SessionCreateDialog({
  workspace,
  project,
  open,
  onOpenChange,
  onCreated,
}: Props) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleOpenChange(next: boolean) {
    onOpenChange(next);
    if (!next) {
      setTitle("");
      setImage(null);
      setError(null);
      setLoading(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim()) {
      setError("Session title required");
      return;
    }
    if (!image) {
      setError("Image required");
      return;
    }
    setLoading(true);
    const body = new FormData();
    body.set("title", title.trim());
    body.set("image", image);
    const res = await fetch(apiSessionsPath(workspace, project), {
      method: "POST",
      body,
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not create session");
      return;
    }
    const data = await res.json();
    handleOpenChange(false);
    onCreated?.();
    router.push(sessionPath(workspace, project, data.sessionId));
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New markup session</DialogTitle>
          <DialogDescription>
            Upload a screenshot and give it a short title your team will recognize.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4" data-testid="create-session-form">
          <div className="space-y-2">
            <Label htmlFor="session-title-input">Session title</Label>
            <Input
              id="session-title-input"
              data-testid="session-title-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Login 500 error"
              disabled={loading}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label>Base image</Label>
            <ImageUpload
              value={image}
              onChange={(file) => {
                setImage(file);
                if (file) setError(null);
              }}
              onReject={setError}
              disabled={loading}
            />
          </div>
          {error && (
            <p className="text-xs text-destructive" role="alert" data-testid="session-form-error">
              {error}
            </p>
          )}
          <DialogFooter showCloseButton={false}>
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              data-testid="create-session-submit"
              disabled={loading || !title.trim() || !image}
            >
              {loading ? "Creating…" : "Create session"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
