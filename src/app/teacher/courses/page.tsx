import Link from 'next/link'
import { Plus, Edit2, Trash2, Eye, EyeOff, Users, LayoutDashboard } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/utils/auth'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { deleteCourseAction, publishCourseAction, unpublishCourseAction } from '@/lib/actions/courses'
import type { CourseStatus } from '@/types/database'

interface CourseWithStats {
  id: string
  title: string
  slug: string
  status: CourseStatus
  price: number
  thumbnail_url: string | null
  created_at: string
  enrollments_count: number
  members_area_enabled: boolean
}

async function getTeacherCourses(teacherId: string): Promise<CourseWithStats[]> {
  const supabase = await createClient()
  
  const { data: courses, error } = await supabase
    .from('courses')
    .select(`
      id,
      title,
      slug,
      status,
      price,
      thumbnail_url,
      created_at,
      members_area_enabled,
      enrollments:enrollments(count)
    `)
    .eq('teacher_id', teacherId)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching courses:', error)
    return []
  }
  
  return (courses || []).map(course => ({
    ...course,
    members_area_enabled: course.members_area_enabled || false,
    enrollments_count: (course.enrollments as unknown as [{ count: number }])?.[0]?.count || 0,
  }))
}

function getStatusBadge(status: CourseStatus) {
  const variants: Record<CourseStatus, { variant: 'default' | 'success' | 'warning' | 'error'; label: string }> = {
    draft: { variant: 'default', label: 'Rascunho' },
    published: { variant: 'success', label: 'Publicado' },
    archived: { variant: 'error', label: 'Arquivado' },
  }
  
  const { variant, label } = variants[status]
  return <Badge variant={variant}>{label}</Badge>
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(price)
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export default async function TeacherCoursesPage() {
  const session = await requireRole(['teacher', 'admin'])
  const courses = await getTeacherCourses(session.profile!.id)
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-gray-900">Meus Cursos</h1>
          <p className="text-sm text-brand-gray-500 mt-1">
            Gerencie seus cursos, módulos e aulas
          </p>
        </div>
        <Link href="/teacher/courses/new">
          <Button>
            <Plus size={18} />
            Criar Novo Curso
          </Button>
        </Link>
      </div>
      
      {/* Courses List */}
      {courses.length === 0 ? (
        <EmptyState
          iconName="Plus"
          title="Nenhum curso criado"
          description="Comece criando seu primeiro curso para compartilhar seu conhecimento com os alunos."
          action={
            <Link href="/teacher/courses/new">
              <Button>
                <Plus size={18} />
                Criar Novo Curso
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="bg-white rounded-xl border border-brand-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-brand-gray-50 border-b border-brand-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-brand-gray-700 uppercase tracking-wider">
                    Curso
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-brand-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-brand-gray-700 uppercase tracking-wider">
                    Preço
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-brand-gray-700 uppercase tracking-wider">
                    Alunos
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-brand-gray-700 uppercase tracking-wider">
                    Criado em
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-brand-gray-700 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-gray-100">
                {courses.map((course) => (
                  <tr key={course.id} className="hover:bg-brand-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="relative h-12 w-16 rounded-lg overflow-hidden bg-brand-gray-100 flex-shrink-0">
                          {course.thumbnail_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={course.thumbnail_url}
                              alt={course.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-brand-gray-400">
                              <span className="text-xs">Sem imagem</span>
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="font-medium text-brand-gray-900 line-clamp-1">
                            {course.title}
                          </h3>
                          <p className="text-xs text-brand-gray-500">/{course.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(course.status)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-brand-gray-700">
                        {formatPrice(course.price)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-brand-gray-700">
                        <Users size={14} className="text-brand-gray-400" />
                        {course.enrollments_count}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-brand-gray-500">
                        {formatDate(course.created_at)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/teacher/courses/${course.id}/members-area`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Configurar Área de Membros"
                            className={course.members_area_enabled ? 'text-green-600 hover:text-green-700' : 'text-brand-gray-400 hover:text-brand-orange'}
                          >
                            <LayoutDashboard size={16} />
                            <span className="sr-only">Configurar Área de Membros</span>
                          </Button>
                        </Link>
                        <Link href={`/teacher/courses/${course.id}/edit`}>
                          <Button variant="ghost" size="sm">
                            <Edit2 size={16} />
                            <span className="sr-only">Editar</span>
                          </Button>
                        </Link>
                        
                        <form
                          action={async () => {
                            'use server'
                            if (course.status === 'published') {
                              await unpublishCourseAction(course.id)
                            } else {
                              await publishCourseAction(course.id)
                            }
                          }}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            type="submit"
                            className={course.status === 'published' ? 'text-yellow-600 hover:text-yellow-700' : 'text-green-600 hover:text-green-700'}
                          >
                            {course.status === 'published' ? (
                              <><EyeOff size={16} /><span className="sr-only">Despublicar</span></>
                            ) : (
                              <><Eye size={16} /><span className="sr-only">Publicar</span></>
                            )}
                          </Button>
                        </form>
                        
                        <form 
                          action={async () => {
                            'use server'
                            await deleteCourseAction(course.id)
                          }}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            type="submit"
                            className="text-red-600 hover:text-red-700"
                            disabled={course.status !== 'draft'}
                            title={course.status !== 'draft' ? 'Apenas cursos em rascunho podem ser excluídos' : ''}
                            onClick={(e) => {
                              if (!confirm('Tem certeza que deseja excluir este curso?')) {
                                e.preventDefault()
                              }
                            }}
                          >
                            <Trash2 size={16} />
                            <span className="sr-only">Excluir</span>
                          </Button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
