import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DashboardLayout({ children }) {
  const { user, userProfile, signOut, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const getRoleDisplayName = (role) => {
    const roleMap = {
      resident: 'Resident',
      worker: 'Waste Worker', 
      admin: 'Administrator',
      scrap_dealer: 'Scrap Dealer'
    };
    return roleMap[role] || 'User';
  };

  const getRoleColor = (role) => {
    const colorMap = {
      resident: 'bg-blue-100 text-blue-800',
      worker: 'bg-orange-100 text-orange-800',
      admin: 'bg-purple-100 text-purple-800',
      scrap_dealer: 'bg-green-100 text-green-800'
    };
    return colorMap[role] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-xl font-bold text-primary"
            >
              Waste Warrior
            </motion.h1>
            
            <div className="flex items-center space-x-4">
              {userProfile && (
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">
                      {userProfile.full_name || user.email}
                    </p>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(userProfile.role)}`}>
                      {getRoleDisplayName(userProfile.role)}
                    </span>
                  </div>
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-primary-foreground" />
                  </div>
                </div>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}