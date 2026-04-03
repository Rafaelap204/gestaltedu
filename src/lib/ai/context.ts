import { createClient } from '@/lib/supabase/server'

interface EnrollmentWithCourse {
  course: { title: string } | null
}

interface OrderWithCourse {
  status: string
  course: { title: string } | null
}

export async function buildUserContext(userId: string): Promise<string> {
  const supabase = await createClient()
  
  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, name')
    .eq('id', userId)
    .single()
  
  // Fetch user's enrolled courses with course titles
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select(`
      course:courses(title)
    `)
    .eq('student_id', userId)
    .eq('status', 'active')
  
  // Fetch recent orders with course info
  const { data: orders } = await supabase
    .from('orders')
    .select(`
      status,
      course:courses(title)
    `)
    .eq('buyer_id', userId)
    .order('created_at', { ascending: false })
    .limit(5)
  
  const role = profile?.role || 'student'
  const name = profile?.name || 'Usuário'
  
  const typedEnrollments = enrollments as EnrollmentWithCourse[] | null
  const typedOrders = orders as OrderWithCourse[] | null
  
  const courses = typedEnrollments
    ?.filter((e) => e.course !== null)
    ?.map((e) => e.course!.title) || []
  
  const recentOrders = typedOrders
    ?.filter((o) => o.course !== null)
    ?.map((o) => ({
      courseTitle: o.course!.title,
      status: o.status
    })) || []
  
  // Build context string
  const contextParts: string[] = []
  
  contextParts.push(`Nome: ${name}`)
  contextParts.push(`Tipo de usuário: ${role === 'admin' ? 'Administrador' : role === 'teacher' ? 'Professor' : 'Aluno'}`)
  
  if (courses.length > 0) {
    contextParts.push(`Cursos matriculados: ${courses.join(', ')}`)
  } else {
    contextParts.push('Cursos matriculados: Nenhum')
  }
  
  if (recentOrders.length > 0) {
    const orderSummary = recentOrders
      .map(o => `${o.courseTitle} (${translateStatus(o.status)})`)
      .join(', ')
    contextParts.push(`Pedidos recentes: ${orderSummary}`)
  }
  
  return contextParts.join(' | ')
}

function translateStatus(status: string): string {
  const translations: Record<string, string> = {
    'pending': 'pendente',
    'paid': 'pago',
    'cancelled': 'cancelado',
    'refunded': 'reembolsado'
  }
  return translations[status] || status
}
