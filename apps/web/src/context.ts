import type { Context as ApiContext } from "@bobashop/api/context";
import type { NextRequest } from "next/server";

import { ENV } from "./env.server";
import { db } from "./services";
import { auth } from "./services";

export async function createContext(req: NextRequest): Promise<ApiContext> {
  const session = auth ? await auth.api.getSession({ headers: req.headers }) : null;
  return {
    db,
    session,
    paystackSecretKey: ENV.PAYSTACK_SECRET_KEY || undefined,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
