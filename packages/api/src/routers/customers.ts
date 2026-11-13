import { z } from "zod";

import { publicProcedure, router } from "../index";
import { lookupCustomer } from "../customers";

export const customersRouter = router({
  /** A returning customer's details from their phone number or email, or null if we don't know them. */
  lookup: publicProcedure
    .input(z.object({ query: z.string().trim().min(3, "Enter your phone number or email").max(120) }))
    .mutation(async ({ ctx, input }) => {
      const profile = await lookupCustomer(ctx.db, input.query);
      return { found: profile !== null, profile };
    }),
});
