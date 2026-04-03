import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { getAdminDashboardStats } from "@/lib/queries/admin";
import { 
  DollarSign, 
  ShoppingCart, 
  Users, 
  BookOpen, 
  TrendingUp,
  TrendingDown,
  Clock
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

// Stat Card Component
interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  subtitle?: string;
}

function StatCard({ title, value, icon, trend, subtitle }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-brand-gray-500 mb-1">{title}</p>
            <p className="text-2xl font-bold text-brand-gray-900">{value}</p>
            {subtitle && (
              <p className="text-xs text-brand-gray-500 mt-1">{subtitle}</p>
            )}
            {trend && (
              <div className={`flex items-center gap-1 mt-2 text-sm ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {trend.isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                <span>{trend.value}%</span>
              </div>
            )}
          </div>
          <div className="p-3 bg-brand-orange-light rounded-lg">
            <div className="text-brand-orange">{icon}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default async function AdminDashboardPage() {
  const stats = await getAdminDashboardStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand-gray-900">Dashboard</h1>
        <p className="text-sm text-brand-gray-500">
          Atualizado em {new Date().toLocaleString('pt-BR')}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="GMV Total"
          value={formatCurrency(stats.gmv)}
          icon={<DollarSign size={24} />}
          trend={{ value: 12.5, isPositive: true }}
        />
        <StatCard
          title="Vendas Hoje"
          value={formatCurrency(stats.salesToday)}
          icon={<ShoppingCart size={24} />}
          subtitle={`${stats.ordersToday} pedidos`}
        />
        <StatCard
          title="Total Usuários"
          value={stats.totalUsers.toLocaleString('pt-BR')}
          icon={<Users size={24} />}
          trend={{ value: 8.2, isPositive: true }}
        />
        <StatCard
          title="Matrículas Ativas"
          value={stats.totalEnrollments.toLocaleString('pt-BR')}
          icon={<BookOpen size={24} />}
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 Courses */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <h2 className="text-lg font-semibold text-brand-gray-900">Top 5 Cursos por Receita</h2>
            <Badge variant="info">Este mês</Badge>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        {/* Recent Sales */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <h2 className="text-lg font-semibold text-brand-gray-900">Vendas Recentes</h2>
            <Badge variant="success">Últimas 10</Badge>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      </div>

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
