import { getAdminUsers } from "@/lib/queries/admin";
import { createClient } from "@/lib/supabase/server";
import { AdminUsersClient } from "./AdminUsersClient";

async function getCourses() {
  const supabase = await createClient();
  
  const { data: courses } = await supabase
    .from('courses')
    .select('id, title')
    .eq('status', 'published')
    .order('title', { ascending: true });
  
  return courses || [];
}

export default async function AdminUsersPage() {
  const [users, courses] = await Promise.all([
    getAdminUsers(),
    getCourses()
  ]);
  
  return <AdminUsersClient initialUsers={users} courses={courses} />;
}
