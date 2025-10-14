import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Recycle, Trophy, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import WasteWarriorLogo from '@/assets/waste-warrior.jpg';
import HeroIllustration from '@/assets/hero-illustration.jpg';

const Index = () => {
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen bg-[#F7FAFC] relative overflow-hidden">
      {/* Dynamic Background Shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-gradient-to-br from-[#6D28D9]/20 to-[#EF4444]/20 blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <motion.div
          className="absolute top-1/3 -left-32 w-80 h-80 rounded-full bg-gradient-to-br from-[#EF4444]/15 to-[#6D28D9]/15 blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            rotate: [0, -90, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <motion.div
          className="absolute bottom-20 right-1/4 w-64 h-64 rounded-full bg-gradient-to-br from-[#6D28D9]/10 to-[#EF4444]/10 blur-3xl"
          animate={{
            scale: [1, 1.4, 1],
            x: [0, 50, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>

      {/* Navigation Bar */}
      <motion.nav 
        className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/50"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <img 
                src={WasteWarriorLogo} 
                alt="Waste Warrior Logo" 
                className="w-10 h-10 transition-transform group-hover:scale-110"
              />
              <span className="text-xl font-bold text-[#1F2937]">Waste Warrior</span>
            </Link>

            {/* Center Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#about" className="text-[#1F2937] hover:text-[#00A86B] transition-colors font-medium">
                About
              </a>
              <Link to="/dashboard" className="text-[#1F2937] hover:text-[#00A86B] transition-colors font-medium">
                Leaderboard
              </Link>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
              {user ? (
                <Button asChild className="bg-[#00A86B] hover:bg-[#00A86B]/90">
                  <Link to="/dashboard">Dashboard</Link>
                </Button>
              ) : (
                <>
                  <Button asChild variant="ghost" className="hidden sm:flex">
                    <Link to="/auth">
                      <LogIn className="h-4 w-4 mr-2" />
                      Log In
                    </Link>
                  </Button>
                  <Button asChild className="bg-[#00A86B] hover:bg-[#00A86B]/90">
                    <Link to="/auth">Sign Up</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section - Two Column */}
      <section className="relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Text Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8 z-10"
            >
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-[#1F2937]">
                Shape a{' '}
                <span className="text-[#4F46E5]">Greener</span>{' '}
                Future, One Step at a Time
              </h1>

              <p className="text-lg sm:text-xl text-gray-600 leading-relaxed">
                Join Waste Warrior to turn your eco-friendly actions into rewards. 
                Together, let's build a cleaner, healthier community for everyone.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                {user ? (
                  <Button asChild size="lg" className="text-lg px-8 py-6 bg-[#00A86B] hover:bg-[#00A86B]/90 shadow-lg hover:shadow-xl transition-all">
                    <Link to="/dashboard">
                      Go to Dashboard
                    </Link>
                  </Button>
                ) : (
                  <>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button asChild size="lg" className="text-lg px-8 py-6 bg-[#00A86B] hover:bg-[#00A86B]/90 shadow-lg hover:shadow-xl transition-all">
                        <Link to="/auth">
                          Get Started Now
                        </Link>
                      </Button>
                    </motion.div>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button asChild variant="outline" size="lg" className="text-lg px-8 py-6 border-2 border-[#00A86B] text-[#00A86B] hover:bg-[#00A86B]/10">
                        <a href="#about">
                          Learn More
                        </a>
                      </Button>
                    </motion.div>
                  </>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 pt-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-center"
                >
                  <div className="text-3xl font-bold text-[#00A86B]">1000+</div>
                  <div className="text-sm text-gray-600">Active Users</div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-center"
                >
                  <div className="text-3xl font-bold text-[#4F46E5]">5000+</div>
                  <div className="text-sm text-gray-600">Reports Filed</div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="text-center"
                >
                  <div className="text-3xl font-bold text-[#EF4444]">100+</div>
                  <div className="text-sm text-gray-600">Communities</div>
                </motion.div>
              </div>
            </motion.div>

            {/* Right Column - Illustration */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative z-10"
            >
              <img 
                src={HeroIllustration} 
                alt="Waste Management Process" 
                className="w-full h-auto drop-shadow-2xl"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="about" className="py-20 bg-white relative z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1F2937] mb-4">
              Why Choose Waste Warrior?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Join a community-driven platform that makes waste management rewarding and impactful
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Recycle,
                title: 'Smart Recycling',
                description: 'Connect with local scrap dealers and track your recycling impact in real-time.',
                color: '#00A86B'
              },
              {
                icon: Trophy,
                title: 'Earn Rewards',
                description: 'Get green points for eco-friendly actions and redeem exciting rewards.',
                color: '#4F46E5'
              },
              {
                icon: Recycle,
                title: 'Community Impact',
                description: 'Join thousands working together to build cleaner, greener neighborhoods.',
                color: '#EF4444'
              }
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                className="bg-gradient-to-br from-white to-gray-50 p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all border border-gray-100"
              >
                <div 
                  className="w-14 h-14 rounded-xl flex items-center justify-center mb-6"
                  style={{ backgroundColor: `${feature.color}15` }}
                >
                  <feature.icon className="h-7 w-7" style={{ color: feature.color }} />
                </div>
                <h3 className="text-xl font-bold text-[#1F2937] mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#00A86B] to-[#4F46E5] opacity-95" />
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              Ready to Make a Difference?
            </h2>
            <p className="text-lg text-white/90">
              Join thousands already making their communities cleaner and greener
            </p>
            {!user && (
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button asChild size="lg" className="text-lg px-8 py-6 bg-white text-[#00A86B] hover:bg-gray-100 shadow-xl">
                  <Link to="/auth">
                    Join Waste Warrior Today
                  </Link>
                </Button>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Index;
