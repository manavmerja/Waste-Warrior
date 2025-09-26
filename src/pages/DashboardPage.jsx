import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ResidentDashboard from '@/components/dashboards/ResidentDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Truck, Recycle, Users } from 'lucide-react';

function WorkerDashboard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Truck className="mr-2 h-5 w-5" />
          Worker Dashboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Worker dashboard coming soon...</p>
      </CardContent>
    </Card>
  );
}

function AdminDashboard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Shield className="mr-2 h-5 w-5" />
          Admin Dashboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Admin dashboard coming soon...</p>
      </CardContent>
    </Card>
  );
}

function ScrapDealerDashboard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Recycle className="mr-2 h-5 w-5" />
          Scrap Dealer Dashboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Scrap dealer dashboard coming soon...</p>
      </CardContent>
    </Card>
  );
}

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