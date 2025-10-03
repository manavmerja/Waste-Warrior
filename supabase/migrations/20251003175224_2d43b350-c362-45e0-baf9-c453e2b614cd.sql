-- Fix search_path security warnings - drop trigger first
DROP TRIGGER IF EXISTS trigger_notify_worker_assignment ON reports;
DROP FUNCTION IF EXISTS notify_worker_on_assignment();

-- Recreate function with proper search_path
CREATE OR REPLACE FUNCTION notify_worker_on_assignment()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Recreate trigger
CREATE TRIGGER trigger_notify_worker_assignment
AFTER UPDATE ON reports
FOR EACH ROW
EXECUTE FUNCTION notify_worker_on_assignment();

-- Fix escalation function
DROP FUNCTION IF EXISTS check_overdue_reports();
CREATE OR REPLACE FUNCTION check_overdue_reports()
RETURNS void 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE reports
  SET status = 'escalated'
  WHERE status IN ('assigned', 'in_progress')
    AND deadline < NOW()
    AND resolved_at IS NULL;
    
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
$$;