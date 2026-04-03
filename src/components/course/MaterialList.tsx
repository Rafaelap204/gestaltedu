'use client'

import { FileText, Download, ExternalLink } from 'lucide-react'

interface Material {
  name: string
  url: string
  type?: string
}

interface MaterialListProps {
  materials: Material[]
}

export function MaterialList({ materials }: MaterialListProps) {
  if (!materials || materials.length === 0) {
    return null
  }

  const getFileIcon = (type?: string) => {
    return <FileText size={20} className="text-brand-gray-500" />
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
        {materials.map((material, index) => (
          <a
            key={index}
            href={material.url}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="flex items-center gap-4 p-4 bg-white border border-brand-gray-200 rounded-lg hover:border-brand-orange hover:shadow-sm transition-all duration-200 group"
          >
            <div className="w-10 h-10 rounded-lg bg-brand-gray-100 flex items-center justify-center shrink-0 group-hover:bg-brand-orange/10 transition-colors">
              {getFileIcon(material.type)}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="font-medium text-brand-gray-900 truncate">
                {material.name}
              </p>
              <p className="text-xs text-brand-gray-500">
                {getFileExtension(material.name)}
              </p>
            </div>

            <div className="flex items-center gap-2 text-brand-gray-400 group-hover:text-brand-orange transition-colors">
              <Download size={18} />
              <ExternalLink size={16} className="hidden sm:block" />
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
