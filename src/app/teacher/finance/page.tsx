import { redirect } from 'next/navigation'
import { DollarSign, ArrowRightLeft, Clock, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { getSession } from '@/lib/utils/auth'
import { 
  getTeacherBalanceAction, 
  getTeacherTransactionsAction, 
  getTeacherWithdrawalsAction 
} from '@/lib/actions/finance'
import { formatPrice, formatDate } from '@/lib/utils/format'
import { WithdrawRequestForm } from './WithdrawRequestForm'

export default async function TeacherFinancePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const session = await getSession()
  
  if (!session?.profile) {
    redirect('/login')
  }

  // Check if user is teacher or admin
  if (session.profile.role !== 'teacher' && session.profile.role !== 'admin') {
    redirect('/app')
  }

  // Get query params for pagination
  const params = await searchParams
  const transactionPage = Number(params.transactionPage) || 1
  const withdrawalPage = Number(params.withdrawalPage) || 1

  // Fetch data
  const balanceResult = await getTeacherBalanceAction()
  const transactionsResult = await getTeacherTransactionsAction(transactionPage)
  const withdrawalsResult = await getTeacherWithdrawalsAction(withdrawalPage)

  // Handle errors
  const balance = 'error' in balanceResult ? null : balanceResult
  const transactions = 'error' in transactionsResult ? [] : transactionsResult.transactions
  const transactionsTotal = 'error' in transactionsResult ? 0 : transactionsResult.total
  const withdrawals = 'error' in withdrawalsResult ? [] : withdrawalsResult.withdrawals
  const withdrawalsTotal = 'error' in withdrawalsResult ? 0 : withdrawalsResult.total

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case 'sale': return 'Venda'
      case 'commission': return 'Comissão'
      case 'payout': return 'Pagamento'
      case 'refund': return 'Reembolso'
      default: return type
    }
  }

  const getTransactionStatusVariant = (status: string): 'default' | 'success' | 'warning' | 'error' | 'info' => {
    switch (status) {
      case 'cleared': return 'success'
      case 'pending': return 'warning'
      case 'cancelled': return 'error'
      default: return 'default'
    }
  }

  const getTransactionStatusLabel = (status: string) => {
    switch (status) {
      case 'cleared': return 'Confirmado'
      case 'pending': return 'Pendente'
      case 'cancelled': return 'Cancelado'
      default: return status
    }
  }

  const getWithdrawalStatusVariant = (status: string): 'default' | 'success' | 'warning' | 'error' | 'info' => {
    switch (status) {
      case 'completed': return 'success'
      case 'processing': return 'info'
      case 'pending': return 'warning'
      case 'rejected': return 'error'
      default: return 'default'
    }
  }

  const getWithdrawalStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Concluído'
      case 'processing': return 'Em Processamento'
      case 'pending': return 'Pendente'
      case 'rejected': return 'Rejeitado'
      default: return status
    }
  }

  const totalTransactionPages = Math.ceil(transactionsTotal / 20)
  const totalWithdrawalPages = Math.ceil(withdrawalsTotal / 20)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-brand-gray-900">Financeiro</h1>
        <p className="text-sm text-brand-gray-500 mt-1">
          Gerencie seus ganhos e saques
        </p>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Recebido */}
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-brand-gray-500">
              <CheckCircle size={18} className="text-green-500" />
              <span className="text-sm font-medium">Total Recebido</span>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-brand-gray-900">
              {balance ? formatPrice(balance.totalEarned) : '-'}
            </p>
          </CardContent>
        </Card>

        {/* Pendente */}
        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-brand-gray-500">
              <Clock size={18} className="text-yellow-500" />
              <span className="text-sm font-medium">Pendente</span>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-brand-gray-900">
              {balance ? formatPrice(balance.pendingWithdrawals) : '-'}
            </p>
          </CardContent>
        </Card>

        {/* Disponível para Saque */}
        <Card className="border-l-4 border-l-orange-500 bg-orange-50/30">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-brand-gray-500">
              <DollarSign size={18} className="text-orange-500" />
              <span className="text-sm font-medium">Disponível para Saque</span>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-orange-600">
              {balance ? formatPrice(balance.available) : '-'}
            </p>
          </CardContent>
        </Card>

        {/* Total Sacado */}
        <Card className="border-l-4 border-l-gray-400">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-brand-gray-500">
              <ArrowRightLeft size={18} className="text-gray-400" />
              <span className="text-sm font-medium">Total Sacado</span>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-brand-gray-900">
              {balance ? formatPrice(balance.totalWithdrawn) : '-'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Withdraw Request Section */}
      <WithdrawRequestForm availableBalance={balance?.available || 0} />

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ArrowRightLeft size={20} className="text-brand-orange" />
            <h3 className="font-semibold text-brand-gray-900">Histórico de Transações</h3>
          </div>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-brand-gray-400">
              <ArrowRightLeft size={48} className="mx-auto mb-3 opacity-50" />
              <p>Nenhuma transação ainda</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-brand-gray-100">
                      <th className="text-left py-3 px-4 text-sm font-medium text-brand-gray-500">Data</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-brand-gray-500">Tipo</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-brand-gray-500">Descrição</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-brand-gray-500">Valor</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-brand-gray-500">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction, index) => (
                      <tr 
                        key={transaction.id} 
                        className={index % 2 === 0 ? 'bg-white' : 'bg-brand-gray-50/50'}
                      >
                        <td className="py-3 px-4 text-sm text-brand-gray-600">
                          {formatDate(transaction.created_at)}
                        </td>
                        <td className="py-3 px-4 text-sm text-brand-gray-900">
                          {getTransactionTypeLabel(transaction.type)}
                        </td>
                        <td className="py-3 px-4 text-sm text-brand-gray-600">
                          {transaction.description || '-'}
                        </td>
                        <td className="py-3 px-4 text-sm text-brand-gray-900 font-medium text-right">
                          {formatPrice(transaction.amount)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant={getTransactionStatusVariant(transaction.status)}>
                            {getTransactionStatusLabel(transaction.status)}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalTransactionPages > 1 && (
                <div className="flex justify-center gap-2 mt-4 pt-4 border-t border-brand-gray-100">
                  {Array.from({ length: totalTransactionPages }, (_, i) => i + 1).map((page) => (
                    <a
                      key={page}
                      href={`?transactionPage=${page}&withdrawalPage=${withdrawalPage}`}
                      className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                        page === transactionPage
                          ? 'bg-brand-orange text-white'
                          : 'bg-brand-gray-100 text-brand-gray-700 hover:bg-brand-gray-200'
                      }`}
                    >
                      {page}
                    </a>
                  ))}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Withdrawal History */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <DollarSign size={20} className="text-brand-orange" />
            <h3 className="font-semibold text-brand-gray-900">Histórico de Saques</h3>
          </div>
        </CardHeader>
        <CardContent>
          {withdrawals.length === 0 ? (
            <div className="text-center py-8 text-brand-gray-400">
              <DollarSign size={48} className="mx-auto mb-3 opacity-50" />
              <p>Nenhum saque realizado ainda</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-brand-gray-100">
                      <th className="text-left py-3 px-4 text-sm font-medium text-brand-gray-500">Data</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-brand-gray-500">Valor</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-brand-gray-500">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-brand-gray-500">Observações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {withdrawals.map((withdrawal, index) => (
                      <tr 
                        key={withdrawal.id} 
                        className={index % 2 === 0 ? 'bg-white' : 'bg-brand-gray-50/50'}
                      >
                        <td className="py-3 px-4 text-sm text-brand-gray-600">
                          {formatDate(withdrawal.created_at)}
                        </td>
                        <td className="py-3 px-4 text-sm text-brand-gray-900 font-medium text-right">
                          {formatPrice(withdrawal.amount)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant={getWithdrawalStatusVariant(withdrawal.status)}>
                            {getWithdrawalStatusLabel(withdrawal.status)}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-sm text-brand-gray-600">
                          {withdrawal.notes || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalWithdrawalPages > 1 && (
                <div className="flex justify-center gap-2 mt-4 pt-4 border-t border-brand-gray-100">
                  {Array.from({ length: totalWithdrawalPages }, (_, i) => i + 1).map((page) => (
                    <a
                      key={page}
                      href={`?transactionPage=${transactionPage}&withdrawalPage=${page}`}
                      className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                        page === withdrawalPage
                          ? 'bg-brand-orange text-white'
                          : 'bg-brand-gray-100 text-brand-gray-700 hover:bg-brand-gray-200'
                      }`}
                    >
                      {page}
                    </a>
                  ))}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
