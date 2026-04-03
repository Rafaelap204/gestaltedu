'use server'

import { createClient } from '@/lib/supabase/server'
import { findOrCreateCustomer, createPayment, getPixQrCode } from '@/lib/asaas/client'
import { requireAuth } from '@/lib/utils/auth'
import { createReferralAttribution } from '@/lib/services/referral'
import type { PaymentMethod } from '@/types/database'

interface CheckoutData {
  courseId: string
  name: string
  email: string
  cpfCnpj: string
  phone?: string
  billingType: 'PIX' | 'CREDIT_CARD' | 'BOLETO'
  creditCard?: {
    holderName: string
    number: string
    expiryMonth: string
    expiryYear: string
    ccv: string
  }
  creditCardHolderInfo?: {
    name: string
    email: string
    cpfCnpj: string
    phone: string
    postalCode: string
    addressNumber: string
  }
  refCode?: string
}

interface CheckoutResult {
  orderId: string
  paymentId: string
  status: string
  pixQrCode?: { image: string; text: string }
  invoiceUrl?: string
  bankSlipUrl?: string
}

export async function createCheckoutAction(
  data: CheckoutData
): Promise<CheckoutResult | { error: string }> {
  try {
    const supabase = await createClient()
    
    // 1. Verify user is authenticated
    const session = await requireAuth()
    const userId = session.user.id
    
    // 2. Check course exists and is published
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, title, price, status, teacher_id')
      .eq('id', data.courseId)
      .single()
    
    if (courseError || !course) {
      return { error: 'Curso não encontrado' }
    }
    
    if (course.status !== 'published') {
      return { error: 'Este curso não está disponível para compra' }
    }
    
    // 3. Check user is not already enrolled
    const { data: existingEnrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', data.courseId)
      .single()
    
    if (existingEnrollment) {
      return { error: 'Você já está matriculado neste curso' }
    }
    
    // 4. Find or create Asaas customer
    const customer = await findOrCreateCustomer({
      name: data.name,
      email: data.email,
      cpfCnpj: data.cpfCnpj,
      phone: data.phone,
    })
    
    // 5. Create order in our DB (status=pending)
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        course_id: data.courseId,
        status: 'pending',
        amount: course.price,
        ref_code: data.refCode || null,
      })
      .select()
      .single()
    
    if (orderError || !order) {
      console.error('Error creating order:', orderError)
      return { error: 'Erro ao criar pedido' }
    }
    
    // 5.1. Create referral attribution if ref_code exists
    if (data.refCode) {
      const profileId = session.profile?.id
      if (profileId) {
        const attributionResult = await createReferralAttribution({
          code: data.refCode,
          userId: profileId,
          orderId: order.id,
        })
        
        if ('error' in attributionResult) {
          console.log('Referral attribution not created:', attributionResult.error)
          // Don't fail the checkout, just log the error
        }
      }
    }
    
    // 6. Create payment in Asaas
    const asaasPayment = await createPayment({
      customer: customer.id,
      billingType: data.billingType,
      value: course.price,
      description: `Compra do curso: ${course.title}`,
      externalReference: order.id,
      creditCard: data.creditCard,
      creditCardHolderInfo: data.creditCardHolderInfo,
    })
    
    // 7. Save payment in our DB
    const methodMap: Record<string, PaymentMethod> = {
      'PIX': 'pix',
      'CREDIT_CARD': 'credit_card',
      'BOLETO': 'boleto',
    }
    
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        order_id: order.id,
        asaas_payment_id: asaasPayment.id,
        asaas_customer_id: customer.id,
        status: asaasPayment.status.toLowerCase(),
        method: methodMap[data.billingType],
        raw_payload: asaasPayment,
      })
    
    if (paymentError) {
      console.error('Error saving payment:', paymentError)
      // Don't return error here, payment was created in Asaas
    }
    
    // 8. If PIX, fetch QR code
    let pixQrCode: { image: string; text: string } | undefined
    if (data.billingType === 'PIX') {
      try {
        const qrCode = await getPixQrCode(asaasPayment.id)
        pixQrCode = {
          image: qrCode.encodedImage,
          text: qrCode.payload,
        }
      } catch (error) {
        console.error('Error fetching PIX QR code:', error)
        // Continue without QR code, it can be fetched later
      }
    }
    
    // 9. Return payment details
    const result: CheckoutResult = {
      orderId: order.id,
      paymentId: asaasPayment.id,
      status: asaasPayment.status,
      pixQrCode,
      invoiceUrl: asaasPayment.invoiceUrl,
      bankSlipUrl: asaasPayment.bankSlipUrl,
    }
    
    return result
  } catch (error) {
    console.error('Error in createCheckoutAction:', error)
    return { error: 'Erro ao processar pagamento. Tente novamente.' }
  }
}

export async function checkPaymentStatusAction(
  orderId: string
): Promise<{ orderStatus: string; paymentStatus: string; courseId: string } | { error: string }> {
  try {
    const supabase = await createClient()
    
    // Check order + payment status in our DB
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('status, course_id, payments(status)')
      .eq('id', orderId)
      .single()
    
    if (orderError || !order) {
      return { error: 'Pedido não encontrado' }
    }
    
    const paymentStatus = (order.payments as unknown as { status: string }[])?.[0]?.status || 'pending'
    
    return {
      orderStatus: order.status,
      paymentStatus,
      courseId: order.course_id,
    }
  } catch (error) {
    console.error('Error in checkPaymentStatusAction:', error)
    return { error: 'Erro ao verificar status do pagamento' }
  }
}
