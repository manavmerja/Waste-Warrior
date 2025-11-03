import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  CheckCircle, 
  Coins, 
  Users, 
  MapPin,
  Quote
} from 'lucide-react';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" }
  }
};

const cardHoverVariants = {
  hover: { 
    scale: 1.02, 
    y: -5,
    transition: { duration: 0.2 }
  }
};

const slideFromLeft = {
  hidden: { opacity: 0, x: -50 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.6, ease: "easeOut" }
  }
};

const slideFromRight = {
  hidden: { opacity: 0, x: 50 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.6, ease: "easeOut" }
  }
};

// Counter animation component
const AnimatedCounter = ({ target, suffix = "" }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const duration = 2000; // 2 seconds
    const steps = 60;
    const increment = target / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [target]);

  return <span>{count.toLocaleString()}{suffix}</span>;
};

// Gallery data
const galleryItems = [
  {
    id: 1,
    title: "Overflowing Bin on Main Street",
    location: "Ward 5",
    beforeDesc: "Waste overflowing onto sidewalk",
    afterDesc: "Clean and properly managed",
  },
  {
    id: 2,
    title: "Illegal Dumping Site Cleaned",
    location: "Ward 3",
    beforeDesc: "Large pile of construction waste",
    afterDesc: "Area restored and monitored",
  },
  {
    id: 3,
    title: "Park Restoration Project",
    location: "Ward 7",
    beforeDesc: "Littered recreational area",
    afterDesc: "Beautiful community space",
  },
  {
    id: 4,
    title: "Broken Recycling Station Fixed",
    location: "Ward 2",
    beforeDesc: "Damaged and unusable bins",
    afterDesc: "Fully functional station",
  },
  {
    id: 5,
    title: "Street Corner Cleanup",
    location: "Ward 6",
    beforeDesc: "Accumulated garbage pile",
    afterDesc: "Pristine corner restored",
  },
  {
    id: 6,
    title: "Community Garden Revival",
    location: "Ward 4",
    beforeDesc: "Neglected and overgrown",
    afterDesc: "Thriving green space",
  },
];

// Testimonials data
const testimonials = [
  {
    id: 1,
    text: "I love seeing my street clean! The app makes it so easy to report issues.",
    author: "Priya S.",
    location: "Ward 5"
  },
  {
    id: 2,
    text: "Amazing to see how quickly our community responds. We're making a real difference!",
    author: "Rajesh M.",
    location: "Ward 3"
  },
  {
    id: 3,
    text: "The gamification keeps me motivated. It's not just cleaning, it's building a better neighborhood!",
    author: "Anita K.",
    location: "Ward 7"
  },
];

export default function ImpactPage() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  // Rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-8 pb-8"
    >
      {/* Page Header */}
      <motion.div variants={itemVariants} className="space-y-2">
        <h1 className="text-4xl font-bold text-gray-900">Community Impact</h1>
        <p className="text-gray-600 text-lg">
          See the collective achievements we've made together
        </p>
      </motion.div>

      {/* Community-Wide Statistics */}
      <motion.div 
        variants={itemVariants}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {/* Card 1: Resolved Reports */}
        <motion.div
          variants={cardHoverVariants}
          whileHover="hover"
          whileInView={{ opacity: 1, y: 0 }}
          initial={{ opacity: 0, y: 20 }}
          viewport={{ once: true }}
        >
          <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <p className="text-sm text-gray-600 font-medium">
                    Total Reports Resolved
                  </p>
                  <p className="text-4xl font-bold text-green-600">
                    <AnimatedCounter target={1287} />
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Card 2: Green Points */}
        <motion.div
          variants={cardHoverVariants}
          whileHover="hover"
          whileInView={{ opacity: 1, y: 0 }}
          initial={{ opacity: 0, y: 20 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <p className="text-sm text-gray-600 font-medium">
                    Total Green Points Awarded
                  </p>
                  <p className="text-4xl font-bold text-purple-600">
                    <AnimatedCounter target={85000} />
                  </p>
                </div>
                <div className="bg-purple-100 p-3 rounded-full">
                  <Coins className="w-8 h-8 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Card 3: Active Neighborhoods */}
        <motion.div
          variants={cardHoverVariants}
          whileHover="hover"
          whileInView={{ opacity: 1, y: 0 }}
          initial={{ opacity: 0, y: 20 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <p className="text-sm text-gray-600 font-medium">
                    Active Neighborhoods
                  </p>
                  <p className="text-4xl font-bold text-indigo-600">
                    <AnimatedCounter target={42} />
                  </p>
                </div>
                <div className="bg-indigo-100 p-3 rounded-full">
                  <Users className="w-8 h-8 text-indigo-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Before & After Gallery */}
      <motion.div
        variants={itemVariants}
        whileInView={{ opacity: 1, y: 0 }}
        initial={{ opacity: 0, y: 20 }}
        viewport={{ once: true }}
        className="space-y-6"
      >
        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-gray-900">Our Community Impact</h2>
          <p className="text-gray-600">
            Real transformations made possible by engaged citizens like you
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {galleryItems.map((item, index) => (
            <motion.div
              key={item.id}
              variants={cardHoverVariants}
              whileHover="hover"
              whileInView={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 20 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
                <CardContent className="p-0">
                  {/* Image Section */}
                  <div className="grid grid-cols-2 gap-1 p-4">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-gray-500 uppercase">Before</p>
                      <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                        <div className="w-full h-full bg-gradient-to-br from-red-100 to-orange-100 flex items-center justify-center">
                          <span className="text-4xl">🗑️</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600">{item.beforeDesc}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-gray-500 uppercase">After</p>
                      <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                        <div className="w-full h-full bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
                          <span className="text-4xl">✨</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600">{item.afterDesc}</p>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="p-4 pt-0 space-y-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 line-clamp-2">
                        {item.title}
                      </h3>
                      <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                        <MapPin className="w-3 h-3" />
                        <span>{item.location}</span>
                      </div>
                    </div>
                    <Badge className="bg-[#00A86B] text-white hover:bg-[#00A86B]/90">
                      Resolved! ✅
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Hero Spotlights & Testimonials */}
      <motion.div
        variants={itemVariants}
        whileInView={{ opacity: 1, y: 0 }}
        initial={{ opacity: 0, y: 20 }}
        viewport={{ once: true }}
      >
        <Card className="bg-white shadow-lg">
          <CardContent className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Column 1: Hero of the Month */}
              <motion.div
                variants={slideFromLeft}
                whileInView="visible"
                initial="hidden"
                viewport={{ once: true }}
                className="space-y-6"
              >
                <div className="space-y-3">
                  <h3 className="text-2xl font-bold text-[#8B5CF6]">
                    🏆 Hero of the Month
                  </h3>
                  <div className="flex items-start gap-4">
                    <Avatar className="w-20 h-20 border-4 border-purple-200">
                      <AvatarFallback className="bg-purple-100 text-purple-600 text-2xl font-bold">
                        MM
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h4 className="text-xl font-bold text-gray-900">Manav Merja</h4>
                      <p className="text-gray-600 mt-2 leading-relaxed">
                        Filed 30 resolved reports this month and inspired neighbors 
                        to join the movement. Manav's dedication to keeping Ward 5 
                        clean has made a visible difference in the community!
                      </p>
                      <div className="flex items-center gap-2 mt-3">
                        <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                          30 Reports
                        </Badge>
                        <Badge variant="secondary" className="bg-green-100 text-green-700">
                          850 Points
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Column 2: Testimonials */}
              <motion.div
                variants={slideFromRight}
                whileInView="visible"
                initial="hidden"
                viewport={{ once: true }}
                className="space-y-4"
              >
                <h3 className="text-2xl font-bold text-gray-900">
                  💬 What Our Community Says
                </h3>
                <div className="relative h-48">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentTestimonial}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.5 }}
                      className="absolute inset-0"
                    >
                      <div className="bg-slate-100 rounded-lg p-6 h-full flex flex-col justify-between">
                        <div className="space-y-3">
                          <Quote className="w-8 h-8 text-indigo-400" />
                          <p className="text-gray-700 text-lg leading-relaxed italic">
                            "{testimonials[currentTestimonial].text}"
                          </p>
                        </div>
                        <div className="flex items-center justify-between mt-4">
                          <div>
                            <p className="font-semibold text-gray-900">
                              {testimonials[currentTestimonial].author}
                            </p>
                            <p className="text-sm text-gray-600">
                              {testimonials[currentTestimonial].location}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            {testimonials.map((_, idx) => (
                              <div
                                key={idx}
                                className={`h-2 w-2 rounded-full transition-all ${
                                  idx === currentTestimonial
                                    ? 'bg-indigo-600 w-6'
                                    : 'bg-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
