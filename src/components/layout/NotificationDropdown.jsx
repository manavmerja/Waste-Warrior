import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';

export default function NotificationDropdown({ onClose, setUnreadCount }) {
  return (
    // ✅ FORCE TEXT COLOR TO BLACK
    <div className="flex flex-col h-full" style={{ color: '#111827' }}>
      <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
        <span className="font-semibold text-sm text-gray-900">Notifications</span>
        <Button variant="ghost" size="sm" className="text-xs text-green-600 hover:text-green-700 h-auto p-0" onClick={() => setUnreadCount(0)}>
          Mark all as read
        </Button>
      </div>

      <ScrollArea className="h-[300px]">
        {/* Dummy/Empty State */}
        <div className="flex flex-col items-center justify-center h-40 text-gray-400">
          <Bell className="h-8 w-8 mb-2 opacity-20" />
          <p className="text-xs">No new notifications</p>
          <p className="text-[10px] mt-2 text-green-600 cursor-pointer">View all notifications (coming soon)</p>
        </div>
      </ScrollArea>
    </div>
  );
}