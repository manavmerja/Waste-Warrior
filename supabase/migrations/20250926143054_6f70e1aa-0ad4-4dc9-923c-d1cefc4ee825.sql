-- Create enum for user roles
CREATE TYPE public.user_role AS ENUM ('resident', 'worker', 'admin', 'scrap_dealer');

-- Create enum for report status
CREATE TYPE public.report_status AS ENUM ('pending', 'assigned', 'in_progress', 'resolved', 'rejected');

-- Create enum for notification type
CREATE TYPE public.notification_type AS ENUM ('report_update', 'credit_award', 'kit_distribution', 'worker_assignment', 'system');

-- Create users table (extends Supabase auth.users)

CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'resident',
  credits INTEGER NOT NULL DEFAULT 0,
  language TEXT NOT NULL DEFAULT 'en',
  avatar_url TEXT,
  address TEXT,
  kit_received BOOLEAN NOT NULL DEFAULT false,
  is_banned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create reports table
CREATE TABLE public.reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  address_text TEXT,
  photo_urls TEXT[] DEFAULT '{}',
  status report_status NOT NULL DEFAULT 'pending',
  assigned_worker_id UUID REFERENCES public.users(id),
  deadline TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create credits_log table
CREATE TABLE public.credits_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  awarded_by UUID REFERENCES public.users(id),
  reference_id UUID, -- Can reference reports.id or other entities
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create redeems table
CREATE TABLE public.redeems (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL,
  credits_used INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create workers table
CREATE TABLE public.workers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  vehicle_id TEXT,
  current_lat DECIMAL(10, 8),
  current_lng DECIMAL(11, 8),
  last_location_update TIMESTAMP WITH TIME ZONE,
  learning_progress INTEGER NOT NULL DEFAULT 0 CHECK (learning_progress >= 0 AND learning_progress <= 100),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create collection_points table
CREATE TABLE public.collection_points (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  lat DECIMAL(10, 8) NOT NULL,
  lng DECIMAL(11, 8) NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 100,
  current_load INTEGER NOT NULL DEFAULT 0,
  contact_phone TEXT,
  working_hours TEXT DEFAULT '9:00 AM - 6:00 PM',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create scrap_dealers table
CREATE TABLE public.scrap_dealers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  license_number TEXT,
  service_area TEXT,
  rates JSONB DEFAULT '{}', -- Store rates as JSON: {"plastic": 10, "metal": 20, etc}
  contact_phone TEXT,
  working_hours TEXT DEFAULT '9:00 AM - 6:00 PM',
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type notification_type NOT NULL DEFAULT 'system',
  meta JSONB DEFAULT '{}', -- Additional data like report_id, credit_amount, etc
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credits_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redeems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scrap_dealers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all users" ON public.users FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can update all users" ON public.users FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Create RLS policies for reports table
CREATE POLICY "Users can view own reports" ON public.reports FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create reports" ON public.reports FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Workers can view assigned reports" ON public.reports FOR SELECT USING (
  assigned_worker_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'worker'))
);
CREATE POLICY "Admins can manage all reports" ON public.reports FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Create RLS policies for credits_log table
CREATE POLICY "Users can view own credits log" ON public.credits_log FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins can view all credits log" ON public.credits_log FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can award credits" ON public.credits_log FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Create RLS policies for redeems table
CREATE POLICY "Users can view own redeems" ON public.redeems FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create redeems" ON public.redeems FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can view all redeems" ON public.redeems FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Create RLS policies for workers table
CREATE POLICY "Workers can view own profile" ON public.workers FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Workers can update own profile" ON public.workers FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Admins can manage all workers" ON public.workers FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Create RLS policies for collection_points table (public read, admin manage)
CREATE POLICY "Anyone can view collection points" ON public.collection_points FOR SELECT USING (true);
CREATE POLICY "Admins can manage collection points" ON public.collection_points FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Create RLS policies for scrap_dealers table
CREATE POLICY "Scrap dealers can view own profile" ON public.scrap_dealers FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Scrap dealers can update own profile" ON public.scrap_dealers FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Anyone can view verified dealers" ON public.scrap_dealers FOR SELECT USING (is_verified = true);
CREATE POLICY "Admins can manage all dealers" ON public.scrap_dealers FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Create RLS policies for notifications table
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can mark notifications as read" ON public.notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "System can create notifications" ON public.notifications FOR INSERT WITH CHECK (true);

-- Create function to handle user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'resident'::user_role)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON public.reports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_workers_updated_at BEFORE UPDATE ON public.workers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_collection_points_updated_at BEFORE UPDATE ON public.collection_points FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_scrap_dealers_updated_at BEFORE UPDATE ON public.scrap_dealers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_reports_user_id ON public.reports(user_id);
CREATE INDEX idx_reports_status ON public.reports(status);
CREATE INDEX idx_reports_assigned_worker ON public.reports(assigned_worker_id);
CREATE INDEX idx_credits_log_user_id ON public.credits_log(user_id);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id, is_read);

-- Create storage bucket for photo uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('waste-reports', 'waste-reports', true);

-- Create storage policies
CREATE POLICY "Users can upload their own waste report photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'waste-reports' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view all waste report photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'waste-reports');

CREATE POLICY "Users can update their own waste report photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'waste-reports' AND auth.uid()::text = (storage.foldername(name))[1]);