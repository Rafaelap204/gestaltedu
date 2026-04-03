import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/utils/auth'

// ============================================================================
// DASHBOARD STATS
// ============================================================================

export async function getAdminDashboardStats() {
  await requireRole('admin')
  const supabase = await createClient()
  
  // GMV (total paid orders amount)
  const { data: gmvData } = await supabase
    .from('orders')
    .select('amount')
    .eq('status', 'paid')
  
  const gmv = gmvData?.reduce((sum, order) => sum + (order.amount || 0), 0) || 0
  
  // Sales today
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const { data: todaySalesData } = await supabase
    .from('orders')
    .select('amount')
    .eq('status', 'paid')
    .gte('created_at', today.toISOString())
  
  const salesToday = todaySalesData?.reduce((sum, order) => sum + (order.amount || 0), 0) || 0
  const ordersToday = todaySalesData?.length || 0
  
  // Total users
  const { count: totalUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
  
  // Total enrollments
  const { count: totalEnrollments } = await supabase
    .from('enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
  
  // Top 5 courses by revenue
  const { data: topCourses } = await supabase
    .from('orders')
    .select(`
      course_id,
      amount,
      courses:course_id (title)
    `)
    .eq('status', 'paid')
    .limit(100)
  
  const courseRevenue: Record<string, { title: string; revenue: number; orders: number }> = {}
  
  topCourses?.forEach((order: any) => {
    const courseId = order.course_id
    const courseTitle = order.courses?.title || 'Curso Desconhecido'
    
    if (!courseRevenue[courseId]) {
      courseRevenue[courseId] = { title: courseTitle, revenue: 0, orders: 0 }
    }
    courseRevenue[courseId].revenue += order.amount || 0
    courseRevenue[courseId].orders += 1
  })
  
  const top5Courses = Object.entries(courseRevenue)
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)
  
  // Recent sales (last 10 orders)
  const { data: recentSales } = await supabase
    .from('orders')
    .select(`
      id,
      amount,
      status,
      created_at,
      profiles:user_id (name),
      courses:course_id (title)
    `)
    .order('created_at', { ascending: false })
    .limit(10)
  
  return {
    gmv,
    salesToday,
    ordersToday,
    totalUsers: totalUsers || 0,
    totalEnrollments: totalEnrollments || 0,
    top5Courses,
    recentSales: recentSales || []
  }
}

// ============================================================================
// COURSES
// ============================================================================

export async function getAdminCourses(filters?: { status?: string; search?: string }) {
  await requireRole('admin')
  const supabase = await createClient()
  
  let query = supabase
    .from('courses')
    .select(`
      *,
      profiles:teacher_id (name, email),
      enrollments:enrollments(count)
    `)
    .order('created_at', { ascending: false })
  
  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }
  
  if (filters?.search) {
    query = query.ilike('title', `%${filters.search}%`)
  }
  
  const { data: courses, error } = await query
  
  if (error) throw error
  
  return courses || []
}

// ============================================================================
// USERS
// ============================================================================

export async function getAdminUsers(filters?: { role?: string; search?: string }) {
  await requireRole('admin')
  const supabase = await createClient()
  
  let query = supabase
    .from('profiles')
    .select(`
      *,
      auth_users!inner(user_id:id, email)
    `)
    .order('created_at', { ascending: false })
  
  if (filters?.role && filters.role !== 'all') {
    query = query.eq('role', filters.role)
  }
  
  if (filters?.search) {
    query = query.ilike('name', `%${filters.search}%`)
  }
  
  const { data: users, error } = await query
  
  if (error) {
    // Fallback without auth_users join
    let fallbackQuery = supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (filters?.role && filters.role !== 'all') {
      fallbackQuery = fallbackQuery.eq('role', filters.role)
    }
    
    if (filters?.search) {
      fallbackQuery = fallbackQuery.ilike('name', `%${filters.search}%`)
    }
    
    const { data: fallbackUsers, error: fallbackError } = await fallbackQuery
    
    if (fallbackError) throw fallbackError
    return fallbackUsers || []
  }
  
  return users || []
}

// ============================================================================
// ENROLLMENTS
// ============================================================================

export async function getAdminEnrollments(filters?: { courseId?: string; userId?: string; status?: string }) {
  await requireRole('admin')
  const supabase = await createClient()
  
  let query = supabase
    .from('enrollments')
    .select(`
      *,
      profiles:user_id (name, email),
      courses:course_id (title)
    `)
    .order('created_at', { ascending: false })
  
  if (filters?.courseId && filters.courseId !== 'all') {
    query = query.eq('course_id', filters.courseId)
  }
  
  if (filters?.userId) {
    query = query.eq('user_id', filters.userId)
  }
  
  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }
  
  const { data: enrollments, error } = await query
  
  if (error) throw error
  
  return enrollments || []
}

// ============================================================================
// FINANCIAL
// ============================================================================

export async function getAdminFinancialSummary() {
  await requireRole('admin')
  const supabase = await createClient()
  
  // Total GMV
  const { data: gmvData } = await supabase
    .from('orders')
    .select('amount')
    .eq('status', 'paid')
  
  const totalGMV = gmvData?.reduce((sum, order) => sum + (order.amount || 0), 0) || 0
  
  // Platform revenue (from ledger_entries of type 'sale')
  const { data: platformRevenueData } = await supabase
    .from('ledger_entries')
    .select('amount')
    .eq('type', 'sale')
    .eq('status', 'completed')
  
  const platformRevenue = platformRevenueData?.reduce((sum, entry) => sum + (entry.amount || 0), 0) || 0
  
  // Pending payouts (withdraw requests)
  const { data: pendingPayoutsData } = await supabase
    .from('withdraw_requests')
    .select('amount')
    .eq('status', 'pending')
  
  const pendingPayouts = pendingPayoutsData?.reduce((sum, req) => sum + (req.amount || 0), 0) || 0
  
  // Failed webhooks
  const { count: failedWebhooks } = await supabase
    .from('webhook_events')
    .select('*', { count: 'exact', head: true })
    .is('processed_at', null)
  
  return {
    totalGMV,
    platformRevenue,
    pendingPayouts,
    failedWebhooks: failedWebhooks || 0
  }
}

export async function getAdminTransactions(filters?: { type?: string; status?: string }) {
  await requireRole('admin')
  const supabase = await createClient()
  
  let query = supabase
    .from('ledger_entries')
    .select(`
      *,
      profiles:user_id (name)
    `)
    .order('created_at', { ascending: false })
    .limit(100)
  
  if (filters?.type && filters.type !== 'all') {
    query = query.eq('type', filters.type)
  }
  
  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }
  
  const { data: transactions, error } = await query
  
  if (error) throw error
  
  return transactions || []
}

export async function getAdminWithdrawRequests(filters?: { status?: string }) {
  await requireRole('admin')
  const supabase = await createClient()
  
  let query = supabase
    .from('withdraw_requests')
    .select(`
      *,
      profiles:teacher_id (name, email)
    `)
    .order('created_at', { ascending: false })
  
  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }
  
  const { data: withdrawRequests, error } = await query
  
  if (error) throw error
  
  return withdrawRequests || []
}

// ============================================================================
// WEBHOOK EVENTS
// ============================================================================

export async function getWebhookEvents(filters?: { processed?: boolean }) {
  await requireRole('admin')
  const supabase = await createClient()
  
  let query = supabase
    .from('webhook_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)
  
  if (filters?.processed !== undefined) {
    if (filters.processed) {
      query = query.not('processed_at', 'is', null)
    } else {
      query = query.is('processed_at', null)
    }
  }
  
  const { data: events, error } = await query
  
  if (error) throw error
  
  return events || []
}

// ============================================================================
// PLATFORM SETTINGS
// ============================================================================

export async function getPlatformSettings() {
  await requireRole('admin')
  const supabase = await createClient()
  
  const { data: settings, error } = await supabase
    .from('platform_settings')
    .select('*')
  
  if (error) throw error
  
  // Convert to key-value object
  const settingsMap: Record<string, any> = {}
  settings?.forEach((setting) => {
    settingsMap[setting.key] = setting.value
  })
  
  return settingsMap
}

// ============================================================================
// PAYOUT RULES
// ============================================================================

export async function getPayoutRules() {
  await requireRole('admin')
  const supabase = await createClient()
  
  const { data: rules, error } = await supabase
    .from('payout_rules')
    .select(`
      *,
      courses:course_id (title),
      profiles:teacher_id (name)
    `)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  
  return rules || []
}

// ============================================================================
// METRICS
// ============================================================================

export async function getAdminMetrics() {
  await requireRole('admin')
  const supabase = await createClient()
  
  // Revenue by day (last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  
  const { data: dailyRevenue } = await supabase
    .from('orders')
    .select('amount, created_at')
    .eq('status', 'paid')
    .gte('created_at', thirtyDaysAgo.toISOString())
  
  const revenueByDay: Record<string, number> = {}
  dailyRevenue?.forEach((order: any) => {
    const date = new Date(order.created_at).toISOString().split('T')[0]
    revenueByDay[date] = (revenueByDay[date] || 0) + (order.amount || 0)
  })
  
  // Conversion stats
  const { count: totalCheckouts } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
  
  const { count: confirmedPayments } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'paid')
  
  // Top courses with enrollments and revenue
  const { data: courseStats } = await supabase
    .from('courses')
    .select(`
      id,
      title,
      profiles:teacher_id (name),
      enrollments:enrollments(count),
      orders:orders(amount, status)
    `)
    .eq('status', 'published')
    .limit(20)
  
  const topCoursesWithStats = courseStats?.map((course: any) => {
    const enrollments = course.enrollments?.[0]?.count || 0
    const revenue = course.orders
      ?.filter((o: any) => o.status === 'paid')
      ?.reduce((sum: number, o: any) => sum + (o.amount || 0), 0) || 0
    
    return {
      id: course.id,
      title: course.title,
      teacher: course.profiles?.name || 'Desconhecido',
      enrollments,
      revenue
    }
  }).sort((a: any, b: any) => b.revenue - a.revenue)
  
  return {
    revenueByDay,
    conversionStats: {
      visits: 0, // Placeholder
      checkouts: totalCheckouts || 0,
      confirmedPayments: confirmedPayments || 0,
      conversionRate: totalCheckouts ? ((confirmedPayments || 0) / totalCheckouts * 100).toFixed(2) : 0
    },
    topCourses: topCoursesWithStats || []
  }
}

// ============================================================================
// COURSES FOR FILTER DROPDOWN
// ============================================================================

export async function getCoursesForFilter() {
  await requireRole('admin')
  const supabase = await createClient()
  
  const { data: courses, error } = await supabase
    .from('courses')
    .select('id, title')
    .eq('status', 'published')
    .order('title')
  
  if (error) throw error
  
  return courses || []
}
