import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const subdomain = searchParams.get('subdomain')
  const courseId = searchParams.get('courseId')

  if (!subdomain) {
    return NextResponse.json({ error: 'Subdomínio é obrigatório' }, { status: 400 })
  }

  const normalizedSubdomain = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '')

  if (normalizedSubdomain.length < 3) {
    return NextResponse.json({ error: 'Subdomínio deve ter pelo menos 3 caracteres' }, { status: 400 })
  }

  const reserved = ['www', 'app', 'admin', 'teacher', 'api', 'mail', 'ftp', 'staging', 'dev', 'test', 'gestalt', 'gestaltedu']
  if (reserved.includes(normalizedSubdomain)) {
    return NextResponse.json({ available: false, error: 'Subdomínio reservado' }, { status: 200 })
  }

  const supabase = await createClient()
  let query = supabase
    .from('courses')
    .select('id')
    .eq('members_area_subdomain', normalizedSubdomain)

  if (courseId) {
    query = query.neq('id', courseId)
  }

  const { data } = await query.single()

  return NextResponse.json({ available: !data })
}
