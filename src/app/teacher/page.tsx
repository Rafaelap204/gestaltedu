import Link from 'next/link'
import { redirect } from 'next/navigation'
import { 
  ShoppingCart, 
  Wallet, 
  Users, 
  BookOpen, 
  Plus, 
  BarChart3, 
  DollarSign,
  ArrowRight
} from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { getSession } from '@/lib/utils/auth'
import { getTeacherDashboardStats } from '@/lib/queries/teacher'
import { formatPrice, formatDate } from '@/lib/utils/format'

export default async function TeacherDashboardPage() {
  const session = await getSession()
  
  if (!session?.profile) {
    redirect('/login')
  }

  // Check if user is teacher or admin
  if (session.profile.role !== 'teacher' && session.profile.role !== 'admin') {
    redirect('/app')
  }

  const stats = await getTeacherDashboardStats(session.profile.id)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-brand-gray-900">Dashboard do Professor</h1>
        <p className="text-sm text-brand-gray-500 mt-1">
          Acompanhe seus cursos, alunos e ganhos
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-brand-gray-500">
              <ShoppingCart size={18} />
              <span className="text-sm font-medium">Total Vendas</span>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-brand-gray-900">{stats.totalSales}</p>
            <p className="text-xs text-brand-gray-400 mt-1">vendas realizadas</p>
          </CardContent>
        </Card>

        {/* Total Revenue */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-brand-gray-500">
              <Wallet size={18} />
              <span className="text-sm font-medium">Receita Total</span>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-brand-gray-900">{formatPrice(stats.totalRevenue)}</p>
            <p className="text-xs text-brand-gray-400 mt-1">em vendas</p>
          </CardContent>
        </Card>

        {/* Active Students */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-brand-gray-500">
              <Users size={18} />
              <span className="text-sm font-medium">Alunos Ativos</span>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-brand-gray-900">{stats.activeStudents}</p>
            <p className="text-xs text-brand-gray-400 mt-1">matriculados</p>
          </CardContent>
        </Card>

        {/* Published Courses */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-brand-gray-500">
              <BookOpen size={18} />
              <span className="text-sm font-medium">Cursos Publicados</span>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-brand-gray-900">{stats.publishedCourses}</p>
            <p className="text-xs text-brand-gray-400 mt-1">no ar</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Link href="/teacher/courses/new">
          <Button>
            <Plus size={18} />
            Criar Curso
          </Button>
        </Link>
        <Link href="/teacher/metrics">
          <Button variant="outline">
            <BarChart3 size={18} />
            Ver Métricas
          </Button>
        </Link>
        <Link href="/teacher/finance">
          <Button variant="outline">
            <DollarSign size={18} />
            Financeiro
          </Button>
        </Link>
      </div>

      {/* Recent Sales Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-brand-gray-900">Vendas Recentes</h3>
            <Link href="/teacher/metrics" className="text-sm text-brand-orange hover:text-brand-orange-hover flex items-center gap-1">
              Ver todas
              <ArrowRight size={14} />
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {stats.recentSales.length === 0 ? (
            <div className="text-center py-8 text-brand-gray-400">
              <ShoppingCart size={48} className="mx-auto mb-3 opacity-50" />
              <p>Nenhuma venda ainda</p>
              <p className="text-sm mt-1">As vendas aparecerão aqui quando seus cursos forem comprados</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-brand-gray-100">
                    <th className="text-left py-3 px-4 text-sm font-medium text-brand-gray-500">Curso</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-brand-gray-500">Aluno</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-brand-gray-500">Valor</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-brand-gray-500">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentSales.map((sale, index) => (
                    <tr 
                      key={sale.id} 
                      className={index % 2 === 0 ? 'bg-white' : 'bg-brand-gray-50/50'}
                    >
                      <td className="py-3 px-4 text-sm text-brand-gray-900">{sale.courseName}</td>
                      <td className="py-3 px-4 text-sm text-brand-gray-600">{sale.studentName}</td>
                      <td className="py-3 px-4 text-sm font-medium text-brand-gray-900">{formatPrice(sale.amount)}</td>
                      <td className="py-3 px-4 text-sm text-brand-gray-500">{formatDate(sale.date)}</td>
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
