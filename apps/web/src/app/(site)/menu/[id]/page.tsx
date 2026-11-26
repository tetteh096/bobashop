import type { Metadata } from "next";
import { SHOP } from "@bobashop/api/data/shop";
import { ProductDetail } from "@/components/shop/product-detail";
import { findMenuItem } from "@/smartsale.server";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const product = await findMenuItem((await params).id).catch(() => undefined);
  return product
    ? { title: `${product.name} | ${SHOP.legalName}`, description: product.description || product.notes }
    : { title: SHOP.legalName };
}

/** What's on the menu depends on the customer's branch, so the item itself loads in the browser. */
export default async function ItemPage({ params }: { params: Promise<{ id: string }> }) {
  return <ProductDetail id={(await params).id} />;
}
