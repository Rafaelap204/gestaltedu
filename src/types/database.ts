// Types will be generated from Supabase schema
// Run: npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts

export type UserRole = 'admin' | 'teacher' | 'student'

export type CourseStatus = 'draft' | 'published' | 'archived'

export type EnrollmentStatus = 'active' | 'cancelled' | 'completed'

export type OrderStatus = 'pending' | 'paid' | 'cancelled' | 'refunded'

export type PaymentMethod = 'pix' | 'credit_card' | 'boleto' | 'debit_card'

export type LedgerEntryType = 'sale' | 'payout' | 'commission' | 'refund'

export type WithdrawStatus = 'pending' | 'processing' | 'completed' | 'rejected'

export type TicketStatus = 'open' | 'resolved' | 'escalated'

export type ContentReleaseStrategy = 'immediate' | 'progressive'

export type VideoProvider = 'youtube' | 'vimeo' | 'panda'

export type LessonContentType = 'video' | 'ebook' | 'text' | 'resource'

export interface MembersAreaTheme {
  primaryColor: string
  logoUrl: string | null
  darkMode: boolean
}

export interface MembersAreaConfig {
  enabled: boolean
  subdomain: string | null
  customDomain: string | null
  theme: MembersAreaTheme
}

export interface LessonMaterial {
  name: string
  url?: string
  content?: string
  type: string
  contentType: LessonContentType
}

export interface ModuleWithDetails {
  id: string
  course_id: string
  title: string
  description: string | null
  icon: string | null
  order: number
  created_at: string
  lessons?: LessonWithDetails[]
}

export interface LessonWithDetails {
  id: string
  module_id: string
  title: string
  video_url: string | null
  video_provider: VideoProvider | null
  materials: LessonMaterial[]
  duration_seconds: number | null
  order: number
  created_at: string
  description?: string | null
  contentType: LessonContentType
}

export interface CourseWithMembersArea {
  id: string
  title: string
  slug: string
  description?: string | null
  thumbnail_url?: string | null
  members_area_enabled: boolean
  members_area_subdomain: string | null
  members_area_custom_domain: string | null
  members_area_theme: MembersAreaTheme
  modules: ModuleWithDetails[]
}

export interface AdminCourse {
  id: string
  teacher_id: string
  title: string
  slug: string
  description?: string
  short_description?: string
  full_description?: string
  price: number
  status: CourseStatus
  category?: string
  level?: string
  featured: boolean
  thumbnail_url?: string
  image_url?: string
  refund_period?: number
  content_release_strategy?: ContentReleaseStrategy
  content_release_days?: number
  payment_methods?: string[]
  checkout_url?: string
  member_area_configured: boolean
  is_complete: boolean
  members_area_enabled?: boolean
  members_area_subdomain?: string | null
  members_area_custom_domain?: string | null
  members_area_theme?: MembersAreaTheme
  created_at: string
  updated_at: string
}
