import { protectedProcedure, publicProcedure, router } from "../index";
import { ordersRouter } from "./orders";
import { discountsRouter } from "./discounts";
import { customersRouter } from "./customers";
import { menuRouter } from "./menu";
import { adminRouter } from "./admin";

export const appRouter = router({
  menu: menuRouter,
  orders: ordersRouter,
  discounts: discountsRouter,
  customers: customersRouter,
  admin: adminRouter,
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
