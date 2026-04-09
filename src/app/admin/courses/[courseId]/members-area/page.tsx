import { requireRole } from '@/lib/utils/auth'
import { getCourseMembersAreaData } from '@/lib/actions/members-area'
import { redirect } from 'next/navigation'
import { MembersAreaClient } from '@/app/teacher/courses/[courseId]/members-area/MembersAreaClient'

interface MembersAreaPageProps {
  params: Promise<{
    courseId: string
  }>
}

export default async function AdminMembersAreaPage({ params }: MembersAreaPageProps) {
  const { courseId } = await params
  const session = await requireRole(['admin'])

  const result = await getCourseMembersAreaData(courseId)

  if ('error' in result) {
    redirect('/admin/courses')
  }

  return (
    <MembersAreaClient
      courseId={courseId}
      course={result.course}
      modules={result.modules}
      enrollmentsCount={result.enrollmentsCount}
      userName={session.profile?.name || 'Administrador'}
      backUrl="/admin/courses"
    />
  )
}
