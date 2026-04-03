'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2, 
  ChevronUp, 
  ChevronDown,
  Video,
  FileText,
  Upload,
  X,
  Play,
  MoreVertical,
  AlertTriangle
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { 
  updateCourseAction, 
  deleteCourseAction,
  publishCourseAction,
  unpublishCourseAction,
  createModuleAction,
  updateModuleAction,
  deleteModuleAction,
  reorderModulesAction,
  createLessonAction,
  updateLessonAction,
  deleteLessonAction,
  reorderLessonsAction,
  updateLessonMaterialsAction
} from '@/lib/actions/courses'
import { uploadFile } from '@/lib/utils/storage'
import { parseVideoUrl } from '@/lib/utils/video'
import type { CourseStatus } from '@/types/database'

interface Lesson {
  id: string
  title: string
  video_url: string | null
  video_provider: string | null
  order: number
  materials: { name: string; url: string; type: string }[] | null
}

interface Module {
  id: string
  title: string
  order: number
  lessons: Lesson[]
}

interface Course {
  id: string
  title: string
  slug: string
  short_description: string | null
  full_description: string | null
  price: number
  category: string | null
  level: string | null
  thumbnail_url: string | null
  status: CourseStatus
}

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

export default function EditCoursePage({ params }: { params: Promise<{ courseId: string }> }) {
  const router = useRouter()
  const [courseId, setCourseId] = useState<string>('')
  
  useEffect(() => {
    params.then(p => setCourseId(p.courseId))
  }, [params])
  
  const [course, setCourse] = useState<Course | null>(null)
  const [modules, setModules] = useState<Module[]>([])
  const [activeTab, setActiveTab] = useState<'info' | 'content' | 'settings'>('info')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  
  // Module/lesson editing states
  const [editingModule, setEditingModule] = useState<string | null>(null)
  const [editingLesson, setEditingLesson] = useState<string | null>(null)
  const [newModuleTitle, setNewModuleTitle] = useState('')
  const [newLessonData, setNewLessonData] = useState({ title: '', video_url: '' })
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'course' | 'module' | 'lesson'; id: string } | null>(null)
  
  // Fetch course data
  useEffect(() => {
    if (!courseId) return
    
    async function fetchCourse() {
      try {
        const response = await fetch(`/api/courses/${courseId}`)
        if (!response.ok) throw new Error('Failed to fetch course')
        const data = await response.json()
        setCourse(data.course)
        setModules(data.modules || [])
      } catch (err) {
        setError('Erro ao carregar curso')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchCourse()
  }, [courseId])
  
  // Auto-hide success message
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [successMessage])
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-brand-orange border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }
  
  if (!course) {
    return (
      <div className="text-center py-12">
        <p className="text-brand-gray-500">Curso não encontrado</p>
        <Link href="/teacher/courses" className="text-brand-orange hover:underline mt-2 inline-block">
          Voltar para cursos
        </Link>
      </div>
    )
  }
  
  async function handleUpdateCourse(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    
    const formData = new FormData(e.currentTarget)
    const result = await updateCourseAction(courseId, formData)
    
    if ('error' in result) {
      setError(result.error)
    } else {
      setSuccessMessage('Curso atualizado com sucesso!')
    }
  }
  
  async function handlePublish() {
    const result = await publishCourseAction(courseId)
    if ('error' in result) {
      setError(result.error)
    } else {
      setCourse({ ...course!, status: 'published' })
      setSuccessMessage('Curso publicado!')
    }
  }
  
  async function handleUnpublish() {
    const result = await unpublishCourseAction(courseId)
    if ('error' in result) {
      setError(result.error)
    } else {
      setCourse({ ...course!, status: 'draft' })
      setSuccessMessage('Curso despublicado!')
    }
  }
  
  async function handleDeleteCourse() {
    const result = await deleteCourseAction(courseId)
    if ('error' in result) {
      setError(result.error)
    } else {
      router.push('/teacher/courses')
    }
  }
  
  async function handleCreateModule(e: React.FormEvent) {
    e.preventDefault()
    if (!newModuleTitle.trim()) return
    
    const result = await createModuleAction(courseId, newModuleTitle)
    if ('error' in result) {
      setError(result.error)
    } else {
      setNewModuleTitle('')
      // Refresh modules
      const response = await fetch(`/api/courses/${courseId}`)
      const data = await response.json()
      setModules(data.modules || [])
    }
  }
  
  async function handleUpdateModule(moduleId: string, title: string) {
    const result = await updateModuleAction(moduleId, { title })
    if ('error' in result) {
      setError(result.error)
    } else {
      setEditingModule(null)
      const response = await fetch(`/api/courses/${courseId}`)
      const data = await response.json()
      setModules(data.modules || [])
    }
  }
  
  async function handleDeleteModule(moduleId: string) {
    const result = await deleteModuleAction(moduleId)
    if ('error' in result) {
      setError(result.error)
    } else {
      setDeleteConfirm(null)
      const response = await fetch(`/api/courses/${courseId}`)
      const data = await response.json()
      setModules(data.modules || [])
    }
  }
  
  async function handleCreateLesson(moduleId: string) {
    if (!newLessonData.title.trim()) return
    
    const videoInfo = parseVideoUrl(newLessonData.video_url)
    
    const result = await createLessonAction(moduleId, {
      title: newLessonData.title,
      video_url: newLessonData.video_url || undefined,
      video_provider: videoInfo.provider || undefined,
    })
    
    if ('error' in result) {
      setError(result.error)
    } else {
      setNewLessonData({ title: '', video_url: '' })
      setEditingLesson(null)
      const response = await fetch(`/api/courses/${courseId}`)
      const data = await response.json()
      setModules(data.modules || [])
    }
  }
  
  async function handleUpdateLesson(lessonId: string, data: Partial<Lesson>) {
    const videoInfo = data.video_url ? parseVideoUrl(data.video_url) : null
    
    const updateData: { title?: string; video_url?: string; video_provider?: string; order?: number } = {}
    if (data.title) updateData.title = data.title
    if (data.video_url) updateData.video_url = data.video_url
    if (data.order !== undefined) updateData.order = data.order
    updateData.video_provider = videoInfo?.provider || data.video_provider || undefined
    
    const result = await updateLessonAction(lessonId, updateData)
    
    if ('error' in result) {
      setError(result.error)
    } else {
      setEditingLesson(null)
      const response = await fetch(`/api/courses/${courseId}`)
      const data = await response.json()
      setModules(data.modules || [])
    }
  }
  
  async function handleDeleteLesson(lessonId: string) {
    const result = await deleteLessonAction(lessonId)
    if ('error' in result) {
      setError(result.error)
    } else {
      setDeleteConfirm(null)
      const response = await fetch(`/api/courses/${courseId}`)
      const data = await response.json()
      setModules(data.modules || [])
    }
  }
  
  async function handleReorderModules(moduleIds: string[]) {
    const result = await reorderModulesAction(courseId, moduleIds)
    if ('error' in result) {
      setError(result.error)
    }
  }
  
  async function handleReorderLessons(moduleId: string, lessonIds: string[]) {
    const result = await reorderLessonsAction(moduleId, lessonIds)
    if ('error' in result) {
      setError(result.error)
    }
  }
  
  function toggleModule(moduleId: string) {
    const newExpanded = new Set(expandedModules)
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId)
    } else {
      newExpanded.add(moduleId)
    }
    setExpandedModules(newExpanded)
  }
  
  function moveModule(index: number, direction: 'up' | 'down') {
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === modules.length - 1) return
    
    const newModules = [...modules]
    const newIndex = direction === 'up' ? index - 1 : index + 1
    ;[newModules[index], newModules[newIndex]] = [newModules[newIndex], newModules[index]]
    
    setModules(newModules)
    handleReorderModules(newModules.map(m => m.id))
  }
  
  function moveLesson(moduleId: string, lessonIndex: number, direction: 'up' | 'down') {
    const module = modules.find(m => m.id === moduleId)
    if (!module) return
    
    if (direction === 'up' && lessonIndex === 0) return
    if (direction === 'down' && lessonIndex === module.lessons.length - 1) return
    
    const newLessons = [...module.lessons]
    const newIndex = direction === 'up' ? lessonIndex - 1 : lessonIndex + 1
    ;[newLessons[lessonIndex], newLessons[newIndex]] = [newLessons[newIndex], newLessons[lessonIndex]]
    
    const newModules = modules.map(m => 
      m.id === moduleId ? { ...m, lessons: newLessons } : m
    )
    
    setModules(newModules)
    handleReorderLessons(moduleId, newLessons.map(l => l.id))
  }
  
  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/teacher/courses">
            <Button variant="ghost" size="sm">
              <ArrowLeft size={18} />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-brand-gray-900">{course.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={course.status === 'published' ? 'success' : 'default'}>
                {course.status === 'published' ? 'Publicado' : 'Rascunho'}
              </Badge>
              <span className="text-sm text-brand-gray-500">/{course.slug}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {course.status === 'published' ? (
            <Button variant="outline" onClick={handleUnpublish}>
              Despublicar
            </Button>
          ) : (
            <Button onClick={handlePublish}>
              Publicar Curso
            </Button>
          )}
        </div>
      </div>
      
      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700 mb-6">
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-700 mb-6">
          {successMessage}
        </div>
      )}
      
      {/* Tabs */}
      <div className="border-b border-brand-gray-200 mb-6">
        <nav className="flex gap-6">
          {(['info', 'content', 'settings'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-brand-orange text-brand-orange'
                  : 'border-transparent text-brand-gray-500 hover:text-brand-gray-700'
              }`}
            >
              {tab === 'info' && 'Informações'}
              {tab === 'content' && 'Conteúdo'}
              {tab === 'settings' && 'Configurações'}
            </button>
          ))}
        </nav>
      </div>
      
      {/* Info Tab */}
      {activeTab === 'info' && (
        <form onSubmit={handleUpdateCourse} className="space-y-6">
          <div className="bg-white rounded-xl border border-brand-gray-200 p-6 space-y-6">
            <Input
              name="title"
              label="Título do Curso *"
              defaultValue={course.title}
              required
            />
            
            <div>
              <Textarea
                name="short_description"
                label="Descrição Curta"
                defaultValue={course.short_description || ''}
                rows={3}
                maxLength={200}
              />
            </div>
            
            <Textarea
              name="full_description"
              label="Descrição Completa"
              defaultValue={course.full_description || ''}
              rows={6}
            />
            
            <Input
              name="price"
              label="Preço (R$)"
              type="number"
              min="0"
              step="0.01"
              defaultValue={course.price}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                name="category"
                label="Categoria"
                options={categoryOptions}
                defaultValue={course.category || ''}
              />
              
              <Select
                name="level"
                label="Nível"
                options={levelOptions}
                defaultValue={course.level || ''}
              />
            </div>
          </div>
          
          <div className="flex items-center justify-end gap-3">
            <Button type="submit">
              <Save size={18} />
              Salvar Alterações
            </Button>
          </div>
        </form>
      )}
      
      {/* Content Tab */}
      {activeTab === 'content' && (
        <div className="space-y-6">
          {/* Modules List */}
          <div className="space-y-4">
            {modules.map((module, moduleIndex) => (
              <div
                key={module.id}
                className="bg-white rounded-xl border border-brand-gray-200 overflow-hidden"
              >
                {/* Module Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-brand-gray-50 border-b border-brand-gray-200">
                  <div className="flex items-center gap-3 flex-1">
                    <button
                      onClick={() => toggleModule(module.id)}
                      className="text-brand-gray-500 hover:text-brand-gray-700"
                    >
                      {expandedModules.has(module.id) ? (
                        <ChevronDown size={18} />
                      ) : (
                        <ChevronUp size={18} />
                      )}
                    </button>
                    
                    {editingModule === module.id ? (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault()
                          const input = e.currentTarget.elements.namedItem('title') as HTMLInputElement
                          handleUpdateModule(module.id, input.value)
                        }}
                        className="flex-1"
                      >
                        <input
                          name="title"
                          defaultValue={module.title}
                          className="w-full px-2 py-1 text-sm border rounded"
                          autoFocus
                          onBlur={(e) => handleUpdateModule(module.id, e.target.value)}
                        />
                      </form>
                    ) : (
                      <h3
                        className="font-medium text-brand-gray-900 cursor-pointer hover:text-brand-orange"
                        onClick={() => setEditingModule(module.id)}
                      >
                        {module.title}
                      </h3>
                    )}
                    
                    <span className="text-xs text-brand-gray-400">
                      {module.lessons.length} aula{module.lessons.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => moveModule(moduleIndex, 'up')}
                      disabled={moduleIndex === 0}
                      className="p-1.5 text-brand-gray-400 hover:text-brand-gray-600 disabled:opacity-30"
                    >
                      <ChevronUp size={16} />
                    </button>
                    <button
                      onClick={() => moveModule(moduleIndex, 'down')}
                      disabled={moduleIndex === modules.length - 1}
                      className="p-1.5 text-brand-gray-400 hover:text-brand-gray-600 disabled:opacity-30"
                    >
                      <ChevronDown size={16} />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm({ type: 'module', id: module.id })}
                      className="p-1.5 text-red-400 hover:text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                {/* Lessons List */}
                {expandedModules.has(module.id) && (
                  <div className="divide-y divide-brand-gray-100">
                    {module.lessons.map((lesson, lessonIndex) => (
                      <div
                        key={lesson.id}
                        className="px-4 py-3 hover:bg-brand-gray-50/50"
                      >
                        {editingLesson === lesson.id ? (
                          <div className="space-y-3">
                            <Input
                              defaultValue={lesson.title}
                              onChange={(e) => {
                                // Update local state for preview
                              }}
                              placeholder="Título da aula"
                            />
                            <Input
                              defaultValue={lesson.video_url || ''}
                              placeholder="URL do vídeo (YouTube ou Vimeo)"
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  const inputs = (e.target as HTMLElement).closest('.space-y-3')?.querySelectorAll('input')
                                  if (inputs) {
                                    handleUpdateLesson(lesson.id, {
                                      title: inputs[0].value,
                                      video_url: inputs[1].value,
                                    })
                                  }
                                }}
                              >
                                Salvar
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingLesson(null)}
                              >
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Video size={16} className="text-brand-gray-400" />
                              <div>
                                <p className="text-sm font-medium text-brand-gray-900">
                                  {lesson.title}
                                </p>
                                {lesson.video_url && (
                                  <p className="text-xs text-brand-gray-400 truncate max-w-xs">
                                    {lesson.video_url}
                                  </p>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => moveLesson(module.id, lessonIndex, 'up')}
                                disabled={lessonIndex === 0}
                                className="p-1 text-brand-gray-400 hover:text-brand-gray-600 disabled:opacity-30"
                              >
                                <ChevronUp size={14} />
                              </button>
                              <button
                                onClick={() => moveLesson(module.id, lessonIndex, 'down')}
                                disabled={lessonIndex === module.lessons.length - 1}
                                className="p-1 text-brand-gray-400 hover:text-brand-gray-600 disabled:opacity-30"
                              >
                                <ChevronDown size={14} />
                              </button>
                              <button
                                onClick={() => setEditingLesson(lesson.id)}
                                className="p-1 text-brand-gray-400 hover:text-brand-orange"
                              >
                                <MoreVertical size={14} />
                              </button>
                              <button
                                onClick={() => setDeleteConfirm({ type: 'lesson', id: lesson.id })}
                                className="p-1 text-red-400 hover:text-red-600"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {/* Add Lesson Form */}
                    {editingLesson === `new-${module.id}` ? (
                      <div className="px-4 py-3 bg-brand-orange-light/30">
                        <div className="space-y-3">
                          <Input
                            value={newLessonData.title}
                            onChange={(e) => setNewLessonData({ ...newLessonData, title: e.target.value })}
                            placeholder="Título da aula"
                          />
                          <Input
                            value={newLessonData.video_url}
                            onChange={(e) => setNewLessonData({ ...newLessonData, video_url: e.target.value })}
                            placeholder="URL do vídeo (YouTube ou Vimeo)"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleCreateLesson(module.id)}
                            >
                              Adicionar
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingLesson(null)
                                setNewLessonData({ title: '', video_url: '' })
                              }}
                            >
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditingLesson(`new-${module.id}`)}
                        className="w-full px-4 py-2 text-sm text-brand-orange hover:bg-brand-orange-light/30 flex items-center gap-2 transition-colors"
                      >
                        <Plus size={16} />
                        Adicionar Aula
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Add Module Form */}
          <form onSubmit={handleCreateModule} className="flex gap-3">
            <input
              type="text"
              value={newModuleTitle}
              onChange={(e) => setNewModuleTitle(e.target.value)}
              placeholder="Nome do novo módulo"
              className="flex-1 px-4 py-2.5 rounded-lg border border-brand-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange"
            />
            <Button type="submit" disabled={!newModuleTitle.trim()}>
              <Plus size={18} />
              Adicionar Módulo
            </Button>
          </form>
        </div>
      )}
      
      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-brand-gray-200 p-6">
            <h3 className="font-medium text-brand-gray-900 mb-4">Status do Curso</h3>
            
            <div className="flex items-center justify-between py-3 border-b border-brand-gray-100">
              <div>
                <p className="font-medium text-brand-gray-700">
                  {course.status === 'published' ? 'Curso Publicado' : 'Curso em Rascunho'}
                </p>
                <p className="text-sm text-brand-gray-500">
                  {course.status === 'published'
                    ? 'O curso está visível para os alunos'
                    : 'O curso não está visível para os alunos'}
                </p>
              </div>
              {course.status === 'published' ? (
                <Button variant="outline" onClick={handleUnpublish}>
                  Despublicar
                </Button>
              ) : (
                <Button onClick={handlePublish}>
                  Publicar
                </Button>
              )}
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-red-200 p-6">
            <h3 className="font-medium text-red-700 mb-4 flex items-center gap-2">
              <AlertTriangle size={18} />
              Zona de Perigo
            </h3>
            
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-brand-gray-700">Excluir Curso</p>
                <p className="text-sm text-brand-gray-500">
                  {course.status === 'draft'
                    ? 'Esta ação não pode ser desfeita'
                    : 'Apenas cursos em rascunho podem ser excluídos'}
                </p>
              </div>
              <Button
                variant="destructive"
                onClick={() => setDeleteConfirm({ type: 'course', id: courseId })}
                disabled={course.status !== 'draft'}
              >
                <Trash2 size={18} />
                Excluir
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title={
          deleteConfirm?.type === 'course'
            ? 'Excluir Curso'
            : deleteConfirm?.type === 'module'
            ? 'Excluir Módulo'
            : 'Excluir Aula'
        }
      >
        <div className="space-y-4">
          <p className="text-brand-gray-600">
            Tem certeza que deseja excluir{' '}
            {deleteConfirm?.type === 'course'
              ? 'este curso'
              : deleteConfirm?.type === 'module'
              ? 'este módulo e todas as suas aulas'
              : 'esta aula'}
            ? Esta ação não pode ser desfeita.
          </p>
          
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteConfirm?.type === 'course') {
                  handleDeleteCourse()
                } else if (deleteConfirm?.type === 'module') {
                  handleDeleteModule(deleteConfirm.id)
                } else {
                  handleDeleteLesson(deleteConfirm!.id)
                }
              }}
            >
              Excluir
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
