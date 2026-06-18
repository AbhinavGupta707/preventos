import { NextResponse } from "next/server";
import { deleteAccountInApi } from "../../../lib/api";
import { clerkBearerToken } from "../../../lib/clerk-server";

function bearerFrom(request: Request): string | undefined {
  const authHeader = request.headers.get("authorization");
  return authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : undefined;
}

export async function DELETE(request: Request): Promise<NextResponse> {
  const bearerToken = bearerFrom(request) ?? (await clerkBearerToken());
  const result = await deleteAccountInApi(bearerToken);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error.message },
      { status: result.error.status === 0 ? 502 : result.error.status },
    );
  }

  return new NextResponse(null, { status: 204 });
}
