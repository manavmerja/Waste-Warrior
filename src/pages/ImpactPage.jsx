import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
// Images import
import oBin1 from '../assets/overflowBin1(before).jpeg';
import oBin2 from '../assets/overflowBin1(after).jpeg';
import illDump1 from '../assets/illegalDump(before).png';
import illDump2 from '../assets/illegalDump(after).png';
import parkR1 from '../assets/parkRestore(before).jpg';
import parkR2 from '../assets/parkRestore(after).jpg';
import damBin from '../assets/damagedBins.jpg';
import fixBin from '../assets/fixedBins.png';
import streetB1 from '../assets/streetCorner(before).jpg';
import streetB2 from '../assets/streetCorner(after).jpg';
import commCl1 from '../assets/commClean(before).jpg';
import commCl2 from '../assets/commClean(after).jpg';
import { 
  CheckCircle, 
  Coins, 
  Users, 
  MapPin,
  Quote,
  Award
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { 
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

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
    image_before: oBin1,
    image_after: oBin2,
  },
  {
    id: 2,
    title: "Illegal Dumping Site Cleaned",
    location: "Ward 3",
    beforeDesc: "Large pile of construction waste",
    afterDesc: "Area restored and monitored",
    image_before: illDump1,
    image_after: illDump2,
  },
  {
    id: 3,
    title: "Park Restoration Project",
    location: "Ward 7",
    beforeDesc: "Littered recreational area",
    afterDesc: "Beautiful community space",
    image_before: parkR1,
    image_after: parkR2,
  },
  {
    id: 4,
    title: "Broken Recycling Station Fixed",
    location: "Ward 2",
    beforeDesc: "Damaged and unusable bins",
    afterDesc: "Fully functional station",
    image_before: damBin,
    image_after: fixBin,
  },
  {
    id: 5,
    title: "Street Corner Cleanup",
    location: "Ward 6",
    beforeDesc: "Accumulated garbage pile",
    afterDesc: "Pristine corner restored",
    image_before: streetB1,
    image_after: streetB2,
  },
  {
    id: 6,
    title: "Community Garden Revival",
    location: "Ward 4",
    beforeDesc: "Neglected and overgrown",
    afterDesc: "Thriving green space",
    image_before: commCl1,
    image_after: commCl2,
  },
];

// Testimonials data
const testimonials = [
  {
    id: 1,
    text: "It's amazing to see how quickly our community responds. We're making a real difference!",
    author: "Rajesh M.",
    location: "Ward 3"
  },
  {
    id: 2,
    text: "I reported an overflowing bin in the morning, and it was cleaned by the afternoon. This app actually works!",
    author: "Priya S.",
    location: "Ward 10"
  },
  {
    id: 3,
    text: "Finally, a way to make our voices heard! It feels good to be part of the solution, not just the problem.",
    author: "Amit K.",
    location: "Resident"
  },
  {
    id: 4,
    text: "As a worker, getting 'Thank You' notes in the app is really motivating. Glad to be helping!",
    author: "Team Worker",
    location: "Team Alpha"
  },
  {
    id: 5,
    text: "My kids are now excited about spotting areas to clean up. We're earning points as a family!",
    author: "Sunita P.",
    location: "Resident"
  },
];

export default function ImpactPage() {
  const { t } = useTranslation();

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-8 pb-8"
    >
      {/* Page Header */}
      <motion.div variants={itemVariants} className="space-y-2">
        <h1 className="text-4xl font-bold text-gray-900">{t('impact.title') || 'Community Impact'}</h1>
        <p className="text-gray-600 text-lg">
          {t('impact.subtitle') || "See the collective achievements we've made together"}
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
                    {t('impact.totalReportsResolved') || 'Total Reports Resolved'}
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
                    {t('impact.totalGreenPoints') || 'Total Green Points Awarded'}
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
                    {t('impact.activeNeighborhoods') || 'Active Neighborhoods'}
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
          <h2 className="text-3xl font-bold text-gray-900">{t('impact.sectionTitle') || 'Our Community Impact'}</h2>
          <p className="text-gray-600">
            {t('impact.sectionSubtitle') || 'Real transformations made possible by engaged citizens like you'}
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
                      <p className="text-xs font-semibold text-gray-500 uppercase">{t('impact.before') || 'Before'}</p>
                      <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                        <div className="w-full h-full bg-gradient-to-br from-red-100 to-orange-100 flex items-center justify-center">
                          {/* <span className="text-4xl"></span> */}
                          <span className="text-4xl"><img src={item.image_before}></img></span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600">{item.beforeDesc}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-gray-500 uppercase">{t('impact.after') || 'After'}</p>
                      <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                        <div className="w-full h-full bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
                          <span className="text-4xl"><img src={item.image_after}></img></span>
                          {/* <span className="text-4xl"><img src={overflowBin}></img></span> */}
                          {/* <span className="text-4xl">...</span> */}
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
                      {t('impact.resolvedBadge') || 'Resolved! ✅'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Hero of the Month */}
      <motion.div
        variants={slideFromLeft}
        whileInView="visible"
        initial="hidden"
        viewport={{ once: true }}
      >
        <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 shadow-lg border-2 border-purple-200">
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-purple-100 p-3 rounded-full">
                <Award className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-3xl font-bold text-purple-700">
                {t('impact.heroTitle') || 'Hero of the Month'}
              </h3>
            </div>
            
            <div className="flex items-start gap-6">
              <Avatar className="w-24 h-24 border-4 border-purple-300 shadow-lg">
                <AvatarFallback className="bg-purple-200 text-purple-700 text-3xl font-bold">
                  MM
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-4">
                <div>
                  <h4 className="text-2xl font-bold text-gray-900">Manav Merja</h4>
                  <p className="text-sm text-purple-600 font-medium">{t('impact.wardChampion') || 'Ward 5 Champion'}</p>
                </div>
                
                <p className="text-gray-700 leading-relaxed">
                  {t('impact.heroDescription') || "Filed 30 resolved reports this month and inspired neighbors to join the movement. Manav's dedication to keeping Ward 5 clean has made a visible difference in the community!"}
                </p>
                
                <div className="flex items-center gap-3">
                  <Badge className="bg-purple-600 text-white hover:bg-purple-700 px-4 py-2 text-sm">
                    {t('impact.reportsBadge', { count: 30 }) || '30 Reports'}
                  </Badge>
                  <Badge className="bg-green-600 text-white hover:bg-green-700 px-4 py-2 text-sm">
                    {t('impact.pointsBadge', { count: 850 }) || '850 Points'}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* What Our Community Says */}
      <motion.div
        variants={slideFromRight}
        whileInView="visible"
        initial="hidden"
        viewport={{ once: true }}
        className="space-y-6"
      >
        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-gray-900">💬 {t('impact.testimonialsTitle') || 'What Our Community Says'}</h2>
          <p className="text-gray-600">
            {t('impact.testimonialsSubtitle') || 'Hear from residents and workers making a difference'}
          </p>
        </div>

        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-4">
            {testimonials.map((testimonial, index) => (
              <CarouselItem key={testimonial.id} className="pl-4 md:basis-1/2 lg:basis-1/3">
                <motion.div
                  whileHover={{ scale: 1.02, y: -5 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="bg-white shadow-lg h-full">
                    <CardContent className="p-6 flex flex-col h-full">
                      <Quote className="w-8 h-8 text-indigo-400 mb-4" />
                      <p className="text-gray-700 leading-relaxed italic flex-1 mb-4">
                        "{testimonial.text}"
                      </p>
                      <div className="border-t pt-4">
                        <p className="font-semibold text-gray-900">
                          {testimonial.author}
                        </p>
                        <p className="text-sm text-gray-600">
                          {testimonial.location}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden md:flex" />
          <CarouselNext className="hidden md:flex" />
        </Carousel>
      </motion.div>
    </motion.div>
  );
}
