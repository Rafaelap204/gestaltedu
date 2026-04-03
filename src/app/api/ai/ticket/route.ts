import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const { threadId, category = 'general' } = await request.json()
    
    if (!threadId) {
      return NextResponse.json(
        { error: 'Thread ID is required' },
        { status: 400 }
      )
    }
    
    // Verify thread belongs to user
    const { data: thread, error: threadError } = await supabase
      .from('ai_threads')
      .select('id, user_id')
      .eq('id', threadId)
      .eq('user_id', user.id)
      .single()
    
    if (threadError || !thread) {
      return NextResponse.json(
        { error: 'Thread not found or access denied' },
        { status: 404 }
      )
    }
    
    // Check if ticket already exists for this thread
    const { data: existingTicket } = await supabase
      .from('support_tickets')
      .select('id')
      .eq('thread_id', threadId)
      .eq('status', 'open')
      .single()
    
    if (existingTicket) {
      return NextResponse.json({
        ticketId: existingTicket.id,
        message: 'Você já possui um ticket em aberto para esta conversa. Nossa equipe entrará em contato em breve.',
      })
    }
    
    // Create support ticket
    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .insert({
        user_id: user.id,
        thread_id: threadId,
        category,
        status: 'open',
      })
      .select('id')
      .single()
    
    if (ticketError || !ticket) {
      console.error('Error creating ticket:', ticketError)
      return NextResponse.json(
        { error: 'Failed to create support ticket' },
        { status: 500 }
      )
    }
    
    // Add system message to thread about ticket creation
    await supabase
      .from('ai_messages')
      .insert({
        thread_id: threadId,
        role: 'assistant',
        content: 'Ticket de suporte criado! Nossa equipe humana será notificada e entrará em contato em até 24 horas úteis.',
      })
    
    return NextResponse.json({
      ticketId: ticket.id,
      message: 'Ticket criado! Nossa equipe entrará em contato em até 24 horas úteis.',
    })
    
  } catch (error) {
    console.error('Error in ticket API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
