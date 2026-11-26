import { hasAdminRole } from "@bobashop/auth";
import type { Route } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "../../services";

/**
 * Every admin page calls this itself (layouts don't re-run on navigation). It only decides
 * what to render: the data behind the pages is guarded separately by tRPC's adminProcedure.
 */
export async function requireAdmin(path: string) {
  if (!auth) redirect("/");
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect(`/login?next=${encodeURIComponent(path)}` as Route);
  return { user: session.user, isAdmin: hasAdminRole(session.user.role) };
}
