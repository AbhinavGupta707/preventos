// WP3.1 — first-party conversion events. NDJSON sink under .data/ until SVC
// exposes the real @preventos/events backbone. No PII: name/path/props only.
import { appendFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";
import { z } from "zod";

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
  const dir = join(process.cwd(), ".data");
  await mkdir(dir, { recursive: true });
  const record = { ...parsed.data, receivedAt: new Date().toISOString() };
  await appendFile(join(dir, "events.ndjson"), `${JSON.stringify(record)}\n`, "utf8");
  return NextResponse.json({ success: true });
}
