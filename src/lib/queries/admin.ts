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
  
  // Sales this month
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const { data: monthSalesData } = await supabase
    .from('orders')
    .select('amount')
    .eq('status', 'paid')
    .gte('created_at', firstDayOfMonth.toISOString())
  
  const salesThisMonth = monthSalesData?.reduce((sum, order) => sum + (order.amount || 0), 0) || 0
  
  // Total users by role
  const { data: usersByRole } = await supabase
    .from('profiles')
    .select('role')
  
  const roleCounts = { student: 0, teacher: 0, admin: 0, total: 0 }
  usersByRole?.forEach((user: any) => {
    roleCounts.total++
    if (user.role in roleCounts) {
      roleCounts[user.role as keyof typeof roleCounts]++
    }
  })
  
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
  
  // Quick stats
  const { count: pendingWithdraws } = await supabase
    .from('withdraw_requests')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')
  
  const { count: draftCourses } = await supabase
    .from('courses')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'draft')
  
  return {
    gmv,
    salesToday,
    ordersToday,
    salesThisMonth,
    totalUsers: roleCounts.total,
    usersByRole: roleCounts,
    totalEnrollments: totalEnrollments || 0,
    top5Courses,
    recentSales: recentSales || [],
    quickStats: {
      pendingWithdraws: pendingWithdraws || 0,
      draftCourses: draftCourses || 0
    }
  }
}

// ============================================================================
// COURSES
// ============================================================================

export async function getAdminCourses(filters?: { status?: string; search?: string }) {
  await requireRole('admin')
  const supabase = await createClient()
  
  // Primeiro, obter IDs dos usuários com role 'admin'
  const { data: adminProfiles } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'admin')
  
  const adminIds = adminProfiles?.map((p: any) => p.id) || []
  
  let query = supabase
    .from('courses')
    .select(`
      *,
      profiles:teacher_id (name),
      enrollments:enrollments(count)
    `)
    .in('teacher_id', adminIds) // Filtrar apenas cursos criados por admins
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
      profiles:user_id (name),
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
      profiles:teacher_id (name)
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

export async function getAdminMetrics(period: '7' | '30' | '90' | 'all' = '30') {
  await requireRole('admin')
  const supabase = await createClient()
  
  // Calculate date range
  const now = new Date()
  let startDate: Date | null = null
  
  if (period !== 'all') {
    startDate = new Date(now.getTime() - parseInt(period) * 24 * 60 * 60 * 1000)
  }
  
  // Revenue by day (last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  
  let revenueQuery = supabase
    .from('orders')
    .select('amount, created_at')
    .eq('status', 'paid')
    .gte('created_at', thirtyDaysAgo.toISOString())
  
  const { data: dailyRevenue } = await revenueQuery
  
  const revenueByDay: Record<string, number> = {}
  dailyRevenue?.forEach((order: any) => {
    const date = new Date(order.created_at).toISOString().split('T')[0]
    revenueByDay[date] = (revenueByDay[date] || 0) + (order.amount || 0)
  })
  
  // Conversion stats
  let ordersQuery = supabase.from('orders').select('*', { count: 'exact', head: true })
  let paidQuery = supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'paid')
  
  if (startDate) {
    ordersQuery = ordersQuery.gte('created_at', startDate.toISOString())
    paidQuery = paidQuery.gte('created_at', startDate.toISOString())
  }
  
  const { count: totalCheckouts } = await ordersQuery
  const { count: confirmedPayments } = await paidQuery
  
  // Revenue by payment method
  let paymentsQuery = supabase
    .from('payments')
    .select('method, amount, orders!inner(status)')
    .eq('orders.status', 'paid')
  
  if (startDate) {
    paymentsQuery = paymentsQuery.gte('created_at', startDate.toISOString())
  }
  
  const { data: payments } = await paymentsQuery
  
  const revenueByMethod = { pix: 0, credit_card: 0, boleto: 0 }
  payments?.forEach((payment: any) => {
    if (payment.method in revenueByMethod) {
      revenueByMethod[payment.method as keyof typeof revenueByMethod] += payment.amount || 0
    }
  })
  
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
  
  // Monthly comparison
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  
  const { data: lastMonthRevenue } = await supabase
    .from('orders')
    .select('amount')
    .eq('status', 'paid')
    .gte('created_at', lastMonth.toISOString())
    .lt('created_at', thisMonth.toISOString())
  
  const { data: thisMonthRevenue } = await supabase
    .from('orders')
    .select('amount')
    .eq('status', 'paid')
    .gte('created_at', thisMonth.toISOString())
  
  const lastMonthTotal = lastMonthRevenue?.reduce((sum, o) => sum + (o.amount || 0), 0) || 0
  const thisMonthTotal = thisMonthRevenue?.reduce((sum, o) => sum + (o.amount || 0), 0) || 0
  
  const monthlyGrowth = lastMonthTotal > 0 
    ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal * 100).toFixed(1)
    : '0'
  
  return {
    revenueByDay,
    revenueByMethod,
    conversionStats: {
      visits: 0, // Placeholder - requires analytics integration
      checkouts: totalCheckouts || 0,
      confirmedPayments: confirmedPayments || 0,
      conversionRate: totalCheckouts ? ((confirmedPayments || 0) / totalCheckouts * 100).toFixed(2) : 0
    },
    topCourses: topCoursesWithStats || [],
    monthlyComparison: {
      lastMonth: lastMonthTotal,
      thisMonth: thisMonthTotal,
      growth: parseFloat(monthlyGrowth)
    }
  }
}

// ============================================================================
// DETAILED USER STATS
// ============================================================================

export async function getDetailedUserStats() {
  await requireRole('admin')
  const supabase = await createClient()
  
  // Users by role
  const { data: usersByRole } = await supabase
    .from('profiles')
    .select('role')
  
  const roleCounts = { student: 0, teacher: 0, admin: 0 }
  usersByRole?.forEach((user: any) => {
    if (user.role in roleCounts) {
      roleCounts[user.role as keyof typeof roleCounts]++
    }
  })
  
  // New users by period
  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
  
  const { count: newUsers7Days } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', sevenDaysAgo.toISOString())
  
  const { count: newUsers30Days } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', thirtyDaysAgo.toISOString())
  
  const { count: newUsers90Days } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', ninetyDaysAgo.toISOString())
  
  // Recent users
  const { data: recentUsers } = await supabase
    .from('profiles')
    .select(`
      id,
      name,
      role,
      created_at,
      auth_users:user_id(email)
    `)
    .order('created_at', { ascending: false })
    .limit(5)
  
  return {
    total: usersByRole?.length || 0,
    byRole: roleCounts,
    newUsers: {
      last7Days: newUsers7Days || 0,
      last30Days: newUsers30Days || 0,
      last90Days: newUsers90Days || 0
    },
    recentUsers: recentUsers || []
  }
}

// ============================================================================
// DETAILED COURSE STATS
// ============================================================================

export async function getDetailedCourseStats() {
  await requireRole('admin')
  const supabase = await createClient()
  
  // Courses by status
  const { data: coursesByStatus } = await supabase
    .from('courses')
    .select('status')
  
  const statusCounts = { draft: 0, published: 0, archived: 0 }
  coursesByStatus?.forEach((course: any) => {
    if (course.status in statusCounts) {
      statusCounts[course.status as keyof typeof statusCounts]++
    }
  })
  
  // Total modules and lessons
  const { count: totalModules } = await supabase
    .from('modules')
    .select('*', { count: 'exact', head: true })
  
  const { count: totalLessons } = await supabase
    .from('lessons')
    .select('*', { count: 'exact', head: true })
  
  // Courses without sales
  const { data: allCourses } = await supabase
    .from('courses')
    .select('id, title, status')
  
  const { data: coursesWithSales } = await supabase
    .from('orders')
    .select('course_id')
    .eq('status', 'paid')
  
  const coursesWithSalesIds = new Set(coursesWithSales?.map((o: any) => o.course_id))
  const coursesWithoutSales = allCourses?.filter((c: any) => !coursesWithSalesIds.has(c.id)) || []
  
  return {
    total: coursesByStatus?.length || 0,
    byStatus: statusCounts,
    totalModules: totalModules || 0,
    totalLessons: totalLessons || 0,
    coursesWithoutSales: coursesWithoutSales.length,
    coursesWithoutSalesList: coursesWithoutSales.slice(0, 5)
  }
}

// ============================================================================
// DETAILED FINANCIAL STATS
// ============================================================================

export async function getDetailedFinancialStats(period: 'today' | 'week' | 'month' | 'all' = 'all') {
  await requireRole('admin')
  const supabase = await createClient()
  
  const now = new Date()
  let startDate: Date | null = null
  
  switch (period) {
    case 'today':
      startDate = new Date(now.setHours(0, 0, 0, 0))
      break
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case 'month':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      break
    default:
      startDate = null
  }
  
  // Base query for orders
  let ordersQuery = supabase.from('orders').select('*')
  if (startDate) {
    ordersQuery = ordersQuery.gte('created_at', startDate.toISOString())
  }
  
  const { data: allOrders } = await ordersQuery
  
  // Revenue by status
  const revenueByStatus = {
    paid: 0,
    pending: 0,
    cancelled: 0,
    refunded: 0
  }
  
  allOrders?.forEach((order: any) => {
    if (order.status in revenueByStatus) {
      revenueByStatus[order.status as keyof typeof revenueByStatus] += order.amount || 0
    }
  })
  
  // Revenue by payment method
  let paymentsQuery = supabase
    .from('payments')
    .select('method, amount, orders!inner(status)')
    .eq('orders.status', 'paid')
  
  if (startDate) {
    paymentsQuery = paymentsQuery.gte('created_at', startDate.toISOString())
  }
  
  const { data: payments } = await paymentsQuery
  
  const revenueByMethod = { pix: 0, credit_card: 0, boleto: 0 }
  payments?.forEach((payment: any) => {
    if (payment.method in revenueByMethod) {
      revenueByMethod[payment.method as keyof typeof revenueByMethod] += payment.amount || 0
    }
  })
  
  // Average ticket
  const paidOrders = allOrders?.filter((o: any) => o.status === 'paid') || []
  const averageTicket = paidOrders.length > 0
    ? paidOrders.reduce((sum: number, o: any) => sum + (o.amount || 0), 0) / paidOrders.length
    : 0
  
  // Affiliate commissions
  let commissionsQuery = supabase
    .from('referral_commissions')
    .select('amount, status')
  
  if (startDate) {
    commissionsQuery = commissionsQuery.gte('created_at', startDate.toISOString())
  }
  
  const { data: commissions } = await commissionsQuery
  
  const commissionStats = {
    total: 0,
    paid: 0,
    pending: 0
  }
  
  commissions?.forEach((commission: any) => {
    commissionStats.total += commission.amount || 0
    if (commission.status === 'paid') {
      commissionStats.paid += commission.amount || 0
    } else {
      commissionStats.pending += commission.amount || 0
    }
  })
  
  return {
    totalRevenue: revenueByStatus.paid,
    revenueByStatus,
    revenueByMethod,
    totalTransactions: allOrders?.length || 0,
    averageTicket,
    commissionStats,
    paidOrdersCount: paidOrders.length
  }
}

// ============================================================================
// ENGAGEMENT STATS
// ============================================================================

export async function getEngagementStats() {
  await requireRole('admin')
  const supabase = await createClient()
  
  // Enrollments by status
  const { data: enrollmentsByStatus } = await supabase
    .from('enrollments')
    .select('status')
  
  const enrollmentCounts = { active: 0, completed: 0, cancelled: 0 }
  enrollmentsByStatus?.forEach((e: any) => {
    if (e.status in enrollmentCounts) {
      enrollmentCounts[e.status as keyof typeof enrollmentCounts]++
    }
  })
  
  // Average progress
  const { data: progressData } = await supabase
    .from('lesson_progress')
    .select('progress_pct')
  
  const avgProgress = progressData && progressData.length > 0
    ? progressData.reduce((sum: number, p: any) => sum + (p.progress_pct || 0), 0) / progressData.length
    : 0
  
  // Completion rate
  const { count: totalProgress } = await supabase
    .from('lesson_progress')
    .select('*', { count: 'exact', head: true })
  
  const { count: completedProgress } = await supabase
    .from('lesson_progress')
    .select('*', { count: 'exact', head: true })
    .eq('completed', true)
  
  const completionRate = totalProgress && totalProgress > 0
    ? ((completedProgress || 0) / totalProgress) * 100
    : 0
  
  return {
    enrollments: enrollmentCounts,
    averageProgress: Math.round(avgProgress),
    completionRate: Math.round(completionRate),
    totalEnrollments: enrollmentsByStatus?.length || 0
  }
}

// ============================================================================
// REFERRAL STATS
// ============================================================================

export async function getReferralStats() {
  await requireRole('admin')
  const supabase = await createClient()
  
  // Total referral codes
  const { count: totalCodes } = await supabase
    .from('referral_codes')
    .select('*', { count: 'exact', head: true })
  
  // Total clicks
  const { count: totalClicks } = await supabase
    .from('referral_clicks')
    .select('*', { count: 'exact', head: true })
  
  // Commissions
  const { data: commissions } = await supabase
    .from('referral_commissions')
    .select('amount, status')
  
  const commissionStats = {
    total: 0,
    paid: 0,
    pending: 0
  }
  
  commissions?.forEach((commission: any) => {
    commissionStats.total += commission.amount || 0
    if (commission.status === 'paid') {
      commissionStats.paid += commission.amount || 0
    } else {
      commissionStats.pending += commission.amount || 0
    }
  })
  
  // Top affiliates
  const { data: topAffiliates } = await supabase
    .from('referral_codes')
    .select(`
      code,
      owner_user_id,
      profiles:owner_user_id(name),
      referral_commissions(amount, status)
    `)
    .limit(5)
  
  const affiliatesWithRevenue = topAffiliates?.map((affiliate: any) => {
    const totalRevenue = affiliate.referral_commissions
      ?.reduce((sum: number, c: any) => sum + (c.amount || 0), 0) || 0
    return {
      code: affiliate.code,
      name: affiliate.profiles?.name || 'Desconhecido',
      revenue: totalRevenue
    }
  }).sort((a: any, b: any) => b.revenue - a.revenue)
  
  return {
    totalCodes: totalCodes || 0,
    totalClicks: totalClicks || 0,
    commissionStats,
    topAffiliates: affiliatesWithRevenue || []
  }
}

// ============================================================================
// SYSTEM HEALTH STATS
// ============================================================================

export async function getSystemHealthStats() {
  await requireRole('admin')
  const supabase = await createClient()
  
  // Webhook events
  const { count: totalWebhooks } = await supabase
    .from('webhook_events')
    .select('*', { count: 'exact', head: true })
  
  const { count: pendingWebhooks } = await supabase
    .from('webhook_events')
    .select('*', { count: 'exact', head: true })
    .is('processed_at', null)
  
  // Pending withdraw requests
  const { count: pendingWithdraws } = await supabase
    .from('withdraw_requests')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')
  
  // Draft courses
  const { count: draftCourses } = await supabase
    .from('courses')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'draft')
  
  return {
    webhooks: {
      total: totalWebhooks || 0,
      pending: pendingWebhooks || 0
    },
    pendingWithdraws: pendingWithdraws || 0,
    draftCourses: draftCourses || 0
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

// ============================================================================
// GET ADMIN COURSE BY ID
// ============================================================================

export async function getAdminCourseById(courseId: string) {
  await requireRole('admin')
  const supabase = await createClient()
  
  const { data: course, error } = await supabase
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .single()
  
  if (error) throw error
  
  // Verificar se pertence a admin
  const { data: adminProfiles } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'admin')
  
  const adminIds = adminProfiles?.map((p: any) => p.id) || []
  
  if (!adminIds.includes(course.teacher_id)) {
    throw new Error('Este curso não pertence a um administrador')
  }
  
  return course
}
