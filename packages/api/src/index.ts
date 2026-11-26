import { hasAdminRole } from "@bobashop/auth";
import { initTRPC, TRPCError } from "@trpc/server";
import { ZodError } from "zod";

import type { Context } from "./context";

export const t = initTRPC.context<Context>().create({
  // Surface the first validation message ("Enter a valid email") instead of raw Zod JSON.
  errorFormatter({ shape, error }) {
    if (error.cause instanceof ZodError) {
      return { ...shape, message: error.cause.issues[0]?.message ?? shape.message };
    }
    return shape;
  },
});

export const router = t.router;

export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
      cause: "No session",
    });
  }
  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
    },
  });
});

/** Shop staff only: the admin role is set by Better Auth's admin plugin (see packages/auth). */
export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!hasAdminRole(ctx.session.user.role)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Only shop admins can do that." });
  }
  return next({ ctx });
});
