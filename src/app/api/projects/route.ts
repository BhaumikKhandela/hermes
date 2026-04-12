import { withAuth } from "@/lib/mongodb/withAuth";
import { ProjectService } from "@/services/ProjectService";
import { NextResponse } from "next/server";

export const GET = withAuth(async (req: Request) => {
  const { searchParams } = new URL(req.url);

  const search = searchParams.get("search") || "";

  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "10", 10);

  const projectService = ProjectService.getInstance();
  const projects = await projectService.getAllProjects({
    search: search,
    page: page,
    limit: limit,
  });

  return NextResponse.json({ projects }, { status: 200 });
});
export const POST = withAuth(async (req: Request, session) => {
  const { name } = await req.json();

  const projectService = ProjectService.getInstance();
  const project = await projectService.createProject({
    name,
    userId: session.user.id,
  });

  return NextResponse.json(
    { message: "Project created", project },
    { status: 201 },
  );
});
