import { NextResponse } from "next/server";
import { withAuth } from "@/lib/mongodb/withAuth";
import { inngest } from "@/lib/inngest/client";
import { WorkflowRun } from "@/models/WorkflowRunSchema";

export const POST = withAuth(async (req: Request, session: any) => {
  const { projectId, input }: { projectId: string; input?: string } =
    await req.json();

  if (!projectId) {
    return NextResponse.json(
      { error: "projectId is required" },
      { status: 400 },
    );
  }

  const run = await WorkflowRun.create({
    projectId,
    userId: session.user.id,
    status: "queued",
    input: input || "",
  });

  const runId = run._id.toString();

  await inngest.send({
    name: "workflow/execute.requested",
    data: {
      projectId,
      userId: session.user.id,
      runId,
      input: input || "",
    },
  });

  return NextResponse.json({ runId, status: "queued" });
});
