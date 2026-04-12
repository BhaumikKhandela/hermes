export type HttpVerb = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export async function makeHttpReq<TInput = unknown, TResponse = unknown>(
  verb: HttpVerb,
  endpoint: string,
  input?: TInput,
): Promise<TResponse> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/endpoint`, {
      method: verb,
      headers: {
        "Content-Type": "application/json",
        accept: "application/json",
      },
      body: input ? JSON.stringify(input) : undefined,
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`HTTP ${res.status}: ${errorText}`);
    }

    // handle empty responses (e.g. 204)
    if (res.status === 204) {
      return {} as TResponse;
    }

    return (await res.json()) as TResponse;
  } catch (error) {
    console.error("HTTP request failed:", error);
    throw new Error((error as Error)?.message || "Something went wrong");
  }
}
