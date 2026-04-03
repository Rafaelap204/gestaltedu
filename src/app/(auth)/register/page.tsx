'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

// Force dynamic rendering to avoid prerendering issues with Supabase client
export const dynamic = 'force-dynamic'

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('As senhas não coincidem')
      return
    }

    // Validate password length
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres')
      return
    }

    setLoading(true)

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      })

      if (signUpError) {
        setError(signUpError.message === 'User already registered' 
          ? 'Este email já está cadastrado' 
          : 'Erro ao criar conta')
        return
      }

      // Check if email confirmation is required
      if (data.session) {
        // Email confirmation is disabled, user is logged in
        router.push('/app')
        router.refresh()
      } else {
        // Email confirmation is required
        setSuccess(true)
      }
    } catch {
      setError('Ocorreu um erro ao criar a conta')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <>
        <div className="text-center mb-6">
          <h2 className="text-2xl font-semibold text-brand-black">
            Verifique seu email
          </h2>
        </div>

        <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-green-700 text-center">
          <p className="mb-2">
            Enviamos um link de confirmação para <strong>{email}</strong>
          </p>
          <p className="text-sm">
            Clique no link para ativar sua conta.
          </p>
        </div>

        <div className="mt-6 text-center">
          <Link 
            href="/login" 
            className="text-brand-orange hover:text-brand-orange-hover font-medium transition-colors"
          >
            Voltar para o login
          </Link>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-semibold text-brand-black">
          Criar conta
        </h2>
        <p className="mt-1 text-sm text-brand-gray-600">
          Preencha os dados abaixo para se cadastrar
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
            {error}
          </div>
        )}

        <div>
          <label 
            htmlFor="name" 
            className="block text-sm font-medium text-brand-gray-700 mb-1"
          >
            Nome completo
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 border border-brand-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent transition-colors"
            placeholder="Seu nome"
          />
        </div>

        <div>
          <label 
            htmlFor="email" 
            className="block text-sm font-medium text-brand-gray-700 mb-1"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border border-brand-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent transition-colors"
            placeholder="seu@email.com"
          />
        </div>

        <div>
          <label 
            htmlFor="password" 
            className="block text-sm font-medium text-brand-gray-700 mb-1"
          >
            Senha
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-3 py-2 border border-brand-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent transition-colors"
            placeholder="Mínimo 6 caracteres"
          />
        </div>

        <div>
          <label 
            htmlFor="confirmPassword" 
            className="block text-sm font-medium text-brand-gray-700 mb-1"
          >
            Confirmar senha
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full px-3 py-2 border border-brand-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent transition-colors"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 bg-brand-orange hover:bg-brand-orange-hover disabled:bg-brand-gray-400 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2"
        >
          {loading ? 'Criando conta...' : 'Criar conta'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-brand-gray-600">
          Já tem uma conta?{' '}
          <Link 
            href="/login" 
            className="text-brand-orange hover:text-brand-orange-hover font-medium transition-colors"
          >
            Entrar
          </Link>
        </p>
      </div>
    </>
  )
}
