import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ResidentDashboard from '@/components/dashboards/ResidentDashboard';
import AdminDashboard from '@/components/dashboards/AdminDashboard';
import WorkerDashboard from '@/components/dashboards/WorkerDashboard';
import ScrapDealerDashboard from '@/components/dashboards/ScrapDealerDashboard';
import { Card, CardContent } from '@/components/ui/card';
import { Users } from 'lucide-react';

export default function DashboardPage() {
  const { userProfile } = useAuth();

  const renderDashboard = () => {
    if (!userProfile) {
      return (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Loading profile...</p>
            </div>
          </CardContent>
        </Card>
      );
    }

    switch (userProfile.role) {
      case 'resident':
        return <ResidentDashboard />;
      case 'worker':
        return <WorkerDashboard />;
      case 'admin':
        return <AdminDashboard />;
      case 'scrap_dealer':
        return <ScrapDealerDashboard />;
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

  return (
    <DashboardLayout>
      {renderDashboard()}
    </DashboardLayout>
  );
}