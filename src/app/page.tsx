import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { CourseCard } from "@/components/courses/CourseCard";
import { createClient } from "@/lib/supabase/server";
import { BookOpen, Users, Award, Zap, Search, Play, Trophy } from "lucide-react";
import Link from "next/link";

export default async function Home() {
  // Fetch featured courses
  const supabase = await createClient();
  const { data: featuredCourses } = await supabase
    .from('courses')
    .select('*, profiles!courses_teacher_id_fkey(name)')
    .eq('status', 'published')
    .eq('featured', true)
    .limit(6);
  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-white py-20 sm:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold tracking-tight text-brand-gray-900 sm:text-6xl">
                Aprenda com os melhores professores
              </h1>
              <p className="mt-6 text-lg leading-8 text-brand-gray-600 max-w-2xl mx-auto">
                Descubra cursos de alta qualidade, aprenda no seu ritmo e alcance seus objetivos 
                com a ajuda de professores especializados.
              </p>
              <div className="mt-10 flex items-center justify-center gap-x-6">
                <Link href="/marketplace">
                  <Button size="lg">Explorar Cursos</Button>
                </Link>
                <Link href="/register">
                  <Button variant="outline" size="lg">
                    Criar Conta
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Courses Section */}
        <section className="bg-white py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-brand-gray-900">
                Cursos em Destaque
              </h2>
              <p className="mt-4 text-brand-gray-600">
                Comece sua jornada com nossos cursos mais populares
              </p>
            </div>

            {featuredCourses && featuredCourses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredCourses.map((course) => (
                  <CourseCard
                    key={course.id}
                    id={course.id}
                    title={course.title}
                    slug={course.slug}
                    thumbnailUrl={course.thumbnail_url}
                    teacherName={course.profiles?.name}
                    price={course.price}
                    shortDescription={course.short_description}
                    variant="recommendation"
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-brand-gray-500">Em breve novos cursos!</p>
              </div>
            )}

            <div className="text-center mt-10">
              <Link href="/marketplace">
                <Button variant="outline" size="lg">
                  Ver Todos os Cursos
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* How it Works Section */}
        <section className="bg-brand-orange-light py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-brand-gray-900">
                Como Funciona
              </h2>
              <p className="mt-4 text-brand-gray-600">
                Três passos simples para começar sua jornada de aprendizado
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-orange mx-auto mb-6">
                  <Search className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-brand-gray-900 mb-3">
                  1. Encontre seu curso
                </h3>
                <p className="text-brand-gray-600">
                  Explore nossa variedade de cursos e encontre o que combina com seus objetivos.
                </p>
              </div>

              <div className="text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-orange mx-auto mb-6">
                  <Play className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-brand-gray-900 mb-3">
                  2. Aprenda no seu ritmo
                </h3>
                <p className="text-brand-gray-600">
                  Estude quando e onde quiser, com acesso vitalício aos conteúdos.
                </p>
              </div>

              <div className="text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-orange mx-auto mb-6">
                  <Trophy className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-brand-gray-900 mb-3">
                  3. Conquiste seus objetivos
                </h3>
                <p className="text-brand-gray-600">
                  Aplique o que aprendeu e receba seu certificado de conclusão.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-brand-gray-50 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-brand-gray-900">
                Por que escolher a Gestalt EDU?
              </h2>
              <p className="mt-4 text-brand-gray-600">
                Uma plataforma completa para sua jornada de aprendizado
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card hoverable>
                <CardContent className="pt-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-orange-light mb-4">
                    <BookOpen className="h-6 w-6 text-brand-orange" />
                  </div>
                  <h3 className="text-lg font-semibold text-brand-gray-900 mb-2">
                    Cursos Variados
                  </h3>
                  <p className="text-sm text-brand-gray-600">
                    Acesse uma ampla variedade de cursos em diferentes áreas do conhecimento.
                  </p>
                </CardContent>
              </Card>

              <Card hoverable>
                <CardContent className="pt-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-orange-light mb-4">
                    <Users className="h-6 w-6 text-brand-orange" />
                  </div>
                  <h3 className="text-lg font-semibold text-brand-gray-900 mb-2">
                    Professores Experts
                  </h3>
                  <p className="text-sm text-brand-gray-600">
                    Aprenda com profissionais experientes e apaixonados pelo ensino.
                  </p>
                </CardContent>
              </Card>

              <Card hoverable>
                <CardContent className="pt-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-orange-light mb-4">
                    <Award className="h-6 w-6 text-brand-orange" />
                  </div>
                  <h3 className="text-lg font-semibold text-brand-gray-900 mb-2">
                    Certificados
                  </h3>
                  <p className="text-sm text-brand-gray-600">
                    Receba certificados reconhecidos ao concluir seus cursos.
                  </p>
                </CardContent>
              </Card>

              <Card hoverable>
                <CardContent className="pt-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-orange-light mb-4">
                    <Zap className="h-6 w-6 text-brand-orange" />
                  </div>
                  <h3 className="text-lg font-semibold text-brand-gray-900 mb-2">
                    Aprendizado Flexível
                  </h3>
                  <p className="text-sm text-brand-gray-600">
                    Estude no seu ritmo, onde e quando quiser.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-brand-orange py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Comece sua jornada
            </h2>
            <p className="text-white/90 mb-8 max-w-2xl mx-auto">
              Junte-se a milhares de alunos e comece a aprender hoje mesmo.
            </p>
            <Link href="/register">
              <Button
                size="lg"
                className="bg-white text-brand-orange hover:bg-brand-gray-100"
              >
                Criar Conta Gratuita
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
