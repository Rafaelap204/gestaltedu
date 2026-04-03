import { getAdminUsers } from "@/lib/queries/admin";
import { AdminUsersClient } from "./AdminUsersClient";

export default async function AdminUsersPage() {
  const users = await getAdminUsers();
  
  return <AdminUsersClient initialUsers={users} />;
}
