import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { motion, AnimatePresence, useAnimationControls } from 'framer-motion';
import { Recycle, Bell, User, LogOut, ChevronDown, Menu, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import LanguageSelector from '@/components/ui/language-selector';
import NotificationDropdown from '@/components/layout/NotificationDropdown';
import { useTranslation } from 'react-i18next';

export default function DashboardLayout({ children, activeSection, onSectionChange, navLinks }) {
  const { user, userProfile, signOut, loading } = useAuth();
  const { t } = useTranslation();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  
  // Mobile Sidebar State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const notificationControls = useAnimationControls();

  useEffect(() => {
    if (userProfile?.id) {
      fetchNotificationCount();
    }
  }, [userProfile]);

  // LOGIC: Screen resize hote hi menu band ho jaye agar desktop mode aa jaye
  useEffect(() => {
    const handleResize = () => {
      // Agar screen 768px (MD) se badi hai, toh sidebar band kar do
      if (window.innerWidth >= 768) { 
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const handleNotificationClick = () => {
    notificationControls.start({
      rotate: [0, -15, 15, -15, 15, 0],
      transition: { duration: 0.4, times: [0, 0.2, 0.4, 0.6, 0.8, 1] }
    });
    setShowNotificationDropdown(!showNotificationDropdown);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-x-hidden">
      
      {/* --- HEADER START --- */}
      <header 
        className="sticky top-0 z-50 shadow-lg text-white w-full"
        style={{ background: 'linear-gradient(to right, #059669, #0d9488)' }} 
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Left Side: Logo & Mobile Toggle */}
            <div className="flex items-center">
              
              {/* --- HAMBURGER MENU ICON --- */}
              {/* md:hidden = "Medium screen aur usse upar HIDDEN raho" */}
              {/* block = "Chhote screen par dikho" */}
              {/* Mobile Menu Button - Fixed: Hidden on Desktop (md:hidden) */}
             {/* Mobile Menu Button - CHANGED to lg:hidden */}
              <button 
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden p-2 rounded-md text-white hover:bg-white/20 mr-2 transition-colors"
              >
                <Menu className="h-6 w-6" />
              </button>

              <motion.button
                onClick={() => onSectionChange(navLinks[0].id)}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center space-x-2"
              >
                <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm">
                   <Recycle className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold hidden sm:inline text-white tracking-wide">Waste Warrior</span>
              </motion.button>
            </div>

            {/* --- DESKTOP NAVIGATION LINKS --- */}
            {/* hidden = "Chhote screen par GAYAB raho" */}
            {/* md:flex = "Medium screen aur usse upar FLEX (dikho)" */}
            <nav className="hidden md:flex items-center space-x-1">
              {navLinks.map((link, index) => (
                <motion.button
                  key={link.id}
                  onClick={() => onSectionChange(link.id)}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`relative px-4 py-2 text-sm font-medium transition-colors rounded-full
                    ${activeSection === link.id
                      ? 'text-white bg-white/20 font-bold shadow-sm' 
                      : 'text-green-50 hover:text-white hover:bg-white/10' 
                    }
                  `}
                >
                  {link.label}
                </motion.button>
              ))}
            </nav>

           {/* Right Side Icons (Always Visible) */}
            <div className="flex items-center space-x-2 md:space-x-4">
              <div className="bg-white/10 rounded-full px-2 py-1 hidden sm:block">
                 <LanguageSelector />
              </div>

              {/* Notification Bell */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="relative p-2 text-white hover:bg-white/20 rounded-full transition-colors"
                onClick={handleNotificationClick}
                animate={notificationControls}
              >
                <Bell className="w-5 h-5" />
                {unreadNotifications > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold border-2 border-emerald-600">
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </span>
                )}
              </motion.button>
              
              {/* Profile Dropdown */}
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="flex items-center space-x-2 p-1 hover:bg-white/20 rounded-full transition-colors border border-white/20"
                >
                  <Avatar className="h-8 w-8 ring-2 ring-white/30">
                    <AvatarImage src={userProfile?.avatar_url} alt={userProfile?.full_name} />
                    <AvatarFallback className="bg-emerald-800 text-white text-xs">
                      {userProfile?.full_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <ChevronDown className={`w-4 h-4 text-green-50 hidden md:block transition-transform ${showProfileDropdown ? 'rotate-180' : ''}`} />
                </motion.button>

                {/* Dropdowns logic remains same */}
                <AnimatePresence>
                  {showNotificationDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 mr-10 w-80 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 text-gray-800"
                    >
                      <NotificationDropdown 
                        onClose={() => setShowNotificationDropdown(false)} 
                        setUnreadCount={setUnreadNotifications} 
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {showProfileDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 text-gray-800"
                    >
                      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
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
            </div>
          </div>
        </div>
      </header>
      {/* --- HEADER END --- */}

      {/* --- MOBILE SIDEBAR DRAWER (md:hidden ensures it NEVER shows on desktop) --- */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm md:hidden"
            />
            
            {/* Sidebar Content */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-0 left-0 bottom-0 w-72 bg-white z-50 shadow-2xl md:hidden flex flex-col"
            >
              <div 
                className="h-16 flex items-center justify-between px-6 text-white"
                style={{ background: 'linear-gradient(to right, #059669, #0d9488)' }}
              >
                <span className="text-lg font-bold flex items-center gap-2">
                    <Recycle className="w-5 h-5" /> Menu
                </span>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-6 px-4">
                <nav className="space-y-2">
                  {navLinks.map((link) => (
                    <button
                      key={link.id}
                      onClick={() => {
                        onSectionChange(link.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center px-4 py-3.5 text-sm font-medium rounded-xl transition-all duration-200
                        ${activeSection === link.id
                          ? 'bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100' 
                          : 'text-gray-600 hover:bg-gray-50 hover:text-emerald-600'
                        }
                      `}
                    >
                      {link.label}
                    </button>
                  ))}
                </nav>
              </div>

              <div className="p-4 border-t border-gray-100 bg-gray-50">
                <button
                   onClick={signOut}
                   className="w-full flex items-center justify-center space-x-2 px-4 py-3 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-red-500 hover:bg-red-600 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-0">
        {children}
      </main>
    </div>
  );
}