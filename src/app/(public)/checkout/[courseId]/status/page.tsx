'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button, Card, CardContent } from '@/components/ui'
import { checkPaymentStatusAction } from '@/lib/actions/checkout'
import { formatPrice } from '@/lib/utils/format'
import {
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  QrCode,
  FileText,
  CreditCard,
  Copy,
  ArrowRight,
  RefreshCw,
} from 'lucide-react'

interface PaymentStatus {
  orderStatus: string
  paymentStatus: string
  courseId: string
}

function PaymentStatusContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')
  
  const [status, setStatus] = useState<PaymentStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  
  // Mock QR code data - in production this would come from the server action
  const [pixQrCode] = useState({
    image: '', // Base64 image would be here
    text: '00020126580014BR.GOV.BCB.PIX0136mock-pix-code-for-demo-only5204000053039865802BR5913Gestalt EDU6009SAO PAULO62070503***6304E2CA',
  })
  
  const fetchStatus = useCallback(async () => {
    if (!orderId) return
    
    try {
      const result = await checkPaymentStatusAction(orderId)
      
      if ('error' in result) {
        setError(result.error)
        return
      }
      
      setStatus(result)
    } catch (err) {
      setError('Erro ao verificar status do pagamento')
    } finally {
      setLoading(false)
    }
  }, [orderId])
  
  // Polling effect
  useEffect(() => {
    if (!orderId) {
      setError('ID do pedido não encontrado')
      setLoading(false)
      return
    }
    
    // Initial fetch
    fetchStatus()
    
    // Set up polling every 3 seconds
    const interval = setInterval(() => {
      fetchStatus()
    }, 3000)
    
    return () => clearInterval(interval)
  }, [orderId, fetchStatus])
  
  // Stop polling when status is final
  useEffect(() => {
    if (status) {
      const finalStatuses = ['paid', 'cancelled', 'refunded']
      if (finalStatuses.includes(status.orderStatus)) {
        // Status is final, polling will stop on unmount
      }
    }
  }, [status])
  
  const copyPixCode = () => {
    navigator.clipboard.writeText(pixQrCode.text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-brand-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-brand-orange animate-spin mx-auto mb-4" />
          <p className="text-brand-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }
  
  if (error || !status) {
    return (
      <div className="min-h-screen bg-brand-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-brand-gray-900 mb-2">
              Erro ao carregar
            </h1>
            <p className="text-brand-gray-600 mb-6">
              {error || 'Não foi possível carregar o status do pagamento'}
            </p>
            <Button onClick={() => router.push('/marketplace')}>
              Voltar para a Loja
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  const isPaid = status.orderStatus === 'paid'
  const isCancelled = status.orderStatus === 'cancelled'
  const isRefunded = status.orderStatus === 'refunded'
  const isPending = status.orderStatus === 'pending'
  
  // Success State
  if (isPaid) {
    return (
      <div className="min-h-screen bg-brand-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-25" />
              <CheckCircle className="w-20 h-20 text-green-500 mx-auto relative" />
            </div>
            
            <h1 className="text-2xl font-bold text-brand-gray-900 mb-2">
              Pagamento Confirmado!
            </h1>
            <p className="text-brand-gray-600 mb-6">
              Seu pagamento foi processado com sucesso. Você já pode acessar o curso.
            </p>
            
            <div className="bg-green-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-green-700">
                Um email de confirmação foi enviado para você.
              </p>
            </div>
            
            <Button
              size="lg"
              onClick={() => router.push(`/app/my-courses`)}
              className="w-full"
            >
              Acessar Meus Cursos
              <ArrowRight size={20} />
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  // Failed/Cancelled State
  if (isCancelled || isRefunded) {
    return (
      <div className="min-h-screen bg-brand-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <XCircle className="w-20 h-20 text-red-500 mx-auto mb-6" />
            
            <h1 className="text-2xl font-bold text-brand-gray-900 mb-2">
              {isRefunded ? 'Pagamento Reembolsado' : 'Pagamento Cancelado'}
            </h1>
            <p className="text-brand-gray-600 mb-6">
              {isRefunded
                ? 'Seu pagamento foi reembolsado. O valor será estornado em até 5 dias úteis.'
                : 'O pagamento não foi concluído. Você pode tentar novamente.'}
            </p>
            
            <div className="space-y-3">
              {!isRefunded && (
                <Button
                  size="lg"
                  onClick={() => router.push(`/checkout/${status.courseId}`)}
                  className="w-full"
                >
                  <RefreshCw size={20} />
                  Tentar Novamente
                </Button>
              )}
              <Button
                variant="outline"
                size="lg"
                onClick={() => router.push('/marketplace')}
                className="w-full"
              >
                Voltar para a Loja
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  // Pending State
  return (
    <div className="min-h-screen bg-brand-gray-50 py-8">
      <div className="max-w-md mx-auto px-4">
        <Card>
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <div className="relative inline-block mb-4">
                <div className="absolute inset-0 bg-brand-orange/10 rounded-full animate-pulse" />
                <Clock className="w-16 h-16 text-brand-orange relative" />
              </div>
              
              <h1 className="text-2xl font-bold text-brand-gray-900 mb-2">
                Aguardando Pagamento
              </h1>
              <p className="text-brand-gray-600">
                Complete o pagamento para liberar seu acesso ao curso
              </p>
            </div>
            
            {/* Payment Method Specific Content */}
            <div className="space-y-6">
              {/* PIX QR Code */}
              {status.paymentStatus === 'pending' && (
                <div className="bg-brand-gray-50 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <QrCode className="w-6 h-6 text-brand-orange" />
                    <h2 className="font-semibold text-brand-gray-900">Pague com PIX</h2>
                  </div>
                  
                  {/* QR Code Image */}
                  <div className="bg-white rounded-lg p-4 mb-4 flex items-center justify-center">
                    {pixQrCode.image ? (
                      <img
                        src={`data:image/png;base64,${pixQrCode.image}`}
                        alt="QR Code PIX"
                        className="w-48 h-48"
                      />
                    ) : (
                      <div className="w-48 h-48 bg-brand-gray-100 rounded-lg flex items-center justify-center">
                        <QrCode className="w-24 h-24 text-brand-gray-300" />
                      </div>
                    )}
                  </div>
                  
                  {/* Copy PIX Code */}
                  <div className="space-y-2">
                    <p className="text-sm text-brand-gray-600 text-center">
                      Ou copie o código PIX:
                    </p>
                    <button
                      onClick={copyPixCode}
                      className="w-full flex items-center justify-center gap-2 bg-white border border-brand-gray-200 rounded-lg px-4 py-3 text-sm font-medium text-brand-gray-700 hover:bg-brand-gray-50 transition-colors"
                    >
                      {copied ? (
                        <>
                          <CheckCircle size={16} className="text-green-500" />
                          Código copiado!
                        </>
                      ) : (
                        <>
                          <Copy size={16} />
                          Copiar código PIX
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
              
              {/* Boleto */}
              {status.paymentStatus === 'pending' && (
                <div className="bg-brand-gray-50 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <FileText className="w-6 h-6 text-brand-orange" />
                    <h2 className="font-semibold text-brand-gray-900">Boleto Bancário</h2>
                  </div>
                  
                  <p className="text-sm text-brand-gray-600 mb-4">
                    O boleto foi gerado e enviado para seu email. Você também pode acessá-lo pelo link abaixo:
                  </p>
                  
                  <Button variant="outline" className="w-full">
                    <FileText size={18} />
                    Visualizar Boleto
                  </Button>
                </div>
              )}
              
              {/* Credit Card Processing */}
              {status.paymentStatus === 'pending' && (
                <div className="bg-brand-gray-50 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <CreditCard className="w-6 h-6 text-brand-orange" />
                    <h2 className="font-semibold text-brand-gray-900">Processando Cartão</h2>
                  </div>
                  
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-8 h-8 text-brand-orange animate-spin" />
                  </div>
                  
                  <p className="text-sm text-brand-gray-600 text-center">
                    Estamos processando seu pagamento. Isso pode levar alguns instantes.
                  </p>
                </div>
              )}
            </div>
            
            {/* Info */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700 text-center">
                Esta página atualiza automaticamente. Não feche até o pagamento ser confirmado.
              </p>
            </div>
            
            {/* Cancel Option */}
            <div className="mt-6 text-center">
              <button
                onClick={() => router.push('/marketplace')}
                className="text-sm text-brand-gray-500 hover:text-brand-gray-700"
              >
                Cancelar e voltar para a loja
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function PaymentStatusPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-brand-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-brand-orange animate-spin mx-auto mb-4" />
          <p className="text-brand-gray-600">Carregando...</p>
        </div>
      </div>
    }>
      <PaymentStatusContent />
    </Suspense>
  )
}
