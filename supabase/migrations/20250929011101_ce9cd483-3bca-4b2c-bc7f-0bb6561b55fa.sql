-- Fix infinite recursion in users table RLS policies
-- Drop the problematic admin policies that cause recursion
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;

-- Create new admin policies that avoid recursion by using auth.jwt() instead
CREATE POLICY "Admins can view all users" 
ON public.users 
FOR SELECT 
USING (
  COALESCE(auth.jwt() ->> 'user_role', '') = 'admin' 
  OR auth.uid() = id
);

CREATE POLICY "Admins can update all users" 
ON public.users 
FOR UPDATE 
USING (
  COALESCE(auth.jwt() ->> 'user_role', '') = 'admin' 
  OR auth.uid() = id
);