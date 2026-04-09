'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { updateCourseAction } from '@/lib/actions/courses'
import { updateCourseCompleteInfoAction } from '@/lib/actions/admin'
import type { AdminCourse } from '@/types/database'

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

interface EditAdminCourseClientProps {
  course: AdminCourse
}

export function EditAdminCourseClient({ course }: EditAdminCourseClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialTab = searchParams.get('tab') === 'complete' ? 'complete' : 'basic'
  
  const [activeTab, setActiveTab] = useState<'basic' | 'complete'>(initialTab)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  
  // Estados para aba completa
  const [checkoutUrl, setCheckoutUrl] = useState(course.checkout_url || '')
  const [memberAreaConfigured, setMemberAreaConfigured] = useState(course.member_area_configured)
  
  // Calcular progresso
  const calculateProgress = () => {
    let completed = 0
    let total = 5
    
    if (course.checkout_url && course.checkout_url !== '') completed++
    if (course.member_area_configured) completed++
    if (course.full_description && course.full_description !== '') completed++
    if (course.image_url && course.image_url !== '') completed++
    if (course.category && course.category !== '') completed++
    
    return Math.round((completed / total) * 100)
  }
  
  const progress = calculateProgress()
  
  async function handleUpdateBasic(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    
    const formData = new FormData(e.currentTarget)
    const result = await updateCourseAction(course.id, formData)
    
    if ('error' in result) {
      setError(result.error)
    } else {
      setSuccessMessage('Informações básicas atualizadas com sucesso!')
      setTimeout(() => router.refresh(), 1000)
    }
    setIsSubmitting(false)
  }
  
  async function handleUpdateComplete() {
    setIsSubmitting(true)
    setError(null)
    
    const result = await updateCourseCompleteInfoAction(course.id, {
      checkout_url: checkoutUrl,
      member_area_configured: memberAreaConfigured
    })
    
    if ('error' in result) {
      setError(result.error)
    } else {
      setSuccessMessage('Informações completas atualizadas com sucesso!')
      setTimeout(() => router.refresh(), 1000)
    }
    setIsSubmitting(false)
  }
  
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/courses">
            <Button variant="ghost" size="sm">
              <ArrowLeft size={18} />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-brand-gray-900">Editar Curso</h1>
            <p className="text-sm text-brand-gray-500">{course.title}</p>
          </div>
        </div>
        
        <Badge variant={course.is_complete ? 'success' : 'default'}>
          {course.is_complete ? 'Completo' : 'Incompleto'}
        </Badge>
      </div>
      
      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700 mb-6 flex items-start gap-2">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-700 mb-6 flex items-start gap-2">
          <CheckCircle size={16} className="mt-0.5 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}
      
      {/* Tabs */}
      <div className="border-b border-brand-gray-200 mb-6">
        <nav className="flex gap-6">
          <button
            onClick={() => setActiveTab('basic')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'basic'
                ? 'border-brand-orange text-brand-orange'
                : 'border-transparent text-brand-gray-500 hover:text-brand-gray-700'
            }`}
          >
            Informações Básicas
          </button>
          <button
            onClick={() => setActiveTab('complete')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'complete'
                ? 'border-brand-orange text-brand-orange'
                : 'border-transparent text-brand-gray-500 hover:text-brand-gray-700'
            }`}
          >
            Informações Completas
            {!course.is_complete && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded-full">
                Pendente
              </span>
            )}
          </button>
        </nav>
      </div>
      
      {/* Basic Info Tab */}
      {activeTab === 'basic' && (
        <form onSubmit={handleUpdateBasic} className="space-y-6">
          <div className="bg-white rounded-xl border border-brand-gray-200 p-6 space-y-6">
            <Input
              name="title"
              label="Nome do Produto *"
              defaultValue={course.title}
              required
            />
            
            <Textarea
              name="full_description"
              label="Descrição Completa do Produto *"
              defaultValue={course.full_description || ''}
              rows={6}
              required
            />
            
            <Select
              name="category"
              label="Categoria do Produto *"
              options={categoryOptions}
              defaultValue={course.category || ''}
              required
            />
            
            <Input
              name="price"
              label="Valor do Curso (R$)"
              type="number"
              min="0"
              step="0.01"
              defaultValue={course.price}
            />
          </div>
          
          <div className="flex items-center justify-end gap-3">
            <Link href="/admin/courses">
              <Button type="button" variant="ghost">
                Cancelar
              </Button>
            </Link>
            <Button type="submit" loading={isSubmitting}>
              <Save size={18} />
              Salvar Alterações
            </Button>
          </div>
        </form>
      )}
      
      {/* Complete Info Tab */}
      {activeTab === 'complete' && (
        <div className="space-y-6">
          {/* Progress Indicator */}
          <div className="bg-white rounded-xl border border-brand-gray-200 p-6">
            <h3 className="font-medium text-brand-gray-900 mb-4">Progresso de Conclusão</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-brand-gray-600">{progress}% completo</span>
                <span className="text-sm font-medium text-brand-gray-900">{progress === 100 ? 'Pronto para publicar!' : 'Faltam informações'}</span>
              </div>
              <div className="w-full bg-brand-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all ${progress === 100 ? 'bg-green-500' : 'bg-brand-orange'}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
          
          {/* Complete Info Form */}
          <div className="bg-white rounded-xl border border-brand-gray-200 p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-brand-gray-700 mb-2">
                Link de Checkout *
              </label>
              <Input
                value={checkoutUrl}
                onChange={(e) => setCheckoutUrl(e.target.value)}
                placeholder="https://asaas.com/checkout/..."
                helperText="Cole aqui o link de checkout gerado pelo Asaas"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-brand-gray-700 mb-3">
                Área de Membros *
              </label>
              <div className="space-y-3">
                <div className={`p-4 rounded-lg border-2 ${memberAreaConfigured ? 'border-green-500 bg-green-50' : 'border-brand-gray-200'}`}>
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={memberAreaConfigured}
                      onChange={(e) => setMemberAreaConfigured(e.target.checked)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-brand-gray-900">
                        {memberAreaConfigured ? 'Área de Membros Configurada' : 'Marcar como Configurada'}
                      </div>
                      <p className="text-sm text-brand-gray-500 mt-1">
                        Clique na opção acima após configurar a área de membros do curso
                      </p>
                    </div>
                  </div>
                </div>
                
                <Link href={`/admin/courses/${course.id}/member-area`}>
                  <Button variant="outline" className="w-full">
                    <ExternalLink size={16} className="mr-2" />
                    Configurar Área de Membros
                  </Button>
                </Link>
              </div>
            </div>
            
            {/* Checklist */}
            <div className="border-t border-brand-gray-200 pt-6">
              <h4 className="font-medium text-brand-gray-900 mb-3">Checklist de Publicação</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  {course.full_description && course.full_description !== '' ? (
                    <CheckCircle size={16} className="text-green-500" />
                  ) : (
                    <AlertCircle size={16} className="text-yellow-500" />
                  )}
                  <span className={course.full_description && course.full_description !== '' ? 'text-green-700' : 'text-yellow-700'}>
                    Descrição completa preenchida
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {course.image_url && course.image_url !== '' ? (
                    <CheckCircle size={16} className="text-green-500" />
                  ) : (
                    <AlertCircle size={16} className="text-yellow-500" />
                  )}
                  <span className={course.image_url && course.image_url !== '' ? 'text-green-700' : 'text-yellow-700'}>
                    Imagem do produto adicionada
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {course.category && course.category !== '' ? (
                    <CheckCircle size={16} className="text-green-500" />
                  ) : (
                    <AlertCircle size={16} className="text-yellow-500" />
                  )}
                  <span className={course.category && course.category !== '' ? 'text-green-700' : 'text-yellow-700'}>
                    Categoria selecionada
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {checkoutUrl && checkoutUrl !== '' ? (
                    <CheckCircle size={16} className="text-green-500" />
                  ) : (
                    <AlertCircle size={16} className="text-yellow-500" />
                  )}
                  <span className={checkoutUrl && checkoutUrl !== '' ? 'text-green-700' : 'text-yellow-700'}>
                    Link de checkout adicionado
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {memberAreaConfigured ? (
                    <CheckCircle size={16} className="text-green-500" />
                  ) : (
                    <AlertCircle size={16} className="text-yellow-500" />
                  )}
                  <span className={memberAreaConfigured ? 'text-green-700' : 'text-yellow-700'}>
                    Área de membros configurada
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-end gap-3">
            <Link href="/admin/courses">
              <Button type="button" variant="ghost">
                Voltar
              </Button>
            </Link>
            <Button 
              onClick={handleUpdateComplete} 
              loading={isSubmitting}
              disabled={!checkoutUrl || !memberAreaConfigured}
            >
              <Save size={18} />
              Salvar e Continuar
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
