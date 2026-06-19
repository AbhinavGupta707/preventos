// WP W3-WIRE — same-origin proxy: web app flows POST here, and the server
// forwards to apps/api via the shared client. Keeps the dev token server-side
// and avoids CORS. Best-effort: when the backend is unconfigured it reports
// synced:false and the caller stays on its local-first state.
import { NextResponse } from "next/server";
import { clerkBearerToken } from "../../../lib/clerk-server";
import { apiConfigured, syncResultPayload, syncToApi } from "../../../lib/api";
import { syncActionSchema } from "../../../lib/sync-schema";

export async function POST(request: Request): Promise<NextResponse> {
  if (!apiConfigured()) return NextResponse.json({ synced: false });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ synced: false, error: "Invalid request." }, { status: 400 });
  }

  const parsed = syncActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ synced: false, error: "Invalid action." }, { status: 400 });
  }

  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : await clerkBearerToken();
  const result = await syncToApi(parsed.data, bearerToken);
  return NextResponse.json(
    syncResultPayload(result),
    { status: result.error !== undefined ? 502 : 200 },
  );
}
