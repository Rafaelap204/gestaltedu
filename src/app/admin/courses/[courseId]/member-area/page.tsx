'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { updateCourseCompleteInfoAction } from '@/lib/actions/admin'

export default function MemberAreaConfigPage({ params }: { params: Promise<{ courseId: string }> }) {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [courseId, setCourseId] = useState<string>('')
  
  useState(() => {
    params.then(p => setCourseId(p.courseId))
  })
  
  async function handleSave() {
    if (!courseId) return
    
    setIsSaving(true)
    const result = await updateCourseCompleteInfoAction(courseId, { 
      member_area_configured: true 
    })
    
    if ('success' in result) {
      router.push(`/admin/courses/${courseId}/edit?tab=complete`)
    }
    setIsSaving(false)
  }
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/admin/courses/${courseId}/edit?tab=complete`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft size={18} />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-brand-gray-900">Configurar Área de Membros</h1>
          <p className="text-sm text-brand-gray-500">Em desenvolvimento</p>
        </div>
      </div>
      
      <div className="bg-white rounded-xl border border-brand-gray-200 p-8 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-brand-orange/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Save size={32} className="text-brand-orange" />
          </div>
          
          <h2 className="text-xl font-semibold text-brand-gray-900 mb-3">
            Configuração em Desenvolvimento
          </h2>
          
          <p className="text-brand-gray-600 mb-6">
            A configuração detalhada da área de membros estará disponível em breve.
            Por enquanto, você pode marcar como configurada para prosseguir com a publicação do curso.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href={`/admin/courses/${courseId}/edit?tab=complete`}>
              <Button variant="ghost">
                Voltar para Edição
              </Button>
            </Link>
            <Button onClick={handleSave} loading={isSaving}>
              <Save size={18} />
              Marcar como Configurada
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
