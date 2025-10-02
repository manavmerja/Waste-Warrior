import { motion } from 'framer-motion';
import { Map, MapPin, Users, Award, Coins, Package, Briefcase, FileText, CheckSquare, Download, LayoutDashboard, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'map', label: 'Map & Tracking', icon: Map },
  { id: 'collection-points', label: 'Collection Points', icon: MapPin },
  { id: 'users', label: 'User Management', icon: Users },
  { id: 'champions', label: 'Green Champions', icon: Award },
  { id: 'credits', label: 'Credits & Penalties', icon: Coins },
  { id: 'kits', label: 'Kit Distribution', icon: Package },
  { id: 'workers', label: 'Workers Management', icon: Briefcase },
  { id: 'reports', label: 'Report Monitoring', icon: FileText },
  { id: 'verification', label: 'Visit Verification', icon: CheckSquare },
  { id: 'learning-progress', label: 'Learning Progress', icon: BookOpen },
  { id: 'export', label: 'Export Reports', icon: Download },
];

export default function AdminSidebar({ activeSection, onSectionChange }) {
  return (
    <div className="w-64 border-r bg-card h-full">
      <div className="p-6 border-b">
        <h2 className="text-xl font-bold text-primary flex items-center gap-2">
          <LayoutDashboard className="h-6 w-6" />
          Admin Panel
        </h2>
      </div>
      
      <ScrollArea className="h-[calc(100vh-5rem)]">
        <nav className="p-4 space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            
            return (
              <motion.div
                key={item.id}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className="w-full justify-start gap-3"
                  onClick={() => onSectionChange(item.id)}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm">{item.label}</span>
                </Button>
              </motion.div>
            );
          })}
        </nav>
      </ScrollArea>
    </div>
  );
}
