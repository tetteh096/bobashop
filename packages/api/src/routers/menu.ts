import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { publicProcedure, router } from "../index";
import { defaultBranch, loadBranches, loadBranchMenu } from "../smartsale/storefront";

function unavailable(error: unknown): never {
  console.error("SmartSale: menu unavailable", error);
  throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "We couldn't load the menu just now. Please try again in a minute." });
}

export const menuRouter = router({
  /** Every branch: those on SmartSale take orders, the rest are listed for calls and WhatsApp. */
  branches: publicProcedure.query(async ({ ctx }) => {
    const all = await loadBranches(ctx.smartsale).catch(unavailable);
    return all.map((b) => b.branch);
  }),

  /**
   * Today's menu at a branch, straight from its POS. With no branch (or one that doesn't take
   * online orders), the first branch that does, so first-time visitors still see a menu.
   */
  forBranch: publicProcedure.input(z.object({ branchId: z.string().max(80).optional() })).query(async ({ ctx, input }) => {
    let found = input.branchId ? await loadBranchMenu(ctx.smartsale, input.branchId).catch(unavailable) : undefined;
    if (!found) {
      const branches = await loadBranches(ctx.smartsale).catch(unavailable);
      const fallback = defaultBranch(branches.map((b) => b.branch));
      found = fallback ? await loadBranchMenu(ctx.smartsale, fallback.id).catch(unavailable) : undefined;
    }
    if (!found) return null;
    return {
      branchId: found.branch.id,
      categories: found.menu.categories,
      products: found.menu.products,
      tracksStock: found.menu.tracksStock,
    };
  }),
});
