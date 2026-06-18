import { ClerkProvider, useAuth } from "@clerk/clerk-expo";
import { useEffect, type ReactNode } from "react";

import { setAuthTokenProvider } from "../api";

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
const jwtTemplate = process.env.EXPO_PUBLIC_CLERK_JWT_TEMPLATE;

export const mobileClerkConfigured = publishableKey !== undefined && publishableKey !== "";

function ClerkTokenBridge() {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      setAuthTokenProvider(async () => undefined);
      return () => setAuthTokenProvider(undefined);
    }

    setAuthTokenProvider(async () => {
      const token = await getToken(jwtTemplate !== undefined && jwtTemplate !== "" ? { template: jwtTemplate } : undefined);
      return token ?? undefined;
    });
    return () => setAuthTokenProvider(undefined);
  }, [getToken, isLoaded, isSignedIn]);

  return null;
}

export function PreventOSAuthProvider({ children }: { readonly children: ReactNode }) {
  if (!mobileClerkConfigured) return <>{children}</>;

  return (
    <ClerkProvider publishableKey={publishableKey}>
      <ClerkTokenBridge />
      {children}
    </ClerkProvider>
  );
}
