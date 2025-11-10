import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  Package, TrendingUp, DollarSign, MapPin, Phone, Clock, 
  CheckCircle, AlertCircle, User, FileText, Star, Edit,
  Recycle, Newspaper, Cpu, Zap, Award
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function ScrapDealerDashboard({ activeSection, onSectionChange }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [dealerProfile, setDealerProfile] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPickups: 0,
    completedToday: 0,
    totalEarnings: 0,
    pendingVerifications: 0,
    rating: 4.8,
  });

  const [editedRates, setEditedRates] = useState({
    plastic: '',
    paper: '',
    metal: '',
    glass: '',
    electronics: '',
  });
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);

  const materialIcons = {
    plastic: Recycle,
    paper: Newspaper,
    metal: Award,
    glass: Zap,
    electronics: Cpu,
  };

  useEffect(() => {
    fetchDealerData();
  }, [user]);

  useEffect(() => {
    if (dealerProfile) {
      fetchRequests();
      fetchStats();
    }
  }, [dealerProfile]);

  const fetchDealerData = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase

        .from('scrap_dealers')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      
      setDealerProfile(data);
      if (data?.rates) {
        setEditedRates({
          plastic: data.rates.plastic || '',
          paper: data.rates.paper || '',
          metal: data.rates.metal || '',
          glass: data.rates.glass || '',
          electronics: data.rates.electronics || '',
        });
      }
    } catch (error) {
      console.error('Error fetching dealer data:', error);
    }
  };

  const fetchRequests = async () => {
    if (!user || !dealerProfile) return;

    try {
      const { data, error } = await supabase
        .from('scrap_pickup_requests')
        .select('*')
        .or(`status.eq.pending,dealer_id.eq.${dealerProfile?.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!user || !dealerProfile) return;

    try {
      const today = new Date().toISOString().split('T')[0];

      const { data: allPickups } = await supabase
        .from('scrap_pickup_requests')
        .select('*')
        .eq('dealer_id', dealerProfile.id);

      const { data: todayPickups } = await supabase
        .from('scrap_pickup_requests')
        .select('*')
        .eq('dealer_id', dealerProfile.id)
        .eq('status', 'completed')
        .gte('completed_at', `${today}T00:00:00`);


      const { data: userCredits } = await supabase
        .from('users')
        .select('credits')
        .eq('id', user.id)
        .maybeSingle();

      const pendingCount = allPickups?.filter(p => p.status === 'accepted').length || 0;

      setStats({
        totalPickups: allPickups?.length || 0,
        completedToday: todayPickups?.length || 0,
        totalEarnings: userCredits?.credits || 0,
        pendingVerifications: pendingCount,
        rating: 4.8,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      const { error } = await supabase
        .from('scrap_pickup_requests')

        .update({
          status: 'accepted',
          dealer_id: dealerProfile.id,
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: t('common.success'),
        description: t('dealer.requestAccepted'),
      });

      fetchRequests();
      fetchStats();
    } catch (error) {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleCompletePickup = async (requestId) => {
    try {
      const { error } = await supabase
        .from('scrap_pickup_requests')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: t('common.success'),
        description: t('dealer.pickupCompleted'),
      });
      

      fetchRequests();
      fetchStats();
    } catch (error) {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleUpdateRate = async () => {
    if (!editingMaterial) return;

    try {
      const updatedRates = { ...editedRates };
      const { error } = await supabase
        .from('scrap_dealers')
        .update({ rates: updatedRates })
        .eq('id', dealerProfile.id);

      if (error) throw error;

      toast({
        title: t('common.success'),
        description: t('dealer.ratesUpdated'),
      });

      setEditModalOpen(false);
      setEditingMaterial(null);
      fetchDealerData();
    } catch (error) {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { variant: 'secondary', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      accepted: { variant: 'default', color: 'bg-blue-100 text-blue-800 border-blue-200' },
      in_progress: { variant: 'default', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
      completed: { variant: 'success', color: 'bg-green-100 text-green-800 border-green-200' },
      cancelled: { variant: 'destructive', color: 'bg-red-100 text-red-800 border-red-200' },
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <Badge className={`${config.color} border`}>
        {status}
      </Badge>
    );
  };

  // Dashboard Section
  const DashboardSection = () => (
    <motion.div
      key="dashboard"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Stats Grid */}
      <motion.div
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: {
              staggerChildren: 0.1,
            },
          },
        }}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {/* Total Pickups */}
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 20 },
            show: { opacity: 1, y: 0 },
          }}
          whileHover={{ scale: 1.02, y: -5 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Card className="bg-white shadow-lg border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-900">
                {t('dealer.totalPickups')}
              </CardTitle>
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <motion.div
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                className="text-3xl font-bold text-gray-900"
              >
                {stats.totalPickups}
              </motion.div>
              <p className="text-xs text-gray-600 mt-1">Total pickups handled</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Completed Today */}
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 20 },
            show: { opacity: 1, y: 0 },
          }}
          whileHover={{ scale: 1.02, y: -5 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Card className="bg-white shadow-lg border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-900">
                {t('dealer.completedToday')}
              </CardTitle>
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <motion.div
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
                className="text-3xl font-bold text-gray-900"
              >
                {stats.completedToday}
              </motion.div>
              <p className="text-xs text-gray-600 mt-1">Completed today</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Total Earnings */}
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 20 },
            show: { opacity: 1, y: 0 },
          }}
          whileHover={{ scale: 1.02, y: -5 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Card className="bg-white shadow-lg border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-900">
                {t('dealer.totalEarnings')}
              </CardTitle>
              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <motion.div
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.4 }}
                className="text-3xl font-bold text-gray-900"
              >
                {stats.totalEarnings}
              </motion.div>
              <p className="text-xs text-gray-600 mt-1">{t('dealer.credits')} earned</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Pending Verifications */}
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 20 },
            show: { opacity: 1, y: 0 },
          }}
          whileHover={{ scale: 1.02, y: -5 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Card className="bg-white shadow-lg border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-900">
                Pending Verifications
              </CardTitle>
              <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <motion.div
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.5 }}
                className="text-3xl font-bold text-gray-900"
              >
                {stats.pendingVerifications}
              </motion.div>
              <p className="text-xs text-gray-600 mt-1">Awaiting completion</p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Quick Stats Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="bg-white shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-gray-900">Quick Stats</CardTitle>
            <CardDescription className="text-gray-600">Your performance overview</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Verification Status</p>
                <div className="flex items-center gap-2 mt-1">
                  {dealerProfile?.is_verified ? (
                    <Badge className="bg-green-100 text-green-800 border-green-200 border">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {t('dealer.verified')}
                    </Badge>
                  ) : (
                    <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 border">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {t('dealer.pending')}
                    </Badge>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">My Rating</p>
                <div className="flex items-center gap-1 mt-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < Math.floor(stats.rating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                  <span className="text-sm font-bold text-gray-900 ml-1">{stats.rating}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );

  // Pickups Section
  const PickupsSection = () => (
    <motion.div
      key="pickups"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <Card className="bg-white shadow-lg border-0">
        <CardHeader>
          <CardTitle className="text-gray-900">{t('dealer.availableRequests')}</CardTitle>
          <CardDescription className="text-gray-600">{t('dealer.availablePickups')}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-gray-200 animate-pulse h-32 rounded-lg" />
              ))}
            </div>
          ) : requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600">{t('dealer.noRequests')}</p>
            </div>
          ) : (
            <motion.div
              variants={{
                hidden: { opacity: 0 },
                show: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.1,
                  },
                },
              }}
              initial="hidden"
              animate="show"
              className="space-y-4"
            >
              {requests.map((request, index) => (
                <motion.div
                  key={request.id}
                  variants={{
                    hidden: { opacity: 0, x: -20 },
                    show: { opacity: 1, x: 0 },
                  }}
                  whileHover={{ scale: 1.01, y: -2 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Card className="bg-white shadow-md border border-gray-100">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <CardTitle className="text-gray-900">{t('dealer.requestDetails')}</CardTitle>
                          <CardDescription className="text-gray-600">
                            {request.waste_type} - {request.waste_volume} {t('dealer.kg')}
                            {request.waste_volume > 50 && (
                              <Badge className="ml-2 bg-red-100 text-red-800 border-red-200 border">
                                {t('dealer.largeVolume')}
                              </Badge>
                            )}
                          </CardDescription>
                        </div>
                        {getStatusBadge(request.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-900">{t('dealer.resident')}</p>
                          <p className="text-sm text-gray-600">{request.resident_name}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-900">{t('dealer.contact')}</p>
                          <p className="text-sm text-gray-600">{request.contact_phone}</p>
                        </div>
                        <div className="space-y-1 col-span-2">
                          <p className="text-sm font-medium text-gray-900">{t('dealer.address')}</p>
                          <p className="text-sm text-gray-600">{request.address}</p>
                        </div>
                        {request.proposed_rate && (
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-gray-900">{t('dealer.proposedRate')}</p>
                            <p className="text-sm text-gray-600">₹{request.proposed_rate}/{t('dealer.kg')}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        {request.location_lat && request.location_lng && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-gray-900 border-gray-300"
                            onClick={() => window.open(`https://www.google.com/maps?q=${request.location_lat},${request.location_lng}`, '_blank')}
                          >
                            <MapPin className="h-4 w-4 mr-2" />
                            {t('dealer.viewOnMap')}
                          </Button>
                        )}
                        {request.status === 'pending' && (
                          <Button 
                            size="sm" 
                            className="bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90"
                            onClick={() => handleAcceptRequest(request.id)}
                          >
                            {t('dealer.acceptRequest')}
                          </Button>
                        )}
                        {request.status === 'accepted' && (
                          <Button 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleCompletePickup(request.id)}
                          >
                            {t('dealer.markComplete')}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );

  // Rates Section
  const RatesSection = () => (
    <motion.div
      key="rates"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Material Rate Cards Grid */}
      <motion.div
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: {
              staggerChildren: 0.1,
            },
          },
        }}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {Object.entries(editedRates).map(([material, rate], index) => {
          const Icon = materialIcons[material] || Package;
          const colors = [
            { bg: 'bg-blue-100', icon: 'text-blue-600', border: 'border-blue-200' },
            { bg: 'bg-green-100', icon: 'text-green-600', border: 'border-green-200' },
            { bg: 'bg-purple-100', icon: 'text-purple-600', border: 'border-purple-200' },
            { bg: 'bg-orange-100', icon: 'text-orange-600', border: 'border-orange-200' },
            { bg: 'bg-indigo-100', icon: 'text-indigo-600', border: 'border-indigo-200' },
          ];
          const colorScheme = colors[index % colors.length];

          return (
            <motion.div
              key={material}
              variants={{
                hidden: { opacity: 0, scale: 0.8 },
                show: { opacity: 1, scale: 1 },
              }}
              whileHover={{ scale: 1.05, y: -8 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Card className={`bg-white shadow-lg border-2 ${colorScheme.border}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className={`h-12 w-12 rounded-full ${colorScheme.bg} flex items-center justify-center`}>
                      <Icon className={`h-6 w-6 ${colorScheme.icon}`} />
                    </div>
                    <Dialog open={editModalOpen && editingMaterial === material} onOpenChange={(open) => {
                      setEditModalOpen(open);
                      if (!open) setEditingMaterial(null);
                    }}>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-600"
                          onClick={() => {
                            setEditingMaterial(material);
                            setEditModalOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-white">
                        <DialogHeader>
                          <DialogTitle className="text-gray-900">Edit Rate for {material}</DialogTitle>
                          <DialogDescription className="text-gray-600">
                            Update the price per kilogram for {material}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor={`edit-${material}`} className="text-gray-900">
                              Price per KG (₹)
                            </Label>
                            <Input
                              id={`edit-${material}`}
                              type="number"
                              value={editedRates[material]}
                              onChange={(e) =>
                                setEditedRates({ ...editedRates, [material]: e.target.value })
                              }
                              placeholder="0.00"
                              className="text-gray-900"
                            />
                          </div>
                          <Button 
                            onClick={handleUpdateRate} 
                            className="w-full bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90"
                          >
                            Save Changes
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <CardTitle className="text-gray-900 capitalize mt-4">{material}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">
                    ₹ {rate || '0'}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">per kilogram</p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Contact Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="bg-white shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-gray-900">{t('dealer.contactInfo')}</CardTitle>
            <CardDescription className="text-gray-600">Your business contact details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{t('dealer.workingHours')}</p>
                <p className="text-sm text-gray-600">{dealerProfile?.working_hours || '9:00 AM - 6:00 PM'}</p>
              </div>
            </div>
            <Separator />
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <Phone className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{t('dealer.contact')}</p>
                <p className="text-sm text-gray-600">{dealerProfile?.contact_phone || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );

  // Profile Section
  const ProfileSection = () => (
    <motion.div
      key="profile"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <Card className="bg-white shadow-lg border-0">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white text-2xl font-bold">
                {dealerProfile?.business_name?.charAt(0) || 'D'}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl text-gray-900">{dealerProfile?.business_name}</CardTitle>
              <CardDescription className="text-gray-600">
                {t('dealer.dealerId')}: {dealerProfile?.id?.slice(0, 8)}
              </CardDescription>
              <div className="flex items-center gap-2 mt-2">
                {dealerProfile?.is_verified ? (
                  <Badge className="bg-green-100 text-green-800 border-green-200 border">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {t('dealer.verified')}
                  </Badge>
                ) : (
                  <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 border">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {t('dealer.pending')}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Separator />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-gray-900">{t('dealer.licenseNumber')}</Label>
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                {dealerProfile?.license_number || 'Not provided'}
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-900">{t('dealer.serviceArea')}</Label>
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                {dealerProfile?.service_area || 'Not specified'}
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-900">{t('dealer.workingHours')}</Label>
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                {dealerProfile?.working_hours || '9:00 AM - 6:00 PM'}
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-900">{t('dealer.contact')}</Label>
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                {dealerProfile?.contact_phone || 'Not provided'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  // History Section
  const HistorySection = () => {
    const completedRequests = requests.filter((r) => r.status === 'completed');

    return (
      <motion.div
        key="history"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        <Card className="bg-white shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-gray-900">{t('dealer.history')}</CardTitle>
            <CardDescription className="text-gray-600">{t('dealer.completedPickups')}</CardDescription>
          </CardHeader>
          <CardContent>
            {completedRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600">{t('dealer.noHistory')}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-gray-900">{t('dealer.date')}</TableHead>
                      <TableHead className="text-gray-900">{t('dealer.resident')}</TableHead>
                      <TableHead className="text-gray-900">{t('dealer.wasteType')}</TableHead>
                      <TableHead className="text-gray-900">{t('dealer.volume')}</TableHead>
                      <TableHead className="text-gray-900">{t('dealer.creditsEarned')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {completedRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="text-gray-900">
                          {new Date(request.completed_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-gray-900">{request.resident_name}</TableCell>
                        <TableCell className="text-gray-900">{request.waste_type}</TableCell>
                        <TableCell className="text-gray-900">
                          {request.waste_volume} {t('dealer.kg')}
                        </TableCell>
                        <TableCell className="text-green-600 font-medium">
                          +{Math.floor(request.waste_volume * 5)} {t('dealer.credits')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  // Registration Form for new dealers
  const RegistrationForm = () => {
    const [formData, setFormData] = useState({
      business_name: '',
      license_number: '',
      service_area: '',
      contact_phone: '',
      working_hours: '9:00 AM - 6:00 PM',
    });

    const handleRegister = async (e) => {
      e.preventDefault();

      try {
        const { error } = await supabase.from('scrap_dealers').insert({
          user_id: user.id,
          ...formData,
        });

        if (error) throw error;

        toast({
          title: t('common.success'),
          description: t('dealer.registrationSuccess'),
        });

        fetchDealerData();
      } catch (error) {
        toast({
          title: t('common.error'),
          description: error.message,
          variant: 'destructive',
        });
      }
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto space-y-6"
      >
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">{t('dealer.registerAsDealer')}</h2>
          <p className="text-gray-600 mt-2">{t('dealer.completeRegistration')}</p>
        </div>

        <Card className="bg-white shadow-lg border-0">
          <CardContent className="pt-6">
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <Label htmlFor="business_name" className="text-gray-900">
                  {t('dealer.businessName')} *
                </Label>
                <Input
                  id="business_name"
                  required
                  value={formData.business_name}
                  onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                  className="text-gray-900"
                />
              </div>

              <div>
                <Label htmlFor="license_number" className="text-gray-900">
                  {t('dealer.licenseNumber')}
                </Label>
                <Input
                  id="license_number"
                  value={formData.license_number}
                  onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                  className="text-gray-900"
                />
              </div>

              <div>
                <Label htmlFor="service_area" className="text-gray-900">
                  {t('dealer.serviceArea')} *
                </Label>
                <Input
                  id="service_area"
                  required
                  value={formData.service_area}
                  onChange={(e) => setFormData({ ...formData, service_area: e.target.value })}
                  className="text-gray-900"
                />
              </div>

              <div>
                <Label htmlFor="contact_phone" className="text-gray-900">
                  {t('dealer.contactPhone')} *
                </Label>
                <Input
                  id="contact_phone"
                  required
                  type="tel"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                  className="text-gray-900"
                />
              </div>

              <div>
                <Label htmlFor="working_hours" className="text-gray-900">
                  {t('dealer.workingHours')}
                </Label>
                <Input
                  id="working_hours"
                  value={formData.working_hours}
                  onChange={(e) => setFormData({ ...formData, working_hours: e.target.value })}
                  className="text-gray-900"
                />
              </div>

              <Button type="submit" className="w-full bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90">
                {t('dealer.submitRegistration')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <DashboardSection />;
      case 'pickups':
        return <PickupsSection />;
      case 'rates':
        return <RatesSection />;
      case 'history':
        return <HistorySection />;
      case 'profile':
        return <ProfileSection />;
      default:
        return <DashboardSection />;
    }
  };

  // Show registration form if dealer profile doesn't exist
  if (!loading && !dealerProfile) {
    return <RegistrationForm />;
  }

  // Show loading skeleton
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="bg-white shadow-lg border-0">
              <CardContent className="p-6">
                <div className="bg-gray-200 animate-pulse h-20 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {renderSection()}
    </AnimatePresence>
  );
}
