export type HttpVerb = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export function makeHttpReq<TInput = unknown, TResponse = unknown>(
  verb: HttpVerb,
  endpoint: string,
  input?: TInput,
): Promise<TResponse> {
  return new Promise(async (resolve, reject) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/api/${endpoint}`,
        {
          method: verb,
          headers: {
            "Content-Type": "application/json",
            accept: "application/json",
          },
          body: verb === "GET" ? undefined : JSON.stringify(input),
        },
      );

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errText}`);
      }

      if (res.status === 204) {
        return resolve({} as TResponse);
      }

      const data = (await res.json()) as TResponse;
      resolve(data);
    } catch (error) {
      reject(error);
      throw new Error((error as Error)?.message || "Something went wrong");
    }
  });
}
