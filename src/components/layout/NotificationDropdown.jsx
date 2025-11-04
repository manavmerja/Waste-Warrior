// src/components/layout/NotificationDropdown.jsx

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';
import { Bell, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

export default function NotificationDropdown({ onClose, setUnreadCount }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Fetch the 5 most recent notifications
  const fetchNotifications = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
      
      if (error) throw error;

      // Update UI
      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true }))
      );
      setUnreadCount(0); // Update the count in the header
      toast({ title: "All notifications marked as read." });

    } catch (error) {
      console.error('Error marking all as read:', error);
      toast({ title: "Error", description: "Could not mark notifications as read.", variant: "destructive" });
    }
  };

  return (
    <div>
      {/* Header of the dropdown */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">Notifications</h3>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={markAllAsRead}
          className="text-primary hover:text-primary"
        >
          <CheckCheck className="mr-1 h-4 w-4" />
          Mark all as read
        </Button>
      </div>

      {/* List of notifications */}
      <div className="max-h-80 overflow-y-auto">
        {loading && (
          <div className="flex justify-center items-center p-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full"
            />
          </div>
        )}
        
        {!loading && notifications.length === 0 && (
          <div className="text-center p-6 text-gray-500">
            <Bell className="mx-auto h-8 w-8 mb-2" />
            <p>You have no new notifications.</p>
          </div>
        )}

        {!loading && notifications.length > 0 && (
          <ul className="divide-y divide-gray-100">
            {notifications.map((n, index) => (
              <motion.li 
                key={n.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`px-4 py-3 ${!n.is_read ? 'bg-green-50' : 'bg-white'}`}
              >
                <p className="font-semibold text-sm text-gray-800">{n.title}</p>
                <p className="text-sm text-gray-600">{n.message}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(n.created_at).toLocaleString()}
                </p>
              </motion.li>
            ))}
          </ul>
        )}
      </div>

      {/* Footer (optional, e.g., "View all notifications") */}
      <div className="px-4 py-2 border-t border-gray-200 text-center">
        <Button 
          variant="link" 
          className="text-primary" 
          onClick={() => {
            // Here, you would navigate to a full notifications page
            // For now, it just closes the dropdown
            onClose();
          }}
        >
          View all notifications (coming soon)
        </Button>
      </div>
    </div>
  );
}