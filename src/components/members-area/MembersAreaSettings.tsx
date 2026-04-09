'use client'

import { useState, useTransition } from 'react'
import { Globe, Palette, Image, Moon, Sun, Check, Loader2, ExternalLink } from 'lucide-react'
import { updateMembersAreaConfig, checkSubdomainAvailability, toggleMembersArea } from '@/lib/actions/members-area'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import type { MembersAreaTheme } from '@/types/database'

interface MembersAreaSettingsProps {
  courseId: string
  enabled: boolean
  subdomain: string | null
  customDomain: string | null
  theme: MembersAreaTheme
  onToggleEnabled: (enabled: boolean) => void
}

export function MembersAreaSettings({
  courseId,
  enabled,
  subdomain,
  customDomain,
  theme,
  onToggleEnabled,
}: MembersAreaSettingsProps) {
  const [isPending, startTransition] = useTransition()
  const [membersEnabled, setMembersEnabled] = useState(enabled)
  const [subdomainValue, setSubdomainValue] = useState(subdomain || '')
  const [customDomainValue, setCustomDomainValue] = useState(customDomain || '')
  const [primaryColor, setPrimaryColor] = useState(theme.primaryColor)
  const [logoUrl, setLogoUrl] = useState(theme.logoUrl || '')
  const [darkMode, setDarkMode] = useState(theme.darkMode)
  const [subdomainStatus, setSubdomainStatus] = useState<'idle' | 'checking' | 'available' | 'unavailable'>('idle')
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  const baseDomain = typeof window !== 'undefined'
    ? window.location.hostname.replace(/^[^.]+\./, '')
    : 'gestaltedu.com.br'

  const handleToggleEnabled = () => {
    const newValue = !membersEnabled
    setMembersEnabled(newValue)
    startTransition(async () => {
      const result = await toggleMembersArea(courseId, newValue)
      if ('success' in result) {
        onToggleEnabled(newValue)
      }
    })
  }

  const handleCheckSubdomain = async (value: string) => {
    if (value.length < 3) {
      setSubdomainStatus('idle')
      return
    }
    setSubdomainStatus('checking')
    const result = await checkSubdomainAvailability(value, courseId)
    if ('available' in result) {
      setSubdomainStatus(result.available ? 'available' : 'unavailable')
    } else {
      setSubdomainStatus('unavailable')
    }
  }

  const handleSubdomainChange = (value: string) => {
    const normalized = value.toLowerCase().replace(/[^a-z0-9-]/g, '')
    setSubdomainValue(normalized)
    setSubdomainStatus('idle')
  }

  const handleSaveSettings = () => {
    setSaveStatus('saving')
    startTransition(async () => {
      const result = await updateMembersAreaConfig(courseId, {
        subdomain: subdomainValue || null,
        customDomain: customDomainValue || null,
        theme: {
          primaryColor,
          logoUrl: logoUrl || null,
          darkMode,
        },
      })
      if ('success' in result) {
        setSaveStatus('saved')
        setTimeout(() => setSaveStatus('idle'), 3000)
      } else {
        setSaveStatus('error')
        setTimeout(() => setSaveStatus('idle'), 3000)
      }
    })
  }

  // Preset color options
  const colorPresets = [
    '#F97316', '#EF4444', '#8B5CF6', '#3B82F6', '#10B981',
    '#06B6D4', '#EC4899', '#F59E0B', '#6366F1', '#14B8A6',
  ]

  return (
    <div className="space-y-8">
      {/* Enable/Disable Toggle */}
      <div className="bg-white rounded-xl border border-brand-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-brand-gray-900">
              Área de Membros
            </h3>
            <p className="text-sm text-brand-gray-500 mt-1">
              Ative ou desative a área de membros para este curso
            </p>
          </div>
          <button
            onClick={handleToggleEnabled}
            disabled={isPending}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-orange/20 ${
              membersEnabled ? 'bg-brand-orange' : 'bg-brand-gray-300'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
                membersEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Domain Configuration */}
      <div className="bg-white rounded-xl border border-brand-gray-200 p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Globe size={20} className="text-brand-orange" />
          <h3 className="text-lg font-semibold text-brand-gray-900">
            Domínio e Acesso
          </h3>
        </div>

        {/* Subdomain */}
        <div>
          <Input
            label="Subdomínio da Área de Membros"
            value={subdomainValue}
            onChange={(e) => handleSubdomainChange(e.target.value)}
            onBlur={() => handleCheckSubdomain(subdomainValue)}
            placeholder="meucurso"
            helperText={`Sua área de membros será acessível em: ${subdomainValue || 'meucurso'}.${baseDomain}`}
          />
          {subdomainStatus === 'checking' && (
            <div className="flex items-center gap-2 mt-1.5 text-sm text-brand-gray-500">
              <Loader2 size={14} className="animate-spin" />
              Verificando disponibilidade...
            </div>
          )}
          {subdomainStatus === 'available' && (
            <div className="flex items-center gap-2 mt-1.5 text-sm text-green-600">
              <Check size={14} />
              Subdomínio disponível!
            </div>
          )}
          {subdomainStatus === 'unavailable' && (
            <p className="mt-1.5 text-sm text-red-500">
              Este subdomínio já está em uso.
            </p>
          )}
        </div>

        {/* Custom Domain */}
        <div>
          <Input
            label="Domínio Personalizado (opcional)"
            value={customDomainValue}
            onChange={(e) => setCustomDomainValue(e.target.value)}
            placeholder="membros.meusite.com.br"
            helperText="Configure um domínio próprio apontando para o servidor da plataforma"
          />
        </div>

        {/* Preview URL */}
        {subdomainValue && (
          <div className="bg-brand-gray-50 rounded-lg p-4 border border-brand-gray-200">
            <p className="text-sm text-brand-gray-600 mb-2">URL de acesso da área de membros:</p>
            <div className="flex items-center gap-2">
              <code className="text-sm font-mono bg-white px-3 py-1.5 rounded border border-brand-gray-200">
                {subdomainValue}.{baseDomain}
              </code>
              {membersEnabled && (
                <a
                  href={`https://${subdomainValue}.${baseDomain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-orange hover:text-brand-orange/80"
                >
                  <ExternalLink size={16} />
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Theme Configuration */}
      <div className="bg-white rounded-xl border border-brand-gray-200 p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Palette size={20} className="text-brand-orange" />
          <h3 className="text-lg font-semibold text-brand-gray-900">
            Aparência e Tema
          </h3>
        </div>

        {/* Primary Color */}
        <div>
          <label className="block text-sm font-medium text-brand-gray-700 mb-2">
            Cor Primária
          </label>
          <div className="flex items-center gap-3 flex-wrap">
            {colorPresets.map((color) => (
              <button
                key={color}
                onClick={() => setPrimaryColor(color)}
                className={`h-8 w-8 rounded-full border-2 transition-all ${
                  primaryColor === color
                    ? 'border-brand-gray-900 scale-110'
                    : 'border-transparent hover:scale-105'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="h-8 w-8 rounded cursor-pointer border border-brand-gray-200"
              />
              <span className="text-sm text-brand-gray-500 font-mono">{primaryColor}</span>
            </div>
          </div>
        </div>

        {/* Logo URL */}
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Image size={16} className="text-brand-gray-500" />
            <label className="block text-sm font-medium text-brand-gray-700">
              Logo da Área de Membros
            </label>
          </div>
          <Input
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="https://exemplo.com/logo.png"
            helperText="URL da imagem do logo que aparecerá na área de membros"
          />
          {logoUrl && (
            <div className="mt-3 bg-brand-gray-50 rounded-lg p-4 border border-brand-gray-200 inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoUrl}
                alt="Logo preview"
                className="h-10 object-contain"
                onError={(e) => {
                  ;(e.target as HTMLImageElement).style.display = 'none'
                }}
              />
            </div>
          )}
        </div>

        {/* Dark Mode Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {darkMode ? <Moon size={20} className="text-brand-gray-600" /> : <Sun size={20} className="text-yellow-500" />}
            <div>
              <p className="text-sm font-medium text-brand-gray-900">Modo Escuro</p>
              <p className="text-xs text-brand-gray-500">Alterna entre tema claro e escuro</p>
            </div>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-orange/20 ${
              darkMode ? 'bg-brand-orange' : 'bg-brand-gray-300'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
                darkMode ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Theme Preview */}
        <div className="border border-brand-gray-200 rounded-lg overflow-hidden">
          <p className="text-xs font-medium text-brand-gray-500 px-3 py-2 bg-brand-gray-50 border-b border-brand-gray-200">
            Preview do Tema
          </p>
          <div
            className="p-4"
            style={{
              backgroundColor: darkMode ? '#1a1a2e' : '#ffffff',
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="h-8 object-contain"
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              ) : (
                <div
                  className="h-8 w-8 rounded flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: primaryColor }}
                >
                  G
                </div>
              )}
              <span
                className="font-semibold text-sm"
                style={{ color: darkMode ? '#ffffff' : '#111827' }}
              >
                Gestalt EDU
              </span>
            </div>
            <div
              className="h-2 rounded-full w-2/3"
              style={{ backgroundColor: primaryColor + '30' }}
            >
              <div
                className="h-2 rounded-full w-1/2"
                style={{ backgroundColor: primaryColor }}
              />
            </div>
            <div className="mt-3 flex gap-2">
              <div
                className="h-16 w-24 rounded-lg"
                style={{ backgroundColor: darkMode ? '#2a2a4a' : '#f3f4f6' }}
              />
              <div
                className="h-16 w-24 rounded-lg"
                style={{ backgroundColor: darkMode ? '#2a2a4a' : '#f3f4f6' }}
              />
              <div
                className="h-16 w-24 rounded-lg"
                style={{ backgroundColor: darkMode ? '#2a2a4a' : '#f3f4f6' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSaveSettings}
          disabled={isPending || saveStatus === 'saving'}
        >
          {saveStatus === 'saving' && <Loader2 size={18} className="animate-spin" />}
          {saveStatus === 'saved' && <Check size={18} />}
          {saveStatus === 'error' && 'Erro ao salvar'}
          {saveStatus === 'saving' ? 'Salvando...' : saveStatus === 'saved' ? 'Salvo!' : 'Salvar Configurações'}
        </Button>
      </div>
    </div>
  )
}
