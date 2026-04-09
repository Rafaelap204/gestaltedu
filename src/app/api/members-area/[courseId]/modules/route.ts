import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/utils/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params
    const session = await requireRole(['teacher', 'admin'])
    const supabase = await createClient()

    // Verify ownership
    const { data: course } = await supabase
      .from('courses')
      .select('teacher_id')
      .eq('id', courseId)
      .single()

    if (!course) {
      return NextResponse.json({ error: 'Curso não encontrado' }, { status: 404 })
    }

    const isAdmin = session.profile?.role === 'admin'
    const isOwner = course.teacher_id === session.profile?.id

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    // Get modules with lessons
    const { data: modules, error } = await supabase
      .from('modules')
      .select(`
        id,
        title,
        description,
        icon,
        order,
        created_at,
        lessons (
          id,
          title,
          video_url,
          video_provider,
          materials,
          duration_seconds,
          order,
          created_at
        )
      `)
      .eq('course_id', courseId)
      .order('order', { ascending: true })

    if (error) {
      return NextResponse.json({ error: 'Erro ao buscar módulos' }, { status: 500 })
    }

    // Sort lessons within each module
    const sortedModules = (modules || []).map(mod => ({
      ...mod,
      lessons: (mod.lessons || []).sort((a: { order: number }, b: { order: number }) => a.order - b.order),
    }))

    return NextResponse.json({ modules: sortedModules })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
