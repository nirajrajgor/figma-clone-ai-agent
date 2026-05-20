import { ImageIcon } from "lucide-react";
import { EntryFlow } from "@/components/entry-flow";

export default function Home() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-muted/30 p-6 sm:p-8">
      <div className="mb-8 flex flex-col items-center gap-2 text-center">
        <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <ImageIcon className="size-6" aria-hidden />
        </div>
        <p className="text-lg font-semibold tracking-tight">Image Annotation</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Mark up screenshots with your team — no login required.
        </p>
      </div>
      <EntryFlow />
    </main>
  );
}
