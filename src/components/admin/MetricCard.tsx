import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  Users, 
  BookOpen, 
  GraduationCap, 
  UserCheck, 
  Layers, 
  TrendingUpIcon,
  CheckCircle,
  AlertTriangle,
  Eye,
  Share2,
  Activity,
  PieChart,
  Target,
  RefreshCw,
  FileText,
  AlertCircle,
  Clock,
  BarChart3,
  Calendar,
  LucideIcon
} from 'lucide-react'

const iconMap: Record<string, LucideIcon> = {
  DollarSign,
  ShoppingCart,
  Users,
  BookOpen,
  GraduationCap,
  UserCheck,
  Layers,
  TrendingUp: TrendingUpIcon,
  CheckCircle,
  AlertTriangle,
  Eye,
  Share2,
  Activity,
  PieChart,
  Target,
  RefreshCw,
  FileText,
  AlertCircle,
  Clock,
  BarChart3,
  Calendar
}

interface MetricCardProps {
  title: string
  value: string | number
  iconName: keyof typeof iconMap
  trend?: {
    value: number
    isPositive: boolean
    label?: string
  }
  subtitle?: string
  variant?: 'default' | 'success' | 'warning' | 'error'
}

export function MetricCard({ 
  title, 
  value, 
  iconName, 
  trend, 
  subtitle,
  variant = 'default' 
}: MetricCardProps) {
  const Icon = iconMap[iconName] || DollarSign
  
  const variantStyles = {
    default: 'bg-brand-gray-50',
    success: 'bg-green-50',
    warning: 'bg-yellow-50',
    error: 'bg-red-50'
  }

  const iconStyles = {
    default: 'text-brand-orange',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    error: 'text-red-600'
  }

  return (
    <div className={`${variantStyles[variant]} rounded-lg p-5`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-brand-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-brand-gray-900">{value}</p>
          
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            }`}>
              {trend.isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              <span>{trend.value}%</span>
              {trend.label && <span className="text-brand-gray-500 ml-1">{trend.label}</span>}
            </div>
          )}
          
          {subtitle && !trend && (
            <p className="text-xs text-brand-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        
        <div className="p-3 bg-white rounded-lg shadow-sm">
          <Icon className={`w-6 h-6 ${iconStyles[variant]}`} />
        </div>
      </div>
    </div>
  )
}
