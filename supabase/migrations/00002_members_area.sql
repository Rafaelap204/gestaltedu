-- Migration: Members Area Configuration
-- Created: 2026-04-09

-- ============================================================================
-- EXPAND ENUM: video_provider
-- ============================================================================

ALTER TYPE video_provider ADD VALUE IF NOT EXISTS 'panda';

-- ============================================================================
-- ALTER TABLE: courses - Members Area columns
-- ============================================================================

ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS members_area_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS members_area_subdomain TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS members_area_custom_domain TEXT,
  ADD COLUMN IF NOT EXISTS members_area_theme JSONB DEFAULT '{"primaryColor": "#F97316", "logoUrl": null, "darkMode": false}',
  ADD COLUMN IF NOT EXISTS members_area_updated_at TIMESTAMPTZ;

-- ============================================================================
-- ALTER TABLE: modules - Description and Icon
-- ============================================================================

ALTER TABLE modules
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT 'BookOpen';

-- ============================================================================
-- NEW TABLE: course_access_logs
-- ============================================================================

CREATE TABLE course_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  accessed_at TIMESTAMPTZ DEFAULT now(),
  ip_address TEXT
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- courses members area indexes
CREATE INDEX IF NOT EXISTS idx_courses_members_area_subdomain ON courses(members_area_subdomain) WHERE members_area_subdomain IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_courses_members_area_enabled ON courses(members_area_enabled) WHERE members_area_enabled = true;

-- course_access_logs indexes
CREATE INDEX IF NOT EXISTS idx_course_access_logs_user_id ON course_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_course_access_logs_course_id ON course_access_logs(course_id);
CREATE INDEX IF NOT EXISTS idx_course_access_logs_lesson_id ON course_access_logs(lesson_id);
CREATE INDEX IF NOT EXISTS idx_course_access_logs_accessed_at ON course_access_logs(accessed_at);

-- ============================================================================
-- ROW LEVEL SECURITY: course_access_logs
-- ============================================================================

ALTER TABLE course_access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "course_access_logs_select_own" ON course_access_logs
  FOR SELECT USING (user_id = public.get_profile_id());

CREATE POLICY "course_access_logs_insert_own" ON course_access_logs
  FOR INSERT WITH CHECK (user_id = public.get_profile_id());

CREATE POLICY "course_access_logs_select_teacher" ON course_access_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = course_access_logs.course_id
      AND courses.teacher_id = public.get_profile_id()
    )
  );

CREATE POLICY "course_access_logs_all_admin" ON course_access_logs
  FOR ALL USING (public.get_user_role() = 'admin');

-- ============================================================================
-- TRIGGER: Auto-update members_area_updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_members_area_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.members_area_updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_courses_members_area_updated_at
  BEFORE UPDATE OF members_area_enabled, members_area_subdomain, members_area_custom_domain, members_area_theme ON courses
  FOR EACH ROW
  WHEN (OLD.members_area_enabled IS DISTINCT FROM NEW.members_area_enabled
     OR OLD.members_area_subdomain IS DISTINCT FROM NEW.members_area_subdomain
     OR OLD.members_area_custom_domain IS DISTINCT FROM NEW.members_area_custom_domain
     OR OLD.members_area_theme IS DISTINCT FROM NEW.members_area_theme)
  EXECUTE FUNCTION public.update_members_area_updated_at();
