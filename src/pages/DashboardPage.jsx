// src/pages/DashboardPage.jsx

import { useState } from 'react'; // <-- Step 1: Import useState
import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ResidentDashboard from '@/components/dashboards/ResidentDashboard';
import AdminDashboard from '@/components/dashboards/AdminDashboard';
import WorkerDashboard from '@/components/dashboards/WorkerDashboard';
import ScrapDealerDashboard from '@/components/dashboards/ScrapDealerDashboard';
import { Card, CardContent } from '@/components/ui/card';
import { Users } from 'lucide-react';
import { motion } from 'framer-motion'; // Import motion for loading animation if needed

export default function DashboardPage() {
  const { userProfile } = useAuth();
  // Step 2: Initialize the activeSection state here
  const [activeSection, setActiveSection] = useState('overview');

  const renderDashboard = () => {
    if (!userProfile) {
      // Keep your loading state consistent
      return (
        <div className="flex items-center justify-center min-h-64">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 border-4 border-[#00A86B] border-t-transparent rounded-full"
          />
        </div>
      );
    }

    // Step 4: Pass activeSection and setActiveSection down to the specific dashboard
    switch (userProfile.role) {
      case 'resident':
        return <ResidentDashboard activeSection={activeSection} onSectionChange={setActiveSection} />;
      case 'worker':
        // Assuming WorkerDashboard might also need these props
        return <WorkerDashboard activeSection={activeSection} onSectionChange={setActiveSection} />;
      case 'admin':
        // Assuming AdminDashboard might also need these props
        return <AdminDashboard activeSection={activeSection} onSectionChange={setActiveSection} />;
      case 'scrap_dealer':
         // Assuming ScrapDealerDashboard might also need these props
        return <ScrapDealerDashboard activeSection={activeSection} onSectionChange={setActiveSection} />;
      default:
        return (
          <Card>
            <CardContent className="py-8">
              <div className="text-center">
                <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Unknown role: {userProfile.role}</p>
              </div>
            </CardContent>
          </Card>
        );
    }
  };

  // Step 3: Pass activeSection and setActiveSection down to DashboardLayout
  return (
    <DashboardLayout activeSection={activeSection} onSectionChange={setActiveSection}>
      {renderDashboard()}
    </DashboardLayout>
  );
}