-- Migration: Initial Schema for Gestalt EDU Platform
-- Created: 2026-04-03

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE user_role AS ENUM ('admin', 'teacher', 'student');
CREATE TYPE course_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE enrollment_status AS ENUM ('active', 'cancelled', 'completed');
CREATE TYPE order_status AS ENUM ('pending', 'paid', 'cancelled', 'refunded');
CREATE TYPE payment_method AS ENUM ('pix', 'credit_card', 'boleto');
CREATE TYPE ledger_entry_type AS ENUM ('sale', 'payout', 'commission', 'refund');
CREATE TYPE withdraw_status AS ENUM ('pending', 'processing', 'completed', 'rejected');
CREATE TYPE ticket_status AS ENUM ('open', 'resolved', 'escalated');
CREATE TYPE ai_message_role AS ENUM ('user', 'assistant', 'system');
CREATE TYPE video_provider AS ENUM ('youtube', 'vimeo');

-- ============================================================================
-- HELPER FUNCTIONS (Part 1 - Independent functions)
-- ============================================================================

-- Function to auto-update updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TABLES
-- ============================================================================

-- 1. profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'student',
  name TEXT,
  avatar_url TEXT,
  cpf_cnpj TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. courses
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES profiles(id),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  short_description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  status course_status NOT NULL DEFAULT 'draft',
  category TEXT,
  level TEXT,
  featured BOOLEAN DEFAULT false,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. modules
CREATE TABLE modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. lessons
CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  video_url TEXT,
  video_provider video_provider,
  materials JSONB DEFAULT '[]',
  duration_seconds INTEGER,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. enrollments
CREATE TABLE enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  course_id UUID NOT NULL REFERENCES courses(id),
  status enrollment_status NOT NULL DEFAULT 'active',
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, course_id)
);

-- 6. lesson_progress
CREATE TABLE lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  progress_pct INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, lesson_id)
);

-- 7. orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  course_id UUID NOT NULL REFERENCES courses(id),
  status order_status NOT NULL DEFAULT 'pending',
  amount DECIMAL(10,2) NOT NULL,
  ref_code TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 8. payments
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id),
  asaas_payment_id TEXT UNIQUE,
  asaas_customer_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  method payment_method,
  raw_payload JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 9. webhook_events
CREATE TABLE webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL DEFAULT 'asaas',
  event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. payout_rules
CREATE TABLE payout_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES profiles(id),
  platform_pct DECIMAL(5,2) NOT NULL DEFAULT 30.00,
  teacher_pct DECIMAL(5,2) NOT NULL DEFAULT 70.00,
  affiliate_pct DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(course_id)
);

-- 11. ledger_entries
CREATE TABLE ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type ledger_entry_type NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BRL',
  user_id UUID NOT NULL REFERENCES profiles(id),
  reference_id UUID,
  status TEXT NOT NULL DEFAULT 'pending',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 12. withdraw_requests
CREATE TABLE withdraw_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES profiles(id),
  amount DECIMAL(10,2) NOT NULL,
  status withdraw_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 13. referral_codes
CREATE TABLE referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES profiles(id),
  code TEXT NOT NULL UNIQUE,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 14. referral_clicks
CREATE TABLE referral_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id UUID NOT NULL REFERENCES referral_codes(id),
  visitor_fingerprint TEXT,
  ip_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 15. referral_attributions
CREATE TABLE referral_attributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id UUID NOT NULL REFERENCES referral_codes(id),
  user_id UUID REFERENCES profiles(id),
  order_id UUID REFERENCES orders(id),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 16. referral_commissions
CREATE TABLE referral_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id UUID NOT NULL REFERENCES referral_codes(id),
  order_id UUID NOT NULL REFERENCES orders(id),
  amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 17. ai_threads
CREATE TABLE ai_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  context TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 18. ai_messages
CREATE TABLE ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES ai_threads(id) ON DELETE CASCADE,
  role ai_message_role NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 19. support_tickets
CREATE TABLE support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  thread_id UUID REFERENCES ai_threads(id),
  category TEXT,
  status ticket_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 20. platform_settings
CREATE TABLE platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- HELPER FUNCTIONS (Part 2 - Functions that depend on tables)
-- ============================================================================

-- Function to get current user's role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Function to get current user's profile id
CREATE OR REPLACE FUNCTION public.get_profile_id()
RETURNS UUID AS $$
  SELECT id FROM public.profiles WHERE user_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    'student'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- INDEXES
-- ============================================================================

-- courses indexes
CREATE INDEX idx_courses_teacher_id ON courses(teacher_id);
CREATE INDEX idx_courses_slug ON courses(slug);
CREATE INDEX idx_courses_status ON courses(status);
CREATE INDEX idx_courses_category ON courses(category);
CREATE INDEX idx_courses_featured ON courses(featured);

-- modules indexes
CREATE INDEX idx_modules_course_id ON modules(course_id);
CREATE INDEX idx_modules_order ON modules("order");

-- lessons indexes
CREATE INDEX idx_lessons_module_id ON lessons(module_id);
CREATE INDEX idx_lessons_order ON lessons("order");

-- enrollments indexes
CREATE INDEX idx_enrollments_user_id ON enrollments(user_id);
CREATE INDEX idx_enrollments_course_id ON enrollments(course_id);
CREATE INDEX idx_enrollments_status ON enrollments(status);

-- lesson_progress indexes
CREATE INDEX idx_lesson_progress_user_id ON lesson_progress(user_id);
CREATE INDEX idx_lesson_progress_lesson_id ON lesson_progress(lesson_id);

-- orders indexes
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_course_id ON orders(course_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);

-- payments indexes
CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_asaas_payment_id ON payments(asaas_payment_id);

-- webhook_events indexes
CREATE INDEX idx_webhook_events_event_id ON webhook_events(event_id);
CREATE INDEX idx_webhook_events_provider ON webhook_events(provider);

-- ledger_entries indexes
CREATE INDEX idx_ledger_entries_user_id ON ledger_entries(user_id);
CREATE INDEX idx_ledger_entries_type ON ledger_entries(type);
CREATE INDEX idx_ledger_entries_status ON ledger_entries(status);

-- referral_codes indexes
CREATE INDEX idx_referral_codes_owner_user_id ON referral_codes(owner_user_id);
CREATE INDEX idx_referral_codes_code ON referral_codes(code);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger: Auto-create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger: Auto-update updated_at on profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: Auto-update updated_at on courses
CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: Auto-update updated_at on orders
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: Auto-update updated_at on payments
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: Auto-update updated_at on withdraw_requests
CREATE TRIGGER update_withdraw_requests_updated_at
  BEFORE UPDATE ON withdraw_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: Auto-update updated_at on ai_threads
CREATE TRIGGER update_ai_threads_updated_at
  BEFORE UPDATE ON ai_threads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: Auto-update updated_at on support_tickets
CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: Auto-update updated_at on platform_settings
CREATE TRIGGER update_platform_settings_updated_at
  BEFORE UPDATE ON platform_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdraw_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_attributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES: profiles
-- ============================================================================

CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "profiles_select_admin" ON profiles
  FOR SELECT USING (public.get_user_role() = 'admin');

CREATE POLICY "profiles_update_admin" ON profiles
  FOR UPDATE USING (public.get_user_role() = 'admin');

-- ============================================================================
-- RLS POLICIES: courses
-- ============================================================================

CREATE POLICY "courses_select_published" ON courses
  FOR SELECT USING (status = 'published');

CREATE POLICY "courses_select_teacher_own" ON courses
  FOR SELECT USING (teacher_id = public.get_profile_id());

CREATE POLICY "courses_insert_teacher_own" ON courses
  FOR INSERT WITH CHECK (teacher_id = public.get_profile_id());

CREATE POLICY "courses_update_teacher_own" ON courses
  FOR UPDATE USING (teacher_id = public.get_profile_id());

CREATE POLICY "courses_delete_teacher_own" ON courses
  FOR DELETE USING (teacher_id = public.get_profile_id());

CREATE POLICY "courses_all_admin" ON courses
  FOR ALL USING (public.get_user_role() = 'admin');

-- ============================================================================
-- RLS POLICIES: modules
-- ============================================================================

CREATE POLICY "modules_select_published" ON modules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM courses 
      WHERE courses.id = modules.course_id 
      AND courses.status = 'published'
    )
  );

CREATE POLICY "modules_select_teacher_own" ON modules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM courses 
      WHERE courses.id = modules.course_id 
      AND courses.teacher_id = public.get_profile_id()
    )
  );

CREATE POLICY "modules_insert_teacher_own" ON modules
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM courses 
      WHERE courses.id = modules.course_id 
      AND courses.teacher_id = public.get_profile_id()
    )
  );

CREATE POLICY "modules_update_teacher_own" ON modules
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM courses 
      WHERE courses.id = modules.course_id 
      AND courses.teacher_id = public.get_profile_id()
    )
  );

CREATE POLICY "modules_delete_teacher_own" ON modules
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM courses 
      WHERE courses.id = modules.course_id 
      AND courses.teacher_id = public.get_profile_id()
    )
  );

CREATE POLICY "modules_all_admin" ON modules
  FOR ALL USING (public.get_user_role() = 'admin');

-- ============================================================================
-- RLS POLICIES: lessons
-- ============================================================================

CREATE POLICY "lessons_select_published" ON lessons
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM modules 
      JOIN courses ON courses.id = modules.course_id
      WHERE modules.id = lessons.module_id 
      AND courses.status = 'published'
    )
  );

CREATE POLICY "lessons_select_teacher_own" ON lessons
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM modules 
      JOIN courses ON courses.id = modules.course_id
      WHERE modules.id = lessons.module_id 
      AND courses.teacher_id = public.get_profile_id()
    )
  );

CREATE POLICY "lessons_insert_teacher_own" ON lessons
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM modules 
      JOIN courses ON courses.id = modules.course_id
      WHERE modules.id = lessons.module_id 
      AND courses.teacher_id = public.get_profile_id()
    )
  );

CREATE POLICY "lessons_update_teacher_own" ON lessons
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM modules 
      JOIN courses ON courses.id = modules.course_id
      WHERE modules.id = lessons.module_id 
      AND courses.teacher_id = public.get_profile_id()
    )
  );

CREATE POLICY "lessons_delete_teacher_own" ON lessons
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM modules 
      JOIN courses ON courses.id = modules.course_id
      WHERE modules.id = lessons.module_id 
      AND courses.teacher_id = public.get_profile_id()
    )
  );

CREATE POLICY "lessons_all_admin" ON lessons
  FOR ALL USING (public.get_user_role() = 'admin');

-- ============================================================================
-- RLS POLICIES: enrollments
-- ============================================================================

CREATE POLICY "enrollments_select_own" ON enrollments
  FOR SELECT USING (user_id = public.get_profile_id());

CREATE POLICY "enrollments_all_admin" ON enrollments
  FOR ALL USING (public.get_user_role() = 'admin');

-- ============================================================================
-- RLS POLICIES: lesson_progress
-- ============================================================================

CREATE POLICY "lesson_progress_select_own" ON lesson_progress
  FOR SELECT USING (user_id = public.get_profile_id());

CREATE POLICY "lesson_progress_insert_own" ON lesson_progress
  FOR INSERT WITH CHECK (user_id = public.get_profile_id());

CREATE POLICY "lesson_progress_update_own" ON lesson_progress
  FOR UPDATE USING (user_id = public.get_profile_id());

CREATE POLICY "lesson_progress_all_admin" ON lesson_progress
  FOR ALL USING (public.get_user_role() = 'admin');

-- ============================================================================
-- RLS POLICIES: orders
-- ============================================================================

CREATE POLICY "orders_select_own" ON orders
  FOR SELECT USING (user_id = public.get_profile_id());

CREATE POLICY "orders_insert_authenticated" ON orders
  FOR INSERT WITH CHECK (user_id = public.get_profile_id());

CREATE POLICY "orders_all_admin" ON orders
  FOR ALL USING (public.get_user_role() = 'admin');

-- ============================================================================
-- RLS POLICIES: payments
-- ============================================================================

CREATE POLICY "payments_select_own" ON payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = payments.order_id 
      AND orders.user_id = public.get_profile_id()
    )
  );

CREATE POLICY "payments_all_admin" ON payments
  FOR ALL USING (public.get_user_role() = 'admin');

-- ============================================================================
-- RLS POLICIES: webhook_events
-- ============================================================================

-- No public access - service_role only
CREATE POLICY "webhook_events_no_public" ON webhook_events
  FOR ALL USING (false);

-- ============================================================================
-- RLS POLICIES: payout_rules
-- ============================================================================

CREATE POLICY "payout_rules_select_teacher_own" ON payout_rules
  FOR SELECT USING (
    teacher_id = public.get_profile_id() OR
    EXISTS (
      SELECT 1 FROM courses 
      WHERE courses.id = payout_rules.course_id 
      AND courses.teacher_id = public.get_profile_id()
    )
  );

CREATE POLICY "payout_rules_all_admin" ON payout_rules
  FOR ALL USING (public.get_user_role() = 'admin');

-- ============================================================================
-- RLS POLICIES: ledger_entries
-- ============================================================================

CREATE POLICY "ledger_entries_select_own" ON ledger_entries
  FOR SELECT USING (user_id = public.get_profile_id());

CREATE POLICY "ledger_entries_all_admin" ON ledger_entries
  FOR ALL USING (public.get_user_role() = 'admin');

-- ============================================================================
-- RLS POLICIES: withdraw_requests
-- ============================================================================

CREATE POLICY "withdraw_requests_select_own" ON withdraw_requests
  FOR SELECT USING (teacher_id = public.get_profile_id());

CREATE POLICY "withdraw_requests_insert_own" ON withdraw_requests
  FOR INSERT WITH CHECK (teacher_id = public.get_profile_id());

CREATE POLICY "withdraw_requests_update_admin" ON withdraw_requests
  FOR UPDATE USING (public.get_user_role() = 'admin');

CREATE POLICY "withdraw_requests_all_admin" ON withdraw_requests
  FOR ALL USING (public.get_user_role() = 'admin');

-- ============================================================================
-- RLS POLICIES: referral_codes
-- ============================================================================

CREATE POLICY "referral_codes_select_own" ON referral_codes
  FOR SELECT USING (owner_user_id = public.get_profile_id());

CREATE POLICY "referral_codes_insert_own" ON referral_codes
  FOR INSERT WITH CHECK (owner_user_id = public.get_profile_id());

CREATE POLICY "referral_codes_all_admin" ON referral_codes
  FOR ALL USING (public.get_user_role() = 'admin');

-- ============================================================================
-- RLS POLICIES: referral_clicks
-- ============================================================================

CREATE POLICY "referral_clicks_select_own" ON referral_clicks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM referral_codes 
      WHERE referral_codes.id = referral_clicks.code_id 
      AND referral_codes.owner_user_id = public.get_profile_id()
    )
  );

CREATE POLICY "referral_clicks_all_admin" ON referral_clicks
  FOR ALL USING (public.get_user_role() = 'admin');

-- ============================================================================
-- RLS POLICIES: referral_attributions
-- ============================================================================

CREATE POLICY "referral_attributions_select_own" ON referral_attributions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM referral_codes 
      WHERE referral_codes.id = referral_attributions.code_id 
      AND referral_codes.owner_user_id = public.get_profile_id()
    ) OR user_id = public.get_profile_id()
  );

CREATE POLICY "referral_attributions_all_admin" ON referral_attributions
  FOR ALL USING (public.get_user_role() = 'admin');

-- ============================================================================
-- RLS POLICIES: referral_commissions
-- ============================================================================

CREATE POLICY "referral_commissions_select_own" ON referral_commissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM referral_codes 
      WHERE referral_codes.id = referral_commissions.code_id 
      AND referral_codes.owner_user_id = public.get_profile_id()
    )
  );

CREATE POLICY "referral_commissions_all_admin" ON referral_commissions
  FOR ALL USING (public.get_user_role() = 'admin');

-- ============================================================================
-- RLS POLICIES: ai_threads
-- ============================================================================

CREATE POLICY "ai_threads_select_own" ON ai_threads
  FOR SELECT USING (user_id = public.get_profile_id());

CREATE POLICY "ai_threads_insert_own" ON ai_threads
  FOR INSERT WITH CHECK (user_id = public.get_profile_id());

CREATE POLICY "ai_threads_update_own" ON ai_threads
  FOR UPDATE USING (user_id = public.get_profile_id());

CREATE POLICY "ai_threads_all_admin" ON ai_threads
  FOR ALL USING (public.get_user_role() = 'admin');

-- ============================================================================
-- RLS POLICIES: ai_messages
-- ============================================================================

CREATE POLICY "ai_messages_select_own" ON ai_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM ai_threads 
      WHERE ai_threads.id = ai_messages.thread_id 
      AND ai_threads.user_id = public.get_profile_id()
    )
  );

CREATE POLICY "ai_messages_insert_own" ON ai_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM ai_threads 
      WHERE ai_threads.id = ai_messages.thread_id 
      AND ai_threads.user_id = public.get_profile_id()
    )
  );

CREATE POLICY "ai_messages_all_admin" ON ai_messages
  FOR ALL USING (public.get_user_role() = 'admin');

-- ============================================================================
-- RLS POLICIES: support_tickets
-- ============================================================================

CREATE POLICY "support_tickets_select_own" ON support_tickets
  FOR SELECT USING (user_id = public.get_profile_id());

CREATE POLICY "support_tickets_insert_own" ON support_tickets
  FOR INSERT WITH CHECK (user_id = public.get_profile_id());

CREATE POLICY "support_tickets_update_admin" ON support_tickets
  FOR UPDATE USING (public.get_user_role() = 'admin');

CREATE POLICY "support_tickets_all_admin" ON support_tickets
  FOR ALL USING (public.get_user_role() = 'admin');

-- ============================================================================
-- RLS POLICIES: platform_settings
-- ============================================================================

CREATE POLICY "platform_settings_select_authenticated" ON platform_settings
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "platform_settings_insert_admin" ON platform_settings
  FOR INSERT WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "platform_settings_update_admin" ON platform_settings
  FOR UPDATE USING (public.get_user_role() = 'admin');

CREATE POLICY "platform_settings_delete_admin" ON platform_settings
  FOR DELETE USING (public.get_user_role() = 'admin');
