'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/utils/auth'
import { getTeacherBalance, requestWithdraw, getTeacherTransactions } from '@/lib/services/balance'

/**
 * Action para solicitar saque
 * - Verifica se o usuário é professor
 * - Chama o serviço de requestWithdraw
 */
export async function requestWithdrawAction(
  amount: number
): Promise<{ id: string } | { error: string }> {
  try {
    const supabase = await createClient()

    // 1. Verificar autenticação
    const session = await requireAuth()
    const userId = session.user.id

    // 2. Buscar profile_id do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('user_id', userId)
      .single()

    if (profileError || !profile) {
      return { error: 'Perfil não encontrado' }
    }

    // 3. Verificar se é professor
    if (profile.role !== 'teacher' && profile.role !== 'admin') {
      return { error: 'Apenas professores podem solicitar saques' }
    }

    // 4. Chamar serviço de saque
    const result = await requestWithdraw(profile.id, amount)

    return result
  } catch (error) {
    console.error('Error in requestWithdrawAction:', error)
    return { error: 'Erro ao processar solicitação de saque' }
  }
}

/**
 * Action para obter saldo do professor
 * - Verifica se o usuário é professor
 * - Retorna o saldo calculado
 */
export async function getTeacherBalanceAction(): Promise<
  | {
      totalEarned: number
      totalWithdrawn: number
      pendingWithdrawals: number
      available: number
    }
  | { error: string }
> {
  try {
    const supabase = await createClient()

    // 1. Verificar autenticação
    const session = await requireAuth()
    const userId = session.user.id

    // 2. Buscar profile_id e role do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('user_id', userId)
      .single()

    if (profileError || !profile) {
      return { error: 'Perfil não encontrado' }
    }

    // 3. Verificar se é professor ou admin
    if (profile.role !== 'teacher' && profile.role !== 'admin') {
      return { error: 'Apenas professores podem visualizar saldo' }
    }

    // 4. Chamar serviço de balance
    const balance = await getTeacherBalance(profile.id)

    return balance
  } catch (error) {
    console.error('Error in getTeacherBalanceAction:', error)
    return { error: 'Erro ao buscar saldo' }
  }
}

/**
 * Action para obter transações do professor (ledger entries)
 * - Verifica se o usuário é professor
 * - Retorna transações paginadas
 */
export async function getTeacherTransactionsAction(
  page: number = 1
): Promise<
  | {
      transactions: Array<{
        id: string
        type: string
        amount: number
        currency: string
        status: string
        description: string | null
        created_at: string
      }>
      total: number
    }
  | { error: string }
> {
  try {
    const supabase = await createClient()

    // 1. Verificar autenticação
    const session = await requireAuth()
    const userId = session.user.id

    // 2. Buscar profile_id e role do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('user_id', userId)
      .single()

    if (profileError || !profile) {
      return { error: 'Perfil não encontrado' }
    }

    // 3. Verificar se é professor ou admin
    if (profile.role !== 'teacher' && profile.role !== 'admin') {
      return { error: 'Apenas professores podem visualizar transações' }
    }

    // 4. Chamar serviço de transações
    const result = await getTeacherTransactions(profile.id, page)

    return {
      transactions: result.transactions.map((t) => ({
        id: t.id,
        type: t.type,
        amount: Number(t.amount),
        currency: t.currency,
        status: t.status,
        description: t.description,
        created_at: t.created_at,
      })),
      total: result.total,
    }
  } catch (error) {
    console.error('Error in getTeacherTransactionsAction:', error)
    return { error: 'Erro ao buscar transações' }
  }
}

/**
 * Action para obter histórico de saques do professor
 */
export async function getTeacherWithdrawalsAction(
  page: number = 1
): Promise<
  | {
      withdrawals: Array<{
        id: string
        amount: number
        status: string
        notes: string | null
        created_at: string
        updated_at: string
      }>
      total: number
    }
  | { error: string }
> {
  try {
    const supabase = await createClient()

    // 1. Verificar autenticação
    const session = await requireAuth()
    const userId = session.user.id

    // 2. Buscar profile_id e role do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('user_id', userId)
      .single()

    if (profileError || !profile) {
      return { error: 'Perfil não encontrado' }
    }

    // 3. Verificar se é professor ou admin
    if (profile.role !== 'teacher' && profile.role !== 'admin') {
      return { error: 'Apenas professores podem visualizar saques' }
    }

    // 4. Buscar saques paginados
    const pageSize = 20
    const offset = (page - 1) * pageSize

    const { data: withdrawals, error, count } = await supabase
      .from('withdraw_requests')
      .select('id, amount, status, notes, created_at, updated_at', { count: 'exact' })
      .eq('teacher_id', profile.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1)

    if (error) {
      console.error('Error fetching withdrawals:', error)
      return { error: 'Erro ao buscar saques' }
    }

    return {
      withdrawals:
        withdrawals?.map((w) => ({
          id: w.id,
          amount: Number(w.amount),
          status: w.status,
          notes: w.notes,
          created_at: w.created_at,
          updated_at: w.updated_at,
        })) || [],
      total: count || 0,
    }
  } catch (error) {
    console.error('Error in getTeacherWithdrawalsAction:', error)
    return { error: 'Erro ao buscar saques' }
  }
}
