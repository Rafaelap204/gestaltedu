'use client'

import { useState } from 'react'
import {
  BookOpen, Video, FileText, Download, Music, Image, Code,
  Palette, GraduationCap, Lightbulb, Target, Rocket, Star,
  Heart, Zap, Globe, Users, Trophy, Clock, Layers, Package,
  PenTool, BarChart3, Shield, Cpu, Database, Smartphone,
  Search, Check,
} from 'lucide-react'

const AVAILABLE_ICONS = [
  { name: 'BookOpen', icon: BookOpen, label: 'Livro' },
  { name: 'Video', icon: Video, label: 'Vídeo' },
  { name: 'FileText', icon: FileText, label: 'Texto' },
  { name: 'Download', icon: Download, label: 'Download' },
  { name: 'Music', icon: Music, label: 'Música' },
  { name: 'Image', icon: Image, label: 'Imagem' },
  { name: 'Code', icon: Code, label: 'Código' },
  { name: 'Palette', icon: Palette, label: 'Paleta' },
  { name: 'GraduationCap', icon: GraduationCap, label: 'Formação' },
  { name: 'Lightbulb', icon: Lightbulb, label: 'Ideia' },
  { name: 'Target', icon: Target, label: 'Alvo' },
  { name: 'Rocket', icon: Rocket, label: 'Foguete' },
  { name: 'Star', icon: Star, label: 'Estrela' },
  { name: 'Heart', icon: Heart, label: 'Coração' },
  { name: 'Zap', icon: Zap, label: 'Raio' },
  { name: 'Globe', icon: Globe, label: 'Global' },
  { name: 'Users', icon: Users, label: 'Pessoas' },
  { name: 'Trophy', icon: Trophy, label: 'Troféu' },
  { name: 'Clock', icon: Clock, label: 'Relógio' },
  { name: 'Layers', icon: Layers, label: 'Camadas' },
  { name: 'Package', icon: Package, label: 'Pacote' },
  { name: 'PenTool', icon: PenTool, label: 'Ferramenta' },
  { name: 'BarChart3', icon: BarChart3, label: 'Gráfico' },
  { name: 'Shield', icon: Shield, label: 'Escudo' },
  { name: 'Cpu', icon: Cpu, label: 'Processador' },
  { name: 'Database', icon: Database, label: 'Banco de Dados' },
  { name: 'Smartphone', icon: Smartphone, label: 'Celular' },
]

interface IconSelectorProps {
  selectedIcon: string
  onSelect: (iconName: string) => void
}

export function IconSelector({ selectedIcon, onSelect }: IconSelectorProps) {
  const [search, setSearch] = useState('')

  const filteredIcons = AVAILABLE_ICONS.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.label.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar ícone..."
          className="w-full pl-10 pr-4 py-2.5 border border-brand-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange"
        />
      </div>

      {/* Icon Grid */}
      <div className="grid grid-cols-5 gap-2 max-h-80 overflow-y-auto">
        {filteredIcons.map((item) => {
          const Icon = item.icon
          const isSelected = selectedIcon === item.name
          return (
            <button
              key={item.name}
              onClick={() => onSelect(item.name)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all ${
                isSelected
                  ? 'border-brand-orange bg-brand-orange/10 text-brand-orange'
                  : 'border-brand-gray-200 hover:border-brand-gray-300 text-brand-gray-600 hover:text-brand-gray-900'
              }`}
              title={item.label}
            >
              <Icon size={24} />
              <span className="text-[10px] leading-tight text-center truncate w-full">
                {item.label}
              </span>
              {isSelected && (
                <div className="absolute -top-1 -right-1 h-4 w-4 bg-brand-orange rounded-full flex items-center justify-center">
                  <Check size={10} className="text-white" />
                </div>
              )}
            </button>
          )
        })}
      </div>

      {filteredIcons.length === 0 && (
        <p className="text-sm text-brand-gray-500 text-center py-4">
          Nenhum ícone encontrado para &quot;{search}&quot;
        </p>
      )}
    </div>
  )
}
