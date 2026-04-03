'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Input, Card, CardContent } from '@/components/ui'
import { createCheckoutAction } from '@/lib/actions/checkout'
import { formatPrice } from '@/lib/utils/format'
import { getReferralCookie } from '@/lib/utils/referral'
import { CreditCard, QrCode, FileText, Lock, Shield, CheckCircle } from 'lucide-react'

interface Course {
  id: string
  title: string
  price: number
  thumbnail_url: string | null
}

interface CheckoutFormProps {
  course: Course
  userEmail: string | null
  userName: string | null
}

type PaymentMethod = 'PIX' | 'CREDIT_CARD' | 'BOLETO'

// Simple CPF/CNPJ mask
function formatCpfCnpj(value: string): string {
  const cleaned = value.replace(/\D/g, '')
  if (cleaned.length <= 11) {
    // CPF: 000.000.000-00
    return cleaned
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  } else {
    // CNPJ: 00.000.000/0000-00
    return cleaned
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
  }
}

// Phone mask
function formatPhone(value: string): string {
  const cleaned = value.replace(/\D/g, '')
  if (cleaned.length <= 10) {
    return cleaned
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
  } else {
    return cleaned
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
  }
}

// Credit card number mask
function formatCardNumber(value: string): string {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{4})(\d)/, '$1 $2')
    .replace(/(\d{4})(\d)/, '$1 $2')
    .replace(/(\d{4})(\d)/, '$1 $2')
    .slice(0, 19)
}

// CEP mask
function formatCep(value: string): string {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .slice(0, 9)
}

export function CheckoutForm({ course, userEmail, userName }: CheckoutFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PIX')
  
  // Form fields
  const [name, setName] = useState(userName || '')
  const [email, setEmail] = useState(userEmail || '')
  const [cpfCnpj, setCpfCnpj] = useState('')
  const [phone, setPhone] = useState('')
  
  // Credit card fields
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvv, setCardCvv] = useState('')
  const [cardHolderName, setCardHolderName] = useState('')
  const [cep, setCep] = useState('')
  const [addressNumber, setAddressNumber] = useState('')
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      const refCode = getReferralCookie()
      
      const result = await createCheckoutAction({
        courseId: course.id,
        name,
        email,
        cpfCnpj: cpfCnpj.replace(/\D/g, ''),
        phone: phone.replace(/\D/g, '') || undefined,
        billingType: paymentMethod,
        creditCard: paymentMethod === 'CREDIT_CARD' ? {
          holderName: cardHolderName,
          number: cardNumber.replace(/\s/g, ''),
          expiryMonth: cardExpiry.split('/')[0] || '',
          expiryYear: cardExpiry.split('/')[1] || '',
          ccv: cardCvv,
        } : undefined,
        creditCardHolderInfo: paymentMethod === 'CREDIT_CARD' ? {
          name,
          email,
          cpfCnpj: cpfCnpj.replace(/\D/g, ''),
          phone: phone.replace(/\D/g, '') || '',
          postalCode: cep.replace(/\D/g, ''),
          addressNumber,
        } : undefined,
        refCode: refCode || undefined,
      })
      
      if ('error' in result) {
        setError(result.error)
        setLoading(false)
        return
      }
      
      // Redirect to status page
      router.push(`/checkout/${course.id}/status?orderId=${result.orderId}`)
    } catch (err) {
      setError('Erro ao processar pagamento. Tente novamente.')
      setLoading(false)
    }
  }
  
  const paymentMethods = [
    { id: 'PIX' as PaymentMethod, label: 'PIX', icon: QrCode },
    { id: 'CREDIT_CARD' as PaymentMethod, label: 'Cartão de Crédito', icon: CreditCard },
    { id: 'BOLETO' as PaymentMethod, label: 'Boleto', icon: FileText },
  ]
  
  return (
    <div className="min-h-screen bg-brand-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-brand-gray-900">Finalizar Compra</h1>
          <p className="text-brand-gray-600 mt-1">Complete seus dados para adquirir o curso</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Info */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold text-brand-gray-900 mb-4">
                    Dados Pessoais
                  </h2>
                  
                  <div className="space-y-4">
                    <Input
                      label="Nome completo"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      placeholder="Seu nome completo"
                    />
                    
                    <Input
                      label="Email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="seu@email.com"
                    />
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="CPF/CNPJ"
                        value={cpfCnpj}
                        onChange={(e) => setCpfCnpj(formatCpfCnpj(e.target.value))}
                        required
                        placeholder="000.000.000-00"
                        maxLength={18}
                      />
                      
                      <Input
                        label="Telefone (opcional)"
                        value={phone}
                        onChange={(e) => setPhone(formatPhone(e.target.value))}
                        placeholder="(00) 00000-0000"
                        maxLength={15}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Payment Method */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold text-brand-gray-900 mb-4">
                    Forma de Pagamento
                  </h2>
                  
                  {/* Payment Method Tabs */}
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    {paymentMethods.map((method) => {
                      const Icon = method.icon
                      return (
                        <button
                          key={method.id}
                          type="button"
                          onClick={() => setPaymentMethod(method.id)}
                          className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all ${
                            paymentMethod === method.id
                              ? 'border-brand-orange bg-brand-orange-light'
                              : 'border-brand-gray-200 hover:border-brand-gray-300'
                          }`}
                        >
                          <Icon
                            size={24}
                            className={
                              paymentMethod === method.id
                                ? 'text-brand-orange'
                                : 'text-brand-gray-500'
                            }
                          />
                          <span
                            className={`text-sm font-medium mt-2 ${
                              paymentMethod === method.id
                                ? 'text-brand-orange'
                                : 'text-brand-gray-600'
                            }`}
                          >
                            {method.label}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                  
                  {/* Credit Card Fields */}
                  {paymentMethod === 'CREDIT_CARD' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                      <Input
                        label="Número do Cartão"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                        required
                        placeholder="0000 0000 0000 0000"
                        maxLength={19}
                      />
                      
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          label="Validade"
                          value={cardExpiry}
                          onChange={(e) => {
                            let value = e.target.value.replace(/\D/g, '')
                            if (value.length >= 2) {
                              value = value.slice(0, 2) + '/' + value.slice(2, 4)
                            }
                            setCardExpiry(value)
                          }}
                          required
                          placeholder="MM/AA"
                          maxLength={5}
                        />
                        
                        <Input
                          label="CVV"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                          required
                          placeholder="123"
                          maxLength={4}
                        />
                      </div>
                      
                      <Input
                        label="Nome no Cartão"
                        value={cardHolderName}
                        onChange={(e) => setCardHolderName(e.target.value.toUpperCase())}
                        required
                        placeholder="NOME COMO ESTÁ NO CARTÃO"
                      />
                      
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          label="CEP"
                          value={cep}
                          onChange={(e) => setCep(formatCep(e.target.value))}
                          required
                          placeholder="00000-000"
                          maxLength={9}
                        />
                        
                        <Input
                          label="Número"
                          value={addressNumber}
                          onChange={(e) => setAddressNumber(e.target.value)}
                          required
                          placeholder="123"
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* PIX Info */}
                  {paymentMethod === 'PIX' && (
                    <div className="bg-brand-orange-light rounded-lg p-4 text-center">
                      <QrCode className="w-12 h-12 text-brand-orange mx-auto mb-2" />
                      <p className="text-sm text-brand-gray-700">
                        Após confirmar, você verá o QR Code para pagamento
                      </p>
                    </div>
                  )}
                  
                  {/* Boleto Info */}
                  {paymentMethod === 'BOLETO' && (
                    <div className="bg-brand-gray-100 rounded-lg p-4 text-center">
                      <FileText className="w-12 h-12 text-brand-gray-500 mx-auto mb-2" />
                      <p className="text-sm text-brand-gray-700">
                        O boleto será gerado e você poderá imprimir ou copiar o código
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
              
              {/* Security Badge */}
              <div className="flex items-center justify-center gap-2 text-sm text-brand-gray-500">
                <Lock size={16} />
                <span>Pagamento seguro processado por Asaas</span>
              </div>
              
              {/* Submit Button - Mobile Only */}
              <div className="lg:hidden">
                <Button
                  type="submit"
                  size="lg"
                  loading={loading}
                  className="w-full"
                >
                  Pagar {formatPrice(course.price)}
                </Button>
              </div>
            </form>
          </div>
          
          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold text-brand-gray-900 mb-4">
                    Resumo do Pedido
                  </h2>
                  
                  {/* Course Info */}
                  <div className="flex gap-4 mb-6">
                    <div className="w-20 h-20 bg-brand-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
                      {course.thumbnail_url ? (
                        <img
                          src={course.thumbnail_url}
                          alt={course.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-brand-gray-400">
                          <span className="text-xs">Sem imagem</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium text-brand-gray-900 line-clamp-2">
                        {course.title}
                      </h3>
                    </div>
                  </div>
                  
                  {/* Price Breakdown */}
                  <div className="space-y-3 border-t border-brand-gray-100 pt-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-brand-gray-600">Subtotal</span>
                      <span className="text-brand-gray-900">{formatPrice(course.price)}</span>
                    </div>
                    
                    <div className="flex justify-between text-lg font-semibold pt-3 border-t border-brand-gray-100">
                      <span className="text-brand-gray-900">Total</span>
                      <span className="text-brand-orange">{formatPrice(course.price)}</span>
                    </div>
                  </div>
                  
                  {/* Submit Button - Desktop */}
                  <div className="hidden lg:block mt-6">
                    <Button
                      type="submit"
                      form="checkout-form"
                      size="lg"
                      loading={loading}
                      className="w-full"
                      onClick={handleSubmit}
                    >
                      Pagar {formatPrice(course.price)}
                    </Button>
                  </div>
                  
                  {/* Guarantees */}
                  <div className="mt-6 space-y-3">
                    <div className="flex items-center gap-2 text-sm text-brand-gray-600">
                      <Shield size={16} className="text-green-500" />
                      <span>Pagamento seguro</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-brand-gray-600">
                      <CheckCircle size={16} className="text-green-500" />
                      <span>Acesso imediato após confirmação</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
