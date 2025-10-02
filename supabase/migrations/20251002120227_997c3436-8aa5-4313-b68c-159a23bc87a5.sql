-- Create credit_audit_log table
CREATE TABLE IF NOT EXISTS public.credit_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('add', 'subtract')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create kits table
CREATE TABLE IF NOT EXISTS public.kits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  items TEXT,
  assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
  is_delivered BOOLEAN NOT NULL DEFAULT false,
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add new columns to reports table for verification
ALTER TABLE public.reports 
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT NULL,
ADD COLUMN IF NOT EXISTS verification_notes TEXT,
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deadline TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS worker_notes TEXT;

-- Add green champion column to users
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS is_green_champion BOOLEAN DEFAULT false;

-- Enable RLS
ALTER TABLE public.credit_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kits ENABLE ROW LEVEL SECURITY;

-- Credit audit log policies
CREATE POLICY "Admins can view all credit logs" ON public.credit_audit_log FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
);

CREATE POLICY "Admins can insert credit logs" ON public.credit_audit_log FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
);

-- Kits policies
CREATE POLICY "Admins can manage kits" ON public.kits FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
);

CREATE POLICY "Users can view their assigned kits" ON public.kits FOR SELECT USING (
  assigned_to = auth.uid() OR 
  EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
);