-- Migration: Make superadmin@gestaltedu.com.br an admin
-- Created: 2026-04-03

-- Update the user role to admin
UPDATE public.profiles
SET role = 'admin'
WHERE user_id IN (
  SELECT id FROM auth.users
  WHERE email = 'superadmin@gestaltedu.com.br'
);
