import { inngest } from "@/lib/inngest/client";
import { withErrorHandler } from "@/lib/mongodb/withErrorHandler";

export const POST = withErrorHandler(async (req: Request) => {
  const { projectId, userId }: { projectId: string; userId: string } =
    await req.json();

  const runId = crypto.randomUUID();

  await inngest.send({
    name: "workflow/execute.requested",
    data: { projectId, userId, runId },
  });

  return Response.json({ runId, status: "queued" });
});
