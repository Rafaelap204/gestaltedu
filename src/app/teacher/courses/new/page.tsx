'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Upload, X, ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { createCourseAction } from '@/lib/actions/courses'
import { uploadFile } from '@/lib/utils/storage'

const categoryOptions = [
  { value: 'tecnologia', label: 'Tecnologia' },
  { value: 'negocios', label: 'Negócios' },
  { value: 'design', label: 'Design' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'idiomas', label: 'Idiomas' },
  { value: 'saude', label: 'Saúde' },
  { value: 'outro', label: 'Outro' },
]

const levelOptions = [
  { value: 'iniciante', label: 'Iniciante' },
  { value: 'intermediario', label: 'Intermediário' },
  { value: 'avancado', label: 'Avançado' },
]

export default function NewCoursePage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)
  const [shortDescriptionLength, setShortDescriptionLength] = useState(0)
  
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    
    const formData = new FormData(e.currentTarget)
    
    // Adiciona a URL da thumbnail se existir
    if (thumbnailUrl) {
      formData.set('thumbnail_url', thumbnailUrl)
    }
    
    const result = await createCourseAction(formData)
    
    if ('error' in result) {
      setError(result.error)
      setIsSubmitting(false)
    } else {
      router.push(`/teacher/courses/${result.id}/edit`)
    }
  }
  
  async function handleThumbnailUpload(e: React.ChangeEvent<HTMLInputElement>) {
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
    
    const path = `thumbnails/${Date.now()}-${file.name}`
    const result = await uploadFile('thumbnails', path, file)
    
    if ('error' in result) {
      setError(result.error)
    } else {
      setThumbnailUrl(result.url)
    }
    
    setIsUploading(false)
  }
  
  function removeThumbnail() {
    setThumbnailUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }
  
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/teacher/courses">
          <Button variant="ghost" size="sm">
            <ArrowLeft size={18} />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-brand-gray-900">Novo Curso</h1>
          <p className="text-sm text-brand-gray-500">
            Crie um novo curso e adicione conteúdo depois
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
          {/* Thumbnail Upload */}
          <div>
            <label className="block text-sm font-medium text-brand-gray-700 mb-3">
              Thumbnail do Curso
            </label>
            
            {thumbnailUrl ? (
              <div className="relative w-full max-w-md aspect-video rounded-lg overflow-hidden bg-brand-gray-100">
                <img
                  src={thumbnailUrl}
                  alt="Thumbnail do curso"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={removeThumbnail}
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
                className="w-full max-w-md aspect-video rounded-lg border-2 border-dashed border-brand-gray-300 hover:border-brand-orange transition-colors flex flex-col items-center justify-center gap-3 text-brand-gray-500 hover:text-brand-orange"
              >
                {isUploading ? (
                  <>
                    <div className="w-8 h-8 border-2 border-brand-orange border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm">Enviando...</span>
                  </>
                ) : (
                  <>
                    <ImageIcon size={32} />
                    <span className="text-sm">Clique para fazer upload da thumbnail</span>
                    <span className="text-xs text-brand-gray-400">
                      PNG, JPG ou WEBP (máx. 5MB)
                    </span>
                  </>
                )}
              </button>
            )}
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleThumbnailUpload}
              className="hidden"
            />
          </div>
          
          {/* Title */}
          <Input
            name="title"
            label="Título do Curso *"
            placeholder="Ex: Introdução ao React"
            required
          />
          
          {/* Short Description */}
          <div>
            <Textarea
              name="short_description"
              label="Descrição Curta"
              placeholder="Uma breve descrição para a página de listagem (máx. 200 caracteres)"
              rows={3}
              maxLength={200}
              onChange={(e) => setShortDescriptionLength(e.target.value.length)}
            />
            <p className="text-xs text-brand-gray-400 mt-1 text-right">
              {shortDescriptionLength}/200 caracteres
            </p>
          </div>
          
          {/* Full Description */}
          <Textarea
            name="full_description"
            label="Descrição Completa"
            placeholder="Descrição detalhada do curso, o que os alunos vão aprender..."
            rows={6}
          />
          
          {/* Price */}
          <Input
            name="price"
            label="Preço (R$)"
            type="number"
            min="0"
            step="0.01"
            placeholder="0,00"
            helperText="Deixe em 0 para curso gratuito"
          />
          
          {/* Category and Level */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              name="category"
              label="Categoria"
              options={categoryOptions}
              placeholder="Selecione uma categoria"
            />
            
            <Select
              name="level"
              label="Nível"
              options={levelOptions}
              placeholder="Selecione o nível"
            />
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Link href="/teacher/courses">
            <Button type="button" variant="ghost">
              Cancelar
            </Button>
          </Link>
          <Button type="submit" loading={isSubmitting}>
            <Upload size={18} />
            Salvar Rascunho
          </Button>
        </div>
      </form>
    </div>
  )
}
