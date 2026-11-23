// What SmartSale's Firebase database holds, as it actually arrives: numbers are often strings,
// fields can be missing, and values like OPENED or DELIVERY come in any case.

export interface SmartSaleConfig {
  /** The organisation's Firebase database, e.g. https://<project>-default-rtdb.firebaseio.com */
  baseUrl: string;
  /** The organisation's UUID: the top-level key in that database. */
  orgUuid: string;
  /** Send paid orders to the branch POS. Off while testing. */
  submitOrders: boolean;
}

export interface RawOption {
  value?: string;
  priceChange?: number | string;
  stockQty?: number | string;
  stockSKU?: string;
}

export interface RawAttribute {
  name?: string;
  options?: RawOption[];
}

export interface RawProduct {
  attributes?: RawAttribute[];
  barcodes?: string;
  bin?: string;
  category?: string;
  dept?: string;
  description?: string;
  name?: string;
  picture?: string;
  price?: string | number;
  qty?: string | number;
  schedule?: { cycle?: string; days?: string; startDate?: string };
  sku?: string;
  /** STOCK, SERVICE, RAW MATERIAL… */
  type?: string;
  otherPrices?: { cost?: string; wholesale?: string };
}

/** An inventory item with the key and bin it was stored under, which a sale must quote back. */
export interface PosItem extends RawProduct {
  posId: string;
  bin: string;
}

export interface RawContactInfo {
  gpsLocation?: string;
  hostName?: string;
  location?: string;
  logo?: string;
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  regAddress?: string;
  www?: string;
}

export interface RawRegistration {
  contact_info?: RawContactInfo;
  inventory?: { binCount?: string; binList?: string[]; count?: string };
  cloud_config?: { visible?: boolean | string; incognito?: boolean; siteCode?: string; syncMaster?: boolean };
  /** pos_cashier1, pos_cashier2…: { status: "OPENED" | "CLOSED", eventTime } */
  [key: string]: unknown;
}

export type Registrations = Record<string, RawRegistration>;
