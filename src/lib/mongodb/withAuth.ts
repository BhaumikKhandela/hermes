import { headers } from "next/headers";
import { auth } from "../auth/auth";
import { NextResponse } from "next/server";
import { connectDB } from "./mongodb";

export function withAuth<T extends (...args: any[]) => Promise<Response>>(
  fn: T,
): T {
  return (async (...args: any[]) => {
    try {
      const session = await auth.api.getSession({
        headers: await headers(),
      });

      if (!session?.user) {
        return NextResponse.json(
          {
            error: "Unauthorized",
          },
          {
            status: 401,
          },
        );
      }

      await connectDB();

      return await fn(...args);
    } catch (error: any) {
      console.error("Server error:", error);
      const message = error?.message || "Internal Server Error";
      return NextResponse.json(
        {
          error: message,
        },
        {
          status: error?.status || 500,
        },
      );
    }
  }) as T;
}
