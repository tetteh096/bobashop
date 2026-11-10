import type { Session } from "@bobashop/auth";
import type { Database } from "@bobashop/db";

export type Context = {
  session: Session | null;
  /** Null when the site runs without a database (prototype mode). */
  db: Database | null;
  /** Unset until Paystack keys are configured; checkout then reports that payment is unavailable. */
  paystackSecretKey?: string;
};
