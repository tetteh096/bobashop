import { createAuth } from "@bobashop/auth";
import { createDb } from "@bobashop/db";

import { ENV } from "./env.server";
import { accountsEnabled } from "./features";

// Both stay null in prototype mode, so nothing ever tries to reach a database that isn't there.
export const db = accountsEnabled ? await createDb({ DATABASE_URL: ENV.DATABASE_URL! }) : null;
export const auth =
  accountsEnabled && db
    ? createAuth({ BETTER_AUTH_URL: ENV.BETTER_AUTH_URL, BETTER_AUTH_SECRET: ENV.BETTER_AUTH_SECRET! }, db)
    : null;
