import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { SiteNav } from "../components/site-nav";
import { SiteFooter } from "../components/site-footer";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://preventos.example"),
  title: {
    default: "PreventOS — four programmes, one coach",
    template: "%s · PreventOS",
  },
  description:
    "Quit smoking, step down vaping, drink less, sleep better. Four behaviour-change programmes in one app, with one coach that respects your attention.",
};

const clerkPublishableKey = process.env["NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"];

export default function RootLayout({ children }: { children: ReactNode }) {
  const page = (
    <html lang="en-GB">
      <body>
        <SiteNav />
        <main id="main">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );

  return clerkPublishableKey !== undefined && clerkPublishableKey !== "" ? (
    <ClerkProvider publishableKey={clerkPublishableKey}>{page}</ClerkProvider>
  ) : (
    page
  );
}
