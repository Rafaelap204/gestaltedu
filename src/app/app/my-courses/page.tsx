import { requireAuth } from "@/lib/utils/auth";
import { getEnrollmentsByStatus } from "@/lib/queries/student";
import { MyCoursesTabs } from "./MyCoursesTabs";

export const metadata = {
  title: "Meus Cursos - Gestalt EDU",
  description: "Gerencie seus cursos matriculados",
};

export default async function MyCoursesPage() {
  const session = await requireAuth('/app/my-courses');
  const profileId = session.profile?.id;

  if (!profileId) {
    return null;
  }

  // Fetch both active and completed enrollments
  const [activeEnrollments, completedEnrollments] = await Promise.all([
    getEnrollmentsByStatus(profileId, 'active'),
    getEnrollmentsByStatus(profileId, 'completed'),
  ]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-brand-gray-900">
          Meus Cursos
        </h1>
        <p className="text-brand-gray-500 mt-1">
          Acompanhe seu progresso e continue aprendendo
        </p>
      </div>

      {/* Tabs Component */}
      <MyCoursesTabs
        activeEnrollments={activeEnrollments}
        completedEnrollments={completedEnrollments}
      />
    </div>
  );
}
