import { createClient } from '@supabase/supabase-js'

function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const MINIMUM_WITHDRAWAL_AMOUNT = 10.00 // R$ 10,00

interface TeacherBalance {
  totalEarned: number      // Soma de todas as entradas 'sale' no ledger
  totalWithdrawn: number   // Soma de saques completados
  pendingWithdrawals: number // Soma de saques pendentes/em processamento
  available: number        // totalEarned - totalWithdrawn - pendingWithdrawals
}

/**
 * Obtém o saldo do professor incluindo ganhos totais, saques e saldo disponível
 */
export async function getTeacherBalance(teacherProfileId: string): Promise<TeacherBalance> {
  const supabase = createServiceClient()

  // 1. Calcular total ganho (entradas do tipo 'sale' com status 'cleared')
  const { data: salesData, error: salesError } = await supabase
    .from('ledger_entries')
    .select('amount')
    .eq('user_id', teacherProfileId)
    .eq('type', 'sale')
    .eq('status', 'cleared')

  if (salesError) {
    console.error('Error fetching sales:', salesError)
    throw new Error('Failed to fetch teacher sales')
  }

  const totalEarned = salesData?.reduce((sum, entry) => sum + Number(entry.amount), 0) || 0

  // 2. Calcular total sacado (saques com status 'completed')
  const { data: withdrawnData, error: withdrawnError } = await supabase
    .from('withdraw_requests')
    .select('amount')
    .eq('teacher_id', teacherProfileId)
    .eq('status', 'completed')

  if (withdrawnError) {
    console.error('Error fetching withdrawn amounts:', withdrawnError)
    throw new Error('Failed to fetch withdrawn amounts')
  }

  const totalWithdrawn = withdrawnData?.reduce((sum, req) => sum + Number(req.amount), 0) || 0

  // 3. Calcular saques pendentes (status 'pending' ou 'processing')
  const { data: pendingData, error: pendingError } = await supabase
    .from('withdraw_requests')
    .select('amount')
    .eq('teacher_id', teacherProfileId)
    .in('status', ['pending', 'processing'])

  if (pendingError) {
    console.error('Error fetching pending withdrawals:', pendingError)
    throw new Error('Failed to fetch pending withdrawals')
  }

  const pendingWithdrawals = pendingData?.reduce((sum, req) => sum + Number(req.amount), 0) || 0

  // 4. Calcular saldo disponível
  const available = Math.max(0, totalEarned - totalWithdrawn - pendingWithdrawals)

  return {
    totalEarned: Math.round(totalEarned * 100) / 100,
    totalWithdrawn: Math.round(totalWithdrawn * 100) / 100,
    pendingWithdrawals: Math.round(pendingWithdrawals * 100) / 100,
    available: Math.round(available * 100) / 100,
  }
}

/**
 * Solicita um saque para o professor
 */
export async function requestWithdraw(
  teacherProfileId: string,
  amount: number
): Promise<{ id: string } | { error: string }> {
  const supabase = createServiceClient()

  // 1. Validar valor mínimo
  if (amount < MINIMUM_WITHDRAWAL_AMOUNT) {
    return { error: `O valor mínimo para saque é R$ ${MINIMUM_WITHDRAWAL_AMOUNT.toFixed(2).replace('.', ',')}` }
  }

  // 2. Verificar se o valor é positivo
  if (amount <= 0) {
    return { error: 'O valor do saque deve ser maior que zero' }
  }

  // 3. Verificar saldo disponível
  let balance: TeacherBalance
  try {
    balance = await getTeacherBalance(teacherProfileId)
  } catch (error) {
    console.error('Error fetching balance:', error)
    return { error: 'Erro ao verificar saldo disponível' }
  }

  if (balance.available < amount) {
    return { error: 'Saldo insuficiente para realizar o saque' }
  }

  // 4. Criar solicitação de saque
  const { data: withdrawRequest, error: insertError } = await supabase
    .from('withdraw_requests')
    .insert({
      teacher_id: teacherProfileId,
      amount: amount,
      status: 'pending',
    })
    .select('id')
    .single()

  if (insertError) {
    console.error('Error creating withdraw request:', insertError)
    return { error: 'Erro ao criar solicitação de saque' }
  }

  if (!withdrawRequest) {
    return { error: 'Erro ao criar solicitação de saque' }
  }

  return { id: withdrawRequest.id }
}

/**
 * Obtém as transações do professor (entradas no ledger)
 */
export async function getTeacherTransactions(
  teacherProfileId: string,
  page: number = 1,
  pageSize: number = 20
): Promise<{ transactions: any[]; total: number }> {
  const supabase = createServiceClient()

  // Calcular offset
  const offset = (page - 1) * pageSize

  // Buscar transações paginadas
  const { data: transactions, error, count } = await supabase
    .from('ledger_entries')
    .select('*', { count: 'exact' })
    .eq('user_id', teacherProfileId)
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1)

  if (error) {
    console.error('Error fetching transactions:', error)
    throw new Error('Failed to fetch transactions')
  }

  return {
    transactions: transactions || [],
    total: count || 0,
  }
}

/**
 * Obtém o histórico de saques do professor
 */
export async function getTeacherWithdrawals(
  teacherProfileId: string,
  page: number = 1,
  pageSize: number = 20
): Promise<{ withdrawals: any[]; total: number }> {
  const supabase = createServiceClient()

  const offset = (page - 1) * pageSize

  const { data: withdrawals, error, count } = await supabase
    .from('withdraw_requests')
    .select('*', { count: 'exact' })
    .eq('teacher_id', teacherProfileId)
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1)

  if (error) {
    console.error('Error fetching withdrawals:', error)
    throw new Error('Failed to fetch withdrawals')
  }

  return {
    withdrawals: withdrawals || [],
    total: count || 0,
  }
}
