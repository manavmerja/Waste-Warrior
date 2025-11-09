// src/pages/DashboardPage.jsx

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ResidentDashboard from '@/components/dashboards/ResidentDashboard';
import AdminDashboard from '@/components/dashboards/AdminDashboard';
import WorkerDashboard from '@/components/dashboards/WorkerDashboard';
import ScrapDealerDashboard from '@/components/dashboards/ScrapDealerDashboard';
import { Card, CardContent } from '@/components/ui/card';
import { Users } from 'lucide-react';
import { motion } from 'framer-motion';

// --- DEFINE NAVIGATION LINKS FOR EACH ROLE ---
const residentNavLinks = [
  { id: 'overview', label: 'Overview' },
  { id: 'report', label: 'Report Waste' },
  { id: 'learning', label: 'Learning' },
  { id: 'credits', label: 'Credits' },
  { id: 'leaderboard', label: 'Green Champions Leaderboard' },
  { id: 'impact', label: 'Impact' },
];

const workerNavLinks = [
  { id: 'pickups', label: 'Assigned Pickups' },
  { id: 'progress', label: 'Progress Tracker' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'support', label: 'Support & Help' },
  // 'Profile' is handled by the dropdown, so we don't need it here
];

// --- (You can add Admin and ScrapDealer links here later) ---
const adminNavLinks = [
  // ... (e.g., { id: 'admin_overview', label: 'Admin Overview' }) ...
];
const scrapDealerNavLinks = [
  // ... (e.g., { id: 'market', label: 'Scrap Market' }) ...
];


export default function DashboardPage() {
  const { userProfile } = useAuth();

  // --- DETERMINE LINKS AND DEFAULT SECTION BASED ON ROLE ---
  let navigationLinks = residentNavLinks; // Default to resident links
  let defaultSection = 'overview';

  if (userProfile?.role === 'worker') {
    navigationLinks = workerNavLinks;
    defaultSection = 'pickups';
  } else if (userProfile?.role === 'admin') {
    // navigationLinks = adminNavLinks; // Uncomment when ready
    // defaultSection = 'admin_overview';
    navigationLinks = residentNavLinks; // Fallback for now
  } else if (userProfile?.role === 'scrap_dealer') {
    // navigationLinks = scrapDealerNavLinks; // Uncomment when ready
    // defaultSection = 'dealer_overview';
    navigationLinks = residentNavLinks; // Fallback for now
  }
  
  // --- INITIALIZE STATE ---
  const [activeSection, setActiveSection] = useState(defaultSection);

  // This effect ensures that when the userProfile loads,
  // the state updates to the correct default section.
  useEffect(() => {
    if (userProfile?.role) {
      if (userProfile.role === 'worker') {
        setActiveSection('pickups');
      } else if (userProfile.role === 'resident') {
        setActiveSection('overview');
      }
      // ... (add other roles later)
    }
  }, [userProfile?.role]); // This runs only when the role changes/loads

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

    // Pass activeSection and onSectionChange down to the specific dashboard
    switch (userProfile.role) {
      case 'resident':
        return <ResidentDashboard activeSection={activeSection} onSectionChange={setActiveSection} />;
      case 'worker':
        return <WorkerDashboard activeSection={activeSection} onSectionChange={setActiveSection} />;
      case 'admin':
        return <AdminDashboard activeSection={activeSection} onSectionChange={setActiveSection} />;
      case 'scrap_dealer':
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

  // --- PASS THE 'navLinks' PROP TO THE LAYOUT ---
  return (
    <DashboardLayout 
      activeSection={activeSection} 
      onSectionChange={setActiveSection}
      navLinks={navigationLinks} // <-- This prop now sends the correct links
    >
      {renderDashboard()}
    </DashboardLayout>
  );
}