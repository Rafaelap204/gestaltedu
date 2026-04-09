import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/admin/DataTable";
import { MetricCard } from "@/components/admin/MetricCard";
import { StatsGrid } from "@/components/admin/StatsGrid";
import { ChartContainer } from "@/components/admin/ChartContainer";
import { 
  getAdminMetrics,
  getDetailedUserStats,
  getDetailedCourseStats,
  getDetailedFinancialStats,
  getEngagementStats,
  getReferralStats,
  getSystemHealthStats
} from "@/lib/queries/admin";
import { 
  Eye, 
  CheckCircle, 
  BarChart3,
  Calendar,
  Users,
  DollarSign,
  GraduationCap,
  Target,
  Share2,
  Activity,
  PieChart,
  Layers,
  AlertTriangle
} from "lucide-react";

// Format currency to Brazilian Real
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

// Format number with Brazilian locale
function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value);
}

export default async function AdminMetricsPage() {
  const metrics = await getAdminMetrics();
  const userStats = await getDetailedUserStats();
  const courseStats = await getDetailedCourseStats();
  const financialStats = await getDetailedFinancialStats('all');
  const engagementStats = await getEngagementStats();
  const referralStats = await getReferralStats();
  const systemHealth = await getSystemHealthStats();

  // Transform revenue by day for display
  const revenueEntries = Object.entries(metrics.revenueByDay)
    .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
    .slice(0, 14); // Last 14 days

  // Top courses columns
  const topCoursesColumns = [
    {
      key: 'title',
      header: 'Curso',
      render: (course: any) => (
        <div>
          <p className="font-medium text-brand-gray-900">{course.title}</p>
          <p className="text-xs text-brand-gray-500">{course.teacher}</p>
        </div>
      ),
    },
    {
      key: 'enrollments',
      header: 'Matrículas',
      render: (course: any) => formatNumber(course.enrollments),
    },
    {
      key: 'revenue',
      header: 'Receita',
      render: (course: any) => (
        <span className="font-semibold text-brand-gray-900">
          {formatCurrency(course.revenue)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-gray-900">Métricas e Analytics</h1>
          <p className="text-sm text-brand-gray-500 mt-1">
            Análise completa da plataforma e desempenho do negócio
          </p>
        </div>
        <Badge variant="info" className="flex items-center gap-1">
          <Calendar size={14} />
          Atualizado em {new Date().toLocaleString('pt-BR')}
        </Badge>
      </div>

      {/* Visão Geral do Negócio */}
      <section>
        <h2 className="text-lg font-semibold text-brand-gray-900 mb-4 flex items-center gap-2">
          <BarChart3 size={20} className="text-brand-orange" />
          Visão Geral do Negócio
        </h2>
        <StatsGrid columns={4}>
          <MetricCard
            title="GMV Total Acumulado"
            value={formatCurrency(financialStats.revenueByStatus.paid)}
            iconName="DollarSign"
            trend={{ value: 15.3, isPositive: true, label: 'vs ano anterior' }}
          />
          <MetricCard
            title="Total de Transações"
            value={formatNumber(financialStats.totalTransactions)}
            iconName="ShoppingCart"
            subtitle={`${financialStats.paidOrdersCount} pagas`}
          />
          <MetricCard
            title="Ticket Médio"
            value={formatCurrency(financialStats.averageTicket)}
            iconName="TrendingUp"
            variant="success"
          />
          <MetricCard
            title="Taxa de Conversão"
            value={`${metrics.conversionStats.conversionRate}%`}
            iconName="Target"
            subtitle={`${formatNumber(metrics.conversionStats.checkouts)} checkouts`}
          />
        </StatsGrid>
      </section>

      {/* Usuários e Engajamento */}
      <section>
        <h2 className="text-lg font-semibold text-brand-gray-900 mb-4 flex items-center gap-2">
          <Users size={20} className="text-brand-orange" />
          Usuários e Engajamento
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <StatsGrid columns={3}>
            <MetricCard
              title="Total de Usuários"
              value={formatNumber(userStats.total)}
              iconName="Users"
            />
            <MetricCard
              title="Alunos"
              value={formatNumber(userStats.byRole.student)}
              iconName="GraduationCap"
              subtitle={`${formatNumber(userStats.newUsers.last30Days)} novos (30d)`}
            />
            <MetricCard
              title="Professores"
              value={formatNumber(userStats.byRole.teacher)}
              iconName="Users"
            />
            <MetricCard
              title="Matrículas Ativas"
              value={formatNumber(engagementStats.enrollments.active)}
              iconName="Activity"
              subtitle={`${formatNumber(engagementStats.totalEnrollments)} total`}
            />
            <MetricCard
              title="Progresso Médio"
              value={`${engagementStats.averageProgress}%`}
              iconName="PieChart"
            />
            <MetricCard
              title="Taxa de Conclusão"
              value={`${engagementStats.completionRate}%`}
              iconName="CheckCircle"
              variant="success"
            />
          </StatsGrid>

          <ChartContainer title="Distribuição de Usuários" badge="Por Tipo" badgeVariant="info">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-brand-gray-600">Alunos</span>
                  <span className="text-sm font-semibold text-brand-gray-900">
                    {formatNumber(userStats.byRole.student)} ({Math.round((userStats.byRole.student / userStats.total) * 100)}%)
                  </span>
                </div>
                <div className="h-3 bg-brand-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-brand-orange rounded-full"
                    style={{ width: `${(userStats.byRole.student / userStats.total) * 100}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-brand-gray-600">Professores</span>
                  <span className="text-sm font-semibold text-brand-gray-900">
                    {formatNumber(userStats.byRole.teacher)} ({Math.round((userStats.byRole.teacher / userStats.total) * 100)}%)
                  </span>
                </div>
                <div className="h-3 bg-brand-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${(userStats.byRole.teacher / userStats.total) * 100}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-brand-gray-600">Admins</span>
                  <span className="text-sm font-semibold text-brand-gray-900">
                    {formatNumber(userStats.byRole.admin)} ({Math.round((userStats.byRole.admin / userStats.total) * 100)}%)
                  </span>
                </div>
                <div className="h-3 bg-brand-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-red-500 rounded-full"
                    style={{ width: `${(userStats.byRole.admin / userStats.total) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </ChartContainer>
        </div>
      </section>

      {/* Performance de Cursos */}
      <section>
        <h2 className="text-lg font-semibold text-brand-gray-900 mb-4 flex items-center gap-2">
          <Layers size={20} className="text-brand-orange" />
          Performance de Cursos
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <StatsGrid columns={2} className="lg:col-span-1">
            <MetricCard
              title="Total de Cursos"
              value={formatNumber(courseStats.total)}
              iconName="Layers"
            />
            <MetricCard
              title="Publicados"
              value={formatNumber(courseStats.byStatus.published)}
              iconName="CheckCircle"
              variant="success"
            />
            <MetricCard
              title="Em Rascunho"
              value={formatNumber(courseStats.byStatus.draft)}
              iconName="AlertTriangle"
              variant="warning"
            />
            <MetricCard
              title="Total de Aulas"
              value={formatNumber(courseStats.totalLessons)}
              iconName="GraduationCap"
            />
          </StatsGrid>

          <div className="lg:col-span-2">
            <ChartContainer title="Top Cursos" badge="Por Receita" badgeVariant="info">
              <DataTable
                columns={topCoursesColumns}
                data={metrics.topCourses}
                keyExtractor={(course) => course.id}
                emptyMessage="Nenhum curso encontrado"
                emptyDescription="Os cursos aparecerão aqui quando houver vendas"
              />
            </ChartContainer>
          </div>
        </div>
      </section>

      {/* Análise Financeira */}
      <section>
        <h2 className="text-lg font-semibold text-brand-gray-900 mb-4 flex items-center gap-2">
          <DollarSign size={20} className="text-brand-orange" />
          Análise Financeira
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Over Time */}
          <ChartContainer title="Receita por Dia" badge="Últimos 14 dias" badgeVariant="success">
            {revenueEntries.length > 0 ? (
              <div className="space-y-2">
                {revenueEntries.map(([date, revenue]) => {
                  const formattedDate = new Date(date).toLocaleDateString('pt-BR', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short'
                  });
                  const maxRevenue = Math.max(...Object.values(metrics.revenueByDay));
                  const percentage = maxRevenue > 0 ? (revenue / maxRevenue) * 100 : 0;
                  
                  return (
                    <div key={date} className="flex items-center gap-3">
                      <div className="w-24 text-xs text-brand-gray-500 capitalize">
                        {formattedDate}
                      </div>
                      <div className="flex-1 h-6 bg-brand-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-brand-orange rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(percentage, 5)}%` }}
                        />
                      </div>
                      <div className="w-20 text-right text-sm font-medium text-brand-gray-900">
                        {formatCurrency(revenue)}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-brand-gray-500">
                Nenhuma receita registrada nos últimos 14 dias
              </div>
            )}
          </ChartContainer>

          {/* Distribuição por Status */}
          <ChartContainer title="Receita por Status" badge="Distribuição" badgeVariant="info">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-brand-gray-600 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-green-500"></span>
                    Pago
                  </span>
                  <span className="text-sm font-semibold text-brand-gray-900">
                    {formatCurrency(financialStats.revenueByStatus.paid)}
                  </span>
                </div>
                <div className="h-3 bg-brand-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-brand-gray-600 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                    Pendente
                  </span>
                  <span className="text-sm font-semibold text-brand-gray-900">
                    {formatCurrency(financialStats.revenueByStatus.pending)}
                  </span>
                </div>
                <div className="h-3 bg-brand-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-yellow-500 rounded-full"
                    style={{ width: `${financialStats.revenueByStatus.paid > 0 ? (financialStats.revenueByStatus.pending / financialStats.revenueByStatus.paid) * 100 : 0}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-brand-gray-600 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500"></span>
                    Cancelado/Reembolsado
                  </span>
                  <span className="text-sm font-semibold text-brand-gray-900">
                    {formatCurrency(financialStats.revenueByStatus.cancelled + financialStats.revenueByStatus.refunded)}
                  </span>
                </div>
                <div className="h-3 bg-brand-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-red-500 rounded-full"
                    style={{ width: `${financialStats.revenueByStatus.paid > 0 ? ((financialStats.revenueByStatus.cancelled + financialStats.revenueByStatus.refunded) / financialStats.revenueByStatus.paid) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </ChartContainer>
        </div>
      </section>

      {/* Marketing e Afiliados */}
      <section>
        <h2 className="text-lg font-semibold text-brand-gray-900 mb-4 flex items-center gap-2">
          <Share2 size={20} className="text-brand-orange" />
          Marketing e Afiliados
        </h2>
        <StatsGrid columns={4}>
          <MetricCard
            title="Códigos de Afiliado"
            value={formatNumber(referralStats.totalCodes)}
            iconName="Share2"
          />
          <MetricCard
            title="Cliques em Links"
            value={formatNumber(referralStats.totalClicks)}
            iconName="Eye"
          />
          <MetricCard
            title="Comissões Totais"
            value={formatCurrency(referralStats.commissionStats.total)}
            iconName="DollarSign"
          />
          <MetricCard
            title="Comissões Pendentes"
            value={formatCurrency(referralStats.commissionStats.pending)}
            iconName="AlertTriangle"
            variant="warning"
          />
        </StatsGrid>
      </section>

      {/* Saúde do Sistema */}
      <section>
        <h2 className="text-lg font-semibold text-brand-gray-900 mb-4 flex items-center gap-2">
          <Activity size={20} className="text-brand-orange" />
          Saúde do Sistema
        </h2>
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <p className="text-sm text-brand-gray-500 mb-1">Webhooks Processados</p>
                <p className="text-3xl font-bold text-green-600">
                  {formatNumber(systemHealth.webhooks.total - systemHealth.webhooks.pending)}
                </p>
                <p className="text-xs text-brand-gray-400 mt-1">de {formatNumber(systemHealth.webhooks.total)} total</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-brand-gray-500 mb-1">Webhooks Pendentes</p>
                <p className={`text-3xl font-bold ${systemHealth.webhooks.pending > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                  {formatNumber(systemHealth.webhooks.pending)}
                </p>
                <p className="text-xs text-brand-gray-400 mt-1">aguardando processamento</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-brand-gray-500 mb-1">Saques Pendentes</p>
                <p className={`text-3xl font-bold ${systemHealth.pendingWithdraws > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                  {formatNumber(systemHealth.pendingWithdraws)}
                </p>
                <p className="text-xs text-brand-gray-400 mt-1">para aprovação</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-brand-gray-500 mb-1">Cursos em Rascunho</p>
                <p className={`text-3xl font-bold ${systemHealth.draftCourses > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                  {formatNumber(systemHealth.draftCourses)}
                </p>
                <p className="text-xs text-brand-gray-400 mt-1">aguardando publicação</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
