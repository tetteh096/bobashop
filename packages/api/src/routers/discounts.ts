import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { publicProcedure, router } from "../index";
import { lookupDiscount } from "../discount-codes";

export const discountsRouter = router({
  /** Checks a code typed at the cart or checkout and returns its rule for display. */
  check: publicProcedure
    .input(z.object({ code: z.string().trim().min(1, "Enter a code").max(40) }))
    .mutation(({ input }) => {
      const result = lookupDiscount(input.code);
      if (!result.ok) throw new TRPCError({ code: "BAD_REQUEST", message: result.reason });
      return result.rule;
    }),
});
