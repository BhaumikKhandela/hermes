import { NextResponse } from "next/server";
import { withAuth } from "@/lib/mongodb/withAuth";
import { syncModelsFromOpenRouter } from "@/lib/models/modelService";

export const POST = withAuth(async (req: Request, session: any) => {
  const count = await syncModelsFromOpenRouter();

  return NextResponse.json({
    success: true,
    synced: count,
    message: `Synced ${count} models from OpenRouter`,
  });
});