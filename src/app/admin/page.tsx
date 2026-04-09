import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/admin/MetricCard";
import { StatsGrid } from "@/components/admin/StatsGrid";
import { ChartContainer } from "@/components/admin/ChartContainer";
import { 
  getAdminDashboardStats,
  getDetailedUserStats,
  getDetailedCourseStats,
  getDetailedFinancialStats,
  getEngagementStats,
  getSystemHealthStats
} from "@/lib/queries/admin";
import { 
  Clock,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  FileText,
  Users,
  DollarSign,
  BookOpen,
  TrendingUp
} from "lucide-react";

// Format currency to Brazilian Real
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

// Format date to Brazilian format
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Format number with Brazilian locale
function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value);
}

export default async function AdminDashboardPage() {
  const stats = await getAdminDashboardStats();
  const userStats = await getDetailedUserStats();
  const courseStats = await getDetailedCourseStats();
  const financialStats = await getDetailedFinancialStats('month');
  const engagementStats = await getEngagementStats();
  const systemHealth = await getSystemHealthStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-gray-900">Dashboard</h1>
          <p className="text-sm text-brand-gray-500 mt-1">
            Visão geral da plataforma e métricas principais
          </p>
        </div>
        <p className="text-sm text-brand-gray-400">
          Atualizado em {new Date().toLocaleString('pt-BR')}
        </p>
      </div>

      {/* Stats Grid - Principais Métricas */}
      <StatsGrid columns={4}>
        <MetricCard
          title="GMV Total"
          value={formatCurrency(stats.gmv)}
          iconName="DollarSign"
          trend={{ value: 12.5, isPositive: true, label: 'vs mês anterior' }}
        />
        <MetricCard
          title="Receita (30 dias)"
          value={formatCurrency(financialStats.totalRevenue)}
          iconName="ShoppingCart"
          subtitle={`${financialStats.paidOrdersCount} pedidos confirmados`}
        />
        <MetricCard
          title="Total de Usuários"
          value={formatNumber(userStats.total)}
          iconName="Users"
          trend={{ value: 8.2, isPositive: true, label: `+${userStats.newUsers.last30Days} novos` }}
        />
        <MetricCard
          title="Matrículas Ativas"
          value={formatNumber(engagementStats.enrollments.active)}
          iconName="BookOpen"
          subtitle={`${engagementStats.totalEnrollments} total`}
        />
      </StatsGrid>

      {/* Segunda Linha de Métricas */}
      <StatsGrid columns={5}>
        <MetricCard
          title="Alunos"
          value={formatNumber(userStats.byRole.student)}
          iconName="GraduationCap"
          variant="default"
        />
        <MetricCard
          title="Professores"
          value={formatNumber(userStats.byRole.teacher)}
          iconName="UserCheck"
          variant="default"
        />
        <MetricCard
          title="Cursos Publicados"
          value={formatNumber(courseStats.byStatus.published)}
          iconName="Layers"
          subtitle={`${courseStats.totalLessons} aulas`}
        />
        <MetricCard
          title="Ticket Médio"
          value={formatCurrency(financialStats.averageTicket)}
          iconName="TrendingUp"
          variant="success"
        />
        <MetricCard
          title="Taxa de Conclusão"
          value={`${engagementStats.completionRate}%`}
          iconName="CheckCircle"
          variant="success"
        />
      </StatsGrid>

      {/* Three Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top 5 Courses */}
        <ChartContainer title="Top 5 Cursos" badge="Por Receita" badgeVariant="info">
          {stats.top5Courses.length > 0 ? (
            <div className="space-y-4">
              {stats.top5Courses.map((course, index) => (
                <div key={course.id} className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-brand-gray-100 rounded-full text-sm font-semibold text-brand-gray-700">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-brand-gray-900 truncate">
                      {course.title}
                    </p>
                    <p className="text-xs text-brand-gray-500">
                      {course.orders} vendas
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-brand-gray-900">
                      {formatCurrency(course.revenue)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-brand-gray-500">
              Nenhuma venda registrada ainda
            </div>
          )}
        </ChartContainer>

        {/* Recent Sales */}
        <ChartContainer title="Vendas Recentes" badge="Últimas 10" badgeVariant="success">
          {stats.recentSales.length > 0 ? (
            <div className="space-y-3">
              {stats.recentSales.map((sale: any) => (
                <div key={sale.id} className="flex items-center gap-3 py-2 border-b border-brand-gray-100 last:border-0">
                  <div className="flex-shrink-0 w-10 h-10 bg-brand-orange-light rounded-full flex items-center justify-center">
                    <Clock size={18} className="text-brand-orange" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-brand-gray-900 truncate">
                      {sale.courses?.title || 'Curso Desconhecido'}
                    </p>
                    <p className="text-xs text-brand-gray-500">
                      {sale.profiles?.name || 'Usuário Desconhecido'} • {formatDate(sale.created_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-brand-gray-900">
                      {formatCurrency(sale.amount)}
                    </p>
                    <Badge 
                      variant={sale.status === 'paid' ? 'success' : sale.status === 'pending' ? 'warning' : 'error'}
                      className="text-xs"
                    >
                      {sale.status === 'paid' ? 'Pago' : sale.status === 'pending' ? 'Pendente' : 'Cancelado'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-brand-gray-500">
              Nenhuma venda recente
            </div>
          )}
        </ChartContainer>

        {/* Usuários Recentes */}
        <ChartContainer title="Usuários Recentes" badge="Últimos 5" badgeVariant="info">
          {userStats.recentUsers.length > 0 ? (
            <div className="space-y-3">
              {userStats.recentUsers.map((user: any) => (
                <div key={user.id} className="flex items-center gap-3 py-2 border-b border-brand-gray-100 last:border-0">
                  <div className="flex-shrink-0 w-10 h-10 bg-brand-gray-100 rounded-full flex items-center justify-center">
                    <Users size={18} className="text-brand-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-brand-gray-900">
                      {user.name || 'Sem nome'}
                    </p>
                    <p className="text-xs text-brand-gray-500">
                      {formatDate(user.created_at)}
                    </p>
                  </div>
                  <Badge 
                    variant={user.role === 'admin' ? 'error' : user.role === 'teacher' ? 'warning' : 'default'}
                    className="text-xs capitalize"
                  >
                    {user.role === 'student' ? 'Aluno' : user.role === 'teacher' ? 'Professor' : 'Admin'}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-brand-gray-500">
              Nenhum usuário recente
            </div>
          )}
        </ChartContainer>
      </div>

      {/* Status do Sistema */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-brand-gray-900 flex items-center gap-2">
            <RefreshCw size={20} className="text-brand-orange" />
            Status do Sistema
          </h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-4 bg-brand-gray-50 rounded-lg">
              <div className={`p-2 rounded-lg ${systemHealth.webhooks.pending > 0 ? 'bg-yellow-100' : 'bg-green-100'}`}>
                <AlertCircle size={20} className={systemHealth.webhooks.pending > 0 ? 'text-yellow-600' : 'text-green-600'} />
              </div>
              <div>
                <p className="text-sm font-medium text-brand-gray-900">Webhooks Pendentes</p>
                <p className="text-2xl font-bold text-brand-gray-900">{systemHealth.webhooks.pending}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-4 bg-brand-gray-50 rounded-lg">
              <div className={`p-2 rounded-lg ${systemHealth.pendingWithdraws > 0 ? 'bg-yellow-100' : 'bg-green-100'}`}>
                <DollarSign size={20} className={systemHealth.pendingWithdraws > 0 ? 'text-yellow-600' : 'text-green-600'} />
              </div>
              <div>
                <p className="text-sm font-medium text-brand-gray-900">Saques Pendentes</p>
                <p className="text-2xl font-bold text-brand-gray-900">{systemHealth.pendingWithdraws}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-4 bg-brand-gray-50 rounded-lg">
              <div className={`p-2 rounded-lg ${systemHealth.draftCourses > 0 ? 'bg-yellow-100' : 'bg-green-100'}`}>
                <FileText size={20} className={systemHealth.draftCourses > 0 ? 'text-yellow-600' : 'text-green-600'} />
              </div>
              <div>
                <p className="text-sm font-medium text-brand-gray-900">Cursos em Rascunho</p>
                <p className="text-2xl font-bold text-brand-gray-900">{systemHealth.draftCourses}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-4 bg-brand-gray-50 rounded-lg">
              <div className="p-2 rounded-lg bg-blue-100">
                <CheckCircle size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-brand-gray-900">Webhooks Processados</p>
                <p className="text-2xl font-bold text-brand-gray-900">{systemHealth.webhooks.total - systemHealth.webhooks.pending}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-brand-gray-900">Ações Rápidas</h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <a 
              href="/admin/courses" 
              className="flex flex-col items-center p-4 bg-brand-gray-50 rounded-lg hover:bg-brand-gray-100 transition-colors"
            >
              <BookOpen size={24} className="text-brand-orange mb-2" />
              <span className="text-sm font-medium text-brand-gray-700">Gerenciar Cursos</span>
            </a>
            <a 
              href="/admin/users" 
              className="flex flex-col items-center p-4 bg-brand-gray-50 rounded-lg hover:bg-brand-gray-100 transition-colors"
            >
              <Users size={24} className="text-brand-orange mb-2" />
              <span className="text-sm font-medium text-brand-gray-700">Gerenciar Usuários</span>
            </a>
            <a 
              href="/admin/financial" 
              className="flex flex-col items-center p-4 bg-brand-gray-50 rounded-lg hover:bg-brand-gray-100 transition-colors"
            >
              <DollarSign size={24} className="text-brand-orange mb-2" />
              <span className="text-sm font-medium text-brand-gray-700">Financeiro</span>
            </a>
            <a 
              href="/admin/settings" 
              className="flex flex-col items-center p-4 bg-brand-gray-50 rounded-lg hover:bg-brand-gray-100 transition-colors"
            >
              <TrendingUp size={24} className="text-brand-orange mb-2" />
              <span className="text-sm font-medium text-brand-gray-700">Configurações</span>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
