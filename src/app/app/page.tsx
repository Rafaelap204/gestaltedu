import Link from "next/link";
import { BookOpen, ShoppingBag, Users, PlayCircle } from "lucide-react";
import { requireAuth } from "@/lib/utils/auth";
import { getStudentEnrollments, getRecommendedCourses } from "@/lib/queries/student";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { CourseCard } from "@/components/courses/CourseCard";

export default async function StudentDashboardPage() {
  const session = await requireAuth('/app');
  const profileId = session.profile?.id;

  if (!profileId) {
    return null;
  }

  // Fetch data - usar profileId (profiles.id) para matrículas
  const [enrollments, recommendations] = await Promise.all([
    getStudentEnrollments(profileId),
    getRecommendedCourses(profileId, 6),
  ]);

  const userName = session.profile?.name || session.user.email.split('@')[0];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-brand-orange to-brand-orange-hover rounded-2xl p-6 sm:p-8 text-white">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">
          Olá, {userName}!
        </h1>
        <p className="text-white/90 text-sm sm:text-base">
          Bem-vindo de volta à sua jornada de aprendizado. Continue de onde parou.
        </p>
      </div>

      {/* Continue Watching Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-brand-gray-900">
            Continuar Assistindo
          </h2>
          {enrollments.length > 0 && (
            <Link
              href="/app/my-courses"
              className="text-sm font-medium text-brand-orange hover:text-brand-orange-hover transition-colors"
            >
              Ver todos
            </Link>
          )}
        </div>

        {enrollments.length === 0 ? (
          <EmptyState
            iconName="PlayCircle"
            title="Você ainda não começou nenhum curso"
            description="Explore nosso marketplace e comece sua jornada de aprendizado hoje mesmo."
            action={
              <Link href="/marketplace">
                <Button variant="primary">Explorar Cursos</Button>
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {enrollments.slice(0, 3).map((enrollment) => (
              <CourseCard
                key={enrollment.id}
                id={enrollment.course.id}
                title={enrollment.course.title}
                slug={enrollment.course.slug}
                thumbnailUrl={enrollment.course.thumbnail_url}
                teacherName={enrollment.course.teacher?.name ?? null}
                progressPct={enrollment.progress.progressPct}
                totalLessons={enrollment.progress.totalLessons}
                completedLessons={enrollment.progress.completedLessons}
                variant="progress"
              />
            ))}
          </div>
        )}
      </section>

      {/* Recommendations Section */}
      {recommendations.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-brand-gray-900">
              Recomendações
            </h2>
            <Link
              href="/courses"
              className="text-sm font-medium text-brand-orange hover:text-brand-orange-hover transition-colors"
            >
              Ver todos
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendations.map((course) => (
              <CourseCard
                key={course.id}
                id={course.id}
                title={course.title}
                slug={course.slug}
                thumbnailUrl={course.thumbnail_url}
                teacherName={course.teacher?.name ?? null}
                price={course.price}
                shortDescription={course.short_description}
                variant="recommendation"
              />
            ))}
          </div>
        </section>
      )}

      {/* Quick Links Section */}
      <section>
        <h2 className="text-xl font-semibold text-brand-gray-900 mb-4">
          Acesso Rápido
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card hoverable className="group">
            <Link href="/app/my-courses" className="block p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-orange-light group-hover:bg-brand-orange transition-colors duration-200">
                  <BookOpen size={24} className="text-brand-orange group-hover:text-white transition-colors duration-200" />
                </div>
                <div>
                  <h3 className="font-semibold text-brand-gray-900 mb-1">
                    Meus Cursos
                  </h3>
                  <p className="text-sm text-brand-gray-500">
                    Acesse todos os seus cursos matriculados
                  </p>
                </div>
              </div>
            </Link>
          </Card>

          <Card hoverable className="group">
            <Link href="/courses" className="block p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 group-hover:bg-blue-500 transition-colors duration-200">
                  <ShoppingBag size={24} className="text-blue-500 group-hover:text-white transition-colors duration-200" />
                </div>
                <div>
                  <h3 className="font-semibold text-brand-gray-900 mb-1">
                    Marketplace
                  </h3>
                  <p className="text-sm text-brand-gray-500">
                    Descubra novos cursos para aprender
                  </p>
                </div>
              </div>
            </Link>
          </Card>

          <Card hoverable className="group">
            <Link href="/app/referral" className="block p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 group-hover:bg-green-500 transition-colors duration-200">
                  <Users size={24} className="text-green-500 group-hover:text-white transition-colors duration-200" />
                </div>
                <div>
                  <h3 className="font-semibold text-brand-gray-900 mb-1">
                    Indicação
                  </h3>
                  <p className="text-sm text-brand-gray-500">
                    Convide amigos e ganhe recompensas
                  </p>
                </div>
              </div>
            </Link>
          </Card>
        </div>
      </section>
    </div>
  );
}
