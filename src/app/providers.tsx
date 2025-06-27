"use client";

import { AuthProvider, useAuth } from "react-oidc-context";
import { WebStorageStateStore } from "oidc-client-ts";

export { useAuth };

const oidcConfig = {
  authority: process.env.NEXT_PUBLIC_OIDC_AUTHORITY || "",
  client_id: process.env.NEXT_PUBLIC_OIDC_CLIENT_ID || "",
  scope: "openid profile email",
  response_type: "code",
  redirect_uri: typeof window !== "undefined" ? `${window.location.origin}/file-operations` : "",
  metadata: {
    issuer: process.env.NEXT_PUBLIC_OIDC_AUTHORITY,
    jwks_uri: `${process.env.NEXT_PUBLIC_OIDC_AUTHORITY}/jwk`,
    authorization_endpoint: `${process.env.NEXT_PUBLIC_OIDC_AUTHORITY}/authorize`,
    token_endpoint: `${process.env.NEXT_PUBLIC_OIDC_AUTHORITY}/token`,
    userinfo_endpoint: `${process.env.NEXT_PUBLIC_OIDC_AUTHORITY}/userinfo`,
    end_session_endpoint: `${process.env.NEXT_PUBLIC_OIDC_AUTHORITY}/session/end`,
  },
  automaticSilentRenew: true,
  checkSessionIntervalInSeconds: 3600,
  stateStore: typeof window !== "undefined" ? new WebStorageStateStore({ store: window.sessionStorage }) : undefined,
  userStore: typeof window !== "undefined" ? new WebStorageStateStore({ store: window.localStorage }) : undefined,
  onSigninCallback: () => {
    if (typeof window !== "undefined") {
      window.history.replaceState(
        {},
        document.title,
        window.location.pathname
      );
    }
  }
};

export function Providers({ children }: { children: React.ReactNode }) {
  if (typeof window !== "undefined") {
    console.log("OIDC Config:", {
      ...oidcConfig,
      client_id: oidcConfig.client_id ? "SET" : "NOT SET"
    });
  }

  return (
    <AuthProvider {...oidcConfig}>
      {children}
    </AuthProvider>
  );
} 