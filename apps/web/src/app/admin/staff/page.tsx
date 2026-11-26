import { NotAdmin } from "../admin-nav";
import { requireAdmin } from "../require-admin";
import { StaffBoard } from "./staff-board";

export default async function AdminStaffPage() {
  const { user, isAdmin } = await requireAdmin("/admin/staff");
  return isAdmin ? <StaffBoard currentUserId={user.id} /> : <NotAdmin email={user.email} />;
}
