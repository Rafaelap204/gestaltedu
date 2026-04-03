// Types will be generated from Supabase schema
// Run: npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts

export type UserRole = 'admin' | 'teacher' | 'student'

export type CourseStatus = 'draft' | 'published' | 'archived'

export type EnrollmentStatus = 'active' | 'cancelled' | 'completed'

export type OrderStatus = 'pending' | 'paid' | 'cancelled' | 'refunded'

export type PaymentMethod = 'pix' | 'credit_card' | 'boleto'

export type LedgerEntryType = 'sale' | 'payout' | 'commission' | 'refund'

export type WithdrawStatus = 'pending' | 'processing' | 'completed' | 'rejected'

export type TicketStatus = 'open' | 'resolved' | 'escalated'
