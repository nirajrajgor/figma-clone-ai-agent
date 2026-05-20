import { Suspense } from "react";
import { notFound } from "next/navigation";
import { SessionEditor } from "@/components/session-editor";
import { decodeSegment } from "@/lib/paths";
import { getSessionPageData } from "@/lib/session-page-data";
import { toClientSessionDocument } from "@/lib/session-presenter";

type Props = {
  params: Promise<{ workspace: string; project: string; sessionId: string }>;
};

function SessionEditorFallback() {
  return (
    <div className="flex h-svh items-center justify-center bg-background">
      <div className="h-8 w-48 animate-pulse rounded-md bg-muted" aria-hidden />
    </div>
  );
}

export default async function SessionPage({ params }: Props) {
  const { workspace, project, sessionId } = await params;
  const ws = decodeSegment(workspace);
  const proj = decodeSegment(project);
  const data = getSessionPageData(ws, proj, sessionId);
  if (!data) notFound();
  const { session, sessions } = data;
  return (
    <Suspense fallback={<SessionEditorFallback />}>
      <SessionEditor
        workspace={ws}
        project={proj}
        sessionId={sessionId}
        initialSession={{
          id: session.id,
          title: session.title,
          document: toClientSessionDocument(ws, proj, session),
        }}
        initialSessions={sessions}
      />
    </Suspense>
  );
}
