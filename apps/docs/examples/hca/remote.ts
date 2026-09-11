import {
  createHcaRemoteHandler,
  createRemoteHcaRegistrationActions,
  type HcaRemoteHandlerOptions,
} from "@ensforge/hca/remote";

/** Supply real authentication, operation authorization and a server-only signer resolver. */
export const registrationEndpoint = <Principal>(
  options: HcaRemoteHandlerOptions<Request, Principal>,
) => {
  const handle = createHcaRemoteHandler(options);

  return async (request: Request): Promise<Response> => {
    if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
    try {
      const response = await handle(await request.json(), request, request.signal);
      return new Response(response, {
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      });
    } catch {
      // Keep server exception payloads out of the public response; reconcile with a status request.
      return new Response("Registration request could not be completed", { status: 400 });
    }
  };
};

export const remoteRegistration = createRemoteHcaRegistrationActions({
  transport: async (request, signal) => {
    const response = await fetch("/api/hca/registration", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
      signal,
    });
    if (!response.ok) throw new Error("Remote registration request failed");
    return response.text();
  },
});
