import { readChatHistoryTool } from "@/lib/tools/chatHistoryTool";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") as string;
    const projectId = searchParams.get("projectId") as string;

    if (!userId || !projectId) {
      return NextResponse.json(
        {
          ok: false,
          message: "userId or projectId are required",
        },
        {
          status: 400,
        },
      );
    }

    const retrievedMessages = await readChatHistoryTool.invoke({
      userId,
      projectId,
    });
    const messages = JSON.parse(retrievedMessages);

    return NextResponse.json({ messages }, { status: 200 });
  } catch (error) {
    console.error("An error occurred", error);
    return NextResponse.json(
      {
        message: [],
      },
      {
        status: 500,
      },
    );
  }
}
