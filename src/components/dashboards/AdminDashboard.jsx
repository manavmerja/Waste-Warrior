import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
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
import LearningProgressManagement from '@/components/admin/sections/LearningProgressManagement';
import LanguageSelector from '@/components/ui/language-selector';

export default function AdminDashboard() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const { t } = useTranslation();

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
      case 'learning-progress':
        return <LearningProgressManagement />;
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
        {/* Top Bar with Language Selector */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="flex justify-end items-center px-6 py-3">
            <LanguageSelector />
          </div>
        </div>

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
