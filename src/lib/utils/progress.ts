export function calculateProgress(
  completedLessons: number,
  totalLessons: number
): number {
  if (totalLessons === 0) return 0
  return Math.round((completedLessons / totalLessons) * 100)
}

// Helper to get the last accessed lesson for "continue watching"
export interface CourseProgress {
  courseId: string
  courseTitle: string
  courseSlug: string
  courseThumbnail: string | null
  teacherName: string | null
  totalLessons: number
  completedLessons: number
  progressPct: number
  lastLessonId: string | null
}
