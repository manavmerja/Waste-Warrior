import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence, useAnimationControls } from 'framer-motion';
import { Recycle, Bell, User, LogOut, ChevronDown } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import LanguageSelector from '@/components/ui/language-selector';
import NotificationDropdown from '@/components/layout/NotificationDropdown';
import { useTranslation } from 'react-i18next';

// 
// --- 1. BUG FIX #1: Added 'navLinks' to the props list here ---
//
export default function DashboardLayout({ children, activeSection, onSectionChange, navLinks }) {
  const { user, userProfile, signOut, loading } = useAuth();
  const { t } = useTranslation();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const notificationControls = useAnimationControls(); // This was in your file, but not used by handleNotificationClick. Added it back.

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

  // This function was in your file, let's keep it.
  const handleNotificationClick = () => {
    notificationControls.start({
      rotate: [0, -15, 15, -15, 15, 0],
      transition: { duration: 0.4, times: [0, 0.2, 0.4, 0.6, 0.8, 1] }
    });
    setShowNotificationDropdown(!showNotificationDropdown); // Use this instead of onSectionChange
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-400 via-sky-500 to-violet-500 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  //
  // We DELETED the old, hard-coded 'navigationLinks' array from here.
  // The 'navLinks' prop is now used directly in the <nav> section.
  //

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-400 via-sky-500 to-violet-500 relative overflow-hidden">
      {/* ... (Animated Background & Particle code is all correct) ... */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* ... motion divs ... */}
      </div>

      {/* Top Navigation Header - White */}
      <header className="sticky top-0 z-50 backdrop-blur-lg border-b border-gray-200 shadow-lg"
        style={{ background: 'linear-gradient(to top right, #009900 0%, #73e403ff 75%, #a9fa4cff 100%)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <motion.button
              //
              // --- 2. BUG FIX #2: Fixed typo from 'navLink[0].id' to 'navLinks[0].id' ---
              //
              onClick={() => onSectionChange(navLinks[0].id)} // Navigate to the first section (e.g., 'overview' or 'pickups')
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-2 text-[#C1E1C1] hover:text-[#00A86B] transition-colors"
            >
              <Recycle className="w-8 h-8 text-[#006400] hover:text-emerald-700" />
              <span className="text-xl font-bold hidden sm:inline text-emerald-900">Waste Warrior</span>
            </motion.button>

            {/* Main Navigation Links */}
            <nav className="hidden md:flex items-center space-x-1">
              {/* This 'navLinks' variable is now correctly coming from props */}
              {navLinks.map((link, index) => (
                <motion.button
                  key={link.id}
                  onClick={() => onSectionChange(link.id)}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`relative px-4 py-2 text-sm font-medium transition-colors
                    ${activeSection === link.id
                      ? 'text-white font-bold' // Style for the ACTIVE link
                      : 'text-black hover:text-white-900' // Style for INACTIVE links
                    }
                  `}
                >

                  {link.label}
                  {activeSection === link.id && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-1 left-2 right-2 h-1 rounded-full bg-white"
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
                className="relative p-2 text-gray-700 hover:text-gray-900 transition-colors"
                onClick={handleNotificationClick} // Using the click handler from your file
                animate={notificationControls} // Using the controls from your file
              >
                <Bell className="w-5 h-5" />
                {unreadNotifications > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold"
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
                  <ChevronDown className={`w-4 h-4 text-gray-700 transition-transform ${showProfileDropdown ? 'rotate-180' : ''}`} />
                </motion.button>

                {/* Notification Dropdown Menu */}
                <AnimatePresence>
                  {showNotificationDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 mr-16 w-80 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50"
                    >
                      <NotificationDropdown 
                        onClose={() => setShowNotificationDropdown(false)} 
                        setUnreadCount={setUnreadNotifications} 
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Profile Dropdown Menu */}
                <AnimatePresence>
                  {showProfileDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-2xl border border-gray-200 py-2 z-50"
                    >
                      <div className="px-4 py-3 border-b border-gray-200">
                        <p className="text-sm font-semibold text-gray-900">{userProfile?.full_name}</p>
                        <p className="text-xs text-gray-600 truncate">{user.email}</p>
                      </div>
                      <button
                        onClick={() => {
                          onSectionChange('profile');
                          setShowProfileDropdown(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                      >
                        <User className="w-4 h-4" />
                        <span>{t('dashboard.profile')}</span>
                      </button>
                      <button
                        onClick={signOut}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>{t('common.logout')}</span>
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

      {/* Main Content with white cards */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}