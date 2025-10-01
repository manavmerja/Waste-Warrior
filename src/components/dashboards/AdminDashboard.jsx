import { useState } from 'react';
import { motion } from 'framer-motion';
import AdminSidebar from '@/components/admin/AdminSidebar';
import DashboardOverview from '@/components/admin/sections/DashboardOverview';
import MapTracking from '@/components/admin/sections/MapTracking';
import CollectionPointManagement from '@/components/admin/sections/CollectionPointManagement';
import UserManagement from '@/components/admin/sections/UserManagement';
import GreenChampions from '@/components/admin/sections/GreenChampions';
import CreditsManagement from '@/components/admin/sections/CreditsManagement';
import KitDistribution from '@/components/admin/sections/KitDistribution';
import WorkersManagement from '@/components/admin/sections/WorkersManagement';
import ReportMonitoring from '@/components/admin/sections/ReportMonitoring';
import VisitVerification from '@/components/admin/sections/VisitVerification';
import ExportReports from '@/components/admin/sections/ExportReports';

export default function AdminDashboard() {
  const [activeSection, setActiveSection] = useState('dashboard');

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <DashboardOverview />;
      case 'map':
        return <MapTracking />;
      case 'collection-points':
        return <CollectionPointManagement />;
      case 'users':
        return <UserManagement />;
      case 'champions':
        return <GreenChampions />;
      case 'credits':
        return <CreditsManagement />;
      case 'kits':
        return <KitDistribution />;
      case 'workers':
        return <WorkersManagement />;
      case 'reports':
        return <ReportMonitoring />;
      case 'verification':
        return <VisitVerification />;
      case 'export':
        return <ExportReports />;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AdminSidebar 
        activeSection={activeSection} 
        onSectionChange={setActiveSection} 
      />
      
      <div className="flex-1 overflow-auto">
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="p-6"
        >
          {renderSection()}
        </motion.div>
      </div>
    </div>
  );
}
