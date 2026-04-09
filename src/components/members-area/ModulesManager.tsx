'use client'

import { useState, useTransition } from 'react'
import {
  Plus, ChevronDown, ChevronUp, Edit2, Trash2, GripVertical,
  BookOpen, Video, FileText, Download, MoreVertical
} from 'lucide-react'
import {
  createModuleAction,
  deleteModuleAction,
  createLessonAction,
  deleteLessonAction,
} from '@/lib/actions/courses'
import {
  updateModuleDetails,
  updateLessonContent,
} from '@/lib/actions/members-area'
import type { LessonMaterial, LessonContentType } from '@/types/database'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Modal } from '@/components/ui/Modal'
import { IconSelector } from './IconSelector'
import { LessonEditor } from './LessonEditor'

interface ModuleLesson {
  id: string
  title: string
  video_url: string | null
  video_provider: string | null
  materials: unknown[]
  duration_seconds: number | null
  order: number
  created_at: string
}

interface CourseModule {
  id: string
  title: string
  description: string | null
  icon: string | null
  order: number
  created_at: string
  lessons: ModuleLesson[]
}

interface ModulesManagerProps {
  courseId: string
  modules: CourseModule[]
}

export function ModulesManager({ courseId, modules: initialModules }: ModulesManagerProps) {
  const [isPending, startTransition] = useTransition()
  const [modules, setModules] = useState(initialModules)
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())
  const [showCreateModule, setShowCreateModule] = useState(false)
  const [newModuleTitle, setNewModuleTitle] = useState('')
  const [editingModule, setEditingModule] = useState<string | null>(null)
  const [editModuleData, setEditModuleData] = useState({ title: '', description: '', icon: 'BookOpen' })
  const [showIconSelector, setShowIconSelector] = useState(false)
  const [showLessonEditor, setShowLessonEditor] = useState<string | null>(null) // module_id

  const toggleExpand = (moduleId: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev)
      if (next.has(moduleId)) {
        next.delete(moduleId)
      } else {
        next.add(moduleId)
      }
      return next
    })
  }

  const handleCreateModule = () => {
    if (!newModuleTitle.trim()) return
    startTransition(async () => {
      const result = await createModuleAction(courseId, newModuleTitle.trim())
      if ('id' in result) {
        setModules(prev => [...prev, {
          id: result.id,
          title: newModuleTitle.trim(),
          description: null,
          icon: 'BookOpen',
          order: prev.length + 1,
          created_at: new Date().toISOString(),
          lessons: [],
        }])
        setNewModuleTitle('')
        setShowCreateModule(false)
        setExpandedModules(prev => new Set([...prev, result.id]))
      }
    })
  }

  const handleDeleteModule = (moduleId: string) => {
    if (!confirm('Tem certeza que deseja excluir este módulo e todas as suas aulas?')) return
    startTransition(async () => {
      const result = await deleteModuleAction(moduleId)
      if ('success' in result) {
        setModules(prev => prev.filter(m => m.id !== moduleId))
      }
    })
  }

  const handleSaveModuleDetails = (moduleId: string) => {
    startTransition(async () => {
      const result = await updateModuleDetails(moduleId, editModuleData)
      if ('success' in result) {
        setModules(prev => prev.map(m =>
          m.id === moduleId
            ? { ...m, title: editModuleData.title, description: editModuleData.description, icon: editModuleData.icon }
            : m
        ))
        setEditingModule(null)
      }
    })
  }

  const startEditingModule = (mod: CourseModule) => {
    setEditModuleData({
      title: mod.title,
      description: mod.description || '',
      icon: mod.icon || 'BookOpen',
    })
    setEditingModule(mod.id)
  }

  const handleDeleteLesson = (moduleId: string, lessonId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta aula?')) return
    startTransition(async () => {
      const result = await deleteLessonAction(lessonId)
      if ('success' in result) {
        setModules(prev => prev.map(m =>
          m.id === moduleId
            ? { ...m, lessons: m.lessons.filter(l => l.id !== lessonId) }
            : m
        ))
      }
    })
  }

  const getModuleIcon = (iconName: string | null) => {
    const icons: Record<string, React.ElementType> = {
      BookOpen, Video, FileText, Download,
    }
    const IconComp = icons[iconName || 'BookOpen'] || BookOpen
    return <IconComp size={20} />
  }

  const getLessonTypeLabel = (lesson: ModuleLesson) => {
    if (lesson.video_url) return { label: 'Vídeo', icon: Video, color: 'text-blue-600 bg-blue-50' }
    const materials = lesson.materials as Array<{ contentType?: string }> | undefined
    if (materials && materials.length > 0) {
      const ct = materials[0].contentType
      if (ct === 'ebook') return { label: 'Ebook', icon: FileText, color: 'text-purple-600 bg-purple-50' }
      if (ct === 'text') return { label: 'Texto', icon: FileText, color: 'text-green-600 bg-green-50' }
      if (ct === 'resource') return { label: 'Recurso', icon: Download, color: 'text-yellow-600 bg-yellow-50' }
    }
    return { label: 'Sem conteúdo', icon: FileText, color: 'text-brand-gray-400 bg-brand-gray-50' }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-brand-gray-900">
            Módulos e Aulas
          </h3>
          <p className="text-sm text-brand-gray-500 mt-1">
            Organize o conteúdo do seu curso em módulos e aulas
          </p>
        </div>
        <Button onClick={() => setShowCreateModule(true)}>
          <Plus size={18} />
          Adicionar Módulo
        </Button>
      </div>

      {/* Create Module Modal */}
      <Modal
        isOpen={showCreateModule}
        onClose={() => { setShowCreateModule(false); setNewModuleTitle('') }}
        title="Novo Módulo"
        footer={
          <>
            <Button variant="ghost" onClick={() => { setShowCreateModule(false); setNewModuleTitle('') }}>
              Cancelar
            </Button>
            <Button onClick={handleCreateModule} disabled={!newModuleTitle.trim() || isPending}>
              <Plus size={18} />
              Criar Módulo
            </Button>
          </>
        }
      >
        <Input
          label="Nome do Módulo"
          value={newModuleTitle}
          onChange={(e) => setNewModuleTitle(e.target.value)}
          placeholder="Ex: Introdução ao Curso"
          autoFocus
        />
      </Modal>

      {/* Icon Selector Modal */}
      <Modal
        isOpen={showIconSelector}
        onClose={() => setShowIconSelector(false)}
        title="Selecionar Ícone"
        size="lg"
      >
        <IconSelector
          selectedIcon={editModuleData.icon}
          onSelect={(icon: string) => {
            setEditModuleData(prev => ({ ...prev, icon }))
            setShowIconSelector(false)
          }}
        />
      </Modal>

      {/* Edit Module Modal */}
      <Modal
        isOpen={!!editingModule}
        onClose={() => setEditingModule(null)}
        title="Editar Módulo"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditingModule(null)}>
              Cancelar
            </Button>
            <Button onClick={() => editingModule && handleSaveModuleDetails(editingModule)} disabled={isPending}>
              Salvar
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Nome do Módulo"
            value={editModuleData.title}
            onChange={(e) => setEditModuleData(prev => ({ ...prev, title: e.target.value }))}
          />
          <Textarea
            label="Descrição do Módulo"
            value={editModuleData.description}
            onChange={(e) => setEditModuleData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Descreva o que os alunos vão aprender neste módulo..."
            rows={3}
          />
          <div>
            <label className="block text-sm font-medium text-brand-gray-700 mb-1.5">
              Ícone do Módulo
            </label>
            <button
              onClick={() => setShowIconSelector(true)}
              className="flex items-center gap-3 px-4 py-2.5 border border-brand-gray-300 rounded-lg hover:bg-brand-gray-50 transition-colors"
            >
              {getModuleIcon(editModuleData.icon)}
              <span className="text-sm text-brand-gray-700">{editModuleData.icon}</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Lesson Editor Modal */}
      {showLessonEditor && (
        <LessonEditorModal
          courseId={courseId}
          moduleId={showLessonEditor}
          onClose={() => setShowLessonEditor(null)}
          onLessonCreated={(lesson) => {
            setModules(prev => prev.map(m =>
              m.id === showLessonEditor
                ? { ...m, lessons: [...m.lessons, lesson] }
                : m
            ))
            setShowLessonEditor(null)
          }}
        />
      )}

      {/* Modules List */}
      {modules.length === 0 ? (
        <div className="bg-white rounded-xl border border-brand-gray-200 p-12 text-center">
          <BookOpen size={48} className="mx-auto text-brand-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-brand-gray-900 mb-2">
            Nenhum módulo criado
          </h3>
          <p className="text-sm text-brand-gray-500 mb-4">
            Comece adicionando módulos para organizar o conteúdo do seu curso
          </p>
          <Button onClick={() => setShowCreateModule(true)}>
            <Plus size={18} />
            Adicionar Módulo
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {modules.map((mod) => {
            const isExpanded = expandedModules.has(mod.id)
            return (
              <div
                key={mod.id}
                className="bg-white rounded-xl border border-brand-gray-200 overflow-hidden"
              >
                {/* Module Header */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <button
                    onClick={() => toggleExpand(mod.id)}
                    className="p-1 text-brand-gray-400 hover:text-brand-gray-600 transition-colors"
                  >
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>

                  <div className="flex items-center gap-2 text-brand-gray-400">
                    {getModuleIcon(mod.icon)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-brand-gray-900 truncate">
                      {mod.title}
                    </h4>
                    <p className="text-xs text-brand-gray-500">
                      {mod.lessons.length} aula{mod.lessons.length !== 1 ? 's' : ''}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => startEditingModule(mod)}
                      className="p-1.5 text-brand-gray-400 hover:text-brand-orange hover:bg-brand-orange/10 rounded-lg transition-colors"
                      title="Editar módulo"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteModule(mod.id)}
                      className="p-1.5 text-brand-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Excluir módulo"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Module Content (Lessons) */}
                {isExpanded && (
                  <div className="border-t border-brand-gray-100">
                    {mod.description && (
                      <p className="px-4 py-2 text-sm text-brand-gray-600 bg-brand-gray-50/50">
                        {mod.description}
                      </p>
                    )}

                    {/* Lessons List */}
                    {mod.lessons.length > 0 ? (
                      <div className="divide-y divide-brand-gray-100">
                        {mod.lessons.map((lesson) => {
                          const typeInfo = getLessonTypeLabel(lesson)
                          const TypeIcon = typeInfo.icon
                          return (
                            <div
                              key={lesson.id}
                              className="flex items-center gap-3 px-4 py-2.5 hover:bg-brand-gray-50/50 transition-colors"
                            >
                              <div className={`p-1.5 rounded-lg ${typeInfo.color}`}>
                                <TypeIcon size={14} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-brand-gray-900 truncate">
                                  {lesson.title}
                                </p>
                                <p className="text-xs text-brand-gray-500">
                                  {typeInfo.label}
                                </p>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => setShowLessonEditor(mod.id)}
                                  className="p-1.5 text-brand-gray-400 hover:text-brand-orange hover:bg-brand-orange/10 rounded-lg transition-colors"
                                  title="Editar aula"
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button
                                  onClick={() => handleDeleteLesson(mod.id, lesson.id)}
                                  className="p-1.5 text-brand-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Excluir aula"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="px-4 py-6 text-center">
                        <p className="text-sm text-brand-gray-500">
                          Nenhuma aula neste módulo
                        </p>
                      </div>
                    )}

                    {/* Add Lesson Button */}
                    <div className="px-4 py-3 border-t border-brand-gray-100 bg-brand-gray-50/30">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowLessonEditor(mod.id)}
                        className="w-full justify-start text-brand-gray-600"
                      >
                        <Plus size={16} />
                        Adicionar Aula
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// Lesson Editor Modal Component
function LessonEditorModal({
  courseId,
  moduleId,
  onClose,
  onLessonCreated,
}: {
  courseId: string
  moduleId: string
  onClose: () => void
  onLessonCreated: (lesson: ModuleLesson) => void
}) {
  const [isPending, startTransition] = useTransition()
  const [lessonTitle, setLessonTitle] = useState('')
  const [lessonDescription, setLessonDescription] = useState('')
  const [contentType, setContentType] = useState<'video' | 'ebook' | 'text' | 'resource'>('video')
  const [videoUrl, setVideoUrl] = useState('')
  const [videoProvider, setVideoProvider] = useState('youtube')
  const [ebookUrl, setEbookUrl] = useState('')
  const [textContent, setTextContent] = useState('')
  const [resourceName, setResourceName] = useState('')
  const [resourceUrl, setResourceUrl] = useState('')

  const handleCreate = () => {
    if (!lessonTitle.trim()) return
    startTransition(async () => {
      // First create the lesson
      const createData: { title: string; video_url?: string; video_provider?: string } = {
        title: lessonTitle.trim(),
      }

      if (contentType === 'video' && videoUrl) {
        createData.video_url = videoUrl
        createData.video_provider = videoProvider
      }

      const result = await createLessonAction(moduleId, createData)

      if ('id' in result) {
        // If not video, update materials
        if (contentType !== 'video') {
          const materials: LessonMaterial[] = []
          if (contentType === 'ebook' && ebookUrl) {
            materials.push({ name: lessonTitle.trim(), url: ebookUrl, type: 'ebook', contentType: 'ebook' as LessonContentType })
          } else if (contentType === 'text' && textContent) {
            materials.push({ name: lessonTitle.trim(), content: textContent, type: 'text', contentType: 'text' as LessonContentType })
          } else if (contentType === 'resource' && resourceUrl) {
            materials.push({ name: resourceName || lessonTitle.trim(), url: resourceUrl, type: 'pdf', contentType: 'resource' as LessonContentType })
          }
          if (materials.length > 0) {
            await updateLessonContent(result.id, { materials })
          }
        }

        onLessonCreated({
          id: result.id,
          title: lessonTitle.trim(),
          video_url: contentType === 'video' ? videoUrl || null : null,
          video_provider: contentType === 'video' ? videoProvider : null,
          materials: contentType !== 'video'
            ? contentType === 'ebook' ? [{ name: lessonTitle.trim(), url: ebookUrl, type: 'ebook', contentType: 'ebook' as const }]
              : contentType === 'text' ? [{ name: lessonTitle.trim(), content: textContent, type: 'text', contentType: 'text' as const }]
              : contentType === 'resource' ? [{ name: resourceName || lessonTitle.trim(), url: resourceUrl, type: 'pdf', contentType: 'resource' as const }]
              : []
            : [],
          duration_seconds: null,
          order: 0,
          created_at: new Date().toISOString(),
        })
      }
    })
  }

  const contentTypes = [
    { value: 'video' as const, label: 'Vídeo', icon: Video, description: 'YouTube, Vimeo ou Panda Video' },
    { value: 'ebook' as const, label: 'Ebook', icon: FileText, description: 'PDF ou documento para download' },
    { value: 'text' as const, label: 'Texto/Artigo', icon: FileText, description: 'Conteúdo em texto formatado' },
    { value: 'resource' as const, label: 'Recurso', icon: Download, description: 'Material complementar para download' },
  ]

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Nova Aula"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleCreate} disabled={!lessonTitle.trim() || isPending}>
            <Plus size={18} />
            Criar Aula
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input
          label="Nome da Aula"
          value={lessonTitle}
          onChange={(e) => setLessonTitle(e.target.value)}
          placeholder="Ex: Introdução ao Módulo"
          autoFocus
        />

        <Textarea
          label="Descrição da Aula"
          value={lessonDescription}
          onChange={(e) => setLessonDescription(e.target.value)}
          placeholder="Descreva o que os alunos vão aprender nesta aula..."
          rows={2}
        />

        {/* Content Type Selection */}
        <div>
          <label className="block text-sm font-medium text-brand-gray-700 mb-2">
            Tipo de Conteúdo
          </label>
          <div className="grid grid-cols-2 gap-2">
            {contentTypes.map((type) => {
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
                    <p className="text-xs text-brand-gray-500">{type.description}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Conditional Content Fields */}
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

        {contentType === 'ebook' && (
          <Input
            label="URL do Ebook (PDF)"
            value={ebookUrl}
            onChange={(e) => setEbookUrl(e.target.value)}
            placeholder="https://exemplo.com/ebook.pdf"
            helperText="Cole o link direto para o arquivo PDF do ebook"
          />
        )}

        {contentType === 'text' && (
          <Textarea
            label="Conteúdo da Aula"
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            placeholder="Escreva o conteúdo da aula aqui. Suporta formatação Markdown..."
            rows={8}
            helperText="Você pode usar formatação Markdown para estruturar o texto"
          />
        )}

        {contentType === 'resource' && (
          <div className="space-y-3">
            <Input
              label="Nome do Recurso"
              value={resourceName}
              onChange={(e) => setResourceName(e.target.value)}
              placeholder="Ex: Planilha de Exercícios"
            />
            <Input
              label="URL do Recurso"
              value={resourceUrl}
              onChange={(e) => setResourceUrl(e.target.value)}
              placeholder="https://exemplo.com/material.pdf"
              helperText="Link direto para download do material"
            />
          </div>
        )}
      </div>
    </Modal>
  )
}
