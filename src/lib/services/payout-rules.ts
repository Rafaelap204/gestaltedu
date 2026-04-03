import { createClient } from '@supabase/supabase-js'

function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

interface PayoutRules {
  platform_pct: number
  teacher_pct: number
  affiliate_pct: number
}

const DEFAULT_PAYOUT_RULES: PayoutRules = {
  platform_pct: 30.00,
  teacher_pct: 70.00,
  affiliate_pct: 10.00,
}

/**
 * Obtém as regras de pagamento para um curso específico
 * Se não existir regra específica, retorna os valores padrão
 */
export async function getPayoutRules(courseId: string): Promise<PayoutRules> {
  const supabase = createServiceClient()

  const { data: rules, error } = await supabase
    .from('payout_rules')
    .select('platform_pct, teacher_pct, affiliate_pct')
    .eq('course_id', courseId)
    .single()

  if (error || !rules) {
    return DEFAULT_PAYOUT_RULES
  }

  return {
    platform_pct: Number(rules.platform_pct),
    teacher_pct: Number(rules.teacher_pct),
    affiliate_pct: Number(rules.affiliate_pct),
  }
}

/**
 * Atualiza ou cria as regras de pagamento para um curso
 * Valida que as porcentagens somam no máximo 100%
 */
export async function updatePayoutRules(
  courseId: string,
  rules: PayoutRules
): Promise<{ success: boolean } | { error: string }> {
  const supabase = createServiceClient()

  // 1. Validar que as porcentagens são não-negativas
  if (rules.platform_pct < 0 || rules.teacher_pct < 0 || rules.affiliate_pct < 0) {
    return { error: 'As porcentagens não podem ser negativas' }
  }

  // 2. Validar que a soma não ultrapassa 100%
  const totalPct = rules.platform_pct + rules.teacher_pct + rules.affiliate_pct
  if (totalPct > 100) {
    return { error: `A soma das porcentagens (${totalPct}%) não pode ultrapassar 100%` }
  }

  // 3. Verificar se o curso existe
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('id, teacher_id')
    .eq('id', courseId)
    .single()

  if (courseError || !course) {
    return { error: 'Curso não encontrado' }
  }

  // 4. Verificar se já existe uma regra para este curso
  const { data: existingRule } = await supabase
    .from('payout_rules')
    .select('id')
    .eq('course_id', courseId)
    .single()

  let result

  if (existingRule) {
    // Atualizar regra existente
    result = await supabase
      .from('payout_rules')
      .update({
        platform_pct: rules.platform_pct,
        teacher_pct: rules.teacher_pct,
        affiliate_pct: rules.affiliate_pct,
      })
      .eq('course_id', courseId)
  } else {
    // Criar nova regra
    result = await supabase
      .from('payout_rules')
      .insert({
        course_id: courseId,
        teacher_id: course.teacher_id,
        platform_pct: rules.platform_pct,
        teacher_pct: rules.teacher_pct,
        affiliate_pct: rules.affiliate_pct,
      })
  }

  if (result.error) {
    console.error('Error updating payout rules:', result.error)
    return { error: 'Erro ao atualizar regras de pagamento' }
  }

  return { success: true }
}

/**
 * Obtém as regras de pagamento para um professor (regras padrão do professor)
 * Isso pode ser usado para definir regras padrão para novos cursos
 */
export async function getTeacherDefaultPayoutRules(teacherId: string): Promise<PayoutRules | null> {
  const supabase = createServiceClient()

  const { data: rules, error } = await supabase
    .from('payout_rules')
    .select('platform_pct, teacher_pct, affiliate_pct')
    .eq('teacher_id', teacherId)
    .is('course_id', null)
    .single()

  if (error || !rules) {
    return null
  }

  return {
    platform_pct: Number(rules.platform_pct),
    teacher_pct: Number(rules.teacher_pct),
    affiliate_pct: Number(rules.affiliate_pct),
  }
}

/**
 * Define as regras de pagamento padrão para um professor
 * Estas regras serão aplicadas a novos cursos criados pelo professor
 */
export async function setTeacherDefaultPayoutRules(
  teacherId: string,
  rules: PayoutRules
): Promise<{ success: boolean } | { error: string }> {
  const supabase = createServiceClient()

  // 1. Validar que as porcentagens são não-negativas
  if (rules.platform_pct < 0 || rules.teacher_pct < 0 || rules.affiliate_pct < 0) {
    return { error: 'As porcentagens não podem ser negativas' }
  }

  // 2. Validar que a soma não ultrapassa 100%
  const totalPct = rules.platform_pct + rules.teacher_pct + rules.affiliate_pct
  if (totalPct > 100) {
    return { error: `A soma das porcentagens (${totalPct}%) não pode ultrapassar 100%` }
  }

  // 3. Verificar se já existe uma regra padrão para este professor
  const { data: existingRule } = await supabase
    .from('payout_rules')
    .select('id')
    .eq('teacher_id', teacherId)
    .is('course_id', null)
    .single()

  let result

  if (existingRule) {
    // Atualizar regra existente
    result = await supabase
      .from('payout_rules')
      .update({
        platform_pct: rules.platform_pct,
        teacher_pct: rules.teacher_pct,
        affiliate_pct: rules.affiliate_pct,
      })
      .eq('teacher_id', teacherId)
      .is('course_id', null)
  } else {
    // Criar nova regra
    result = await supabase
      .from('payout_rules')
      .insert({
        teacher_id: teacherId,
        course_id: null,
        platform_pct: rules.platform_pct,
        teacher_pct: rules.teacher_pct,
        affiliate_pct: rules.affiliate_pct,
      })
  }

  if (result.error) {
    console.error('Error setting teacher default payout rules:', result.error)
    return { error: 'Erro ao definir regras de pagamento padrão' }
  }

  return { success: true }
}

/**
 * Aplica as regras de pagamento padrão do professor a um curso específico
 * Útil quando um professor cria um novo curso
 */
export async function applyDefaultPayoutRulesToCourse(
  courseId: string,
  teacherId: string
): Promise<{ success: boolean } | { error: string }> {
  const supabase = createServiceClient()

  // 1. Verificar se o curso já tem regras definidas
  const { data: existingRule } = await supabase
    .from('payout_rules')
    .select('id')
    .eq('course_id', courseId)
    .single()

  if (existingRule) {
    // Já existe regra, não sobrescrever
    return { success: true }
  }

  // 2. Buscar regras padrão do professor
  const defaultRules = await getTeacherDefaultPayoutRules(teacherId)

  if (!defaultRules) {
    // Não há regras padrão, usar regras globais padrão
    return { success: true }
  }

  // 3. Aplicar regras padrão ao curso
  const result = await supabase
    .from('payout_rules')
    .insert({
      course_id: courseId,
      teacher_id: teacherId,
      platform_pct: defaultRules.platform_pct,
      teacher_pct: defaultRules.teacher_pct,
      affiliate_pct: defaultRules.affiliate_pct,
    })

  if (result.error) {
    console.error('Error applying default payout rules:', result.error)
    return { error: 'Erro ao aplicar regras de pagamento padrão' }
  }

  return { success: true }
}
