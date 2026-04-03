import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/utils/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const session = await requireRole(['teacher', 'admin'])
    const { courseId } = await params
    const supabase = await createClient()
    
    // Fetch course with ownership check
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single()
    
    if (courseError || !course) {
      return NextResponse.json(
        { error: 'Curso não encontrado' },
        { status: 404 }
      )
    }
    
    // Check ownership
    const isAdmin = session.profile?.role === 'admin'
    const isOwner = course.teacher_id === session.profile?.id
    
    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }
    
    // Fetch modules with lessons
    const { data: modules, error: modulesError } = await supabase
      .from('modules')
      .select(`
        *,
        lessons:lessons(*)
      `)
      .eq('course_id', courseId)
      .order('order', { ascending: true })
    
    if (modulesError) {
      console.error('Error fetching modules:', modulesError)
    }
    
    // Sort lessons within each module
    const modulesWithSortedLessons = (modules || []).map(module => ({
      ...module,
      lessons: (module.lessons || []).sort((a: { order: number }, b: { order: number }) => a.order - b.order),
    }))
    
    return NextResponse.json({
      course,
      modules: modulesWithSortedLessons,
    })
  } catch (error) {
    console.error('Error in GET /api/courses/[courseId]:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
