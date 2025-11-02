import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Recycle, Bell, User, LogOut, ChevronDown } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import LanguageSelector from '@/components/ui/language-selector';
import { useTranslation } from 'react-i18next';

export default function DashboardLayout({ children, activeSection, onSectionChange }) {
  const { user, userProfile, signOut, loading } = useAuth();
  const { t } = useTranslation();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    if (userProfile?.id) {
      fetchNotificationCount();
    }
  }, [userProfile]);

  const fetchNotificationCount = async () => {
    try {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userProfile.id)
        .eq('is_read', false);
      
      setUnreadNotifications(count || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-violet-50 to-cyan-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const navigationLinks = [
    { id: 'overview', label: 'Overview' },
    { id: 'report', label: 'Report Waste' },
    { id: 'learning', label: 'Learning' },
    { id: 'credits', label: 'Credits' },
    { id: 'leaderboard', label: 'Leaderboard' },
    { id: 'impact', label: 'Impact' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 to-cyan-50 relative overflow-hidden">
      {/* Animated Background Layer */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-br from-purple-500/20 to-transparent rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -80, 0],
            y: [0, 100, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-40 right-20 w-[500px] h-[500px] bg-gradient-to-br from-red-500/20 to-transparent rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, 60, 0],
            y: [0, -70, 0],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute bottom-20 left-1/3 w-[400px] h-[400px] bg-gradient-to-br from-orange-500/20 to-transparent rounded-full blur-3xl"
        />

        
        
        {/* Particle Effects */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            animate={{
              y: [0, -1000],
              x: [0, Math.random() * 100 - 50],
              opacity: [0, 0.6, 0],
            }}
            transition={{
              duration: 10 + Math.random() * 10,
              repeat: Infinity,
              delay: Math.random() * 5,
            }}
            className={`absolute w-1 h-1 rounded-full ${
              i % 3 === 0 ? 'bg-purple-500/40' : i % 3 === 1 ? 'bg-orange-500/40' : 'bg-cyan-500/40'
            }`}
            style={{
              left: `${Math.random() * 100}%`,
              top: '100%',
            }}
          />
        ))}
      </div>

      {/* Top Navigation Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <motion.button
              onClick={() => onSectionChange('overview')}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-2 text-[#00A86B] hover:opacity-80 transition-opacity"
            >
              <Recycle className="w-8 h-8" />
              <span className="text-xl font-bold hidden sm:inline">Waste Warrior</span>
            </motion.button>

            {/* Main Navigation Links */}
            <nav className="hidden md:flex items-center space-x-1">
              {navigationLinks.map((link, index) => (
                <motion.button
                  key={link.id}
                  onClick={() => {console.log('Header buttorn clicked: ', link.id);
                    onSectionChange(link.id);
                  }}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative px-4 py-2 text-sm font-medium text-gray-700 hover:text-[#00A86B] transition-colors"
                >
                  {link.label}
                  {activeSection === link.id && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00A86B]"
                      initial={false}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </motion.button>
              ))}
            </nav>

            {/* Right Side Icons */}
            <div className="flex items-center space-x-4">
              {/* Notification Bell */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="relative p-2 text-gray-600 hover:text-[#00A86B] transition-colors"
                onClick={() => onSectionChange('notifications')}
              >
                <Bell className="w-5 h-5" />
                {unreadNotifications > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-0 right-0 w-5 h-5 bg-[#EF4444] text-white text-xs rounded-full flex items-center justify-center font-bold"
                  >
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </motion.span>
                )}
              </motion.button>

              {/* Profile Dropdown */}
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="flex items-center space-x-2 p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={userProfile?.avatar_url} alt={userProfile?.full_name} />
                    <AvatarFallback className="bg-[#00A86B] text-white">
                      {userProfile?.full_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${showProfileDropdown ? 'rotate-180' : ''}`} />
                </motion.button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {showProfileDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50"
                    >
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900">{userProfile?.full_name}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                      
                      <button
                        onClick={() => {
                          onSectionChange('profile');
                          setShowProfileDropdown(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                      >
                        <User className="w-4 h-4" />
                        <span>My Profile</span>
                      </button>
                      
                      <button
                        onClick={signOut}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Log Out</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Language Selector */}
              <LanguageSelector />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content with elevated white cards */}
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
