import { headers } from "next/headers";
import { auth } from "../auth/auth";
import { NextResponse } from "next/server";
import { connectDB } from "./mongodb";

export function withAuth<
  T extends (req: Request, session: any) => Promise<Response>
>(fn: T) {
  return async (req: Request): Promise<Response> => {
    try {
      const session = await auth.api.getSession({
        headers: await headers(),
      });

      if (!session?.user) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }

      await connectDB();

      return await fn(req, session);
    } catch (error: any) {
      return NextResponse.json(
        { error: error?.message || "Internal Server Error" },
        { status: error?.status || 500 }
      );
    }
  };
}
