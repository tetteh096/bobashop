import { NotAdmin } from "./admin-nav";
import { OrdersBoard } from "./orders-board";
import { requireAdmin } from "./require-admin";

export default async function AdminOrdersPage({ searchParams }: PageProps<"/admin">) {
  const { user, isAdmin } = await requireAdmin("/admin");
  // ?q=ORD-… opens the list already searched (the daily summary links here).
  const q = (await searchParams).q;
  return isAdmin ? <OrdersBoard initialSearch={typeof q === "string" ? q : ""} /> : <NotAdmin email={user.email} />;
}
