// WP3.1 — first-party conversion events. WP8.2 routes these to the domain store
// (marketing.funnel_event via apps/api) when PREVENTOS_API_URL is configured,
// falling back to the local .data/ NDJSON sink. No PII: name/path/coded props only.
import { appendFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";
import { z } from "zod";
import { forwardFunnelEvent } from "../../../lib/marketing";

const eventSchema = z.object({
  name: z.enum(["waitlist_joined", "savings_calculated", "sleep_debt_calculated", "programme_page_cta_clicked"]),
  path: z.string().max(200),
  properties: z.record(z.union([z.string().max(100), z.number()])).default({}),
});

export async function POST(request: Request): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request." }, { status: 400 });
  }
  const parsed = eventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid event." }, { status: 400 });
  }

  // Prefer the domain store; fall back to the local NDJSON sink (dev/offline).
  if (
    await forwardFunnelEvent({
      name: parsed.data.name,
      path: parsed.data.path,
      properties: parsed.data.properties,
    })
  ) {
    return NextResponse.json({ success: true });
  }

  const dir = join(process.cwd(), ".data");
  await mkdir(dir, { recursive: true });
  const record = { ...parsed.data, receivedAt: new Date().toISOString() };
  await appendFile(join(dir, "events.ndjson"), `${JSON.stringify(record)}\n`, "utf8");
  return NextResponse.json({ success: true });
}
