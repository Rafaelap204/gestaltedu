import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/ai/threads - List user's threads
export async function GET(request: NextRequest) {
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
    
    // Check if a specific thread ID is requested
    const url = new URL(request.url)
    const threadId = url.searchParams.get('threadId')
    
    if (threadId) {
      // Return messages for a specific thread
      const { data: messages, error } = await supabase
        .from('ai_messages')
        .select('id, role, content, created_at')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true })
      
      if (error) {
        console.error('Error fetching messages:', error)
        return NextResponse.json(
          { error: 'Failed to fetch messages' },
          { status: 500 }
        )
      }
      
      return NextResponse.json({ messages })
    }
    
    // Return list of user's threads
    const { data: threads, error } = await supabase
      .from('ai_threads')
      .select('id, context, created_at, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching threads:', error)
      return NextResponse.json(
        { error: 'Failed to fetch threads' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ threads })
    
  } catch (error) {
    console.error('Error in threads API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/ai/threads - Delete a thread
export async function DELETE(request: NextRequest) {
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
    
    const { threadId } = await request.json()
    
    if (!threadId) {
      return NextResponse.json(
        { error: 'Thread ID is required' },
        { status: 400 }
      )
    }
    
    // Verify thread belongs to user before deleting
    const { data: thread } = await supabase
      .from('ai_threads')
      .select('id')
      .eq('id', threadId)
      .eq('user_id', user.id)
      .single()
    
    if (!thread) {
      return NextResponse.json(
        { error: 'Thread not found or access denied' },
        { status: 404 }
      )
    }
    
    // Delete thread (cascade will delete messages)
    const { error } = await supabase
      .from('ai_threads')
      .delete()
      .eq('id', threadId)
    
    if (error) {
      console.error('Error deleting thread:', error)
      return NextResponse.json(
        { error: 'Failed to delete thread' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Error in delete thread API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
