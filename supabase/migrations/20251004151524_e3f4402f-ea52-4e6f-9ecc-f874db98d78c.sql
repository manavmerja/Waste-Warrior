-- Create enum for pickup request status
CREATE TYPE pickup_request_status AS ENUM ('pending', 'accepted', 'in_progress', 'completed', 'cancelled');

-- Create scrap_pickup_requests table
CREATE TABLE public.scrap_pickup_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  dealer_id UUID REFERENCES public.scrap_dealers(id),
  resident_name TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  address TEXT NOT NULL,
  location_lat NUMERIC,
  location_lng NUMERIC,
  waste_type TEXT NOT NULL,
  waste_volume NUMERIC NOT NULL, -- in kg
  photo_urls TEXT[] DEFAULT '{}',
  proposed_rate NUMERIC,
  status pickup_request_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.scrap_pickup_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own requests"
  ON public.scrap_pickup_requests
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create requests"
  ON public.scrap_pickup_requests
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Dealers can view assigned requests"
  ON public.scrap_pickup_requests
  FOR SELECT
  USING (
    dealer_id IN (
      SELECT id FROM public.scrap_dealers WHERE user_id = auth.uid()
    )
    OR status = 'pending'
  );

CREATE POLICY "Dealers can update assigned requests"
  ON public.scrap_pickup_requests
  FOR UPDATE
  USING (
    dealer_id IN (
      SELECT id FROM public.scrap_dealers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all requests"
  ON public.scrap_pickup_requests
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_scrap_pickup_requests_updated_at
  BEFORE UPDATE ON public.scrap_pickup_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to award credits on completion
CREATE OR REPLACE FUNCTION public.award_scrap_credits()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  dealer_user_id UUID;
  resident_credits INTEGER;
  dealer_credits INTEGER;
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Get dealer's user_id
    SELECT user_id INTO dealer_user_id
    FROM scrap_dealers
    WHERE id = NEW.dealer_id;
    
    -- Calculate credits based on waste volume (10 credits per kg)
    resident_credits := FLOOR(NEW.waste_volume * 10);
    dealer_credits := FLOOR(NEW.waste_volume * 5);
    
    -- Award credits to resident
    UPDATE users
    SET credits = credits + resident_credits
    WHERE id = NEW.user_id;
    
    -- Award credits to dealer
    UPDATE users
    SET credits = credits + dealer_credits
    WHERE id = dealer_user_id;
    
    -- Log resident credits
    INSERT INTO credits_log (user_id, amount, reason, reference_id, awarded_by)
    VALUES (
      NEW.user_id,
      resident_credits,
      'Scrap pickup completed - ' || NEW.waste_type,
      NEW.id,
      dealer_user_id
    );
    
    -- Log dealer credits
    INSERT INTO credits_log (user_id, amount, reason, reference_id, awarded_by)
    VALUES (
      dealer_user_id,
      dealer_credits,
      'Scrap pickup service - ' || NEW.waste_type,
      NEW.id,
      NEW.user_id
    );
    
    -- Create notifications
    INSERT INTO notifications (user_id, title, message, type, meta)
    VALUES (
      NEW.user_id,
      'Pickup Completed',
      'Your scrap pickup has been completed. You earned ' || resident_credits || ' credits!',
      'success',
      jsonb_build_object('request_id', NEW.id, 'credits', resident_credits)
    );
    
    INSERT INTO notifications (user_id, title, message, type, meta)
    VALUES (
      dealer_user_id,
      'Pickup Completed',
      'Pickup completed successfully. You earned ' || dealer_credits || ' credits!',
      'success',
      jsonb_build_object('request_id', NEW.id, 'credits', dealer_credits)
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger to award credits
CREATE TRIGGER on_pickup_completed
  AFTER UPDATE ON public.scrap_pickup_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.award_scrap_credits();