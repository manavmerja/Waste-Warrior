-- Add new columns for segregation check and evidence uploads
ALTER TABLE reports ADD COLUMN IF NOT EXISTS segregation_done boolean DEFAULT false;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS segregation_verified boolean DEFAULT false;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS evidence_photo_url text;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS evidence_timestamp timestamp with time zone;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS evidence_lat numeric;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS evidence_lng numeric;

-- Create worker_notifications table for real-time notifications
CREATE TABLE IF NOT EXISTS worker_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  report_id uuid REFERENCES reports(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'assignment',
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on worker_notifications
ALTER TABLE worker_notifications ENABLE ROW LEVEL SECURITY;

-- Workers can view their own notifications
CREATE POLICY "Workers can view own notifications"
ON worker_notifications FOR SELECT
USING (worker_id = auth.uid());

-- Workers can mark their own notifications as read
CREATE POLICY "Workers can update own notifications"
ON worker_notifications FOR UPDATE
USING (worker_id = auth.uid());

-- System can create notifications
CREATE POLICY "System can create notifications"
ON worker_notifications FOR INSERT
WITH CHECK (true);

-- Enable realtime for worker_notifications
ALTER PUBLICATION supabase_realtime ADD TABLE worker_notifications;

-- Create function to auto-notify worker when assigned a report
CREATE OR REPLACE FUNCTION notify_worker_on_assignment()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.assigned_worker_id IS NOT NULL AND 
     (OLD.assigned_worker_id IS NULL OR OLD.assigned_worker_id != NEW.assigned_worker_id) THEN
    INSERT INTO worker_notifications (worker_id, report_id, title, message, type)
    VALUES (
      NEW.assigned_worker_id,
      NEW.id,
      'New Pickup Assignment',
      'You have been assigned a new waste pickup at ' || COALESCE(NEW.address_text, 'location'),
      'assignment'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for worker assignment notifications
DROP TRIGGER IF EXISTS trigger_notify_worker_assignment ON reports;
CREATE TRIGGER trigger_notify_worker_assignment
AFTER UPDATE ON reports
FOR EACH ROW
EXECUTE FUNCTION notify_worker_on_assignment();

-- Create function to auto-escalate overdue tasks
CREATE OR REPLACE FUNCTION check_overdue_reports()
RETURNS void AS $$
BEGIN
  -- Mark reports as escalated if past deadline and not completed
  UPDATE reports
  SET status = 'escalated'
  WHERE status IN ('assigned', 'in_progress')
    AND deadline < NOW()
    AND resolved_at IS NULL;
    
  -- Notify admins of escalated reports
  INSERT INTO notifications (user_id, title, message, type)
  SELECT 
    u.id,
    'Report Escalated',
    'Report "' || r.title || '" has been escalated due to missed deadline',
    'alert'
  FROM reports r
  CROSS JOIN users u
  WHERE r.status = 'escalated'
    AND u.role = 'admin'
    AND r.updated_at > NOW() - INTERVAL '1 minute';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_reports_deadline ON reports(deadline) WHERE status IN ('assigned', 'in_progress');
CREATE INDEX IF NOT EXISTS idx_worker_notifications_worker_id ON worker_notifications(worker_id);
CREATE INDEX IF NOT EXISTS idx_worker_notifications_read ON worker_notifications(is_read);