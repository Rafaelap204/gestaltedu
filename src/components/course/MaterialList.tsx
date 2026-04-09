'use client'

import { FileText, Download, ExternalLink, BookOpen, AlignLeft } from 'lucide-react'

type ContentType = 'ebook' | 'text' | 'resource'

interface Material {
  name: string
  url?: string
  content?: string
  type?: string
  contentType?: ContentType
}

interface MaterialListProps {
  materials: Material[]
}

export function MaterialList({ materials }: MaterialListProps) {
  if (!materials || materials.length === 0) {
    return null
  }

  const getFileIcon = (contentType?: ContentType, type?: string) => {
    if (contentType === 'ebook') return <BookOpen size={20} className="text-purple-500" />
    if (contentType === 'text') return <AlignLeft size={20} className="text-green-500" />
    if (contentType === 'resource') return <Download size={20} className="text-yellow-500" />
    return <FileText size={20} className="text-brand-gray-500" />
  }

  const getTypeLabel = (contentType?: ContentType): string => {
    if (contentType === 'ebook') return 'Ebook'
    if (contentType === 'text') return 'Texto'
    if (contentType === 'resource') return 'Recurso'
    return 'Material'
  }

  const getFileExtension = (filename: string): string => {
    const parts = filename.split('.')
    return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : 'ARQUIVO'
  }

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold text-brand-gray-900 mb-4">
        Materiais da Aula
      </h3>
      <div className="space-y-3">
        {materials.map((material, index) => {
          // Text content: render inline
          if (material.contentType === 'text' && material.content) {
            return (
              <div
                key={index}
                className="p-4 bg-white border border-brand-gray-200 rounded-lg"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                    <AlignLeft size={20} className="text-green-500" />
                  </div>
                  <div>
                    <p className="font-medium text-brand-gray-900">{material.name}</p>
                    <p className="text-xs text-brand-gray-500">Texto/Artigo</p>
                  </div>
                </div>
                <div
                  className="prose prose-sm max-w-none text-brand-gray-700 whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{
                    __html: material.content
                      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
                      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
                      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
                      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\*(.+?)\*/g, '<em>$1</em>')
                      .replace(/\n/g, '<br/>')
                  }}
                />
              </div>
            )
          }

          // URL-based content (ebook, resource, legacy)
          if (!material.url) return null

          return (
            <a
              key={index}
              href={material.url}
              target="_blank"
              rel="noopener noreferrer"
              download={material.contentType !== 'ebook'}
              className="flex items-center gap-4 p-4 bg-white border border-brand-gray-200 rounded-lg hover:border-brand-orange hover:shadow-sm transition-all duration-200 group"
            >
              <div className="w-10 h-10 rounded-lg bg-brand-gray-100 flex items-center justify-center shrink-0 group-hover:bg-brand-orange/10 transition-colors">
                {getFileIcon(material.contentType, material.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="font-medium text-brand-gray-900 truncate">
                  {material.name}
                </p>
                <p className="text-xs text-brand-gray-500">
                  {getTypeLabel(material.contentType)}
                  {material.url.includes('.pdf') ? ' - PDF' : ''}
                  {!material.contentType && getFileExtension(material.name)}
                </p>
              </div>

              <div className="flex items-center gap-2 text-brand-gray-400 group-hover:text-brand-orange transition-colors">
                {material.contentType === 'ebook' ? (
                  <ExternalLink size={18} />
                ) : (
                  <>
                    <Download size={18} />
                    <ExternalLink size={16} className="hidden sm:block" />
                  </>
                )}
              </div>
            </a>
          )
        })}
      </div>
    </div>
  )
}
