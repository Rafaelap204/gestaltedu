'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Upload, X, ImageIcon, Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { createAdminCourseAction } from '@/lib/actions/admin'
import { uploadFile } from '@/lib/utils/storage'

const categoryOptions = [
  { value: 'saude_esportes', label: 'Saúde e Esportes' },
  { value: 'financas_investimentos', label: 'Finanças e Investimentos' },
  { value: 'relacionamentos', label: 'Relacionamentos' },
  { value: 'negocios_carreira', label: 'Negócios e Carreira' },
  { value: 'espiritualidade', label: 'Espiritualidade' },
  { value: 'sexualidade', label: 'Sexualidade' },
  { value: 'entretenimento', label: 'Entretenimento' },
  { value: 'culinaria_gastronomia', label: 'Culinária e Gastronomia' },
  { value: 'idiomas', label: 'Idiomas' },
  { value: 'direito', label: 'Direito' },
  { value: 'apps_software', label: 'Apps & Software' },
  { value: 'literatura', label: 'Literatura' },
  { value: 'casa_construcao', label: 'Casa e Construção' },
  { value: 'desenvolvimento_pessoal', label: 'Desenvolvimento Pessoal' },
  { value: 'moda_beleza', label: 'Moda e Beleza' },
  { value: 'animais_plantas', label: 'Animais e Plantas' },
  { value: 'educacional', label: 'Educacional' },
  { value: 'hobbies', label: 'Hobbies' },
  { value: 'design', label: 'Design' },
  { value: 'internet', label: 'Internet' },
  { value: 'ecologia_meio_ambiente', label: 'Ecologia e Meio Ambiente' },
  { value: 'musica_artes', label: 'Música e Artes' },
  { value: 'tecnologia_informacao', label: 'Tecnologia da Informação' },
  { value: 'outros', label: 'Outros' },
  { value: 'empreendedorismo_digital', label: 'Empreendedorismo Digital' },
]

const paymentMethodOptions = [
  { value: 'credit_card', label: 'Cartão de Crédito' },
  { value: 'debit_card', label: 'Cartão de Débito' },
  { value: 'pix', label: 'PIX' },
  { value: 'boleto', label: 'Boleto' },
]

export default function NewAdminCoursePage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  
  // Estados do formulário
  const [refundPeriod, setRefundPeriod] = useState<number>(7)
  const [isProgressive, setIsProgressive] = useState(false)
  const [releaseDays, setReleaseDays] = useState<number>(7)
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<string[]>(['credit_card'])
  const [price, setPrice] = useState<string>('30')
  
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    
    const formData = new FormData(e.currentTarget)
    
    // Adiciona campos adicionais ao formData
    formData.set('image_url', imageUrl || '')
    formData.set('refund_period', refundPeriod.toString())
    formData.set('content_release_strategy', isProgressive ? 'progressive' : 'immediate')
    if (isProgressive) {
      formData.set('content_release_days', releaseDays.toString())
    }
    formData.set('payment_methods', JSON.stringify(selectedPaymentMethods))
    formData.set('price', price)
    
    const result = await createAdminCourseAction(formData)
    
    if ('error' in result) {
      setError(result.error)
      setIsSubmitting(false)
    } else {
      router.push('/admin/courses')
    }
  }
  
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Validações
    if (!file.type.startsWith('image/')) {
      setError('O arquivo deve ser uma imagem')
      return
    }
    
    if (file.size > 5 * 1024 * 1024) {
      setError('A imagem deve ter no máximo 5MB')
      return
    }
    
    setIsUploading(true)
    setError(null)
    
    const path = `course-images/${Date.now()}-${file.name}`
    const result = await uploadFile('course-images', path, file)
    
    if ('error' in result) {
      setError(result.error)
    } else {
      setImageUrl(result.url)
    }
    
    setIsUploading(false)
  }
  
  function removeImage() {
    setImageUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }
  
  function togglePaymentMethod(method: string) {
    setSelectedPaymentMethods(prev => 
      prev.includes(method) 
        ? prev.filter(m => m !== method)
        : [...prev, method]
    )
  }
  
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/courses">
          <Button variant="ghost" size="sm">
            <ArrowLeft size={18} />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-brand-gray-900">Novo Curso - Admin</h1>
          <p className="text-sm text-brand-gray-500">
            Crie um curso exclusivo da administração
          </p>
        </div>
      </div>
      
      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
            {error}
          </div>
        )}
        
        <div className="bg-white rounded-xl border border-brand-gray-200 p-6 space-y-6">
          <h2 className="text-lg font-semibold text-brand-gray-900">Informações Básicas</h2>
          
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-brand-gray-700 mb-3">
              Imagem do Produto *
            </label>
            
            {imageUrl ? (
              <div className="relative w-full max-w-md aspect-square rounded-lg overflow-hidden bg-brand-gray-100">
                <img
                  src={imageUrl}
                  alt="Imagem do curso"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full max-w-md aspect-square rounded-lg border-2 border-dashed border-brand-gray-300 hover:border-brand-orange transition-colors flex flex-col items-center justify-center gap-3 text-brand-gray-500 hover:text-brand-orange"
              >
                {isUploading ? (
                  <>
                    <div className="w-8 h-8 border-2 border-brand-orange border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm">Enviando...</span>
                  </>
                ) : (
                  <>
                    <ImageIcon size={32} />
                    <span className="text-sm">Clique para fazer upload da imagem</span>
                    <span className="text-xs text-brand-gray-400">
                      PNG, JPG ou WEBP (máx. 5MB, recomendado 600x600px)
                    </span>
                  </>
                )}
              </button>
            )}
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>
          
          {/* Title */}
          <Input
            name="title"
            label="Nome do Produto *"
            placeholder="Ex: Curso Completo de Marketing Digital"
            required
          />
          
          {/* Full Description */}
          <Textarea
            name="full_description"
            label="Descrição Completa do Produto *"
            placeholder="Descrição detalhada do curso, o que os alunos vão aprender, benefícios..."
            rows={6}
            required
          />
          
          {/* Category */}
          <Select
            name="category"
            label="Categoria do Produto *"
            options={categoryOptions}
            placeholder="Selecione uma categoria"
            required
          />
          
          {/* Refund Period */}
          <div>
            <label className="block text-sm font-medium text-brand-gray-700 mb-3">
              Prazo de Reembolso *
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[7, 15, 30].map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setRefundPeriod(days)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    refundPeriod === days
                      ? 'border-brand-orange bg-brand-orange/5 text-brand-orange'
                      : 'border-brand-gray-200 hover:border-brand-gray-300'
                  }`}
                >
                  <div className="text-2xl font-bold">{days}</div>
                  <div className="text-sm">dias</div>
                </button>
              ))}
            </div>
          </div>
          
          {/* Content Release Strategy */}
          <div>
            <label className="block text-sm font-medium text-brand-gray-700 mb-3">
              Estratégia de Liberação de Conteúdo
            </label>
            <div className="space-y-3">
              <label className="flex items-start gap-3 p-4 rounded-lg border-2 border-brand-gray-200 cursor-pointer hover:border-brand-gray-300 transition-all">
                <input
                  type="radio"
                  checked={!isProgressive}
                  onChange={() => setIsProgressive(false)}
                  className="mt-1"
                />
                <div>
                  <div className="font-medium">Liberação Imediata</div>
                  <div className="text-sm text-brand-gray-500">
                    Todo o conteúdo disponível imediatamente após a compra
                  </div>
                </div>
              </label>
              
              <label className="flex items-start gap-3 p-4 rounded-lg border-2 border-brand-gray-200 cursor-pointer hover:border-brand-gray-300 transition-all">
                <input
                  type="radio"
                  checked={isProgressive}
                  onChange={() => setIsProgressive(true)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="font-medium">Liberação Progressiva</div>
                  <div className="text-sm text-brand-gray-500 mb-3">
                    Libere o conteúdo gradualmente para evitar reembolsos
                  </div>
                  {isProgressive && (
                    <div className="mt-3">
                      <Input
                        type="number"
                        min="1"
                        value={releaseDays}
                        onChange={(e) => setReleaseDays(parseInt(e.target.value) || 1)}
                        label="Número de dias para liberação completa"
                        helperText="Estratégia anti-reembolso: libere o conteúdo durante o período de reembolso"
                      />
                    </div>
                  )}
                </div>
              </label>
            </div>
          </div>
          
          {/* Payment Methods */}
          <div>
            <label className="block text-sm font-medium text-brand-gray-700 mb-3">
              Formas de Pagamento *
            </label>
            <div className="grid grid-cols-2 gap-3">
              {paymentMethodOptions.map((method) => (
                <label
                  key={method.value}
                  className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedPaymentMethods.includes(method.value)
                      ? 'border-brand-orange bg-brand-orange/5'
                      : 'border-brand-gray-200 hover:border-brand-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedPaymentMethods.includes(method.value)}
                    onChange={() => togglePaymentMethod(method.value)}
                    className="w-4 h-4"
                  />
                  <span className="font-medium">{method.label}</span>
                  {selectedPaymentMethods.includes(method.value) && (
                    <Check size={16} className="ml-auto text-brand-orange" />
                  )}
                </label>
              ))}
            </div>
          </div>
          
          {/* Price */}
          <div>
            <Input
              label="Valor do Curso (R$) *"
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="30,00"
              helperText="Valor mínimo de R$ 30,00 para cursos pagos. Deixe 0 para gratuito."
              required
            />
            {parseFloat(price) > 0 && parseFloat(price) < 30 && (
              <p className="text-sm text-red-600 mt-1">
                O valor mínimo para cursos pagos é R$ 30,00
              </p>
            )}
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Link href="/admin/courses">
            <Button type="button" variant="ghost">
              Cancelar
            </Button>
          </Link>
          <Button 
            type="submit" 
            loading={isSubmitting}
            disabled={!imageUrl || selectedPaymentMethods.length === 0 || (parseFloat(price) > 0 && parseFloat(price) < 30)}
          >
            <Upload size={18} />
            Salvar Rascunho
          </Button>
        </div>
      </form>
    </div>
  )
}
