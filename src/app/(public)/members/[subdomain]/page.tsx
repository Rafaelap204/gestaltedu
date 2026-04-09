import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Globe, BookOpen, ArrowRight } from 'lucide-react'
import type { MembersAreaTheme } from '@/types/database'

interface MembersLandingPageProps {
  params: Promise<{
    subdomain: string
  }>
}

export default async function MembersLandingPage({ params }: MembersLandingPageProps) {
  const { subdomain } = await params
  const supabase = await createClient()

  // Look up course by subdomain
  const { data: course } = await supabase
    .from('courses')
    .select('id, title, slug, description, short_description, thumbnail_url, members_area_enabled, members_area_theme, price')
    .eq('members_area_subdomain', subdomain)
    .single()

  if (!course || !course.members_area_enabled) {
    notFound()
  }

  const theme = (course.members_area_theme as MembersAreaTheme) || {
    primaryColor: '#F97316',
    logoUrl: null,
    darkMode: false,
  }

  // Count modules/lessons
  const { data: modules } = await supabase
    .from('modules')
    .select('id, lessons(count)')
    .eq('course_id', course.id)

  const totalModules = modules?.length || 0
  const totalLessons = modules?.reduce((acc, m) => {
    const count = (m.lessons as unknown as [{ count: number }])?.[0]?.count || 0
    return acc + count
  }, 0) || 0

  return (
    <div className="min-h-screen bg-brand-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-brand-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {theme.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={theme.logoUrl} alt="Logo" className="h-8 object-contain" />
            ) : (
              <div
                className="h-8 w-8 rounded flex items-center justify-center text-white font-bold text-sm"
                style={{ backgroundColor: theme.primaryColor }}
              >
                G
              </div>
            )}
            <span className="font-semibold text-brand-gray-900">{course.title}</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/course/${course.slug}`}
              className="text-sm text-brand-gray-600 hover:text-brand-gray-900 transition-colors"
            >
              Ver detalhes
            </Link>
            <Link
              href={`/login?redirect=/members-area/${course.id}`}
              className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors"
              style={{ backgroundColor: theme.primaryColor }}
            >
              Entrar
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-2xl text-center">
          {course.thumbnail_url && (
            <div className="mb-8 rounded-xl overflow-hidden shadow-lg max-w-md mx-auto">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={course.thumbnail_url}
                alt={course.title}
                className="w-full aspect-video object-cover"
              />
            </div>
          )}

          <h1 className="text-3xl sm:text-4xl font-bold text-brand-gray-900 mb-4">
            {course.title}
          </h1>

          {(course.short_description || course.description) && (
            <p className="text-lg text-brand-gray-600 mb-8">
              {course.short_description || course.description}
            </p>
          )}

          {/* Stats */}
          <div className="flex items-center justify-center gap-6 mb-8">
            <div className="flex items-center gap-2 text-brand-gray-600">
              <BookOpen size={20} />
              <span className="text-sm">{totalModules} módulo{totalModules !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-2 text-brand-gray-600">
              <Globe size={20} />
              <span className="text-sm">{totalLessons} aula{totalLessons !== 1 ? 's' : ''}</span>
            </div>
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={`/login?redirect=/members-area/${course.id}`}
              className="flex items-center gap-2 px-6 py-3 text-white font-semibold rounded-lg shadow-lg transition-transform hover:scale-105"
              style={{ backgroundColor: theme.primaryColor }}
            >
              Acessar Área de Membros
              <ArrowRight size={18} />
            </Link>
            {course.price > 0 && (
              <Link
                href={`/checkout/${course.id}`}
                className="px-6 py-3 border border-brand-gray-300 text-brand-gray-700 font-semibold rounded-lg hover:bg-brand-gray-100 transition-colors"
              >
                Comprar Curso
              </Link>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-brand-gray-200 py-4">
        <div className="max-w-4xl mx-auto px-4 text-center text-sm text-brand-gray-500">
          Powered by Gestalt EDU
        </div>
      </footer>
    </div>
  )
}
