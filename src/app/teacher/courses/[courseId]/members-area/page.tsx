import { requireRole } from '@/lib/utils/auth'
import { getCourseMembersAreaData } from '@/lib/actions/members-area'
import { redirect } from 'next/navigation'
import { MembersAreaClient } from './MembersAreaClient'

interface MembersAreaPageProps {
  params: Promise<{
    courseId: string
  }>
}

export default async function MembersAreaPage({ params }: MembersAreaPageProps) {
  const { courseId } = await params
  const session = await requireRole(['teacher', 'admin'])

  const result = await getCourseMembersAreaData(courseId)

  if ('error' in result) {
    redirect('/teacher/courses')
  }

  return (
    <MembersAreaClient
      courseId={courseId}
      course={result.course}
      modules={result.modules}
      enrollmentsCount={result.enrollmentsCount}
      userName={session.profile?.name || 'Professor'}
    />
  )
}
