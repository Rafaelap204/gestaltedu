import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateAIResponse, ChatMessage } from '@/lib/ai/openai'
import { buildUserContext } from '@/lib/ai/context'

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
    
    // Parse request body
    const { message, threadId } = await request.json()
    
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }
    
    let currentThreadId = threadId
    
    // If no threadId, create a new thread
    if (!currentThreadId) {
      // Build user context for the thread
      const userContext = await buildUserContext(user.id)
      
      const { data: thread, error: threadError } = await supabase
        .from('ai_threads')
        .insert({
          user_id: user.id,
          context: userContext,
        })
        .select('id')
        .single()
      
      if (threadError || !thread) {
        console.error('Error creating thread:', threadError)
        return NextResponse.json(
          { error: 'Failed to create thread' },
          { status: 500 }
        )
      }
      
      currentThreadId = thread.id
    }
    
    // Save user message
    const { error: userMessageError } = await supabase
      .from('ai_messages')
      .insert({
        thread_id: currentThreadId,
        role: 'user',
        content: message,
      })
    
    if (userMessageError) {
      console.error('Error saving user message:', userMessageError)
    }
    
    // Fetch thread context
    const { data: thread } = await supabase
      .from('ai_threads')
      .select('context')
      .eq('id', currentThreadId)
      .single()
    
    // Fetch recent messages for context
    const { data: recentMessages } = await supabase
      .from('ai_messages')
      .select('role, content')
      .eq('thread_id', currentThreadId)
      .order('created_at', { ascending: true })
      .limit(10)
    
    // Build messages array for OpenAI
    const messages: ChatMessage[] = []
    
    // Add system prompt with user context
    const systemPrompt = `Você é o assistente de suporte da Gestalt EDU, uma plataforma de cursos online.
Responda de forma amigável e prestativa em português.
Ajude com: acesso a cursos, pagamentos, progresso, uso da plataforma.
Se não conseguir resolver, sugira "Falar com humano".
Nunca exponha dados sensíveis de outros usuários.
Contexto do usuário: ${thread?.context || 'Não disponível'}`
    
    messages.push({ role: 'system', content: systemPrompt })
    
    // Add recent conversation history
    if (recentMessages) {
      recentMessages.forEach((msg: { role: string; content: string }) => {
        messages.push({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        })
      })
    }
    
    // Add current user message
    messages.push({ role: 'user', content: message })
    
    // Generate AI response
    const reply = await generateAIResponse(messages)
    
    // Save assistant response
    const { error: assistantMessageError } = await supabase
      .from('ai_messages')
      .insert({
        thread_id: currentThreadId,
        role: 'assistant',
        content: reply,
      })
    
    if (assistantMessageError) {
      console.error('Error saving assistant message:', assistantMessageError)
    }
    
    // Update thread updated_at
    await supabase
      .from('ai_threads')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', currentThreadId)
    
    return NextResponse.json({
      reply,
      threadId: currentThreadId,
    })
    
  } catch (error) {
    console.error('Error in AI chat:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
