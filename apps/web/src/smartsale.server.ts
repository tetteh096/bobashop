import type { SmartSaleConfig } from "@bobashop/api/smartsale/types";

import { ENV } from "./env.server";

/** Where the branches and menu come from, and whether paid orders are sent to the POS. */
export const smartsaleConfig: SmartSaleConfig = {
  baseUrl: ENV.SMARTSALE_BASE_URL,
  orgUuid: ENV.SMARTSALE_ORG_UUID,
  submitOrders: ENV.SMARTSALE_SUBMIT_ORDERS === true,
};

/** An item as the default branch sells it, for page titles and link previews. */
export async function findMenuItem(id: string) {
  const { defaultBranch, loadBranches, loadBranchMenu } = await import("@bobashop/api/smartsale/storefront");
  const branch = defaultBranch((await loadBranches(smartsaleConfig)).map((b) => b.branch));
  const found = branch ? await loadBranchMenu(smartsaleConfig, branch.id) : undefined;
  return found?.menu.products.find((p) => p.id === id);
}
