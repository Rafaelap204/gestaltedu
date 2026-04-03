import { getAdminCourses } from "@/lib/queries/admin";
import { AdminCoursesClient } from "./AdminCoursesClient";

export default async function AdminCoursesPage() {
  const courses = await getAdminCourses();
  
  return <AdminCoursesClient initialCourses={courses} />;
}
