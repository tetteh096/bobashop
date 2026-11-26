import { adminClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  // Staff management on /admin/staff: list accounts, add staff, change roles, reset passwords.
  plugins: [adminClient()],
});

/** Where to go after signing in: `?next=/admin` when a page sent them here, else their account. */
export function afterSignInPath() {
  if (typeof window === "undefined") return "/dashboard";
  const next = new URLSearchParams(window.location.search).get("next");
  // Only paths on this site, so a link can't bounce someone to another domain.
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
}
