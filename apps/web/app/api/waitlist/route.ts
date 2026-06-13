// WP3.1 — waitlist capture. Local-first NDJSON sink under .data/ until the
// services assembly (SVC) provides a real store; the route shape is stable.
import { appendFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";
import { z } from "zod";

const signupSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address."),
  programme: z.enum(["quitkit", "exhale", "steady", "nightshift", "unsure"]).default("unsure"),
  website: z.literal("").or(z.undefined()), // honeypot: any value rejects
});

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, { count: number; windowStart: number }>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || now - entry.windowStart > WINDOW_MS) {
    hits.set(ip, { count: 1, windowStart: now });
    return false;
  }
  hits.set(ip, { ...entry, count: entry.count + 1 });
  return entry.count + 1 > MAX_PER_WINDOW;
}

export async function POST(request: Request): Promise<NextResponse> {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (rateLimited(ip)) {
    return NextResponse.json({ success: false, error: "Too many attempts — please try again shortly." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request." }, { status: 400 });
  }

  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    const error = parsed.error.issues[0]?.message ?? "Invalid request.";
    return NextResponse.json({ success: false, error }, { status: 400 });
  }

  const dir = join(process.cwd(), ".data");
  await mkdir(dir, { recursive: true });
  const record = {
    email: parsed.data.email,
    programme: parsed.data.programme,
    joinedAt: new Date().toISOString(),
  };
  await appendFile(join(dir, "waitlist.ndjson"), `${JSON.stringify(record)}\n`, "utf8");

  return NextResponse.json({ success: true });
}
