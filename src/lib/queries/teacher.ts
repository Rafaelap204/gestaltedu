import { createClient } from '@/lib/supabase/server'

export interface TeacherDashboardStats {
  totalSales: number
  totalRevenue: number
  activeStudents: number
  publishedCourses: number
  recentSales: Array<{
    id: string
    courseName: string
    studentName: string
    amount: number
    date: string
  }>
}

export async function getTeacherDashboardStats(teacherProfileId: string): Promise<TeacherDashboardStats> {
  const supabase = await createClient()

  // 1. Get published courses count
  const { data: courses, error: coursesError } = await supabase
    .from('courses')
    .select('id, title')
    .eq('teacher_id', teacherProfileId)
    .eq('status', 'published')

  if (coursesError) {
    console.error('Error fetching courses:', coursesError)
  }

  const publishedCourses = courses?.length || 0
  const courseIds = courses?.map(c => c.id) || []

  // 2. Get total sales (paid orders for teacher's courses)
  let totalSales = 0
  let totalRevenue = 0
  let recentSales: TeacherDashboardStats['recentSales'] = []

  if (courseIds.length > 0) {
    // Get paid orders for teacher's courses
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        id,
        amount,
        created_at,
        course_id,
        user_id,
        profiles!inner(name)
      `)
      .in('course_id', courseIds)
      .eq('status', 'paid')
      .order('created_at', { ascending: false })

    if (ordersError) {
      console.error('Error fetching orders:', ordersError)
    } else if (orders) {
      totalSales = orders.length
      
      // Map recent sales (last 10)
      recentSales = orders.slice(0, 10).map(order => {
        const course = courses?.find(c => c.id === order.course_id)
        const profile = order.profiles as any
        return {
          id: order.id,
          courseName: course?.title || 'Curso',
          studentName: profile?.name || 'Aluno',
          amount: Number(order.amount),
          date: order.created_at,
        }
      })
    }

    // Get total revenue from ledger entries (type=sale, status=cleared)
    const { data: ledgerEntries, error: ledgerError } = await supabase
      .from('ledger_entries')
      .select('amount')
      .eq('user_id', teacherProfileId)
      .eq('type', 'sale')
      .eq('status', 'cleared')

    if (ledgerError) {
      console.error('Error fetching ledger entries:', ledgerError)
    } else if (ledgerEntries) {
      totalRevenue = ledgerEntries.reduce((sum, entry) => sum + Number(entry.amount), 0)
    }
  }

  // 3. Get active students count (unique students with active enrollments in teacher's courses)
  let activeStudents = 0
  if (courseIds.length > 0) {
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('enrollments')
      .select('user_id')
      .in('course_id', courseIds)
      .eq('status', 'active')

    if (enrollmentsError) {
      console.error('Error fetching enrollments:', enrollmentsError)
    } else if (enrollments) {
      // Count unique students
      const uniqueStudents = new Set(enrollments.map(e => e.user_id))
      activeStudents = uniqueStudents.size
    }
  }

  return {
    totalSales,
    totalRevenue,
    activeStudents,
    publishedCourses,
    recentSales,
  }
}

export interface TeacherMetrics {
  salesByCourse: Array<{
    courseId: string
    courseTitle: string
    totalSales: number
    totalRevenue: number
    enrollments: number
    completionRate: number
  }>
  salesByPeriod: Array<{
    date: string
    count: number
    amount: number
  }>
}

export async function getTeacherMetrics(teacherProfileId: string): Promise<TeacherMetrics> {
  const supabase = await createClient()

  // 1. Get all teacher's courses
  const { data: courses, error: coursesError } = await supabase
    .from('courses')
    .select('id, title')
    .eq('teacher_id', teacherProfileId)

  if (coursesError) {
    console.error('Error fetching courses:', coursesError)
    return { salesByCourse: [], salesByPeriod: [] }
  }

  if (!courses || courses.length === 0) {
    return { salesByCourse: [], salesByPeriod: [] }
  }

  const courseIds = courses.map(c => c.id)

  // 2. Get sales by course
  const salesByCourse = await Promise.all(
    courses.map(async (course) => {
      // Get paid orders for this course
      const { data: orders } = await supabase
        .from('orders')
        .select('amount')
        .eq('course_id', course.id)
        .eq('status', 'paid')

      const totalSales = orders?.length || 0
      const totalRevenue = orders?.reduce((sum, o) => sum + Number(o.amount), 0) || 0

      // Get enrollments for this course
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('id, status')
        .eq('course_id', course.id)

      const totalEnrollments = enrollments?.length || 0
      const completedEnrollments = enrollments?.filter(e => e.status === 'completed').length || 0
      const completionRate = totalEnrollments > 0 
        ? Math.round((completedEnrollments / totalEnrollments) * 100) 
        : 0

      return {
        courseId: course.id,
        courseTitle: course.title,
        totalSales,
        totalRevenue,
        enrollments: totalEnrollments,
        completionRate,
      }
    })
  )

  // 3. Get sales by period (last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: periodOrders, error: periodError } = await supabase
    .from('orders')
    .select('amount, created_at')
    .in('course_id', courseIds)
    .eq('status', 'paid')
    .gte('created_at', thirtyDaysAgo.toISOString())
    .order('created_at', { ascending: true })

  if (periodError) {
    console.error('Error fetching period orders:', periodError)
  }

  // Group by date
  const salesByPeriodMap = new Map<string, { count: number; amount: number }>()
  
  // Initialize all 30 days with 0
  for (let i = 0; i < 30; i++) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    salesByPeriodMap.set(dateStr, { count: 0, amount: 0 })
  }

  // Fill with actual data
  periodOrders?.forEach(order => {
    const dateStr = order.created_at.split('T')[0]
    const current = salesByPeriodMap.get(dateStr) || { count: 0, amount: 0 }
    salesByPeriodMap.set(dateStr, {
      count: current.count + 1,
      amount: current.amount + Number(order.amount),
    })
  })

  // Convert to array and sort by date
  const salesByPeriod = Array.from(salesByPeriodMap.entries())
    .map(([date, data]) => ({
      date,
      count: data.count,
      amount: data.amount,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))

  return {
    salesByCourse,
    salesByPeriod,
  }
}
