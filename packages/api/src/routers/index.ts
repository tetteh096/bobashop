import { protectedProcedure, publicProcedure, router } from "../index";
import { ordersRouter } from "./orders";
import { discountsRouter } from "./discounts";
import { customersRouter } from "./customers";

export const appRouter = router({
  orders: ordersRouter,
  discounts: discountsRouter,
  customers: customersRouter,
  healthCheck: publicProcedure.query(() => {
    return "OK";
  }),
  privateData: protectedProcedure.query(({ ctx }) => {
    return {
      message: "This is private",
      user: ctx.session.user,
    };
  }),
});
export type AppRouter = typeof appRouter;
