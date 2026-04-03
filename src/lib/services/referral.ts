import { createClient } from '@/lib/supabase/server'

export async function createReferralAttribution(data: {
  code: string
  userId?: string
  orderId?: string
}): Promise<{ id: string } | { error: string }> {
  try {
    const supabase = await createClient()
    
    // Find code_id from referral_codes
    const { data: referralCode, error: codeError } = await supabase
      .from('referral_codes')
      .select('id, owner_user_id')
      .eq('code', data.code)
      .single()
    
    if (codeError || !referralCode) {
      return { error: 'Código de indicação não encontrado' }
    }
    
    // Validate: code owner != userId (anti-fraud: no self-referral)
    if (data.userId && referralCode.owner_user_id === data.userId) {
      return { error: 'Não é possível usar seu próprio código de indicação' }
    }
    
    // Calculate expires_at (30 days from now)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)
    
    // Create referral_attribution
    const { data: attribution, error: attributionError } = await supabase
      .from('referral_attributions')
      .insert({
        code_id: referralCode.id,
        user_id: data.userId || null,
        order_id: data.orderId || null,
        expires_at: expiresAt.toISOString(),
      })
      .select('id')
      .single()
    
    if (attributionError || !attribution) {
      console.error('Error creating referral attribution:', attributionError)
      return { error: 'Erro ao criar atribuição de indicação' }
    }
    
    return { id: attribution.id }
  } catch (error) {
    console.error('Error in createReferralAttribution:', error)
    return { error: 'Erro ao processar atribuição de indicação' }
  }
}

export async function getAttributionForOrder(orderId: string): Promise<{
  codeId: string
  ownerId: string
} | null> {
  try {
    const supabase = await createClient()
    
    // Find referral_attribution linked to this order
    const { data: attribution, error: attributionError } = await supabase
      .from('referral_attributions')
      .select('code_id, expires_at')
      .eq('order_id', orderId)
      .single()
    
    if (attributionError || !attribution) {
      return null
    }
    
    // Check if not expired
    if (attribution.expires_at && new Date(attribution.expires_at) < new Date()) {
      return null
    }
    
    // Get code owner
    const { data: code, error: codeError } = await supabase
      .from('referral_codes')
      .select('owner_user_id')
      .eq('id', attribution.code_id)
      .single()
    
    if (codeError || !code) {
      return null
    }
    
    return {
      codeId: attribution.code_id,
      ownerId: code.owner_user_id,
    }
  } catch (error) {
    console.error('Error in getAttributionForOrder:', error)
    return null
  }
}
