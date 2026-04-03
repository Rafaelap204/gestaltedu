import { redirect } from 'next/navigation'
import { TrendingUp, DollarSign, ShoppingCart, Target } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { getSession } from '@/lib/utils/auth'
import { getTeacherMetrics } from '@/lib/queries/teacher'
import { formatPrice } from '@/lib/utils/format'

export default async function TeacherMetricsPage() {
  const session = await getSession()
  
  if (!session?.profile) {
    redirect('/login')
  }

  // Check if user is teacher or admin
  if (session.profile.role !== 'teacher' && session.profile.role !== 'admin') {
    redirect('/app')
  }

  const metrics = await getTeacherMetrics(session.profile.id)

  // Calculate summary stats
  const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM
  const thisMonthSales = metrics.salesByPeriod.filter(s => s.date.startsWith(currentMonth))
  const totalRevenueThisMonth = thisMonthSales.reduce((sum, s) => sum + s.amount, 0)
  const totalSalesThisMonth = thisMonthSales.reduce((sum, s) => sum + s.count, 0)
  const avgTicket = totalSalesThisMonth > 0 ? totalRevenueThisMonth / totalSalesThisMonth : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-brand-gray-900">Métricas</h1>
        <p className="text-sm text-brand-gray-500 mt-1">
          Acompanhe o desempenho dos seus cursos
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-brand-gray-500">
              <DollarSign size={18} />
              <span className="text-sm font-medium">Receita Este Mês</span>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-brand-gray-900">{formatPrice(totalRevenueThisMonth)}</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-brand-gray-500">
              <ShoppingCart size={18} />
              <span className="text-sm font-medium">Vendas Este Mês</span>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-brand-gray-900">{totalSalesThisMonth}</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-brand-gray-500">
              <Target size={18} />
              <span className="text-sm font-medium">Ticket Médio</span>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-brand-gray-900">{formatPrice(avgTicket)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Sales by Course Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp size={20} className="text-brand-orange" />
            <h3 className="font-semibold text-brand-gray-900">Vendas por Curso</h3>
          </div>
        </CardHeader>
        <CardContent>
          {metrics.salesByCourse.length === 0 ? (
            <div className="text-center py-8 text-brand-gray-400">
              <TrendingUp size={48} className="mx-auto mb-3 opacity-50" />
              <p>Nenhum curso publicado ainda</p>
              <p className="text-sm mt-1">Crie seu primeiro curso para ver as métricas</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-brand-gray-100">
                    <th className="text-left py-3 px-4 text-sm font-medium text-brand-gray-500">Curso</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-brand-gray-500">Vendas</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-brand-gray-500">Receita</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-brand-gray-500">Matrículas</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-brand-gray-500">Conclusão</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.salesByCourse.map((course, index) => (
                    <tr 
                      key={course.courseId} 
                      className={index % 2 === 0 ? 'bg-white' : 'bg-brand-gray-50/50'}
                    >
                      <td className="py-3 px-4 text-sm text-brand-gray-900 font-medium">{course.courseTitle}</td>
                      <td className="py-3 px-4 text-sm text-brand-gray-600 text-center">{course.totalSales}</td>
                      <td className="py-3 px-4 text-sm text-brand-gray-900 font-medium text-center">{formatPrice(course.totalRevenue)}</td>
                      <td className="py-3 px-4 text-sm text-brand-gray-600 text-center">{course.enrollments}</td>
                      <td className="py-3 px-4 text-sm text-brand-gray-600 text-center">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          course.completionRate >= 70 
                            ? 'bg-green-100 text-green-700' 
                            : course.completionRate >= 40 
                              ? 'bg-yellow-100 text-yellow-700' 
                              : 'bg-red-100 text-red-700'
                        }`}>
                          {course.completionRate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sales by Period Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp size={20} className="text-brand-orange" />
            <h3 className="font-semibold text-brand-gray-900">Vendas por Período (Últimos 30 dias)</h3>
          </div>
        </CardHeader>
        <CardContent>
          {metrics.salesByPeriod.every(s => s.count === 0) ? (
            <div className="text-center py-8 text-brand-gray-400">
              <TrendingUp size={48} className="mx-auto mb-3 opacity-50" />
              <p>Nenhuma venda nos últimos 30 dias</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-brand-gray-100">
                    <th className="text-left py-3 px-4 text-sm font-medium text-brand-gray-500">Data</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-brand-gray-500">Vendas</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-brand-gray-500">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.salesByPeriod
                    .filter(s => s.count > 0)
                    .reverse()
                    .map((period, index) => (
                    <tr 
                      key={period.date} 
                      className={index % 2 === 0 ? 'bg-white' : 'bg-brand-gray-50/50'}
                    >
                      <td className="py-3 px-4 text-sm text-brand-gray-900">
                        {new Date(period.date).toLocaleDateString('pt-BR', { 
                          day: '2-digit', 
                          month: 'short', 
                          year: 'numeric' 
                        })}
                      </td>
                      <td className="py-3 px-4 text-sm text-brand-gray-600 text-center">{period.count}</td>
                      <td className="py-3 px-4 text-sm text-brand-gray-900 font-medium text-center">{formatPrice(period.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
