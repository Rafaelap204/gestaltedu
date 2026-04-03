'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/Card'

interface AdminSettingsClientProps {
  settings: unknown
  payoutRules: unknown[]
}

export function AdminSettingsClient({
  settings,
  payoutRules,
}: AdminSettingsClientProps) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-gray-900">Configurações</h1>
      
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-brand-gray-900">Configurações da Plataforma</h3>
        </CardHeader>
        <CardContent>
          <p className="text-brand-gray-500 text-center py-8">Em breve</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-brand-gray-900">Regras de Pagamento</h3>
        </CardHeader>
        <CardContent>
          <p className="text-brand-gray-500 text-center py-8">Em breve</p>
        </CardContent>
      </Card>
    </div>
  )
}
