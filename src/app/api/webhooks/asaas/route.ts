import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { processSplit } from '@/lib/services/split'

function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

interface AsaasWebhookPayload {
  event: string
  payment: {
    id: string
    customer: string
    billingType: string
    value: number
    status: string
    externalReference: string
    invoiceUrl?: string
    bankSlipUrl?: string
  }
}

export async function POST(request: Request) {
  try {
    // 1. Parse body
    const payload = await request.json() as AsaasWebhookPayload
    
    // 2. Validate webhook token from header
    const webhookToken = request.headers.get('asaas-access-token')
    const expectedToken = process.env.ASAAS_WEBHOOK_TOKEN
    
    if (expectedToken && webhookToken !== expectedToken) {
      console.error('Invalid webhook token')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const supabase = createServiceClient()
    
    // Generate unique event ID
    const eventId = `${payload.event}_${payload.payment.id}_${Date.now()}`
    
    // 3. Check idempotency: look for event_id in webhook_events table
    const { data: existingEvent } = await supabase
      .from('webhook_events')
      .select('id')
      .eq('event_id', eventId)
      .single()
    
    if (existingEvent) {
      // Already processed, return 200 OK
      return NextResponse.json({ success: true, message: 'Already processed' })
    }
    
    // 4. Insert into webhook_events
    const { error: insertError } = await supabase
      .from('webhook_events')
      .insert({
        provider: 'asaas',
        event_id: eventId,
        event_type: payload.event,
        payload: payload,
      })
    
    if (insertError) {
      console.error('Error inserting webhook event:', insertError)
      // Continue processing even if logging fails
    }
    
    // 5. Process based on event type
    const eventType = payload.event
    const paymentData = payload.payment
    
    if (eventType === 'PAYMENT_CONFIRMED' || eventType === 'PAYMENT_RECEIVED') {
      // Find payment by asaas_payment_id
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .select('id, order_id')
        .eq('asaas_payment_id', paymentData.id)
        .single()
      
      if (paymentError || !payment) {
        console.error('Payment not found:', paymentData.id)
        return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
      }
      
      // Update payment status to confirmed
      await supabase
        .from('payments')
        .update({
          status: 'confirmed',
          raw_payload: paymentData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', payment.id)
      
      // Get order details
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('id, user_id, course_id, status')
        .eq('id', payment.order_id)
        .single()
      
      if (orderError || !order) {
        console.error('Order not found:', payment.order_id)
        return NextResponse.json({ error: 'Order not found' }, { status: 404 })
      }
      
      // Only process if order is pending
      if (order.status === 'pending') {
        // Update order status to paid
        await supabase
          .from('orders')
          .update({
            status: 'paid',
            updated_at: new Date().toISOString(),
          })
          .eq('id', order.id)
        
        // Create enrollment
        const { error: enrollmentError } = await supabase
          .from('enrollments')
          .insert({
            user_id: order.user_id,
            course_id: order.course_id,
            status: 'active',
            started_at: new Date().toISOString(),
          })
        
        if (enrollmentError) {
          // Check if it's a duplicate (user already enrolled)
          if (!enrollmentError.message?.includes('duplicate')) {
            console.error('Error creating enrollment:', enrollmentError)
          }
        }
        
        // Process payment split (platform, teacher, affiliate)
        try {
          const splitResult = await processSplit(order.id)
          if ('error' in splitResult) {
            console.error('Error processing split:', splitResult.error)
            // Log error but don't fail the webhook
          }
        } catch (splitError) {
          console.error('Exception processing split:', splitError)
          // Log error but don't fail the webhook
        }
      }
      
      // Mark webhook_event as processed
      await supabase
        .from('webhook_events')
        .update({ processed_at: new Date().toISOString() })
        .eq('event_id', eventId)
      
    } else if (eventType === 'PAYMENT_REFUNDED' || eventType === 'PAYMENT_REFUND_REQUESTED') {
      // Find payment by asaas_payment_id
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .select('id, order_id')
        .eq('asaas_payment_id', paymentData.id)
        .single()
      
      if (paymentError || !payment) {
        console.error('Payment not found for refund:', paymentData.id)
        return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
      }
      
      // Update payment status
      await supabase
        .from('payments')
        .update({
          status: 'refunded',
          raw_payload: paymentData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', payment.id)
      
      // Get order details
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('id, user_id, course_id')
        .eq('id', payment.order_id)
        .single()
      
      if (orderError || !order) {
        console.error('Order not found for refund:', payment.order_id)
      } else {
        // Update order status to refunded
        await supabase
          .from('orders')
          .update({
            status: 'refunded',
            updated_at: new Date().toISOString(),
          })
          .eq('id', order.id)
        
        // Cancel enrollment if exists
        await supabase
          .from('enrollments')
          .update({ status: 'cancelled' })
          .eq('user_id', order.user_id)
          .eq('course_id', order.course_id)
      }
      
      // Mark webhook_event as processed
      await supabase
        .from('webhook_events')
        .update({ processed_at: new Date().toISOString() })
        .eq('event_id', eventId)
      
    } else if (eventType === 'PAYMENT_CANCELLED') {
      // Find payment by asaas_payment_id
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .select('id, order_id')
        .eq('asaas_payment_id', paymentData.id)
        .single()
      
      if (paymentError || !payment) {
        console.error('Payment not found for cancellation:', paymentData.id)
      } else {
        // Update payment status
        await supabase
          .from('payments')
          .update({
            status: 'cancelled',
            raw_payload: paymentData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', payment.id)
        
        // Update order status to cancelled
        await supabase
          .from('orders')
          .update({
            status: 'cancelled',
            updated_at: new Date().toISOString(),
          })
          .eq('id', payment.order_id)
      }
      
      // Mark webhook_event as processed
      await supabase
        .from('webhook_events')
        .update({ processed_at: new Date().toISOString() })
        .eq('event_id', eventId)
      
    } else {
      // Other events: log but don't process
      console.log('Unhandled webhook event:', eventType)
    }
    
    // 6. Return 200 OK
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
