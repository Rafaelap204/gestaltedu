import { getAdminEnrollments, getCoursesForFilter } from "@/lib/queries/admin";
import { AdminEnrollmentsClient } from "./AdminEnrollmentsClient";

export default async function AdminEnrollmentsPage() {
  const [enrollments, courses] = await Promise.all([
    getAdminEnrollments(),
    getCoursesForFilter()
  ]);
  
  return <AdminEnrollmentsClient initialEnrollments={enrollments} courses={courses} />;
}
