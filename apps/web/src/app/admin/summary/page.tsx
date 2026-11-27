import { NotAdmin } from "../admin-nav";
import { requireAdmin } from "../require-admin";
import { SummaryBoard } from "./summary-board";

export default async function AdminSummaryPage() {
  const { user, isAdmin } = await requireAdmin("/admin/summary");
  return isAdmin ? <SummaryBoard /> : <NotAdmin email={user.email} />;
}
