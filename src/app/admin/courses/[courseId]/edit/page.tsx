import { getAdminCourseById } from '@/lib/queries/admin'
import { EditAdminCourseClient } from './EditAdminCourseClient'

export default async function EditAdminCoursePage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params
  const course = await getAdminCourseById(courseId)
  
  if (!course) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-brand-gray-500">Curso não encontrado</p>
      </div>
    )
  }
  
  return <EditAdminCourseClient course={course} />
}
