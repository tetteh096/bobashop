import { NotAdmin } from "./admin-nav";
import { OrdersBoard } from "./orders-board";
import { requireAdmin } from "./require-admin";

export default async function AdminOrdersPage() {
  const { user, isAdmin } = await requireAdmin("/admin");
  return isAdmin ? <OrdersBoard /> : <NotAdmin email={user.email} />;
}
