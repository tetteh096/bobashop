"use client";

import { useEffect } from "react";
import { authClient } from "@/lib/auth-client";

/** Rendered only when accounts are on, so prototype mode never calls the auth API. */
export function SessionPrefill({ onUser }: { onUser: (user: { name?: string | null; email?: string | null }) => void }) {
  const { data: session } = authClient.useSession();
  useEffect(() => {
    if (session?.user) onUser(session.user);
  }, [session, onUser]);
  return null;
}

/** The signed-in user's name, or null; only mounted when accounts are on. */
export function useSessionUser() {
  return authClient.useSession().data?.user ?? null;
}
