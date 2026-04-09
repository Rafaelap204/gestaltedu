'use client'

import { useState, useTransition } from 'react'
import { Video, FileText, Download, Plus, Loader2 } from 'lucide-react'
import { updateLessonContent } from '@/lib/actions/members-area'
import type { LessonMaterial, LessonContentType } from '@/types/database'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Modal } from '@/components/ui/Modal'

interface LessonEditorProps {
  lessonId: string
  lessonTitle: string
  videoUrl: string | null
  videoProvider: string | null
  materials: LessonMaterial[]
  onClose: () => void
  onSave: (updatedData: { video_url: string | null; video_provider: string | null; materials: LessonMaterial[] }) => void
}

export function LessonEditor({
  lessonId,
  lessonTitle,
  videoUrl: initialVideoUrl,
  videoProvider: initialVideoProvider,
  materials: initialMaterials,
  onClose,
  onSave,
}: LessonEditorProps) {
  const [isPending, startTransition] = useTransition()
  const [videoUrl, setVideoUrl] = useState(initialVideoUrl || '')
  const [videoProvider, setVideoProvider] = useState(initialVideoProvider || 'youtube')
  const [materials, setMaterials] = useState<LessonMaterial[]>(initialMaterials || [])
  const [activeTab, setActiveTab] = useState<'video' | 'materials'>(
    initialVideoUrl ? 'video' : 'materials'
  )

  // Determine lesson content type based on current data
  const getContentType = (): LessonContentType => {
    if (videoUrl) return 'video'
    if (materials.length > 0) return materials[0].contentType
    return 'video'
  }

  const [contentType, setContentType] = useState<LessonContentType>(getContentType())

  const handleSave = () => {
    startTransition(async () => {
      const data: Record<string, unknown> = {}

      if (contentType === 'video') {
        data.video_url = videoUrl || null
        data.video_provider = videoUrl ? videoProvider : null
        data.materials = materials
      } else {
        data.video_url = null
        data.video_provider = null
        data.materials = materials
      }

      const result = await updateLessonContent(lessonId, data as Parameters<typeof updateLessonContent>[1])
      if ('success' in result) {
        onSave({
          video_url: (data.video_url as string) || null,
          video_provider: (data.video_provider as string) || null,
          materials: (data.materials as LessonMaterial[]) || [],
        })
        onClose()
      }
    })
  }

  const addMaterial = (type: LessonContentType) => {
    const newMaterial: LessonMaterial = {
      name: '',
      type: type === 'ebook' ? 'ebook' : type === 'text' ? 'text' : 'pdf',
      contentType: type,
      ...(type === 'text' ? { content: '' } : { url: '' }),
    }
    setMaterials(prev => [...prev, newMaterial])
  }

  const updateMaterial = (index: number, updates: Partial<LessonMaterial>) => {
    setMaterials(prev => prev.map((m, i) => i === index ? { ...m, ...updates } : m))
  }

  const removeMaterial = (index: number) => {
    setMaterials(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Editar: ${lessonTitle}`}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending && <Loader2 size={18} className="animate-spin" />}
            Salvar
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Content Type Selection */}
        <div>
          <label className="block text-sm font-medium text-brand-gray-700 mb-2">
            Tipo de Conteúdo Principal
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'video' as const, label: 'Vídeo', icon: Video, desc: 'YouTube, Vimeo ou Panda Video' },
              { value: 'ebook' as const, label: 'Ebook', icon: FileText, desc: 'PDF para leitura' },
              { value: 'text' as const, label: 'Texto/Artigo', icon: FileText, desc: 'Conteúdo em texto' },
              { value: 'resource' as const, label: 'Recurso', icon: Download, desc: 'Material para download' },
            ].map((type) => {
              const TypeIcon = type.icon
              return (
                <button
                  key={type.value}
                  onClick={() => setContentType(type.value)}
                  className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                    contentType === type.value
                      ? 'border-brand-orange bg-brand-orange/5 text-brand-orange'
                      : 'border-brand-gray-200 hover:border-brand-gray-300 text-brand-gray-700'
                  }`}
                >
                  <TypeIcon size={20} />
                  <div>
                    <p className="text-sm font-medium">{type.label}</p>
                    <p className="text-xs text-brand-gray-500">{type.desc}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Video Content */}
        {contentType === 'video' && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-brand-gray-700 mb-1.5">
                Provedor de Vídeo
              </label>
              <div className="flex gap-2">
                {[
                  { value: 'youtube', label: 'YouTube' },
                  { value: 'vimeo', label: 'Vimeo' },
                  { value: 'panda', label: 'Panda Video' },
                ].map((provider) => (
                  <button
                    key={provider.value}
                    onClick={() => setVideoProvider(provider.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      videoProvider === provider.value
                        ? 'bg-brand-orange text-white'
                        : 'bg-brand-gray-100 text-brand-gray-600 hover:bg-brand-gray-200'
                    }`}
                  >
                    {provider.label}
                  </button>
                ))}
              </div>
            </div>
            <Input
              label="URL do Vídeo"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder={
                videoProvider === 'youtube'
                  ? 'https://youtube.com/watch?v=...'
                  : videoProvider === 'vimeo'
                  ? 'https://vimeo.com/...'
                  : 'https://player-panda.b-cdn.net/...'
              }
            />
          </div>
        )}

        {/* Materials Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-brand-gray-700">
              Materiais Adicionais
            </label>
            <div className="flex gap-1">
              <button
                onClick={() => addMaterial('ebook')}
                className="text-xs px-2 py-1 bg-purple-50 text-purple-600 rounded hover:bg-purple-100 transition-colors"
              >
                + Ebook
              </button>
              <button
                onClick={() => addMaterial('text')}
                className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded hover:bg-green-100 transition-colors"
              >
                + Texto
              </button>
              <button
                onClick={() => addMaterial('resource')}
                className="text-xs px-2 py-1 bg-yellow-50 text-yellow-600 rounded hover:bg-yellow-100 transition-colors"
              >
                + Recurso
              </button>
            </div>
          </div>

          {materials.length === 0 && contentType !== 'video' ? (
            <div className="text-center py-6 bg-brand-gray-50 rounded-lg border border-dashed border-brand-gray-300">
              <p className="text-sm text-brand-gray-500">
                Adicione materiais usando os botões acima
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {materials.map((material, index) => (
                <div
                  key={index}
                  className="p-3 border border-brand-gray-200 rounded-lg space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      material.contentType === 'ebook'
                        ? 'bg-purple-100 text-purple-700'
                        : material.contentType === 'text'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {material.contentType === 'ebook' ? 'Ebook' : material.contentType === 'text' ? 'Texto' : 'Recurso'}
                    </span>
                    <button
                      onClick={() => removeMaterial(index)}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Remover
                    </button>
                  </div>
                  <Input
                    value={material.name}
                    onChange={(e) => updateMaterial(index, { name: e.target.value })}
                    placeholder="Nome do material"
                  />
                  {material.contentType === 'text' ? (
                    <Textarea
                      value={material.content || ''}
                      onChange={(e) => updateMaterial(index, { content: e.target.value })}
                      placeholder="Conteúdo em Markdown..."
                      rows={4}
                    />
                  ) : (
                    <Input
                      value={material.url || ''}
                      onChange={(e) => updateMaterial(index, { url: e.target.value })}
                      placeholder="URL do arquivo"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
