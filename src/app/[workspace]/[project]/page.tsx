import { notFound } from "next/navigation";
import { ProjectView } from "@/components/project-view";
import { decodeSegment } from "@/lib/paths";
import { findProject } from "@/lib/repository";
import { toSessionRows } from "@/lib/session-presenter";

type Props = {
  params: Promise<{ workspace: string; project: string }>;
};

export default async function ProjectPage({ params }: Props) {
  const { workspace, project } = await params;
  const ws = decodeSegment(workspace);
  const proj = decodeSegment(project);
  if (!findProject(ws, proj)) notFound();

  return (
    <ProjectView workspace={ws} project={proj} initialSessions={toSessionRows(ws, proj)} />
  );
}
