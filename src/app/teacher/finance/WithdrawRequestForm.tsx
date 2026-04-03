'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DollarSign, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { toast } from '@/lib/stores/toast-store'
import { requestWithdrawAction } from '@/lib/actions/finance'
import { formatPrice } from '@/lib/utils/format'

interface WithdrawRequestFormProps {
  availableBalance: number
}

export function WithdrawRequestForm({ availableBalance }: WithdrawRequestFormProps) {
  const router = useRouter()
  const [amount, setAmount] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const MIN_WITHDRAWAL = 10

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const amountValue = parseFloat(amount.replace(',', '.'))

    // Validation
    if (isNaN(amountValue) || amountValue <= 0) {
      setError('Por favor, informe um valor válido')
      return
    }

    if (amountValue < MIN_WITHDRAWAL) {
      setError(`O valor mínimo para saque é ${formatPrice(MIN_WITHDRAWAL)}`)
      return
    }

    if (amountValue > availableBalance) {
      setError('Saldo insuficiente para este saque')
      return
    }

    setIsSubmitting(true)

    try {
      const result = await requestWithdrawAction(amountValue)

      if ('error' in result) {
        setError(result.error)
        toast.error('Erro ao solicitar saque', result.error)
      } else {
        toast.success('Saque solicitado com sucesso!', 'Sua solicitação está sendo processada.')
        setAmount('')
        // Refresh the page to show updated balance and new withdrawal
        router.refresh()
      }
    } catch (err) {
      console.error('Error requesting withdrawal:', err)
      setError('Erro ao processar solicitação. Tente novamente.')
      toast.error('Erro ao solicitar saque', 'Tente novamente mais tarde.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSetMaxAmount = () => {
    setAmount(availableBalance.toFixed(2).replace('.', ','))
    setError(null)
  }

  const canWithdraw = availableBalance >= MIN_WITHDRAWAL

  return (
    <Card className="border-orange-200 bg-orange-50/20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
            <DollarSign size={20} className="text-orange-600" />
          </div>
          <div>
            <h3 className="font-semibold text-brand-gray-900">Solicitar Saque</h3>
            <p className="text-sm text-brand-gray-500">
              Mínimo: {formatPrice(MIN_WITHDRAWAL)} • Disponível: {formatPrice(availableBalance)}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!canWithdraw ? (
          <div className="flex items-start gap-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <AlertCircle size={20} className="text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-800">
                Saldo insuficiente para saque
              </p>
              <p className="text-sm text-yellow-700 mt-1">
                Você precisa ter pelo menos {formatPrice(MIN_WITHDRAWAL)} disponível para solicitar um saque.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <Input
                  label="Valor do Saque"
                  type="text"
                  value={amount}
                  onChange={(e) => {
                    // Allow only numbers and comma
                    const value = e.target.value.replace(/[^0-9,]/g, '')
                    setAmount(value)
                    setError(null)
                  }}
                  placeholder="0,00"
                  error={error || undefined}
                  disabled={isSubmitting}
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSetMaxAmount}
                  disabled={isSubmitting}
                  className="mb-[1.5rem]"
                >
                  Máximo
                </Button>
              </div>
            </div>

            <Button
              type="submit"
              loading={isSubmitting}
              disabled={isSubmitting || !amount}
              className="w-full sm:w-auto"
            >
              <DollarSign size={18} />
              Solicitar Saque
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
