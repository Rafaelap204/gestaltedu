import { ReactNode } from 'react'
import { Badge } from '@/components/ui/Badge'

interface ChartContainerProps {
  title: string
  badge?: string
  badgeVariant?: 'default' | 'success' | 'warning' | 'error' | 'info'
  children: ReactNode
  emptyMessage?: string
  isEmpty?: boolean
}

export function ChartContainer({ 
  title, 
  badge, 
  badgeVariant = 'default',
  children,
  emptyMessage = 'Nenhum dado disponível',
  isEmpty = false
}: ChartContainerProps) {
  return (
    <div className="bg-white rounded-lg border border-brand-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-brand-gray-200 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-brand-gray-900">{title}</h3>
        {badge && <Badge variant={badgeVariant}>{badge}</Badge>}
      </div>
      <div className="p-5">
        {isEmpty ? (
          <div className="text-center py-8 text-brand-gray-500">
            {emptyMessage}
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  )
}
