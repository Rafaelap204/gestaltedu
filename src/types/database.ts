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
  created_at: string
  updated_at: string
}
