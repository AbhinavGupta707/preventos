import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";

const clerkConfigured =
  process.env["NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"] !== undefined &&
  process.env["NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"] !== "" &&
  process.env["CLERK_SECRET_KEY"] !== undefined &&
  process.env["CLERK_SECRET_KEY"] !== "";

const passThrough = (_request: NextRequest) => NextResponse.next();

export default clerkConfigured ? clerkMiddleware() : passThrough;

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/api/(.*)", "/__clerk/(.*)"],
};
