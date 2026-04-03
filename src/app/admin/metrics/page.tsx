import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/admin/DataTable";
import { getAdminMetrics } from "@/lib/queries/admin";
import { 
  Eye, 
  ShoppingCart, 
  CheckCircle, 
  TrendingUp,
  BarChart3,
  Calendar
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

// Conversion Card Component
interface ConversionCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  subtitle?: string;
}

function ConversionCard({ title, value, icon, subtitle }: ConversionCardProps) {
  return (
    <div className="bg-brand-gray-50 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-white rounded-lg shadow-sm">
          <div className="text-brand-orange">{icon}</div>
        </div>
        <div>
          <p className="text-sm text-brand-gray-500">{title}</p>
          <p className="text-xl font-bold text-brand-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-brand-gray-500 mt-1">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}

export default async function AdminMetricsPage() {
  const metrics = await getAdminMetrics();

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
          <h1 className="text-2xl font-bold text-brand-gray-900">Métricas</h1>
          <p className="text-sm text-brand-gray-500 mt-1">
            Análise de conversão e desempenho da plataforma
          </p>
        </div>
        <Badge variant="info" className="flex items-center gap-1">
          <Calendar size={14} />
          Últimos 30 dias
        </Badge>
      </div>

      {/* Conversion Stats */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-brand-gray-900 flex items-center gap-2">
            <BarChart3 size={20} className="text-brand-orange" />
            Estatísticas de Conversão
          </h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <ConversionCard
              title="Visitas Totais"
              value="-"
              icon={<Eye size={20} />}
              subtitle="Em breve"
            />
            <ConversionCard
              title="Checkouts Criados"
              value={formatNumber(metrics.conversionStats.checkouts)}
              icon={<ShoppingCart size={20} />}
            />
            <ConversionCard
              title="Pagamentos Confirmados"
              value={formatNumber(metrics.conversionStats.confirmedPayments)}
              icon={<CheckCircle size={20} />}
            />
            <ConversionCard
              title="Taxa de Conversão"
              value={`${metrics.conversionStats.conversionRate}%`}
              icon={<TrendingUp size={20} />}
              subtitle="Checkouts → Pagamentos"
            />
          </div>
        </CardContent>
      </Card>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Over Time */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <h2 className="text-lg font-semibold text-brand-gray-900">Receita por Dia</h2>
            <Badge variant="success">Últimos 14 dias</Badge>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-brand-gray-900">Resumo do Período</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-brand-gray-100">
                <span className="text-brand-gray-600">Receita Total</span>
                <span className="text-lg font-semibold text-brand-gray-900">
                  {formatCurrency(Object.values(metrics.revenueByDay).reduce((a, b) => a + b, 0))}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-brand-gray-100">
                <span className="text-brand-gray-600">Média Diária</span>
                <span className="text-lg font-semibold text-brand-gray-900">
                  {formatCurrency(
                    Object.values(metrics.revenueByDay).length > 0
                      ? Object.values(metrics.revenueByDay).reduce((a, b) => a + b, 0) / Object.values(metrics.revenueByDay).length
                      : 0
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-brand-gray-100">
                <span className="text-brand-gray-600">Melhor Dia</span>
                <span className="text-lg font-semibold text-green-600">
                  {formatCurrency(Math.max(...Object.values(metrics.revenueByDay), 0))}
                </span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-brand-gray-600">Dias com Vendas</span>
                <span className="text-lg font-semibold text-brand-gray-900">
                  {Object.values(metrics.revenueByDay).filter(v => v > 0).length} dias
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Courses Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <h2 className="text-lg font-semibold text-brand-gray-900">Top Cursos</h2>
          <Badge variant="info">Por receita</Badge>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={topCoursesColumns}
            data={metrics.topCourses}
            keyExtractor={(course) => course.id}
            emptyMessage="Nenhum curso encontrado"
            emptyDescription="Os cursos aparecerão aqui quando houver vendas"
          />
        </CardContent>
      </Card>
    </div>
  );
}
