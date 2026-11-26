import type { Database } from "@bobashop/db";
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";

export type AuthConfig = {
  BETTER_AUTH_URL: string;
  BETTER_AUTH_SECRET: string;
  /** Comma-separated emails that are always shop admins, so the first admin can get in. */
  ADMIN_EMAILS?: string;
};

/** Customers get "user"; shop staff who can see every order get "admin". */
export const ADMIN_ROLE = "admin";

export function parseAdminEmails(raw: string | undefined) {
  return new Set(
    (raw ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
  );
}

/** Better Auth stores several roles as "admin,user". */
export function hasAdminRole(role: string | null | undefined) {
  return (role ?? "").split(",").some((r) => r.trim() === ADMIN_ROLE);
}

export function createAuth(env: AuthConfig, database: Database) {
  const adminEmails = parseAdminEmails(env.ADMIN_EMAILS);
  const isAdminEmail = (email: string | null | undefined) => Boolean(email && adminEmails.has(email.toLowerCase()));

  return betterAuth({
    database: mongodbAdapter(database as any),
    trustedOrigins: [env.BETTER_AUTH_URL],
    emailAndPassword: { enabled: true },
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    databaseHooks: {
      user: {
        create: {
          // An email in ADMIN_EMAILS signs up straight into the admin role.
          before: async (user) => (isAdminEmail(user.email) ? { data: { ...user, role: ADMIN_ROLE } } : undefined),
        },
      },
      session: {
        create: {
          // An account made before its email was added to ADMIN_EMAILS is promoted at its next sign-in.
          after: async (session, ctx) => {
            if (!ctx || adminEmails.size === 0) return;
            const user = await ctx.context.internalAdapter.findUserById(session.userId);
            if (user && isAdminEmail(user.email) && !hasAdminRole((user as { role?: string }).role)) {
              await ctx.context.internalAdapter.updateUser(user.id, { role: ADMIN_ROLE });
            }
          },
        },
      },
    },
    plugins: [admin({ defaultRole: "user", adminRoles: [ADMIN_ROLE] }), nextCookies()],
  });
}

export type Session = ReturnType<typeof createAuth>["$Infer"]["Session"];
