import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/utils/auth'
import { CheckoutForm } from './CheckoutForm'

interface CheckoutPageProps {
  params: Promise<{
    courseId: string
  }>
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { courseId } = await params
  const supabase = await createClient()
  
  // Check if user is authenticated
  const session = await getSession()
  
  if (!session) {
    // Redirect to login with return URL
    redirect(`/login?redirect=${encodeURIComponent(`/checkout/${courseId}`)}`)
  }
  
  // Fetch course data
  const { data: course, error } = await supabase
    .from('courses')
    .select('id, title, price, thumbnail_url, status')
    .eq('id', courseId)
    .single()
  
  if (error || !course) {
    notFound()
  }
  
  // Check if course is published
  if (course.status !== 'published') {
    notFound()
  }
  
  // Check if user is already enrolled
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('id')
    .eq('user_id', session.user.id)
    .eq('course_id', courseId)
    .single()
  
  if (enrollment) {
    // Redirect to course page if already enrolled
    redirect(`/app/my-courses`)
  }
  
  return (
    <CheckoutForm
      course={course}
      userEmail={session.user.email}
      userName={session.profile?.name ?? null}
    />
  )
}
