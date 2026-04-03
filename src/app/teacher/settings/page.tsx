'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Camera, Lock, Mail, User, Shield, Building2, CreditCard } from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { toast } from '@/lib/stores/toast-store'
import { updateProfileAction, changePasswordAction } from '@/lib/actions/auth'
import { createClient } from '@/lib/supabase/client'

export default function TeacherSettingsPage() {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null)
  const [profile, setProfile] = useState<{ id: string; name: string | null; avatar_url: string | null; role: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadSession() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        setUser({ id: user.id, email: user.email! })
        
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, name, avatar_url, role')
          .eq('user_id', user.id)
          .single()
        
        if (profileData) {
          setProfile(profileData)
        }
      }
      setLoading(false)
    }
    
    loadSession()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-orange" />
      </div>
    )
  }

  if (!user || !profile) {
    return (
      <div className="text-center py-12">
        <p className="text-brand-gray-500">Não autorizado</p>
      </div>
    )
  }

  return <SettingsContent user={user} profile={profile} onProfileUpdate={setProfile} />
}

function SettingsContent({ 
  user, 
  profile, 
  onProfileUpdate 
}: { 
  user: { id: string; email: string }; 
  profile: { id: string; name: string | null; avatar_url: string | null; role: string };
  onProfileUpdate: (profile: any) => void;
}) {
  // Profile state
  const [name, setName] = useState(profile.name || '')
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url)
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Password state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  // Bank info state (placeholder)
  const [bankInfo, setBankInfo] = useState({
    bankName: '',
    accountType: 'checking',
    agency: '',
    account: '',
    pixKey: '',
  })

  // Handle avatar upload
  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Tipo de arquivo inválido', 'Por favor, selecione uma imagem.')
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Arquivo muito grande', 'O tamanho máximo é 2MB.')
      return
    }

    setIsUploadingAvatar(true)

    try {
      const supabase = createClient()
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        })

      if (uploadError) {
        throw uploadError
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      setAvatarUrl(publicUrl)
      toast.success('Avatar atualizado', 'Sua foto de perfil foi atualizada com sucesso.')
    } catch (error) {
      console.error('Error uploading avatar:', error)
      toast.error('Erro ao enviar avatar', 'Tente novamente mais tarde.')
    } finally {
      setIsUploadingAvatar(false)
    }
  }, [user.id])

  // Handle profile update
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      toast.error('Nome obrigatório', 'Por favor, informe seu nome.')
      return
    }

    setIsUpdatingProfile(true)

    try {
      const formData = new FormData()
      formData.append('name', name)
      if (avatarUrl) {
        formData.append('avatar_url', avatarUrl)
      }

      await updateProfileAction(formData)
      
      onProfileUpdate({ ...profile, name, avatar_url: avatarUrl })
      toast.success('Perfil atualizado', 'Suas informações foram salvas com sucesso.')
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Erro ao atualizar perfil', 'Tente novamente mais tarde.')
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  // Handle password change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Campos obrigatórios', 'Por favor, preencha todos os campos.')
      return
    }

    if (newPassword.length < 6) {
      toast.error('Senha muito curta', 'A nova senha deve ter pelo menos 6 caracteres.')
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error('Senhas não coincidem', 'As senhas digitadas não são iguais.')
      return
    }

    setIsChangingPassword(true)

    try {
      const formData = new FormData()
      formData.append('current_password', currentPassword)
      formData.append('new_password', newPassword)
      formData.append('confirm_password', confirmPassword)

      await changePasswordAction(formData)

      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      toast.success('Senha alterada', 'Sua senha foi alterada com sucesso.')
    } catch (error) {
      console.error('Error changing password:', error)
      toast.error('Erro ao alterar senha', 'Verifique sua senha atual e tente novamente.')
    } finally {
      setIsChangingPassword(false)
    }
  }

  // Get role badge variant
  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'error'
      case 'teacher':
        return 'warning'
      default:
        return 'default'
    }
  }

  // Get role label
  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrador'
      case 'teacher':
        return 'Professor'
      default:
        return 'Aluno'
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-brand-gray-900">
          Configurações
        </h1>
        <p className="text-brand-gray-500 mt-1">
          Gerencie suas informações pessoais e dados para saque
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-orange-light">
                <User size={20} className="text-brand-orange" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-brand-gray-900">
                  Perfil
                </h2>
                <p className="text-sm text-brand-gray-500">
                  Atualize suas informações pessoais
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              {/* Avatar */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar
                    src={avatarUrl || undefined}
                    name={name}
                    size="lg"
                    className={isUploadingAvatar ? 'opacity-50' : ''}
                  />
                  <button
                    type="button"
                    onClick={handleAvatarClick}
                    disabled={isUploadingAvatar}
                    className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-brand-orange text-white hover:bg-brand-orange-hover transition-colors duration-200 shadow-sm"
                  >
                    <Camera size={14} />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-brand-gray-900">
                    Foto de Perfil
                  </p>
                  <p className="text-xs text-brand-gray-500">
                    Clique no ícone para alterar
                  </p>
                </div>
              </div>

              {/* Name */}
              <Input
                label="Nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome completo"
                required
              />

              {/* Submit */}
              <Button
                type="submit"
                loading={isUpdatingProfile}
                className="w-full"
              >
                Salvar Perfil
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Password Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                <Lock size={20} className="text-blue-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-brand-gray-900">
                  Senha
                </h2>
                <p className="text-sm text-brand-gray-500">
                  Altere sua senha de acesso
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <Input
                label="Senha Atual"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Digite sua senha atual"
              />

              <Input
                label="Nova Senha"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Digite sua nova senha"
                helperText="Mínimo de 6 caracteres"
              />

              <Input
                label="Confirmar Nova Senha"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirme sua nova senha"
              />

              <Button
                type="submit"
                variant="secondary"
                loading={isChangingPassword}
                className="w-full"
              >
                Alterar Senha
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Bank Info Section - Placeholder */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
                <Building2 size={20} className="text-green-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-brand-gray-900">
                  Dados para Saque
                </h2>
                <p className="text-sm text-brand-gray-500">
                  Informações bancárias para recebimento dos saques
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 mb-6">
              <div className="flex items-start gap-3">
                <CreditCard size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-800">
                    Em breve
                  </p>
                  <p className="text-sm text-blue-700 mt-1">
                    O cadastro de dados bancários será disponibilizado em breve. 
                    Por enquanto, entre em contato com o suporte para configurar seus dados de recebimento.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-50 pointer-events-none">
              <Input
                label="Banco"
                value={bankInfo.bankName}
                onChange={(e) => setBankInfo({ ...bankInfo, bankName: e.target.value })}
                placeholder="Nome do banco"
                disabled
              />

              <div>
                <label className="block text-sm font-medium text-brand-gray-700 mb-1.5">
                  Tipo de Conta
                </label>
                <select
                  value={bankInfo.accountType}
                  onChange={(e) => setBankInfo({ ...bankInfo, accountType: e.target.value })}
                  disabled
                  className="w-full rounded-lg border border-brand-gray-300 px-3 py-2.5 text-sm text-brand-gray-900 bg-white"
                >
                  <option value="checking">Conta Corrente</option>
                  <option value="savings">Conta Poupança</option>
                </select>
              </div>

              <Input
                label="Agência"
                value={bankInfo.agency}
                onChange={(e) => setBankInfo({ ...bankInfo, agency: e.target.value })}
                placeholder="0000"
                disabled
              />

              <Input
                label="Conta"
                value={bankInfo.account}
                onChange={(e) => setBankInfo({ ...bankInfo, account: e.target.value })}
                placeholder="00000-0"
                disabled
              />

              <div className="md:col-span-2">
                <Input
                  label="Chave PIX"
                  value={bankInfo.pixKey}
                  onChange={(e) => setBankInfo({ ...bankInfo, pixKey: e.target.value })}
                  placeholder="CPF, email, telefone ou chave aleatória"
                  disabled
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Section */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50">
                <Shield size={20} className="text-purple-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-brand-gray-900">
                  Conta
                </h2>
                <p className="text-sm text-brand-gray-500">
                  Informações da sua conta
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-brand-gray-700 mb-1.5">
                  Email
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-lg border border-brand-gray-200 bg-brand-gray-50 text-brand-gray-500">
                    <Mail size={16} />
                    <span className="text-sm">{user.email}</span>
                  </div>
                </div>
                <p className="text-xs text-brand-gray-500 mt-1.5">
                  O email não pode ser alterado
                </p>
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-brand-gray-700 mb-1.5">
                  Tipo de Conta
                </label>
                <div className="flex items-center gap-3">
                  <Badge variant={getRoleBadgeVariant(profile.role) as any}>
                    {getRoleLabel(profile.role)}
                  </Badge>
                </div>
                <p className="text-xs text-brand-gray-500 mt-1.5">
                  Entre em contato com o suporte para alterar seu tipo de conta
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
