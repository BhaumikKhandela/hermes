import { withAuth } from "@/lib/mongodb/withAuth";
import { ProjectService } from "@/services/ProjectService";
import { NextResponse } from "next/server";

export const PUT = withAuth(
  async (req: Request, context: { params: { projectId: string } }, session) => {
    const { projectId } = context.params;
    const body = await req.json();
    const { name } = body;

    const projectService = ProjectService.getInstance();
    const project = await projectService.updateProjects({
      userId: session.user.id,
      id: projectId,
      name,
    });

    return NextResponse.json({ message: "Project updated" }, { status: 200 });
  },
);
