import type { Session } from "@bobashop/auth";
import type { Database } from "@bobashop/db";

import type { SmartSaleConfig } from "./smartsale/types";

export type Context = {
  session: Session | null;
  /** Null when the site runs without a database (prototype mode). */
  db: Database | null;
  /** Unset until Paystack keys are configured; checkout then reports that payment is unavailable. */
  paystackSecretKey?: string;
  /** Where the branches, menu and stock come from, and where paid orders go. */
  smartsale: SmartSaleConfig;
};
