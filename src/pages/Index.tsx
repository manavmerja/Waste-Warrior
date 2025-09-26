import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Recycle, Leaf, Users, Award, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const Index = () => {
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              {/* Logo */}
              <div className="flex justify-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="inline-flex items-center justify-center w-20 h-20 bg-primary rounded-full shadow-lg"
                >
                  <Recycle className="w-10 h-10 text-primary-foreground" />
                </motion.div>
              </div>

              {/* Title */}
              <div className="space-y-4">
                <h1 className="text-4xl sm:text-6xl font-bold tracking-tight">
                  <span className="text-foreground">Waste</span>{" "}
                  <span className="text-primary">Warrior</span>
                </h1>
                <p className="text-xl sm:text-2xl text-muted-foreground max-w-3xl mx-auto">
                  Building cleaner communities together through smart waste management,
                  gamification, and real-time tracking
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {user ? (
                  <Button asChild size="lg" className="text-lg px-8 py-6">
                    <Link to="/dashboard">
                      Go to Dashboard
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                ) : (
                  <>
                    <Button asChild size="lg" className="text-lg px-8 py-6">
                      <Link to="/auth">
                        Get Started
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="text-lg px-8 py-6">
                      <Link to="/auth">
                        Learn More
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-card/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Why Choose Waste Warrior?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our platform connects residents, workers, and administrators in a unified ecosystem
              for efficient waste management
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.1, duration: 0.8 }}
              >
                <Card className="h-full border-border/50 hover:border-primary/20 transition-colors">
                  <CardContent className="p-6 text-center space-y-4">
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${feature.color}`}>
                      <feature.icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="space-y-8"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Ready to Make a Difference?
            </h2>
            <p className="text-lg text-muted-foreground">
              Join thousands of residents, workers, and organizations already making
              their communities cleaner and greener
            </p>
            {!user && (
              <Button asChild size="lg" className="text-lg px-8 py-6">
                <Link to="/auth">
                  Join Waste Warrior Today
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            )}
          </motion.div>
        </div>
      </section>
    </div>
  );
};

const features = [
  {
    icon: Users,
    title: 'Community Driven',
    description: 'Connect residents, workers, and administrators in one platform for better coordination.',
    color: 'bg-primary/10 text-primary'
  },
  {
    icon: Award,
    title: 'Gamification',
    description: 'Earn green points for reporting waste and redeem rewards to encourage participation.',
    color: 'bg-warning/10 text-warning'
  },
  {
    icon: Leaf,
    title: 'Real-time tracking',
    description: 'Track waste collection progress and get real-time updates on report status.',
    color: 'bg-success/10 text-success'
  },
  {
    icon: Recycle,
    title: 'Eco-friendly',
    description: 'Promote sustainable practices and connect with local scrap dealers for recycling.',
    color: 'bg-info/10 text-info'
  }
];

export default Index;
