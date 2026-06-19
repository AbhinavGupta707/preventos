export function clerkServerConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  return (
    env["NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"] !== undefined &&
    env["NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"] !== "" &&
    env["CLERK_SECRET_KEY"] !== undefined &&
    env["CLERK_SECRET_KEY"] !== ""
  );
}

export async function clerkBearerToken(): Promise<string | undefined> {
  if (!clerkServerConfigured()) return undefined;

  const { auth } = await import("@clerk/nextjs/server");
  const session = await auth();
  if (session.userId === null) return undefined;

  const template = process.env["CLERK_JWT_TEMPLATE"];
  const token = await session.getToken(template !== undefined && template !== "" ? { template } : undefined);
  return token ?? undefined;
}
