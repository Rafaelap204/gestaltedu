import { createClient } from '@supabase/supabase-js'
import type { LedgerEntryType } from '@/types/database'

function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

interface SplitResult {
  platformAmount: number
  teacherAmount: number
  affiliateAmount: number
  affiliateUserId: string | null
}

interface PayoutRules {
  platform_pct: number
  teacher_pct: number
  affiliate_pct: number
}

const DEFAULT_PAYOUT_RULES: PayoutRules = {
  platform_pct: 30.00,
  teacher_pct: 70.00,
  affiliate_pct: 0.00,
}

/**
 * Busca as regras de pagamento para um curso específico
 * Se não existir, retorna os valores padrão
 */
async function getPayoutRules(courseId: string, supabase: ReturnType<typeof createServiceClient>): Promise<PayoutRules> {
  const { data: rules, error } = await supabase
    .from('payout_rules')
    .select('platform_pct, teacher_pct, affiliate_pct')
    .eq('course_id', courseId)
    .single()

  if (error || !rules) {
    return DEFAULT_PAYOUT_RULES
  }

  return rules
}

/**
 * Busca a atribuição de afiliado para um pedido
 * Retorna o owner_user_id do afiliado se existir
 */
async function getAffiliateAttribution(
  orderId: string,
  refCode: string | null,
  supabase: ReturnType<typeof createServiceClient>
): Promise<{ userId: string; codeId: string } | null> {
  if (!refCode) {
    // Tenta buscar por order_id na tabela referral_attributions
    const { data: attribution } = await supabase
      .from('referral_attributions')
      .select('code_id, user_id')
      .eq('order_id', orderId)
      .single()

    if (attribution) {
      const { data: code } = await supabase
        .from('referral_codes')
        .select('owner_user_id')
        .eq('id', attribution.code_id)
        .single()

      if (code) {
        return { userId: code.owner_user_id, codeId: attribution.code_id }
      }
    }
    return null
  }

  // Busca pelo código de referência
  const { data: code } = await supabase
    .from('referral_codes')
    .select('id, owner_user_id')
    .eq('code', refCode)
    .single()

  if (!code) return null

  return { userId: code.owner_user_id, codeId: code.id }
}

/**
 * Calcula o split de pagamento entre plataforma, professor e afiliado
 */
export async function calculateSplit(orderId: string): Promise<SplitResult> {
  const supabase = createServiceClient()

  // 1. Buscar o pedido
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, course_id, amount, ref_code')
    .eq('id', orderId)
    .single()

  if (orderError || !order) {
    throw new Error(`Order not found: ${orderId}`)
  }

  // Se o valor for zero, não há split necessário
  if (order.amount <= 0) {
    return {
      platformAmount: 0,
      teacherAmount: 0,
      affiliateAmount: 0,
      affiliateUserId: null,
    }
  }

  // 2. Buscar o curso para obter teacher_id
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('id, teacher_id')
    .eq('id', order.course_id)
    .single()

  if (courseError || !course) {
    throw new Error(`Course not found: ${order.course_id}`)
  }

  // 3. Buscar regras de pagamento
  const rules = await getPayoutRules(order.course_id, supabase)

  // 4. Verificar se há atribuição de afiliado
  const affiliateAttribution = await getAffiliateAttribution(orderId, order.ref_code, supabase)

  const amount = order.amount
  let platformAmount: number
  let teacherAmount: number
  let affiliateAmount: number = 0

  // 5. Calcular os valores
  if (affiliateAttribution && rules.affiliate_pct > 0) {
    // Com afiliado: primeiro desconta a comissão do afiliado
    affiliateAmount = Math.round(amount * (rules.affiliate_pct / 100) * 100) / 100
    const remaining = amount - affiliateAmount

    // O restante é dividido entre plataforma e professor
    const totalRemainingPct = rules.platform_pct + rules.teacher_pct
    if (totalRemainingPct > 0) {
      platformAmount = Math.round(remaining * (rules.platform_pct / totalRemainingPct) * 100) / 100
      teacherAmount = Math.round((remaining - platformAmount) * 100) / 100
    } else {
      // Se a soma for 0, tudo vai para o professor
      platformAmount = 0
      teacherAmount = remaining
    }
  } else {
    // Sem afiliado: divisão direta
    platformAmount = Math.round(amount * (rules.platform_pct / 100) * 100) / 100
    teacherAmount = Math.round(amount * (rules.teacher_pct / 100) * 100) / 100

    // Ajustar arredondamento para garantir que a soma seja exata
    const totalCalculated = platformAmount + teacherAmount
    if (totalCalculated !== amount) {
      const diff = Math.round((amount - totalCalculated) * 100) / 100
      teacherAmount += diff
    }
  }

  return {
    platformAmount,
    teacherAmount,
    affiliateAmount,
    affiliateUserId: affiliateAttribution?.userId || null,
  }
}

/**
 * Processa o split de pagamento criando as entradas no ledger
 */
export async function processSplit(orderId: string): Promise<{ success: boolean } | { error: string }> {
  const supabase = createServiceClient()

  try {
    // 1. Calcular o split
    const split = await calculateSplit(orderId)

    // 2. Buscar informações do pedido e curso
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('course_id, amount')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return { error: 'Order not found' }
    }

    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('teacher_id, title')
      .eq('id', order.course_id)
      .single()

    if (courseError || !course) {
      return { error: 'Course not found' }
    }

    // 3. Verificar se já existem ledger entries para este pedido (idempotência)
    const { data: existingEntries } = await supabase
      .from('ledger_entries')
      .select('id')
      .eq('reference_id', orderId)
      .limit(1)

    if (existingEntries && existingEntries.length > 0) {
      console.log(`Ledger entries already exist for order ${orderId}, skipping...`)
      return { success: true }
    }

    // 4. Criar entradas no ledger
    const ledgerEntries: {
      type: LedgerEntryType
      amount: number
      currency: string
      user_id: string
      reference_id: string
      status: string
      description: string
    }[] = []

    // Entrada para o professor (venda)
    if (split.teacherAmount > 0) {
      ledgerEntries.push({
        type: 'sale',
        amount: split.teacherAmount,
        currency: 'BRL',
        user_id: course.teacher_id,
        reference_id: orderId,
        status: 'cleared',
        description: `Venda do curso: ${course.title}`,
      })
    }

    // Entrada para a plataforma (comissão)
    // Usamos o teacher_id como placeholder para a plataforma (ou podemos ter um user_id específico para admin)
    // Aqui vamos usar o teacher_id do curso como referência, mas marcamos como comissão da plataforma
    if (split.platformAmount > 0) {
      // Buscar um admin para associar a comissão da plataforma
      const { data: admin } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'admin')
        .limit(1)
        .single()

      const platformUserId = admin?.id || course.teacher_id

      ledgerEntries.push({
        type: 'commission',
        amount: split.platformAmount,
        currency: 'BRL',
        user_id: platformUserId,
        reference_id: orderId,
        status: 'cleared',
        description: `Comissão da plataforma - Curso: ${course.title}`,
      })
    }

    // Entrada para o afiliado (comissão)
    if (split.affiliateAmount > 0 && split.affiliateUserId) {
      ledgerEntries.push({
        type: 'commission',
        amount: split.affiliateAmount,
        currency: 'BRL',
        user_id: split.affiliateUserId,
        reference_id: orderId,
        status: 'cleared',
        description: `Comissão de afiliado - Curso: ${course.title}`,
      })
    }

    // Inserir todas as entradas
    if (ledgerEntries.length > 0) {
      const { error: ledgerError } = await supabase
        .from('ledger_entries')
        .insert(ledgerEntries)

      if (ledgerError) {
        console.error('Error creating ledger entries:', ledgerError)
        return { error: 'Failed to create ledger entries' }
      }
    }

    // 5. Se houver afiliado, criar registro em referral_commissions
    if (split.affiliateAmount > 0 && split.affiliateUserId) {
      const { data: refAttribution } = await supabase
        .from('referral_attributions')
        .select('code_id')
        .eq('order_id', orderId)
        .single()

      if (refAttribution) {
        const { error: commissionError } = await supabase
          .from('referral_commissions')
          .insert({
            code_id: refAttribution.code_id,
            order_id: orderId,
            amount: split.affiliateAmount,
            status: 'cleared',
          })

        if (commissionError) {
          console.error('Error creating referral commission:', commissionError)
          // Não falha o processo, apenas loga o erro
        }
      }
    }

    console.log(`Split processed successfully for order ${orderId}:`, {
      platform: split.platformAmount,
      teacher: split.teacherAmount,
      affiliate: split.affiliateAmount,
    })

    return { success: true }
  } catch (error) {
    console.error('Error processing split:', error)
    return { error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
