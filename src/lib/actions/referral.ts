'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/utils/auth'
import { generateReferralCode } from '@/lib/utils/referral-code'
import { formatDate } from '@/lib/utils/format'

export async function getOrCreateReferralCodeAction(): Promise<{
  code: string
  link: string
} | { error: string }> {
  try {
    const supabase = await createClient()
    
    // Verify user is authenticated
    const session = await requireAuth()
    const userId = session.user.id
    const profileId = session.profile?.id
    
    if (!profileId) {
      return { error: 'Perfil não encontrado' }
    }
    
    // Check if user already has a referral_code
    const { data: existingCode, error: fetchError } = await supabase
      .from('referral_codes')
      .select('code')
      .eq('owner_user_id', profileId)
      .single()
    
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching referral code:', fetchError)
      return { error: 'Erro ao buscar código de indicação' }
    }
    
    if (existingCode) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      return {
        code: existingCode.code,
        link: `${appUrl}/marketplace?ref=${existingCode.code}`
      }
    }
    
    // Generate unique code
    const userName = session.profile?.name || ''
    let newCode = generateReferralCode(userName)
    
    // Ensure code is unique
    let isUnique = false
    let attempts = 0
    while (!isUnique && attempts < 10) {
      const { data: existing } = await supabase
        .from('referral_codes')
        .select('id')
        .eq('code', newCode)
        .single()
      
      if (!existing) {
        isUnique = true
      } else {
        newCode = generateReferralCode(userName)
        attempts++
      }
    }
    
    // Create referral_code record
    const { data: createdCode, error: createError } = await supabase
      .from('referral_codes')
      .insert({
        owner_user_id: profileId,
        code: newCode,
        active: true,
      })
      .select('code')
      .single()
    
    if (createError || !createdCode) {
      console.error('Error creating referral code:', createError)
      return { error: 'Erro ao criar código de indicação' }
    }
    
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    return {
      code: createdCode.code,
      link: `${appUrl}/marketplace?ref=${createdCode.code}`
    }
  } catch (error) {
    console.error('Error in getOrCreateReferralCodeAction:', error)
    return { error: 'Erro ao processar código de indicação' }
  }
}

export async function getReferralStatsAction(): Promise<{
  code: string
  link: string
  totalClicks: number
  totalConversions: number
  totalEarnings: number
  pendingEarnings: number
  recentReferrals: Array<{
    date: string
    type: 'click' | 'conversion'
    amount?: number
  }>
} | { error: string }> {
  try {
    const supabase = await createClient()
    
    // Verify user is authenticated
    const session = await requireAuth()
    const profileId = session.profile?.id
    
    if (!profileId) {
      return { error: 'Perfil não encontrado' }
    }
    
    // Get user's referral code
    const { data: referralCode, error: codeError } = await supabase
      .from('referral_codes')
      .select('id, code')
      .eq('owner_user_id', profileId)
      .single()
    
    if (codeError || !referralCode) {
      return { error: 'Código de indicação não encontrado' }
    }
    
    const codeId = referralCode.id
    
    // Get total clicks
    const { count: totalClicks, error: clicksError } = await supabase
      .from('referral_clicks')
      .select('*', { count: 'exact', head: true })
      .eq('code_id', codeId)
    
    if (clicksError) {
      console.error('Error fetching clicks:', clicksError)
    }
    
    // Get total conversions (attributions with order_id)
    const { count: totalConversions, error: conversionsError } = await supabase
      .from('referral_attributions')
      .select('*', { count: 'exact', head: true })
      .eq('code_id', codeId)
      .not('order_id', 'is', null)
    
    if (conversionsError) {
      console.error('Error fetching conversions:', conversionsError)
    }
    
    // Get total earnings (sum of all commissions)
    const { data: commissions, error: commissionsError } = await supabase
      .from('referral_commissions')
      .select('amount, status')
      .eq('code_id', codeId)
    
    if (commissionsError) {
      console.error('Error fetching commissions:', commissionsError)
    }
    
    const totalEarnings = commissions?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0
    const pendingEarnings = commissions
      ?.filter(c => c.status === 'pending')
      .reduce((sum, c) => sum + (c.amount || 0), 0) || 0
    
    // Get recent activity (last 10 clicks and conversions)
    const recentReferrals: Array<{
      date: string
      type: 'click' | 'conversion'
      amount?: number
    }> = []
    
    // Get recent clicks
    const { data: recentClicks } = await supabase
      .from('referral_clicks')
      .select('created_at')
      .eq('code_id', codeId)
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (recentClicks) {
      recentClicks.forEach(click => {
        recentReferrals.push({
          date: formatDate(click.created_at),
          type: 'click'
        })
      })
    }
    
    // Get recent conversions with amounts
    const { data: recentConversions } = await supabase
      .from('referral_attributions')
      .select('created_at, order_id')
      .eq('code_id', codeId)
      .not('order_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (recentConversions) {
      for (const conv of recentConversions) {
        // Find commission amount for this order
        const { data: commission } = await supabase
          .from('referral_commissions')
          .select('amount')
          .eq('code_id', codeId)
          .eq('order_id', conv.order_id)
          .single()
        
        recentReferrals.push({
          date: formatDate(conv.created_at),
          type: 'conversion',
          amount: commission?.amount
        })
      }
    }
    
    // Sort by date descending and take last 10
    recentReferrals.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    const limitedRecentReferrals = recentReferrals.slice(0, 10)
    
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    
    return {
      code: referralCode.code,
      link: `${appUrl}/marketplace?ref=${referralCode.code}`,
      totalClicks: totalClicks || 0,
      totalConversions: totalConversions || 0,
      totalEarnings,
      pendingEarnings,
      recentReferrals: limitedRecentReferrals
    }
  } catch (error) {
    console.error('Error in getReferralStatsAction:', error)
    return { error: 'Erro ao buscar estatísticas de indicação' }
  }
}

export async function trackReferralClickAction(
  code: string, 
  fingerprint?: string
): Promise<{ success: boolean }> {
  try {
    const supabase = await createClient()
    
    // Find referral_code by code
    const { data: referralCode, error: codeError } = await supabase
      .from('referral_codes')
      .select('id')
      .eq('code', code)
      .single()
    
    if (codeError || !referralCode) {
      console.error('Referral code not found:', code)
      return { success: false }
    }
    
    // Create referral_click record
    const { error: clickError } = await supabase
      .from('referral_clicks')
      .insert({
        code_id: referralCode.id,
        visitor_fingerprint: fingerprint || null,
      })
    
    if (clickError) {
      console.error('Error tracking click:', clickError)
      return { success: false }
    }
    
    return { success: true }
  } catch (error) {
    console.error('Error in trackReferralClickAction:', error)
    return { success: false }
  }
}
