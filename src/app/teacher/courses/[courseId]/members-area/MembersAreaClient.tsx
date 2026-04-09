'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Settings, LayoutList, Users } from 'lucide-react'
import type { MembersAreaTheme } from '@/types/database'
import { MembersAreaSettings } from '@/components/members-area/MembersAreaSettings'
import { ModulesManager } from '@/components/members-area/ModulesManager'

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

interface CourseInfo {
  id: string
  title: string
  slug: string
  description: string | null
  thumbnail_url: string | null
  members_area_enabled: boolean
  members_area_subdomain: string | null
  members_area_custom_domain: string | null
  members_area_theme: MembersAreaTheme
}

interface MembersAreaClientProps {
  courseId: string
  course: CourseInfo
  modules: CourseModule[]
  enrollmentsCount: number
  userName: string
  backUrl?: string
}

type TabKey = 'settings' | 'content'

export function MembersAreaClient({
  courseId,
  course,
  modules,
  enrollmentsCount,
  userName,
  backUrl = '/teacher/courses',
}: MembersAreaClientProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('settings')
  const [membersAreaEnabled, setMembersAreaEnabled] = useState(course.members_area_enabled)

  const tabs = [
    { key: 'settings' as TabKey, label: 'Configurações Gerais', icon: Settings },
    { key: 'content' as TabKey, label: 'Módulos e Aulas', icon: LayoutList },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={backUrl}
            className="p-2 text-brand-gray-500 hover:text-brand-gray-700 hover:bg-brand-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-brand-gray-900">
              Área de Membros
            </h1>
            <p className="text-sm text-brand-gray-500 mt-1">
              {course.title}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-brand-gray-600 bg-brand-gray-100 px-3 py-1.5 rounded-lg">
            <Users size={16} />
            <span>{enrollmentsCount} aluno{enrollmentsCount !== 1 ? 's' : ''}</span>
          </div>
          <div className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg ${
            membersAreaEnabled
              ? 'bg-green-100 text-green-700'
              : 'bg-brand-gray-100 text-brand-gray-500'
          }`}>
            <span className={`h-2 w-2 rounded-full ${
              membersAreaEnabled ? 'bg-green-500' : 'bg-brand-gray-400'
            }`} />
            {membersAreaEnabled ? 'Ativa' : 'Inativa'}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-brand-gray-200">
        <nav className="flex gap-0">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? 'border-brand-orange text-brand-orange'
                    : 'border-transparent text-brand-gray-500 hover:text-brand-gray-700 hover:border-brand-gray-300'
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'settings' && (
        <MembersAreaSettings
          courseId={courseId}
          enabled={course.members_area_enabled}
          subdomain={course.members_area_subdomain}
          customDomain={course.members_area_custom_domain}
          theme={course.members_area_theme}
          onToggleEnabled={setMembersAreaEnabled}
        />
      )}

      {activeTab === 'content' && (
        <ModulesManager
          courseId={courseId}
          modules={modules}
        />
      )}
    </div>
  )
}
