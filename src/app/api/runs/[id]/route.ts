import { NextResponse } from "next/server";
import { withAuth } from "@/lib/mongodb/withAuth";
import { WorkflowRun } from "@/models/WorkflowRunSchema";

export const GET = withAuth(
  async (req: Request, session: any, { params }: any) => {
    const { id } = params;

    const run = await WorkflowRun.findById(id).lean();
    if (!run) {
      return NextResponse.json({ error: "Run not found" }, { status: 404 });
    }

    if (run.userId.toString() !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({
      run: {
        _id: run._id.toString(),
        status: run.status,
        input: run.input,
        output: run.output,
        error: run.error,
        agentCount: run.agentCount,
        toolCount: run.toolCount,
        modelProvider: run.modelProvider,
        modelName: run.modelName,
        createdAt: run.createdAt?.toISOString(),
        startedAt: run.startedAt?.toISOString(),
        completedAt: run.completedAt?.toISOString(),
      },
    });
  },
);
