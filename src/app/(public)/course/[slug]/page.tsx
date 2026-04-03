import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { 
  Star, 
  Clock, 
  BookOpen, 
  User, 
  Lock, 
  CheckCircle,
  PlayCircle,
  FileText,
  Award
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils/format";

interface CoursePageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: CoursePageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  
  const { data: course } = await supabase
    .from('courses')
    .select('title, short_description')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (!course) {
    return {
      title: 'Curso não encontrado | Gestalt EDU',
    };
  }

  return {
    title: `${course.title} | Gestalt EDU`,
    description: course.short_description || `Aprenda ${course.title} na Gestalt EDU`,
  };
}

export default async function CoursePage({ params }: CoursePageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  // Fetch course with teacher profile
  const { data: course } = await supabase
    .from('courses')
    .select('*, profiles!courses_teacher_id_fkey(id, name, bio, avatar_url)')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (!course) {
    notFound();
  }

  // Fetch modules with lessons
  const { data: modules } = await supabase
    .from('modules')
    .select('*, lessons(*)')
    .eq('course_id', course.id)
    .order('position', { ascending: true });

  // Calculate total lessons and estimated duration
  const totalLessons = modules?.reduce((acc, mod) => acc + (mod.lessons?.length || 0), 0) || 0;
  const totalModules = modules?.length || 0;
  const estimatedHours = Math.ceil(totalLessons * 0.5); // Rough estimate: 30 min per lesson

  // Check if user is enrolled (if authenticated)
  const { data: { user } } = await supabase.auth.getUser();
  let isEnrolled = false;
  
  if (user) {
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('course_id', course.id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();
    isEnrolled = !!enrollment;
  }

  const teacher = course.profiles;

  return (
    <div className="min-h-screen bg-brand-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-brand-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center gap-2 text-sm text-brand-gray-500">
            <Link href="/" className="hover:text-brand-orange transition-colors">
              Início
            </Link>
            <span>/</span>
            <Link href="/marketplace" className="hover:text-brand-orange transition-colors">
              Marketplace
            </Link>
            <span>/</span>
            <span className="text-brand-gray-900 truncate">{course.title}</span>
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Course Header */}
            <div className="bg-white rounded-xl border border-brand-gray-200 shadow-sm overflow-hidden">
              {/* Thumbnail */}
              <div className="relative aspect-video bg-gradient-to-br from-brand-orange/20 to-brand-orange-light">
                {course.thumbnail_url ? (
                  <img
                    src={course.thumbnail_url}
                    alt={course.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <span className="text-6xl font-bold text-brand-orange/30">EDU</span>
                  </div>
                )}
                {course.category && (
                  <div className="absolute left-4 top-4">
                    <Badge variant="info">{course.category}</Badge>
                  </div>
                )}
              </div>

              <div className="p-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-brand-gray-900 mb-4">
                  {course.title}
                </h1>

                {/* Rating */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex items-center gap-1">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={18}
                          className={`${
                            i < 4 ? "fill-yellow-400 text-yellow-400" : "fill-yellow-400/50 text-yellow-400/50"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-brand-gray-600 ml-1">4.5 (128 avaliações)</span>
                  </div>
                  <span className="text-brand-gray-300">|</span>
                  <span className="text-sm text-brand-gray-600">{totalModules} módulos</span>
                  <span className="text-brand-gray-300">|</span>
                  <span className="text-sm text-brand-gray-600">{totalLessons} aulas</span>
                </div>

                {/* Teacher Info */}
                <div className="flex items-center gap-4 p-4 bg-brand-gray-50 rounded-lg">
                  <Avatar
                    src={teacher?.avatar_url}
                    alt={teacher?.name || "Professor"}
                    size="lg"
                  />
                  <div>
                    <p className="text-sm text-brand-gray-500">Professor</p>
                    <p className="font-semibold text-brand-gray-900">{teacher?.name || "Professor"}</p>
                    {teacher?.bio && (
                      <p className="text-sm text-brand-gray-600 mt-1 line-clamp-2">{teacher.bio}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-xl border border-brand-gray-200 shadow-sm p-6">
              <h2 className="text-xl font-bold text-brand-gray-900 mb-4">
                Sobre o Curso
              </h2>
              <div className="prose prose-brand-gray max-w-none">
                <p className="text-brand-gray-600 whitespace-pre-line">
                  {course.description || course.short_description || "Descrição do curso em breve."}
                </p>
              </div>
            </div>

            {/* Course Content */}
            <div className="bg-white rounded-xl border border-brand-gray-200 shadow-sm p-6">
              <h2 className="text-xl font-bold text-brand-gray-900 mb-4">
                Conteúdo do Curso
              </h2>
              <p className="text-sm text-brand-gray-600 mb-6">
                {totalModules} módulos • {totalLessons} aulas • Duração estimada: {estimatedHours}h
              </p>

              <div className="space-y-4">
                {modules && modules.length > 0 ? (
                  modules.map((module, moduleIndex) => (
                    <div key={module.id} className="border border-brand-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-brand-gray-50 px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-orange text-white text-xs font-medium">
                            {moduleIndex + 1}
                          </span>
                          <h3 className="font-semibold text-brand-gray-900">{module.title}</h3>
                        </div>
                        <span className="text-sm text-brand-gray-500">
                          {module.lessons?.length || 0} aulas
                        </span>
                      </div>
                      <div className="divide-y divide-brand-gray-100">
                        {module.lessons?.map((lesson: { id: string; title: string; duration?: number; type?: string }) => (
                          <div key={lesson.id} className="px-4 py-3 flex items-center gap-3">
                            <Lock className="h-4 w-4 text-brand-gray-400" />
                            {lesson.type === 'video' ? (
                              <PlayCircle className="h-4 w-4 text-brand-gray-400" />
                            ) : (
                              <FileText className="h-4 w-4 text-brand-gray-400" />
                            )}
                            <span className="text-sm text-brand-gray-600 flex-1">{lesson.title}</span>
                            {lesson.duration && (
                              <span className="text-xs text-brand-gray-400">
                                {Math.floor(lesson.duration / 60)}:{String(lesson.duration % 60).padStart(2, '0')}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-brand-gray-500 text-center py-8">
                    Conteúdo do curso em desenvolvimento.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24 space-y-6">
              {/* Price Card */}
              <div className="bg-white rounded-xl border border-brand-gray-200 shadow-sm p-6">
                <div className="text-center mb-6">
                  <span className={`text-4xl font-bold ${course.price === 0 ? "text-green-600" : "text-brand-gray-900"}`}>
                    {formatPrice(course.price)}
                  </span>
                </div>

                {isEnrolled ? (
                  <Link href={`/app/course/${course.id}`}>
                    <Button size="lg" className="w-full">
                      <PlayCircle className="h-5 w-5 mr-2" />
                      Acessar Curso
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link href={`/checkout/${course.id}`}>
                      <Button size="lg" className="w-full mb-3">
                        Comprar Agora
                      </Button>
                    </Link>
                    <Button variant="outline" size="lg" className="w-full">
                      Adicionar à Lista
                    </Button>
                  </>
                )}

                {/* Course Stats */}
                <div className="mt-6 pt-6 border-t border-brand-gray-100 space-y-3">
                  <div className="flex items-center gap-3 text-sm text-brand-gray-600">
                    <BookOpen className="h-4 w-4 text-brand-gray-400" />
                    <span>{totalModules} módulos</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-brand-gray-600">
                    <PlayCircle className="h-4 w-4 text-brand-gray-400" />
                    <span>{totalLessons} aulas</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-brand-gray-600">
                    <Clock className="h-4 w-4 text-brand-gray-400" />
                    <span>{estimatedHours}h de conteúdo</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-brand-gray-600">
                    <Award className="h-4 w-4 text-brand-gray-400" />
                    <span>Certificado de conclusão</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-brand-gray-600">
                    <CheckCircle className="h-4 w-4 text-brand-gray-400" />
                    <span>Acesso vitalício</span>
                  </div>
                </div>
              </div>

              {/* Mobile CTA */}
              <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-brand-gray-200 p-4 z-50">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xl font-bold text-brand-gray-900">
                    {formatPrice(course.price)}
                  </span>
                  {isEnrolled ? (
                    <Link href={`/app/course/${course.id}`}>
                      <Button>Acessar Curso</Button>
                    </Link>
                  ) : (
                    <Link href={`/checkout/${course.id}`}>
                      <Button>Comprar Agora</Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
